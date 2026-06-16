#!/usr/bin/env node
/**
 * Otimiza imagens do projeto Luzago:
 * - Redimensiona conforme contexto de uso
 * - Converte raster (jpg/png/gif) para WebP
 * - Atualiza referências em HTML, CSS e JS
 * - Garante alt em todas as tags <img>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const TEXT_EXT = new Set(['.html', '.js', '.css', '.json', '.py', '.gs', '.xml']);

const MAX_WIDTH = {
  hero: 1920,
  logo: 512,
  avatar: 256,
  product: 256,
  icon: 128,
  default: 1200,
};

function log(msg) {
  console.log('[images] ' + msg);
}

function walkFiles(dir, filterFn) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      out.push(...walkFiles(full, filterFn));
    } else if (!filterFn || filterFn(full)) {
      out.push(full);
    }
  }
  return out;
}

function posixRel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function getMaxWidth(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized.includes('/imagens/')) return MAX_WIDTH.hero;
  if (/logo-luzago|favicon/i.test(normalized)) return MAX_WIDTH.logo;
  if (/avatar|overlay|notificacao|icone-folha/i.test(normalized)) return MAX_WIDTH.avatar;
  if (normalized.includes('/icones/')) return MAX_WIDTH.icon;
  if (
    normalized.includes('/temperos/') ||
    normalized.includes('/cereais/') ||
    normalized.includes('/farinaceos/') ||
    normalized.includes('/frutas-secas-e-castanhas/') ||
    normalized.includes('/conservas/') ||
    normalized.includes('/food-service/') ||
    normalized.includes('/refrescos-e-sobremesas/')
  ) {
    return MAX_WIDTH.product;
  }
  return MAX_WIDTH.default;
}

function toWebpPath(relPath) {
  return relPath.replace(/\.(jpe?g|png|gif|webp)$/i, '.webp');
}

async function processRaster(filePath) {
  const rel = posixRel(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.webp') {
    const meta = await sharp(filePath).metadata();
    const maxW = getMaxWidth(rel);
    if (meta.width && meta.width > maxW) {
      const tmp = filePath + '.tmp';
      await sharp(filePath)
        .resize({ width: maxW, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(tmp);
      fs.renameSync(tmp, filePath);
      return { rel, action: 'resized-webp' };
    }
    return { rel, action: 'kept-webp' };
  }

  const webpRel = toWebpPath(rel);
  const webpAbs = path.join(ROOT, webpRel);
  const maxW = getMaxWidth(rel);

  await sharp(filePath)
    .resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(webpAbs);

  if (webpAbs !== filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { rel, webpRel, action: 'converted' };
}

function buildReplacementMap(results) {
  const map = new Map();
  results.forEach(function (r) {
    if (!r.webpRel) return;
    const variants = [
      '/' + r.rel,
      r.rel,
      '/' + r.webpRel,
      r.webpRel,
    ];
    const fromPaths = [
      '/' + r.rel,
      r.rel,
      r.rel.replace(/^\//, ''),
    ];
    fromPaths.forEach(function (from) {
      map.set(from, '/' + r.webpRel);
      map.set(from.replace(/^\//, ''), '/' + r.webpRel);
    });
  });
  return map;
}

function replaceReferences(map) {
  const files = walkFiles(ROOT, function (file) {
    if (file.includes(path.sep + 'node_modules' + path.sep)) return false;
    if (file.includes(path.sep + 'dist' + path.sep)) return false;
    if (path.basename(file) === 'optimize-images.js') return false;
    return TEXT_EXT.has(path.extname(file).toLowerCase());
  });

  const sortedKeys = Array.from(map.keys()).sort(function (a, b) {
    return b.length - a.length;
  });

  let updatedFiles = 0;
  files.forEach(function (file) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    sortedKeys.forEach(function (key) {
      if (content.includes(key)) {
        content = content.split(key).join(map.get(key));
      }
    });
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      updatedFiles += 1;
      log('refs: ' + posixRel(file));
    }
  });
  return updatedFiles;
}

function ensureImgAltAttributes() {
  const htmlFiles = walkFiles(ROOT, function (file) {
    return file.endsWith('.html') && !file.includes(path.sep + 'dist' + path.sep);
  });

  let fixed = 0;
  htmlFiles.forEach(function (file) {
    let html = fs.readFileSync(file, 'utf8');
    const updated = html.replace(/<img\b([^>]*)>/gi, function (full, attrs) {
      if (/\salt\s*=/i.test(attrs)) return full;
      const srcMatch = attrs.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      const fallback = path
        .basename(src, path.extname(src))
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        });
      fixed += 1;
      return '<img' + attrs + ' alt="' + fallback + '">';
    });
    if (updated !== html) {
      fs.writeFileSync(file, updated, 'utf8');
      log('alt: ' + posixRel(file));
    }
  });
  return fixed;
}

function verify() {
  const rasterLeft = walkFiles(ASSETS, function (file) {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
  });

  const htmlFiles = walkFiles(ROOT, function (file) {
    return file.endsWith('.html') && !file.includes(path.sep + 'dist' + path.sep);
  });

  const noAlt = [];
  htmlFiles.forEach(function (file) {
    const html = fs.readFileSync(file, 'utf8');
    const tags = html.match(/<img\b[^>]*>/gi) || [];
    tags.forEach(function (tag) {
      if (!/\salt\s*=/i.test(tag)) noAlt.push(posixRel(file));
    });
  });

  const badRefs = [];
  walkFiles(ROOT, function (file) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) return false;
    if (file.includes(path.sep + 'dist' + path.sep)) return false;
    if (file.includes(path.sep + 'node_modules' + path.sep)) return false;
    return true;
  }).forEach(function (file) {
    const text = fs.readFileSync(file, 'utf8');
    const matches = text.match(/\/assets\/[^"')\s]+\.(?:jpe?g|png|gif)/gi) || [];
    matches.forEach(function (m) {
      badRefs.push(posixRel(file) + ': ' + m);
    });
  });

  log('verificação — raster legado restante: ' + rasterLeft.length);
  log('verificação — <img> sem alt: ' + noAlt.length);
  log('verificação — refs não-webp: ' + badRefs.length);

  if (rasterLeft.length || noAlt.length || badRefs.length) {
    rasterLeft.slice(0, 5).forEach(function (f) {
      log('  raster: ' + posixRel(f));
    });
    badRefs.slice(0, 5).forEach(function (r) {
      log('  ref: ' + r);
    });
    throw new Error('Verificação de imagens falhou.');
  }
}

async function main() {
  const rasterFiles = walkFiles(ASSETS, function (file) {
    return RASTER_EXT.has(path.extname(file).toLowerCase());
  });

  log('processando ' + rasterFiles.length + ' arquivos raster…');
  const results = [];
  for (const file of rasterFiles) {
    results.push(await processRaster(file));
  }

  const converted = results.filter(function (r) {
    return r.action === 'converted';
  }).length;
  const resized = results.filter(function (r) {
    return r.action === 'resized-webp';
  }).length;
  log(converted + ' convertidos, ' + resized + ' webp redimensionados');

  const map = buildReplacementMap(results);
  const refFiles = replaceReferences(map);
  log(refFiles + ' arquivos com referências atualizadas');

  const altFixed = ensureImgAltAttributes();
  if (altFixed) log(altFixed + ' tags <img> receberam alt');

  verify();
  log('concluído — todas as imagens raster em WebP, redimensionadas e referenciadas');
}

main().catch(function (err) {
  console.error('[images] ERRO:', err.message);
  process.exit(1);
});
