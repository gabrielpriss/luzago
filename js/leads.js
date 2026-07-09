/**
 * Luzago Alimentos — captura de leads → Google Sheets (via Apps Script)
 *
 * Configure SHEETS_WEB_APP_URL na Vercel (ou .env + npm run build).
 * O script do Google está em google-apps-script.gs na raiz do projeto.
 *
 * Tipos (data-lead-form):
 *   comercial  → Leads Comerciais
 *   curriculo  → Curriculos (+ arquivo no Drive)
 *   fornecedor → Fornecedores
 */
(function () {
    'use strict';

    var RUNTIME = window.LUZAGO_RUNTIME || {};
    var SHEETS_WEB_APP_URL = RUNTIME.sheetsWebAppUrl || '';
    var WEBHOOK_SECRET = RUNTIME.sheetsWebhookSecret || '';
    var MAX_FILE_BYTES = 5 * 1024 * 1024;

    // Único dado de origem que rastreamos: o termo de pesquisa do Google Ads.
    // Ele chega pela URL via ValueTrack {keyword} (parâmetro utm_term).
    // Guardamos em localStorage para que o termo persista mesmo que o usuário
    // navegue para outra página antes de enviar o formulário.
    var TERM_STORAGE_KEY = 'luzago_termo_pesquisa';

    function captureSearchTerm() {
        var params = new URLSearchParams(window.location.search);
        var term = (params.get('utm_term') || params.get('keyword') || '').trim();

        if (term) {
            try { localStorage.setItem(TERM_STORAGE_KEY, term); } catch (e) {}
            return term;
        }

        try {
            return localStorage.getItem(TERM_STORAGE_KEY) || '';
        } catch (e) {
            return '';
        }
    }

    function formToObject(form) {
        var data = {};
        var formData = new FormData(form);
        formData.forEach(function (value, key) {
            if (value instanceof File) return;
            if (data[key]) {
                if (!Array.isArray(data[key])) data[key] = [data[key]];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        return data;
    }

    function readFileField(form) {
        var input = form.querySelector('input[type="file"]');
        if (!input || !input.files || !input.files[0]) {
            return Promise.resolve(null);
        }

        var file = input.files[0];
        if (file.size > MAX_FILE_BYTES) {
            return Promise.reject(new Error('Arquivo muito grande. Máximo 5 MB.'));
        }

        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                var parts = String(reader.result).split(',');
                resolve({
                    name: file.name,
                    mimeType: file.type || 'application/octet-stream',
                    base64: parts[1] || ''
                });
            };
            reader.onerror = function () { reject(new Error('Não foi possível ler o arquivo.')); };
            reader.readAsDataURL(file);
        });
    }

    function showMessage(form, type, text) {
        var box = form.querySelector('[data-form-message]');
        if (!box) {
            box = document.createElement('div');
            box.setAttribute('data-form-message', '');
            box.className = 'rounded px-4 py-3 text-sm mt-4';
            form.appendChild(box);
        }
        box.className = 'rounded px-4 py-3 text-sm mt-4 ' +
            (type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200');
        box.textContent = text;
        box.hidden = false;
    }

    function setLoading(form, loading) {
        var btn = form.querySelector('[type="submit"]');
        if (!btn) return;
        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Enviando...';
        } else {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || 'Enviar';
        }
    }

    // Envia o evento ao dataLayer SOMENTE após o envio ser confirmado com sucesso.
    // Todos os formulários emitem 'lead_form_submit', mas a conversão do Google Ads
    // no GTM é filtrada por lead_type = 'comercial' (só o lead comercial converte;
    // currículo e fornecedor não contam como conversão).
    function pushConversionEvent(leadType, termo) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'lead_form_submit',
            lead_type: leadType,
            termo_pesquisa: termo || ''
        });
    }

    async function submitLead(form) {
        var leadType = form.getAttribute('data-lead-form');
        var termo = captureSearchTerm();
        var fields = formToObject(form);
        var arquivo = await readFileField(form);

        if (arquivo) {
            fields._arquivo = arquivo;
        }

        var payload = {
            lead_type: leadType,
            termo_pesquisa: termo,
            fields: fields,
            submitted_at: new Date().toISOString()
        };

        if (WEBHOOK_SECRET) {
            payload.secret = WEBHOOK_SECRET;
        }

        if (!SHEETS_WEB_APP_URL) {
            console.info('[Luzago Leads] SHEETS_WEB_APP_URL não configurada. Payload:', payload);
            showMessage(form, 'success', 'Recebemos seu contato! Em breve nossa equipe retornará.');
            form.reset();
            return;
        }

        // text/plain evita preflight; CORS permite confirmar resposta do Apps Script
        var response = await fetch(SHEETS_WEB_APP_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        var resultText = await response.text();
        var result = null;
        try {
            result = JSON.parse(resultText);
        } catch (parseErr) {
            result = null;
        }

        if (!response.ok || (result && result.ok === false)) {
            throw new Error((result && result.error) || 'Falha ao registrar o lead na planilha.');
        }

        // Envio confirmado → registra a conversão no Google Ads (via GTM)
        pushConversionEvent(leadType, termo);

        showMessage(form, 'success', 'Recebemos seu contato! Em breve nossa equipe retornará.');
        form.reset();

        var fileLabel = form.querySelector('[data-file-label]');
        if (fileLabel) {
            var labelEl = document.getElementById(fileLabel.getAttribute('data-file-label'));
            if (labelEl) {
                labelEl.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><span>Clique para enviar seu currículo</span>';
            }
        }
    }

    function initFileLabels() {
        document.querySelectorAll('input[type="file"][data-file-label]').forEach(function (input) {
            var labelId = input.getAttribute('data-file-label');
            var label = document.getElementById(labelId);
            if (!label) return;
            input.addEventListener('change', function () {
                if (input.files && input.files[0]) {
                    label.innerHTML = '<i class="fa-solid fa-file-lines"></i><span>' + input.files[0].name + '</span>';
                }
            });
        });
    }

    function initForms() {
        captureSearchTerm();

        document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                setLoading(form, true);
                submitLead(form)
                    .catch(function (err) {
                        var msg = (err && err.message) ? err.message : 'Não foi possível enviar agora. Tente novamente ou ligue (41) 3668-7866.';
                        showMessage(form, 'error', msg);
                    })
                    .finally(function () {
                        setLoading(form, false);
                    });
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initForms();
        initFileLabels();
    });
})();
