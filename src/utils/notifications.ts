import { Notice } from "obsidian";
import ThePlugin from "../main";

/**
 * Displays a notice to the user
 *
 * @param   {ThePlugin}  plugin            Plugin object
 * @param   {string}     msg               text to display to the user
 * @param   {[type]}     verboseLoggingOn  True if should only be logged if verbose logging is enabled
 *
 * @return  {void}                         
 */
export function ToastMessage(plugin: ThePlugin, msg: string, timeoutInSeconds = 10, contextMenuCallback = null): void {
    const additionalInfo = contextMenuCallback ? "(click=dismiss, right-click=Info)" : "";
    const newNotice: Notice = new Notice(`BRAT\n${msg}\n${additionalInfo}`, timeoutInSeconds*1000);
    //@ts-ignore
    if(contextMenuCallback) newNotice.noticeEl.oncontextmenu = async () => { contextMenuCallback() };




    // if (plugin.settings.loggingEnabled) {
    //     if (plugin.settings.loggingVerboseEnabled === false && verboseLoggingOn === true) {
    //         return;
    //     } else {
    //         const fileName = plugin.settings.loggingPath + ".md";
    //         const dateOutput = "[[" + moment().format(getDailyNoteSettings().format).toString() + "]] " +
    //             moment().format("HH:mm");
    //         const machineName = Platform.isDesktop ? window.require("os").hostname() : "MOBILE";
    //         let output = dateOutput + " " + machineName + " " + textToLog.replace("\n"," ") + "\n\n";
    //         setTimeout(async () => {
    //             if (await plugin.app.vault.adapter.exists(fileName) === true) {
    //                 const fileContents = await plugin.app.vault.adapter.read(fileName);
    //                 output = output + fileContents;
    //                 const file = plugin.app.vault.getAbstractFileByPath(fileName) as TFile;
    //                 await plugin.app.vault.modify(file, output);
    //             } else
    //                 await plugin.app.vault.create(fileName, output);
    //         }, 10);
    //     }
    // }
}