import type ThePlugin from "../main";
import type { SuggesterItem } from "./GenericFuzzySuggester";
import { GenericFuzzySuggester } from "./GenericFuzzySuggester";
import type { CommunityPlugin, CommunityTheme } from "../features/githubUtils";
import {
  grabCommmunityPluginList,
  grabCommmunityThemesList,
} from "../features/githubUtils";
import { themesCheckAndUpdates } from "../features/themes";
import AddNewTheme from "./AddNewTheme";
import { toastMessage } from "../utils/notifications";
import type { SettingTab } from "obsidian";

export default class PluginCommands {
  plugin: ThePlugin;
  bratCommands = [
    {
      id: "BRAT-AddBetaPlugin",
      icon: "BratIcon",
      name: "Plugins: Add a beta plugin for testing",
      showInRibbon: true,
      callback: () => {
        this.plugin.betaPlugins.displayAddNewPluginModal(false, false);
      },
    },
    {
      id: "BRAT-AddBetaPluginWithFrozenVersion",
      icon: "BratIcon",
      name: "Plugins: Add a beta plugin with frozen version based on a release tag",
      showInRibbon: true,
      callback: () => {
        this.plugin.betaPlugins.displayAddNewPluginModal(false, true);
      },
    },
    {
      id: "BRAT-checkForUpdatesAndUpdate",
      icon: "BratIcon",
      name: "Plugins: Check for updates to all beta plugins and UPDATE",
      showInRibbon: true,
      callback: async () => {
        await this.plugin.betaPlugins.checkForPluginUpdatesAndInstallUpdates(
          true,
          false
        );
      },
    },
    {
      id: "BRAT-checkForUpdatesAndDontUpdate",
      icon: "BratIcon",
      name: "Plugins: Only check for updates to beta plugins, but don't Update",
      showInRibbon: true,
      callback: async () => {
        await this.plugin.betaPlugins.checkForPluginUpdatesAndInstallUpdates(
          true,
          true
        );
      },
    },
    {
      id: "BRAT-updateOnePlugin",
      icon: "BratIcon",
      name: "Plugins: Choose a single plugin version to update",
      showInRibbon: true,
      callback: () => {
        const pluginSubListFrozenVersionNames = new Set(
          this.plugin.settings.pluginSubListFrozenVersion.map((f) => f.repo)
        );
        const pluginList: SuggesterItem[] = Object.values(
          this.plugin.settings.pluginList
        )
          .filter((f) => !pluginSubListFrozenVersionNames.has(f))
          .map((m) => {
            return { display: m, info: m };
          });
        const gfs = new GenericFuzzySuggester(this.plugin);
        gfs.setSuggesterData(pluginList);
        gfs.display((results) => {
          const msg = `Checking for updates for ${results.info as string}`;
          void this.plugin.log(msg, true);
          toastMessage(this.plugin, `\n${msg}`, 3);
          void this.plugin.betaPlugins.updatePlugin(
            results.info as string,
            false,
            true
          );
        });
      },
    },
    {
      id: "BRAT-reinstallOnePlugin",
      icon: "BratIcon",
      name: "Plugins: Choose a single plugin to reinstall",
      showInRibbon: true,
      callback: () => {
        const pluginSubListFrozenVersionNames = new Set(
          this.plugin.settings.pluginSubListFrozenVersion.map((f) => f.repo)
        );
        const pluginList: SuggesterItem[] = Object.values(
          this.plugin.settings.pluginList
        )
          .filter((f) => !pluginSubListFrozenVersionNames.has(f))
          .map((m) => {
            return { display: m, info: m };
          });
        const gfs = new GenericFuzzySuggester(this.plugin);
        gfs.setSuggesterData(pluginList);
        gfs.display((results) => {
          const msg = `Reinstalling ${results.info as string}`;
          toastMessage(this.plugin, `\n${msg}`, 3);
          void this.plugin.log(msg, true);
          void this.plugin.betaPlugins.updatePlugin(
            results.info as string,
            false,
            false,
            true
          );
        });
      },
    },
    {
      id: "BRAT-restartPlugin",
      icon: "BratIcon",
      name: "Plugins: Restart a plugin that is already installed",
      showInRibbon: true,
      callback: () => {
        const pluginList: SuggesterItem[] = Object.values(
          this.plugin.app.plugins.manifests
        ).map((m) => {
          return { display: m.id, info: m.id };
        });
        const gfs = new GenericFuzzySuggester(this.plugin);
        gfs.setSuggesterData(pluginList);
        gfs.display((results) => {
          toastMessage(
            this.plugin,
            `${results.info as string}\nPlugin reloading .....`,
            5
          );
          void this.plugin.betaPlugins.reloadPlugin(results.info as string);
        });
      },
    },
    {
      id: "BRAT-disablePlugin",
      icon: "BratIcon",
      name: "Plugins: Disable a plugin - toggle it off",
      showInRibbon: true,
      callback: () => {
        const pluginList = this.plugin.betaPlugins
          .getEnabledDisabledPlugins(true)
          .map((manifest) => {
            return {
              display: `${manifest.name} (${manifest.id})`,
              info: manifest.id,
            };
          });
        const gfs = new GenericFuzzySuggester(this.plugin);
        gfs.setSuggesterData(pluginList);
        gfs.display((results) => {
          void this.plugin.log(`${results.display} plugin disabled`, false);
          if (this.plugin.settings.debuggingMode) console.log(results.info);
          void this.plugin.app.plugins.disablePluginAndSave(
            results.info as string
          );
        });
      },
    },
    {
      id: "BRAT-enablePlugin",
      icon: "BratIcon",
      name: "Plugins: Enable a plugin - toggle it on",
      showInRibbon: true,
      callback: () => {
        const pluginList = this.plugin.betaPlugins
          .getEnabledDisabledPlugins(false)
          .map((manifest) => {
            return {
              display: `${manifest.name} (${manifest.id})`,
              info: manifest.id,
            };
          });
        const gfs = new GenericFuzzySuggester(this.plugin);
        gfs.setSuggesterData(pluginList);
        gfs.display((results) => {
          void this.plugin.log(`${results.display} plugin enabled`, false);
          void this.plugin.app.plugins.enablePluginAndSave(
            results.info as string
          );
        });
      },
    },
    {
      id: "BRAT-openGitHubZRepository",
      icon: "BratIcon",
      name: "Plugins: Open the GitHub repository for a plugin",
      showInRibbon: true,
      callback: async () => {
        const communityPlugins = await grabCommmunityPluginList(
          this.plugin.settings.debuggingMode
        );
        if (communityPlugins) {
          const communityPluginList: SuggesterItem[] = Object.values(
            communityPlugins
          ).map((p: CommunityPlugin) => {
            return { display: `Plugin: ${p.name}  (${p.repo})`, info: p.repo };
          });
          const bratList: SuggesterItem[] = Object.values(
            this.plugin.settings.pluginList
          ).map((p) => {
            return { display: `BRAT: ${p}`, info: p };
          });
          communityPluginList.forEach((si) => bratList.push(si));
          const gfs = new GenericFuzzySuggester(this.plugin);
          gfs.setSuggesterData(bratList);
          gfs.display((results) => {
            if (results.info)
              window.open(`https://github.com/${results.info as string}`);
          });
        }
      },
    },
    {
      id: "BRAT-openGitHubRepoTheme",
      icon: "BratIcon",
      name: "Themes: Open the GitHub repository for a theme (appearance)",
      showInRibbon: true,
      callback: async () => {
        const communityTheme = await grabCommmunityThemesList(
          this.plugin.settings.debuggingMode
        );
        if (communityTheme) {
          const communityThemeList: SuggesterItem[] = Object.values(
            communityTheme
          ).map((p: CommunityTheme) => {
            return { display: `Theme: ${p.name}  (${p.repo})`, info: p.repo };
          });
          const gfs = new GenericFuzzySuggester(this.plugin);
          gfs.setSuggesterData(communityThemeList);
          gfs.display((results) => {
            if (results.info)
              window.open(`https://github.com/${results.info as string}`);
          });
        }
      },
    },
    {
      id: "BRAT-opentPluginSettings",
      icon: "BratIcon",
      name: "Plugins: Open Plugin Settings Tab",
      showInRibbon: true,
      callback: () => {
        const settings = this.plugin.app.setting;
        const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(
          settings.pluginTabs
        ).map((t) => {
          return { display: `Plugin: ${t.name}`, info: t.id };
        });
        const gfs = new GenericFuzzySuggester(this.plugin);
        const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(
          settings.settingTabs
        ).map((t) => {
          return { display: `Core: ${t.name}`, info: t.id };
        });
        listOfPluginSettingsTabs.forEach((si) =>
          listOfCoreSettingsTabs.push(si)
        );
        gfs.setSuggesterData(listOfCoreSettingsTabs);
        gfs.display((results) => {
          settings.open();
          settings.openTabById(results.info as string);
        });
      },
    },
    {
      id: "BRAT-GrabBetaTheme",
      icon: "BratIcon",
      name: "Themes: Grab a beta theme for testing from a Github repository",
      showInRibbon: true,
      callback: () => {
        new AddNewTheme(this.plugin).open();
      },
    },
    {
      id: "BRAT-updateBetaThemes",
      icon: "BratIcon",
      name: "Themes: Update beta themes",
      showInRibbon: true,
      callback: async () => {
        await themesCheckAndUpdates(this.plugin, true);
      },
    },
    {
      id: "BRAT-allCommands",
      icon: "BratIcon",
      name: "All Commands list",
      showInRibbon: false,
      callback: () => {
        this.ribbonDisplayCommands();
      },
    },
  ];

