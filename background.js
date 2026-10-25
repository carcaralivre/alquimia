const SYSTEM_PROMPT = `Você é a Alquimia, uma extensão de navegador que modifica páginas da web a partir de pedidos em linguagem natural, gerando CSS e/ou JavaScript.

Responda SOMENTE com um objeto JSON, sem texto em volta e sem cercas de código, no formato:
{"title": "...", "css": "...", "js": "...", "replaces": "..."}

- "title": nome curto da edição (até 40 caracteres), no mesmo idioma do pedido.
- "css": CSS a aplicar, ou "" se não precisar. Prefira sempre CSS; use JS só quando CSS não resolve.
- "js": JavaScript a rodar, ou "" se não precisar.
- "replaces": só quando o pedido é para alterar uma edição já existente deste site: o id dela. Nesse caso devolva a versão completa nova, que substitui a antiga. Omita se for uma edição nova.

Regras:
- As edições valem para todas as páginas deste domínio e rodam a cada carregamento.
- O CSS entra depois das folhas de estilo do site. Use !important quando precisar vencer estilos inline ou muito específicos.
- O JS roda no contexto da página em document_idle, a cada carregamento. Precisa ser idempotente e funcionar em páginas que carregam conteúdo depois (use MutationObserver quando o elemento pode aparecer mais tarde). Sem recursos externos, sem alert.
- Prefira seletores estáveis: ids, atributos data-*, aria-*, tags semânticas e textos. Evite classes com nomes gerados (hashes, números aleatórios).
- Se o usuário apontou um elemento, o pedido se refere a ele: use o seletor dado, ou um mais robusto que chegue ao mesmo elemento. Quando o pedido vale para "todos os elementos como esse", generalize o seletor.
- Não explique nada: só o JSON.`;

// ---- Providers ----

const PROVIDERS = {
  openrouter: {
    name: "OpenRouter",
    async complete(apiKey, model, user) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Title": "Alquimia" },
        body: JSON.stringify({ model, temperature: 0.2, usage: { include: true }, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: user }] }),
      }).catch(e => { throw new Error(`Não deu para falar com o OpenRouter: ${e.message}`); });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `OpenRouter respondeu ${res.status}.`);
      const u = data.usage ?? {};
      return { text: data.choices?.[0]?.message?.content ?? "", input: u.prompt_tokens ?? 0, output: u.completion_tokens ?? 0, cost: typeof u.cost === "number" ? u.cost : null };
    },
  },
  anthropic: {
    name: "Anthropic",
    async complete(apiKey, model, user) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 8192, temperature: 0.2, system: SYSTEM_PROMPT, messages: [{ role: "user", content: user }] }),
      }).catch(e => { throw new Error(`Não deu para falar com a Anthropic: ${e.message}`); });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `Anthropic respondeu ${res.status}.`);
      const u = data.usage ?? {};
      return { text: data.content?.filter(c => c.type === "text").map(c => c.text).join("") ?? "", input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cost: null };
    },
  },
};

// ---- Storage helpers ----

async function getAll() {
  return browser.storage.local.get(DEFAULTS);
}

function hostOf(url) {
  try {
    const { protocol, hostname } = new URL(url);
    if (!/^https?:$/.test(protocol)) return null;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function matchesFor(host) {
  return [`*://${host}/*`, `*://www.${host}/*`];
}

function cssFor(edits) {
  return edits.filter(e => e.enabled && e.css).map(e => `/* ${e.title} */\n${e.css}`).join("\n\n");
}

// ---- Setup ----

function setup() {
  buildMenu();
  syncUserScripts();
}
browser.runtime.onInstalled.addListener(setup);
browser.runtime.onStartup.addListener(setup);
browser.storage.onChanged.addListener(changes => {
  if (changes.edits) syncUserScripts();
});
// The options page can grant userScripts too; register the saved JS edits then.
browser.permissions.onAdded.addListener(({ permissions }) => {
  if (permissions?.includes("userScripts")) syncUserScripts();
});

async function buildMenu() {
  await browser.menus.removeAll();
  browser.menus.create({ id: "options", contexts: ["action"], title: "Configurações…" });
}
browser.menus.onClicked.addListener(({ menuItemId }) => {
  if (menuItemId === "options") browser.runtime.openOptionsPage();
});

// ---- JS edits run as user scripts, in the page's own world ----

async function userScriptsGranted() {
  return browser.permissions.contains({ permissions: ["userScripts"] });
}

async function syncUserScripts() {
  if (!(await userScriptsGranted()) || !browser.userScripts) return;
  const { edits } = await getAll();
  const wanted = [];
  for (const [host, list] of Object.entries(edits)) {
    for (const e of list) {
      if (e.enabled && e.js) wanted.push({ id: e.id, matches: matchesFor(host), js: [{ code: e.js }], world: "MAIN", runAt: "document_idle" });
    }
  }
  const current = (await browser.userScripts.getScripts()).map(s => s.id);
  if (current.length) await browser.userScripts.unregister({ ids: current });
  if (wanted.length) await browser.userScripts.register(wanted);
}

async function runNow(tabId, js) {
  if (!browser.userScripts?.execute) return false;
  await browser.userScripts.execute({ target: { tabId }, world: "MAIN", js: [{ code: js }], injectImmediately: true });
  return true;
}

// ---- Toolbar button opens the dialog in the page ----

browser.action.onClicked.addListener(async tab => {
  if (!hostOf(tab.url)) return;
  // userScripts is optional-only in Firefox; this click is the user gesture that allows asking.
  if (!(await userScriptsGranted())) {
    await browser.permissions.request({ permissions: ["userScripts"] }).catch(() => {});
    syncUserScripts();
  }
  await browser.scripting.insertCSS({ target: { tabId: tab.id }, files: ["dialog.css"] }).catch(() => {});
  await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ["dialog.js"] });
});

