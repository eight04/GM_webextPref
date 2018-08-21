/* eslint-env greasemonkey */
/* global $inline */
const {createPref, createView} = require("webext-pref");

const createGMStorage = require("./storage");

function GM_webextPref({
  default: _default,
  body,
  getNewScope,
  getMessage,
  alert,
  confirm,
  prompt
}) {
  const pref = createPref(_default);
  const initializing = pref.connect(createGMStorage());
  let isOpen = false;
  
  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand(`${getTitle()} - Configure`, openDialog);
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
    modal.onclick = e => {
      if (e.target === modal) {
        modal.classList.remove("webext-pref-modal-open");
        modal.addEventListener("transitionend", () => {
          if (destroyView) {
            destroyView();
          }
          modal.remove();
          isOpen = false;
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
          <div class="dialog-body"></div>
        </body>
      </html>
    `;
    
    modal.append(style, iframe);
    document.body.appendChild(modal);
    
    iframe.onload = () => {
      iframe.onload = null;
      
      iframe.contentDocument.querySelector(".dialog-style").textContent = $inline("dialog.css|cssmin|stringify");
      
      destroyView = createView({
        pref,
        body,
        root: iframe.contentDocument.querySelector(".dialog-body"),
        getNewScope,
        getMessage,
        alert,
        confirm,
        prompt
      });
      
      const title = document.createElement("h2");
      title.className = "dialog-title";
      title.textContent = getTitle();
      iframe.contentDocument.querySelector(".webext-pref-toolbar").prepend(title);
      
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
