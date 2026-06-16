#!/usr/bin/env python3
"""Gera páginas do blog e atualiza o menu em todo o site."""
import os
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent

POSTS = [
    {
        'slug': 'como-escolher-temperos-food-service',
        'title': 'Como escolher temperos para food service',
        'excerpt': 'Critérios práticos para montar um mix de temperos que reduz custo, padroniza o sabor e agiliza a operação da cozinha.',
        'date': '15 de maio de 2025',
        'category': 'Temperos',
        'category_link': '/temperos-e-condimentos/',
        'image': '/assets/imagens/hero-vegetais.webp',
        'read_time': '6 min',
        'content': '''
            <p>Na operação de food service, o tempero certo faz diferença no sabor, no tempo de preparo e no custo do prato. A escolha vai além do preço por quilo: envolve padronização, rendimento e frequência de reposição.</p>

            <h2>Priorize itens de alto giro</h2>
            <p>Sal, pimenta, alho, cebola, páprica, orégano e chimichurri costumam liderar o consumo em cozinhas profissionais. Manter esses produtos em estoque evita rupturas que atrasam o expediente e forçam compras emergenciais, geralmente mais caras.</p>

            <h2>Padronize embalagens e dosagens</h2>
            <p>Trabalhar com formatos compatíveis — sacos de 1 kg, latas ou potes de 500 g — facilita o controle de porções e reduz desperdício. Temperos já moídos ou em misturas prontas podem acelerar preparos de alto volume, desde que a ficha técnica esteja bem definida.</p>

            <h2>Verifique origem e validade</h2>
            <p>Distribuidoras especializadas garantem rotatividade e armazenamento adequado. Na compra, confira lote, validade e integridade da embalação. Produtos com aroma fraco ou cor alterada comprometem o resultado final do cardápio.</p>

            <blockquote>Um mix enxuto e bem definido costuma render mais do que um estoque amplo com itens de baixa saída.</blockquote>

            <h2>Conte com um parceiro de reposição</h2>
            <p>Estabelecer pedidos recorrentes com um fornecedor atacadista reduz variação de preço e garante disponibilidade. A Luzago atende food service com mais de 80 itens na linha de temperos e condimentos, com entrega ágil na região de Curitiba e RMC.</p>
        ''',
    },
    {
        'slug': 'tendencias-cereais-integrais-atacado',
        'title': 'Cereais integrais: tendências do mercado atacadista',
        'excerpt': 'Demanda por grãos integrais, sem glúten e funcionais cresce no varejo e na indústria. Veja o que está em alta e como abastecer seu negócio.',
        'date': '28 de abril de 2025',
        'category': 'Cereais',
        'category_link': '/cereais/',
        'image': '/assets/imagens/estoque-sacarias.webp',
        'read_time': '5 min',
        'content': '''
            <p>O consumidor busca mais fibras, menos processados e rótulos transparentes. No atacado, isso se traduz em maior procura por arroz integral, quinoa, aveia, chia e mix de grãos para revenda e uso industrial.</p>

            <h2>Grãos que lideram o crescimento</h2>
            <ul>
                <li><strong>Aveia em flocos e farelo</strong> — bases para granolas, panificação e food service saudável.</li>
                <li><strong>Quinoa e chia</strong> — itens premium com boa saída em empórios e restaurantes contemporâneos.</li>
                <li><strong>Arroz integral e parboilizado</strong> — alternativas para marmitas, buffets e cozinhas corporativas.</li>
                <li><strong>Linhaça e gergelim</strong> — uso em padarias artesanais e produtos funcionais.</li>
            </ul>

            <h2>Oportunidade para revenda</h2>
            <p>Lojas de bairro, mercados e cash & carry podem montar ilhas de grãos a granel ou embalados com margem atrativa. O segredo está em combinar itens de entrada (arroz, feijão) com produtos de valor agregado (castanhas, farinhas especiais).</p>

            <h2>Armazenamento e giro</h2>
            <p>Cereais integrais exigem controle de umidade e proteção contra pragas. Comprar de distribuidor com estoque rotativo minimiza risco de produto parado. Planeje pedidos mensais alinhados ao giro real da loja.</p>
        ''',
    },
    {
        'slug': 'conservas-artesanais-cardapio-restaurante',
        'title': 'Conservas artesanais no cardápio do restaurante',
        'excerpt': 'Pepinos, palmitos, azeitonas e cogumelos em conserva agregam sabor, reduzem tempo de preparo e abrem espaço para pratos diferenciados.',
        'date': '10 de abril de 2025',
        'category': 'Conservas',
        'category_link': '/conservas/',
        'image': '/assets/imagens/interior-armazem.webp',
        'read_time': '4 min',
        'content': '''
            <p>Conservas bem escolhidas funcionam como ingrediente e como destaque no prato. Em cozinhas com alto volume, elas eliminam etapas de limpeza e cocção que consumiriam horas da equipe.</p>

            <h2>Usos que valorizam o menu</h2>
            <p>Champignon fatiado entra em risotos, pizzas e massas. Palmito compõe saladas e recheios. Pepino em conserva equilibra hambúrgueres e bowls. Azeitonas e cebolinhas finalizam entradas e tábuas de frios.</p>

            <h2>Custo-benefício na operação</h2>
            <p>Comparado ao processamento manual, a conserva industrial de qualidade reduz perdas e garante porção uniforme. O cálculo deve considerar rendimento por lata e tempo economizado da mão de obra.</p>

            <h2>Como escolher o fornecedor</h2>
            <p>Busque marcas com registro e rastreabilidade, embalagens adequadas ao seu volume (lata, balde ou vidro) e disponibilidade constante. Um distribuidor com linha ampla de conservas evita fragmentar pedidos entre vários fornecedores.</p>
        ''',
    },
    {
        'slug': 'logistica-distribuicao-alimentos-atacado',
        'title': 'Logística na distribuição de alimentos: o que seu negócio precisa saber',
        'excerpt': 'Prazos, lote mínimo, armazenagem e frequência de entrega impactam diretamente a margem e a satisfação do cliente final.',
        'date': '22 de março de 2025',
        'category': 'Negócios',
        'category_link': '/empresa/',
        'image': '/assets/imagens/maquina-empacotamento.webp',
        'read_time': '7 min',
        'content': '''
            <p>Comprar bem é importante, mas receber no prazo certo e em perfeitas condições é o que mantém a operação funcionando. Na distribuição de alimentos, a logística é parte do produto.</p>

            <h2>Indicadores que importam</h2>
            <ol>
                <li><strong>OTIF (On Time In Full)</strong> — pedido completo e no horário combinado.</li>
                <li><strong>Ruptura</strong> — itens indisponíveis que obrigam substituição ou perda de venda.</li>
                <li><strong>Prazo de validade na entrega</strong> — especialmente crítico em temperos, farinhas e conservas.</li>
            </ol>

            <h2>Planejamento de pedidos</h2>
            <p>Defina estoque mínimo por categoria e antecipe sazonalidades (festas, inverno com sopas, verão com refrescos). Pedidos consolidados reduzem custo logístico e melhoram condições comerciais.</p>

            <h2>Parceria de longo prazo</h2>
            <p>Distribuidoras com estrutura própria de armazém e frota — como a Luzago, em Pinhais/PR — oferecem previsibilidade para restaurantes, mercados e revendedores da região metropolitana de Curitiba.</p>
        ''',
    },
    {
        'slug': 'frutas-secas-castanhas-revenda',
        'title': 'Frutas secas e castanhas: opções para revenda e food service',
        'excerpt': 'Mix de nuts, frutas desidratadas e snacks saudáveis ganham espaço em cafés, academias e lojas especializadas.',
        'date': '5 de março de 2025',
        'category': 'Frutas Secas',
        'category_link': '/frutas-secas-e-castanhas/',
        'image': '/assets/imagens/moldura-vegetais-frescos.webp',
        'read_time': '5 min',
        'content': '''
            <p>O mercado de snacks saudáveis cresceu nos últimos anos e frutas secas com castanhas estão no centro dessa tendência. Para revenda, a variedade e a apresentação definem a conversão na gôndola.</p>

            <h2>Combinações que vendem</h2>
            <p>Mix de castanhas (castanha de caju, amêndoas, nozes), cranberries, uva passa e damasco atendem públicos diferentes: fitness, infantil e gourmet. Embalagens de 100 g a 1 kg cobrem desde consumo individual até uso em cozinha.</p>

            <h2>Aplicações em food service</h2>
            <p>Granolas, saladas, sobremesas e bowls usam frutas secas como textura e doçura natural. Ter fornecimento estável evita trocar fichas técnicas por falta de ingrediente.</p>

            <h2>Dicas de exposição</h2>
            <p>Ilhas temáticas — "snack saudável", "ingredientes para granola" — aumentam o ticket médio. Trabalhe com um distribuidor que ofereça linha ampla para você montar mix próprio sem multiplicar pedidos.</p>
        ''',
    },
]

