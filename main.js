var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/main.ts
__export(exports, {
  default: () => ThePlugin
});
var import_obsidian6 = __toModule(require("obsidian"));

// src/SettingsTab.ts
var import_obsidian = __toModule(require("obsidian"));
var SettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: this.plugin.appName });
    new import_obsidian.Setting(containerEl).setName("Auto-update at startup").setDesc("If enabled all beta plugins will be checked for updates each time Obsidian starts.").addToggle((cb) => {
      cb.setValue(this.plugin.settings.updateAtStartup);
      cb.onChange((value) => __async(this, null, function* () {
        this.plugin.settings.updateAtStartup = value;
        yield this.plugin.saveSettings();
      }));
    });
    containerEl.createEl("hr");
    containerEl.createEl("h2", { text: "Beta Plugin List" });
    containerEl.createEl("div", { text: `The following is a list of beta plugins added via the command palette "Add a beta plugin for testing". ` });
    containerEl.createEl("p");
    containerEl.createEl("div", { text: `Click the x button next to a plugin to remove it from the list.` });
    containerEl.createEl("p");
    containerEl.createEl("span").createEl("b", { text: "Note: " });
    containerEl.createSpan({ text: "This does not delete the plugin, this should be done from the  Community Plugins tab in Settings." });
    new import_obsidian.Setting(containerEl).addButton((cb) => {
      cb.setButtonText("Add Beta plugin");
      cb.onClick(() => __async(this, null, function* () {
        this.plugin.app.setting.close();
        yield this.plugin.betaPlugins.displayAddNewPluginModal(true);
      }));
    });
    for (const bp of this.plugin.settings.pluginList) {
      new import_obsidian.Setting(containerEl).setName(bp).addButton((btn) => {
        btn.setIcon("cross");
        btn.setTooltip("Delete this beta plugin");
        btn.onClick(() => __async(this, null, function* () {
          if (btn.buttonEl.textContent === "")
            btn.setButtonText("Click once more to confirm removal");
          else {
            btn.buttonEl.parentElement.parentElement.remove();
            yield this.plugin.betaPlugins.deletePlugin(bp);
          }
        }));
      });
    }
  }
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  pluginList: [],
  updateAtStartup: false
};
function addBetaPluginToList(plugin, repositoryPath) {
  return __async(this, null, function* () {
    if (!plugin.settings.pluginList.contains(repositoryPath)) {
      plugin.settings.pluginList.unshift(repositoryPath);
      plugin.saveSettings();
    }
  });
}
function existBetaPluginInList(plugin, repositoryPath) {
  return __async(this, null, function* () {
    return plugin.settings.pluginList.contains(repositoryPath);
  });
}

