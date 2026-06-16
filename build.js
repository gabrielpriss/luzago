#!/usr/bin/env node
/**
 * Build de produção — Luzago Alimentos
 * Gera dist/ pronta para deploy estático (Cloudflare Pages, etc.)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const sharp = require('sharp');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://luzagoalimentos.com.br').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = SITE_URL + '/assets/icones/logo-luzago.webp';
const ROUTES = require('./scripts/prepare-deploy-routes.json');

const cleanCss = new CleanCSS({ level: 2 });

const THIRD_PARTY_PRECONNECT = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>',
  '<link rel="preconnect" href="https://unpkg.com" crossorigin>',
  '<link rel="preconnect" href="https://www.googletagmanager.com">',
  '<link rel="dns-prefetch" href="https://www.googletagmanager.com">',
];

const GTM_HEAD_PATTERN = /<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/;
const GTM_BODY_PATTERN = /<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/;
const TAILWIND_CDN_PATTERN = /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<script>[\s\S]*?<\/script>\s*/;
const INLINE_STYLE_PATTERN = /<style>([\s\S]*?)<\/style>\s*/g;

function log(step, message) {
  console.log('[build] ' + step + ': ' + message);
}

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkFiles(dir, filterFn) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, filterFn));
    } else if (!filterFn || filterFn(full)) {
      results.push(full);
    }
  }
  return results;
}

function minifyCssContent(content) {
  return cleanCss.minify(content).styles;
}

async function minifyJsFile(content, filename) {
  const result = await minifyJs(content, {
    compress: { passes: 2 },
    mangle: true,
    format: { comments: false },
  });
  if (result.error) {
    throw new Error('Erro ao minificar ' + filename + ': ' + result.error.message);
  }
  return result.code;
}

function discoverHtmlFiles() {
  return walkFiles(ROOT, function (file) {
    if (!file.endsWith('.html')) return false;
    const rel = path.relative(ROOT, file);
    if (rel.startsWith('dist' + path.sep) || rel.startsWith('node_modules' + path.sep)) return false;
    return true;
  });
}

function routeToCanonical(relHtmlPath) {
  const normalized = relHtmlPath.split(path.sep).join('/');
  if (normalized === 'index.html') return SITE_URL + '/';
  const dir = path.posix.dirname(normalized);
  return SITE_URL + '/' + dir + '/';
}

function extractMeta(html) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Luzago Alimentos';
  const description = descMatch ? descMatch[1].trim() : 'Distribuidora de alimentos para o mercado atacadista.';
  return { title, description };
}

function extractOgImage(html) {
  const heroMatch = html.match(/url\(['"]?(\/assets\/imagens\/[^'")\s]+)['"]?\)/i);
  if (heroMatch) return SITE_URL + heroMatch[1];
  const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (imgMatch) return imgMatch[1];
  return DEFAULT_OG_IMAGE;
}

function escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function injectSeo(html, canonicalUrl, meta, ogImage) {
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/i, '');
  }

  const seoBlock = [
    '<link rel="canonical" href="' + canonicalUrl + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="pt_BR">',
    '<meta property="og:site_name" content="Luzago Alimentos">',
    '<meta property="og:title" content="' + escapeAttr(meta.title) + '">',
    '<meta property="og:description" content="' + escapeAttr(meta.description) + '">',
    '<meta property="og:url" content="' + canonicalUrl + '">',
    '<meta property="og:image" content="' + ogImage + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeAttr(meta.title) + '">',
    '<meta name="twitter:description" content="' + escapeAttr(meta.description) + '">',
    '<meta name="twitter:image" content="' + ogImage + '">',
  ].join('\n    ');

  return html.replace(
    /(<meta\s+name="description"[^>]*>)/i,
    '$1\n    ' + seoBlock
  );
}

function injectPreconnect(html) {
  let updated = html;
  THIRD_PARTY_PRECONNECT.forEach(function (tag) {
    if (!updated.includes(tag)) {
      updated = updated.replace('<head>', '<head>\n    ' + tag);
    }
  });
  return updated;
}

