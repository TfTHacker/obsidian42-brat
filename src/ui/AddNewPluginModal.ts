import { Modal, Setting } from "obsidian";
import type BetaPlugins from "../features/BetaPlugins";
import type BratPlugin from "../main";
import { existBetaPluginInList } from "../settings";
import { toastMessage } from "../utils/notifications";
import { promotionalLinks } from "./Promotional";

/**
 * Add a beta plugin to the list of plugins being tracked and updated
 */
export default class AddNewPluginModal extends Modal {
	plugin: BratPlugin;
	betaPlugins: BetaPlugins;
	address: string;
	openSettingsTabAfterwards: boolean;
	readonly useFrozenVersion: boolean;
	enableAfterInstall: boolean;
	version: string;

	constructor(
		plugin: BratPlugin,
		betaPlugins: BetaPlugins,
		openSettingsTabAfterwards = false,
		useFrozenVersion = false,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.betaPlugins = betaPlugins;
		this.address = "";
		this.openSettingsTabAfterwards = openSettingsTabAfterwards;
		this.useFrozenVersion = useFrozenVersion;
		this.enableAfterInstall = plugin.settings.enableAfterInstall;
		this.version = "";
	}

	async submitForm(): Promise<void> {
		if (this.address === "") return;
		let scrubbedAddress = this.address.replace("https://github.com/", "");
		if (scrubbedAddress.endsWith(".git"))
			scrubbedAddress = scrubbedAddress.slice(0, -4);
		if (existBetaPluginInList(this.plugin, scrubbedAddress)) {
			toastMessage(
				this.plugin,
				"This plugin is already in the list for beta testing",
				10,
			);
			return;
		}
		const result = await this.betaPlugins.addPlugin(
			scrubbedAddress,
			false,
			false,
			false,
			this.version,
			false,
			this.enableAfterInstall,
		);
		if (result) {
			this.close();
		}
	}

	onOpen(): void {
		this.contentEl.createEl("h4", {
			text: "Github repository for beta plugin:",
		});
		this.contentEl.createEl("form", {}, (formEl) => {
			formEl.addClass("brat-modal");
			new Setting(formEl).addText((textEl) => {
				textEl.setPlaceholder(
					"Repository (example: https://github.com/GitubUserName/repository-name)",
				);
				textEl.setValue(this.address);
				textEl.onChange((value) => {
					this.address = value.trim();
				});
				textEl.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
					if (e.key === "Enter" && this.address !== " ") {
						if (
							(this.useFrozenVersion && this.version !== "") ||
							!this.useFrozenVersion
						) {
							e.preventDefault();
							void this.submitForm();
						}
					}
				});
				textEl.inputEl.style.width = "100%";
			});

			if (this.useFrozenVersion) {
				new Setting(formEl).addText((textEl) => {
					textEl.setPlaceholder(
						"Specify the release version tag (example: 1.0.0)",
					);
					textEl.onChange((value) => {
						this.version = value.trim();
					});
					textEl.inputEl.style.width = "100%";
				});
			}

			formEl.createDiv("modal-button-container", (buttonContainerEl) => {
				buttonContainerEl.createEl(
					"label",
					{
						cls: "mod-checkbox",
					},
					(labelEl) => {
						const checkboxEl = labelEl.createEl("input", {
							attr: { tabindex: -1 },
							type: "checkbox",
						});
						checkboxEl.checked = this.enableAfterInstall;
						checkboxEl.addEventListener("click", () => {
							this.enableAfterInstall = checkboxEl.checked;
						});
						labelEl.appendText("Enable after installing the plugin");
					},
				);

				buttonContainerEl
					.createEl("button", { attr: { type: "button" }, text: "Never mind" })
					.addEventListener("click", () => {
						this.close();
					});
				buttonContainerEl.createEl("button", {
					attr: { type: "submit" },
					cls: "mod-cta",
					text: "Add Plugin",
				});
			});

			const newDiv = formEl.createDiv();
			newDiv.style.borderTop = "1px solid #ccc";
			newDiv.style.marginTop = "30px";
			const byTfThacker = newDiv.createSpan();
			byTfThacker.innerHTML =
				"BRAT by <a href='https://bit.ly/o42-twitter'>TFTHacker</a>";
			byTfThacker.style.fontStyle = "italic";
			newDiv.appendChild(byTfThacker);
			promotionalLinks(newDiv, false);

			window.setTimeout(() => {
				const title = formEl.querySelectorAll(".brat-modal .setting-item-info");
				for (const titleEl of Array.from(title)) {
					titleEl.remove();
				}
			}, 50);

			// invoked when button is clicked.
			formEl.addEventListener("submit", (e: Event) => {
				e.preventDefault();
				if (this.address !== "") {
					if (
						(this.useFrozenVersion && this.version !== "") ||
						!this.useFrozenVersion
					) {
						void this.submitForm();
					}
				}
			});
		});
	}

	onClose(): void {
		if (this.openSettingsTabAfterwards) {
			// @ts-ignore
			this.plugin.app.setting.open();
			// @ts-ignore
			this.plugin.app.setting.openTabById(this.plugin.APP_ID);
		}
	}
}