  ribbonDisplayCommands(): void {
    const bratCommandList: SuggesterItem[] = [];
    this.bratCommands.forEach((cmd) => {
      if (cmd.showInRibbon)
        bratCommandList.push({ display: cmd.name, info: cmd.callback });
    });
    const gfs = new GenericFuzzySuggester(this.plugin);
    const settings = this.plugin.app.setting;
    const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(
      settings.settingTabs
    ).map((t: SettingTab) => {
      return {
        display: `Core: ${t.name}`,
        info: () => {
          settings.open();
          settings.openTabById(t.id);
        },
      };
    });
    const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(
      settings.pluginTabs
    ).map((t: SettingTab) => {
      return {
        display: "Plugin: " + t.name,
        info: () => {
          settings.open();
          settings.openTabById(t.id);
        },
      };
    });

    bratCommandList.push({
      display: "---- Core Plugin Settings ----",
      info: () => {
        this.ribbonDisplayCommands();
      },
    });
    listOfCoreSettingsTabs.forEach((si) => bratCommandList.push(si));
    bratCommandList.push({
      display: "---- Plugin Settings ----",
      info: () => {
        this.ribbonDisplayCommands();
      },
    });
    listOfPluginSettingsTabs.forEach((si) => bratCommandList.push(si));

    gfs.setSuggesterData(bratCommandList);
    gfs.display((results) => {
      if (typeof results.info === "function") {
        results.info();
      }
    });
  }

  constructor(plugin: ThePlugin) {
    this.plugin = plugin;

    this.bratCommands.forEach((item) => {
      this.plugin.addCommand({
        id: item.id,
        name: item.name,
        icon: item.icon,
        callback: () => {
          item.callback();
        },
      });
    });
  }
}
