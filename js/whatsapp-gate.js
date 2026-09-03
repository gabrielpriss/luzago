/**
 * Luzago Alimentos — Gate de qualificação do WhatsApp
 *
 * Todo destino de WhatsApp (botão flutuante, rodapé, links wa.me) deixa de abrir
 * o WhatsApp direto: abre este modal primeiro.
 *
 *   Etapa 1 — motivo do contato:
 *       • comprar/orçamento  → segue para o formulário
 *       • fornecedor         → desvia para /trabalhe-conosco/#fornecedor
 *       • currículo          → desvia para /trabalhe-conosco/#curriculo
 *
 *   Etapa 2 — formulário curto (mesmos campos do formulário comercial da página).
 *       O lead é gravado no MESMO destino do formulário da página
 *       (lead_type "comercial" → aba "Leads Comerciais"), com Origem = WhatsApp.
 *       Só depois de gravado o visitante é levado ao WhatsApp.
 *
 * Marque qualquer elemento com data-wa-gate para abrir o modal.
 * Links para wa.me / api.whatsapp.com são interceptados automaticamente.
 */
(function () {
    'use strict';

    var WA_PHONE = '554136687866';

    var CATEGORIAS = [
        ['temperos', 'Temperos e condimentos'],
        ['cereais', 'Cereais'],
        ['farinaceos', 'Farináceos'],
        ['frutas-secas', 'Frutas secas e castanhas'],
        ['conservas', 'Conservas'],
        ['food-service', 'Food Service'],
        ['refrescos', 'Refrescos e sobremesas']
    ];

    var root = null;
    var form = null;
    var lastTrigger = null;

    // ─── Montagem do modal ───────────────────────────────────────────────────

    function categoriaOptions() {
        return CATEGORIAS.map(function (c) {
            return '<option value="' + c[0] + '">' + c[1] + '</option>';
        }).join('');
    }

    function template() {
        return '' +
        '<div class="wa-gate__overlay" data-wa-close></div>' +
        '<div class="wa-gate__panel" role="dialog" aria-modal="true" aria-labelledby="wa-gate-title">' +
            '<button type="button" class="wa-gate__close" data-wa-close aria-label="Fechar">' +
                '<i class="fa-solid fa-xmark"></i>' +
            '</button>' +
            '<div class="wa-gate__header">' +
                '<i class="fa-brands fa-whatsapp"></i>' +
                '<div>' +
                    '<div class="wa-gate__title" id="wa-gate-title">Atendimento pelo WhatsApp</div>' +
                    '<div class="wa-gate__subtitle">Comercial Luzago Alimentos</div>' +
                '</div>' +
            '</div>' +
            '<div class="wa-gate__body">' +

                // Etapa 1 — motivo
                '<div class="wa-gate__step is-active" data-wa-step="motivo">' +
                    '<p class="wa-gate__lead">Para direcionar você ao setor certo, conte rapidamente o motivo do seu contato.</p>' +
                    '<div class="wa-gate__options">' +
                        '<button type="button" class="wa-gate__option" data-wa-motivo="comercial">' +
                            '<i class="fa-solid fa-cart-shopping"></i>' +
                            '<span>Quero comprar / pedir orçamento' +
                                '<small>Sou empresa e quero produtos no atacado</small>' +
                            '</span>' +
                        '</button>' +
                        '<button type="button" class="wa-gate__option" data-wa-motivo="fornecedor">' +
                            '<i class="fa-solid fa-handshake"></i>' +
                            '<span>Sou fornecedor' +
                                '<small>Quero oferecer produtos ou serviços à Luzago</small>' +
                            '</span>' +
                        '</button>' +
                        '<button type="button" class="wa-gate__option" data-wa-motivo="curriculo">' +
                            '<i class="fa-solid fa-briefcase"></i>' +
                            '<span>Quero enviar meu currículo' +
                                '<small>Vagas e oportunidades de trabalho</small>' +
                            '</span>' +
                        '</button>' +
                    '</div>' +
                    '<div class="wa-gate__note">' +
                        'FORNECEDORES E CANDIDATOS DEVEM ENTRAR EM CONTATO PELA PÁGINA DE ' +
                        '<a href="/trabalhe-conosco/">TRABALHE CONOSCO</a> — não pelo WhatsApp comercial.' +
                    '</div>' +
                '</div>' +

                // Etapa 2 — formulário comercial curto
                '<div class="wa-gate__step" data-wa-step="form">' +
                    '<button type="button" class="wa-gate__back" data-wa-back>' +
                        '<i class="fa-solid fa-arrow-left"></i> Voltar' +
                    '</button>' +
                    '<p class="wa-gate__lead">Preencha os dados abaixo e continue a conversa no WhatsApp com um consultor.</p>' +
                    '<form data-lead-form="comercial" data-suppress-success>' +
                        '<input type="hidden" name="origem" value="WhatsApp">' +
                        '<div class="wa-gate__grid">' +
                            '<div class="wa-gate__field">' +
                                '<label for="wa-gate-empresa">Nome da empresa <span>*</span></label>' +
                                '<input type="text" id="wa-gate-empresa" name="empresa" placeholder="Digite o nome da empresa" required>' +
                            '</div>' +
                            '<div class="wa-gate__field">' +
                                '<label for="wa-gate-categoria">Categoria de produtos</label>' +
                                '<select id="wa-gate-categoria" name="categoria">' +
                                    '<option value="" selected>Selecione</option>' +
                                    categoriaOptions() +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div class="wa-gate__grid">' +
                            '<div class="wa-gate__field">' +
                                '<label for="wa-gate-telefone">Telefone / WhatsApp <span>*</span></label>' +
                                '<input type="tel" id="wa-gate-telefone" name="telefone" placeholder="(41) 90000-0000" required>' +
                            '</div>' +
                            '<div class="wa-gate__field">' +
                                '<label for="wa-gate-email">E-mail <span>*</span></label>' +
                                '<input type="email" id="wa-gate-email" name="email" placeholder="Seu e-mail" required>' +
                            '</div>' +
                        '</div>' +
                        '<div class="wa-gate__field">' +
                            '<label for="wa-gate-produtos">Produtos desejados <span>*</span></label>' +
                            '<textarea id="wa-gate-produtos" name="produtos" rows="3" placeholder="Quais produtos você procura?" required></textarea>' +
                        '</div>' +
                        '<button type="submit" class="wa-gate__submit">' +
                            '<i class="fa-brands fa-whatsapp"></i> Continuar no WhatsApp' +
                        '</button>' +
                    '</form>' +
                    '<div class="wa-gate__note">' +
                        'Fornecedores e candidatos devem usar a página de ' +
                        '<a href="/trabalhe-conosco/">Trabalhe Conosco</a>.' +
                    '</div>' +
                '</div>' +

                // Desvio — fornecedor / currículo
                '<div class="wa-gate__step" data-wa-step="desvio">' +
                    '<button type="button" class="wa-gate__back" data-wa-back>' +
                        '<i class="fa-solid fa-arrow-left"></i> Voltar' +
                    '</button>' +
                    '<div class="wa-gate__redirect">' +
                        '<i class="fa-solid fa-circle-info"></i>' +
                        '<h3 data-wa-desvio-titulo></h3>' +
                        '<p data-wa-desvio-texto></p>' +
                        '<a class="wa-gate__cta" data-wa-desvio-link href="/trabalhe-conosco/">' +
                            '<i class="fa-solid fa-arrow-right"></i> <span data-wa-desvio-cta></span>' +
                        '</a>' +
                    '</div>' +
                '</div>' +

                // Sucesso — redirecionando para o WhatsApp
                '<div class="wa-gate__step" data-wa-step="sucesso">' +
                    '<div class="wa-gate__redirect">' +
                        '<i class="fa-brands fa-whatsapp" style="color:#25D366"></i>' +
                        '<h3>Recebemos seus dados!</h3>' +
                        '<p>Estamos abrindo o WhatsApp para você falar com um consultor. Se nada acontecer, use o botão abaixo.</p>' +
                        '<a class="wa-gate__cta wa-gate__cta--wa" data-wa-final href="#" target="_blank" rel="noopener">' +
                            '<i class="fa-brands fa-whatsapp"></i> Abrir o WhatsApp' +
                        '</a>' +
                    '</div>' +
                '</div>' +

            '</div>' +
        '</div>';
    }

    // ─── Navegação entre etapas ──────────────────────────────────────────────

    function showStep(name) {
        root.querySelectorAll('[data-wa-step]').forEach(function (step) {
            step.classList.toggle('is-active', step.getAttribute('data-wa-step') === name);
        });
        root.querySelector('.wa-gate__panel').scrollTop = 0;
    }

    function open(trigger) {
        lastTrigger = trigger || null;
        root.classList.add('is-open');
        document.body.classList.add('wa-gate-open');
        showStep('motivo');

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'whatsapp_gate_open',
            origem_botao: (trigger && trigger.getAttribute('data-wa-gate')) || 'whatsapp'
        });
    }

    function close() {
        root.classList.remove('is-open');
        document.body.classList.remove('wa-gate-open');
        var box = form.querySelector('[data-form-message]');
        if (box) box.hidden = true;
    }

    var DESVIOS = {
        fornecedor: {
            titulo: 'Fornecedores têm um canal próprio',
            texto: 'Para agilizar sua proposta, o cadastro de fornecedores é feito pela página Trabalhe Conosco. O WhatsApp comercial atende apenas clientes.',
            cta: 'Cadastrar como fornecedor',
            link: '/trabalhe-conosco/#fornecedor'
        },
        curriculo: {
            titulo: 'Currículos são recebidos pelo site',
            texto: 'Envie seu currículo pela página Trabalhe Conosco — assim ele chega direto ao nosso RH. O WhatsApp comercial não recebe currículos.',
            cta: 'Enviar meu currículo',
            link: '/trabalhe-conosco/#curriculo'
        }
    };

    function showDesvio(tipo) {
        var d = DESVIOS[tipo];
        root.querySelector('[data-wa-desvio-titulo]').textContent = d.titulo;
        root.querySelector('[data-wa-desvio-texto]').textContent = d.texto;
        root.querySelector('[data-wa-desvio-cta]').textContent = d.cta;
        root.querySelector('[data-wa-desvio-link]').setAttribute('href', d.link);
        showStep('desvio');

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'whatsapp_gate_desvio', desvio_tipo: tipo });
    }

    // ─── WhatsApp ────────────────────────────────────────────────────────────

    function waUrl(fields) {
        var linhas = ['Olá! Vim pelo site da Luzago Alimentos e gostaria de um orçamento.'];
        if (fields.empresa) linhas.push('Empresa: ' + fields.empresa);
        if (fields.categoria) {
            var label = fields.categoria;
            CATEGORIAS.forEach(function (c) { if (c[0] === fields.categoria) label = c[1]; });
            linhas.push('Categoria: ' + label);
        }
        if (fields.produtos) linhas.push('Produtos: ' + fields.produtos);
        return 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(linhas.join('\n'));
    }

    function goToWhatsApp(url, popup) {
        root.querySelector('[data-wa-final]').setAttribute('href', url);
        showStep('sucesso');

        if (popup && !popup.closed) {
            popup.location.href = url;
        } else {
            window.open(url, '_blank', 'noopener');
        }
    }

    // ─── Ligações ────────────────────────────────────────────────────────────

    function isWhatsAppLink(el) {
        var href = el.getAttribute && el.getAttribute('href');
        return !!href && /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/.test(href);
    }

    function bindTriggers() {
        document.addEventListener('click', function (e) {
            var el = e.target.closest ? e.target.closest('[data-wa-gate], a[href]') : null;
            if (!el) return;
            if (el.closest('[data-wa-root]')) return; // links dentro do próprio modal
            if (!el.hasAttribute('data-wa-gate') && !isWhatsAppLink(el)) return;
            e.preventDefault();
            open(el);
        });
    }

    function init() {
        root = document.createElement('div');
        root.className = 'wa-gate';
        root.setAttribute('data-wa-root', '');
        root.innerHTML = template();
        document.body.appendChild(root);

        form = root.querySelector('form[data-lead-form]');

        root.addEventListener('click', function (e) {
            if (e.target.closest('[data-wa-close]')) { close(); return; }
            var motivo = e.target.closest('[data-wa-motivo]');
            if (motivo) {
                var tipo = motivo.getAttribute('data-wa-motivo');
                if (tipo === 'comercial') {
                    showStep('form');
                    var first = form.querySelector('input[name="empresa"]');
                    if (first) setTimeout(function () { first.focus(); }, 60);
                } else {
                    showDesvio(tipo);
                }
                return;
            }
            if (e.target.closest('[data-wa-back]')) { showStep('motivo'); }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && root.classList.contains('is-open')) close();
        });

        // Abre uma aba em branco no clique (gesto do usuário) para não ser
        // bloqueada pelo navegador depois do envio assíncrono à planilha.
        var pendingWindow = null;
        form.addEventListener('submit', function () {
            if (form.checkValidity && !form.checkValidity()) return;
            pendingWindow = window.open('', '_blank');
        }, true);

        form.addEventListener('luzago:lead-success', function (e) {
            var fields = (e.detail && e.detail.fields) || {};
            goToWhatsApp(waUrl(fields), pendingWindow);
            pendingWindow = null;
            form.reset();
        });

        form.addEventListener('luzago:lead-error', function () {
            if (pendingWindow && !pendingWindow.closed) pendingWindow.close();
            pendingWindow = null;
        });

        if (window.LuzagoLeads && window.LuzagoLeads.bindForm) {
            window.LuzagoLeads.bindForm(form);
        }

        bindTriggers();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.LuzagoWhatsAppGate = { open: open, close: close };
})();
