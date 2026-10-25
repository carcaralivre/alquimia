const $ = s => document.querySelector(s);

// ---- Provider, API key and model ----

const PROVIDERS = {
  openrouter: {
    placeholder: "sk-or-v1-…",
    help: "Crie uma chave em openrouter.ai/keys. Os preços são por 1 milhão de tokens, entrada / saída, em dólar.",
    // OpenRouter lists every model with its price.
    async models(apiKey) {
      const res = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!res.ok) throw new Error(`OpenRouter respondeu ${res.status}.`);
      const { data } = await res.json();
      return data
        .filter(m => !m.id.endsWith(":batch") && !m.id.endsWith(":free") && m.architecture?.output_modalities?.includes("text"))
        .map(m => ({ id: m.id, name: m.name, input: Number(m.pricing?.prompt) * 1e6, output: Number(m.pricing?.completion) * 1e6 }));
    },
  },
  anthropic: {
    placeholder: "sk-ant-…",
    help: "Crie uma chave em console.anthropic.com. A API é cobrada por uso, à parte da assinatura do Claude. Os preços são por 1 milhão de tokens, entrada / saída, em dólar.",
    // Anthropic lists its models without prices; those come from OpenRouter's public list.
    async models(apiKey) {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=100", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
      if (!res.ok) throw new Error(`Anthropic respondeu ${res.status}.`);
      const { data } = await res.json();
      const prices = new Map();
      try {
        const or = await (await fetch("https://openrouter.ai/api/v1/models")).json();
        for (const m of or.data) {
          if (m.id.startsWith("anthropic/")) prices.set(m.id.slice(10).replaceAll(".", "-"), m.pricing);
        }
      } catch {}
      return data.map(m => {
        const p = prices.get(m.id.replace(/-\d{8}$/, ""));
        return { id: m.id, name: m.display_name, input: p ? Number(p.prompt) * 1e6 : null, output: p ? Number(p.completion) * 1e6 : null };
      });
    },
  },
};

let settings;
let modelList = [];

async function loadSettings() {
  settings = await browser.storage.local.get(DEFAULTS);
  $(`input[name="provider"][value="${settings.provider}"]`).checked = true;
  showProvider();
}

function showProvider() {
  const { provider } = settings;
  $("#apiKey").value = settings.keys[provider];
  $("#apiKey").placeholder = PROVIDERS[provider].placeholder;
  $("#keyHelp").textContent = PROVIDERS[provider].help;
  $("#filter").value = "";
  loadModels();
}

let savedTimer;
function save(values) {
  Object.assign(settings, values);
  browser.storage.local.set(values).then(() => {
    $("#saved").textContent = "Salvo.";
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => ($("#saved").textContent = ""), 1500);
  });
}

for (const radio of document.querySelectorAll('input[name="provider"]')) {
  radio.addEventListener("change", () => {
    save({ provider: radio.value });
    showProvider();
  });
}

$("#apiKey").addEventListener("change", () => {
  const keys = { ...settings.keys, [settings.provider]: $("#apiKey").value.trim() };
  save({ keys });
  loadModels();
});

async function loadModels() {
  const { provider } = settings;
  const apiKey = settings.keys[provider];
  const select = $("#models");
  select.hidden = $("#filter").hidden = true;
  modelList = [];
  if (!apiKey) {
    $("#modelHelp").textContent = `Modelo atual: ${settings.models[provider]}. Coloque a chave para escolher outro.`;
    return;
  }
  $("#modelHelp").textContent = "Carregando modelos…";
  try {
    modelList = await PROVIDERS[provider].models(apiKey);
  } catch (e) {
    $("#modelHelp").textContent = `Não deu para listar os modelos: ${e.message} Modelo atual: ${settings.models[provider]}.`;
    return;
  }
  if (settings.provider !== provider) return;
  modelList.sort((a, b) => a.id.localeCompare(b.id));
  select.hidden = $("#filter").hidden = false;
  renderModels();
}

const money = n => n == null ? "?" : n === 0 ? "grátis" : "$" + (n < 1 ? n.toFixed(2) : n.toFixed(n < 10 ? 2 : 0));

function renderModels() {
  const select = $("#models");
  const filter = $("#filter").value.trim().toLowerCase();
  const current = settings.models[settings.provider];
  select.replaceChildren();
  for (const m of modelList) {
    if (filter && !`${m.id} ${m.name}`.toLowerCase().includes(filter)) continue;
    const option = new Option(`${m.id}  —  ${money(m.input)} / ${money(m.output)}`, m.id, false, m.id === current);
    select.append(option);
  }
  const chosen = modelList.find(m => m.id === current);
  $("#modelHelp").textContent = chosen
    ? `Modelo atual: ${chosen.name}, ${money(chosen.input)} entrada / ${money(chosen.output)} saída por 1M tokens. Uma edição costuma usar uns 5 mil tokens.`
    : `Modelo atual: ${current} (não está na lista).`;
  select.selectedOptions[0]?.scrollIntoView({ block: "nearest" });
}

