const {createPref, createView} = require("webext-pref");

function GM_webextPref({
  default: _default,
  body,
  translate,
  getNewScope
}) {
  const pref = createPref(_default);
  const initializing = pref.connect(createGMStorage());
  
  return Object.assign(pref, {
    ready: () => initializing,
    openDialog
  });
  
  function openDialog() {
    const modal = document.createElement("div");
    modal.className = "webext-pref-modal";
    modal.onclick = e => {
      if (e.target === modal) {
        modal.classList.add("webext-pref-modal-close");
        modal.addEventListener("animationend", () => {
          destroyView();
          modal.remove();
        });
      }
    };
    
    const style = document.createElement("style");
    style.textContent = $inline("style.css|cssmin|stringify") + `
      body {
        padding-right: ${window.innerWidth - document.documentElement.offsetWidth}px;
      }
    `;
    
    const iframe = document.createElement("iframe");
    iframe.className = "webext-pref-iframe";
    iframe.srcdoc = `
      <html>
        <head>
          <style class="dialog-style"></style>
        </head>
        <body>
          <h1 class="dialog-title"></h1>
          <div class="dialog-body"></div>
        </body>
      </html>
    `;
    iframe.contentDocument.querySelector(".dialog-style").textContent = $inline("dialog.css|cssmin|stringify");
    iframe.contentDocument.querySelector(".dialog-title").textContent = getTitle();
    
    const destroyView = createView({
      pref,
      body,
      translate,
      root: iframe.contentDocument.querySelector(".dialog-body"),
      getNewScope
    });
    
    modal.appendChild(iframe);
    document.body.appendChild(modal);
    
    // calc iframe size
    iframe.style = `
      width: ${iframe.contentDocument.body.offsetWidth}px;
      height: ${iframe.contentDocument.body.scrollHeight}px;
    `;
  }
  
  function getTitle() {
    return typeof GM_info === "object" ?
      GM_info.script.name : GM.info.script.name;
  }
}

module.exports = GM_webextPref;
