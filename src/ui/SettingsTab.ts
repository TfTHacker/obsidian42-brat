import type {
	App,
	ButtonComponent,
	ExtraButtonComponent,
	SecretComponent,
	ToggleComponent,
} from "obsidian";
import {
	PluginSettingTab,
	SecretComponent as SecretComponentClass,
	Setting,
	SettingGroup,
} from "obsidian";
import { TokenValidator } from "src/utils/TokenValidator";
import { themeDelete } from "../features/themes";
import { getTranslations } from "../i18n";
import type BratPlugin from "../main";
import { toastMessage } from "../utils/notifications";
import { createGitHubResourceLink, createLink } from "../utils/utils";
import AddNewTheme from "./AddNewTheme";
import { promotionalLinks } from "./Promotional";

export class BratSettingsTab extends PluginSettingTab {
	plugin: BratPlugin;
	accessTokenSetting: SecretComponent | null = null;
	accessTokenButton: ButtonComponent | null = null;
	tokenInfo: HTMLElement | null = null;
	validator: TokenValidator | null = null;

	constructor(app: App, plugin: BratPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private async copyRepoIdentifier(identifier: string): Promise<void> {
		if (!identifier) return;

		try {
			if (!navigator.clipboard?.writeText) {
				throw new Error("Clipboard API unavailable");
			}
			await navigator.clipboard.writeText(identifier);

			toastMessage(this.plugin, `Copied: ${identifier}`, 3);
		} catch (error) {
			console.error("Failed to copy repository identifier", identifier, error);
			toastMessage(
				this.plugin,
				"Failed to copy identifier. Check clipboard permissions.",
				5,
			);
		}
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("brat-settings");
		const text = getTranslations().settings;

		new Setting(containerEl)
			.setName(text.general.autoEnablePluginsAfterInstallation.name)
			.setDesc(text.general.autoEnablePluginsAfterInstallation.desc)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.enableAfterInstall).onChange(
					async (value: boolean) => {
						this.plugin.settings.enableAfterInstall = value;
						await this.plugin.saveSettings();
					},
				);
			});

		new Setting(containerEl)
			.setName(text.general.autoUpdatePluginsAtStartup.name)
			.setDesc(text.general.autoUpdatePluginsAtStartup.desc)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateAtStartup).onChange(
					async (value: boolean) => {
						this.plugin.settings.updateAtStartup = value;
						await this.plugin.saveSettings();
					},
				);
			});

		new Setting(containerEl)
			.setName(text.general.autoUpdateThemesAtStartup.name)
			.setDesc(text.general.autoUpdateThemesAtStartup.desc)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateThemesAtStartup).onChange(
					async (value: boolean) => {
						this.plugin.settings.updateThemesAtStartup = value;
						await this.plugin.saveSettings();
					},
				);
			});

		new Setting(containerEl)
			.setName(text.general.selectLatestPluginVersionByDefault.name)
			.setDesc(text.general.selectLatestPluginVersionByDefault.desc)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(
					this.plugin.settings.selectLatestPluginVersionByDefault,
				).onChange(async (value: boolean) => {
					this.plugin.settings.selectLatestPluginVersionByDefault = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(text.general.allowIncompatiblePlugins.name)
			.setDesc(text.general.allowIncompatiblePlugins.desc)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.allowIncompatiblePlugins).onChange(
					async (value: boolean) => {
						this.plugin.settings.allowIncompatiblePlugins = value;
						await this.plugin.saveSettings();
					},
				);
			});

		promotionalLinks(containerEl, true);
		containerEl.createEl("hr");
		const frozenVersions = new Map(
			this.plugin.settings.pluginSubListFrozenVersion.map((f) => [f.repo, f]),
		);
		const pluginContainers = new Map<
			string,
			{ container: HTMLElement; pluginName: string }
		>();

		const betaPluginGroup = new SettingGroup(containerEl).setHeading(
			text.betaPluginList.heading,
		);

		betaPluginGroup.addSearch((cb) => {
			cb.setPlaceholder(text.betaPluginList.filterPlaceholder);

			cb.onChange((value: string) => {
				const filterValue = value.toLowerCase().trim();
				pluginContainers.forEach(({ container, pluginName }) => {
					if (filterValue === "") {
						container.removeAttribute("hidden");
					} else {
						if (pluginName.includes(filterValue)) {
							container.removeAttribute("hidden");
						} else {
							container.setAttribute("hidden", "true");
						}
					}
				});
			});
		});

		betaPluginGroup.addSetting((setting) => {
			const pluginListDescription = document.createDocumentFragment();
			pluginListDescription.createEl("div", {
				text: text.betaPluginList.description.intro,
			});

			pluginListDescription.createEl("p");
			pluginListDescription.createEl("div", {
				text: text.betaPluginList.description.editAndRemove,
			});
			pluginListDescription.createEl("p");
			pluginListDescription
				.createEl("span")
				.createEl("b", { text: text.betaPluginList.description.noteLabel });
			pluginListDescription.createSpan({
				text: text.betaPluginList.description.noteText,
			});

			setting.setDesc(pluginListDescription);
			setting.addButton((cb: ButtonComponent) => {
				cb.setButtonText(text.betaPluginList.addBetaPlugin)
					.setCta()
					.onClick(() => {
						this.plugin.betaPlugins.displayAddNewPluginModal(true);
					});
			});
		});

		for (const p of this.plugin.settings.pluginList) {
			const bp = frozenVersions.get(p);
			betaPluginGroup.addSetting((pluginSettingContainer) => {
				const secretName = bp?.tokenName || "";
				const secretValue = secretName
					? this.plugin.app.secretStorage.getSecret(secretName)
					: "";
				const isSecretMissing = Boolean(secretName && !secretValue);

				const pluginDescription = document.createDocumentFragment();
				const trackedVersionText = bp?.version
					? text.betaPluginList.trackedVersion(
							bp.version,
							bp.version !== "latest",
						)
					: "";
				const incompatibleText = bp?.isIncompatible
					? text.betaPluginList.incompatible
					: "";
				pluginDescription.createDiv({
					text: `${trackedVersionText}${incompatibleText}`,
				});
				if (isSecretMissing) {
					pluginDescription.createDiv({
						text: text.betaPluginList.secretMissing(secretName),
						cls: "mod-warning",
						title: text.betaPluginList.secretMissingTitle,
					});
				}

				pluginSettingContainer
					.setName(createGitHubResourceLink(p))
					.setDesc(pluginDescription);

				const containerElement = pluginSettingContainer.settingEl;
				containerElement.addClass("brat-plugin-item");
				pluginContainers.set(p, {
					container: containerElement,
					pluginName: p.toLowerCase(),
				});

				pluginSettingContainer.addExtraButton((btn: ExtraButtonComponent) => {
					btn
						.setIcon("copy")
						.setTooltip("Copy plugin identifier")
						.onClick(async () => {
							await this.copyRepoIdentifier(p);
						});
				});

				if (!bp?.version || bp.version === "latest") {
					// Only show update button for plugins tracking latest version
					pluginSettingContainer.addButton((btn: ButtonComponent) => {
						if (isSecretMissing) {
							// Token name configured but secret missing: make button red, disabled, and show informative tooltip
							btn
								.setIcon("sync")
								.setTooltip(
									text.betaPluginList.secretMissingTooltip(secretName),
								)
								.setWarning()
								.setDisabled(true);
						} else {
							btn
								.setIcon("sync")
								.setTooltip(text.betaPluginList.checkAndUpdatePlugin)
								.onClick(async () => {
									await this.plugin.betaPlugins.updatePlugin(
										p,
										false,
										true,
										false,
										bp?.tokenName || "",
									);
								});
						}
					});
				}

				// Container for the edit and removal buttons
				pluginSettingContainer
					.addButton((btn: ButtonComponent) => {
						btn
							.setIcon("edit")
							.setTooltip(text.betaPluginList.changeVersionAndUpdateSettings);

						if (isSecretMissing) {
							btn.setWarning();
						}

						btn.onClick(() => {
							this.plugin.betaPlugins.displayAddNewPluginModal(
								true,
								true,
								p,
								bp?.version,
								bp?.tokenName || "", // Pass secret name, not token value
							);
							this.plugin.app.setting.updatePluginSection();
						});
					})
					.addButton((btn: ButtonComponent) => {
						btn
							.setIcon("cross")
							.setTooltip(text.betaPluginList.removeThisBetaPlugin)
							.setWarning()
							.onClick(() => {
								if (btn.buttonEl.textContent === "") {
									btn.setButtonText(text.betaPluginList.confirmRemoval);
								} else {
									const { buttonEl } = btn;
									const { parentElement } = buttonEl;
									if (parentElement?.parentElement) {
										parentElement.parentElement.remove();
										this.plugin.betaPlugins.deletePlugin(p);
									}
								}
							});
					});
			});
		}

		const themeContainers = new Map<
			string,
			{ container: HTMLElement; themeName: string }
		>();
		const betaThemeGroup = new SettingGroup(containerEl).setHeading(
			text.betaThemeList.heading,
		);

		betaThemeGroup.addSetting((setting) => {
			setting.addButton((cb: ButtonComponent) => {
				cb.setButtonText(text.betaThemeList.addBetaTheme)
					.setCta()
					.onClick(() => {
						this.plugin.app.setting.close();
						new AddNewTheme(this.plugin).open();
					});
			});
		});

		betaThemeGroup.addSearch((cb) => {
			cb.setPlaceholder(text.betaThemeList.filterPlaceholder);

			cb.onChange((value: string) => {
				const filterValue = value.toLowerCase().trim();
				themeContainers.forEach(({ container, themeName }) => {
					if (filterValue === "") {
						container.removeAttribute("hidden");
					} else {
						if (themeName.includes(filterValue)) {
							container.removeAttribute("hidden");
						} else {
							container.setAttribute("hidden", "true");
						}
					}
				});
			});
		});

		for (const bp of this.plugin.settings.themesList) {
			betaThemeGroup.addSetting((themeSettingContainer) => {
				themeSettingContainer.setName(createGitHubResourceLink(bp.repo));

				const containerElement = themeSettingContainer.settingEl;
				containerElement.addClass("brat-theme-item");
				themeContainers.set(bp.repo, {
					container: containerElement,
					themeName: bp.repo.toLowerCase(),
				});

				themeSettingContainer.addExtraButton((btn: ExtraButtonComponent) => {
					btn
						.setIcon("copy")
						.setTooltip("Copy theme identifier")
						.onClick(async () => {
							await this.copyRepoIdentifier(bp.repo);
						});
				});

				themeSettingContainer.addButton((btn: ButtonComponent) => {
					btn
						.setIcon("cross")
						.setTooltip(text.betaThemeList.deleteThisBetaTheme)
						.onClick(() => {
							if (btn.buttonEl.textContent === "")
								btn.setButtonText(text.betaThemeList.confirmRemoval);
							else {
								const { buttonEl } = btn;
								const { parentElement } = buttonEl;
								if (parentElement?.parentElement) {
									parentElement.parentElement.remove();
									themeDelete(this.plugin, bp.repo);
								}
							}
						});
				});
			});
		}

		const monitoringGroup = new SettingGroup(containerEl).setHeading(
			text.monitoring.heading,
		);

		monitoringGroup.addSetting((setting) => {
			setting
				.setName(text.monitoring.enableNotifications.name)
				.setDesc(text.monitoring.enableNotifications.desc)
				.addToggle((cb: ToggleComponent) => {
					cb.setValue(this.plugin.settings.notificationsEnabled);
					cb.onChange((value: boolean) => {
						this.plugin.settings.notificationsEnabled = value;
						void this.plugin.saveSettings();
					});
				});
		});

		monitoringGroup.addSetting((setting) => {
			setting
				.setName(text.monitoring.enableLogging.name)
				.setDesc(text.monitoring.enableLogging.desc)
				.addToggle((cb: ToggleComponent) => {
					cb.setValue(this.plugin.settings.loggingEnabled).onChange(
						(value: boolean) => {
							this.plugin.settings.loggingEnabled = value;
							void this.plugin.saveSettings();
						},
					);
				});
		});

		monitoringGroup.addSetting((setting) => {
			setting
				.setName(text.monitoring.bratLogFileLocation.name)
				.setDesc(text.monitoring.bratLogFileLocation.desc)
				.addSearch((cb) => {
					cb.setPlaceholder(text.monitoring.bratLogFileLocation.placeholder)
						.setValue(this.plugin.settings.loggingPath)
						.onChange((newFolder) => {
							this.plugin.settings.loggingPath = newFolder;
							void this.plugin.saveSettings();
						});
				});
		});

		monitoringGroup.addSetting((setting) => {
			setting
				.setName(text.monitoring.enableVerboseLogging.name)
				.setDesc(text.monitoring.enableVerboseLogging.desc)
				.addToggle((cb: ToggleComponent) => {
					cb.setValue(this.plugin.settings.loggingVerboseEnabled).onChange(
						(value: boolean) => {
							this.plugin.settings.loggingVerboseEnabled = value;
							void this.plugin.saveSettings();
						},
					);
				});
		});

		monitoringGroup.addSetting((setting) => {
			setting
				.setName(text.monitoring.debuggingMode.name)
				.setDesc(text.monitoring.debuggingMode.desc)
				.addToggle((cb: ToggleComponent) => {
					cb.setValue(this.plugin.settings.debuggingMode).onChange(
						(value: boolean) => {
							this.plugin.settings.debuggingMode = value;
							void this.plugin.saveSettings();
						},
					);
				});
		});

		// Personal access token setting
		const tokenSection = new SettingGroup(containerEl).setHeading(
			text.githubPersonalAccessToken.heading,
		);

		let currentTokenValue = "";
		tokenSection.addSetting((tokenSetting) => {
			tokenSetting
				.setName(text.githubPersonalAccessToken.personalAccessToken.name)
				.setDesc(
					createLink({
						prependText:
							text.githubPersonalAccessToken.personalAccessToken.desc
								.prependText,
						url: "https://github.com/settings/tokens/new?scopes=public_repo",
						text: text.githubPersonalAccessToken.personalAccessToken.desc
							.linkText,
						appendText:
							text.githubPersonalAccessToken.personalAccessToken.desc
								.appendText,
					}),
				);

			// Create SecretComponent - displays secret NAME selector
			this.accessTokenSetting = new SecretComponentClass(
				this.plugin.app,
				tokenSetting.controlEl,
			);

			// Set the component to show the current secret name from settings
			this.accessTokenSetting
				.setValue(this.plugin.settings.globalTokenName || "")
				.onChange((secretName: string | null) => {
					void (async () => {
						// secretName is the NAME of the secret, not the value (can be null when cleared)
						const normalizedName = secretName?.trim() || "";
						this.plugin.settings.globalTokenName = normalizedName;
						await this.plugin.saveSettings();

						// Get the actual token value for validation
						if (normalizedName) {
							currentTokenValue =
								this.plugin.app.secretStorage.getSecret(normalizedName) || "";
							this.accessTokenButton?.setDisabled(false);
						} else {
							currentTokenValue = "";
							this.accessTokenButton?.setDisabled(true);
							await this.validator?.validateToken("");
						}
					})();
				});

			// Get initial token value for validation
			if (this.plugin.settings.globalTokenName) {
				currentTokenValue =
					this.plugin.app.secretStorage.getSecret(
						this.plugin.settings.globalTokenName,
					) || "";
			}

			tokenSetting
				.addExtraButton((cb: ExtraButtonComponent) => {
					cb.setIcon("cross")
						.setTooltip(text.githubPersonalAccessToken.clearPersonalAccessToken)
						.onClick(async () => {
							this.plugin.settings.globalTokenName = "";
							await this.plugin.saveSettings();
							this.accessTokenSetting?.setValue("");
							currentTokenValue = "";
							await this.validator?.validateToken("");
						});
				})
				.addButton((btn: ButtonComponent) => {
					this.accessTokenButton = btn;

					btn
						.setButtonText(text.githubPersonalAccessToken.validate)
						.setCta()
						.onClick(async () => {
							if (currentTokenValue) {
								await this.validator?.validateToken(currentTokenValue);
							}
						});
				})
				.then(() => {
					this.tokenInfo = this.createTokenInfoElement(containerEl);
					this.validator = new TokenValidator(this.tokenInfo);

					// Validate the current token on load
					void this.validator
						?.validateToken(currentTokenValue)
						.then((valid) => {
							this.accessTokenButton?.setDisabled(
								valid || !this.plugin.settings.globalTokenName,
							);
						});
				});
		});
	}

	private createTokenInfoElement(containerEl: HTMLElement): HTMLElement {
		const tokenInfo = containerEl.createDiv({ cls: "brat-token-info" });
		tokenInfo.createDiv({ cls: "brat-token-status" });
		tokenInfo.createDiv({ cls: "brat-token-details" });
		return tokenInfo;
	}
}