$("#filter").addEventListener("input", renderModels);
$("#models").addEventListener("change", () => {
  const id = $("#models").value;
  const models = { ...settings.models, [settings.provider]: id };
  const chosen = modelList.find(m => m.id === id);
  const prices = { ...settings.prices };
  if (chosen?.input != null) prices[settings.provider] = { ...prices[settings.provider], [id]: { input: chosen.input, output: chosen.output } };
  save({ models, prices });
  renderModels();
});

// ---- Spend ----

const usd = n => "US$ " + (n < 0.01 ? n.toFixed(4) : n < 1 ? n.toFixed(3) : n.toFixed(2));

async function loadSpent() {
  const { spent } = await browser.storage.local.get(DEFAULTS);
  $("#spent").textContent = spent.requests
    ? `Gasto por esta extensão: ${usd(spent.usd)} em ${spent.requests} ${spent.requests === 1 ? "pedido" : "pedidos"}. Conta só o que passou por aqui; o saldo da sua conta fica no site do provedor.`
    : "Nenhum pedido feito ainda.";
}

// ---- userScripts permission (optional-only in Firefox) ----

async function loadPermission() {
  const granted = await browser.permissions.contains({ permissions: ["userScripts"] });
  $("#jsHelp").textContent = granted
    ? "Permitido. As edições em JavaScript rodam nos sites."
    : "O Firefox pede uma permissão à parte para rodar JavaScript nas páginas. Sem ela, só as edições em CSS funcionam.";
  $("#grantJs").hidden = granted;
}

$("#grantJs").addEventListener("click", async () => {
  await browser.permissions.request({ permissions: ["userScripts"] });
  loadPermission();
});

// ---- Edits per site ----

async function loadEdits() {
  const { edits } = await browser.storage.local.get(DEFAULTS);
  const container = $("#sites");
  container.replaceChildren();
  const hosts = Object.keys(edits).sort();
  if (!hosts.length) {
    container.append(Object.assign(document.createElement("p"), { className: "empty", textContent: "Nenhuma edição ainda. Abra um site, clique no ícone da Alquimia e peça uma mudança." }));
    return;
  }
  for (const host of hosts) container.append(siteCard(host, edits[host]));
}

function siteCard(host, list) {
  const card = el("div", { className: "site" });
  const header = el("header");
  header.append(el("b", { textContent: host }));
  header.append(button("Apagar tudo", "danger", async () => {
    if (!confirm(`Apagar as ${list.length} edições de ${host}?`)) return;
    const { edits } = await browser.storage.local.get(DEFAULTS);
    delete edits[host];
    await browser.storage.local.set({ edits });
  }));
  card.append(header);
  for (const edit of list.slice().sort((a, b) => b.created - a.created)) card.append(editRow(host, edit));
  return card;
}

function editRow(host, edit) {
  const row = el("div", { className: "edit" });
  row.dataset.enabled = edit.enabled;

  const toggle = el("input", { type: "checkbox", checked: edit.enabled, title: edit.enabled ? "Desligar" : "Ligar" });
  toggle.addEventListener("change", () => update(host, edit.id, e => (e.enabled = toggle.checked)));

  const info = el("div", { className: "info" });
  info.append(el("div", { className: "title", textContent: edit.title }));
  if (edit.prompt && edit.prompt !== edit.title) info.append(el("div", { className: "prompt", textContent: edit.prompt, title: edit.prompt }));
  const kind = [edit.css && "CSS", edit.js && "JS"].filter(Boolean).join(" + ");
  const when = new Date(edit.created).toLocaleDateString("pt-BR");
  const cost = edit.cost != null ? ` · ${usd(edit.cost)}` : "";
  info.append(el("div", { className: "kind", textContent: `${kind} · ${when}${cost}` }));
  const details = el("details");
  details.append(el("summary", { textContent: "Ver código" }));
  if (edit.css) details.append(el("pre", { textContent: edit.css }));
  if (edit.js) details.append(el("pre", { textContent: edit.js }));
  info.append(details);

  row.append(toggle, info, button("Apagar", "danger", () => update(host, edit.id, null)));
  return row;
}

// Applies `fn` to one edit, or removes it when `fn` is null.
async function update(host, id, fn) {
  const { edits } = await browser.storage.local.get(DEFAULTS);
  const list = edits[host] ?? [];
  if (fn) list.forEach(e => e.id === id && fn(e));
  else edits[host] = list.filter(e => e.id !== id);
  if (!edits[host]?.length) delete edits[host];
  await browser.storage.local.set({ edits });
}

function el(tag, props = {}) {
  return Object.assign(document.createElement(tag), props);
}

function button(text, className, onClick) {
  const b = el("button", { type: "button", textContent: text, className });
  b.addEventListener("click", onClick);
  return b;
}

loadSettings();
loadPermission();
loadEdits();
loadSpent();
browser.storage.onChanged.addListener(changes => {
  if (changes.edits) loadEdits();
  if (changes.spent) loadSpent();
});
