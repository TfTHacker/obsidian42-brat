import { moment, Platform, TFile } from "obsidian";
import type BratPlugin from "../main";

const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";

interface DailyNotesPluginLike {
	instance?: {
		options?: {
			format?: string;
		};
	};
}

interface PeriodicNotesPluginLike {
	settings?: {
		daily?: {
			enabled?: boolean;
			format?: string;
		};
	};
}

function getDailyNoteFormat(plugin: BratPlugin): string {
	const periodicNotes = plugin.app.plugins.getPlugin(
		"periodic-notes",
	) as PeriodicNotesPluginLike | null;
	const periodicDailySettings = periodicNotes?.settings?.daily;
	if (periodicDailySettings?.enabled) {
		return periodicDailySettings.format ?? DEFAULT_DAILY_NOTE_FORMAT;
	}

	const dailyNotes = plugin.app.internalPlugins.getPluginById(
		"daily-notes",
	) as DailyNotesPluginLike | null;
	return dailyNotes?.instance?.options?.format ?? DEFAULT_DAILY_NOTE_FORMAT;
}

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
		const dateOutput = `[[${now.format(getDailyNoteFormat(plugin)).toString()}]] ${now.format("HH:mm")}`;
		const os = Platform.isDesktop
			? (window.require("os") as { hostname: () => string })
			: null;
		const machineName = Platform.isDesktop ? os?.hostname() : "MOBILE";
		const output = `${dateOutput} ${machineName} ${textToLog.replace(/\n/g, " ")}\n`;

		const file = plugin.app.vault.getAbstractFileByPath(fileName);
		if (!(file instanceof TFile)) {
			await plugin.app.vault.create(fileName, output);
		} else {
			await plugin.app.vault.append(file, output);
		}
	}
}