HEAD = '''<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
    new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    }})(window,document,'script','dataLayer','GTM-KP9TKWZD');</script>
    <!-- End Google Tag Manager -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Blog Luzago Alimentos</title>
    <meta name="description" content="{description}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            theme: {{
                extend: {{
                    colors: {{
                        'luzago-green-dark': '#0f4c2c',
                        'luzago-green': '#197c45',
                        'luzago-red': '#d52b1e',
                        'luzago-yellow': '#fbb034',
                        'luzago-dark': '#2c2a29',
                    }},
                    fontFamily: {{
                        sans: ['Noto Serif', 'serif'],
                        serif: ['Noto Serif', 'serif'],
                    }}
                }}
            }}
        }}
    </script>
    <link rel="stylesheet" href="/css/buttons.css">
    <link rel="stylesheet" href="/css/blog.css">
    <link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">
    <link rel="stylesheet" href="/css/aos-fixes.css">
    <link rel="stylesheet" href="/css/effects.css">
    <link rel="stylesheet" href="/css/mobile-menu.css">
    <link rel="stylesheet" href="/css/responsive.css">
</head>
<body class="font-sans text-gray-800 antialiased bg-gray-50">
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KP9TKWZD"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
'''

TOP_BAR = '''
    <div class="bg-luzago-green-dark text-white py-3 px-4 text-base hidden md:block">
        <div class="container mx-auto max-w-6xl flex justify-between items-center">
            <div class="flex items-center gap-3">
                <a href="tel:+554136687866" class="hover:text-gray-200 font-semibold transition text-base md:text-lg">(41) 3668-7866</a>
            </div>
            <div class="flex items-center gap-6">
                <div class="flex gap-3">
                    <a href="https://www.facebook.com/luzagoalimentos/" target="_blank" rel="noopener" aria-label="Facebook Luzago" class="w-8 h-8 rounded-full bg-white text-luzago-green-dark flex items-center justify-center hover:bg-gray-200 transition"><i class="fa-brands fa-facebook-f text-sm"></i></a>
                    <a href="https://www.linkedin.com/company/luzagoalimentos/" target="_blank" rel="noopener" aria-label="LinkedIn Luzago" class="w-8 h-8 rounded-full bg-white text-luzago-green-dark flex items-center justify-center hover:bg-gray-200 transition"><i class="fa-brands fa-linkedin-in text-sm"></i></a>
                    <a href="https://www.instagram.com/luzagoalimentos/" target="_blank" rel="noopener" aria-label="Instagram Luzago" class="w-8 h-8 rounded-full bg-white text-luzago-green-dark flex items-center justify-center hover:bg-gray-200 transition"><i class="fa-brands fa-instagram text-sm"></i></a>
                </div>
                <a href="/catalogo/" class="btn btn--secondary btn--sm">Catálogo</a>
            </div>
        </div>
    </div>
'''

