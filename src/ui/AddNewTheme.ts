import { ButtonComponent, Modal, Setting } from "obsidian";
import { themeSave } from "../features/themes";
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

	constructor(plugin: BratPlugin, openSettingsTabAfterwards = false) {
		super(plugin.app);
		this.plugin = plugin;
		this.address = "";
		this.openSettingsTabAfterwards = openSettingsTabAfterwards;
	}

	async submitForm(): Promise<void> {
		if (this.address === "") return;
		const scrubbedAddress = this.address.replace("https://github.com/", "");
		if (existBetaThemeinInList(this.plugin, scrubbedAddress)) {
			toastMessage(
				this.plugin,
				"This theme is already in the list for beta testing",
				10,
			);
			return;
		}

		if (await themeSave(this.plugin, scrubbedAddress, true)) {
			this.close();
		}
	}

	onOpen(): void {
		this.contentEl.createEl("h4", {
			text: "Github repository for beta theme:",
		});
		this.contentEl.createEl("form", {}, (formEl) => {
			formEl.addClass("brat-modal");
			new Setting(formEl).addText((textEl) => {
				textEl.setPlaceholder(
					"Repository (example: https://github.com/GitHubUserName/repository-name",
				);
				textEl.setValue(this.address);
				textEl.onChange((value) => {
					this.address = value.trim();
				});
				textEl.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
					if (e.key === "Enter" && this.address !== " ") {
						e.preventDefault();
						void this.submitForm();
					}
				});
				textEl.inputEl.style.width = "100%";
				window.setTimeout(() => {
					const title = document.querySelector(".setting-item-info");
					if (title) title.remove();
					textEl.inputEl.focus();
				}, 10);
			});

			formEl.createDiv("modal-button-container", (buttonContainerEl) => {
				new ButtonComponent(buttonContainerEl)
					.setButtonText("Never mind")
					.onClick(() => {
						this.close();
					});

				new ButtonComponent(buttonContainerEl)
					.setButtonText("Add theme")
					.setCta()
					.onClick((e: Event) => {
						e.preventDefault();
						console.log("Add theme button clicked");
						if (this.address !== "") void this.submitForm();
					});
			});

			const newDiv = formEl.createDiv();
			newDiv.style.borderTop = "1px solid #ccc";
			newDiv.style.marginTop = "30px";
			const byTfThacker = newDiv.createSpan();
			byTfThacker.createEl("a", {
				href: "https://bit.ly/o42-twitter",
				text: "TFTHacker",
			});
			byTfThacker.appendText(" and ");
			byTfThacker.createEl("a", {
				href: "https://github.com/johannrichard",
				text: "johannrichard",
			});
			byTfThacker.style.fontStyle = "italic";
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
			// @ts-expect-error
			this.plugin.app.setting.openTab();
			// @ts-expect-error
			this.plugin.app.setting.openTabById(this.plugin.APP_ID);
		}
	}
}
