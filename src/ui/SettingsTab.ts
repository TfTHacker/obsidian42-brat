import { App, PluginSettingTab, Setting, ToggleComponent, ButtonComponent } from 'obsidian';
import { themeDelete } from '../features/themes';
import ThePlugin from '../main';
import AddNewTheme from './AddNewTheme';
import { promotionalLinks } from './Promotional';

export class BratSettingsTab extends PluginSettingTab {
	plugin: ThePlugin;

	constructor(app: App, plugin: ThePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		promotionalLinks(containerEl, true)

		containerEl.createEl('h1', { text: this.plugin.appName }) 
		// .style.marginTop = "50px";
		containerEl.createEl('h2', { text: "by TfTHacker" }) 

		new Setting(containerEl)
			.setName('Auto-update plugins at startup')
			.setDesc('If enabled all beta plugins will be checked for updates each time Obsidian starts. Note: this does not update frozen version plugins.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateAtStartup);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.updateAtStartup = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(containerEl)
			.setName('Auto-update themes at startup')
			.setDesc('If enabled all beta themes will be checked for updates each time Obsidian starts.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateThemesAtStartup);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.updateThemesAtStartup = value;
					await this.plugin.saveSettings();
				});
			})


		new Setting(containerEl)
			.setName('Ribbon Button')
			.setDesc('Toggle ribbon button off and on.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.ribbonIconEnabled);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.ribbonIconEnabled = value;
					if (this.plugin.settings.ribbonIconEnabled === false)
						this.plugin.ribbonIcon.remove();
					else
						this.plugin.showRibbonButton();
					await this.plugin.saveSettings();
				});
			})			

		containerEl.createEl("hr");
		containerEl.createEl("h2", { text: "Beta Plugin List" });
		containerEl.createEl("div", { text: `The following is a list of beta plugins added via the command palette "Add a beta plugin for testing" or "Add a beta plugin with frozen version for testing". A frozen version is a specific release of a plugin based on its releease tag. ` });
		containerEl.createEl("p");
		containerEl.createEl("div", { text: `Click the x button next to a plugin to remove it from the list.` });
		containerEl.createEl("p");
		containerEl.createEl("span")
			.createEl("b", { text: "Note: " })
		containerEl.createSpan({ text: "This does not delete the plugin, this should be done from the  Community Plugins tab in Settings." });

		new Setting(containerEl)
			.addButton((cb: ButtonComponent)=>{
				cb.setButtonText("Add Beta plugin")
				cb.onClick(async ()=>{
					// @ts-ignore
					this.plugin.app.setting.close();
					await this.plugin.betaPlugins.displayAddNewPluginModal(true, false);
				})
			});

		const pluginSubListFrozenVersionNames
			= new Set(this.plugin.settings.pluginSubListFrozenVersion.map(x => x.repo));
		for (const bp of this.plugin.settings.pluginList) {
			if (pluginSubListFrozenVersionNames.has(bp)) {
				continue;
			}
			new Setting(containerEl)
				.setName(bp)
				.addButton((btn: ButtonComponent) => {
					btn.setIcon("cross");
					btn.setTooltip("Delete this beta plugin");
					btn.onClick(async () => {
						// await this.plugin.betaPlugins.deletePlugin(bp);
						if (btn.buttonEl.textContent === "")
							btn.setButtonText("Click once more to confirm removal");
						else {
							btn.buttonEl.parentElement.parentElement.remove();
							await this.plugin.betaPlugins.deletePlugin(bp)
						}
					});
				})
		}

		new Setting(containerEl)
			.addButton((cb: ButtonComponent)=>{
				cb.setButtonText("Add Beta plugin with frozen version")
				cb.onClick(async ()=>{
					// @ts-ignore
					this.plugin.app.setting.close();
					await this.plugin.betaPlugins.displayAddNewPluginModal(true, true);
				})
			});
		for (const bp of this.plugin.settings.pluginSubListFrozenVersion) {
			new Setting(containerEl)
				.setName(`${bp.repo} (version ${bp.version})`)
				.addButton((btn: ButtonComponent) => {
					btn.setIcon("cross");
					btn.setTooltip("Delete this beta plugin");
					btn.onClick(async () => {
						// await this.plugin.betaPlugins.deletePlugin(bp);
						if (btn.buttonEl.textContent === "")
							btn.setButtonText("Click once more to confirm removal");
						else {
							btn.buttonEl.parentElement.parentElement.remove();
							await this.plugin.betaPlugins.deletePlugin(bp.repo);
						}
					});
				})
		}

		containerEl.createEl("hr");
		containerEl.createEl("h2", { text: "Beta Themes List" });

		new Setting(containerEl)
			.addButton((cb: ButtonComponent)=>{
				cb.setButtonText("Add Beta Theme")
				cb.onClick(async ()=>{
					// @ts-ignore
					this.plugin.app.setting.close();
					(new AddNewTheme(this.plugin)).open();
				})
			});		


		for (const bp of this.plugin.settings.themesList) {
			new Setting(containerEl)
				.setName(bp.repo)
				.addButton((btn: ButtonComponent) => {
					btn.setIcon("cross");
					btn.setTooltip("Delete this beta theme");
					btn.onClick(async () => {
						if (btn.buttonEl.textContent === "")
							btn.setButtonText("Click once more to confirm removal");
						else {
							btn.buttonEl.parentElement.parentElement.remove();
							await themeDelete(this.plugin, bp.repo);
						}
					});
				})
		}

		containerEl.createEl("hr");
		containerEl.createEl("h2", { text: "Monitoring" });

		new Setting(containerEl)
			.setName('Enable Notifications')
			.setDesc('BRAT will provide popup notifications for its various activities. Turn this off means  no notifications from BRAT.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.notificationsEnabled);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.notificationsEnabled = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(containerEl)
			.setName('Enable Logging')
			.setDesc('Plugin updates will be logged to a file in the log file.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.loggingEnabled);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.loggingEnabled = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(this.containerEl)
            .setName("BRAT Log File Location")
            .setDesc("Logs will be saved to this file. Don't add .md to the file name.")
            .addSearch((cb) => {
                cb.setPlaceholder("Example: BRAT-log")
                    .setValue(this.plugin.settings.loggingPath)
                    .onChange(async (new_folder) => {
                        this.plugin.settings.loggingPath = new_folder;
						await this.plugin.saveSettings();
                    });
            });		

		new Setting(containerEl)
			.setName('Enable Verbose Logging')
			.setDesc('Get a lot  more information in  the log.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.loggingVerboseEnabled);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.loggingVerboseEnabled = value;
					await this.plugin.saveSettings();
				});
			})


		new Setting(containerEl)
			.setName('Debugging Mode')
			.setDesc('Atomic Bomb level console logging. Can be used for troubleshoting and development.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.debuggingMode);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.debuggingMode = value;
					await this.plugin.saveSettings();
				});
			})			
	
	}
}
