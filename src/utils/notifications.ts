import { Notice, Platform } from "obsidian";
import type BratPlugin from "../main";

/**
 * Displays a notice to the user
 *
 * @param plugin              - Plugin object
 * @param msg                 - Text to display to the user
 * @param timeoutInSeconds    - Number of seconds to show the Toast message
 * @param contextMenuCallback - function to call if right mouse clicked
 */
export function toastMessage(plugin: BratPlugin, msg: string, timeoutInSeconds = 10, contextMenuCallback?: () => void): void {
	if (!plugin.settings.notificationsEnabled) return;
	const additionalInfo = contextMenuCallback ? (Platform.isDesktop ? "(click=dismiss, right-click=Info)" : "(click=dismiss)") : "";
	const newNotice: Notice = new Notice(`BRAT\n${msg}\n${additionalInfo}`, timeoutInSeconds * 1000);
	if (contextMenuCallback)
		newNotice.noticeEl.oncontextmenu = () => {
			contextMenuCallback();
		};
}
