import type ThePlugin from '../main';
import AddNewPluginModal from '../ui/AddNewPluginModal';
import {
  grabManifestJsonFromRepository,
  grabReleaseFileFromRepository,
} from './githubUtils';
import type { PluginManifest } from 'obsidian';
import { normalizePath, Notice, requireApiVersion, apiVersion } from 'obsidian';
import { addBetaPluginToList } from '../settings';
import { toastMessage } from '../utils/notifications';
import { isConnectedToInternet } from '../utils/internetconnection';

/**
 * all the files needed for a plugin based on the release files are hre
 */
interface ReleaseFiles {
  mainJs: string | null;
  manifest: string | null;
  styles: string | null;
}

/**
 * Primary handler for adding, updating, deleting beta plugins tracked by this plugin
 */
export default class BetaPlugins {
  plugin: ThePlugin;

  constructor(plugin: ThePlugin) {
    this.plugin = plugin;
  }

  /**
   * opens the AddNewPluginModal to get info for  a new beta plugin
   * @param openSettingsTabAfterwards - will open settings screen afterwards. Used when this command is called from settings tab
   * @param useFrozenVersion - install the plugin using frozen version.
   */
  displayAddNewPluginModal(
    openSettingsTabAfterwards = false,
    useFrozenVersion = false
  ): void {
    const newPlugin = new AddNewPluginModal(
      this.plugin,
      this,
      openSettingsTabAfterwards,
      useFrozenVersion
    );
    newPlugin.open();
  }

  /**
   * Validates that a GitHub repository is plugin
   *
   * @param repositoryPath - GithubUser/RepositoryName (example: TfThacker/obsidian42-brat)
   * @param getBetaManifest - test the beta version of the manifest, not at the root
   * @param false - [false description]
   * @param reportIssues - will display notices as it finds issues
   *
   * @returns the manifest file if found, or null if its incomplete
   */
  async validateRepository(
    repositoryPath: string,
    getBetaManifest = false,
    reportIssues = false
  ): Promise<PluginManifest | null> {
    const noticeTimeout = 15;
    const manifestJson = await grabManifestJsonFromRepository(
      repositoryPath,
      !getBetaManifest,
      this.plugin.settings.debuggingMode
    );
    if (!manifestJson) {
      // this is a plugin with a manifest json, try to see if there is a beta version
      if (reportIssues)
        toastMessage(
          this.plugin,
          `${repositoryPath}\nThis does not seem to be an obsidian plugin, as there is no manifest.json file.`,
          noticeTimeout
        );
      return null;
    }
    // Test that the mainfest has some key elements, like ID and version
    if (!('id' in manifestJson)) {
      // this is a plugin with a manifest json, try to see if there is a beta version
      if (reportIssues)
        toastMessage(
          this.plugin,
          `${repositoryPath}\nThe plugin id attribute for the release is missing from the manifest file`,
          noticeTimeout
        );
      return null;
    }
    if (!('version' in manifestJson)) {
      // this is a plugin with a manifest json, try to see if there is a beta version
      if (reportIssues)
        toastMessage(
          this.plugin,
          `${repositoryPath}\nThe version attribute for the release is missing from the manifest file`,
          noticeTimeout
        );
      return null;
    }
    return manifestJson;
  }

  /**
   * Gets all the release files based on the version number in the manifest
   *
   * @param repositoryPath - path to the GitHub repository
   * @param manifest       - manifest file
   * @param getManifest    - grab the remote manifest file
   * @param specifyVersion - grab the specified version if set
   *
   * @returns all relase files as strings based on the ReleaseFiles interaface
   */
  async getAllReleaseFiles(
    repositoryPath: string,
    manifest: PluginManifest,
    getManifest: boolean,
    specifyVersion = ''
  ): Promise<ReleaseFiles> {
    const version = specifyVersion === '' ? manifest.version : specifyVersion;

    // if we have version specified, we always want to get the remote manifest file.
    const reallyGetManifestOrNot = getManifest || specifyVersion !== '';

    return {
      mainJs: await grabReleaseFileFromRepository(
        repositoryPath,
        version,
        'main.js',
        this.plugin.settings.debuggingMode
      ),
      manifest:
        reallyGetManifestOrNot ?
          await grabReleaseFileFromRepository(
            repositoryPath,
            version,
            'manifest.json',
            this.plugin.settings.debuggingMode
          )
        : '',
      styles: await grabReleaseFileFromRepository(
        repositoryPath,
        version,
        'styles.css',
        this.plugin.settings.debuggingMode
      ),
    };
  }