def nav(blog_active: bool = False) -> str:
    blog_cls = 'inline-flex items-center leading-none text-luzago-green transition' if blog_active else 'inline-flex items-center leading-none hover:text-luzago-green transition'
    if blog_active:
        blog_cls = 'inline-flex items-center leading-none text-luzago-green font-extrabold transition'
    return f'''
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <div class="container mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
            <a href="/">
                <img src="/assets/icones/logo-luzago.webp" alt="Luzago Alimentos" class="h-16 md:h-20 object-contain">
            </a>
            <nav class="hidden md:flex items-center gap-5 lg:gap-6 font-bold text-gray-800 text-sm lg:text-base">
                <a href="/empresa/" class="inline-flex items-center leading-none hover:text-luzago-green transition">Empresa</a>
                <a href="/blog/" class="{blog_cls}">Blog</a>
                <div class="relative group flex items-center">
                    <a href="javascript:void(0)" class="inline-flex items-center gap-1 leading-none hover:text-luzago-green transition">Produtos <i class="fa-solid fa-chevron-down text-[10px]"></i></a>
                    <div class="absolute left-0 top-full pt-2 hidden group-hover:block z-50">
                        <div class="w-64 bg-luzago-green-dark shadow-xl border-t-4 border-luzago-yellow">
                        <ul class="py-2 text-white font-semibold text-sm">
                            <li><a href="/temperos-e-condimentos/" class="block px-6 py-3 hover:bg-luzago-green transition">Temperos e Condimentos</a></li>
                            <li><a href="/cereais/" class="block px-6 py-3 hover:bg-luzago-green transition">Cereais</a></li>
                            <li><a href="/farinaceos/" class="block px-6 py-3 hover:bg-luzago-green transition">Farináceos</a></li>
                            <li><a href="/frutas-secas-e-castanhas/" class="block px-6 py-3 hover:bg-luzago-green transition">Frutas Secas e Castanhas</a></li>
                            <li><a href="/conservas/" class="block px-6 py-3 hover:bg-luzago-green transition">Conservas</a></li>
                            <li><a href="/food-service/" class="block px-6 py-3 hover:bg-luzago-green transition">Food Service</a></li>
                            <li><a href="/refrescos-e-sobremesas/" class="block px-6 py-3 hover:bg-luzago-green transition">Refrescos e Sobremesas</a></li>
                            <li class="border-t border-white/20 mt-1 pt-1"><a href="/catalogo/" class="block px-6 py-3 hover:bg-luzago-green transition text-luzago-yellow">Ver catálogo completo</a></li>
                        </ul>
                        </div>
                    </div>
                </div>
                <a href="/trabalhe-conosco/#curriculo" class="inline-flex items-center leading-none hover:text-luzago-green transition">Trabalhe Conosco</a>
                <a href="/trabalhe-conosco/#fornecedor" class="inline-flex items-center leading-none hover:text-luzago-green transition">Seja fornecedor</a>
                <a href="/contato/" class="btn btn--primary btn--sm">Solicite orçamento</a>
            </nav>
            <button type="button" class="mobile-menu-toggle md:hidden" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-menu-panel">
                <i class="fa-solid fa-bars" aria-hidden="true"></i>
            </button>
        </div>
    </header>
'''

