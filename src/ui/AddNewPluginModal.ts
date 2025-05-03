import { ButtonComponent, Modal, Platform, Setting, type TextComponent } from "obsidian";
import { type ReleaseVersion, fetchReleaseVersions } from "src/features/githubUtils";
import { GHRateLimitError, GitHubResponseError } from "src/utils/GitHubAPIErrors";
import { createLink } from "src/utils/utils";
import type BetaPlugins from "../features/BetaPlugins";
import type BratPlugin from "../main";
import { existBetaPluginInList } from "../settings";
import { toastMessage } from "../utils/notifications";
import { promotionalLinks } from "./Promotional";
import { VersionSuggestModal } from "./VersionSuggestModal";

/**
 * Add a beta plugin to the list of plugins being tracked and updated
 */
export default class AddNewPluginModal extends Modal {
	plugin: BratPlugin;
	betaPlugins: BetaPlugins;
	address: string;
	openSettingsTabAfterwards: boolean;
	readonly trackFixedVersion: boolean;
	enableAfterInstall: boolean;
	version: string;
	versionSetting: Setting | null = null;
	addPluginButton: ButtonComponent | null = null;
	cancelButton: ButtonComponent | null = null;
	privateApiKey: string;

	constructor(
		plugin: BratPlugin,
		betaPlugins: BetaPlugins,
		openSettingsTabAfterwards = false,
		useFrozenVersion = false,
		prefillRepo = "",
		prefillVersion = "",
		prefillPrivateApiKey = "",
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.betaPlugins = betaPlugins;
		this.address = prefillRepo;
		this.version = prefillVersion;
		this.privateApiKey = prefillPrivateApiKey;
		this.openSettingsTabAfterwards = openSettingsTabAfterwards;
		this.trackFixedVersion = useFrozenVersion;
		this.enableAfterInstall = plugin.settings.enableAfterInstall;
	}

	async submitForm(): Promise<void> {
		if (this.address === "") return;
		let scrubbedAddress = this.address.replace("https://github.com/", "");
		if (scrubbedAddress.endsWith(".git")) scrubbedAddress = scrubbedAddress.slice(0, -4);

		// If it's an existing frozen version plugin, update it instead of checking for duplicates
		const existingFrozenPlugin = this.plugin.settings.pluginSubListFrozenVersion.find((p) => p.repo === scrubbedAddress);
		if (existingFrozenPlugin) {
			// Update version and token (also clear token if empty)
			existingFrozenPlugin.version = this.version;
			existingFrozenPlugin.token = this.privateApiKey || "";

			await this.plugin.saveSettings();
			const result = await this.betaPlugins.addPlugin(
				scrubbedAddress,
				false,
				false,
				false,
				this.version,
				true, // Force reinstall
				this.enableAfterInstall,
				this.privateApiKey,
			);
			if (result) {
				this.close();
			}
			return;
		}

		if (!this.version && existBetaPluginInList(this.plugin, scrubbedAddress)) {
			toastMessage(this.plugin, "This plugin is already in the list for beta testing", 10);
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
			this.privateApiKey,
		);
		if (result) {
			this.close();
		}
	}

	private updateVersionDropdown(settingEl: Setting, versions: ReleaseVersion[], selected = ""): void {
		settingEl.clear();

		const VERSION_THRESHOLD = 20;

		// With fewer than 20 versions, or on mobile, use a dropdown
		if (versions.length < VERSION_THRESHOLD || Platform.isMobile) {
			// Use dropdown for fewer versions
			settingEl.addDropdown((dropdown) => {
				dropdown.addOption("", "Select a version");
				dropdown.addOption("latest", "Latest version");
				for (const version of versions) {
					dropdown.addOption(version.version, `${version.version} ${version.prerelease ? "(Prerelease)" : ""}`);
				}
				dropdown.setValue(selected);
				dropdown.onChange((value) => {
					this.version = value;
					this.updateAddButtonState();
				});

				dropdown.selectEl.addClass("brat-version-selector");
				dropdown.selectEl.style.width = "100%";
			});
		} else {
			// Use suggest modal for many versions
			settingEl.addButton((button) => {
				button
					.setButtonText(selected === "latest" ? "Latest version" : selected || "Select a version...")
					.setClass("brat-version-selector")
					.setClass("button")
					.onClick((e: Event) => {
						e.preventDefault();
						const latest: ReleaseVersion = {
							version: "latest",
							prerelease: false,
						};
						const suggestedVersions: ReleaseVersion[] = [latest, ...versions];
						const modal = new VersionSuggestModal(this.app, this.address, suggestedVersions, selected, (version: string) => {
							this.version = version;
							button.setButtonText(version === "latest" ? "Latest version" : version || "Select a version...");
							this.updateAddButtonState();
						});
						modal.open();
					});
			});
		}
	}