// src/AddNewPluginModal.ts
var import_obsidian2 = __toModule(require("obsidian"));
var AddNewPluginModal = class extends import_obsidian2.Modal {
  constructor(plugin, betaPlugins, openSettingsTabAfterwards = false) {
    super(plugin.app);
    this.plugin = plugin;
    this.betaPlugins = betaPlugins;
    this.address = "";
    this.openSettingsTabAfterwards = openSettingsTabAfterwards;
  }
  submitForm() {
    return __async(this, null, function* () {
      if (this.address === "")
        return;
      const scrubbedAddress = this.address.replace("https://github.com/", "");
      if (yield existBetaPluginInList(this.plugin, scrubbedAddress)) {
        new import_obsidian2.Notice(`BRAT
This plugin is already in the list for beta testing`, 1e4);
        return;
      }
      const result = yield this.betaPlugins.addPlugin(scrubbedAddress);
      if (result) {
        this.close();
      }
    });
  }
  onOpen() {
    this.contentEl.createEl("h4", { text: "Github repository for beta plugin:" });
    this.contentEl.createEl("form", {}, (formEl) => {
      new import_obsidian2.Setting(formEl).addText((textEl) => {
        textEl.setPlaceholder("Repository (example: TfTHacker/obsidian-brat");
        textEl.onChange((value) => {
          this.address = value.trim();
        });
        textEl.inputEl.addEventListener("keydown", (e) => __async(this, null, function* () {
          if (e.key === "Enter" && this.address !== " ") {
            e.preventDefault();
            yield this.submitForm();
          }
        }));
        textEl.inputEl.style.width = "100%";
        window.setTimeout(() => {
          const title = document.querySelector(".setting-item-info");
          if (title)
            title.remove();
          textEl.inputEl.focus();
        }, 10);
      });
      formEl.createDiv("modal-button-container", (buttonContainerEl) => {
        buttonContainerEl.createEl("button", { attr: { type: "button" }, text: "Never mind" }).addEventListener("click", () => this.close());
        buttonContainerEl.createEl("button", {
          attr: { type: "submit" },
          cls: "mod-cta",
          text: "Add Plugin"
        });
      });
      formEl.addEventListener("submit", (e) => __async(this, null, function* () {
        e.preventDefault();
        if (this.address !== "")
          yield this.submitForm();
      }));
    });
  }
  onClose() {
    return __async(this, null, function* () {
      if (this.openSettingsTabAfterwards) {
        yield this.plugin.app.setting.open();
        yield this.plugin.app.setting.openTabById("obsidian42-brat");
      }
    });
  }
};

// src/githubUtils.ts
var import_obsidian3 = __toModule(require("obsidian"));
var GITHUB_RAW_USERCONTENT_PATH = "https://raw.githubusercontent.com/";
var grabReleaseFileFromRepository = (repository, version, fileName) => __async(void 0, null, function* () {
  const URL = `https://github.com/${repository}/releases/download/${version}/${fileName}`;
  try {
    const download = yield (0, import_obsidian3.request)({ url: URL });
    return download === "Not Found" || download === `{"error":"Not Found"}` ? null : download;
  } catch (error) {
    console.log("error in grabReleaseFileFromRepository", URL, error);
  }
});
var grabManifestJsonFromRepository = (repositoryPath, rootManifest = true) => __async(void 0, null, function* () {
  const manifestJsonPath = GITHUB_RAW_USERCONTENT_PATH + repositoryPath + (rootManifest === true ? "/HEAD/manifest.json" : "/HEAD/manifest-beta.json");
  try {
    const response = yield (0, import_obsidian3.request)({ url: manifestJsonPath });
    return response === "404: Not Found" ? null : yield JSON.parse(response);
  } catch (error) {
    console.log("error in grabManifestJsonFromRepository", error);
  }
});
var grabCommmunityPluginList = () => __async(void 0, null, function* () {
  const pluginListURL = `https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json`;
  try {
    const response = yield (0, import_obsidian3.request)({ url: pluginListURL });
    return response === "404: Not Found" ? null : yield JSON.parse(response);
  } catch (error) {
    console.log("error in grabCommmunityPluginList", error);
  }
});

