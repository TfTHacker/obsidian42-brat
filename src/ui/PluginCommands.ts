import { Notice } from "obsidian";
import ThePlugin from "../main";
import { GenericFuzzySuggester, SuggesterItem } from "./GenericFuzzySuggester";
import { grabCommmunityPluginList, grabCommmunityThemesList } from "../features/githubUtils";
import { themesInstallFromCommunityList } from "../features/themes";
import AddNewTheme from "./AddNewTheme";

export default class PluginCommands {
    plugin: ThePlugin;
    bratCommands = [
        {
            id: "BRAT-AddBetaPlugin",
            icon: "BratIcon",
            name: "Add a beta plugin for testing",
            showInRibbon: true,
            callback: async () => { await this.plugin.betaPlugins.displayAddNewPluginModal() }
        },
        {
            id: "BRAT-checkForUpdatesAndUpdate",
            icon: "BratIcon",
            name: "Check for updates to all beta plugins and UPDATE",
            showInRibbon: true,
            callback: async () => { await this.plugin.betaPlugins.checkForUpdatesAndInstallUpdates(true, false) }
        },
        {
            id: "BRAT-checkForUpdatesAndDontUpdate",
            icon: "BratIcon",
            name: "Only check for updates to beta plugins, but don't Update",
            showInRibbon: true,
            callback: async () => { await this.plugin.betaPlugins.checkForUpdatesAndInstallUpdates(true, true) }
        },
        {
            id: "BRAT-updateOnePlugin",
            icon: "BratIcon",
            name: "Choose a single plugin to update",
            showInRibbon: true,
            callback: async () => {
                const pluginList: SuggesterItem[] = Object.values(this.plugin.settings.pluginList).map((m) => { return { display: m, info: m } });
                const gfs = new GenericFuzzySuggester(this.plugin);
                gfs.setSuggesterData(pluginList);
                await gfs.display(async (results) => {
                    const msg = `Checking for updates for ${results.info}`;
                    this.plugin.log(msg,true);
                    new Notice(`BRAT\n${msg}`, 3000);
                    await this.plugin.betaPlugins.updatePlugin(results.info, false, true);
                });
            }
        },
        {
            id: "BRAT-restartPlugin",
            icon: "BratIcon",
            name: "Restart a plugin that is already installed",
            showInRibbon: true,
            callback: async () => {
                // @ts-ignore
                const pluginList: SuggesterItem[] = Object.values(this.plugin.app.plugins.manifests).map((m) => { return { display: m.id, info: m.id } });
                const gfs = new GenericFuzzySuggester(this.plugin);
                gfs.setSuggesterData(pluginList);
                await gfs.display(async (results) => {
                    new Notice(`${results.info}\nPlugin reloading .....`, 5000);
                    await this.plugin.betaPlugins.reloadPlugin(results.info);
                });
            }
        },
        {
            id: "BRAT-disablePlugin",
            icon: "BratIcon",
            name: "Disable a plugin - toggle it off",
            showInRibbon: true,
            callback: async () => {
                const pluginList = this.plugin.betaPlugins.getEnabledDisabledPlugins(true).map(manifest => { return { display: `${manifest.name} (${manifest.id})`, info: manifest.id } });
                const gfs = new GenericFuzzySuggester(this.plugin);
                gfs.setSuggesterData(pluginList);
                await gfs.display(async (results) => {
                    this.plugin.log(`${results.display} plugin disabled`, false);
                    // @ts-ignore
                    await this.plugin.app.plugins.disablePlugin(results.info);
                });
            }
        },
        {
            id: "BRAT-enablePlugin",
            icon: "BratIcon",
            name: "Enable a plugin - toggle it on",
            showInRibbon: true,
            callback: async () => {
                const pluginList = this.plugin.betaPlugins.getEnabledDisabledPlugins(false).map(manifest => { return { display: `${manifest.name} (${manifest.id})`, info: manifest.id } });
                const gfs = new GenericFuzzySuggester(this.plugin);
                gfs.setSuggesterData(pluginList);
                await gfs.display(async (results) => {
                    this.plugin.log(`${results.display} plugin enabled`, false);
                    // @ts-ignore
                    await this.plugin.app.plugins.enablePlugin(results.info);
                });
            }
        },
        {
            id: "BRAT-openGitHubRepository",
            icon: "BratIcon",
            name: "Open the GitHub repository for a plugin",
            showInRibbon: true,
            callback: async () => {
                const communityPlugins = await grabCommmunityPluginList();
                const communityPluginList: SuggesterItem[] = Object.values(communityPlugins).map((p) => { return { display: `Plugin: ${p.name}  (${p.repo})`, info: p.repo } });
                const bratList: SuggesterItem[] = Object.values(this.plugin.settings.pluginList).map((p) => { return { display: "BRAT: " + p, info: p } });
                communityPluginList.forEach(si => bratList.push(si));
                const gfs = new GenericFuzzySuggester(this.plugin);
                gfs.setSuggesterData(bratList);
                await gfs.display(async (results) => {
                    if (results.info) window.open(`https://github.com/${results.info}`)
                });
            }
        },
        {
            id: "BRAT-openGitHubRepoTheme",
            icon: "BratIcon",
            name: "Open the GitHub repository for a theme ",
            showInRibbon: true,
            callback: async () => {
                const communityTheme = await grabCommmunityThemesList();
                const communityThemeList: SuggesterItem[] = Object.values(communityTheme).map((p) => { return { display: `Theme: ${p.name}  (${p.repo})`, info: p.repo } });
                const gfs = new GenericFuzzySuggester(this.plugin);
                gfs.setSuggesterData(communityThemeList);
                await gfs.display(async (results) => {
                    if (results.info) window.open(`https://github.com/${results.info}`)
                });
            }
        },
        {
            id: "BRAT-opentPluginSettings",
            icon: "BratIcon",
            name: "Open Plugin Settings Tab",
            showInRibbon: true,
            callback: async () => {
                // @ts-ignore
                const settings = this.plugin.app.setting;
                // @ts-ignore
                const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(settings.pluginTabs).map((t) => { return { display: "Plugin: " + t.name, info: t.id } });
                const gfs = new GenericFuzzySuggester(this.plugin);
                // @ts-ignore
                const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(settings.settingTabs).map((t) => { return { display: "Core: " + t.name, info: t.id } });
                listOfPluginSettingsTabs.forEach(si => listOfCoreSettingsTabs.push(si));
                gfs.setSuggesterData(listOfCoreSettingsTabs);
                await gfs.display(async (results) => {
                    settings.open();
                    settings.openTabById(results.info);
                });
            }
        },
        {
            id: "BRAT-GrabCommunityTheme",
            icon: "BratIcon",
            name: "Grab a community theme",
            showInRibbon: true,
            callback: async () => await themesInstallFromCommunityList(this.plugin)
        },
        {
            id: "BRAT-GrabBetaTheme",
            icon: "BratIcon",
            name: "Grab a beta theme for testing from a Github repository",
            showInRibbon: true,
            callback: async () => { (new AddNewTheme(this.plugin)).open() }
        },
        {
            id: "BRAT-switchTheme",
            icon: "BratIcon",
            name: "Switch Active Theme ",
            showInRibbon: true,
            callback: async () => {
                // @ts-ignore
                const communityThemeList: SuggesterItem[] = Object.values(this.plugin.app.customCss.themes).map((t) => { return { display: t, info: t } });
                const gfs = new GenericFuzzySuggester(this.plugin);
                gfs.setSuggesterData(communityThemeList);
                await gfs.display(async (results) => {
                    this.plugin.log(`Switched to theme ${results.display}`, false);
                    // @ts-ignore
                    this.plugin.app.customCss.setTheme(results.info);
                });
            }
        },
        {
            id: "BRAT-allCommands",
            icon: "BratIcon",
            name: "All Commands list",
            showInRibbon: false,
            callback: async () => this.ribbonDisplayCommands()
        },
    ]