	// Helper method to update add button state
	private updateAddButtonState(): void {
		if (this.addPluginButton) {
			this.addPluginButton.setDisabled(this.version === "");
		}
	}

	onOpen(): void {
		const heading = this.contentEl.createEl("h4");
		if (this.address) {
			heading.appendText("Change plugin version: ");
			heading.appendChild(createLink(this.address));
		} else {
			heading.setText("Github repository for beta plugin:");
		}

		this.contentEl.createEl("form", {}, (formEl) => {
			formEl.addClass("brat-modal");

			if (!this.address || !this.trackFixedVersion) {
				const repoSetting = new Setting(formEl).setClass("repository-setting");

				// Add validation status element
				const validationStatusEl = repoSetting.settingEl.createDiv("validation-status");
				validationStatusEl.style.color = "var(--text-error)";
				validationStatusEl.style.marginTop = "6px";
				validationStatusEl.style.fontSize = "0.8em";

				repoSetting.then((setting) => {
					// Show as input field for new plugins
					setting.addText((repositoryAddressEl) => {
						repositoryAddressEl.setPlaceholder("Repository (example: https://github.com/GitubUserName/repository-name)");
						repositoryAddressEl.setValue(this.address);
						repositoryAddressEl.onChange((value) => {
							this.address = value.trim();
							if (this.trackFixedVersion && (!this.address || !this.isGitHubRepositoryMatch(this.address))) {
								// Disable version dropdown if useFrozenVersion is true and address is empty
								if (this.versionSetting) {
									this.updateVersionDropdown(this.versionSetting, []);
									this.versionSetting.settingEl.classList.add("disabled-setting");
									this.versionSetting.setDisabled(true);
									repositoryAddressEl.inputEl.classList.remove("valid-repository");
									repositoryAddressEl.inputEl.classList.remove("invalid-repository");
								}
							}

							// If the GitHub Repository matches the GitHub pattern, enable the "Add Plugin"
							if (!this.trackFixedVersion) {
								if (this.isGitHubRepositoryMatch(this.address)) this.addPluginButton?.setDisabled(false);
								else this.addPluginButton?.setDisabled(true);
							}
						});

						repositoryAddressEl.inputEl.addEventListener("keydown", async (e: KeyboardEvent) => {
							if (e.key === "Enter") {
								if (this.address && ((this.trackFixedVersion && this.version !== "") || !this.trackFixedVersion)) {
									e.preventDefault();
									this.addPluginButton?.setDisabled(true);
									this.cancelButton?.setDisabled(true);
									this.versionSetting?.setDisabled(true);
									void this.submitForm();
								}

								// Populate version dropdown
								await this.updateRepositoryVersionInfo(this.version, repositoryAddressEl);
							}
						});

						// Update version dropdown when input loses focus
						if (this.trackFixedVersion) {
							repositoryAddressEl.inputEl.addEventListener("blur", async () => {
								await this.updateRepositoryVersionInfo(this.version, repositoryAddressEl, validationStatusEl);
							});
						}
						repositoryAddressEl.inputEl.style.width = "100%";
					});
				});
			}
			if (this.trackFixedVersion) {
				new Setting(formEl).setClass("api-setting").addText((textEl) => {
					textEl
						.setPlaceholder("GitHub API key for private repository (optional)")
						.setValue(this.privateApiKey)
						.onChange(async (value) => {
							this.privateApiKey = value.trim();
							// Update version dropdown when API key changes
							if (this.address) {
								await this.updateRepositoryVersionInfo(this.version, textEl);
							}
						});
					textEl.inputEl.type = "password";
					textEl.inputEl.style.width = "100%";
				});

				// Then add version dropdown
				this.versionSetting = new Setting(formEl).setClass("version-setting").setClass("disabled-setting");
				this.updateVersionDropdown(this.versionSetting, [], this.version);
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

				this.cancelButton = new ButtonComponent(buttonContainerEl)
					.setButtonText("Never mind")
					.setClass("mod-cancel")
					.onClick((e: Event) => {
						this.close();
					});

				this.addPluginButton = new ButtonComponent(buttonContainerEl)
					.setButtonText(this.trackFixedVersion ? (this.address ? "Change version" : "Add plugin") : "Add plugin")
					.setClass("mod-cta")
					.onClick((e: Event) => {
						e.preventDefault();
						if (this.address !== "") {
							if ((this.trackFixedVersion && this.version !== "") || !this.trackFixedVersion) {
								// Submit the form
								this.addPluginButton?.setDisabled(true);
								this.addPluginButton?.setButtonText("Installing …");
								this.cancelButton?.setDisabled(true);
								this.versionSetting?.setDisabled(true);
								void this.submitForm();
							}
						}
					});

				// Disable "Add Plugin" if adding a frozen version only
				if (this.trackFixedVersion || this.address === "") this.addPluginButton?.setDisabled(true);
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
					if ((this.trackFixedVersion && this.version !== "") || !this.trackFixedVersion) {
						this.addPluginButton?.setDisabled(true);
						void this.submitForm();
					}
				}
			});
		});

		if (this.address) {
			// If we have a prefilled repo, trigger the version dropdown update
			window.setTimeout(async () => {
				await this.updateRepositoryVersionInfo(this.version);
			}, 100);
		}
	}

	/**
	 * Update the repository validation and version dropdown
	 * @param selectedVersion - The version to select in the dropdown
	 * @param validateInputEl - The address input element
	 * @param validationStatusEl - The error element (used for errors, incl. GitHub Rate limit)
	 * @returns {Promise<void>}
	 */
	private async updateRepositoryVersionInfo(selectedVersion = "", validateInputEl?: TextComponent, validationStatusEl?: HTMLElement) {
		if (this.plugin.settings.debuggingMode) {
			console.log(`[BRAT] Updating version dropdown for ${this.address} with selected version ${selectedVersion}`);
		}

		if (!this.address) {
			if (validationStatusEl) {
				validationStatusEl.setText("Repository address is required.");
			}
			return;
		}
		if (this.versionSetting && this.trackFixedVersion) {
			// Clear the version dropdown
			this.updateVersionDropdown(this.versionSetting, [], selectedVersion);
		}
		let scrubbedAddress = this.address.replace("https://github.com/", "");
		if (scrubbedAddress.endsWith(".git")) {
			scrubbedAddress = scrubbedAddress.slice(0, -4);
		}

		try {
			const versions = await fetchReleaseVersions(
				scrubbedAddress,
				this.plugin.settings.debuggingMode,
				this.privateApiKey || this.plugin.settings.personalAccessToken,
			);

			if (versions && versions.length > 0) {
				// Add valid-repository class
				validateInputEl?.inputEl.classList.remove("invalid-repository");
				validateInputEl?.inputEl.classList.add("valid-repository");

				if (this.versionSetting) {
					this.versionSetting.settingEl.classList.remove("disabled-setting");
					this.versionSetting.setDisabled(false);
					// Add new dropdown to existing version setting
					this.updateVersionDropdown(this.versionSetting, versions, selectedVersion);
				}
			} else {
				// Add invalid-repository class
				validateInputEl?.inputEl.classList.remove("valid-repository");
				validateInputEl?.inputEl.classList.add("invalid-repository");

				if (this.versionSetting) {
					this.versionSetting.settingEl.classList.add("disabled-setting");
					this.versionSetting.setDisabled(true);
					this.addPluginButton?.setDisabled(true);
				}
			}
		} catch (error: unknown) {
			if (error instanceof GHRateLimitError) {
				// Add invalid-repository class
				validateInputEl?.inputEl.classList.remove("valid-repository");
				validateInputEl?.inputEl.classList.add("validation-error");
				validationStatusEl?.setText(`GitHub API rate limit exceeded. Try again in ${error.getMinutesToReset()} minutes.`);

				if (this.versionSetting) {
					this.versionSetting.settingEl.classList.add("disabled-setting");
					this.versionSetting.setDisabled(true);
					this.addPluginButton?.setDisabled(true);
				}

				toastMessage(
					this.plugin,
					`${error.message} Consider adding a personal access token in BRAT settings for higher limits. See documentation for details.`,
					20,
					(): void => {
						window.open("https://github.com/TfTHacker/obsidian42-brat/blob/main/BRAT-DEVELOPER-GUIDE.md#github-api-rate-limits");
					},
				);

				// toastMessage(this.plugin, `GitHub API rate limit exceeded. Try again in ${error.getMinutesToReset()} minutes.`, 10);
			}

			if (error instanceof GitHubResponseError) {
				const gitHubError = error as GitHubResponseError;
				switch (gitHubError.status) {
					case 404:
						validationStatusEl?.setText("Repository not found.");
						break;
					case 403:
						validationStatusEl?.setText("Access denied. Check your personal access token.");
						break;
					default:
						validationStatusEl?.setText(`Error: ${gitHubError.message}`);
						break;
				}
				toastMessage(this.plugin, `${gitHubError.message} `, 20);
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

	private isGitHubRepositoryMatch(address: string): boolean {
		// Remove trailing .git if present
		const cleanAddress = address
			.trim()
			.replace(/\.git$/, "")
			.toLowerCase();

		// Match either format:
		// 1. user/repo
		// 2. https://github.com/user/repo
		const githubPattern = /^(?:https:\/\/github\.com\/)?([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/;

		return githubPattern.test(cleanAddress);
	}
}
