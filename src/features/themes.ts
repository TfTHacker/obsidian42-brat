import { normalizePath, Notice } from "obsidian";
import ThePlugin from "../main";
import { GenericFuzzySuggester, SuggesterItem } from "../ui/GenericFuzzySuggester";
import { grabCommmunityThemeObsidianCss, grabCommmunityThemesList } from "./githubUtils";


export const themesRootPath = (plugin: ThePlugin): string => {
    return normalizePath(plugin.app.vault.configDir + "/themes") + "/";
}

export const themeInstallTheme = async (plugin: ThePlugin, cssGithubRepository: string, cssFileName = ""): Promise<boolean> => {
    const themeCSS = await grabCommmunityThemeObsidianCss(cssGithubRepository);
    if(!themeCSS) {
        new Notice("BRAT\nThere is no obsidian.css file in the root path of this repository, so there is no theme to install.")
        return false;
    }
    await themesSaveTheme(plugin, cssFileName, themeCSS);
    const msg = `${cssFileName} theme installed from ${cssGithubRepository}. `;
    plugin.log(msg + `[Theme Info](https://github.com/${cssGithubRepository})`, false);
    const newNotice: Notice = new Notice(`BRAT\n${msg}\n(Click for info)`, 10000);
    //@ts-ignore
    newNotice.noticeEl.onclick = async () => { window.open(`https://github.com/${cssGithubRepository}`) };
    setTimeout(() => {
        // @ts-ignore            
        plugin.app.customCss.setTheme(cssFileName);
    }, 500);
    return true;
}

export const themesSaveTheme = async (plugin: ThePlugin, cssFileName: string, cssText: string): Promise<void> => {
    const themesTargetFolderPath = themesRootPath(plugin);
    const adapter = plugin.app.vault.adapter;
    if (await adapter.exists(themesTargetFolderPath) === false) await adapter.mkdir(themesTargetFolderPath);
    await adapter.write(themesTargetFolderPath + cssFileName + ".css", cssText);
}

export const themesInstallFromCommunityList = async (plugin: ThePlugin) =>{
    const communityTheme = await grabCommmunityThemesList();
    const communityThemeList: SuggesterItem[] = Object.values(communityTheme).map((p) => { return { display: `Theme: ${p.name}  (${p.repo})`, info: p } });
    const gfs = new GenericFuzzySuggester(plugin);
    gfs.setSuggesterData(communityThemeList);
    await gfs.display(async (results) => {
        await themeInstallTheme(plugin, results.info.repo, results.info.name);
    });
}

export const themesDeriveBetaNameFromRepository = (cssGithubRepository: string): string => {
    const betaName = "BRAT-" + cssGithubRepository.replace("/", "____");
    return betaName.substr(0, 100);
}

export const themesDelete = async (plugin: ThePlugin, cssGithubRepository) => {
    plugin.settings.themesList = plugin.settings.themesList.filter((t) => t.repo != cssGithubRepository);
    plugin.saveSettings();
    await plugin.app.vault.adapter.remove(themesRootPath(plugin) + themesDeriveBetaNameFromRepository(cssGithubRepository) + ".css");
    const msg = `Removed ${cssGithubRepository} from BRAT themes list and deleted from vault`;
    plugin.log(msg, true);
    new Notice(`BRAT\n${msg}`);
}
