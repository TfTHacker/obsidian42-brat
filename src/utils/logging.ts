import { moment, Platform, TFile } from "obsidian";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import type BratPlugin from "../main";

/**
 * Logs events to a log file
 *
 * @param plugin           - Plugin object
 * @param textToLog        - text to be saved to log file
 * @param verboseLoggingOn - True if should only be logged if verbose logging is enabled
 *
 */
export async function logger(
	plugin: BratPlugin,
	textToLog: string,
	verboseLoggingOn = false,
): Promise<void> {
	if (plugin.settings.debuggingMode) console.debug(`BRAT: ${textToLog}`);
	if (plugin.settings.loggingEnabled) {
		if (!plugin.settings.loggingVerboseEnabled && verboseLoggingOn) return;

		const fileName = `${plugin.settings.loggingPath}.md`;
		const now = moment.unix(Math.floor(Date.now() / 1000));
		const dateOutput = `[[${now.format(getDailyNoteSettings().format).toString()}]] ${now.format("HH:mm")}`;
		const os = Platform.isDesktop
			? (window.require("os") as { hostname: () => string })
			: null;
		const machineName = Platform.isDesktop ? os?.hostname() : "MOBILE";
		const output = `${dateOutput} ${machineName} ${textToLog.replace("\n", " ")}\n`;

		const file = plugin.app.vault.getAbstractFileByPath(fileName);
		if (!(file instanceof TFile)) {
			await plugin.app.vault.create(fileName, output);
		} else {
			await plugin.app.vault.append(file, output);
		}
	}
}
