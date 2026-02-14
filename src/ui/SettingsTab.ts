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
import type BratPlugin from "../main";
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

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("brat-settings");

		new Setting(containerEl)
			.setName("Auto-enable plugins after installation")
			.setDesc(
				'If enabled beta plugins will be automatically enabled after installtion by default. Note: you can toggle this on and off for each plugin in the "Add Plugin" form.',
			)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.enableAfterInstall).onChange(
					async (value: boolean) => {
						this.plugin.settings.enableAfterInstall = value;
						await this.plugin.saveSettings();
					},
				);
			});

		new Setting(containerEl)
			.setName("Auto-update plugins at startup")
			.setDesc(
				"If enabled all beta plugins will be checked for updates each time Obsidian starts. Note: this does not update frozen version plugins.",
			)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateAtStartup).onChange(
					async (value: boolean) => {
						this.plugin.settings.updateAtStartup = value;
						await this.plugin.saveSettings();
					},
				);
			});

		new Setting(containerEl)
			.setName("Auto-update themes at startup")
			.setDesc(
				"If enabled all beta themes will be checked for updates each time Obsidian starts.",
			)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateThemesAtStartup).onChange(
					async (value: boolean) => {
						this.plugin.settings.updateThemesAtStartup = value;
						await this.plugin.saveSettings();
					},
				);
			});

		new Setting(containerEl)
			.setName("Select latest plugin version by default")
			.setDesc(
				"If enabled the latest version will be selected by default when adding a new plugin.",
			)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(
					this.plugin.settings.selectLatestPluginVersionByDefault,
				).onChange(async (value: boolean) => {
					this.plugin.settings.selectLatestPluginVersionByDefault = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Allow incompatible plugins")
			.setDesc(
				"If enabled, plugins with higher app versions will be allowed to be installed. Also it allows desktop-only plugins to be installed on mobile devices.",
			)
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
			"Beta plugin list",
		);

		betaPluginGroup.addSearch((cb) => {
			cb.setPlaceholder("Filter plugins");

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
				text: `The following is a list of beta plugins added via the command "Add a beta plugin for testing". You can chose to add the latest version or a frozen version. A frozen version is a specific release of a plugin based on its release tag.`,
			});

			pluginListDescription.createEl("p");
			pluginListDescription.createEl("div", {
				text: "Click the 'Edit' button next to a plugin to change the installed version and the x button next to a plugin to remove it from the list.",
			});
			pluginListDescription.createEl("p");
			pluginListDescription.createEl("span").createEl("b", { text: "Note: " });
			pluginListDescription.createSpan({
				text: "Removing from the list does not delete the plugin, this should be done from the Community Plugins tab in Settings.",
			});

			setting.setDesc(pluginListDescription);
			setting.addButton((cb: ButtonComponent) => {
				cb.setButtonText("Add beta plugin")
					.setCta()
					.onClick(() => {
						this.plugin.betaPlugins.displayAddNewPluginModal(true);
					});
			});
		});

		for (const p of this.plugin.settings.pluginList) {
			const bp = frozenVersions.get(p);
			betaPluginGroup.addSetting((pluginSettingContainer) => {
				pluginSettingContainer
					.setName(createGitHubResourceLink(p))
					.setDesc(
						(bp?.version
							? ` Tracked version: ${bp.version} ${bp.version === "latest" ? "" : "(frozen)"}`
							: "") + (bp?.isIncompatible ? " (incompatible)" : ""),
					);

				const containerElement = pluginSettingContainer.settingEl;
				containerElement.addClass("brat-plugin-item");
				pluginContainers.set(p, {
					container: containerElement,
					pluginName: p.toLowerCase(),
				});

				if (!bp?.version || bp.version === "latest") {
					// Only show update button for plugins tracking latest version
					pluginSettingContainer.addButton((btn: ButtonComponent) => {
						const secretName = bp?.tokenName || "";
						const secretValue = secretName
							? this.plugin.app.secretStorage.getSecret(secretName)
							: "";

						if (secretName && !secretValue) {
							// Token name configured but secret missing: make button red, disabled, and show informative tooltip
							btn
								.setIcon("sync")
								.setTooltip(
									`Secret missing: ${secretName}. Please add the secret or update the plugin configuration.`,
								)
								.setWarning();
						} else {
							btn
								.setIcon("sync")
								.setTooltip("Check and update plugin")
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
							.setTooltip("Change version")
							.onClick(() => {
								this.plugin.betaPlugins.displayAddNewPluginModal(
									true,
									true,
									p,
									bp?.version,
									bp?.tokenName || "", // Pass secret name, not token value
								);
								// @ts-expect-error
								this.plugin.app.setting.updatePluginSection();
							});
					})
					.addButton((btn: ButtonComponent) => {
						btn
							.setIcon("cross")
							.setTooltip("Remove this beta plugin")
							.setWarning()
							.onClick(() => {
								if (btn.buttonEl.textContent === "") {
									btn.setButtonText("Click once more to confirm removal");
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
			"Beta themes list",
		);

		betaThemeGroup.addSetting((setting) =>
			setting.addButton((cb: ButtonComponent) => {
				cb.setButtonText("Add beta theme")
					.setCta()
					.onClick(() => {
						// @ts-expect-error
						this.plugin.app.setting.close();
						new AddNewTheme(this.plugin).open();
					});
			}),
		);

		betaThemeGroup.addSearch((cb) => {
			cb.setPlaceholder("Filter themes");

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

				themeSettingContainer.addButton((btn: ButtonComponent) => {
					btn
						.setIcon("cross")
						.setTooltip("Delete this beta theme")
						.onClick(() => {
							if (btn.buttonEl.textContent === "")
								btn.setButtonText("Click once more to confirm removal");
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

		const monitoringGroup = new SettingGroup(containerEl)
			.setHeading("Monitoring")
			.addSetting((setting) =>
				setting
					.setName("Enable notifications")
					.setDesc(
						"BRAT will provide popup notifications for its various activities. Turn this off means  no notifications from BRAT.",
					)
					.addToggle((cb: ToggleComponent) => {
						cb.setValue(this.plugin.settings.notificationsEnabled);
						cb.onChange(async (value: boolean) => {
							this.plugin.settings.notificationsEnabled = value;
							await this.plugin.saveSettings();
						});
					}),
			)
			.addSetting((setting) =>
				setting
					.setName("Enable logging")
					.setDesc("Plugin updates will be logged to a file in the log file.")
					.addToggle((cb: ToggleComponent) => {
						cb.setValue(this.plugin.settings.loggingEnabled).onChange(
							async (value: boolean) => {
								this.plugin.settings.loggingEnabled = value;
								await this.plugin.saveSettings();
							},
						);
					}),
			)
			.addSetting((setting) =>
				setting
					.setName("BRAT log file location")
					.setDesc(
						"Logs will be saved to this file. Don't add .md to the file name.",
					)
					.addSearch((cb) => {
						cb.setPlaceholder("Example: BRAT-log")
							.setValue(this.plugin.settings.loggingPath)
							.onChange(async (newFolder) => {
								this.plugin.settings.loggingPath = newFolder;
								await this.plugin.saveSettings();
							});
					}),
			)
			.addSetting((setting) =>
				setting
					.setName("Enable verbose logging")
					.setDesc("Get a lot  more information in  the log.")
					.addToggle((cb: ToggleComponent) => {
						cb.setValue(this.plugin.settings.loggingVerboseEnabled).onChange(
							async (value: boolean) => {
								this.plugin.settings.loggingVerboseEnabled = value;
								await this.plugin.saveSettings();
							},
						);
					}),
			);

		monitoringGroup.addSetting((setting) =>
			setting
				.setName("Debugging mode")
				.setDesc(
					"Atomic Bomb level console logging. Can be used for troubleshooting and development.",
				)
				.addToggle((cb: ToggleComponent) => {
					cb.setValue(this.plugin.settings.debuggingMode).onChange(
						async (value: boolean) => {
							this.plugin.settings.debuggingMode = value;
							await this.plugin.saveSettings();
						},
					);
				}),
		);

		// Personal access token setting
		const tokenSection = new SettingGroup(containerEl).setHeading(
			"GitHub Personal Access Token",
		);

		let currentTokenValue = "";
		tokenSection.addSetting((tokenSetting) => {
			tokenSetting.setName("Personal access token").setDesc(
				createLink({
					prependText:
						"Set a personal access token to increase rate limits for public repositories on GitHub. You can create one in ",
					url: "https://github.com/settings/tokens/new?scopes=public_repo",
					text: "your GitHub account settings",
					appendText:
						" and then add it here. Please consult the documentation for more details.",
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
				.onChange(async (secretName: string | null) => {
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
						.setTooltip("Clear personal access token")
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
						.setButtonText("Validate")
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
					this.validator?.validateToken(currentTokenValue).then((valid) => {
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