  /**
   * Writes the plugin release files to the local obsidian .plugins folder
   *
   * @param betaPluginId - the id of the plugin (not the repository path)
   * @param relFiles     - release file as strings, based on the ReleaseFiles interface
   *
   */
  async writeReleaseFilesToPluginFolder(
    betaPluginId: string,
    relFiles: ReleaseFiles
  ): Promise<void> {
    const pluginTargetFolderPath =
      normalizePath(this.plugin.app.vault.configDir + '/plugins/' + betaPluginId) + '/';
    const { adapter } = this.plugin.app.vault;
    if (
      !(await adapter.exists(pluginTargetFolderPath)) ||
      !(await adapter.exists(pluginTargetFolderPath + 'manifest.json'))
    ) {
      // if plugin folder doesnt exist or manifest.json doesn't exist, create it and save the plugin files
      await adapter.mkdir(pluginTargetFolderPath);
    }
    await adapter.write(pluginTargetFolderPath + 'main.js', relFiles.mainJs ?? '');
    await adapter.write(
      pluginTargetFolderPath + 'manifest.json',
      relFiles.manifest ?? ''
    );
    if (relFiles.styles)
      await adapter.write(pluginTargetFolderPath + 'styles.css', relFiles.styles);
  }

  /**
   * Primary function for adding a new beta plugin to Obsidian.
   * Also this function is used for updating existing plugins.
   *
   * @param repositoryPath    - path to GitHub repository formated as USERNAME/repository
   * @param updatePluginFiles - true if this is just an update not an install
   * @param seeIfUpdatedOnly  - if true, and updatePluginFiles true, will just check for updates, but not do the update. will report to user that there is a new plugin
   * @param reportIfNotUpdted - if true, report if an update has not succed
   * @param specifyVersion    - if not empty, need to install a specified version instead of the value in manifest-beta.json
   * @param forceReinstall    - if true, will force a reinstall of the plugin, even if it is already installed
   *
   * @returns true if succeeds
   */
  async addPlugin(
    repositoryPath: string,
    updatePluginFiles = false,
    seeIfUpdatedOnly = false,
    reportIfNotUpdted = false,
    specifyVersion = '',
    forceReinstall = false
  ): Promise<boolean> {
    console.log(
      'BRAT: addPlugin',
      repositoryPath,
      updatePluginFiles,
      seeIfUpdatedOnly,
      reportIfNotUpdted,
      specifyVersion,
      forceReinstall
    );

    const noticeTimeout = 10;
    // attempt to get manifest-beta.json
    let primaryManifest = await this.validateRepository(repositoryPath, true, false);
    const usingBetaManifest: boolean = primaryManifest ? true : false;
    // attempt to get manifest.json
    if (!usingBetaManifest)
      primaryManifest = await this.validateRepository(repositoryPath, false, true);

    if (primaryManifest === null) {
      const msg = `${repositoryPath}\nA manifest.json or manifest-beta.json file does not exist in the root directory of the repository. This plugin cannot be installed.`;
      await this.plugin.log(msg, true);
      toastMessage(this.plugin, `${msg}`, noticeTimeout);
      return false;
    }

    if (!Object.hasOwn(primaryManifest, 'version')) {
      const msg = `${repositoryPath}\nThe manifest${
        usingBetaManifest ? '-beta' : ''
      }.json file in the root directory of the repository does not have a version number in the file. This plugin cannot be installed.`;
      await this.plugin.log(msg, true);
      toastMessage(this.plugin, `${msg}`, noticeTimeout);
      return false;
    }

    // Check manifest minAppVersion and current version of Obisidan, don't load plugin if not compatible
    if (!Object.hasOwn(primaryManifest, 'minAppVersion')) {
      if (!requireApiVersion(primaryManifest.minAppVersion)) {
        const msg =
          `Plugin: ${repositoryPath}\n\n` +
          `The manifest${
            usingBetaManifest ? '-beta' : ''
          }.json for this plugin indicates that the Obsidian ` +
          `version of the app needs to be ${primaryManifest.minAppVersion}, ` +
          `but this installation of Obsidian is ${apiVersion}. \n\nYou will need to update your ` +
          `Obsidian to use this plugin or contact the plugin developer for more information.`;
        await this.plugin.log(msg, true);
        toastMessage(this.plugin, `${msg}`, 30);
        return false;
      }
    }

    interface ErrnoType {
      errno: number;
    }

    const getRelease = async () => {
      const rFiles = await this.getAllReleaseFiles(
        repositoryPath,
        // @ts-expect-error typescript will complain that this can be null, but in this case it won't be
        primaryManifest,
        usingBetaManifest,
        specifyVersion
      );
      // if beta, use that manifest, or if there is no manifest in release, use the primaryManifest
      if (usingBetaManifest || rFiles.manifest === '')
        rFiles.manifest = JSON.stringify(primaryManifest);

      if (usingBetaManifest || rFiles.mainJs === null) {
        const msg = `${repositoryPath}\nThe release is not complete and cannot be download. main.js is missing from the Release`;
        await this.plugin.log(msg, true);
        toastMessage(this.plugin, `${msg}`, noticeTimeout);
        return null;
      }
      return rFiles;
    };

    if (!updatePluginFiles || forceReinstall) {
      const releaseFiles = await getRelease();
      if (releaseFiles === null) return false;
      await this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
      if (!forceReinstall)
        // only add to list if not a force reinstall
        addBetaPluginToList(this.plugin, repositoryPath, specifyVersion);
      await this.plugin.app.plugins.loadManifests();
      if (forceReinstall) {
        // reload if enabled
        await this.reloadPlugin(primaryManifest.id);
        await this.plugin.log(`${repositoryPath} reinstalled`, true);
        toastMessage(
          this.plugin,
          `${repositoryPath}\nPlugin has been reinstalled and reloaded.`,
          noticeTimeout
        );
      } else {
        const versionText = specifyVersion === '' ? '' : ` (version: ${specifyVersion})`;
        const msg = `${repositoryPath}${versionText}\nThe plugin has been registered with BRAT. You may still need to enable it the Community Plugin List.`;
        await this.plugin.log(msg, true);
        toastMessage(this.plugin, msg, noticeTimeout);
      }
    } else {
      // test if the plugin needs to be updated
      // if a specified version is provided, then we shall skip the update
      const pluginTargetFolderPath =
        this.plugin.app.vault.configDir + '/plugins/' + primaryManifest.id + '/';
      let localManifestContents = '';
      try {
        localManifestContents = await this.plugin.app.vault.adapter.read(
          pluginTargetFolderPath + 'manifest.json'
        );
      } catch (e) {
        if ((e as ErrnoType).errno === -4058 || (e as ErrnoType).errno === -2) {
          // file does not exist, try installing the plugin
          await this.addPlugin(
            repositoryPath,
            false,
            usingBetaManifest,
            false,
            specifyVersion
          );
          // even though failed, return true since install will be attempted
          return true;
        } else
          console.log(
            'BRAT - Local Manifest Load',
            primaryManifest.id,
            JSON.stringify(e, null, 2)
          );
      }

      if (
        specifyVersion !== '' ||
        this.plugin.settings.pluginSubListFrozenVersion
          .map((x) => x.repo)
          .includes(repositoryPath)
      ) {
        // skip the frozen version plugin
        toastMessage(
          this.plugin,
          `The version of ${repositoryPath} is frozen, not updating.`,
          3
        );
        return false;
      }

      const localManifestJson = (await JSON.parse(
        localManifestContents
      )) as PluginManifest;
      if (localManifestJson.version !== primaryManifest.version) {
        // manifest files are not the same, do an update
        const releaseFiles = await getRelease();
        if (releaseFiles === null) return false;

        if (seeIfUpdatedOnly) {
          // dont update, just report it
          const msg = `There is an update available for ${primaryManifest.id} from version ${localManifestJson.version} to ${primaryManifest.version}. `;
          await this.plugin.log(
            msg +
              `[Release Info](https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version})`,
            true
          );
          toastMessage(this.plugin, msg, 30, () => {
            if (primaryManifest) {
              window.open(
                `https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version}`
              );
            }
          });
        } else {
          await this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
          await this.plugin.app.plugins.loadManifests();
          await this.reloadPlugin(primaryManifest.id);
          const msg = `${primaryManifest.id}\nPlugin has been updated from version ${localManifestJson.version} to ${primaryManifest.version}. `;
          await this.plugin.log(
            msg +
              `[Release Info](https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version})`,
            true
          );
          toastMessage(this.plugin, msg, 30, () => {
            if (primaryManifest) {
              window.open(
                `https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version}`
              );
            }
          });
        }
      } else if (reportIfNotUpdted)
        toastMessage(this.plugin, `No update available for ${repositoryPath}`, 3);
    }
    return true;
  }

