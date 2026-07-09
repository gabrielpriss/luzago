# GTM — Conversão de Lead (Google Ads)

Dispara a conversão do Google Ads **somente após o envio de um formulário de lead
ser confirmado com sucesso** (comercial, currículo ou fornecedor).

- **ID de conversão:** `11312135434`
- **Rótulo de conversão:** `JCYlCK3N1M0cEIr6hZIq`
- **Evento no dataLayer:** `lead_form_submit`
- **Container GTM:** `GTM-KP9TKWZD` (já instalado no site)

## Como o site dispara o evento

O `js/leads.js` só faz o push abaixo **depois** que o Apps Script confirma a gravação
do lead na planilha (não dispara em erro nem ao abrir a página):

```js
window.dataLayer.push({
  event: 'lead_form_submit',
  lead_type: 'comercial' | 'curriculo' | 'fornecedor',
  termo_pesquisa: '<termo do Google Ads>'
});
```

## Opção A — Importar o container pronto

1. GTM → **Admin → Importar contêiner**
2. Selecione o arquivo `luzago-google-ads-conversao.json`
3. Workspace: **Existing** (o seu) → Opção de importação: **Mesclar (Merge)** →
   **Substituir conflitos por conflitos** (Overwrite) — não há conflito de nomes aqui
4. Revise e **Confirmar**. Depois **Enviar/Publicar** o container.

Isso cria:
- Tag **Conversion Linker** (dispara em All Pages) — necessária para atribuir o clique
- Trigger **CE - lead_form_submit** (Custom Event = `lead_form_submit`)
- Tag **Google Ads - Conversao Lead** (dispara no trigger acima)
- Variável **DLV - termo_pesquisa** (opcional, caso queira ver o termo no debug)

## Opção B — Criar manualmente (à prova de erros)

1. **Tag → Conversion Linker** → acionador **All Pages** → salvar.
2. **Acionador → Novo → Evento personalizado**
   - Nome do evento: `lead_form_submit`
   - Nome: `CE - lead_form_submit`
3. **Tag → Google Ads Conversion Tracking**
   - ID de conversão: `11312135434`
   - Rótulo de conversão: `JCYlCK3N1M0cEIr6hZIq`
   - Acionador: `CE - lead_form_submit`
4. **Visualizar (Preview)** → envie um formulário de teste → confirme que a tag
   "Google Ads - Conversao Lead" disparou **1x** no evento `lead_form_submit`.
5. **Enviar/Publicar**.

## Verificação

- GTM **Preview**: a tag de conversão só aparece no evento `lead_form_submit`.
- Google Ads → Conversões: status muda para "Registrando conversões recentes"
  após os primeiros envios reais.
