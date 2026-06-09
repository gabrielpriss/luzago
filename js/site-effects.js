/**
 * Luzago Alimentos — AOS, lazy load fade-in e hovers dinâmicos
 */
(function () {
    'use strict';

    /* Grids com dezenas de itens: só fade-in (sem transform) para não gerar overflow */
    var AOS_FADE_IN_TARGETS = '.product-card, .blog-card, .review-card, .instagram-card';
    /* Poucos itens por página */
    var AOS_FADE_UP_TARGETS = '.product-item';
    var HERO_SELECTOR = 'section[class*="hero"] > .container > *, section[class*="hero"] > div > *:not(.mobile-menu *)';

    function initLazyImages() {
        document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
            if (!img.classList.contains('img-lazy')) {
                img.classList.add('img-lazy');
            }
            function markLoaded() {
                img.classList.add('is-loaded');
            }
            if (img.complete && img.naturalWidth > 0) {
                markLoaded();
            } else {
                img.addEventListener('load', markLoaded, { once: true });
                img.addEventListener('error', markLoaded, { once: true });
            }
        });
    }

    function wrapProductImages() {
        document.querySelectorAll('.product-item img, .catalog-item img').forEach(function (img) {
            var wrap = img.parentElement;
            if (wrap && !wrap.classList.contains('product-item__img-wrap')) {
                wrap.classList.add('product-item__img-wrap');
            }
        });
    }

    function enhanceInstagramCards() {
        document.querySelectorAll('section a[href*="instagram.com"]').forEach(function (link) {
            if (link.querySelector('img')) {
                link.classList.add('instagram-card');
            }
        });
    }

    function enhanceReviewCards() {
        document.querySelectorAll('section h2').forEach(function (h2) {
            if (h2.textContent.indexOf('Avalia') === -1) return;
            var section = h2.closest('section');
            if (!section) return;
            section.querySelectorAll('.bg-white.rounded-lg.shadow').forEach(function (card) {
                card.classList.add('review-card');
            });
        });
    }

    function enhanceSocialIcons() {
        document.querySelectorAll('a[aria-label*="Luzago"]').forEach(function (link) {
            if (link.classList.contains('w-8') && link.classList.contains('h-8')) {
                link.classList.add('social-icon');
            }
        });
    }

    function enhanceNavLinks() {
        document.querySelectorAll('header nav a:not(.btn)').forEach(function (link) {
            link.classList.add('nav-link');
        });
    }

    function enhanceCarousel() {
        document.querySelectorAll('#empresa-carousel-track').forEach(function (track) {
            var shell = track.parentElement;
            if (shell) shell.classList.add('carousel-shell');
        });
    }

    function setAos(el, type, delay) {
        if (el.hasAttribute('data-aos')) return;
        el.setAttribute('data-aos', type);
        if (delay) el.setAttribute('data-aos-delay', String(delay));
    }

    function applyAosAttributes() {
        document.querySelectorAll(AOS_FADE_IN_TARGETS).forEach(function (el, i) {
            setAos(el, 'fade-in', Math.min((i % 6) * 50, 250));
        });

        document.querySelectorAll(AOS_FADE_UP_TARGETS).forEach(function (el, i) {
            if (el.closest('#catalog-grid')) return;
            setAos(el, 'fade-up', Math.min((i % 6) * 40, 200));
        });

        document.querySelectorAll('section h1, section h2').forEach(function (el, i) {
            setAos(el, 'fade-up', Math.min(i * 30, 150));
        });

        document.querySelectorAll(HERO_SELECTOR).forEach(function (el, i) {
            if (el.closest('header') || el.closest('.mobile-menu')) return;
            setAos(el, 'fade-up', i * 60);
        });
    }

    function initAos() {
        if (typeof AOS === 'undefined') return;
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        AOS.init({
            duration: 600,
            easing: 'ease-out-cubic',
            once: true,
            offset: 24,
            delay: 0,
            disable: reduced,
            anchorPlacement: 'top-bottom',
            startEvent: 'DOMContentLoaded'
        });
    }

    function boot() {
        wrapProductImages();
        enhanceInstagramCards();
        enhanceReviewCards();
        enhanceSocialIcons();
        enhanceNavLinks();
        enhanceCarousel();
        applyAosAttributes();
        initLazyImages();
        initAos();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.LuzagoEffects = {
        refresh: function () {
            wrapProductImages();
            applyAosAttributes();
            initLazyImages();
            if (typeof AOS !== 'undefined') {
                if (typeof AOS.refreshHard === 'function') AOS.refreshHard();
                else AOS.refresh();
            }
        }
    };
})();
