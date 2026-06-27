import { globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	globalIgnores([
		"node_modules",
		"build",
		"main.js",
		"esbuild.config.mjs",
		"version-bump.mjs",
		"version-github-action.mjs",
		"versions.json",
		"package.json",
		"package-lock.json",
		"tsconfig.json",
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.mts", "manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		rules: {
			"obsidianmd/ui/sentence-case": [
				"warn",
				{
					acronyms: ["BRAT"],
					brands: ["BRAT", "TFTHacker", "johannrichard"],
				},
			],
		},
	},
);
