import { type App, ButtonComponent, type TextComponent, type ToggleComponent } from "obsidian";
import { Modal, PluginSettingTab, Setting } from "obsidian";
import { type GitHubTokenInfo, TokenErrorType, validateGitHubToken } from "src/features/githubUtils";
import { themeDelete } from "../features/themes";
import type BratPlugin from "../main";
import { createGitHubResourceLink, createLink } from "../utils/utils";
import AddNewTheme from "./AddNewTheme";
import { promotionalLinks } from "./Promotional";

export class BratSettingsTab extends PluginSettingTab {
	plugin: BratPlugin;
	accessTokenSetting: TextComponent | null = null;
	accessTokenButton: ButtonComponent | null = null;
	tokenInfo: HTMLElement | null = null;

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
				cb.setValue(this.plugin.settings.enableAfterInstall).onChange(async (value: boolean) => {
					this.plugin.settings.enableAfterInstall = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Auto-update plugins at startup")
			.setDesc(
				"If enabled all beta plugins will be checked for updates each time Obsidian starts. Note: this does not update frozen version plugins.",
			)
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateAtStartup).onChange(async (value: boolean) => {
					this.plugin.settings.updateAtStartup = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Auto-update themes at startup")
			.setDesc("If enabled all beta themes will be checked for updates each time Obsidian starts.")
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateThemesAtStartup).onChange(async (value: boolean) => {
					this.plugin.settings.updateThemesAtStartup = value;
					await this.plugin.saveSettings();
				});
			});

		promotionalLinks(containerEl, true);
		containerEl.createEl("hr");
		new Setting(containerEl).setName("Beta plugin list").setHeading();
		containerEl.createEl("div", {
			text: `The following is a list of beta plugins added via the command "Add a beta plugin for testing". You can chose to add the latest version or a frozen version. A frozen version is a specific release of a plugin based on its release tag.`,
		});
		containerEl.createEl("p");
		containerEl.createEl("div", {
			text: "Click the 'Edit' button next to a plugin to change the installed version and the x button next to a plugin to remove it from the list.",
		});
		containerEl.createEl("p");
		containerEl.createEl("span").createEl("b", { text: "Note: " });
		containerEl.createSpan({
			text: "Removing from the list does not delete the plugin, this should be done from the Community Plugins tab in Settings.",
		});

		new Setting(containerEl).addButton((cb: ButtonComponent) => {
			cb.setButtonText("Add beta plugin")
				.setCta()
				.onClick(() => {
					this.plugin.betaPlugins.displayAddNewPluginModal(true, true);
				});
		});