function rewriteAssetPaths(content) {
  return content
    .replace(/\/css\//g, '/css/')
    .replace(/\/js\//g, '/js/')
    .replace(/\/assets\//g, '/assets/');
}

function replaceTailwindCdn(html) {
  if (!TAILWIND_CDN_PATTERN.test(html)) return html;
  return html.replace(
    TAILWIND_CDN_PATTERN,
    '<link rel="stylesheet" href="/css/tailwind.css">\n    '
  );
}

function extractInlineStyles(htmlFiles) {
  const styles = new Set();
  htmlFiles.forEach(function (file) {
    const html = fs.readFileSync(file, 'utf8');
    let match;
    const pattern = new RegExp(INLINE_STYLE_PATTERN.source, 'g');
    while ((match = pattern.exec(html)) !== null) {
      styles.add(match[1].trim());
    }
  });
  return Array.from(styles).join('\n\n');
}

function stripInlineStyles(html) {
  return html.replace(INLINE_STYLE_PATTERN, '');
}

function ensurePagesCssLink(html) {
  if (html.includes('/css/pages.css')) return html;
  return html.replace(
    '<link rel="stylesheet" href="/css/tailwind.css">',
    '<link rel="stylesheet" href="/css/tailwind.css">\n    <link rel="stylesheet" href="/css/pages.css">'
  );
}

function auditImages(html, relPath) {
  const warnings = [];
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  imgTags.forEach(function (tag) {
    if (!/\salt=/.test(tag)) {
      warnings.push(relPath + ': <img> sem alt');
    }
  });
  return warnings;
}

async function buildTailwind() {
  const inputPath = path.join(ROOT, 'css', 'tailwind.input.css');
  const input = fs.readFileSync(inputPath, 'utf8');
  const result = await postcss([tailwindcss(path.join(ROOT, 'tailwind.config.js')), autoprefixer]).process(
    input,
    { from: inputPath, to: path.join(DIST, 'css', 'tailwind.css') }
  );
  const minified = minifyCssContent(result.css);
  fs.writeFileSync(path.join(DIST, 'css', 'tailwind.css'), minified, 'utf8');
  log('css', 'tailwind.css purgado (' + (minified.length / 1024).toFixed(1) + ' KB)');
}

async function writeRuntimeConfig() {
  const defaultUrl =
    'https://script.google.com/macros/s/AKfycbzkTCsLoXQ56r7Xle84tUrpP3PmRsFHlnxx8YRNxPDNRUSb401Rh1uZLva9TFE2bvig/exec';
  const sourceConfig = path.join(ROOT, 'js', 'runtime-config.js');
  let sheetsUrl = process.env.SHEETS_WEB_APP_URL || '';
  if (!sheetsUrl && fs.existsSync(sourceConfig)) {
    const match = fs.readFileSync(sourceConfig, 'utf8').match(/"sheetsWebAppUrl"\s*:\s*"([^"]+)"/);
    sheetsUrl = match ? match[1] : defaultUrl;
  }
  if (!sheetsUrl) sheetsUrl = defaultUrl;

  const content =
    'window.LUZAGO_RUNTIME=' +
    JSON.stringify({
      sheetsWebAppUrl: sheetsUrl,
      sheetsWebhookSecret: process.env.SHEETS_WEBHOOK_SECRET || '',
    }) +
    ';';

  fs.writeFileSync(
    path.join(DIST, 'js', 'runtime-config.js'),
    await minifyJsFile(content, 'runtime-config.js'),
    'utf8'
  );
}

function writeSitemapAndRobots() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.map(function (route) {
    const loc = route === '/' ? SITE_URL + '/' : SITE_URL + route;
    const priority = route === '/' ? '1.0' : route.startsWith('/blog/') && route !== '/blog/' ? '0.6' : '0.8';
    const changefreq = route.startsWith('/blog/') ? 'monthly' : 'weekly';
    return (
      '  <url>\n' +
      '    <loc>' + loc + '</loc>\n' +
      '    <lastmod>' + today + '</lastmod>\n' +
      '    <changefreq>' + changefreq + '</changefreq>\n' +
      '    <priority>' + priority + '</priority>\n' +
      '  </url>'
    );
  }).join('\n');

  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls +
    '\n</urlset>\n';

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n',
    'utf8'
  );
}

async function optimizeImage(srcPath, destPath) {
  const ext = path.extname(srcPath).toLowerCase();

  ensureDir(path.dirname(destPath));

  if (ext === '.svg') {
    fs.copyFileSync(srcPath, destPath);
    return;
  }

  if (ext === '.webp') {
    await sharp(srcPath).webp({ quality: 82, effort: 4 }).toFile(destPath);
    return;
  }

  throw new Error('Formato raster não suportado no build (use npm run images): ' + srcPath);
}

async function processAssets() {
  const srcRoot = path.join(ROOT, 'assets');
  const destRoot = path.join(DIST, 'assets');
  const files = walkFiles(srcRoot);

  for (const file of files) {
    const rel = path.relative(srcRoot, file);
    const dest = path.join(destRoot, rel);
    await optimizeImage(file, dest);
  }

  log('assets', files.length + ' arquivos copiados/otimizados (WebP + SVG)');
}

async function processCss() {
  const srcCssDir = path.join(ROOT, 'css');
  const cssFiles = fs.readdirSync(srcCssDir).filter(function (f) {
    return f.endsWith('.css') && f !== 'tailwind.input.css';
  });

  cssFiles.forEach(function (file) {
    let content = fs.readFileSync(path.join(srcCssDir, file), 'utf8');
    content = minifyCssContent(content);
    fs.writeFileSync(path.join(DIST, 'css', file), content, 'utf8');
  });

  log('css', cssFiles.length + ' arquivos minificados (+ tailwind.css)');
}

