import { createPref } from 'webext-pref';
import { createUI, createBinding } from 'webext-pref-ui';
import EventLite from 'event-lite';

/* eslint-env greasemonkey */

function createGMStorage() {
  const setValue = typeof GM_setValue === "function" ?
    promisify(GM_setValue) : GM.setValue.bind(GM);
  const getValue = typeof GM_getValue === "function" ?
    promisify(GM_getValue) : GM.getValue.bind(GM);
  const deleteValue = typeof GM_deleteValue === "function" ?
    promisify(GM_deleteValue) : GM.deleteValue.bind(GM);
  const events = new EventLite;
  
  if (typeof GM_addValueChangeListener === "function") {
    GM_addValueChangeListener("webext-pref-message", (name, oldValue, newValue) => {
      const changes = JSON.parse(newValue);
      for (const key of Object.keys(changes)) {
        if (typeof changes[key] === "object" && changes[key].$undefined) {
          changes[key] = undefined;
        }
      }
      events.emit("change", changes);
    });
  }
  
  return Object.assign(events, {getMany, setMany, deleteMany});
  
  function getMany(keys) {
    return Promise.all(keys.map(k => 
      getValue(`webext-pref/${k}`)
        .then(value => [k, typeof value === "string" ? JSON.parse(value) : value])
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
  
  function deleteMany(keys) {
    return Promise.all(keys.map(k => deleteValue(`webext-pref/${k}`)))
      .then(() => {
        if (typeof GM_addValueChangeListener === "function") {
          const changes = {};
          for (const key of keys) {
            changes[key] = {
              $undefined: true
            };
          }
          return setValue("webext-pref-message", JSON.stringify(changes));
        }
        const changes = {};
        for (const key of keys) {
          changes[key] = undefined;
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

/* eslint-env greasemonkey */

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
    style.textContent = "body{overflow:hidden}.webext-pref-modal{position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.5);overflow:auto;z-index:999999;opacity:0;transition:opacity .2s linear;display:flex}.webext-pref-modal-open{opacity:1}.webext-pref-modal::after,.webext-pref-modal::before{content:\"\";display:block;height:30px;visibility:hidden}.webext-pref-iframe-wrap{margin:auto}.webext-pref-iframe{margin:30px 0;display:inline-block;width:100%;max-width:100%;background:#fff;border-width:0;box-shadow:0 0 30px #000;transform:translateY(-20px);transition:transform .2s linear}.webext-pref-modal-open .webext-pref-iframe{transform:none}" + `
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
      
      iframe.contentDocument.querySelector(".dialog-style").textContent = "body{display:inline-block;font-size:16px;font-family:sans-serif;white-space:nowrap;overflow:hidden;margin:0;color:#3d3d3d;line-height:1}input[type=number],input[type=text],select,textarea{display:block;width:100%;box-sizing:border-box;height:2em;font:inherit;padding:0 .3em;border:1px solid #9e9e9e;cursor:pointer}select[multiple],textarea{height:6em}input[type=number]:hover,input[type=text]:hover,select:hover,textarea:hover{border-color:#d5d5d5}input[type=number]:focus,input[type=text]:focus,select:focus,textarea:focus{cursor:auto;border-color:#3a93ee}textarea{line-height:1.5}input[type=checkbox],input[type=radio]{display:inline-block;width:1em;height:1em;font:inherit;margin:0}button{box-sizing:border-box;height:2em;font:inherit;border:1px solid #9e9e9e;cursor:pointer;background:0 0}button:hover{border-color:#d5d5d5}button:focus{border-color:#3a93ee}.dialog-body{margin:2em}.webext-pref-toolbar{display:flex;align-items:center;margin-bottom:1em}.dialog-title{font-size:1.34em;margin:0 2em 0 0;flex-grow:1}.webext-pref-toolbar button{font-size:.7em;margin-left:.5em}.webext-pref-nav{display:flex;margin-bottom:1em}.webext-pref-nav select{text-align:center;text-align-last:center}.webext-pref-nav button{width:2em}.webext-pref-number,.webext-pref-radiogroup,.webext-pref-select,.webext-pref-text,.webext-pref-textarea{margin:1em 0}.webext-pref-body>:first-child{margin-top:0}.webext-pref-body>:last-child{margin-bottom:0}.webext-pref-number>input,.webext-pref-select>select,.webext-pref-text>input,.webext-pref-textarea>textarea{margin:.3em 0}.webext-pref-checkbox,.webext-pref-radio{margin:.5em 0;padding-left:1.5em}.webext-pref-checkbox>input,.webext-pref-radio>input{margin-left:-1.5em;margin-right:.5em;vertical-align:middle}.webext-pref-checkbox>label,.webext-pref-radio>label{cursor:pointer;vertical-align:middle}.webext-pref-checkbox>label:hover,.webext-pref-radio>label:hover{color:#707070}.webext-pref-checkbox-children,.webext-pref-radio-children{margin:.7em 0 0;padding:0;border-width:0}.webext-pref-checkbox-children[disabled],.webext-pref-radio-children[disabled]{opacity:.5}.webext-pref-checkbox-children>:first-child,.webext-pref-radio-children>:first-child{margin-top:0}.webext-pref-checkbox-children>:last-child,.webext-pref-radio-children>:last-child{margin-bottom:0}.webext-pref-checkbox-children>:last-child>:last-child,.webext-pref-radio-children>:last-child>:last-child{margin-bottom:0}.webext-pref-help{color:#969696}.responsive{white-space:normal}.responsive .dialog-body{margin:1em}.responsive .webext-pref-toolbar{display:block}.responsive .dialog-title{margin:0 0 1em 0}.responsive .webext-pref-toolbar button{font-size:1em}.responsive .webext-pref-nav{display:block}";
      
      const root = iframe.contentDocument.querySelector(".dialog-body");
      root.append(createUI({
        body,
        getMessage
      }));
      
      destroyView = createBinding({
        pref,
        
        root,
        getMessage,
        getNewScope,
        
        alert,
        confirm,
        prompt
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

export default GM_webextPref;
