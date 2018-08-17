GM_webextPref
=============

[![Build Status](https://travis-ci.org/eight04/gm-webext-pref.svg?branch=master)](https://travis-ci.org/eight04/gm-webext-pref)
[![codecov](https://codecov.io/gh/eight04/gm-webext-pref/branch/master/graph/badge.svg)](https://codecov.io/gh/eight04/gm-webext-pref)

Use webext-pref in userscripts. This library includes `createPref`, `createView`, a storage object implemented with GM API, and a dialog service.

Installation
------------

[Greasy Fork](http://example.com)

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
  translate?: Object,
  getNewScope?: () => newScopeName: String
});
```

Create a `pref` object. `pref` inherits all methods from the pref object returned by `createPref`.

`default` would be sent to `createPref`; `body`, `translate`, and `getNewScope` would be sent to `createView`.

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

* 0.1.0 (Next)

  - First release.
