/* globals GM_webextPref */

// ==UserScript==
// @name        GM_webextPref Test Script
// @version     0.1.0
// @namespace   eight04.blogspot.com
// @description GM_config Test Script
// @include     http*
// @require     ../dist/GM_webextPref.js
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// ==/UserScript==

const pref = GM_webextPref({
  default: {
    text: "sadfasdf",
    number: 12345,
    checkbox: true,
    textarea: "multi\nline",
    radio: "en",
    select: "orange",
    select2: []
  },
  body: [
    {
      key: "text",
      label: "Text field",
      type: "text"
    },
    {
      key: "number",
      label: "Number field",
      type: "number"
    },
    {
      key: "checkbox",
      label: "Checkbox field",
      type: "checkbox"
    },
    {
      key: "textarea",
      label: "Textarea field",
      type: "textarea"
    },
    {
      key: "radio",
      label: "Select your language",
      type: "radiogroup",
      children: [
        {
          type: "radio",
          label: "English",
          value: "en"
        },
        {
          type: "radio",
          label: "Traditional Chinese",
          value: "tw"
        },
        {
          type: "radio",
          label: "Simplified Chinese",
          value: "cn"
        }
      ]
    },
    {
      key: "select",
      label: "Choose a color",
      type: "select",
      options: {
        red: "Red",
        orange: "Orange",
        yellow: "Yellow"
      }
    },
    {
      key: "select2",
      label: "Multiple select",
      type: "select",
      multiple: true,
      options: {
        n1: "1",
        n2: "2",
        n3: "3"
      }
    }
  ]
});

function output() {
	document.querySelector(".output").textContent = JSON.stringify(pref.getAll(), null, 2);
}

pref.on("change", output);
