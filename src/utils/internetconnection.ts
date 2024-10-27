import { requestUrl } from "obsidian";

/**
 * Tests if there is an internet connection
 * @returns true if connected, false if no internet
 */
export async function isConnectedToInternet(): Promise<boolean> {
	try {
		const online = await requestUrl(`https://obsidian.md/?${Math.random()}`);
		return online.status >= 200 && online.status < 300;
	} catch (err) {
		return false;
	}
}
