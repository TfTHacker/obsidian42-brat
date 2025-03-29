import { Modal, Setting, type TextComponent } from "obsidian";
import { type ReleaseVersion, fetchReleaseVersions } from "src/features/githubUtils";
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
	versionSetting: Setting | null;
	addPluginButton: HTMLButtonElement | null;

	constructor(plugin: BratPlugin, betaPlugins: BetaPlugins, openSettingsTabAfterwards = false, useFrozenVersion = false, prefillRepo = "") {
		super(plugin.app);
		this.plugin = plugin;
		this.betaPlugins = betaPlugins;
		this.address = prefillRepo;
		this.openSettingsTabAfterwards = openSettingsTabAfterwards;
		this.useFrozenVersion = useFrozenVersion;
		this.enableAfterInstall = plugin.settings.enableAfterInstall;
		this.version = "";
		this.versionSetting = null;
		this.addPluginButton = null;
	}

	async submitForm(): Promise<void> {
		if (this.address === "") return;
		let scrubbedAddress = this.address.replace("https://github.com/", "");
		if (scrubbedAddress.endsWith(".git")) scrubbedAddress = scrubbedAddress.slice(0, -4);

		// If it's an existing frozen version plugin, update it instead of checking for duplicates
		const existingFrozenPlugin = this.plugin.settings.pluginSubListFrozenVersion.find((p) => p.repo === scrubbedAddress);
		if (existingFrozenPlugin) {
			existingFrozenPlugin.version = this.version;
			await this.plugin.saveSettings();
			const result = await this.betaPlugins.addPlugin(
				scrubbedAddress,
				false,
				false,
				false,
				this.version,
				true, // Force reinstall
				this.enableAfterInstall,
			);
			if (result) {
				this.close();
			}
			return;
		}

		if (existBetaPluginInList(this.plugin, scrubbedAddress)) {
			toastMessage(this.plugin, "This plugin is already in the list for beta testing", 10);
			return;
		}

		const result = await this.betaPlugins.addPlugin(scrubbedAddress, false, false, false, this.version, false, this.enableAfterInstall);
		if (result) {
			this.close();
		}
	}

	private updateVersionDropdown(settingEl: Setting, versions: ReleaseVersion[]): void {
		settingEl.clear();
		settingEl.addDropdown((dropdown) => {
			dropdown.addOption("", "Select a version");
			for (const version of versions) {
				dropdown.addOption(version.version, `${version.version} ${version.prerelease ? "(Prerelease)" : ""}`);
			}
			dropdown.onChange((value) => {
				this.version = value;
				// Enable add plugin button if version is selected
				if (this.addPluginButton) {
					if (this.version !== "") {
						this.addPluginButton.disabled = false;
					} else {
						this.addPluginButton.disabled = true;
					}
				}
			});
			dropdown.selectEl.style.width = "100%";
		});
	}

	onOpen(): void {
		this.contentEl.createEl("h4", {
			text: this.useFrozenVersion
				? this.address
					? "Update frozen version of plugin:"
					: "Github repository for frozen beta plugin:"
				: "Github repository for beta plugin:",
		});
		this.contentEl.createEl("form", {}, (formEl) => {
			formEl.addClass("brat-modal");
			new Setting(formEl).addText((textEl) => {
				textEl.setPlaceholder("Repository (example: https://github.com/GitubUserName/repository-name)");
				textEl.setValue(this.address);

				// If we have a prefilled repo, trigger the version dropdown update
				if (this.address) {
					textEl.setDisabled(true); // Disable the input field
					window.setTimeout(async () => {
						await this.updateVersionDropwdown(textEl);
					}, 100);
				}

				textEl.onChange((value) => {
					this.address = value.trim();

					// Disable version dropdown if useFrozenVersion is true and address is empty
					if (this.useFrozenVersion && this.address === "") {
						if (this.versionSetting) {
							this.updateVersionDropdown(this.versionSetting, []);
							this.versionSetting.settingEl.classList.add("disabled-setting");
							this.versionSetting.setDisabled(true);
							textEl.inputEl.classList.remove("valid-repository");
							textEl.inputEl.classList.remove("invalid-repository");
						}
					}
				});
				textEl.inputEl.addEventListener("keydown", async (e: KeyboardEvent) => {
					if (e.key === "Enter") {
						if (this.address !== " " && ((this.useFrozenVersion && this.version !== "") || !this.useFrozenVersion)) {
							e.preventDefault();
							void this.submitForm();
						}

						// Populate version dropdown
						await this.updateVersionDropwdown(textEl);
					}
				});

				// Update version dropdown when input loses focus
				textEl.inputEl.addEventListener("blur", async () => {
					await this.updateVersionDropwdown(textEl);
				});
				textEl.inputEl.style.width = "100%";
			});

			if (this.useFrozenVersion) {
				this.versionSetting = new Setting(formEl).setClass("version-setting").setClass("disabled-setting");
				this.updateVersionDropdown(this.versionSetting, []);
				this.versionSetting.setDisabled(true);
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

				buttonContainerEl.createEl("button", { attr: { type: "button" }, text: "Never mind" }).addEventListener("click", () => {
					this.close();
				});
				this.addPluginButton = buttonContainerEl.createEl("button", {
					attr: { type: "submit" },
					cls: "mod-cta",
					text: this.useFrozenVersion ? (this.address ? "Change Version" : "Add Plugin") : "Add Plugin",
				});

				// Disable "Add Plugin" if adding a frozen version only
				if (this.useFrozenVersion) this.addPluginButton.disabled = true;
			});

			const newDiv = formEl.createDiv();
			newDiv.style.borderTop = "1px solid #ccc";
			newDiv.style.marginTop = "30px";
			const byTfThacker = newDiv.createSpan();
			byTfThacker.innerHTML = "BRAT by <a href='https://bit.ly/o42-twitter'>TFTHacker</a>";
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
					if ((this.useFrozenVersion && this.version !== "") || !this.useFrozenVersion) {
						void this.submitForm();
					}
				}
			});
		});
	}

	/**
	 * Update the version dropdown
	 * @param addressInputEl - The address input element (Only needed if we keep the color-coding of the address input)
	 */
	private async updateVersionDropwdown(addressInputEl: TextComponent) {
		if (this.useFrozenVersion && this.address) {
			// Clear the version dropdown
			if (this.versionSetting) {
				this.updateVersionDropdown(this.versionSetting, []);
			}
			let scrubbedAddress = this.address.replace("https://github.com/", "");
			if (scrubbedAddress.endsWith(".git")) {
				scrubbedAddress = scrubbedAddress.slice(0, -4);
			}
			const versions = await fetchReleaseVersions(
				scrubbedAddress,
				this.plugin.settings.debuggingMode,
				this.plugin.settings.personalAccessToken,
			);

			if (versions && versions.length > 0) {
				// Add valid-repository class
				addressInputEl.inputEl.classList.remove("invalid-repository");
				addressInputEl.inputEl.classList.add("valid-repository");

				if (this.versionSetting) {
					this.versionSetting.settingEl.classList.remove("disabled-setting");
					this.versionSetting.setDisabled(false);
					// Add new dropdown to existing version setting
					this.updateVersionDropdown(this.versionSetting, versions);
				}
			} else {
				// Add invalid-repository class
				addressInputEl.inputEl.classList.remove("valid-repository");
				addressInputEl.inputEl.classList.add("invalid-repository");

				if (this.versionSetting) {
					this.versionSetting.settingEl.classList.add("disabled-setting");
					this.versionSetting.setDisabled(true);
					if (this.addPluginButton) {
						this.addPluginButton.disabled = true;
					}
				}
			}
		}
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
