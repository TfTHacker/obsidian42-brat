import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import { ESLint } from "eslint";

const prod = (process.argv[2] === "production");

esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian"],
    format: "cjs",
    watch: !prod,
    target: "es2016",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    minify: true,
    outfile: "build/main.js",
}).catch(() => process.exit(1));

fs.copyFile("manifest-beta.json", "build/manifest.json", (err) => {if(err) console.log(err)} );
fs.copyFile("styles.css", "build/styles.css", (err) => {if(err) console.log(err)} );

// eslint won't slow down the build process, just runs after the build finishes
(async function eslintTest() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(["src/**/*.ts"]);
  const formatter = await eslint.loadFormatter("stylish");
  const resultText = formatter.format(results);
  console.log(resultText);
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});

