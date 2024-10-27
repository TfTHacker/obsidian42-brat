import type { TFile } from "obsidian";
import { Platform, moment } from "obsidian";
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
	if (plugin.settings.debuggingMode) console.log(`BRAT: ${textToLog}`);
	if (plugin.settings.loggingEnabled) {
		if (!plugin.settings.loggingVerboseEnabled && verboseLoggingOn) return;

		const fileName = `${plugin.settings.loggingPath}.md`;
		const dateOutput = `[[${moment().format(getDailyNoteSettings().format).toString()}]] ${moment().format("HH:mm")}`;
		const os = window.require("os") as { hostname: () => string };
		const machineName = Platform.isDesktop ? os.hostname() : "MOBILE";
		const output = `${dateOutput} ${machineName} ${textToLog.replace("\n", " ")}\n`;

		let file = plugin.app.vault.getAbstractFileByPath(fileName) as TFile;
		if (!file) {
			file = await plugin.app.vault.create(fileName, output);
		} else {
			await plugin.app.vault.append(file, output);
		}
	}
}
