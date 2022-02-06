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
    if(plugin.settings.notificationsEnabled===false) return;
    const additionalInfo = contextMenuCallback ? "(click=dismiss, right-click=Info)" : "";
    const newNotice: Notice = new Notice(`BRAT\n${msg}\n${additionalInfo}`, timeoutInSeconds*1000);
    //@ts-ignore
    if(contextMenuCallback) newNotice.noticeEl.oncontextmenu = async () => { contextMenuCallback() };
}