// Toolbar icon drawn in the theme's own icon color. The default theme declares
// no colors, so it falls back to the manifest's theme_icons, which use Firefox
// Nova's icon fill. The glyph is icons/toolbar-dark.svg, recolored here; keep
// toolbar-dark.svg and toolbar-light.svg identical except for the color.

async function paintIcon() {
  const { colors } = await browser.theme.getCurrent();
  let color = colors?.icons || colors?.toolbar_text || colors?.bookmark_text || colors?.tab_background_text;
  if (Array.isArray(color)) color = `rgb(${color.join(",")})`;
  if (!color) return browser.action.setIcon({ path: null });

  const svg = (await (await fetch(browser.runtime.getURL("icons/toolbar-dark.svg"))).text())
    .replace("<svg ", '<svg width="32" height="32" ')
    .replace(/ stroke="[^"]*"/, ` stroke="${color}"`);
  const img = new Image();
  img.src = "data:image/svg+xml," + encodeURIComponent(svg);
  await img.decode();
  const imageData = {};
  for (const size of [16, 32]) {
    const ctx = new OffscreenCanvas(size, size).getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    imageData[size] = ctx.getImageData(0, 0, size, size);
  }
  await browser.action.setIcon({ imageData });
}

browser.runtime.onInstalled.addListener(paintIcon);
browser.runtime.onStartup.addListener(paintIcon);
browser.theme.onUpdated.addListener(paintIcon);
