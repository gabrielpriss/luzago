#!/usr/bin/env node
/**
 * Build de deploy para Cloudflare Pages:
 * - Gera js/runtime-config.js a partir das variáveis de ambiente
 * - Gera sitemap.xml e robots.txt
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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

loadDotEnv();

const DEFAULT_SHEETS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzkTCsLoXQ56r7Xle84tUrpP3PmRsFHlnxx8YRNxPDNRUSb401Rh1uZLva9TFE2bvig/exec';

function readExistingSheetsUrl() {
  const configPath = path.join(ROOT, 'js', 'runtime-config.js');
  if (!fs.existsSync(configPath)) return '';
  const match = fs.readFileSync(configPath, 'utf8').match(/"sheetsWebAppUrl"\s*:\s*"([^"]+)"/);
  return match && match[1] ? match[1] : '';
}

const ROUTES = [
  '/',
  '/empresa/',
  '/contato/',
  '/catalogo/',
  '/trabalhe-conosco/',
  '/temperos-e-condimentos/',
  '/cereais/',
  '/farinaceos/',
  '/frutas-secas-e-castanhas/',
  '/conservas/',
  '/food-service/',
  '/refrescos-e-sobremesas/',
  '/blog/',
  '/blog/como-escolher-temperos-food-service/',
  '/blog/tendencias-cereais-integrais-atacado/',
  '/blog/conservas-artesanais-cardapio-restaurante/',
  '/blog/logistica-distribuicao-alimentos-atacado/',
  '/blog/frutas-secas-castanhas-revenda/',
];

function resolveSiteUrl() {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '');
  }
  if (process.env.CF_PAGES_URL) {
    return process.env.CF_PAGES_URL.replace(/\/$/, '');
  }
  return 'https://www.luzagoalimentos.com.br';
}

function writeRuntimeConfig() {
  const sheetsUrl =
    process.env.SHEETS_WEB_APP_URL ||
    readExistingSheetsUrl() ||
    DEFAULT_SHEETS_WEB_APP_URL;
  const webhookSecret = process.env.SHEETS_WEBHOOK_SECRET || '';
  const content =
    'window.LUZAGO_RUNTIME = ' +
    JSON.stringify({
      sheetsWebAppUrl: sheetsUrl,
      sheetsWebhookSecret: webhookSecret,
    }, null, 2) +
    ';\n';

  fs.writeFileSync(path.join(ROOT, 'js', 'runtime-config.js'), content, 'utf8');
  console.log('[build] js/runtime-config.js gerado' + (sheetsUrl ? '' : ' (SHEETS_WEB_APP_URL vazio)'));
}

function writeSitemap(siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.map(function (route) {
    const loc = route === '/' ? siteUrl + '/' : siteUrl + route;
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

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls +
    '\n</urlset>\n';

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log('[build] sitemap.xml gerado (' + ROUTES.length + ' URLs, base: ' + siteUrl + ')');
}

function writeRobots(siteUrl) {
  const content =
    'User-agent: *\n' +
    'Allow: /\n' +
    '\n' +
    'Sitemap: ' + siteUrl + '/sitemap.xml\n';

  fs.writeFileSync(path.join(ROOT, 'robots.txt'), content, 'utf8');
  console.log('[build] robots.txt gerado');
}

function main() {
  const siteUrl = resolveSiteUrl();
  writeRuntimeConfig();
  writeSitemap(siteUrl);
  writeRobots(siteUrl);
  console.log('[build] Deploy pronto para Cloudflare Pages.');
}

main();
