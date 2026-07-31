/// <reference types="@obsidian-typings/obsidian-public-1.13.4" />

import type BratAPI from "./utils/BratAPI";
export {};

declare global {
	interface Window {
		bratAPI?: BratAPI;
	}
}