		const frozenVersions = new Map(
			this.plugin.settings.pluginSubListFrozenVersion.map((f) => [f.repo, { version: f.version, token: f.token }]),
		);
		for (const p of this.plugin.settings.pluginList) {
			const bp = frozenVersions.get(p);
			const pluginSettingContainer = new Setting(containerEl)
				.setName(createGitHubResourceLink(p))
				.setDesc(bp?.version ? ` Tracked version: ${bp.version} ${bp.version === "latest" ? "" : "(frozen)"}` : "");

			if (!bp?.version || bp.version === "latest") {
				// Only show update button for plugins tracking latest version
				pluginSettingContainer.addButton((btn: ButtonComponent) => {
					btn
						.setIcon("sync")
						.setTooltip("Check and update plugin")
						.onClick(async () => {
							await this.plugin.betaPlugins.updatePlugin(p, false, true, false, bp?.token);
						});
				});
			}

			// Container for the edit and removal buttons
			pluginSettingContainer
				.addButton((btn: ButtonComponent) => {
					btn
						.setIcon("edit")
						.setTooltip("Change version")
						.onClick(() => {
							this.plugin.betaPlugins.displayAddNewPluginModal(true, true, p, bp?.version, bp?.token);
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
		}

		new Setting(containerEl).setName("Beta themes list").setHeading();

		new Setting(containerEl).addButton((cb: ButtonComponent) => {
			cb.setButtonText("Add beta theme")
				.setCta()
				.onClick(() => {
					this.plugin.app.setting.close();
					new AddNewTheme(this.plugin).open();
				});
		});

		for (const bp of this.plugin.settings.themesList) {
			new Setting(containerEl).setName(createGitHubResourceLink(bp.repo)).addButton((btn: ButtonComponent) => {
				btn
					.setIcon("cross")
					.setTooltip("Delete this beta theme")
					.onClick(() => {
						if (btn.buttonEl.textContent === "") btn.setButtonText("Click once more to confirm removal");
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
		}

		new Setting(containerEl).setName("Monitoring").setHeading();

		new Setting(containerEl)
			.setName("Enable notifications")
			.setDesc("BRAT will provide popup notifications for its various activities. Turn this off means  no notifications from BRAT.")
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.notificationsEnabled);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.notificationsEnabled = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Enable logging")
			.setDesc("Plugin updates will be logged to a file in the log file.")
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.loggingEnabled).onChange(async (value: boolean) => {
					this.plugin.settings.loggingEnabled = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(this.containerEl)
			.setName("BRAT log file location")
			.setDesc("Logs will be saved to this file. Don't add .md to the file name.")
			.addSearch((cb) => {
				cb.setPlaceholder("Example: BRAT-log")
					.setValue(this.plugin.settings.loggingPath)
					.onChange(async (newFolder) => {
						this.plugin.settings.loggingPath = newFolder;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Enable verbose logging")
			.setDesc("Get a lot  more information in  the log.")
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.loggingVerboseEnabled).onChange(async (value: boolean) => {
					this.plugin.settings.loggingVerboseEnabled = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Debugging mode")
			.setDesc("Atomic Bomb level console logging. Can be used for troubleshoting and development.")
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.debuggingMode).onChange(async (value: boolean) => {
					this.plugin.settings.debuggingMode = value;
					await this.plugin.saveSettings();
				});
			});

		// Modify the existing token setting
		new Setting(containerEl)
			.setName("Personal access token")
			.setDesc(
				createLink({
					prependText: "Set a personal access token to increase rate limits for public repositories on GitHub. You can create one in ",
					url: "https://github.com/settings/tokens/new?scopes=public_repo",
					text: "your GitHub account settings",
					appendText: ".",
				}),
			)
			.addText((text) => {
				this.accessTokenSetting = text;

				text
					.setPlaceholder("Enter your personal access token")
					.setValue(this.plugin.settings.personalAccessToken ?? "")
					.onChange(async (value: string) => {
						if (value === "") {
							// Save / reset token
							this.plugin.settings.personalAccessToken = "";
							this.plugin.saveSettings(); 
							this.accessTokenButton?.setDisabled(true);
							this.updateTokenInfo(this.tokenInfo, null);
						} else {
							this.accessTokenButton?.setDisabled(false);
						}

					});

				// Show initial token info if token exists
				validateGitHubToken(this.plugin.settings.personalAccessToken ?? "").then((patInfo) => {
					if (patInfo.validToken) {
						this.accessTokenButton?.setDisabled(true); 
					} 
					this.updateTokenInfo(this.tokenInfo, this.plugin.settings.personalAccessToken ? patInfo : null);
				});
			})
			.addButton((btn: ButtonComponent) => { 
				this.accessTokenButton = btn;

				btn
					.setButtonText("Validate")
					.setCta()
					.onClick(async () => {
						const value = this.accessTokenSetting?.inputEl.value;
						if (value) {
							const patInfo = await validateGitHubToken(value);
							await this.updateTokenInfo(this.tokenInfo, patInfo);
							if (patInfo.validToken) {
								this.plugin.settings.personalAccessToken = value;
								this.plugin.saveSettings(); 
								this.accessTokenButton?.setDisabled(true);
							} 
						}
					});
			});

		this.tokenInfo = this.createTokenInfoElement(containerEl);
	}

	// ...existing code...

	private createTokenInfoElement(containerEl: HTMLElement): HTMLElement {
		const tokenInfo = containerEl.createDiv({ cls: "brat-token-info" });
		tokenInfo.createDiv({ cls: "brat-token-status" });
		tokenInfo.createDiv({ cls: "brat-token-details" });
		return tokenInfo;
	}

	private async updateTokenInfo(tokenInfo: HTMLElement | null, patInfo: GitHubTokenInfo | null): Promise<void> {
		if (!tokenInfo) return;

		const statusEl = tokenInfo.querySelector(".brat-token-status");
		const detailsEl = tokenInfo.querySelector(".brat-token-details");

		if (!statusEl || !detailsEl) return;

		tokenInfo.removeClass("valid", "invalid");
		statusEl.empty();
		detailsEl.empty();

		if (!patInfo) {
			tokenInfo.addClass("invalid");
			statusEl.setText("No token provided");
			return;
		}

		if (!patInfo.validToken) {
			tokenInfo.addClass("invalid");
			statusEl.setText("⚠️ Invalid token");
			return;
		}

		if (patInfo.validToken) {
			tokenInfo.addClass("valid");
			statusEl.setText("✓ Valid token");

			// Show rate limit
			if (patInfo.rateLimit) {
				detailsEl.createDiv({
					text: `API Rate Limit: ${patInfo.rateLimit.remaining}/${patInfo.rateLimit.limit}`,
				});
			}

			// Show expiration warning if less than 7 days
			if (patInfo.expirationDate) {
				const expires = new Date(patInfo.expirationDate);
				const daysLeft = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

				if (daysLeft < 7) {
					detailsEl.createDiv({
						text: `⚠️ Token expires in ${daysLeft} days`,
						cls: "brat-token-warning",
					});
				}
			}
		}
	}

}
