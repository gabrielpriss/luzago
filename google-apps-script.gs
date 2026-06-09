/**
 * ============================================================================
 * Luzago Alimentos — Leads do site → Google Sheets
 * ============================================================================
 *
 * PASSO A PASSO
 * -------------
 * 1. Crie uma planilha em https://sheets.google.com (ex.: "Leads Luzago")
 * 2. Na planilha: Extensões → Apps Script
 * 3. Apague o código padrão e cole ESTE arquivo inteiro
 * 4. Ajuste as constantes em CONFIG abaixo (principalmente SPREADSHEET_ID)
 * 5. Salve o projeto (Ctrl+S)
 * 6. No menu do editor: Executar → função "setupSheets" (autorize na 1ª vez)
 *    → Isso cria as 3 abas com cabeçalhos automaticamente
 * 7. Implantar → Nova implantação → Tipo: App da Web
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa
 * 8. Copie a URL do Web App (termina em /exec)
 * 9. Cole a URL na Vercel: variável SHEETS_WEB_APP_URL
 *    (ou em .env local e rode: npm run build)
 *
 * FORMULÁRIOS DO SITE (data-lead-form)
 * ------------------------------------
 *   comercial  → aba "Leads Comerciais"   (home + contato)
 *   curriculo  → aba "Curriculos"         (trabalhe-conosco)
 *   fornecedor → aba "Fornecedores"       (trabalhe-conosco)
 */

var CONFIG = {
  /** ID da planilha (URL: .../d/ESTE_ID/edit). Deixe vazio se o script estiver VINCULADO à planilha. */
  SPREADSHEET_ID: '1wVL2NNSrK_17g4JMZbgnJx1RWUvfXMT7MCBLC7cInJ8',

  /** Pasta no Drive para currículos. Deixe vazio para criar "Luzago Currículos" automaticamente. */
  DRIVE_FOLDER_ID: '',

  /** Opcional: mesma chave em SHEETS_WEBHOOK_SECRET na Vercel (camada extra de segurança). */
  WEBHOOK_SECRET: '',

  SHEETS: {
    comercial: 'Leads Comerciais',
    curriculo: 'Currículos',
    fornecedor: 'Fornecedores'
  },

  /** Nomes alternativos das abas (caso tenham sido criadas manualmente) */
  SHEET_ALIASES: {
    comercial: ['Leads Comerciais', 'Leads comerciais'],
    curriculo: ['Currículos', 'Curriculos', 'Curriculo', 'Curriculum'],
    fornecedor: ['Fornecedores', 'Fornecedor']
  },

  HEADERS: {
    comercial: [
      'Data/Hora', 'Empresa', 'E-mail', 'Telefone', 'Categoria', 'Produtos/Mensagem',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content',
      'Página', 'Referrer', 'GCLID'
    ],
    curriculo: [
      'Data/Hora', 'Nome', 'E-mail', 'Telefone', 'Arquivo (link)', 'Nome do arquivo',
      'UTM Source', 'UTM Campaign', 'Página', 'Referrer', 'GCLID'
    ],
    fornecedor: [
      'Data/Hora', 'Nome', 'E-mail', 'Telefone', 'Mensagem',
      'UTM Source', 'UTM Campaign', 'Página', 'Referrer', 'GCLID'
    ]
  }
};

// ─── Ponto de entrada do Web App ─────────────────────────────────────────────

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (!raw) {
      return jsonResponse({ ok: false, error: 'Corpo da requisição vazio' });
    }

    var data = JSON.parse(raw);

    if (CONFIG.WEBHOOK_SECRET) {
      if (!data.secret || data.secret !== CONFIG.WEBHOOK_SECRET) {
        return jsonResponse({ ok: false, error: 'Não autorizado' });
      }
    }

    var leadType = data.lead_type || 'comercial';
    var sheet = getSheetForLeadType(leadType);
    var sheetName = sheet.getName();

    ensureHeaders(sheet, CONFIG.HEADERS[leadType] || CONFIG.HEADERS.comercial);

    var fields = data.fields || {};
    var source = data.source || {};
    var row = buildRow(leadType, data.submitted_at, fields, source);

    sheet.appendRow(row);

    return jsonResponse({ ok: true, sheet: sheetName });
  } catch (err) {
    Logger.log('doPost erro: ' + err.message + '\n' + err.stack);
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.ping === '1') {
    try {
      var ss = getSpreadsheet();
      var names = ss.getSheets().map(function (s) { return s.getName(); });
      return jsonResponse({
        ok: true,
        spreadsheet: ss.getName(),
        spreadsheet_id: ss.getId(),
        sheets: names
      });
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message });
    }
  }

  return ContentService
    .createTextOutput('Luzago Leads API ativa — use POST com JSON.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ─── Configuração da planilha (rodar 1x manualmente) ───────────────────────

function setupSheets() {
  var ss = getSpreadsheet();
  var types = ['comercial', 'curriculo', 'fornecedor'];

  types.forEach(function (type) {
    var sheet = getSheetForLeadType(type);
    ensureHeaders(sheet, CONFIG.HEADERS[type]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONFIG.HEADERS[type].length)
      .setFontWeight('bold')
      .setBackground('#0f4c2c')
      .setFontColor('#ffffff');
    sheet.autoResizeColumns(1, CONFIG.HEADERS[type].length);
  });

  // Remove aba padrão "Página1" se estiver vazia e existirem outras abas
  var defaultSheet = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 3 && defaultSheet.getLastRow() <= 1) {
    try { ss.deleteSheet(defaultSheet); } catch (ignore) {}
  }

  SpreadsheetApp.getUi().alert('Planilha configurada: 3 abas de leads prontas.');
}