async function processJs() {
  const jsDir = path.join(ROOT, 'js');
  const files = fs.readdirSync(jsDir).filter(function (f) {
    return f.endsWith('.js') && f !== 'runtime-config.js';
  });

  for (const file of files) {
    const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
    fs.writeFileSync(path.join(DIST, 'js', file), await minifyJsFile(content, file), 'utf8');
  }

  await writeRuntimeConfig();
  log('js', files.length + 1 + ' arquivos minificados');
}

function copyDeployMeta() {
  ['_redirects', '_headers'].forEach(function (file) {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST, file));
    }
  });
}

async function processHtml(htmlFiles, pagesCss) {
  const gtmFragments = [];
  const imageWarnings = [];

  for (const srcFile of htmlFiles) {
    const rel = path.relative(ROOT, srcFile);
    let html = fs.readFileSync(srcFile, 'utf8');

    const gtmHead = html.match(GTM_HEAD_PATTERN);
    const gtmBody = html.match(GTM_BODY_PATTERN);
    if (gtmHead) gtmFragments.push(gtmHead[0]);
    if (gtmBody) gtmFragments.push(gtmBody[0]);

    html = replaceTailwindCdn(html);
    html = stripInlineStyles(html);
    html = ensurePagesCssLink(html);
    html = injectPreconnect(html);

    const meta = extractMeta(html);
    const canonical = routeToCanonical(rel);
    const ogImage = extractOgImage(html);
    html = injectSeo(html, canonical, meta, ogImage);
    html = rewriteAssetPaths(html);

    imageWarnings.push(...auditImages(html, rel));

    const minified = await minifyHtml(html, {
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: false,
      keepClosingSlash: true,
      ignoreCustomFragments: [
        /<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/,
        /<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/,
      ],
    });

    const dest = path.join(DIST, rel);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, minified, 'utf8');
  }

  if (pagesCss) {
    fs.writeFileSync(path.join(DIST, 'css', 'pages.css'), minifyCssContent(pagesCss), 'utf8');
  }

  if (imageWarnings.length) {
    throw new Error(imageWarnings.length + ' imagens sem atributo alt no HTML de origem.');
  }

  const gtmOk = gtmFragments.every(function (frag) {
    return frag.includes('GTM-KP9TKWZD') && frag.includes('googletagmanager.com');
  });
  if (!gtmOk) throw new Error('GTM comprometido durante o build.');

  log('html', htmlFiles.length + ' páginas minificadas');
}

function verifyCriticalScripts() {
  const checks = [
    { file: 'js/leads.js', patterns: ['utm_source', 'luzago_lead_source', 'data-lead-form', 'sheetsWebAppUrl', 'text/plain'] },
    { file: 'js/runtime-config.js', patterns: ['LUZAGO_RUNTIME', 'sheetsWebAppUrl'] },
    { file: 'js/mobile-menu.js', patterns: ['mobile-menu', 'aria-expanded'] },
    { file: 'js/catalog.js', patterns: ['LUZAGO_CATALOG', 'catalog-grid', 'data-filter'] },
  ];

  checks.forEach(function (check) {
    const content = fs.readFileSync(path.join(DIST, check.file), 'utf8');
    check.patterns.forEach(function (pattern) {
      if (!content.includes(pattern)) {
        throw new Error('Verificação falhou: ' + check.file + ' perdeu "' + pattern + '"');
      }
    });
  });

  const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  ['GTM-KP9TKWZD', 'rel="canonical"', 'og:title', 'twitter:card', '/css/tailwind.css'].forEach(function (token) {
    if (!indexHtml.includes(token)) {
      throw new Error('index.html ausente: ' + token);
    }
  });

  log('verify', 'scripts críticos e SEO validados');
}

async function main() {
  loadDotEnv();
  log('start', 'SITE_URL=' + SITE_URL);

  rimraf(DIST);
  ensureDir(path.join(DIST, 'css'));
  ensureDir(path.join(DIST, 'js'));
  ensureDir(path.join(DIST, 'assets'));

  const htmlFiles = discoverHtmlFiles();
  const pagesCssRaw = extractInlineStyles(htmlFiles);

  await buildTailwind();
  await processAssets();
  await processCss();
  await processJs();
  writeSitemapAndRobots();
  copyDeployMeta();
  await processHtml(htmlFiles, pagesCssRaw);
  verifyCriticalScripts();

  const distSize = execSync('du -sh "' + DIST + '"', { encoding: 'utf8' }).trim().split('\t')[0];
  log('done', 'dist/ pronta (' + distSize + ') — deploy direto na hospedagem');
}

main().catch(function (err) {
  console.error('[build] ERRO:', err.message);
  process.exit(1);
});
