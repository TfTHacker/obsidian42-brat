import { getLanguage } from "obsidian";
import { en, type LocaleStrings } from "./locales/en";
import { zhCn } from "./locales/zh-cn";

const locales: Record<string, LocaleStrings> = {
	en,
	"zh-cn": zhCn,
};

const localeAliases: Record<string, string> = {
	"en-gb": "en",
	"en-us": "en",
	zh: "zh-cn",
	"zh-hans": "zh-cn",
	"zh-sg": "zh-cn",
};

function normalizeLanguage(language: string): string {
	return language.toLowerCase().replace(/_/g, "-");
}

function resolveLocale(language: string): string {
	const normalizedLanguage = normalizeLanguage(language);

	if (locales[normalizedLanguage]) {
		return normalizedLanguage;
	}

	const alias = localeAliases[normalizedLanguage];
	if (alias) {
		return alias;
	}

	const baseLanguage = normalizedLanguage.split("-")[0];
	return localeAliases[baseLanguage] ?? baseLanguage;
}

export function getTranslations(language = getLanguage()): LocaleStrings {
	return locales[resolveLocale(language)] ?? en;
}
