import type {} from "@obsidian-typings/obsidian-public-1.11.4";
import type BratApi from "./utils/BratAPI";

declare global {
	interface Window {
		bratAPI?: BratApi;
	}
}
