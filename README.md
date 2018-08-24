GM_webextPref
=============

[![Build Status](https://travis-ci.com/eight04/GM_webextPref.svg?branch=master)](https://travis-ci.com/eight04/GM_webextPref)
[![codecov](https://codecov.io/gh/eight04/GM_webextPref/branch/master/graph/badge.svg)](https://codecov.io/gh/eight04/GM_webextPref)

Use webext-pref in userscripts. This library includes `createPref`, `createView`, a storage object implemented with GM API, and a dialog service.

Installation
------------

[Greasy Fork](https://greasyfork.org/zh-TW/scripts/371339-gm-webextpref)

Demo
----

https://rawgit.com/eight04/GM_webextPref/master/demo/demo.html

Usage
-----

```js
const pref = GM_webextPref({
  default: {
    useImage: true,
    excludeElements: "code, .highlight"
  },
  body: [
    {
      key: "useImage",
      type: "checkbox",
      label: "Use image"
    },
    {
      key: "excludeElements",
      type: "text",
      label: "Exclude elements"
    }
  ]
});

pref.ready()
  .then(() => {
    console.log(pref.get("useImage")); // true
  });
```
  
API
----

This module exports a single function.

### GM_webextPref

```js
const pref = GM_webextPref({
  default: Object,
  body: Array,
  getNewScope?: () => newScopeName: String,
  getMessage?: Function,
  alert?: Function,
  confirm?: Function,
  prompt?: Function
});
```

Create a `pref` object. `pref` inherits all methods from the pref object returned by `createPref`.

`default` would be sent to `createPref`; `body`, `getNewScope`, `getMessage`, `alert`, `confirm`, and `prompt` would be sent to `createView`.

If `GM_registerMenuCommand` exists, the function would register a menu command like:

```js
GM_registerMenuCommand(GM_info.script.name + " - Configure", pref.openDialog);
```

So that users can open the config dialog through monkey menu.

#### pref.openDialog

```js
pref.openDialog();
```

Open the config dialog.

Changelog
---------

* 0.3.0 (Aug 25, 2018)

  - Update webext-pref to 0.5.0. Now the script requires `GM_deleteValue/GM.deleteValue` APIs.

* 0.2.1 (Aug 24, 2018)

  - Update webext-pref to 0.4.1. Add navbar tooltips.

* 0.2.0 (Aug 21, 2018)

  - Update webext-pref to 0.4.0. Drop `translate` arg.

* 0.1.5 (Aug 20, 2018)

  - Update webext-pref to 0.3.5. Fixed navbar error.

* 0.1.4 (Aug 19, 2018)

  - Add: style help text.

* 0.1.3 (Aug 19, 2018)

  - Fix: import/export buttons.
  - Enhance: larger title.

* 0.1.2 (Aug 19, 2018)

  - Add: style checkbox children.

* 0.1.1 (Aug 19, 2018)

  - Fix: missing metadata.

* 0.1.0 (Aug 19, 2018)

  - First release.
