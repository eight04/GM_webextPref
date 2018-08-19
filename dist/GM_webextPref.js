// ==UserScript==
// @name GM_webextPref
// @version 0.1.3
// @description A config library powered by webext-pref.
// @license MIT
// @author eight04 <eight04@gmail.com>
// @homepageURL https://github.com/eight04/GM_webextPref
// @supportURL https://github.com/eight04/GM_webextPref/issues
// @namespace eight04.blogspot.com
// @grant GM_getValue
// @grant GM.getValue
// @grant GM_setValue
// @grant GM.setValue
// @grant GM_addValueChangeListener
// @grant GM_registerMenuCommand
// @include *
// ==/UserScript==

var GM_webextPref = (function () {
  'use strict';

  /**
   * event-lite.js - Light-weight EventEmitter (less than 1KB when gzipped)
   *
   * @copyright Yusuke Kawasaki
   * @license MIT
   * @constructor
   * @see https://github.com/kawanet/event-lite
   * @see http://kawanet.github.io/event-lite/EventLite.html
   * @example
   * var EventLite = require("event-lite");
   *
   * function MyClass() {...}             // your class
   *
   * EventLite.mixin(MyClass.prototype);  // import event methods
   *
   * var obj = new MyClass();
   * obj.on("foo", function() {...});     // add event listener
   * obj.once("bar", function() {...});   // add one-time event listener
   * obj.emit("foo");                     // dispatch event
   * obj.emit("bar");                     // dispatch another event
   * obj.off("foo");                      // remove event listener
   */

  function EventLite() {
    if (!(this instanceof EventLite)) return new EventLite();
  }

  const _module_ = {exports: {}};
  (function(EventLite) {
    // export the class for node.js
    if ("undefined" !== typeof _module_) _module_.exports = EventLite;

    // property name to hold listeners
    var LISTENERS = "listeners";

    // methods to export
    var methods = {
      on: on,
      once: once,
      off: off,
      emit: emit
    };

    // mixin to self
    mixin(EventLite.prototype);

    // export mixin function
    EventLite.mixin = mixin;

    /**
     * Import on(), once(), off() and emit() methods into target object.
     *
     * @function EventLite.mixin
     * @param target {Prototype}
     */

    function mixin(target) {
      for (var key in methods) {
        target[key] = methods[key];
      }
      return target;
    }

    /**
     * Add an event listener.
     *
     * @function EventLite.prototype.on
     * @param type {string}
     * @param func {Function}
     * @returns {EventLite} Self for method chaining
     */

    function on(type, func) {
      getListeners(this, type).push(func);
      return this;
    }

    /**
     * Add one-time event listener.
     *
     * @function EventLite.prototype.once
     * @param type {string}
     * @param func {Function}
     * @returns {EventLite} Self for method chaining
     */

    function once(type, func) {
      var that = this;
      wrap.originalListener = func;
      getListeners(that, type).push(wrap);
      return that;

      function wrap() {
        off.call(that, type, wrap);
        func.apply(this, arguments);
      }
    }

    /**
     * Remove an event listener.
     *
     * @function EventLite.prototype.off
     * @param [type] {string}
     * @param [func] {Function}
     * @returns {EventLite} Self for method chaining
     */

    function off(type, func) {
      var that = this;
      var listners;
      if (!arguments.length) {
        delete that[LISTENERS];
      } else if (!func) {
        listners = that[LISTENERS];
        if (listners) {
          delete listners[type];
          if (!Object.keys(listners).length) return off.call(that);
        }
      } else {
        listners = getListeners(that, type, true);
        if (listners) {
          listners = listners.filter(ne);
          if (!listners.length) return off.call(that, type);
          that[LISTENERS][type] = listners;
        }
      }
      return that;

      function ne(test) {
        return test !== func && test.originalListener !== func;
      }
    }

    /**
     * Dispatch (trigger) an event.
     *
     * @function EventLite.prototype.emit
     * @param type {string}
     * @param [value] {*}
     * @returns {boolean} True when a listener received the event
     */

    function emit(type, value) {
      var that = this;
      var listeners = getListeners(that, type, true);
      if (!listeners) return false;
      var arglen = arguments.length;
      if (arglen === 1) {
        listeners.forEach(zeroarg);
      } else if (arglen === 2) {
        listeners.forEach(onearg);
      } else {
        var args = Array.prototype.slice.call(arguments, 1);
        listeners.forEach(moreargs);
      }
      return !!listeners.length;

      function zeroarg(func) {
        func.call(that);
      }

      function onearg(func) {
        func.call(that, value);
      }

      function moreargs(func) {
        func.apply(that, args);
      }
    }

    /**
     * @ignore
     */

    function getListeners(that, type, readonly) {
      if (readonly && !that[LISTENERS]) return;
      var listeners = that[LISTENERS] || (that[LISTENERS] = {});
      return listeners[type] || (listeners[type] = []);
    }

  })(EventLite);
  var EventEmitter = _module_.exports;

  function createPref(DEFAULT, sep = "/") {
    let storage;
    let currentScope = "global";
    let scopeList = ["global"];
    const events = new EventEmitter;
    const globalCache = {};
    let scopedCache = {};
    let currentCache = Object.assign({}, DEFAULT);
    let initializing;
    
    return Object.assign(events, {
      storage,
      ready,
      connect,
      disconnect,
      get,
      getAll,
      set,
      getCurrentScope,
      setCurrentScope,
      addScope,
      deleteScope,
      getScopeList,
      import: import_,
      export: export_
    });
    
    function import_(input) {
      const newScopeList = input.scopeList || scopeList.slice();
      const scopes = new Set(newScopeList);
      if (!scopes.has("global")) {
        throw new Error("invalid scopeList");
      }
      const changes = {
        scopeList: newScopeList
      };
      for (const [scopeName, scope] of Object.entries(input.scopes)) {
        if (!scopes.has(scopeName)) {
          continue;
        }
        for (const [key, value] of Object.entries(scope)) {
          if (DEFAULT[key] == undefined) {
            continue;
          }
          changes[`${scopeName}${sep}${key}`] = value;
        }
      }
      return storage.setMany(changes);
    }
    
    function export_() {
      const keys = [];
      for (const scope of scopeList) {
        keys.push(...Object.keys(DEFAULT).map(k => `${scope}${sep}${k}`));
      }
      keys.push("scopeList");
      return storage.getMany(keys)
        .then(changes => {
          const _scopeList = changes.scopeList || scopeList.slice();
          const scopes = new Set(_scopeList);
          const output = {
            scopeList: _scopeList,
            scopes: {}
          };
          for (const [key, value] of Object.entries(changes)) {
            const sepIndex = key.indexOf(sep);
            if (sepIndex < 0) {
              continue;
            }
            const scope = key.slice(0, sepIndex);
            const realKey = key.slice(sepIndex + sep.length);
            if (!scopes.has(scope)) {
              continue;
            }
            if (DEFAULT[realKey] == undefined) {
              continue;
            }
            if (!output.scopes[scope]) {
              output.scopes[scope] = {};
            }
            output.scopes[scope][realKey] = value;
          }
          return output;
        });
    }
    
    function connect(_storage) {
      storage = _storage;
      initializing = storage.getMany(
        Object.keys(DEFAULT).map(k => `global${sep}${k}`).concat(["scopeList"])
      )
        .then(updateCache);
      storage.on("change", updateCache);
      return initializing;
    }
    
    function disconnect() {
      storage.off("change", updateCache);
      storage = null;
    }
    
    function updateCache(changes, rebuildCache = false) {
      if (changes.scopeList) {
        scopeList = changes.scopeList;
        events.emit("scopeListChange", scopeList);
        if (!scopeList.includes(currentScope)) {
          return setCurrentScope("global");
        }
      }
      const changedKeys = new Set;
      for (const [key, value] of Object.entries(changes)) {
        const [scope, realKey] = key.startsWith(`global${sep}`) ? ["global", key.slice(6 + sep.length)] :
          key.startsWith(`${currentScope}${sep}`) ? [currentScope, key.slice(currentScope.length + sep.length)] :
            [null, null];
        if (!scope || DEFAULT[realKey] == null) {
          continue;
        }
        if (scope === "global") {
          changedKeys.add(realKey);
          globalCache[realKey] = value;
        }
        if (scope === currentScope) {
          changedKeys.add(realKey);
          scopedCache[realKey] = value;
        }
      }
      if (rebuildCache) {
        Object.keys(DEFAULT).forEach(k => changedKeys.add(k));
      }
      const realChanges = {};
      let isChanged = false;
      for (const key of changedKeys) {
        const value = scopedCache[key] != null ? scopedCache[key] :
          globalCache[key] != null ? globalCache[key] :
          DEFAULT[key];
        if (currentCache[key] !== value) {
          realChanges[key] = value;
          currentCache[key] = value;
          isChanged = true;
        }
      }
      if (isChanged) {
        events.emit("change", realChanges);
      }
    }
    
    function ready() {
      return initializing;
    }
    
    function get(key) {
      return currentCache[key];
    }
    
    function getAll() {
      return Object.assign({}, currentCache);
    }
    
    function set(key, value) {
      return storage.setMany({
        [`${currentScope}${sep}${key}`]: value
      });
    }
    
    function getCurrentScope() {
      return currentScope;
    }
    
    function setCurrentScope(newScope) {
      if (currentScope === newScope) {
        return Promise.resolve(true);
      }
      if (!scopeList.includes(newScope)) {
        return Promise.resolve(false);
      }
      return storage.getMany(Object.keys(DEFAULT).map(k => `${newScope}${sep}${k}`))
        .then(changes => {
          currentScope = newScope;
          scopedCache = {};
          events.emit("scopeChange", currentScope);
          updateCache(changes, true);
          return true;
        });
    }
    
    function addScope(scope) {
      if (scopeList.includes(scope)) {
        return Promise.reject(new Error(`${scope} already exists`));
      }
      if (scope.includes(sep)) {
        return Promise.reject(new Error(`invalid word: ${sep}`));
      }
      return storage.setMany({
        scopeList: scopeList.concat([scope])
      });
    }
    
    function deleteScope(scope) {
      if (scope === "global") {
        return Promise.reject(new Error(`cannot delete global`));
      }
      return storage.setMany({
        scopeList: scopeList.filter(s => s != scope)
      });
    }
    
    function getScopeList() {
      return scopeList;
    }
  }

  /* global browser chrome */

  function createView({root, pref, body, translate = {}, getNewScope = () => ""}) {
    translate = Object.assign({
      inputNewScopeName: "Add new scope",
      learnMore: "Learn more",
      import: "Import",
      export: "Export",
      pasteSettings: "Paste settings",
      copySettings: "Copy settings"
    }, translate);
    const toolbar = createToolbar();
    const nav = createNav();
    const form = createForm(body);
    
    root.append(toolbar.frag, nav.frag, form.frag);
    
    pref.on("scopeChange", nav.updateScope);
    nav.updateScope(pref.getCurrentScope());
    
    pref.on("scopeListChange", nav.updateScopeList);
    nav.updateScopeList(pref.getScopeList());
    
    pref.on("change", form.updateInputs);
    form.updateInputs(pref.getAll());
    
    return destroy;
    
    function createToolbar() {
      const container = document.createElement("div");
      container.className = "webext-pref-toolbar";
      
      const importButton = document.createElement("button");
      importButton.className = "webext-pref-import browser-style";
      importButton.type = "button";
      importButton.textContent = translate.import;
      importButton.onclick = () => {
        Promise.resolve()
          .then(() => {
            const input = prompt(translate.pasteSettings);
            if (input == null) {
              return;
            }
            const settings = JSON.parse(input);
            return pref.import(settings);
          })
          .catch(err => alert(err.message));
      };
      
      const exportButton = document.createElement("button");
      exportButton.className = "webext-pref-export browser-style";
      exportButton.type = "button";
      exportButton.textContent = translate.export;
      exportButton.onclick = () => {
        pref.export()
          .then(settings => {
            prompt(translate.copySettings, JSON.stringify(settings));
          })
          .catch(err => alert(err.message));
      };
      
      container.append(importButton, exportButton);
      return {frag: container};
    }
    
    function destroy() {
      root.innerHTML = "";
      pref.off("scopeChange", nav.updateScope);
      pref.off("scopeListChange", nav.updateScopeList);
      pref.off("change", form.updateInputs);
    }
    
    function createForm(body) {
      const container = document.createElement("div");
      container.className = "webext-pref-body";
      
      const _body = createBody({body});
      container.append(..._body.frag);
      
      return Object.assign(_body, {updateInputs, frag: container});
      
      function updateInputs(changes) {
        for (const [key, value] of Object.entries(changes)) {
          if (_body.inputs[key]) {
            _body.inputs[key].setValue(value);
          }
        }
      }
    }
    
    function createNav() {
      const container = document.createElement("div");
      container.className = "webext-pref-nav";
      
      const select = document.createElement("select");
      select.className = "browser-style";
      select.onchange = () => {
        pref.setCurrentScope(select.value);
      };
      
      const deleteButton = document.createElement("button");
      deleteButton.className = "browser-style";
      deleteButton.type = "button";
      deleteButton.textContent = "x";
      deleteButton.onclick = () => {
        pref.deleteScope(pref.getCurrentScope())
          .catch(err => {
            alert(err.message);
          });
      };
      
      const addButton = document.createElement("button");
      addButton.className = "browser-style";
      addButton.type = "button";
      addButton.textContent = "+";
      addButton.onclick = () => {
        addNewScope().catch(err => {
          alert(err.message);
        });
          
        function addNewScope() {
          let scopeName = prompt(translate.inputNewScopeName, getNewScope());
          if (scopeName == null) {
            return Promise.resolve();
          }
          scopeName = scopeName.trim();
          if (!scopeName) {
            return Promise.reject(new Error("the value is empty"));
          }
          return pref.addScope(scopeName)
            .then(() => pref.setCurrentScope(scopeName));
        }
      };
      
      container.append(select, deleteButton, addButton);
      
      return {
        updateScope,
        updateScopeList,
        frag: container
      };
      
      function updateScope(newScope) {
        select.value = newScope;
      }
      
      function updateScopeList(scopeList) {
        select.innerHTML = "";
        select.append(...scopeList.map(scope => {
          const option = document.createElement("option");
          option.value = scope;
          option.textContent = scope;
          return option;
        }));
      }
    }
    
    function createBody({body, hLevel = 3}) {
      const inputs = {};
      const frag = [];
      for (const el of body) {
        const container = document.createElement("div");
        container.className = `webext-pref-${el.type} browser-style`;
        Object.assign(
          el,
          el.type === "section" ? createSection({el, hLevel}) :
            el.type === "checkbox" ? createCheckbox(el) :
            el.type === "radiogroup" ? createRadioGroup(el) :
            createInput(el)
        );
        if (el.key) {
          inputs[el.key] = el;
        }
        if (el.inputs) {
          Object.assign(inputs, el.inputs);
        }
        container.append(...el.frag);
        frag.push(container);
      }
      return {
        inputs,
        frag
      };
    }
    
    function createSection({el, hLevel}) {
      const header = document.createElement(`h${hLevel}`);
      header.className = "webext-pref-header";
      header.textContent = el.label;
      
      const body = createBody({
        body: el.children,
        hLevel: hLevel + 1
      });
      
      const frag = [header];
      if (el.help) {
        frag.push(createHelp(el.help));
      }
      frag.push(...body.frag);
      
      return {
        inputs: body.inputs,
        frag
      };
    }
    
    function createCheckbox(el) {
      const input = document.createElement("input");
      const inputs = {};
      input.id = `pref-${el.key}`;
      input.type = el.type;
      if (el.type === "checkbox") {
        // checkbox
        input.onchange = () => {
          pref.set(el.key, input.checked);
        };
      } else {
        // radio
        input.name = `pref-${el.parentKey}`;
        input.onchange = () => {
          if (input.checked) {
            pref.set(el.parentKey, el.value);
          }
        };
      }
      
      const frag = [
        input,
        createLabel(el.label, input.id)
      ];
      
      if (el.learnMore) {
        frag.push(createLearnMore(el.learnMore));
      }
      if (el.help) {
        frag.push(createHelp(el.help));
      }
      const childContainer = el.children && el.children.length ?
        createChildContainer(el.children) : null;
      if (childContainer) {
        frag.push(childContainer);
      }
      
      return {
        inputs,
        frag,
        setValue: value => {
          input.checked = value;
          if (childContainer) {
            childContainer.disabled = !input.checked;
          }
        }
      };
      
      function createChildContainer(children) {
        const container = document.createElement("fieldset");
        container.className = "webext-pref-checkbox-children";
        container.disabled = true;
        const body = createBody({body: children});
        container.append(...body.frag);
        Object.assign(inputs, body.inputs);
        return container;
      }
    }
    
    function createRadioGroup(el) {
      const frag = [];
      const inputs = {};
      
      const radios = el.children.map(option => {
        const container = document.createElement("div");
        container.className = "webext-pref-checkbox browser-style";
        
        const checkbox = createCheckbox(Object.assign({}, option, {
          key: `${el.key}-${option.value}`,
          parentKey: el.key
        }));
        
        Object.assign(inputs, checkbox.inputs);
        
        container.append(...checkbox.frag);
        return Object.assign(checkbox, {frag: container, key: option.value});
      });
      
      const radioMap = {};
      for (const radio of radios) {
        radioMap[radio.key] = radio;
      }
      
      if (el.label) {
        frag.push(createTitle(el.label));
      }
      if (el.learnMore) {
        frag.push(createLearnMore(el.learnMore));
      }
      if (el.help) {
        frag.push(createHelp(el.help));
      }
      frag.push(...radios.map(r => r.frag));
      
      let currentValue;
      
      return {
        inputs,
        frag,
        setValue: value => {
          if (currentValue) {
            radioMap[currentValue].setValue(false);
          }
          radioMap[value].setValue(true);
          currentValue = value;
        }
      };
      
      function createTitle(text) {
        const title = document.createElement("span");
        title.className = "webext-pref-radio-title";
        title.textContent = text;
        return title;
      }
    }
    
    function createInput(el) {
      const frag = [];
      let input;
      if (el.type === "select") {
        input = document.createElement("select");
        input.className = "browser-style";
        input.multiple = el.multiple;
        input.append(...Object.entries(el.options).map(([key, value]) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = value;
          return option;
        }));
      } else if (el.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = "8";
        input.className = "browser-style";
      } else {
        input = document.createElement("input");
        input.type = el.type;
      }
      input.id = `pref-${el.key}`;
      input.onchange = () => {
        const value = el.type === "select" && el.multiple ?
          [...input.selectedOptions].map(i => i.value) :
          el.type === "number" ? Number(input.value) : input.value;
        if (el.validate) {
          let err;
          try {
            el.validate(value);
          } catch (_err) {
            err = _err;
          }
          input.setCustomValidity(err ? err.message : "");
          if (err) {
            return;
          }
        }
        pref.set(el.key, value);
      };
      
      frag.push(createLabel(el.label, input.id));
      if (el.learnMore) {
        frag.push(createLearnMore(el.learnMore));
      }
      frag.push(input);
      if (el.help) {
        frag.push(createHelp(el.help));
      }
      
      return {
        frag,
        setValue: value => {
          if (el.type !== "select" || !el.multiple) {
            input.value = value;
          } else {
            const set = new Set(value);
            for (const option of input.options) {
              option.selected = set.has(option.value);
            }
          }
          if (el.validate) {
            input.setCustomValidity("");
          }
        }
      };
    }
    
    function createHelp(text) {
      const help = document.createElement("div");
      help.className = "webext-pref-help";
      help.textContent = text;
      return help;
    }
    
    function createLabel(text, id) {
      const label = document.createElement("label");
      label.textContent = text;
      label.htmlFor = id;
      return label;
    }
    
    function createLearnMore(url) {
      const a = document.createElement("a");
      a.className = "webext-pref-learn-more";
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = translate.learnMore;
      return a;
    }
  }

  /* eslint-env greasemonkey */

  function createGMStorage() {
    const setValue = typeof GM_setValue === "function" ? promisify(GM_setValue) : GM.setValue.bind(GM);
    const getValue = typeof GM_getValue === "function" ? promisify(GM_getValue) : GM.getValue.bind(GM);
    const events = new EventEmitter;
    
    if (typeof GM_addValueChangeListener === "function") {
      GM_addValueChangeListener("webext-pref-message", (name, oldValue, newValue) => {
        events.emit("change", JSON.parse(newValue));
      });
    }
    
    return Object.assign(events, {getMany, setMany});
    
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
    translate,
    getNewScope
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
      style.textContent = "body{overflow:hidden}.webext-pref-modal{position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.5);overflow:auto;z-index:999999;opacity:0;transition:opacity .2s linear;text-align:center}.webext-pref-modal-open{opacity:1}.webext-pref-modal::before{content:\"\";display:inline-block;height:100%;vertical-align:middle}.webext-pref-iframe{display:inline-block;vertical-align:middle;width:90%;background:#fff;margin:30px 0;box-shadow:0 0 30px #000;border-width:0;transform:translateY(-20px);transition:transform .2s linear}.webext-pref-modal-open .webext-pref-iframe{transform:none}" + `
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
        
        iframe.contentDocument.querySelector(".dialog-style").textContent = "body{display:inline-block;font-size:16px;font-family:sans-serif;white-space:nowrap;overflow:hidden;margin:0;color:#3d3d3d;line-height:1}input[type=number],input[type=text],select,textarea{display:block;width:100%;box-sizing:border-box;height:2em;font:inherit;padding:0 .3em;border:1px solid #9e9e9e;cursor:pointer}select[multiple],textarea{height:6em}input[type=number]:hover,input[type=text]:hover,select:hover,textarea:hover{border-color:#d5d5d5}input[type=number]:focus,input[type=text]:focus,select:focus,textarea:focus{cursor:auto;border-color:#3a93ee}textarea{line-height:1.5}input[type=checkbox],input[type=radio]{display:inline-block;width:1em;height:1em;font:inherit;margin:0}button{box-sizing:border-box;height:2em;font:inherit;border:1px solid #9e9e9e;cursor:pointer;background:0 0}button:hover{border-color:#d5d5d5}button:focus{border-color:#3a93ee}.dialog-body{margin:2em}.webext-pref-toolbar{display:flex;align-items:center;margin-bottom:1em}.dialog-title{font-size:1.34em;margin:0 2em 0 0;flex-grow:1}.webext-pref-toolbar button{font-size:.7em;margin-left:.5em}.webext-pref-nav{display:flex;margin-bottom:1em}.webext-pref-nav select{text-align:center;text-align-last:center}.webext-pref-nav button{width:2em}.webext-pref-number,.webext-pref-select,.webext-pref-text,.webext-pref-textarea{margin:1em 0}.webext-pref-body>:first-child{margin-top:0}.webext-pref-body>:last-child{margin-bottom:0}.webext-pref-number>input,.webext-pref-select>select,.webext-pref-text>input,.webext-pref-textarea>textarea{margin:.3em 0}.webext-pref-checkbox{margin:.5em 0;padding-left:1.5em}.webext-pref-checkbox>input{margin-left:-1.5em;margin-right:.5em;vertical-align:middle}.webext-pref-checkbox>label{cursor:pointer;vertical-align:middle}.webext-pref-checkbox>label:hover{color:#707070}.webext-pref-checkbox-children{margin:.7em 0 0;padding:0;border-width:0}.webext-pref-checkbox-children[disabled]{opacity:.5}.webext-pref-checkbox-children>:first-child{margin-top:0}.webext-pref-checkbox-children>:last-child{margin-bottom:0}.webext-pref-checkbox-children>:last-child>:last-child{margin-bottom:0}";
        
        destroyView = createView({
          pref,
          body,
          translate,
          root: iframe.contentDocument.querySelector(".dialog-body"),
          getNewScope
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

  return GM_webextPref;

}());