// src/BetaPlugins.ts
var import_obsidian4 = __toModule(require("obsidian"));
var BetaPlugins = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  displayAddNewPluginModal(openSettingsTabAfterwards = false) {
    return __async(this, null, function* () {
      const newPlugin = new AddNewPluginModal(this.plugin, this, openSettingsTabAfterwards);
      newPlugin.open();
    });
  }
  validateRepository(repositoryPath, getBetaManifest = false, reportIsues = false) {
    return __async(this, null, function* () {
      const noticeTimeout = 15e3;
      const manifestJson = yield grabManifestJsonFromRepository(repositoryPath, !getBetaManifest);
      if (!manifestJson) {
        if (reportIsues)
          new import_obsidian4.Notice(`BRAT
${repositoryPath}
This does not seem to be an obsidian plugin, as there is no manifest.json file.`, noticeTimeout);
        return null;
      }
      if (!("id" in manifestJson)) {
        if (reportIsues)
          new import_obsidian4.Notice(`BRAT
${repositoryPath}
The plugin id attribute for the release is missing from the manifest file`, noticeTimeout);
        return null;
      }
      if (!("version" in manifestJson)) {
        if (reportIsues)
          new import_obsidian4.Notice(`BRAT
${repositoryPath}
The version attribute for the release is missing from the manifest file`, noticeTimeout);
        return null;
      }
      return manifestJson;
    });
  }
  getAllReleaseFiles(repositoryPath, manifest, getManifest) {
    return __async(this, null, function* () {
      return {
        mainJs: yield grabReleaseFileFromRepository(repositoryPath, manifest.version, "main.js"),
        manifest: getManifest ? yield grabReleaseFileFromRepository(repositoryPath, manifest.version, "manifest.json") : null,
        styles: yield grabReleaseFileFromRepository(repositoryPath, manifest.version, "styles.css")
      };
    });
  }
  writeReleaseFilesToPluginFolder(betaPluginID, relFiles) {
    return __async(this, null, function* () {
      const pluginTargetFolderPath = (0, import_obsidian4.normalizePath)(this.plugin.app.vault.configDir + "/plugins/" + betaPluginID) + "/";
      const adapter = this.plugin.app.vault.adapter;
      if ((yield adapter.exists(pluginTargetFolderPath)) === false || !(yield adapter.exists(pluginTargetFolderPath + "manifest.json"))) {
        yield adapter.mkdir(pluginTargetFolderPath);
      }
      yield adapter.write(pluginTargetFolderPath + "main.js", relFiles.mainJs);
      yield adapter.write(pluginTargetFolderPath + "manifest.json", relFiles.manifest);
      if (relFiles.styles)
        yield adapter.write(pluginTargetFolderPath + "styles.css", relFiles.styles);
    });
  }
  addPlugin(repositoryPath, updatePluginFiles = false, seeIfUpdatedOnly = false, reportIfNotUpdted = false) {
    return __async(this, null, function* () {
      var _a;
      const noticeTimeout = 1e4;
      let primaryManifest = yield this.validateRepository(repositoryPath, true, false);
      const usingBetaManifest = primaryManifest ? true : false;
      if (usingBetaManifest === false)
        primaryManifest = yield this.validateRepository(repositoryPath, false, true);
      if (primaryManifest === null) {
        new import_obsidian4.Notice(`BRAT
${repositoryPath}
A manifest.json or manifest-beta.json file does not exist in the root directory of the repository. This plugin cannot be installed.`, noticeTimeout);
        return false;
      }
      if (!primaryManifest.hasOwnProperty("version")) {
        new import_obsidian4.Notice(`BRAT
${repositoryPath}
The manifest${usingBetaManifest ? "-beta" : ""}.json file in the root directory of the repository does not have a version number in the file. This plugin cannot be installed.`, noticeTimeout);
        return false;
      }
      const getRelease = () => __async(this, null, function* () {
        const rFiles = yield this.getAllReleaseFiles(repositoryPath, primaryManifest, usingBetaManifest);
        if (usingBetaManifest || rFiles.manifest === null)
          rFiles.manifest = JSON.stringify(primaryManifest);
        if (rFiles.mainJs === null) {
          new import_obsidian4.Notice(`BRAT
${repositoryPath}
The release is not complete and cannot be download. main.js is missing from the Release`, noticeTimeout);
          return null;
        }
        return rFiles;
      });
      if (updatePluginFiles === false) {
        const releaseFiles = yield getRelease();
        if (releaseFiles === null)
          return;
        yield this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
        yield addBetaPluginToList(this.plugin, repositoryPath);
        yield this.plugin.app.plugins.loadManifests();
        new import_obsidian4.Notice(`BRAT
${repositoryPath}
The plugin has been registered with BRAT. You may still need to enable it the Community Plugin List.`, noticeTimeout);
      } else {
        const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + primaryManifest.id + "/";
        let localManifestContents = null;
        try {
          localManifestContents = yield this.plugin.app.vault.adapter.read(pluginTargetFolderPath + "manifest.json");
        } catch (e) {
          if (e.errno === -4058) {
            yield this.addPlugin(repositoryPath, false, usingBetaManifest);
            return true;
          } else
            console.log("BRAT - Local Manifest Load", primaryManifest.id, JSON.stringify(e, null, 2));
        }
        const localManifestJSON = yield JSON.parse(localManifestContents);
        if (localManifestJSON.version !== primaryManifest.version) {
          const releaseFiles = yield getRelease();
          if (releaseFiles === null)
            return;
          if (seeIfUpdatedOnly) {
            new import_obsidian4.Notice(`BRAT
There is an update available for ${primaryManifest.id}`);
          } else {
            yield this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
            yield this.plugin.app.plugins.loadManifests();
            if ((_a = this.plugin.app.plugins.plugins[primaryManifest.id]) == null ? void 0 : _a.manifest)
              yield this.reloadPlugin(primaryManifest.id);
            new import_obsidian4.Notice(`BRAT
${primaryManifest.id}
Plugin has been updated.`, noticeTimeout);
          }
        } else if (reportIfNotUpdted)
          new import_obsidian4.Notice(`BRAT
No update available for ${repositoryPath}`, 3e3);
      }
      return true;
    });
  }
  reloadPlugin(pluginName) {
    return __async(this, null, function* () {
      const plugins = this.plugin.app.plugins;
      try {
        yield plugins.disablePlugin(pluginName);
        yield plugins.enablePlugin(pluginName);
      } catch (e) {
        console.log("reload plugin", e);
      }
    });
  }
  updatePlugin(repositoryPath, onlyCheckDontUpdate = false, reportIfNotUpdted = false) {
    return __async(this, null, function* () {
      const result = yield this.addPlugin(repositoryPath, true, onlyCheckDontUpdate, reportIfNotUpdted);
      if (result === false && onlyCheckDontUpdate === false)
        new import_obsidian4.Notice(`BRAT
${repositoryPath}
Update of plugin failed.`);
      return result;
    });
  }
  checkForUpdatesAndInstallUpdates(showInfo = false, onlyCheckDontUpdate = false) {
    return __async(this, null, function* () {
      if (showInfo)
        new import_obsidian4.Notice(`BRAT
Checking for plugin updates STARTED`, 1e4);
      for (const bp of this.plugin.settings.pluginList) {
        yield this.updatePlugin(bp, onlyCheckDontUpdate);
      }
      if (showInfo)
        new import_obsidian4.Notice(`BRAT
Checking for plugin updates COMPLETED`, 1e4);
    });
  }
  deletePlugin(repositoryPath) {
    return __async(this, null, function* () {
      this.plugin.settings.pluginList = this.plugin.settings.pluginList.filter((b) => b != repositoryPath);
      this.plugin.saveSettings();
    });
  }
};

