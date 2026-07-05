import { ButtonComponent, Modal, Setting } from "obsidian";
import { scrubRepositoryUrl } from "../features/githubUtils";
import { themeSave } from "../features/themes";
import { getTranslations } from "../i18n";
import type BratPlugin from "../main";
import { existBetaThemeinInList } from "../settings";
import { toastMessage } from "../utils/notifications";
import { promotionalLinks } from "./Promotional";

/**
 * Add a beta theme to the list of plugins being tracked and updated
 */
export default class AddNewTheme extends Modal {
	plugin: BratPlugin;
	address: string;
	openSettingsTabAfterwards: boolean;
	onSubmitted?: () => void;

	constructor(plugin: BratPlugin, openSettingsTabAfterwards = false, onSubmitted?: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.address = "";
		this.openSettingsTabAfterwards = openSettingsTabAfterwards;
		this.onSubmitted = onSubmitted;
	}

	async submitForm(): Promise<void> {
		const text = getTranslations();
		if (this.address === "") return;
		const scrubbedAddress = scrubRepositoryUrl(this.address);
		if (existBetaThemeinInList(this.plugin, scrubbedAddress)) {
			toastMessage(this.plugin, text.addBetaThemeModal.alreadyInList, 10);
			return;
		}

		if (await themeSave(this.plugin, scrubbedAddress, true)) {
			this.onSubmitted?.();
			this.close();
		}
	}

	onOpen(): void {
		const text = getTranslations();
		const commonText = text.common;
		this.contentEl.createEl("h4", {
			text: text.addBetaThemeModal.heading.githubRepositoryForBetaTheme,
		});
		this.contentEl.createEl("form", {}, (formEl) => {
			formEl.addClass("brat-modal");
			new Setting(formEl).addText((textEl) => {
				textEl.setPlaceholder(text.addBetaPluginModal.repository.placeholder);
				textEl.setValue(this.address);
				textEl.onChange((value) => {
					this.address = value.trim();
				});
				textEl.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
					if (e.key === "Enter" && this.address !== "") {
						e.preventDefault();
						void this.submitForm();
					}
				});
				textEl.inputEl.addClass("brat-full-width-input");
				window.setTimeout(() => {
					// eslint-disable-next-line obsidianmd/prefer-active-doc -- BRAT compatibility: activeDocument breaks this modal flow
					const title = document.querySelector(".setting-item-info");
					if (title) title.remove();
					textEl.inputEl.focus();
				}, 10);
			});

			formEl.createDiv("modal-button-container", (buttonContainerEl) => {
				new ButtonComponent(buttonContainerEl).setButtonText(text.addBetaPluginModal.buttons.neverMind).onClick(() => {
					this.close();
				});

				new ButtonComponent(buttonContainerEl)
					.setButtonText(text.settings.betaThemeList.addBetaTheme)
					.setCta()
					.onClick((e: Event) => {
						e.preventDefault();
						console.debug("Add theme button clicked");
						if (this.address !== "") void this.submitForm();
					});
			});

			const newDiv = formEl.createDiv();
			newDiv.addClass("brat-modal-divider");
			const byTfThacker = newDiv.createSpan();
			byTfThacker.createEl("a", {
				href: "https://bit.ly/o42-twitter",
				text: "TFTHacker",
			});
			byTfThacker.appendText(commonText.and);
			byTfThacker.createEl("a", {
				href: "https://github.com/johannrichard",
				// eslint-disable-next-line obsidianmd/ui/sentence-case -- preserve author's lowercase handle
				text: "johannrichard",
			});
			byTfThacker.addClass("brat-credits");
			newDiv.appendChild(byTfThacker);
			promotionalLinks(newDiv, false);

			window.setTimeout(() => {
				const title = formEl.querySelectorAll(".brat-modal .setting-item-info");
				for (const titleEl of Array.from(title)) {
					titleEl.remove();
				}
			}, 50);
		});
	}

	onClose(): void {
		if (this.openSettingsTabAfterwards) {
			this.plugin.app.setting.open();
			this.plugin.app.setting.openTabById(this.plugin.APP_ID);
		}
	}
}
