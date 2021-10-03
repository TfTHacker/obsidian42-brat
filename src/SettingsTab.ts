import { App, PluginSettingTab, Setting, ToggleComponent, Platform, ButtonComponent } from 'obsidian';
import ThePlugin from './main';
import { Settings, DEFAULT_SETTINGS } from './settings';


export class SettingsTab extends PluginSettingTab {
	plugin: ThePlugin;

	constructor(app: App, plugin: ThePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: this.plugin.appName });

		new Setting(containerEl)
			.setName('Auto-update at startup')
			.setDesc('If enabled all beta plugins will be checked for updates each time Obsidian starts.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateAtStartup);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.updateAtStartup = value;
					await this.plugin.saveSettings();
				});
			})

		containerEl.createEl("hr");
		containerEl.createEl("h2", { text: "Beta Plugin List" });
		containerEl.createEl("div", { text: `The following is a list of beta plugins added via the command palette "Add a beta plugin for testing". ` });
		containerEl.createEl("p");
		containerEl.createEl("div", { text: `Click the x button next to a plugin to remove it from the list.` });
		containerEl.createEl("p");
		containerEl.createEl("span")
			.createEl("b", {text: "Note: "})
		containerEl.createSpan( { text: "This does not delete the plugin, this should be done from the  Community Plugins tab in Settings." });
		
		for(const bp of this.plugin.settings.pluginList) {
			new Setting(containerEl)
				.setName(bp)
				.addButton( (btn: ButtonComponent)=>{
					btn.setIcon("cross");
					btn.setTooltip("Delete this beta plugin");
					btn.onClick( async ()=>{
						// await this.plugin.betaPlugins.deletePlugin(bp);
						if(btn.buttonEl.textContent==="")
							btn.setButtonText("Click once more to confirm removal");
						else {
							btn.buttonEl.parentElement.parentElement.remove();
							await this.plugin.betaPlugins.deletePlugin(bp)
						}
					});
				})
		}
	}
}
