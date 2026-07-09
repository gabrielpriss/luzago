/**
 * Busca de produtos nas páginas de categoria (grids estáticos).
 * Não esconde produtos: reordena o grid colocando as correspondências no topo
 * e destaca os itens que correspondem ao termo pesquisado.
 */
(function () {
    'use strict';

    var input = document.querySelector('[data-product-search]');
    var grid = document.querySelector('[data-product-grid]');
    if (!input || !grid) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll('.product-item'));
    if (!items.length) return;

    var original = items.slice();

    function normalize(text) {
        return (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    var names = items.map(function (el) {
        var h = el.querySelector('h3');
        return normalize(h ? h.textContent : '');
    });

    function clearHighlight(el) {
        el.classList.remove('ring-2', 'ring-luzago-yellow');
    }

    input.addEventListener('input', function () {
        var term = normalize(input.value.trim());

        if (!term) {
            original.forEach(function (el) {
                clearHighlight(el);
                grid.appendChild(el);
            });
            return;
        }

        var scored = items.map(function (el, i) {
            var idx = names[i].indexOf(term);
            var score = idx === -1 ? 0 : (idx === 0 ? 2 : 1);
            return { el: el, score: score, i: i };
        });

        scored.sort(function (a, b) {
            return b.score - a.score || a.i - b.i;
        });

        scored.forEach(function (s) {
            if (s.score > 0) {
                s.el.classList.add('ring-2', 'ring-luzago-yellow');
            } else {
                clearHighlight(s.el);
            }
            grid.appendChild(s.el);
        });
    });
})();
