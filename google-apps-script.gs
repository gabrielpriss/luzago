/**
 * ============================================================================
 * Luzago Alimentos — Leads do site → Google Sheets
 * ============================================================================
 *
 * O QUE MUDOU (importante)
 * ------------------------
 * - A gravação agora é feita POR NOME DE COLUNA (cabeçalho), não por posição
 *   fixa. Assim você pode ter colunas manuais de CRM (Vendedor, Situação,
 *   Observações, etc.) em qualquer ordem que os leads caem sempre na coluna
 *   certa e as colunas manuais NUNCA são sobrescritas.
 * - Só rastreamos UM dado de origem: o TERMO DE PESQUISA do Google Ads.
 *   Ele chega do site no campo "termo_pesquisa" e é gravado na coluna cujo
 *   cabeçalho contenha "Term"/"Termo"/"Pesquisa" (ex.: "UTM Term").
 *   Se essa coluna não existir na aba, o script a cria automaticamente.
 *
 * PASSO A PASSO
 * -------------
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. Apague o código atual e cole ESTE arquivo inteiro
 * 3. Confirme CONFIG.SPREADSHEET_ID abaixo
 * 4. Salve (Ctrl+S)
 * 5. Implantar → Gerenciar implantações → edite a implantação existente →
 *    Nova versão → Implantar  (mantém a MESMA URL /exec já usada pelo site)
 *
 * FORMULÁRIOS DO SITE (data-lead-form)
 * ------------------------------------
 *   comercial  → aba "Leads Comerciais"   (home + contato + gate do WhatsApp)
 *   curriculo  → aba "Currículos"          (trabalhe-conosco)
 *   fornecedor → aba "Fornecedores"        (trabalhe-conosco)
 *
 * COLUNA "ORIGEM"
 * ---------------
 * Os leads passaram a informar de onde vieram no campo "origem":
 *   "Formulário" → formulário da página (home / contato / trabalhe-conosco)
 *   "WhatsApp"   → formulário que abre ao clicar em qualquer botão de WhatsApp
 * A coluna "Origem" é criada automaticamente na aba caso ainda não exista.
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

  /** Cabeçalhos usados APENAS quando a aba ainda não tem cabeçalho (setup inicial). */
  HEADERS: {
    comercial: ['Data/Hora', 'Empresa', 'E-mail', 'Telefone', 'Categoria', 'Produtos/Mensagem', 'Origem', 'UTM Term'],
    curriculo: ['Data/Hora', 'Nome', 'E-mail', 'Telefone', 'Arquivo (link)', 'Nome do arquivo', 'Origem', 'UTM Term'],
    fornecedor: ['Data/Hora', 'Nome', 'E-mail', 'Telefone', 'Mensagem', 'Origem', 'UTM Term']
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

    // Se a aba estiver sem cabeçalho, cria um padrão para este tipo de lead.
    if (isSheetEmpty(sheet)) {
      ensureHeaders(sheet, CONFIG.HEADERS[leadType] || CONFIG.HEADERS.comercial);
    }

    var fields = data.fields || {};
    // termo_pesquisa é o formato novo; source.utm_term mantém compatibilidade com envios antigos.
    var termo = data.termo_pesquisa || (data.source && data.source.utm_term) || '';

    appendLead(sheet, leadType, data.submitted_at, fields, termo);

    return jsonResponse({ ok: true, sheet: sheet.getName() });
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

// ─── Gravação por nome de coluna ─────────────────────────────────────────────

/** Verdadeiro para cabeçalhos que representam o termo de pesquisa. */
function isTermHeader(header) {
  return /term|termo|pesquisa|keyword|palavra-?chave/i.test((header || '').toString());
}

/** Verdadeiro para cabeçalhos que representam a origem do lead. */
function isOriginHeader(header) {
  return /^\s*(origem|origin|fonte|canal)\s*$/i.test((header || '').toString());
}

/** Acrescenta um cabeçalho ao final da aba se nenhuma coluna casar com matchFn. */
function ensureColumn(sheet, matchFn, headerName) {
  var lastCol = sheet.getLastColumn() || 1;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var lastNonEmpty = 0;

  for (var i = 0; i < headers.length; i++) {
    if ((headers[i] || '').toString().trim() !== '') lastNonEmpty = i + 1;
    if (matchFn(headers[i])) return; // a coluna já existe
  }

  sheet.getRange(1, lastNonEmpty + 1)
    .setValue(headerName)
    .setFontWeight('bold')
    .setBackground('#0f4c2c')
    .setFontColor('#ffffff');
}

/** Garante que exista uma coluna de termo de pesquisa; se faltar, cria "UTM Term". */
function ensureTermColumn(sheet) {
  ensureColumn(sheet, isTermHeader, 'UTM Term');
}

/** Garante que exista uma coluna de origem do lead; se faltar, cria "Origem". */
function ensureOriginColumn(sheet) {
  ensureColumn(sheet, isOriginHeader, 'Origem');
}

/**
 * Monta a linha alinhada aos cabeçalhos existentes e acrescenta ao final.
 * Colunas conhecidas recebem o valor; colunas manuais/CRM ficam em branco.
 */
function appendLead(sheet, leadType, submittedAt, fields, termo) {
  var when = submittedAt ? new Date(submittedAt) : new Date();

  var fileUrl = '';
  var fileName = '';
  if (leadType === 'curriculo') {
    var fileInfo = fields._arquivo || {};
    fileName = fileInfo.name || '';
    if (fileInfo.base64 && fileInfo.name) {
      fileUrl = saveCurriculoFile(fileInfo.name, fileInfo.mimeType || 'application/pdf', fileInfo.base64);
    }
  }

  ensureTermColumn(sheet);
  ensureOriginColumn(sheet);

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var valueByHeader = {
    'data/hora': when,
    'empresa': fields.empresa || fields.nome || '',
    'nome': fields.nome || fields.empresa || '',
    'e-mail': fields.email || '',
    'email': fields.email || '',
    'telefone': fields.telefone || '',
    'categoria': fields.categoria || '',
    'produtos/mensagem': fields.produtos || fields.mensagem || '',
    'produtos': fields.produtos || fields.mensagem || '',
    'mensagem': fields.mensagem || fields.produtos || '',
    'arquivo (link)': fileUrl,
    'nome do arquivo': fileName,
    'origem': fields.origem || 'Formulário'
  };

  var row = headers.map(function (h) {
    var key = (h || '').toString().trim();
    if (isTermHeader(key)) return termo || '';
    if (isOriginHeader(key)) return fields.origem || 'Formulário';
    var lower = key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(valueByHeader, lower)) return valueByHeader[lower];
    return ''; // colunas manuais (Vendedor, Situação, Observações, etc.) não são tocadas
  });

  sheet.appendRow(row);
}