  /**
   * reloads a plugin (assuming it has been enabled by user)
   * pjeby, Thanks Bro https://github.com/pjeby/hot-reload/blob/master/main.js
   *
   * @param pluginName - name of plugin
   *
   */
  async reloadPlugin(pluginName: string): Promise<void> {
    const { plugins } = this.plugin.app;
    try {
      await plugins.disablePlugin(pluginName);
      await plugins.enablePlugin(pluginName);
    } catch (e) {
      if (this.plugin.settings.debuggingMode) console.log('reload plugin', e);
    }
  }

  /**
   * updates a beta plugin
   *
   * @param repositoryPath - repository path on GitHub
   * @param onlyCheckDontUpdate - only looks for update
   *
   */
  async updatePlugin(
    repositoryPath: string,
    onlyCheckDontUpdate = false,
    reportIfNotUpdted = false,
    forceReinstall = false
  ): Promise<boolean> {
    const result = await this.addPlugin(
      repositoryPath,
      true,
      onlyCheckDontUpdate,
      reportIfNotUpdted,
      '',
      forceReinstall
    );
    if (!result && !onlyCheckDontUpdate)
      toastMessage(this.plugin, `${repositoryPath}\nUpdate of plugin failed.`);
    return result;
  }

  /**
   * walks through the list of plugins without frozen version and performs an update
   *
   * @param showInfo - should this with a started/completed message - useful when ran from CP
   *
   */
  async checkForPluginUpdatesAndInstallUpdates(
    showInfo = false,
    onlyCheckDontUpdate = false
  ): Promise<void> {
    if (!(await isConnectedToInternet())) {
      console.log('BRAT: No internet detected.');
      return;
    }
    let newNotice: Notice | undefined;
    const msg1 = `Checking for plugin updates STARTED`;
    await this.plugin.log(msg1, true);
    if (showInfo && this.plugin.settings.notificationsEnabled)
      newNotice = new Notice(`BRAT\n${msg1}`, 30000);
    const pluginSubListFrozenVersionNames = new Set(
      this.plugin.settings.pluginSubListFrozenVersion.map((f) => f.repo)
    );
    for (const bp of this.plugin.settings.pluginList) {
      if (pluginSubListFrozenVersionNames.has(bp)) {
        continue;
      }
      await this.updatePlugin(bp, onlyCheckDontUpdate);
    }
    const msg2 = `Checking for plugin updates COMPLETED`;
    await this.plugin.log(msg2, true);
    if (showInfo) {
      if (newNotice) {
        newNotice.hide();
      }
      toastMessage(this.plugin, msg2, 10);
    }
  }