// ---- Messages from the page (loader, dialog) and the options page ----

browser.runtime.onMessage.addListener((message, sender) => {
  const tab = sender.tab;
  switch (message.action) {
    case "page-loaded": return applyCss(tab);
    case "state": return state(tab);
    case "generate": return generate(tab, message);
    case "undo": return undo(tab, message.id);
    case "open-options": return browser.runtime.openOptionsPage();
  }
});

async function applyCss(tab) {
  const host = hostOf(tab?.url);
  if (!host) return;
  const { edits } = await getAll();
  const css = cssFor(edits[host] ?? []);
  if (css) await browser.scripting.insertCSS({ target: { tabId: tab.id }, css }).catch(() => {});
}

async function state(tab) {
  const host = hostOf(tab.url);
  const { provider, keys, edits } = await getAll();
  return { host, hasKey: Boolean(keys[provider]), edits: (edits[host] ?? []).map(({ id, title, enabled }) => ({ id, title, enabled })) };
}

async function generate(tab, { prompt, context }) {
  const host = hostOf(tab.url);
  const { provider, keys, models, prices, spent, edits } = await getAll();
  const apiKey = keys[provider];
  const model = models[provider];
  if (!apiKey) return { error: `Falta a chave da ${PROVIDERS[provider].name}. Coloque nas configurações.` };

  const list = edits[host] ?? [];
  const existing = list.length
    ? "\n\nEdições já existentes neste site (para alterar uma, devolva \"replaces\" com o id):\n" +
      list.map(e => `--- id: ${e.id} | ${e.title}${e.enabled ? "" : " (desligada)"}\n${e.css ? "CSS:\n" + e.css + "\n" : ""}${e.js ? "JS:\n" + e.js + "\n" : ""}`).join("\n")
    : "";

  const user = `Site: ${host}\nURL: ${tab.url}\nTítulo: ${context.title}\n` +
    (context.target ? `\nElemento apontado pelo usuário:\nSeletor: ${context.target.selector}\nCaminho: ${context.target.path}\nHTML:\n${context.target.html}\n` : "") +
    `\nEstrutura da página:\n${context.outline}` + existing + `\n\nPedido: ${prompt}`;

  let reply;
  try {
    reply = await PROVIDERS[provider].complete(apiKey, model, user);
  } catch (e) {
    return { error: e.message };
  }
  const { text } = reply;

  // Cost: OpenRouter reports it; for Anthropic it comes from the prices the options page saved.
  let cost = reply.cost;
  const price = prices[provider]?.[model];
  if (cost == null && price) cost = (reply.input * price.input + reply.output * price.output) / 1e6;
  spent.usd += cost ?? 0;
  spent.requests += 1;
  await browser.storage.local.set({ spent });

  const result = parseJson(text);
  if (!result || (!result.css && !result.js)) return { error: "O modelo não devolveu uma edição válida. Tente explicar de outro jeito." };

  const edit = {
    id: crypto.randomUUID(),
    title: String(result.title || prompt).slice(0, 60),
    prompt,
    css: String(result.css || "").trim(),
    js: String(result.js || "").trim(),
    enabled: true,
    created: Date.now(),
    model,
    tokens: reply.input + reply.output,
    cost,
  };

  // Replacing: remove the old edit's CSS from the page and drop it from the list.
  let replaced = null;
  if (result.replaces) {
    replaced = list.find(e => e.id === result.replaces) ?? null;
    if (replaced?.css) await browser.scripting.removeCSS({ target: { tabId: tab.id }, css: cssFor([replaced]) }).catch(() => {});
  }
  edits[host] = list.filter(e => e !== replaced).concat(edit);
  await browser.storage.local.set({ edits });

  if (edit.css) await browser.scripting.insertCSS({ target: { tabId: tab.id }, css: cssFor([edit]) }).catch(() => {});
  let needsReload = Boolean(replaced?.js);
  if (edit.js && !needsReload) needsReload = !(await runNow(tab.id, edit.js).catch(() => false));

  return { edit: { id: edit.id, title: edit.title, css: Boolean(edit.css), js: Boolean(edit.js) }, needsReload };
}

async function undo(tab, id) {
  const host = hostOf(tab.url);
  const { edits } = await getAll();
  const list = edits[host] ?? [];
  const edit = list.find(e => e.id === id);
  if (!edit) return { needsReload: false };
  edits[host] = list.filter(e => e !== edit);
  if (!edits[host].length) delete edits[host];
  await browser.storage.local.set({ edits });
  if (edit.css) await browser.scripting.removeCSS({ target: { tabId: tab.id }, css: cssFor([edit]) }).catch(() => {});
  return { needsReload: Boolean(edit.js) };
}

function parseJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  for (const candidate of [cleaned, cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1)]) {
    try {
      const obj = JSON.parse(candidate);
      if (obj && typeof obj === "object") return obj;
    } catch {}
  }
  return null;
}
