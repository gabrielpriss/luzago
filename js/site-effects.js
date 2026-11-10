/**
 * Luzago Alimentos — AOS, lazy load fade-in e hovers dinâmicos
 */
(function () {
    'use strict';

    /* Grids com dezenas de itens: só fade-in (sem transform) para não gerar overflow */
    var AOS_FADE_IN_TARGETS = '.product-card, .blog-card, .review-card, .instagram-card, .gcard';
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
            /* O carrossel do hero não entra na animação: os slides e os
               controles precisam ficar visíveis desde a primeira pintura. */
            if (el.closest('.hero-carousel__slides') || el.closest('.hero-carousel__dots')) return;
            if (el.classList.contains('hero-carousel__slides') ||
                el.classList.contains('hero-carousel__veil') ||
                el.classList.contains('hero-carousel__dots')) return;
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


    /* ── Animações de entrada sem biblioteca externa ──
       O site marca os elementos com data-aos; se a lib AOS não estiver
       presente, revelamos os elementos com IntersectionObserver. */
    function initAosFallback() {
        if (typeof AOS !== 'undefined') return;

        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var alvos = document.querySelectorAll('[data-aos]');
        if (!alvos.length) return;

        if (reduced || !('IntersectionObserver' in window)) {
            alvos.forEach(function (el) { el.classList.add('aos-animate'); });
            return;
        }

        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (!e.isIntersecting) return;
                var el = e.target;
                var atraso = parseInt(el.getAttribute('data-aos-delay') || '0', 10);
                setTimeout(function () { el.classList.add('aos-animate'); }, atraso);
                obs.unobserve(el);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

        alvos.forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
                el.classList.add('aos-animate');
            } else {
                obs.observe(el);
            }
        });
    }

    /* ── Carrossel do hero ── */
    function initHeroCarousel() {
        var hero = document.querySelector('[data-hero-carousel]');
        if (!hero) return;

        var slides = hero.querySelectorAll('.hero-carousel__slide');
        var dots = hero.querySelectorAll('.hero-carousel__dot');
        if (slides.length < 2) return;

        var atual = 0;
        var timer = null;
        var INTERVALO = 6000;
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function mostrar(i) {
            atual = (i + slides.length) % slides.length;
            slides.forEach(function (s, n) { s.classList.toggle('is-active', n === atual); });
            dots.forEach(function (d, n) {
                d.classList.toggle('is-active', n === atual);
                d.setAttribute('aria-selected', n === atual ? 'true' : 'false');
            });
        }

        function tocar() {
            if (reduced) return;
            parar();
            timer = setInterval(function () { mostrar(atual + 1); }, INTERVALO);
        }

        function parar() { if (timer) { clearInterval(timer); timer = null; } }

        dots.forEach(function (d, n) {
            d.addEventListener('click', function () { mostrar(n); tocar(); });
        });

        hero.addEventListener('mouseenter', parar);
        hero.addEventListener('mouseleave', tocar);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) parar(); else tocar();
        });

        /* As imagens seguintes só entram depois da primeira pintura */
        requestAnimationFrame(function () {
            slides.forEach(function (s) {
                var url = s.getAttribute('data-bg');
                if (url && !s.style.backgroundImage) s.style.backgroundImage = 'url("' + url + '")';
            });
        });

        mostrar(0);
        tocar();
    }

    /* ── Carrossel das avaliações do Google ── */
    function initReviewsCarousel() {
        var bloco = document.querySelector('[data-greviews]');
        if (!bloco) return;

        var track = bloco.querySelector('.greviews__track');
        var prev = bloco.querySelector('.greviews__nav--prev');
        var next = bloco.querySelector('.greviews__nav--next');
        if (!track) return;

        function passo() {
            var card = track.querySelector('.gcard');
            return card ? card.offsetWidth + 18 : 320;
        }

        function atualizarSetas() {
            if (!prev || !next) return;
            var fim = track.scrollWidth - track.clientWidth - 4;
            prev.hidden = track.scrollLeft <= 4;
            next.hidden = track.scrollLeft >= fim;
        }

        if (prev) prev.addEventListener('click', function () { track.scrollLeft -= passo(); });
        if (next) next.addEventListener('click', function () { track.scrollLeft += passo(); });
        track.addEventListener('scroll', atualizarSetas, { passive: true });
        window.addEventListener('resize', atualizarSetas);
        atualizarSetas();

        /* Avatar que não carrega cai para a imagem padrão do site */
        bloco.querySelectorAll('.gcard__avatar').forEach(function (img) {
            img.addEventListener('error', function () {
                if (img.dataset.fallback) return;
                img.dataset.fallback = '1';
                img.src = '/assets/imagens/avatar-padrao-1.webp';
            });
        });

        /* "Leia mais" só aparece quando o texto realmente foi cortado */
        bloco.querySelectorAll('.gcard').forEach(function (card) {
            var texto = card.querySelector('.gcard__text');
            var botao = card.querySelector('.gcard__more');
            if (!texto || !botao) return;
            if (texto.scrollHeight <= texto.clientHeight + 2) {
                botao.hidden = true;
                return;
            }
            botao.addEventListener('click', function () {
                var aberto = card.classList.toggle('is-open');
                botao.textContent = aberto ? 'Mostrar menos' : 'Leia mais';
                atualizarSetas();
            });
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
        initAosFallback();
        initHeroCarousel();
        initReviewsCarousel();
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