  /**
   * Removes the beta plugin from the list of beta plugins (does not delete them from disk)
   *
   * @param betaPluginID - repository path
   *
   */
  deletePlugin(repositoryPath: string): void {
    const msg = `Removed ${repositoryPath} from BRAT plugin list`;
    void this.plugin.log(msg, true);
    this.plugin.settings.pluginList = this.plugin.settings.pluginList.filter(
      (b) => b !== repositoryPath
    );
    this.plugin.settings.pluginSubListFrozenVersion =
      this.plugin.settings.pluginSubListFrozenVersion.filter(
        (b) => b.repo !== repositoryPath
      );
    void this.plugin.saveSettings();
  }

  /**
   * Returns a list of plugins that are currently enabled or currently disabled
   *
   * @param enabled - true for enabled plugins, false for disabled plutings
   *
   * @returns manifests  of plugins
   */
  getEnabledDisabledPlugins(enabled: boolean): PluginManifest[] {
    const pl = this.plugin.app.plugins;
    const manifests: PluginManifest[] = Object.values(pl.manifests);
    const enabledPlugins: PluginManifest[] = Object.values(pl.plugins).map(
      (p) => p.manifest
    );
    return enabled ?
        manifests.filter((manifest) =>
          enabledPlugins.find((pluginName) => manifest.id === pluginName.id)
        )
      : manifests.filter(
          (manifest) =>
            !enabledPlugins.find((pluginName) => manifest.id === pluginName.id)
        );
  }
}