// src/GenericFuzzySuggester.ts
var import_obsidian5 = __toModule(require("obsidian"));
var GenericFuzzySuggester = class extends import_obsidian5.FuzzySuggestModal {
  constructor(plugin) {
    super(plugin.app);
    this.scope.register(["Shift"], "Enter", (evt) => this.enterTrigger(evt));
    this.scope.register(["Ctrl"], "Enter", (evt) => this.enterTrigger(evt));
  }
  setSuggesterData(suggesterData) {
    this.data = suggesterData;
  }
  display(callBack) {
    return __async(this, null, function* () {
      this.callbackFunction = callBack;
      this.open();
    });
  }
  getItems() {
    return this.data;
  }
  getItemText(item) {
    return item.display;
  }
  onChooseItem() {
    return;
  }
  renderSuggestion(item, el) {
    el.createEl("div", { text: item.item.display });
  }
  enterTrigger(evt) {
    const selectedText = document.querySelector(".suggestion-item.is-selected div").textContent;
    const item = this.data.find((i) => i.display === selectedText);
    if (item) {
      this.invokeCallback(item, evt);
      this.close();
    }
  }
  onChooseSuggestion(item, evt) {
    this.invokeCallback(item.item, evt);
  }
  invokeCallback(item, evt) {
    this.callbackFunction(item, evt);
  }
};

