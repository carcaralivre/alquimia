// Asks the background to apply this site's saved CSS. JS edits are registered as
// user scripts and run on their own; CSS can't be, so it comes through here.

browser.runtime.sendMessage({ action: "page-loaded" });

// Keys typed in the dialog must not reach the site's own shortcuts (X, YouTube,
// Gmail…). The dialog lives in a shadow root, so to the page the target looks like
// a plain element, not a text field. This runs at document_start, before the
// site's listeners, so it gets the keys first.

// Stopping the event here also keeps it from the dialog's own listeners, so
// dialog.js hands its key handling over through alquimiaKey (same sandbox).

for (const type of ["keydown", "keypress", "keyup"]) {
  window.addEventListener(type, event => {
    if (event.target?.id !== "alquimia-host") return;
    event.stopImmediatePropagation();
    if (type === "keydown") globalThis.alquimiaKey?.(event);
  }, true);
}
