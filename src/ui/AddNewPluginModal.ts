import {
	ButtonComponent,
	Modal,
	Platform,
	Setting,
	TextComponent,
} from "obsidian";
import {
	fetchReleaseVersions,
	type ReleaseVersion,
	scrubRepositoryUrl,
} from "src/features/githubUtils";
import {
	GHRateLimitError,
	GitHubResponseError,
} from "src/utils/GitHubAPIErrors";
import { TokenValidator } from "src/utils/TokenValidator";
import { createGitHubResourceLink } from "src/utils/utils";
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
	readonly updateVersion: boolean;
	version: string;
	versionSetting: Setting | null = null;

	// Repository Setting
	repositoryAddressEl: TextComponent | null = null;

	// Token Validation
	usePrivateApiKey: boolean;
	privateApiKey: string;
	validToken: boolean | undefined;
	tokenInputEl: TextComponent | null = null;
	validateButton: ButtonComponent | null = null;
	validator: TokenValidator | null = null;

	// Plugin install action
	enableAfterInstall: boolean;
	addPluginButton: ButtonComponent | null = null;
	cancelButton: ButtonComponent | null = null;

	constructor(
		plugin: BratPlugin,
		betaPlugins: BetaPlugins,
		openSettingsTabAfterwards = false,
		updateVersion = false,
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
		this.usePrivateApiKey = !(
			prefillPrivateApiKey === "" || prefillPrivateApiKey === undefined
		);
		this.openSettingsTabAfterwards = openSettingsTabAfterwards;
		this.updateVersion = updateVersion;
		this.enableAfterInstall = plugin.settings.enableAfterInstall;
	}

	async submitForm(): Promise<void> {
		if (this.address === "") return;
		const scrubbedAddress = scrubRepositoryUrl(this.address);

		// If it's an existing frozen version plugin, update it instead of checking for duplicates
		const existingFrozenPlugin =
			this.plugin.settings.pluginSubListFrozenVersion.find(
				(p) => p.repo === scrubbedAddress,
			);
		if (existingFrozenPlugin) {
			const result = await this.betaPlugins.addPlugin(
				scrubbedAddress,
				false,
				false,
				false,
				this.version,
				true, // Force reinstall
				this.enableAfterInstall,
				this.usePrivateApiKey ? this.privateApiKey : undefined,
			);
			if (result) {
				this.close();
			}

			// Reset modal if we don't close (i.e. because plugin could not be installed)
			this.cancelButton?.setDisabled(false);
			this.addPluginButton?.setDisabled(false);
			this.addPluginButton?.setButtonText("Add Plugin");
			this.versionSetting?.setDisabled(false);

			return;
		}

		if (!this.version && existBetaPluginInList(this.plugin, scrubbedAddress)) {
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
			this.usePrivateApiKey ? this.privateApiKey : undefined,
		);
		if (result) {
			this.close();
		}

		// Reset modal if we don't close (i.e. because plugin could not be installed)
		this.cancelButton?.setDisabled(false);
		this.addPluginButton?.setDisabled(false);
		this.addPluginButton?.setButtonText("Add Plugin");
		this.versionSetting?.setDisabled(false);
	}

	private updateVersionDropdown(
		settingEl: Setting,
		versions: ReleaseVersion[],
		selected = "",
	): void {
		let selectedVersion: string;

		settingEl.clear();
		if (
			versions.length > 0 &&
			!selected &&
			this.plugin.settings.selectLatestPluginVersionByDefault
		) {
			selectedVersion = "latest";
			this.version = "latest";
		} else {
			selectedVersion = selected;
		}

		const VERSION_THRESHOLD = 20;

		// With fewer than 20 versions, or on mobile, use a dropdown
		if (versions.length < VERSION_THRESHOLD || Platform.isMobile) {
			// Use dropdown for fewer versions
			settingEl.addDropdown((dropdown) => {
				dropdown.addOption("", "Select a version");
				dropdown.addOption("latest", "Latest version");
				for (const version of versions) {
					dropdown.addOption(
						version.version,
						`${version.version} ${version.prerelease ? "(Prerelease)" : ""}`,
					);
				}
				dropdown.onChange((value: string) => {
					this.version = value;
					this.addPluginButton?.setDisabled(this.version === "");
				});
				dropdown.setValue(selectedVersion);

				dropdown.selectEl.addClass("brat-version-selector");
				dropdown.selectEl.style.width = "100%";
			});
		} else {
			// Use suggest modal for many versions
			settingEl.addButton((button) => {
				button
					.setButtonText(
						selectedVersion === "latest"
							? "Latest version"
							: selectedVersion || "Select a version...",
					)
					.setClass("brat-version-selector")
					.setClass("button")
					.onClick((e: Event) => {
						e.preventDefault();
						const latest: ReleaseVersion = {
							version: "latest",
							prerelease: false,
						};
						const suggestedVersions: ReleaseVersion[] = [latest, ...versions];
						const modal = new VersionSuggestModal(
							this.app,
							this.address,
							suggestedVersions,
							selectedVersion,
							(version: string) => {
								this.version = version;
								button.setButtonText(
									version === "latest"
										? "Latest version"
										: version || "Select a version...",
								);
								this.addPluginButton?.setDisabled(this.version === "");
							},
						);
						modal.open();
					});
			});
		}
	}

	onOpen(): void {
		const heading = this.contentEl.createEl("h4");
		if (this.address) {
			heading.appendText("Change plugin version: ");
			heading.appendChild(createGitHubResourceLink(this.address));
		} else {
			heading.setText("Github repository for beta plugin:");
		}

		this.contentEl.createEl("form", {}, (formEl) => {
			formEl.addClass("brat-modal");

			if (!this.address || !this.updateVersion) {
				const repoSetting = new Setting(formEl).setClass("repository-setting");

				repoSetting.then((setting) => {
					// Show as input field for new plugins
					setting.addText((addressEl) => {
						this.repositoryAddressEl = addressEl;

						addressEl.setPlaceholder(
							"Repository (example: https://github.com/GitHubUserName/repository-name)",
						);
						addressEl.setValue(this.address);
						addressEl.onChange((value) => {
							this.address = scrubRepositoryUrl(value.trim());
							if (
								this.version !== "" &&
								(!this.address || !this.isGitHubRepositoryMatch(this.address))
							) {
								// Disable version dropdown if version is set and address is empty
								if (this.versionSetting) {
									this.updateVersionDropdown(this.versionSetting, []);
									this.versionSetting.settingEl.classList.add(
										"disabled-setting",
									);
									this.versionSetting.setDisabled(true);
									addressEl.inputEl.classList.remove("valid-repository");
									addressEl.inputEl.classList.remove("invalid-repository");
								}
							}

							// If the GitHub Repository matches the GitHub pattern, enable the "Add Plugin"
							if (!this.version) {
								if (this.isGitHubRepositoryMatch(this.address))
									this.addPluginButton?.setDisabled(false);
								else this.addPluginButton?.setDisabled(true);
							}
						});

						addressEl.inputEl.addEventListener(
							"keydown",
							async (e: KeyboardEvent) => {
								if (e.key === "Enter") {
									if (
										this.address &&
										((this.updateVersion && this.version !== "") ||
											!this.updateVersion)
									) {
										e.preventDefault();
										this.addPluginButton?.setDisabled(true);
										this.cancelButton?.setDisabled(true);
										this.versionSetting?.setDisabled(true);
										void this.submitForm();
									}

									// Populate version dropdown
									await this.updateRepositoryVersionInfo(
										this.version,
										validationStatusEl,
									);
								}
							},
						);

						// Update version dropdown when input loses focus
						addressEl.inputEl.addEventListener("blur", async () => {
							await this.updateRepositoryVersionInfo(
								this.version,
								validationStatusEl,
							);
						});

						// FIXME
						setting.setDesc("Repository");
						addressEl.inputEl.style.width = "100%";
					});
				});
			}
			// Add validation status element (as a separate element)
			// TODO: Find better way to build the modal
			const validationStatusEl = formEl.createDiv("validation-status");
			if (!this.address)
				validationStatusEl.setText(
					"Enter a GitHub repository address to validate it.",
				);

			// Then add version dropdown
			this.versionSetting = new Setting(formEl)
				.setClass("version-setting")
				.setClass("disabled-setting");
			this.updateVersionDropdown(this.versionSetting, [], this.version);
			this.versionSetting.setDisabled(true);

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
						checkboxEl.checked = this.usePrivateApiKey;
						checkboxEl.addEventListener("click", () => {
							this.usePrivateApiKey = checkboxEl.checked;
							this.validateButton?.setDisabled(
								!this.usePrivateApiKey || !this.validToken,
							);
							this.tokenInputEl?.setDisabled(!this.usePrivateApiKey);
							if (
								!this.usePrivateApiKey ||
								(this.validToken && this.usePrivateApiKey)
							)
								this.updateRepositoryVersionInfo(
									this.version,
									validationStatusEl,
								);
						});
						labelEl.appendText("Use token for this repository");
					},
				);

				this.tokenInputEl = new TextComponent(buttonContainerEl)
					.setPlaceholder("GitHub API key for private repository")
					.setValue(this.privateApiKey)
					.setDisabled(!this.usePrivateApiKey)
					.onChange(async (value) => {
						this.privateApiKey = value.trim();
						if (this.privateApiKey) {
							this.validateButton?.setButtonText("Validate");
							this.validateButton?.setDisabled(false);
						} else {
							this.validateButton?.setDisabled(true);
						}
					});

				this.tokenInputEl.inputEl.type = "password";

				// Add validation status element
				const statusEl = formEl.createDiv("brat-token-validation-status");
				if (!statusEl) return;

				// Add validate button
				if (this.tokenInputEl.inputEl.parentElement) {
					this.validateButton = new ButtonComponent(
						this.tokenInputEl.inputEl.parentElement,
					)
						.setButtonText("Validate")
						.setDisabled(this.privateApiKey === "")
						.onClick(async (e: Event) => {
							e.preventDefault();

							this.validToken = await this.validator?.validateToken(
								this.privateApiKey,
								this.address,
							);
							if (!this.validToken) {
								this.validateButton?.setButtonText("Invalid");
								this.validateButton?.setDisabled(false);
							} else {
								this.validateButton?.setButtonText("Valid");
								this.validateButton?.setDisabled(true);

								// Update version dropdown when API key changes
								if (this.address) {
									await this.updateRepositoryVersionInfo(
										this.version,
										validationStatusEl,
									);
								}
							}
						})
						.then(async () => {
							this.validator = new TokenValidator(this.tokenInputEl);
							this.validToken = await this.validator?.validateToken(
								this.privateApiKey,
								this.address,
							);
							if (this.validToken && this.usePrivateApiKey) {
								this.validateButton?.setButtonText("Valid");
								this.validateButton?.setDisabled(true);
							}
						});
				}
			});

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
					.onClick(() => {
						this.close();
					});

				this.addPluginButton = new ButtonComponent(buttonContainerEl)
					.setButtonText(
						this.updateVersion
							? this.address
								? "Change version"
								: "Add plugin"
							: "Add plugin",
					)
					.setCta()
					.onClick((e: Event) => {
						e.preventDefault();
						if (this.address !== "") {
							if (
								(this.updateVersion && this.version !== "") ||
								!this.updateVersion
							) {
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
				if (this.updateVersion || this.address === "")
					this.addPluginButton?.setDisabled(true);
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
						(this.updateVersion && this.version !== "") ||
						!this.updateVersion
					) {
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
	private async updateRepositoryVersionInfo(
		selectedVersion = "",
		validationStatusEl?: HTMLElement,
	) {
		const validateInputEl = this.repositoryAddressEl;
		if (this.plugin.settings.debuggingMode) {
			console.log(
				`[BRAT] Updating version dropdown for ${this.address} with selected version ${selectedVersion}`,
			);
		}

		if (!this.address) {
			validationStatusEl?.setText("Repository address is required.");
			validationStatusEl?.addClass("validation-status-error");
			return;
		}

		validationStatusEl?.setText("Validating repository address...");
		validationStatusEl?.removeClass("validation-status-error");

		if (this.versionSetting && this.updateVersion) {
			// Clear the version dropdown
			this.updateVersionDropdown(this.versionSetting, []);
		}
		const scrubbedAddress = scrubRepositoryUrl(this.address);

		try {
			const versions = await fetchReleaseVersions(
				scrubbedAddress,
				this.plugin.settings.debuggingMode,
				this.usePrivateApiKey
					? this.privateApiKey
					: this.plugin.settings.personalAccessToken,
			);

			if (versions && versions.length > 0) {
				// Add valid-repository class
				validateInputEl?.inputEl.classList.remove("invalid-repository");
				validateInputEl?.inputEl.classList.add("valid-repository");
				validationStatusEl?.setText("");

				if (this.versionSetting) {
					this.versionSetting.settingEl.classList.remove("disabled-setting");
					this.versionSetting.setDisabled(false);
					// Add new dropdown to existing version setting
					this.updateVersionDropdown(
						this.versionSetting,
						versions,
						selectedVersion,
					);
				}
			} else {
				// Add invalid-repository class
				validateInputEl?.inputEl.classList.remove("valid-repository");
				validateInputEl?.inputEl.classList.add("invalid-repository");
				validationStatusEl?.setText(
					"Error: No releases found in this repository.",
				);
				validationStatusEl?.addClass("validation-status-error");

				this.versionSetting?.settingEl.classList.add("disabled-setting");
				this.versionSetting?.setDisabled(true);
				this.addPluginButton?.setDisabled(true);
			}
		} catch (error: unknown) {
			if (error instanceof GHRateLimitError) {
				// Add invalid-repository class
				validateInputEl?.inputEl.classList.remove("valid-repository");
				validateInputEl?.inputEl.classList.add("validation-error");
				validationStatusEl?.setText(
					`GitHub API rate limit exceeded. Try again in ${error.getMinutesToReset()} minutes.`,
				);

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
						window.open(
							"https://github.com/TfTHacker/obsidian42-brat/blob/main/BRAT-DEVELOPER-GUIDE.md#github-api-rate-limits",
						);
					},
				);

				// toastMessage(this.plugin, `GitHub API rate limit exceeded. Try again in ${error.getMinutesToReset()} minutes.`, 10);
			}

			if (error instanceof GitHubResponseError) {
				const gitHubError = error as GitHubResponseError;
				switch (gitHubError.status) {
					case 404:
						validationStatusEl?.setText(
							"Repository not found. Check the address or provide a valid token for access to a private repository.",
						);
						break;
					case 403:
						validationStatusEl?.setText(
							"Access denied. Check your personal access token.",
						);
						break;
					default:
						validationStatusEl?.setText(`Error: ${gitHubError.message}`);
						break;
				}

				// Disable relevant settings
				validationStatusEl?.addClass("validation-status-error");
				this.versionSetting?.setDisabled(true);
				this.addPluginButton?.setDisabled(true);

				toastMessage(this.plugin, `${gitHubError.message} `, 20);
			}
		}
	}

	onClose(): void {
		if (this.openSettingsTabAfterwards) {
			// @ts-expect-error
			this.plugin.app.setting.open();
			// @ts-expect-error
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
		const githubPattern =
			/^(?:https?:\/\/github\.com\/)?([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/i;

		return githubPattern.test(cleanAddress);
	}
}