// src/main.ts
var ThePlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.appName = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
    this.appID = "obsidian42-brat";
  }
  onload() {
    return __async(this, null, function* () {
      console.log("loading Obsidian42 - BRAT");
      yield this.loadSettings();
      this.addSettingTab(new SettingsTab(this.app, this));
      this.betaPlugins = new BetaPlugins(this);
      this.addCommand({
        id: "BRAT-AddBetaPlugin",
        name: "Add a beta plugin for testing",
        callback: () => __async(this, null, function* () {
          yield this.betaPlugins.displayAddNewPluginModal();
        })
      });
      this.addCommand({
        id: "BRAT-checkForUpdatesAndUpdate",
        name: "Check for updates to all beta plugins and UPDATE",
        callback: () => __async(this, null, function* () {
          yield this.betaPlugins.checkForUpdatesAndInstallUpdates(true, false);
        })
      });
      this.addCommand({
        id: "BRAT-checkForUpdatesAndDontUpdate",
        name: "Only check for updates to beta plugins, but don't Update",
        callback: () => __async(this, null, function* () {
          yield this.betaPlugins.checkForUpdatesAndInstallUpdates(true, true);
        })
      });
      this.addCommand({
        id: "BRAT-updateOnePlugin",
        name: "Choose a single plugin to update",
        callback: () => __async(this, null, function* () {
          const pluginList = Object.values(this.settings.pluginList).map((m) => {
            return { display: m, info: m };
          });
          const gfs = new GenericFuzzySuggester(this);
          gfs.setSuggesterData(pluginList);
          yield gfs.display((results) => __async(this, null, function* () {
            new import_obsidian6.Notice(`BRAT
Checking for updates for ${results.info}`, 3e3);
            yield this.betaPlugins.updatePlugin(results.info, false, true);
          }));
        })
      });
      this.addCommand({
        id: "BRAT-restartPlugin",
        name: "Restart a plugin that is already installed",
        callback: () => __async(this, null, function* () {
          const pluginList = Object.values(this.app.plugins.manifests).map((m) => {
            return { display: m.id, info: m.id };
          });
          const gfs = new GenericFuzzySuggester(this);
          gfs.setSuggesterData(pluginList);
          yield gfs.display((results) => __async(this, null, function* () {
            new import_obsidian6.Notice(`${results.info}
Plugin reloading .....`, 5e3);
            yield this.betaPlugins.reloadPlugin(results.info);
          }));
        })
      });
      this.addCommand({
        id: "BRAT-openGitHubRepository",
        name: "Open the GitHub repository for a plugin",
        callback: () => __async(this, null, function* () {
          const communityPlugins = yield grabCommmunityPluginList();
          const communityPluginList = Object.values(communityPlugins).map((p) => {
            return { display: `Community: ${p.name}  (${p.repo})`, info: p.repo };
          });
          const bratList = Object.values(this.settings.pluginList).map((p) => {
            return { display: "BRAT: " + p, info: p };
          });
          communityPluginList.forEach((si) => bratList.push(si));
          const gfs = new GenericFuzzySuggester(this);
          gfs.setSuggesterData(bratList);
          yield gfs.display((results) => __async(this, null, function* () {
            if (results.info)
              window.open(`https://github.com/${results.info}`);
          }));
        })
      });
      this.app.workspace.onLayoutReady(() => {
        if (this.settings.updateAtStartup)
          setTimeout(() => __async(this, null, function* () {
            yield this.betaPlugins.checkForUpdatesAndInstallUpdates(false);
          }), 6e4);
      });
    });
  }
  onunload() {
    console.log("unloading " + this.appName);
  }
  loadSettings() {
    return __async(this, null, function* () {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
    });
  }
  saveSettings() {
    return __async(this, null, function* () {
      yield this.saveData(this.settings);
    });
  }
};