    async ribbonDisplayCommands(): Promise<void> {
        const bratCommandList: SuggesterItem[] = [];
        this.bratCommands.forEach(cmd => { if (cmd.showInRibbon) bratCommandList.push({ display: cmd.name, info: cmd.callback }) });
        const gfs = new GenericFuzzySuggester(this.plugin);
        // @ts-ignore
        const settings = this.plugin.app.setting;
        // @ts-ignore
        const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(settings.settingTabs).map((t: any) => {
            return {
                display: "Core: " + t.name,
                info: async () => {
                    settings.open();
                    settings.openTabById(t.id);
                }
            }
        });
        // @ts-ignore
        const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(settings.pluginTabs).map((t: any) => {
            return {
                display: "Plugin: " + t.name,
                info: async () => {
                    settings.open();
                    settings.openTabById(t.id);
                }
            }
        });

        bratCommandList.push({ display: "---- Core Plugin Settings ----", info: async () => { await this.ribbonDisplayCommands() } })
        listOfCoreSettingsTabs.forEach(si => bratCommandList.push(si));
        bratCommandList.push({ display: "---- Plugin Settings ----", info: async () => { await this.ribbonDisplayCommands() } })
        listOfPluginSettingsTabs.forEach(si => bratCommandList.push(si));

        gfs.setSuggesterData(bratCommandList);
        await gfs.display(async (results) => await results.info());
    }

    constructor(plugin: ThePlugin) {
        this.plugin = plugin;

        this.bratCommands.forEach(async (item) => {
            this.plugin.addCommand({
                id: item.id,
                name: item.name,
                icon: item.icon,
                callback: async () => { await item.callback() }
            })
        });
    }

}

