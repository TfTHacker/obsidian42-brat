import type { TextComponent } from "obsidian";
import {
	ButtonComponent,
	Modal,
	Platform,
	SecretComponent,
	Setting,
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
import { getTranslations } from "../i18n";
import type BratPlugin from "../main";
import { existBetaPluginInList, updatePluginTokenName } from "../settings";
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
	secretName: string;
	validToken: boolean | undefined;
	tokenInputEl: SecretComponent | null = null;
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
		prefillSecretName = "",
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.betaPlugins = betaPlugins;
		this.address = prefillRepo;
		this.version = prefillVersion;
		this.secretName = prefillSecretName;
		this.openSettingsTabAfterwards = openSettingsTabAfterwards;
		this.updateVersion = updateVersion;
		this.enableAfterInstall = plugin.settings.enableAfterInstall;
	}

	async submitForm(): Promise<void> {
		const text = getTranslations().addBetaPluginModal;
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
				this.secretName,
			);
			if (result) {
				this.close();
			}

			// Reset modal if we don't close (i.e. because plugin could not be installed)
			this.cancelButton?.setDisabled(false);
			this.addPluginButton?.setDisabled(false);
			this.addPluginButton?.setButtonText(text.buttons.addPlugin);
			this.versionSetting?.setDisabled(false);

			return;
		}

		if (!this.version && existBetaPluginInList(this.plugin, scrubbedAddress)) {
			toastMessage(this.plugin, text.alreadyInList, 10);
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
			this.secretName,
		);
		if (result) {
			this.close();
		}

		// Reset modal if we don't close (i.e. because plugin could not be installed)
		this.cancelButton?.setDisabled(false);
		this.addPluginButton?.setDisabled(false);
		this.addPluginButton?.setButtonText(text.buttons.addPlugin);
		this.versionSetting?.setDisabled(false);
	}

	private updateVersionDropdown(
		settingEl: Setting,
		versions: ReleaseVersion[],
		selected = "",
	): void {
		const text = getTranslations().addBetaPluginModal;
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
				dropdown.addOption("", text.version.selectVersion);
				dropdown.addOption("latest", text.version.latestVersion);
				for (const version of versions) {
					dropdown.addOption(
						version.version,
						`${version.version} ${version.prerelease ? text.version.prereleaseSuffix : ""}`,
					);
				}
				dropdown.onChange((value: string) => {
					this.version = value;
					this.addPluginButton?.setDisabled(this.version === "");
				});
				dropdown.setValue(selectedVersion);

				dropdown.selectEl.addClass("brat-version-selector");
			});
		} else {
			// Use suggest modal for many versions
			settingEl.addButton((button) => {
				button
					.setButtonText(
						selectedVersion === "latest"
							? text.version.latestVersion
							: selectedVersion || text.version.selectVersionEllipsis,
					)
					.setClass("brat-version-selector")
					.setClass("button")
					.onClick(() => {
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
										? text.version.latestVersion
										: version || text.version.selectVersionEllipsis,
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
		const text = getTranslations().addBetaPluginModal;
		const heading = this.contentEl.createEl("h4");
		if (this.address) {
			heading.appendText(text.heading.changePluginVersion);
			heading.appendChild(createGitHubResourceLink(this.address));
		} else {
			heading.setText(text.heading.githubRepositoryForBetaPlugin);
		}

		this.contentEl.createEl("form", {}, (formEl) => {
			const commonText = getTranslations().common;
			formEl.addClass("brat-modal");

			if (!this.address || !this.updateVersion) {
				const repoSetting = new Setting(formEl).setClass("repository-setting");

				repoSetting.then((setting) => {
					// Show as input field for new plugins
					setting.addText((addressEl) => {
						this.repositoryAddressEl = addressEl;

						addressEl.setPlaceholder(text.repository.placeholder);
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
							(e: KeyboardEvent) => {
								if (e.key === "Enter") {
									void (async () => {
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
									})();
								}
							},
						);

						// Update version dropdown when input loses focus
						addressEl.inputEl.addEventListener("blur", () => {
							void this.updateRepositoryVersionInfo(
								this.version,
								validationStatusEl,
							);
						});

						// FIXME
						setting.setDesc(text.repository.label);
						addressEl.inputEl.addClass("brat-full-width-input");
					});
				});
			}
			// Add validation status element (as a separate element)
			// TODO: Find better way to build the modal
			const validationStatusEl = formEl.createDiv("validation-status");
			if (!this.address)
				validationStatusEl.setText(text.repository.enterAddressToValidate);

			// Then add version dropdown
			this.versionSetting = new Setting(formEl)
				.setClass("version-setting")
				.setClass("disabled-setting");
			this.updateVersionDropdown(this.versionSetting, [], this.version);
			this.versionSetting.setDisabled(true);

			// Token setting section
			const tokenElement = formEl.createDiv("token-setting");
			new Setting(tokenElement)
				.setName(text.token.name)
				.setDesc(text.token.desc)
				.addComponent((el) =>
					new SecretComponent(this.plugin.app, el)
						.setValue(this.secretName)
						.onChange((selectedSecretName: string | null) => {
							void (async () => {
								// User selected a different secret name (can be null when cleared)
								this.secretName = selectedSecretName?.trim() || "";
								if (!this.secretName) {
									if (
										this.address &&
										existBetaPluginInList(this.plugin, this.address)
									) {
										updatePluginTokenName(this.plugin, this.address, "");
										toastMessage(
											this.plugin,
											text.token.settingCleared(this.address),
											3,
										);
									}
									void this.updateRepositoryVersionInfo(
										this.version,
										validationStatusEl,
									);
									return;
								}
								const tokenValue = this.secretName
									? this.plugin.app.secretStorage.getSecret(this.secretName)
									: null;
								if (tokenValue) {
									this.validToken = await this.validator?.validateToken(
										tokenValue,
										this.address,
									);
									if (!this.validToken) {
										this.validateButton?.setButtonText(text.buttons.invalid);
										this.validateButton?.setDisabled(false);
									} else {
										this.validateButton?.setButtonText(text.buttons.valid);
										this.validateButton?.setDisabled(true);

										// Update version dropdown when API key changes
										if (this.address) {
											await this.updateRepositoryVersionInfo(
												this.version,
												validationStatusEl,
											);

											// Update the secret name for this plugin in the settings if it already exists there
											if (existBetaPluginInList(this.plugin, this.address)) {
												updatePluginTokenName(
													this.plugin,
													this.address,
													this.secretName,
												);
												toastMessage(
													this.plugin,
													text.token.settingUpdated(this.address),
													3,
												);
											}
										}
									}
								}
							})();
						}),
				);

			// Initialize validator
			this.validator = new TokenValidator();

			// Validate the current token if we have a secret name
			if (this.secretName) {
				const tokenValue = this.plugin.app.secretStorage.getSecret(
					this.secretName,
				);
				if (tokenValue) {
					// Validate asynchronously on initial load
					void this.validator
						?.validateToken(tokenValue, this.address)
						.then((isValid) => {
							this.validToken = isValid;
							if (this.validToken) {
								this.validateButton?.setButtonText(text.buttons.valid);
								this.validateButton?.setDisabled(true);
							}
						});
				}
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
						labelEl.appendText(text.enableAfterInstall);
					},
				);

				this.cancelButton = new ButtonComponent(buttonContainerEl)
					.setButtonText(text.buttons.neverMind)
					.setClass("mod-cancel")
					.onClick(() => {
						this.close();
					});

				this.addPluginButton = new ButtonComponent(buttonContainerEl)
					.setButtonText(
						this.updateVersion
							? this.address
								? text.buttons.changeVersion
								: text.buttons.addPlugin
							: text.buttons.addPlugin,
					)
					.setCta()
					.onClick(() => {
						if (this.address !== "") {
							if (
								(this.updateVersion && this.version !== "") ||
								!this.updateVersion
							) {
								// Submit the form
								this.addPluginButton?.setDisabled(true);
								this.addPluginButton?.setButtonText(text.buttons.installing);
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
			newDiv.addClass("brat-modal-divider");
			const authorByline = newDiv.createSpan();
			authorByline.createEl("a", {
				href: "https://bit.ly/o42-twitter",
				text: "TFTHacker",
			});
			authorByline.appendText(commonText.and);
			authorByline.createEl("a", {
				href: "https://github.com/johannrichard",
				text: "johannrichard",
			});
			authorByline.addClass("brat-credits");
			newDiv.appendChild(authorByline);
			promotionalLinks(newDiv, false);

			// Prevent default form submission on Enter key and button clicks, and ensure buttons don't trigger form submission
			const buttons = formEl.querySelectorAll("button");
			for (const button of Array.from(buttons)) {
				// Set type to prevent form submission
				button.setAttribute("type", "button");
			}

			// Invoked when "Submit" button is clicked.
			formEl.addEventListener("submit", (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
			});
		});

		if (this.address) {
			// If we have a prefilled repo, trigger the version dropdown update
			window.setTimeout(() => {
				void this.updateRepositoryVersionInfo(this.version);
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
		const text = getTranslations().addBetaPluginModal;
		const validateInputEl = this.repositoryAddressEl;
		if (this.plugin.settings.debuggingMode) {
			console.debug(
				`[BRAT] Updating version dropdown for ${this.address} with selected version ${selectedVersion}`,
			);
		}

		if (!this.address) {
			validationStatusEl?.setText(text.repository.addressRequired);
			validationStatusEl?.addClass("validation-status-error");
			return;
		}

		validationStatusEl?.setText(text.repository.validating);
		validationStatusEl?.removeClass("validation-status-error");

		if (this.versionSetting && this.updateVersion) {
			// Clear the version dropdown
			this.updateVersionDropdown(this.versionSetting, []);
		}
		const scrubbedAddress = scrubRepositoryUrl(this.address);

		try {
			// Get the actual token value from SecretStorage
			let tokenToUse = "";
			if (this.secretName) {
				const tokenValue = this.plugin.app.secretStorage.getSecret(
					this.secretName,
				);
				if (tokenValue) {
					tokenToUse = tokenValue;
				}
			} else if (this.plugin.settings.globalTokenName) {
				const globalToken = this.plugin.app.secretStorage.getSecret(
					this.plugin.settings.globalTokenName,
				);
				if (globalToken) {
					tokenToUse = globalToken;
				}
			}

			const versions = await fetchReleaseVersions(
				scrubbedAddress,
				this.plugin.settings.debuggingMode,
				tokenToUse,
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
				validationStatusEl?.setText(text.repository.noReleasesFound);
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
					text.repository.rateLimitExceeded(error.getMinutesToReset()),
				);

				if (this.versionSetting) {
					this.versionSetting.settingEl.classList.add("disabled-setting");
					this.versionSetting.setDisabled(true);
					this.addPluginButton?.setDisabled(true);
				}

				toastMessage(
					this.plugin,
					text.repository.rateLimitToast(error.message),
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
				const gitHubError = error;
				switch (gitHubError.status) {
					case 404:
						validationStatusEl?.setText(text.repository.notFound);
						break;
					case 403:
						validationStatusEl?.setText(text.repository.accessDenied);
						break;
					default:
						validationStatusEl?.setText(
							text.repository.error(gitHubError.message),
						);
						break;
				}

				// Disable relevant settings
				validationStatusEl?.addClass("validation-status-error");
				this.versionSetting?.setDisabled(true);
				this.addPluginButton?.setDisabled(true);

				toastMessage(
					this.plugin,
					text.repository.gitHubResponseToast(gitHubError.message),
					20,
				);
			}
		}
	}

	onClose(): void {
		if (this.openSettingsTabAfterwards) {
			this.plugin.app.setting.open();
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
