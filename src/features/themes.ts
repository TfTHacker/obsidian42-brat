import { normalizePath, Notice } from "obsidian";
import ThePlugin from "../main";
import { GenericFuzzySuggester, SuggesterItem } from "../ui/GenericFuzzySuggester";
import { grabCommmunityThemeObsidianCss, grabCommmunityThemesList } from "./githubUtils";


export function themesRootPath(plugin: ThePlugin): string {
    return normalizePath(plugin.app.vault.configDir + "/themes") + "/";
}


export async function themeInstallTheme(plugin: ThePlugin, cssGithubRepository: string, cssFileName = "") {
    const themeCSS = await grabCommmunityThemeObsidianCss(cssGithubRepository);
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
}

export async function themesSaveTheme(plugin: ThePlugin, cssFileName: string, cssText: string): Promise<void> {
    const themesTargetFolderPath = themesRootPath(plugin);
    const adapter = plugin.app.vault.adapter;
    if (await adapter.exists(themesTargetFolderPath) === false) await adapter.mkdir(themesTargetFolderPath);
    console.log(themesTargetFolderPath + cssFileName + ".css")
    await adapter.write(themesTargetFolderPath + cssFileName + ".css", cssText);
}

export async function themesInstallFromCommunityList(plugin: ThePlugin) {
    const communityTheme = await grabCommmunityThemesList();
    const communityThemeList: SuggesterItem[] = Object.values(communityTheme).map((p) => { return { display: `Theme: ${p.name}  (${p.repo})`, info: p } });
    const gfs = new GenericFuzzySuggester(plugin);
    gfs.setSuggesterData(communityThemeList);
    await gfs.display(async (results) => {
        await themeInstallTheme(plugin, results.info.repo, results.info.name);
    });
}

export function themesDeriveBetaNameFromRepository(cssGithubRepository: string): string {
    const betaName = "BRAT-" + cssGithubRepository.replace("/", "____");
    return betaName.substr(0, 100);
}


export async function themesDelete(plugin: ThePlugin, cssGithubRepository) {
    console.log(cssGithubRepository)
    plugin.settings.themesList = plugin.settings.themesList.filter((b) => b != cssGithubRepository);
    console.log(plugin.settings.themesList)
    plugin.saveSettings();
    await plugin.app.vault.adapter.remove(themesRootPath(plugin) + themesDeriveBetaNameFromRepository(cssGithubRepository) + ".css");
    const msg = `Removed ${cssGithubRepository} from BRAT themes list and deleted from vault`;
    plugin.log(msg, true);
    new Notice(`BRAT\n${msg}`);

}
