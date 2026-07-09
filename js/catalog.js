(function () {
    'use strict';

    var data = window.LUZAGO_CATALOG;
    if (!data) return;

    var grid = document.getElementById('catalog-grid');
    var filters = document.getElementById('catalog-filters');
    var searchInput = document.getElementById('catalog-search');
    var countEl = document.getElementById('catalog-count');
    var emptyEl = document.getElementById('catalog-empty');

    var activeCategory = 'all';
    var searchTerm = '';

    function normalize(text) {
        return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // Retorna o "peso" de correspondência da busca: 2 = começa com o termo,
    // 1 = contém o termo, 0 = não corresponde. Usado para reordenar sem esconder.
    function matchScore(product) {
        if (!searchTerm) return 0;
        var idx = normalize(product.name).indexOf(searchTerm);
        if (idx === -1) return 0;
        return idx === 0 ? 2 : 1;
    }

    // Produtos visíveis = filtrados apenas pela categoria ativa.
    // Ao buscar, os que correspondem sobem para o topo, mas os demais permanecem.
    function getVisibleProducts() {
        var list = data.products
            .map(function (p, i) { return { p: p, i: i }; })
            .filter(function (o) {
                return activeCategory === 'all' || o.p.category === activeCategory;
            });

        if (searchTerm) {
            list.sort(function (a, b) {
                return matchScore(b.p) - matchScore(a.p) || a.i - b.i;
            });
        }

        return list.map(function (o) { return o.p; });
    }

    function productCard(product) {
        var imgClass = product.image.endsWith('.svg') ? 'w-16 h-16 object-contain opacity-80' : 'w-full h-full object-cover';
        var isMatch = matchScore(product) > 0;
        var highlight = isMatch ? ' ring-2 ring-luzago-yellow' : '';
        return (
            '<div class="catalog-item product-item bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center border border-gray-100' + highlight + '" data-category="' + product.category + '">' +
                '<div class="product-item__img-wrap w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 border-4 border-gray-100 bg-gray-50 flex items-center justify-center shadow-inner">' +
                    '<img src="' + product.image + '" alt="' + product.name + '" width="128" height="128" class="img-lazy ' + imgClass + '" loading="lazy" decoding="async">' +
                '</div>' +
                '<span class="text-[10px] uppercase tracking-wider font-bold text-luzago-green mb-1">' + product.categoryName + '</span>' +
                '<h3 class="text-base md:text-lg font-bold text-luzago-green-dark mb-3 leading-tight">' + product.name + '</h3>' +
                '<div class="mt-auto w-full">' +
                    '<p class="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">DISPONÍVEL EM:</p>' +
                    '<p class="text-sm text-gray-700 font-semibold">' + product.sizes + '</p>' +
                '</div>' +
            '</div>'
        );
    }

    function updateCount(total, matches) {
        if (!countEl) return;
        if (searchTerm) {
            countEl.textContent = matches === 1
                ? '1 produto corresponde à busca (exibido no topo)'
                : matches + ' produtos correspondem à busca (exibidos no topo)';
            return;
        }
        var label = total === 1 ? 'produto encontrado' : 'produtos encontrados';
        countEl.textContent = total + ' ' + label;
    }

    function render() {
        var products = getVisibleProducts();
        var matches = products.filter(function (p) { return matchScore(p) > 0; }).length;
        updateCount(products.length, matches);

        if (!grid) return;

        if (products.length === 0) {
            grid.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');
        grid.innerHTML = products.map(productCard).join('');
        if (window.LuzagoEffects && window.LuzagoEffects.refresh) {
            window.LuzagoEffects.refresh();
        }
    }

    function setActiveFilter(btn) {
        document.querySelectorAll('[data-filter]').forEach(function (el) {
            el.classList.remove('bg-luzago-green-dark', 'text-white', 'border-luzago-green-dark');
            el.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
        });
        btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
        btn.classList.add('bg-luzago-green-dark', 'text-white', 'border-luzago-green-dark');
    }

    function buildFilters() {
        if (!filters) return;

        var counts = { all: data.products.length };
        data.categories.forEach(function (c) {
            counts[c.id] = data.products.filter(function (p) { return p.category === c.id; }).length;
        });

        var html = '<button type="button" data-filter="all" class="catalog-filter px-4 py-2 rounded-full text-sm font-bold border transition bg-luzago-green-dark text-white border-luzago-green-dark">Todos (' + counts.all + ')</button>';

        data.categories.forEach(function (cat) {
            html += '<button type="button" data-filter="' + cat.id + '" class="catalog-filter px-4 py-2 rounded-full text-sm font-bold border border-gray-200 bg-white text-gray-700 hover:border-luzago-green hover:text-luzago-green transition">' + cat.name + ' (' + (counts[cat.id] || 0) + ')</button>';
        });

        filters.innerHTML = html;

        filters.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-filter]');
            if (!btn) return;
            activeCategory = btn.getAttribute('data-filter');
            setActiveFilter(btn);
            render();
        });
    }

    function initFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var cat = params.get('categoria') || params.get('cat');
        if (!cat) return;
        var btn = document.querySelector('[data-filter="' + cat + '"]');
        if (btn) {
            activeCategory = cat;
            setActiveFilter(btn);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchTerm = normalize(searchInput.value.trim());
            render();
        });
    }

    buildFilters();
    initFromUrl();
    render();
})();
