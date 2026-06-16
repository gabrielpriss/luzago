#!/usr/bin/env python3
"""Insere Google Tag Manager em todas as páginas HTML."""
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
GTM_ID = 'GTM-KP9TKWZD'

GTM_HEAD = f'''    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
    new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    }})(window,document,'script','dataLayer','{GTM_ID}');</script>
    <!-- End Google Tag Manager -->
'''

GTM_BODY = f'''    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={GTM_ID}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
'''


def patch_gtm(content: str) -> str:
    if GTM_ID not in content:
        content = content.replace('<head>', '<head>\n' + GTM_HEAD, 1)

        content = re.sub(
            r'(<body[^>]*>)',
            r'\1\n' + GTM_BODY,
            content,
            count=1,
        )
    return content


def process_file(path: Path) -> bool:
    original = path.read_text(encoding='utf-8')
    updated = patch_gtm(original)
    if updated != original:
        path.write_text(updated, encoding='utf-8')
        return True
    return False


def main() -> None:
    changed = 0
    for path in sorted(BASE.rglob('*.html')):
        if '.vercel' in path.parts or '.git' in path.parts:
            continue
        if process_file(path):
            print(f'Atualizado: {path.relative_to(BASE)}')
            changed += 1
    print(f'Concluído: {changed} arquivo(s) modificados.')


if __name__ == '__main__':
    main()
