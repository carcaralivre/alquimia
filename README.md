# Alquimia

Extensão para Firefox que muda qualquer página com um pedido em linguagem natural.

É um Stylus/Greasemonkey em que, em vez de escrever o código, você descreve o que quer: "esconde a barra lateral", "deixa a fonte dos comentários maior", "tira o autoplay dos vídeos". O modelo escreve o CSS ou o JS, a edição é aplicada na hora e fica salva para o domínio.

- **Clique** no ícone da barra: abre um diálogo na própria página. Escreva o pedido e aperte Enter.
- **Apontar elemento:** no diálogo, clique em "Apontar elemento" e depois no pedaço da página a que o pedido se refere. O seletor dele vai junto com o pedido.
- **Desfazer:** depois de aplicar, o diálogo mostra o nome da edição e um botão de desfazer.
- **Alterar uma edição:** peça de novo no mesmo site ("deixa a fonte maior ainda"); o modelo vê as edições existentes e substitui a que for o caso.
- **Clique direito** no ícone, ou a engrenagem no diálogo: abre as configurações, com o provedor, a chave da API, a escolha do modelo (com preços) e a lista de sites e edições. Cada edição tem um interruptor para desligar sem apagar, e um botão para apagar; cada site tem um botão para apagar tudo.

## Como funciona

- As edições valem para o domínio (sem `www.`), em todas as páginas.
- O CSS entra pela API `scripting.insertCSS` a cada carregamento, depois das folhas de estilo do site.
- O JS roda como *user script* no contexto da página (API `userScripts`, Firefox 153+). O Firefox pede essa permissão à parte, na primeira vez que o ícone é clicado ou nas configurações. Sem ela, só o CSS funciona.
- O pedido vai para o modelo junto com o título e a URL da página, um esboço da estrutura (três níveis de elementos), o HTML do elemento apontado e as edições já existentes do site.
- Dois provedores: [OpenRouter](https://openrouter.ai) (qualquer modelo) ou a API da [Anthropic](https://console.anthropic.com) direto. Os dois são cobrados por uso; a assinatura do Claude não serve para a API. Ao colocar a chave, as configurações listam os modelos disponíveis com o preço por milhão de tokens (entrada / saída). O padrão é o Claude Sonnet 5.5.
- A chave da API fica no `storage.local` do navegador e só é enviada ao provedor escolhido.

## Desenvolvimento

```sh
npx web-ext lint    # valida
npx web-ext build   # gera o .zip em web-ext-artifacts/
npx web-ext sign --channel=unlisted --api-key=… --api-secret=…   # assina e gera o .xpi
npx web-ext sign --channel=listed --api-key=… --api-secret=…     # submete à revisão da loja (addons.mozilla.org)
```

Toda alteração precisa de um novo `version` no `manifest.json` antes de assinar.

## Licença

[MPL 2.0](LICENSE)
