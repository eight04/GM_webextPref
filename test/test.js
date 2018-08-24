const testStorage = require("webext-pref/test/test-storage");

const createGMStorage = require("../src/storage");

testStorage({
  createStorage: createGMStorage,
  setup: () => {
    const map = new Map;
    const listeners = new Map;
    global.GM_setValue = (key, value) => {
      const listener = listeners.get(key);
      const oldValue = map.get(key);
      map.set(key, value);
      if (listener) {
        listener(key, oldValue, value);
      }
    };
    global.GM_getValue = key => {
      return map.get(key);
    };
    global.GM_deleteValue = key => {
      map.delete(key);
    };
    global.GM_addValueChangeListener = (key, callback) => {
      listeners.set(key, callback);
    };
  },
  cleanup: () => {
    delete global.GM_setValue;
    delete global.GM_getValue;
    delete global.GM_deleteValue;
    delete global.GM_addValueChangeListener;
  }
});