FOOTER = '''
    <footer class="bg-luzago-dark text-gray-300">
        <div class="container mx-auto px-4 max-w-6xl py-12 grid md:grid-cols-3 gap-10">
            <div>
                <h3 class="text-white font-bold text-lg mb-4 uppercase tracking-wider">MISSÃO</h3>
                <p class="text-sm text-gray-400 leading-relaxed text-justify">
                    Distribuir produtos de excelente qualidade agregando valor ao atendimento personalizado, buscando sempre a satisfação de nossos clientes.
                </p>
            </div>
            <div class="flex flex-col md:items-center">
                <div class="mb-6 w-full md:text-center">
                    <h3 class="text-white font-bold text-lg mb-4 uppercase tracking-wider">siga-nos</h3>
                    <div class="flex gap-3 md:justify-center">
                        <a href="https://www.facebook.com/luzagoalimentos/" target="_blank" rel="noopener" aria-label="Facebook Luzago" class="w-8 h-8 rounded-full bg-luzago-green text-white flex items-center justify-center hover:bg-luzago-green-dark transition"><i class="fa-brands fa-facebook-f text-sm"></i></a>
                        <a href="https://www.linkedin.com/company/luzagoalimentos/" target="_blank" rel="noopener" aria-label="LinkedIn Luzago" class="w-8 h-8 rounded-full bg-luzago-green text-white flex items-center justify-center hover:bg-luzago-green-dark transition"><i class="fa-brands fa-linkedin-in text-sm"></i></a>
                        <a href="https://www.instagram.com/luzagoalimentos/" target="_blank" rel="noopener" aria-label="Instagram Luzago" class="w-8 h-8 rounded-full bg-luzago-green text-white flex items-center justify-center hover:bg-luzago-green-dark transition"><i class="fa-brands fa-instagram text-sm"></i></a>
                    </div>
                </div>
                <div class="w-full md:text-center text-sm">
                    <p class="mb-1 flex items-center md:justify-center gap-2"><i class="fa-solid fa-phone"></i> (41) 3668-7866</p>
                    <p class="mb-4 flex items-center md:justify-center gap-2"><i class="fa-solid fa-envelope"></i> sac@luzagoalimentos.com.br</p>
                    <a href="https://wa.me/554136687866?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20Luzago%20Alimentos%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es." target="_blank" rel="noopener" class="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-5 rounded transition text-sm">
                        <i class="fa-brands fa-whatsapp text-lg" aria-hidden="true"></i> Fale no WhatsApp
                    </a>
                </div>
            </div>
            <div class="md:text-right">
                <h3 class="text-white font-bold text-lg mb-4 uppercase tracking-wider">endereço</h3>
                <div class="text-sm text-gray-400">
                    <p class="flex md:justify-end gap-2 items-start"><i class="fa-solid fa-location-dot mt-1"></i> Rua Alto Paraná, 1645<br>CEP: 83325-045<br>Pinhais - PR</p>
                </div>
            </div>
        </div>
        <div class="bg-luzago-green-dark py-4 text-xs">
            <div class="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row justify-between items-center text-gray-300">
                <p>© Luzago 2024 , todos os direitos reservados</p>
                <p class="mt-2 md:mt-0">Desenvolvido por <a href="#" class="text-white hover:underline">Conceito Prime Marketing Digital</a></p>
            </div>
        </div>
    </footer>

    <script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
    <script src="/js/mobile-menu.js"></script>
    <script src="/js/site-effects.js"></script>
</body>
</html>
'''


