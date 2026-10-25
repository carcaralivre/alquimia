# Alquimia — ficha para addons.mozilla.org

**Exige política de privacidade** (o manifest declara coleta de `websiteContent` e `browsingActivity`): cole a seção "Política de privacidade" no campo correspondente do Developer Hub. **Risco de revisão:** roda JavaScript gerado por um modelo de IA a pedido do usuário, pela API `userScripts`. Se a Mozilla recusar, a alternativa é uma versão só com CSS.

- Nome: **Alquimia** (livre na AMO)
- Resumo (≤ 250): Muda qualquer página com um pedido em linguagem natural. Um Stylus/Greasemonkey em que você descreve a mudança ("esconde a barra lateral") e o modelo escreve o CSS ou JS, aplicado na hora e salvo para o site. Usa sua chave da OpenRouter ou Anthropic.
- Categorias: Aparência · Produtividade
- Tags: css, userscript, ia, personalizar
- Licença: Mozilla Public License 2.0
- Site: (repositório, se criar) · Suporte: (seu e-mail)
- Ícone: `icone-128.png`
- Capturas: 1) diálogo na página com um pedido · 2) página de configurações com a lista de edições por site (você tira)

## Descrição

Extensão para Firefox que muda qualquer página com um pedido em linguagem natural.

É um Stylus/Greasemonkey em que, em vez de escrever o código, você descreve o que quer: "esconde a barra lateral", "deixa a fonte dos comentários maior", "tira o autoplay dos vídeos". O modelo escreve o CSS ou o JS, a edição é aplicada na hora e fica salva para o domínio.

- Clique no ícone da barra: abre um diálogo na própria página. Escreva o pedido e aperte Enter.
- Apontar elemento: clique em "Apontar elemento" e depois no pedaço da página a que o pedido se refere.
- Desfazer: depois de aplicar, o diálogo mostra o nome da edição e um botão de desfazer.
- Alterar uma edição: peça de novo no mesmo site; o modelo vê as edições existentes e substitui a que for o caso.
- Configurações: provedor, chave da API, escolha do modelo (com preços) e a lista de sites e edições, cada uma com interruptor e botão de apagar.

Como funciona
- As edições valem para o domínio, em todas as páginas. O CSS entra a cada carregamento; o JS roda como user script (API userScripts, Firefox 153+), com uma permissão que o Firefox pede à parte. Sem ela, só o CSS funciona.
- Dois provedores: OpenRouter (qualquer modelo) ou a API da Anthropic. Os dois são cobrados por uso, na sua própria conta. A chave fica no seu navegador e só é enviada ao provedor escolhido.

Veja a política de privacidade: o pedido vai para o provedor junto com o título, a URL e um esboço da estrutura da página.

## Política de privacidade

A Alquimia não envia nada ao autor da extensão e não tem servidor próprio.

Quando você faz um pedido, a extensão envia ao provedor de IA que você escolheu nas configurações (OpenRouter, em openrouter.ai, ou Anthropic, em api.anthropic.com), usando a sua própria chave de API:
- o texto do pedido;
- o título e a URL da página aberta;
- um esboço da estrutura da página (os nomes dos elementos, até três níveis) e, se você apontou um elemento, o HTML dele;
- as edições já salvas para o site.

Nada é enviado sem um pedido seu. O uso desses dados pelo provedor segue a política de privacidade dele.

No seu navegador (storage.local) ficam: a chave da API, o provedor e o modelo escolhidos, as edições geradas por site e um contador de gasto estimado. Nada disso é sincronizado ou enviado a terceiros. Apagar a extensão apaga tudo.

## Notas ao revisor (English)

An AI-assisted user-style/user-script manager. On user request, it sends the prompt plus page title, URL, a 3-level DOM outline and (optionally) the picked element's HTML to the provider the user configured (OpenRouter or Anthropic), with the user's own API key, and gets back CSS and/or JS. CSS is applied with `scripting.insertCSS`; JS is registered as a user script with the `userScripts` API (`world: MAIN`, optional permission requested from the user) and shown in full in the options page, where the user can disable or delete each edit. No code is ever fetched from the developer; the only remote endpoints are the two providers, both chosen explicitly by the user. `data_collection_permissions` declares `websiteContent` and `browsingActivity`; the privacy policy describes exactly what is sent. `dialog.js` builds its UI from a static template string (the `innerHTML` warning); `<all_urls>` is inherent to applying edits on any site. No build step.
