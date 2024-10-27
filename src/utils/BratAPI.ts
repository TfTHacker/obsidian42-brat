import type ThePlugin from "../main";
import {
  grabChecksumOfThemeCssFile,
  grabCommmunityThemeCssFile,
  grabLastCommitDateForFile,
} from "../features/githubUtils";
import {
  themeSave,
  themeDelete,
  themesCheckAndUpdates,
} from "../features/themes";

// This module is for API access for use in debuging console

export default class BratAPI {
  plugin: ThePlugin;

  constructor(plugin: ThePlugin) {
    this.plugin = plugin;
  }

  console = (
    logDescription: string,
    ...outputs: (string | number | boolean)[]
  ): void => {
    console.log(`BRAT: ${logDescription}`, ...outputs);
  };

  themes = {
    themeseCheckAndUpates: async (showInfo: boolean): Promise<void> => {
      await themesCheckAndUpdates(this.plugin, showInfo);
    },

    themeInstallTheme: async (cssGithubRepository: string): Promise<void> => {
      const scrubbedAddress = cssGithubRepository.replace(
        "https://github.com/",
        ""
      );
      await themeSave(this.plugin, scrubbedAddress, true);
    },

    themesDelete: (cssGithubRepository: string): void => {
      const scrubbedAddress = cssGithubRepository.replace(
        "https://github.com/",
        ""
      );
      themeDelete(this.plugin, scrubbedAddress);
    },

    grabCommmunityThemeCssFile: async (
      repositoryPath: string,
      betaVersion = false
    ): Promise<string | null> => {
      return await grabCommmunityThemeCssFile(
        repositoryPath,
        betaVersion,
        this.plugin.settings.debuggingMode
      );
    },

    grabChecksumOfThemeCssFile: async (
      repositoryPath: string,
      betaVersion = false
    ): Promise<string> => {
      return await grabChecksumOfThemeCssFile(
        repositoryPath,
        betaVersion,
        this.plugin.settings.debuggingMode
      );
    },

    grabLastCommitDateForFile: async (
      repositoryPath: string,
      path: string
    ): Promise<string> => {
      // example await grabLastCommitDateForAFile(t.repo, "theme-beta.css");
      return await grabLastCommitDateForFile(repositoryPath, path);
    },
  };
}
