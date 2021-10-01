import { App, PluginSettingTab, Setting, ToggleComponent, Platform } from 'obsidian';
import ThePlugin from './main';

export interface Settings {
	enableRibbon: boolean,
	enableDebugMode: boolean,
	blockRefAliasIndicator: string,
	bookmarks: string
}

export const DEFAULT_SETTINGS: Settings = {
	enableRibbon: true,
	enableDebugMode: false,
	blockRefAliasIndicator: "*",
	bookmarks: ""
}

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
			.setName('Enable Ribbon Support')
			.setDesc('Toggle on and off the plugin button in the ribbon.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.enableRibbon);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.enableRibbon = value;
					if (this.plugin.settings.enableRibbon === false)
						this.plugin.ribbonIcon.remove();
					else
						this.plugin.configureRibbonCommand();
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Alias Placeholder")
			.setDesc("Placeholder text used for an aliased block reference.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.blockRefAliasIndicator)
					.onChange(async (value) => {
						if (value.trim() === "")
							this.plugin.settings.blockRefAliasIndicator = "*"; //empty value, default to *
						else
							this.plugin.settings.blockRefAliasIndicator = value;
						await this.plugin.saveSettings();
					})
			);

			containerEl.createEl("h2", { text: "Bookmarks" })

		new Setting(containerEl)
			.setName('Bookmarks')
			.setDesc(`Predefined destinations within files that appear at the top of the file selector. 
						Each line represents one bookmark. The line starts with the path to the file (ex: directory1/subdirectory/filename.md) 
						If just the file path is provided, the file contents will be shown for insertion.
						If after the file name there is a semicolon followed by either: TOP BOTTOM or text to find in the document as an insertion point. Example:\n
						directory1/subdirectory/filename1.md;TOP  directory1/subdirectory/filename2.md;BOTTOM  directory1/subdirectory/filename3.md;# Inbox
						Optionally DNPTODAY can be used in the place of a file name to default to today's Daily Notes Page.
						`)
			.addTextArea((textEl) => {
				textEl
					.setPlaceholder(" directory1/subdirectory/filename1.md;\n directory1/subdirectory/filename2.md;TOP\n directory1/subdirectory/filename3.md;BOTTOM\n directory1/subdirectory/filename4.md;# Inbox")
					.setValue(this.plugin.settings.bookmarks || '')
					.onChange((value) => {
						this.plugin.settings.bookmarks = value;
						this.plugin.saveData(this.plugin.settings);
					})
				textEl.inputEl.rows = 6;
				if(Platform.isIosApp)
					textEl.inputEl.style.width="100%";
				else if(Platform.isDesktopApp) {
					textEl.inputEl.rows = 15;
					textEl.inputEl.cols = 120;
				}
			});

			const desc = document.createDocumentFragment();
			desc.append(
				desc.createEl("a", {
					href: "https://github.com/TfTHacker/obsidian42-text-transporter/blob/main/README-Bookmarks.md",
					text: "Additional documentation  for bookmarks."
				}),
			);
			containerEl.createEl("div", { text: "" }).append(desc);


		containerEl.createEl("h2", { text: "Context Menu Commands: Enable/Disable" });

		for(const command of this.plugin.commands.commands) {
			new Setting(containerEl)
				.setName(command.caption)
				.addToggle((cb: ToggleComponent) => {
					cb.setValue(command.cmItemEnabled);
					cb.onChange(async (value: boolean) => {
						command.cmItemEnabled = value;
						this.plugin.settings["cMenuEnabled-" + command.shortcut] = value;
						await this.plugin.saveSettings();
					});
				});
		}

		containerEl.createEl("h2", { text: "Debugging support" });
		new Setting(containerEl)
			.setName('Debugging support')
			.setDesc('Toggle on and off debugging support for troubleshooting problems. This may require restarting Obsidian. Also a blackhole may open in your neigborhood.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.enableDebugMode);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.enableDebugMode = value;
					await this.plugin.saveSettings();
				});
			});

	}
}
