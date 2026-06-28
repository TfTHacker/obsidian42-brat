/// <reference types="@obsidian-typings/obsidian-public-1.11.4" />

import type BratAPI from "./utils/BratAPI";
export {};

declare global {
	interface Window {
		bratAPI?: BratAPI;
	}
}

declare module "obsidian" {
	// TODO: remove this compatibility shim once we can depend on the newest Obsidian typings.
	// We keep it for now because BRAT still supports dual-mode with the older typings.
	export interface SettingControlBase<V, K extends string = string> {
		key: K;
		defaultValue?: V;
		validate?: (value: V) => string | void | Promise<string | void>;
		disabled?: boolean | (() => boolean);
	}

	export interface SettingToggleControl<K extends string = string> extends SettingControlBase<boolean, K> {
		type: "toggle";
	}

	export interface SettingTextControl<K extends string = string> extends SettingControlBase<string, K> {
		type: "text";
		placeholder?: string;
	}

	export interface SettingTextAreaControl<K extends string = string> extends SettingControlBase<string, K> {
		type: "textarea";
		placeholder?: string;
		rows?: number;
	}

	export interface SettingNumberControl<K extends string = string> extends SettingControlBase<number, K> {
		type: "number";
		min?: number;
		max?: number;
		step?: number;
		placeholder?: string;
	}

	export interface SettingSliderControl<K extends string = string> extends SettingControlBase<number, K> {
		type: "slider";
		min: number;
		max: number;
		step: number;
	}

	export interface SettingDropdownControl<K extends string = string> extends SettingControlBase<string, K> {
		type: "dropdown";
		options: Record<string, string>;
	}

	export interface SettingFileControl<K extends string = string> extends SettingControlBase<string, K> {
		type: "file";
		placeholder?: string;
		filter?: (file: import("obsidian").TFile) => boolean;
	}

	export interface SettingFolderControl<K extends string = string> extends SettingControlBase<string, K> {
		type: "folder";
		includeRoot?: boolean;
		placeholder?: string;
		filter?: (folder: import("obsidian").TFolder) => boolean;
	}

	export interface SettingColorControl<K extends string = string> extends SettingControlBase<string, K> {
		type: "color";
	}

	export type SettingControl<K extends string = string> =
		| SettingToggleControl<K>
		| SettingDropdownControl<K>
		| SettingTextControl<K>
		| SettingTextAreaControl<K>
		| SettingNumberControl<K>
		| SettingFileControl<K>
		| SettingFolderControl<K>
		| SettingSliderControl<K>
		| SettingColorControl<K>;

	export interface SettingDefinitionBase {
		name: string;
		desc?: string | DocumentFragment;
		aliases?: string[];
		searchable?: boolean | (() => boolean);
		visible?: boolean | (() => boolean);
	}

	export interface SettingDefinitionControl<K extends string = string> extends SettingDefinitionBase {
		control: SettingControl<K>;
		action?: never;
		render?: never;
	}

	export interface SettingDefinitionEmpty extends SettingDefinitionBase {
		control?: never;
		action?: never;
		render?: never;
	}

	export interface SettingDefinitionAction extends SettingDefinitionBase {
		action: (el: HTMLElement, index: number) => void;
		disabled?: boolean | (() => boolean);
		control?: never;
		render?: never;
	}

	export interface SettingDefinitionRender extends SettingDefinitionBase {
		control?: never;
		action?: never;
		render: (setting: import("obsidian").Setting, group: import("obsidian").SettingGroup) => void | (() => void);
	}

	export type SettingDefinition<K extends string = string> =
		| SettingDefinitionControl<K>
		| SettingDefinitionRender
		| SettingDefinitionAction
		| SettingDefinitionEmpty;

	export interface SettingDefinitionAddItem {
		name: string;
		action: (el: HTMLElement) => void;
	}

	export interface SettingDefinitionPage<K extends string = string> {
		type: "page";
		name: string;
		desc?: string | DocumentFragment;
		searchable?: boolean | (() => boolean);
		visible?: boolean | (() => boolean);
		items?: SettingDefinitionItem<K>[];
		page?: () => SettingPage;
	}

	export type SettingGroupItem<K extends string = string> = SettingDefinition<K> | SettingDefinitionPage<K>;

	export interface SettingDefinitionGroup<K extends string = string> {
		type: "group" | "list";
		heading?: string;
		cls?: string;
		search?: {
			placeholder?: string;
			match: (def: SettingDefinition, query: string) => boolean;
		};
		extraButtons?: ((component: import("obsidian").ExtraButtonComponent) => unknown)[];
		items?: SettingGroupItem<K>[];
		visible?: boolean | (() => boolean);
	}

	export interface SettingDefinitionList<K extends string = string> extends SettingDefinitionGroup<K> {
		type: "list";
		emptyState?: string | DocumentFragment;
		onReorder?: (oldIndex: number, newIndex: number) => void;
		onDelete?: (index: number) => void;
		addItem?: SettingDefinitionAddItem;
	}

	export type SettingDefinitionItem<K extends string = string> =
		| SettingDefinition<K>
		| SettingDefinitionGroup<K>
		| SettingDefinitionList<K>
		| SettingDefinitionPage<K>;

	export abstract class SettingPage {
		title: string;
		containerEl: HTMLElement;
		display(): void;
		hide(): void;
	}

	export interface PluginSettingTab {
		settingItems: SettingDefinitionItem[];
		getSettingDefinitions(): SettingDefinitionItem[];
		update(): void;
		getControlValue(key: string): unknown;
		setControlValue(key: string, value: unknown): void | Promise<void>;
		refreshDomState(): void;
	}
}
