// Arquivo de verificação do Google Search Console.
// Servido por Function para responder 200 com o conteúdo exato, sem passar
// pelo redirecionamento de .html do _redirects nem pelo tratamento de URLs do Pages.
export function onRequest() {
  return new Response('google-site-verification: google904f5ff3a1db1590.html', {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
}
