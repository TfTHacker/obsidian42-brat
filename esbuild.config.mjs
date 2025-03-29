import process from "node:process";
import builtins from "builtin-modules";
import esbuild from "esbuild";
import copy from "esbuild-copy-static-files";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  minify: prod,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "build/main.js",
  plugins: [
    copy({
      src: "manifest.json",
      dest: "build/manifest.json",
      watch: !prod,
    }),
    copy({
      src: "styles.css",
      dest: "build/styles.css",
      watch: !prod,
    }),
  ],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
