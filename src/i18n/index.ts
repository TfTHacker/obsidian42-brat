import { getLanguage } from "obsidian";
import { en, type LocaleStrings } from "./locales/en";
import { zhCn } from "./locales/zh-cn";

const locales: Record<string, LocaleStrings> = {
	en,
	"zh-cn": zhCn,
};

function normalizeLanguage(language: string): string {
	const normalizedLanguage = language.toLowerCase().replace(/_/g, "-");

	if (normalizedLanguage === "zh" || normalizedLanguage === "zh-cn" || normalizedLanguage === "zh-hans") {
		return "zh-cn";
	}

	return normalizedLanguage;
}

export function getTranslations(): LocaleStrings {
	return locales[normalizeLanguage(getLanguage())] ?? en;
}