/** Menu na planilha: Luzago → Configurar abas de leads */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Luzago')
    .addItem('Configurar abas de leads', 'setupSheets')
    .addItem('Testar gravação (lead comercial)', 'testWriteComercial')
    .addToUi();
}

/** Rode manualmente para validar permissões e gravação na planilha */
function testWriteComercial() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        lead_type: 'comercial',
        submitted_at: new Date().toISOString(),
        source: { page: '/teste-manual', utm_source: 'apps-script' },
        fields: {
          empresa: 'Teste manual Apps Script',
          email: 'teste@luzago.com.br',
          telefone: '(41) 3668-7866',
          categoria: 'temperos',
          produtos: 'Lead de teste — pode apagar esta linha'
        }
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log(result.getContent());
  SpreadsheetApp.getUi().alert('Teste enviado! Verifique a aba "Leads Comerciais".');
}

// ─── Montagem das linhas ───────────────────────────────────────────────────

function buildRow(leadType, submittedAt, fields, source) {
  var when = submittedAt ? new Date(submittedAt) : new Date();

  if (leadType === 'curriculo') {
    var fileInfo = fields._arquivo || {};
    var fileUrl = '';
    var fileName = fileInfo.name || '';

    if (fileInfo.base64 && fileInfo.name) {
      fileUrl = saveCurriculoFile(fileInfo.name, fileInfo.mimeType || 'application/pdf', fileInfo.base64);
    }

    return [
      when,
      fields.nome || '',
      fields.email || '',
      fields.telefone || '',
      fileUrl,
      fileName,
      source.utm_source || '',
      source.utm_campaign || '',
      source.page || '',
      source.referrer || '',
      source.gclid || ''
    ];
  }

  if (leadType === 'fornecedor') {
    return [
      when,
      fields.nome || '',
      fields.email || '',
      fields.telefone || '',
      fields.mensagem || '',
      source.utm_source || '',
      source.utm_campaign || '',
      source.page || '',
      source.referrer || '',
      source.gclid || ''
    ];
  }

  // comercial (padrão)
  return [
    when,
    fields.empresa || fields.nome || '',
    fields.email || '',
    fields.telefone || '',
    fields.categoria || '',
    fields.produtos || fields.mensagem || '',
    source.utm_source || '',
    source.utm_medium || '',
    source.utm_campaign || '',
    source.utm_term || '',
    source.utm_content || '',
    source.page || '',
    source.referrer || '',
    source.gclid || ''
  ];
}

// ─── Currículos no Google Drive ────────────────────────────────────────────

function saveCurriculoFile(name, mimeType, base64) {
  var folder = getCurriculosFolder();
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, name);
  var file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // Sem link público — URL ainda funciona para quem tem acesso à conta
  }
  return file.getUrl();
}

function getCurriculosFolder() {
  if (CONFIG.DRIVE_FOLDER_ID) {
    return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  }
  var folders = DriveApp.getFoldersByName('Luzago Currículos');
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder('Luzago Currículos');
}

// ─── Utilitários ───────────────────────────────────────────────────────────

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Defina CONFIG.SPREADSHEET_ID ou vincule este script à planilha.');
  }
  return ss;
}

function getSheetForLeadType(leadType) {
  var ss = getSpreadsheet();
  var aliases = CONFIG.SHEET_ALIASES[leadType] || CONFIG.SHEET_ALIASES.comercial;
  var canonical = CONFIG.SHEETS[leadType] || CONFIG.SHEETS.comercial;
  var i;
  var sheet;

  for (i = 0; i < aliases.length; i++) {
    sheet = ss.getSheetByName(aliases[i]);
    if (sheet) return sheet;
  }

  sheet = ss.getSheetByName(canonical);
  if (!sheet) {
    sheet = ss.insertSheet(canonical);
  }
  return sheet;
}

function ensureHeaders(sheet, headers) {
  var firstCell = sheet.getRange(1, 1).getValue();
  var first = (firstCell || '').toString().trim();

  if (first === '' || first !== headers[0]) {
    if (sheet.getLastRow() > 0 && first !== '' && first !== headers[0]) {
      sheet.insertRowBefore(1);
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0f4c2c')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
