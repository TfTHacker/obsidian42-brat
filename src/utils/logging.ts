import { moment, TFile, Platform } from "obsidian";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import ThePlugin from "../main";

/**
 * Logs events to a log file
 *
 * @param   {ThePlugin}  plugin            Plugin object
 * @param   {string}     textToLog         text to be saved to log file
 * @param   {[type]}     verboseLoggingOn  True if should only be logged if verbose logging is enabled
 *
 * @return  {void}                         
 */
export function logger(plugin: ThePlugin, textToLog: string, verboseLoggingOn = false): void {
    if(plugin.settings.debuggingMode) console.log("BRAT: " + textToLog);
    if (plugin.settings.loggingEnabled) {
        if (plugin.settings.loggingVerboseEnabled === false && verboseLoggingOn === true) {
            return;
        } else {
            const fileName = plugin.settings.loggingPath + ".md";
            const dateOutput = "[[" + moment().format(getDailyNoteSettings().format).toString() + "]] " +
                moment().format("HH:mm");
            const machineName = Platform.isDesktop ? window.require("os").hostname() : "MOBILE";
            let output = dateOutput + " " + machineName + " " + textToLog.replace("\n"," ") + "\n\n";
            setTimeout(async () => {
                if (await plugin.app.vault.adapter.exists(fileName) === true) {
                    const fileContents = await plugin.app.vault.adapter.read(fileName);
                    output = output + fileContents;
                    const file = plugin.app.vault.getAbstractFileByPath(fileName) as TFile;
                    await plugin.app.vault.modify(file, output);
                } else
                    await plugin.app.vault.create(fileName, output);
            }, 10);
        }
    }
}