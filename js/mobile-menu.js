/**
 * Luzago Alimentos — menu hamburger lateral (mobile)
 */
(function () {
    'use strict';

    var MENU_ID = 'luzago-mobile-menu';

    var NAV_ITEMS = [
        { href: '/empresa/', label: 'Empresa', match: /^\/empresa\/?/ },
        { href: '/blog/', label: 'Blog', match: /^\/blog\/?/ },
        { href: '/trabalhe-conosco/#curriculo', label: 'Trabalhe Conosco', match: /^\/trabalhe-conosco\/?/ },
        { href: '/trabalhe-conosco/#fornecedor', label: 'Seja fornecedor', match: /^\/trabalhe-conosco\/?/ }
    ];

    var PRODUCTS = [
        { href: '/temperos-e-condimentos/', label: 'Temperos e Condimentos' },
        { href: '/cereais/', label: 'Cereais' },
        { href: '/farinaceos/', label: 'Farináceos' },
        { href: '/frutas-secas-e-castanhas/', label: 'Frutas Secas e Castanhas' },
        { href: '/conservas/', label: 'Conservas' },
        { href: '/food-service/', label: 'Food Service' },
        { href: '/refrescos-e-sobremesas/', label: 'Refrescos e Sobremesas' },
        { href: '/catalogo/', label: 'Ver catálogo completo', highlight: true }
    ];

    var PRODUCT_PATHS = PRODUCTS.map(function (p) { return p.href.replace(/\/$/, ''); });

    function isActive(href) {
        var path = window.location.pathname.replace(/\/$/, '') || '/';
        var target = href.split('#')[0].replace(/\/$/, '') || '/';
        if (target === '/' && path === '/') return true;
        if (target !== '/' && path.indexOf(target) === 0) return true;
        return false;
    }

    function isProductPage() {
        var path = window.location.pathname.replace(/\/$/, '');
        return PRODUCT_PATHS.some(function (p) {
            return p !== '/catalogo' && path.indexOf(p) === 0;
        });
    }

    function buildMenuHtml() {
        var links = NAV_ITEMS.map(function (item) {
            var cls = isActive(item.href) ? ' mobile-menu__link is-active' : ' mobile-menu__link';
            return '<a href="' + item.href + '" class="' + cls.trim() + '">' + item.label + '</a>';
        }).join('');

        var sub = PRODUCTS.map(function (p) {
            var cls = [];
            if (p.highlight) cls.push('mobile-menu__sub--highlight');
            if (isActive(p.href)) cls.push('is-active');
            return '<li><a href="' + p.href + '" class="' + cls.join(' ') + '">' + p.label + '</a></li>';
        }).join('');

        var productsOpen = isProductPage() ? ' is-open' : '';
        var expanded = isProductPage() ? 'true' : 'false';

        return (
            '<div id="' + MENU_ID + '" class="mobile-menu" aria-hidden="true">' +
                '<div class="mobile-menu__overlay" data-mobile-menu-close></div>' +
                '<aside id="mobile-menu-panel" class="mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Menu de navegação" tabindex="-1">' +
                    '<div class="mobile-menu__header">' +
                        '<a href="/"><img src="/assets/icones/logo-luzago.png" alt="Luzago Alimentos"></a>' +
                        '<button type="button" class="mobile-menu__close" data-mobile-menu-close aria-label="Fechar menu">' +
                            '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
                        '</button>' +
                    '</div>' +
                    '<div class="mobile-menu__body">' +
                        links +
                        '<button type="button" class="mobile-menu__accordion-btn" data-mobile-accordion aria-expanded="' + expanded + '">' +
                            'Produtos <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>' +
                        '</button>' +
                        '<ul class="mobile-menu__sub' + productsOpen + '" data-mobile-submenu>' + sub + '</ul>' +
                    '</div>' +
                    '<div class="mobile-menu__actions">' +
                        '<a href="/catalogo/" class="btn btn--secondary btn--sm">Catálogo</a>' +
                        '<a href="/contato/" class="btn btn--primary btn--sm">Solicite orçamento</a>' +
                    '</div>' +
                    '<div class="mobile-menu__footer">' +
                        '<a href="tel:+554136687866" class="mobile-menu__phone"><i class="fa-solid fa-phone"></i> (41) 3668-7866</a>' +
                        '<div class="mobile-menu__social">' +
                            '<a href="https://www.facebook.com/luzagoalimentos/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>' +
                            '<a href="https://www.linkedin.com/company/luzagoalimentos/" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>' +
                            '<a href="https://www.instagram.com/luzagoalimentos/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>' +
                        '</div>' +
                    '</div>' +
                '</aside>' +
            '</div>'
        );
    }

    function getElements() {
        return {
            menu: document.getElementById(MENU_ID),
            toggle: document.querySelector('.mobile-menu-toggle'),
            panel: document.getElementById('mobile-menu-panel'),
            submenu: document.querySelector('[data-mobile-submenu]'),
            accordion: document.querySelector('[data-mobile-accordion]')
        };
    }

    var scrollY = 0;

    function lockScroll() {
        scrollY = window.scrollY;
        document.documentElement.classList.add('mobile-menu-open');
        document.body.classList.add('mobile-menu-open');
        document.body.style.top = '-' + scrollY + 'px';
    }

    function unlockScroll() {
        document.documentElement.classList.remove('mobile-menu-open');
        document.body.classList.remove('mobile-menu-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
    }

    function openMenu() {
        var el = getElements();
        if (!el.menu || !el.toggle) return;
        el.menu.classList.add('is-open');
        el.menu.setAttribute('aria-hidden', 'false');
        el.toggle.setAttribute('aria-expanded', 'true');
        lockScroll();
        if (el.panel) {
            el.panel.style.visibility = 'visible';
            el.panel.focus();
        }
    }

    function closeMenu() {
        var el = getElements();
        if (!el.menu || !el.toggle) return;
        el.menu.classList.remove('is-open');
        el.menu.setAttribute('aria-hidden', 'true');
        el.toggle.setAttribute('aria-expanded', 'false');
        unlockScroll();
        if (el.panel) el.panel.style.visibility = '';
        el.toggle.focus();
    }

    function toggleAccordion() {
        var el = getElements();
        if (!el.submenu || !el.accordion) return;
        var open = el.submenu.classList.toggle('is-open');
        el.accordion.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function bindEvents() {
        var el = getElements();
        if (!el.toggle || !el.menu) return;

        el.toggle.addEventListener('click', function () {
            if (el.menu.classList.contains('is-open')) closeMenu();
            else openMenu();
        });

        el.menu.querySelectorAll('[data-mobile-menu-close]').forEach(function (btn) {
            btn.addEventListener('click', closeMenu);
        });

        el.menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });

        if (el.accordion) {
            el.accordion.addEventListener('click', toggleAccordion);
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && el.menu.classList.contains('is-open')) closeMenu();
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth >= 768) closeMenu();
        });
    }

    function init() {
        if (document.getElementById(MENU_ID)) return;
        document.body.insertAdjacentHTML('beforeend', buildMenuHtml());
        bindEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
