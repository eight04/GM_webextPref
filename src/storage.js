/* eslint-env greasemonkey */
/* global GM_addValueChangeListener */
const EventLite = require("event-lite");

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

module.exports = createGMStorage;
