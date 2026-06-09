/**
 * Links e mensagens de redes sociais — Luzago Alimentos
 */
(function () {
    'use strict';

    var SOCIAL = {
        facebook: 'https://www.facebook.com/luzagoalimentos/',
        linkedin: 'https://www.linkedin.com/company/luzagoalimentos/',
        instagram: 'https://www.instagram.com/luzagoalimentos/'
    };

    var WA_PHONE = '554136687866';

    var WA_MESSAGES = {
        geral: 'Olá! Vim pelo site da Luzago Alimentos e gostaria de mais informações.',
        orcamento: 'Olá! Gostaria de solicitar um orçamento comercial.',
        urgencia: 'Olá! Preciso de um orçamento comercial com urgência.',
        empresa: 'Olá! Gostaria de conhecer melhor a Luzago Alimentos e saber como vocês podem atender minha empresa.',
        trabalhe: 'Olá! Tenho dúvidas sobre envio de currículo ou cadastro de fornecedor.',
        consultor: 'Olá! Tenho interesse em produtos da categoria {categoria} e gostaria de falar com um consultor.'
    };

    function waUrl(key, extra) {
        var msg = WA_MESSAGES[key] || WA_MESSAGES.geral;
        if (extra && extra.categoria) {
            msg = msg.replace('{categoria}', extra.categoria);
        }
        return 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(msg);
    }

    window.LuzagoSocial = {
        urls: SOCIAL,
        wa: waUrl,
        messages: WA_MESSAGES
    };
})();
