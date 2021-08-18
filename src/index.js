/* eslint-env greasemonkey */
/* global $inline */
const {createPref} = require("webext-pref");
const {createUI, createBinding} = require("webext-pref-ui");

const createGMStorage = require("./storage");

function GM_webextPref(options) {
  const pref = createPref(options.default, options.separator);
  const initializing = pref.connect(createGMStorage());
  let isOpen = false;
  
  const registerMenu = 
    typeof GM_registerMenuCommand === "function" ? GM_registerMenuCommand :
    typeof GM !== "undefined" && GM && GM.registerMenuCommand ? GM.registerMenuCommand.bind(GM) :
    undefined;
    
  if (registerMenu) {
    registerMenu(`${getTitle()} - Configure`, openDialog);
  }
  
  return Object.assign(pref, {
    ready: () => initializing,
    openDialog
  });
  
  function openDialog() {
    if (isOpen) {
      return;
    }
    isOpen = true;
    
    let destroyView;
    
    const modal = document.createElement("div");
    modal.className = "webext-pref-modal";
    modal.onclick = () => {
      modal.classList.remove("webext-pref-modal-open");
      modal.addEventListener("transitionend", () => {
        if (destroyView) {
          destroyView();
        }
        modal.remove();
        isOpen = false;
      });
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
          <div class="dialog-body"></div>
        </body>
      </html>
    `;
    
    const wrap = document.createElement("div");
    wrap.className = "webext-pref-iframe-wrap";
    
    wrap.append(iframe);
    modal.append(style, wrap);
    document.body.appendChild(modal);
    
    iframe.onload = () => {
      iframe.onload = null;
      
      iframe.contentDocument.querySelector(".dialog-style").textContent = $inline("dialog.css|cssmin|stringify");
      
      const root = iframe.contentDocument.querySelector(".dialog-body");
      root.append(createUI(options));
      
      destroyView = createBinding({
        pref,
        root,
        ...options
      });
      
      const title = document.createElement("h2");
      title.className = "dialog-title";
      title.textContent = getTitle();
      iframe.contentDocument.querySelector(".webext-pref-toolbar").prepend(title);
      
      if (iframe.contentDocument.body.offsetWidth > modal.offsetWidth) {
        iframe.contentDocument.body.classList.add("responsive");
      }
      
      // calc iframe size
      iframe.style = `
        width: ${iframe.contentDocument.body.offsetWidth}px;
        height: ${iframe.contentDocument.body.scrollHeight}px;
      `;
      
      modal.classList.add("webext-pref-modal-open");
    };
  }
  
  function getTitle() {
    return typeof GM_info === "object" ?
      GM_info.script.name : GM.info.script.name;
  }
}

module.exports = GM_webextPref;
