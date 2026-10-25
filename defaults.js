// Settings shared by background.js and options.js: storage.local keys and defaults.

const DEFAULTS = {
  provider: "openrouter",
  keys: { openrouter: "", anthropic: "" },
  models: { openrouter: "anthropic/claude-sonnet-5.5", anthropic: "claude-sonnet-5-5" },
  // Price per token of the chosen models, saved by the options page (for Anthropic's cost).
  prices: { openrouter: {}, anthropic: {} },
  spent: { usd: 0, requests: 0 },
  edits: {},
};