// ─── Configuração da planilha (rodar 1x manualmente) ───────────────────────

function setupSheets() {
  var ss = getSpreadsheet();
  var types = ['comercial', 'curriculo', 'fornecedor'];

  types.forEach(function (type) {
    var sheet = getSheetForLeadType(type);
    if (isSheetEmpty(sheet)) {
      ensureHeaders(sheet, CONFIG.HEADERS[type]);
    } else {
      ensureTermColumn(sheet);   // aba já existe: apenas garante as colunas novas
      ensureOriginColumn(sheet);
    }
    sheet.setFrozenRows(1);
  });

  SpreadsheetApp.getUi().alert('Planilha configurada: colunas de termo de pesquisa e de origem garantidas em todas as abas.');
}

/** Menu na planilha: Luzago → ... */
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
        termo_pesquisa: 'arroz integral atacado',
        fields: {
          empresa: 'Teste manual Apps Script',
          email: 'teste@luzago.com.br',
          telefone: '(41) 3668-7866',
          categoria: 'cereais',
          origem: 'WhatsApp',
          produtos: 'Lead de teste — pode apagar esta linha'
        }
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log(result.getContent());
  SpreadsheetApp.getUi().alert('Teste enviado! Verifique a aba "Leads Comerciais" (coluna do termo de pesquisa).');
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

function isSheetEmpty(sheet) {
  return (sheet.getRange(1, 1).getValue() || '').toString().trim() === '';
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
