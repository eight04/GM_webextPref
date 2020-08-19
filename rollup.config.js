import usm from "userscript-meta-cli";
import cjs from "rollup-plugin-cjs-es";
import inline from "rollup-plugin-inline-js";
import resolve from "@rollup/plugin-node-resolve";

function base({output, cache, ...options}) {
  return {
    input: "src/index.js",
    output: {
      ...output
    },
    plugins: [
      resolve(),
      inline(),
      cjs({nested: true, cache})
    ],
    ...options
  };
}

export default [
  base({
    output: {
      format: "iife",
      name: "GM_webextPref",
      file: "dist/GM_webextPref.user.js",
      banner: usm.stringify(usm.getMeta())
    }
  }),
  base({
    output: {
      format: "es",
      file: "dist/GM_webextPref.node.mjs"
    },
    external: Object.keys(require("./package.json").dependencies),
    cache: false
  })
];