def card(post: dict) -> str:
    return f'''
            <article class="blog-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col">
                <a href="/blog/{post["slug"]}/" class="block overflow-hidden">
                    <img src="{post["image"]}" alt="{post["title"]}" class="blog-card__image w-full" loading="lazy">
                </a>
                <div class="p-6 flex flex-col flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="blog-tag">{post["category"]}</span>
                        <span class="text-xs text-gray-500">{post["date"]}</span>
                    </div>
                    <h2 class="text-xl font-bold text-luzago-green-dark mb-3 leading-snug">
                        <a href="/blog/{post["slug"]}/" class="hover:text-luzago-green transition">{post["title"]}</a>
                    </h2>
                    <p class="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{post["excerpt"]}</p>
                    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span class="text-xs text-gray-400"><i class="fa-regular fa-clock mr-1"></i> {post["read_time"]} de leitura</span>
                        <a href="/blog/{post["slug"]}/" class="text-sm font-bold text-luzago-red hover:underline uppercase tracking-wide">Ler mais</a>
                    </div>
                </div>
            </article>
'''


def related_posts(current_slug: str, limit: int = 3) -> str:
    items = [p for p in POSTS if p['slug'] != current_slug][:limit]
    html = ''
    for p in items:
        html += f'''
                    <a href="/blog/{p["slug"]}/" class="blog-related-card block p-4 rounded-lg border border-gray-200 mb-3">
                        <span class="blog-tag mb-2">{p["category"]}</span>
                        <p class="font-bold text-sm text-luzago-green-dark leading-snug mt-2">{p["title"]}</p>
                        <p class="text-xs text-gray-500 mt-1">{p["date"]}</p>
                    </a>
'''
    return html


def generate_index() -> None:
    cards = ''.join(card(p) for p in POSTS)
    html = HEAD.format(
        title='Blog',
        description='Dicas, tendências e novidades sobre distribuição de alimentos, temperos, cereais e food service.',
    )
    html += TOP_BAR
    html += nav(blog_active=True)
    html += f'''
    <section class="blog-hero py-16 md:py-24 px-4 text-center text-white">
        <div class="container mx-auto max-w-3xl">
            <img src="/assets/icones/icone-folha-luzago.webp" alt="Luzago Alimentos" class="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 object-contain">
            <h1 class="text-3xl md:text-5xl font-bold mb-4">Blog Luzago</h1>
            <p class="text-white/85 text-base md:text-lg leading-relaxed">Conteúdos sobre alimentos, atacado e food service para ajudar seu negócio a comprar melhor e vender mais.</p>
        </div>
    </section>

    <section class="py-12 md:py-16 px-4">
        <div class="container mx-auto max-w-6xl">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
{cards}
            </div>

            <div class="mt-16 text-center bg-luzago-green-dark rounded-2xl p-8 md:p-12 text-white">
                <h2 class="text-2xl md:text-3xl font-bold mb-3">Precisa de um orçamento?</h2>
                <p class="text-white/80 mb-6 max-w-xl mx-auto">Fale com nossa equipe comercial e monte seu pedido com mais de 500 itens disponíveis.</p>
                <a href="/contato/" class="btn btn--secondary">Solicite orçamento</a>
            </div>
        </div>
    </section>
'''
    html += FOOTER
    out = BASE / 'blog' / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'Gerado: {out.relative_to(BASE)}')


