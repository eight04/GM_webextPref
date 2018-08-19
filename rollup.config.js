import usm from "userscript-meta-cli";
import cjs from "rollup-plugin-cjs-es";
import inline from "rollup-plugin-inline-js";
import resolve from "rollup-plugin-node-resolve";

export default {
  input: "src/index.js",
  output: {
    format: "iife",
    name: "GM_webextPref",
    file: "dist/GM_webextPref.js",
    banner: usm.stringify(usm.getMeta())
  },
  plugins: [
    resolve(),
    inline(),
    cjs({nested: true})
  ]
};
