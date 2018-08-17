/* eslint-env greasemonkey */
/* global $inline GM_addValueChangeListener */
const {createPref, createView} = require("webext-pref");
const EventLite = require("event-lite");

function GM_webextPref({
  default: _default,
  body,
  translate,
  getNewScope
}) {
  const pref = createPref(_default);
  const initializing = pref.connect(createGMStorage());
  let isOpen = false;
  
  return Object.assign(pref, {
    ready: () => initializing,
    openDialog
  });
  
  function openDialog() {
    if (isOpen) {
      return;
    }
    isOpen = true;
    const modal = document.createElement("div");
    modal.className = "webext-pref-modal";
    modal.onclick = e => {
      if (e.target === modal) {
        modal.classList.remove("webext-pref-modal-open");
        modal.addEventListener("transitionend", () => {
          destroyView(); // eslint-disable-line no-use-before-define
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
    
    modal.classList.add("webext-pref-modal-open");
  }
  
  function getTitle() {
    return typeof GM_info === "object" ?
      GM_info.script.name : GM.info.script.name;
  }
}

function createGMStorage() {
  const setValue = typeof GM_setValue === "function" ? promisify(GM_setValue) : GM.setValue.bind(GM);
  const getValue = typeof GM_getValue === "function" ? promisify(GM_getValue) : GM.getValue.bind(GM);
  const events = new EventLite;
  
  if (typeof GM_addValueChangeListener === "function") {
    GM_addValueChangeListener("webext-pref-message", (name, oldValue, newValue) => {
      events.emit("change", JSON.parse(newValue));
    });
  }
  
  return Object.assign(events, {getMany, setMany});
  
  function getMany(keys) {
    return Promise.all(keys.map(k => 
      getValue(`webext-pref/${k}`)
        .then(value => [k, JSON.parse(value)])
    ))
      .then(entries => {
        const output = {};
        for (const [key, value] of entries) {
          output[key] = value;
        }
        return output;
      });
  }
  
  function setMany(changes) {
    return Promise.all(Object.entries(changes).map(([key, value]) => 
      setValue(`webext-pref/${key}`, JSON.stringify(value))
    ))
      .then(() => {
        if (typeof GM_addValueChangeListener === "function") {
          return setValue("webext-pref-message", JSON.stringify(changes));
        }
        events.emit("change", changes);
      });
  }
  
  function promisify(fn) {
    return (...args) => {
      try {
        return Promise.resolve(fn(...args));
      } catch (err) {
        return Promise.reject(err);
      }
    };
  }
}

module.exports = GM_webextPref;
