import { Notice, Platform } from "obsidian";
import ThePlugin from "../main";

/**
 * Displays a notice to the user
 *
 * @param   {ThePlugin}  plugin              Plugin object
 * @param   {string}     msg                 Text to display to the user
 * @param   {number}     timeoutInSeconds    Number of seconds to show the Toast message
 * @param   {null}       contextMenuCallback function to call if right mouse clicked
 * @return  {void}                         
 */
export function ToastMessage(plugin: ThePlugin, msg: string, timeoutInSeconds = 10, contextMenuCallback?:()=>void): void {
    if(plugin.settings.notificationsEnabled===false) return;
    const additionalInfo = contextMenuCallback  ? 
                            (Platform.isDesktop ? "(click=dismiss, right-click=Info)" : "(click=dismiss)") : "";
    const newNotice: Notice = new Notice(`BRAT\n${msg}\n${additionalInfo}`, timeoutInSeconds*1000);
    //@ts-ignore
    if(contextMenuCallback) newNotice.noticeEl.oncontextmenu = async () => { contextMenuCallback() };    
}