def generate_post(post: dict) -> None:
    others = related_posts(post['slug'])
    html = HEAD.format(title=post['title'], description=post['excerpt'])
    html += TOP_BAR
    html += nav(blog_active=True)
    html += f'''
    <section class="blog-post-hero h-[280px] md:h-[360px] flex items-end" style="background-image: linear-gradient(rgba(15,76,44,0.75), rgba(15,76,44,0.9)), url('{post["image"]}');">
        <div class="container mx-auto max-w-4xl px-4 pb-10 md:pb-14 w-full">
            <nav class="blog-breadcrumb text-sm text-white/75 mb-4" aria-label="Breadcrumb">
                <a href="/">Início</a>
                <span class="mx-2">/</span>
                <a href="/blog/">Blog</a>
                <span class="mx-2">/</span>
                <span class="text-white">{post["category"]}</span>
            </nav>
            <span class="blog-tag">{post["category"]}</span>
            <h1 class="text-2xl md:text-4xl font-bold text-white mt-4 leading-tight">{post["title"]}</h1>
            <p class="text-white/80 text-sm mt-4 flex flex-wrap items-center gap-4">
                <span><i class="fa-regular fa-calendar mr-1"></i> {post["date"]}</span>
                <span><i class="fa-regular fa-clock mr-1"></i> {post["read_time"]} de leitura</span>
            </p>
        </div>
    </section>

    <section class="py-12 md:py-16 px-4">
        <div class="container mx-auto max-w-6xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <article class="lg:col-span-2 bg-white rounded-2xl shadow-md p-8 md:p-10 border border-gray-100">
                    <div class="blog-article">
                        {post["content"].strip()}
                    </div>
                    <div class="mt-10 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <a href="{post["category_link"]}" class="text-sm font-bold text-luzago-green hover:underline">
                            <i class="fa-solid fa-arrow-left mr-1"></i> Ver produtos em {post["category"]}
                        </a>
                        <a href="/contato/" class="btn btn--primary btn--sm">Solicite orçamento</a>
                    </div>
                </article>

                <aside class="lg:col-span-1">
                    <div class="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-28">
                        <h2 class="text-lg font-bold text-luzago-green-dark mb-4 uppercase tracking-wide">Leia também</h2>
{others}
                        <a href="/blog/" class="btn btn--secondary btn--sm w-full mt-4 text-center">Ver todos os posts</a>
                    </div>
                </aside>
            </div>
        </div>
    </section>
'''
    html += FOOTER
    out = BASE / 'blog' / post['slug'] / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'Gerado: {out.relative_to(BASE)}')


def patch_site_nav() -> None:
    blog_link = '<a href="/blog/" class="inline-flex items-center leading-none hover:text-luzago-green transition">Blog</a>\n                '
    marker = '<a href="/empresa/" class="inline-flex items-center leading-none hover:text-luzago-green transition">Empresa</a>\n                '
    blog_marker = '<a href="/blog/"'

    for path in BASE.rglob('*.html'):
        if 'blog' in path.parts and path.name == 'index.html' and len(path.parts) > 2:
            continue
        content = path.read_text(encoding='utf-8')
        if blog_marker in content:
            continue
        if marker not in content:
            print(f'Aviso: menu não encontrado em {path.relative_to(BASE)}')
            continue
        content = content.replace(marker, marker + blog_link, 1)
        path.write_text(content, encoding='utf-8')
        print(f'Menu atualizado: {path.relative_to(BASE)}')


def main() -> None:
    generate_index()
    for post in POSTS:
        generate_post(post)
    patch_site_nav()
    print(f'Blog pronto com {len(POSTS)} posts.')


if __name__ == '__main__':
    main()
