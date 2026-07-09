# GTM — Conversão de Lead (Google Ads)

Dispara a conversão do Google Ads **somente após o envio do formulário de LEAD
COMERCIAL** (pré-orçamento / contato comercial) ser confirmado com sucesso.

> Os formulários **Trabalhe conosco** (currículo) e **Seja um fornecedor** também
> enviam o evento `lead_form_submit` para o dataLayer (útil para análise), mas
> **NÃO** contam como conversão — o acionador é filtrado por `lead_type = comercial`.

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
- Trigger **CE - lead comercial (conversao)** — Custom Event `lead_form_submit`
  **filtrado por `lead_type` igual a `comercial`**
- Tag **Google Ads - Conversao Lead** (dispara no trigger acima)
- Variável **DLV - lead_type** (usada na condição do acionador)
- Variável **DLV - termo_pesquisa** (opcional, caso queira ver o termo no debug)

## Opção B — Criar manualmente (à prova de erros)

1. **Tag → Conversion Linker** → acionador **All Pages** → salvar.
2. **Variável → Nova → Variável da camada de dados**
   - Nome da variável na camada de dados: `lead_type`
   - Nome: `DLV - lead_type`
3. **Acionador → Novo → Evento personalizado**
   - Nome do evento: `lead_form_submit`
   - Este acionador é acionado em: **Alguns eventos personalizados**
   - Condição: `DLV - lead_type` **igual a** `comercial`
   - Nome: `CE - lead comercial (conversao)`
4. **Tag → Google Ads Conversion Tracking**
   - ID de conversão: `11312135434`
   - Rótulo de conversão: `JCYlCK3N1M0cEIr6hZIq`
   - Acionador: `CE - lead comercial (conversao)`
5. **Visualizar (Preview)**:
   - Envie o form de **contato comercial** → a tag deve disparar **1x**.
   - Envie o form de **currículo** ou **fornecedor** → a tag **NÃO** deve disparar.
6. **Enviar/Publicar**.

## Verificação

- GTM **Preview**: a tag de conversão só aparece no evento `lead_form_submit`.
- Google Ads → Conversões: status muda para "Registrando conversões recentes"
  após os primeiros envios reais.
