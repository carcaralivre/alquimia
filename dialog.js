// Injected by the toolbar button. Runs once per page; later clicks only toggle.

(() => {
  if (globalThis.alquimia) {
    globalThis.alquimia.toggle();
    return;
  }
  // A dialog left by a previous version of the extension (reloaded or updated)
  // can't talk to this one any more; replace it.
  document.getElementById("alquimia-host")?.remove();
  document.getElementById("alquimia-pick")?.remove();

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .dialog {
      position: fixed;
      top: 12vh;
      left: 50%;
      transform: translateX(-50%);
      width: min(560px, calc(100vw - 32px));
      pointer-events: auto;
      font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1b1b1f;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, .1);
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .25);
      overflow: hidden;
    }
    .dialog[hidden] { display: none; }
    header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px 0;
    }
    header .logo { width: 18px; height: 18px; flex: none; }
    header .name { font-weight: 600; }
    header .host { color: #6b6b73; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    header .spacer { flex: 1; }
    button {
      all: unset;
      cursor: pointer;
      border-radius: 8px;
      font: inherit;
    }
    button:focus-visible { outline: 2px solid #9059ff; outline-offset: 1px; }
    .icon-button {
      width: 28px; height: 28px;
      display: inline-flex; align-items: center; justify-content: center;
      color: #6b6b73;
    }
    .icon-button:hover { background: rgba(0, 0, 0, .06); color: #1b1b1f; }
    .icon-button svg { width: 16px; height: 16px; }
    textarea {
      all: unset;
      box-sizing: border-box;
      display: block;
      width: 100%;
      height: 60px;
      max-height: 40vh;
      padding: 12px 14px 6px;
      font: inherit;
      font-size: 16px;
      line-height: 1.4;
      resize: none;
      overflow-y: auto;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
    textarea::placeholder { color: #9a9aa3; }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px 10px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 60%;
      padding: 3px 6px 3px 10px;
      border-radius: 999px;
      background: rgba(144, 89, 255, .12);
      color: #5a2fd6;
      font-size: 13px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chip button { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; }
    .chip button:hover { background: rgba(0, 0, 0, .1); }
    .chip[hidden] { display: none; }
    .send {
      padding: 6px 14px;
      background: #9059ff;
      color: #fff;
      font-weight: 600;
    }
    .send:hover { background: #7f45f5; }
    .send:disabled { opacity: .5; cursor: default; }
    .pick-button { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; color: #6b6b73; font-size: 13px; }
    .pick-button:hover { background: rgba(0, 0, 0, .06); color: #1b1b1f; }
    .pick-button svg { width: 15px; height: 15px; }
    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-top: 1px solid rgba(0, 0, 0, .08);
      font-size: 13px;
      color: #4b4b52;
    }
    .status[hidden] { display: none; }
    .status .spin {
      width: 14px; height: 14px; flex: none;
      border: 2px solid rgba(144, 89, 255, .25);
      border-top-color: #9059ff;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status .text { flex: 1; }
    .status.error { color: #c2372f; }
    .status .link { color: #5a2fd6; font-weight: 600; padding: 2px 6px; }
    .status .link:hover { background: rgba(144, 89, 255, .12); }
    .hint {
      padding: 6px 14px 10px;
      font-size: 12px;
      color: #9a9aa3;
    }
    .banner {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: auto;
      padding: 8px 14px;
      border-radius: 999px;
      background: #1b1b1f;
      color: #fff;
      font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 8px 24px rgba(0, 0, 0, .3);
    }
    .banner[hidden] { display: none; }
    .banner kbd { font: inherit; padding: 0 4px; border-radius: 4px; background: rgba(255, 255, 255, .2); }
    @media (prefers-color-scheme: dark) {
      .dialog { color: #ecebf0; background: #23222a; border-color: rgba(255, 255, 255, .12); }
      header .host, .hint { color: #8f8e99; }
      .icon-button, .pick-button { color: #a3a2ad; }
      .icon-button:hover, .pick-button:hover { background: rgba(255, 255, 255, .08); color: #fff; }
      .chip { background: rgba(144, 89, 255, .25); color: #cbb8ff; }
      .status { border-top-color: rgba(255, 255, 255, .1); color: #c9c8d2; }
      .status .link { color: #cbb8ff; }
      .status.error { color: #ff8f85; }
      textarea::placeholder { color: #7a7985; }
    }
  `;

  const LOGO = `<svg viewBox="0 0 16 16" fill="none" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="13" y2="14.5"><stop offset="0" stop-color="#9059ff"/><stop offset="1" stop-color="#0090ed"/></linearGradient></defs><path d="M5 1.5h4M6 1.5v4.3L2.4 12a1.9 1.9 0 0 0 1.7 2.5h5.8a1.9 1.9 0 0 0 1.7-2.5L8 5.8V1.5M4 10.5h5.6" stroke="url(#g)"/><path d="M12.5 2.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" stroke="#ff9f00"/></svg>`;
  const GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  const CLOSE = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;
  const CROSSHAIR = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="8" cy="8" r="4.5"/><path d="M8 1v3M8 12v3M1 8h3M12 8h3"/></svg>`;

  const host = document.createElement("div");
  host.id = "alquimia-host";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>${STYLE}</style>
    <div class="dialog" role="dialog" aria-label="Alquimia">
      <header>
        <span class="logo">${LOGO}</span>
        <span class="name">Alquimia</span>
        <span class="host"></span>
        <span class="spacer"></span>
        <button class="icon-button settings" title="Configurações">${GEAR}</button>
        <button class="icon-button close" title="Fechar (Esc)">${CLOSE}</button>
      </header>
      <textarea placeholder="O que você quer mudar nesta página?"></textarea>
      <div class="row">
        <button class="pick-button" title="Clique em um elemento da página para se referir a ele">${CROSSHAIR}<span>Apontar elemento</span></button>
        <span class="chip" hidden><span class="label"></span><button title="Tirar elemento">${CLOSE}</button></span>
        <span class="spacer" style="flex:1"></span>
        <button class="send">Transformar</button>
      </div>
      <div class="status" hidden></div>
      <div class="hint">Enter envia · Shift+Enter quebra a linha · Esc fecha</div>
    </div>
    <div class="banner" hidden>Clique no elemento que você quer mudar · <kbd>Esc</kbd> cancela</div>
  `;
  document.documentElement.append(host);

  const $ = s => root.querySelector(s);
  const dialog = $(".dialog");
  const banner = $(".banner");
  const textarea = $("textarea");
  const chip = $(".chip");
  const status = $(".status");
  const send = $(".send");

  let target = null;
  let busy = false;

  // ---- Open / close ----

  function open() {
    dialog.hidden = false;
    textarea.focus();
    checkKey();
  }

  const ORPHANED = "A Alquimia foi recarregada. Recarregue a página para continuar.";

  // Shows (or clears) the missing-key warning; also runs when the settings change.
  async function checkKey() {
    const s = await browser.runtime.sendMessage({ action: "state" }).catch(() => null);
    if (!s) return showStatus(ORPHANED, { error: true, link: ["Recarregar", () => location.reload()] });
    $(".host").textContent = s.host ?? "";
    if (!s.hasKey) showStatus("Falta a chave da API.", { error: true, link: ["Configurações", openOptions] });
    else if (status.dataset.keyWarning) hideStatus();
    status.dataset.keyWarning = s.hasKey ? "" : "1";
  }
  browser.storage.onChanged.addListener(changes => {
    if ((changes.keys || changes.provider) && !busy) checkKey();
  });

  function close() {
    stopPicking();
    dialog.hidden = true;
  }

  function toggle() {
    dialog.hidden ? open() : close();
  }

  function openOptions() {
    browser.runtime.sendMessage({ action: "open-options" });
    close();
  }

  // ---- Status line ----

  function showStatus(text, { error = false, spinner = false, link = null } = {}) {
    status.hidden = false;
    status.classList.toggle("error", error);
    status.replaceChildren();
    if (spinner) status.append(Object.assign(document.createElement("span"), { className: "spin" }));
    status.append(Object.assign(document.createElement("span"), { className: "text", textContent: text }));
    if (link) {
      const b = Object.assign(document.createElement("button"), { className: "link", textContent: link[0] });
      b.addEventListener("click", link[1]);
      status.append(b);
    }
  }

  function hideStatus() {
    status.hidden = true;
  }

  // ---- Element picker ----

  let picking = false;
  let highlight = null;
  let hovered = null;

  function startPicking() {
    picking = true;
    dialog.hidden = true;
    banner.hidden = false;
    highlight = document.createElement("div");
    highlight.id = "alquimia-pick";
    document.documentElement.append(highlight);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onPick, true);
    document.addEventListener("keydown", onPickKey, true);
  }

  function stopPicking() {
    if (!picking) return;
    picking = false;
    banner.hidden = true;
    highlight?.remove();
    highlight = null;
    hovered = null;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onPick, true);
    document.removeEventListener("keydown", onPickKey, true);
  }

  function pickable(el) {
    return !el || el === host || el === highlight || host.contains(el) ? null : el;
  }

  function onMove(event) {
    const el = pickable(document.elementFromPoint(event.clientX, event.clientY));
    if (!el) return;
    hovered = el;
    const r = el.getBoundingClientRect();
    Object.assign(highlight.style, { top: r.top + "px", left: r.left + "px", width: r.width + "px", height: r.height + "px" });
  }

  function onPick(event) {
    event.preventDefault();
    event.stopPropagation();
    const el = pickable(document.elementFromPoint(event.clientX, event.clientY)) ?? hovered;
    stopPicking();
    if (el) setTarget(el);
    dialog.hidden = false;
    textarea.focus();
  }

  function onPickKey(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    stopPicking();
    dialog.hidden = false;
    textarea.focus();
  }

  function setTarget(el) {
    target = { selector: selectorFor(el), path: pathFor(el), html: htmlFor(el) };
    chip.hidden = false;
    $(".chip .label").textContent = target.selector;
    chip.title = target.selector;
  }

  function clearTarget() {
    target = null;
    chip.hidden = true;
  }

  // Prefers ids, then stable classes; falls back to nth-of-type up to the nearest id.
  const unstableClass = c => /\d/.test(c) || c.length > 32 || c.startsWith("css-") || c.startsWith("sc-");

  function selectorFor(el) {
    const parts = [];
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      if (node.id && !/\d{3,}/.test(node.id)) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        break;
      }
      let part = node.localName;
      const classes = [...node.classList].filter(c => !unstableClass(c)).slice(0, 2);
      if (classes.length) part += classes.map(c => `.${CSS.escape(c)}`).join("");
      const parent = node.parentElement;
      if (parent && node.localName !== "body") {
        const same = [...parent.children].filter(s => s.localName === node.localName);
        const unique = parent.querySelectorAll(`:scope > ${part}`).length === 1;
        if (!unique && same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      if (node.localName === "body") break;
      if (document.querySelectorAll(parts.join(" > ")).length === 1 && parts.length >= 2) break;
    }
    return parts.join(" > ");
  }

  function pathFor(el) {
    const chain = [];
    for (let node = el; node && node !== document.body && chain.length < 8; node = node.parentElement) {
      chain.unshift(describe(node));
    }
    return chain.join(" > ");
  }

  function describe(node) {
    let s = node.localName;
    if (node.id) s += `#${node.id}`;
    const classes = [...node.classList].filter(c => !unstableClass(c)).slice(0, 3);
    if (classes.length) s += "." + classes.join(".");
    for (const a of ["role", "aria-label", "data-testid", "name"]) {
      const v = node.getAttribute(a);
      if (v) s += `[${a}="${v.slice(0, 40)}"]`;
    }
    return s;
  }

  function htmlFor(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("script, style, svg, noscript, iframe").forEach(n => n.replaceWith(`<${n.localName}/>`));
    let html = clone.outerHTML.replace(/\s+/g, " ");
    if (html.length > 1500) {
      const text = el.textContent.replace(/\s+/g, " ").trim().slice(0, 300);
      html = `${describe(el)} (${el.children.length} filhos, HTML longo) texto: "${text}"`;
    }
    return html;
  }

  // Compact outline of the page: landmarks and containers, three levels deep.
  function outline() {
    const lines = [];
    const SKIP = new Set(["script", "style", "link", "meta", "svg", "path", "noscript", "br", "template"]);
    const walk = (node, depth) => {
      if (lines.length >= 120) return;
      for (const child of node.children) {
        if (SKIP.has(child.localName) || child === host) continue;
        const text = child.children.length === 0 ? child.textContent.replace(/\s+/g, " ").trim().slice(0, 40) : "";
        lines.push("  ".repeat(depth) + describe(child) + (text ? ` "${text}"` : ""));
        if (depth < 2) walk(child, depth + 1);
      }
    };
    walk(document.body, 0);
    return lines.join("\n");
  }

  // ---- Send ----

  async function submit() {
    const prompt = textarea.value.trim();
    if (!prompt || busy) return;
    busy = true;
    send.disabled = true;
    showStatus("Transformando…", { spinner: true });
    const context = { title: document.title, outline: outline(), target };
    let result;
    try {
      result = await browser.runtime.sendMessage({ action: "generate", prompt, context });
    } catch (e) {
      result = { error: /receiving end/i.test(e.message) ? ORPHANED : e.message };
    }
    busy = false;
    send.disabled = false;
    if (!result || result.error) {
      if (result?.error === ORPHANED) return showStatus(ORPHANED, { error: true, link: ["Recarregar", () => location.reload()] });
      const needsKey = /chave/i.test(result?.error ?? "");
      showStatus(result?.error ?? "Deu errado.", { error: true, link: needsKey ? ["Configurações", openOptions] : null });
      return;
    }
    textarea.value = "";
    fitTextarea();
    clearTarget();
    const what = result.edit.js && result.edit.css ? "CSS e JS" : result.edit.js ? "JS" : "CSS";
    const text = result.needsReload
      ? `Pronto: "${result.edit.title}" (${what}). Recarregue a página para ver.`
      : `Pronto: "${result.edit.title}" (${what}).`;
    const id = result.edit.id;
    showStatus(text, { link: ["Desfazer", () => undo(id, result.edit.js)] });
    if (result.needsReload) {
      status.append(linkButton("Recarregar", () => location.reload()));
    }
  }

  function linkButton(label, onClick) {
    const b = Object.assign(document.createElement("button"), { className: "link", textContent: label });
    b.addEventListener("click", onClick);
    return b;
  }

  async function undo(id, hadJs) {
    showStatus("Desfazendo…", { spinner: true });
    const { needsReload } = await browser.runtime.sendMessage({ action: "undo", id }).catch(() => ({ needsReload: true }));
    if (needsReload || hadJs) {
      showStatus("Edição apagada. Recarregue para desfazer o JS.");
      status.append(linkButton("Recarregar", () => location.reload()));
    } else {
      showStatus("Edição desfeita.");
    }
  }

  // ---- Events ----

  $(".close").addEventListener("click", close);
  $(".settings").addEventListener("click", openOptions);
  $(".pick-button").addEventListener("click", startPicking);
  $(".chip button").addEventListener("click", clearTarget);
  send.addEventListener("click", submit);
  // Called by loader.js, which catches the dialog's keys before the site's
  // shortcuts can; the event never reaches listeners inside the shadow root.
  globalThis.alquimiaKey = event => {
    if (event.key === "Enter" && !event.shiftKey && root.activeElement === textarea) {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };
  // Grows with the text, never below the initial two lines.
  function fitTextarea() {
    textarea.style.height = "";
    const min = parseFloat(getComputedStyle(textarea).height);
    textarea.style.height = Math.max(min, textarea.scrollHeight) + "px";
  }
  textarea.addEventListener("input", () => {
    fitTextarea();
    if (!busy) hideStatus();
  });
  // Clicks reach the page through the host (pointer-events: none), so a click
  // anywhere but the dialog itself closes it.
  document.addEventListener("mousedown", event => {
    if (!dialog.hidden && !picking && event.target !== host) close();
  }, true);

  globalThis.alquimia = { toggle };
  open();
})();
