import { Modal, Notice, Setting } from 'obsidian';
import BetaPlugins from './BetaPlugins';
import ThePlugin from './main';
import { reloadPlugin, grabReleaseFileFromRepository } from './utils';
import { grabManifestJsonFromRepository } from "./utils";

// Generic class for capturing a line of text

export default class AddNewPluginModal extends Modal {
    plugin: ThePlugin;
    betaPlugins: BetaPlugins;
    address: string;

    constructor(plugin: ThePlugin, betaPlugins: BetaPlugins) {
        super(plugin.app);
        this.plugin = plugin;
        this.betaPlugins = betaPlugins;
    }

    async submitForm(): Promise<void> {
        // this.address = "TfTHacker/obsidian42-jump-to-date";
        let betaManifestJson = null;
        const manifestJson = await grabManifestJsonFromRepository(this.address, true);

        if (!manifestJson) { // this is a plugin with a manifest json, try to see if there is a beta version
            new Notice("This does not seem to be an obsidian plugin, as there is no manifest.json file.")
            return;
        } else
            betaManifestJson = await grabManifestJsonFromRepository(this.address, false);

        const primaryManifest = betaManifestJson ? betaManifestJson : manifestJson; // if there is a beta manifest, use that

        const remoteMainJsContents = await grabReleaseFileFromRepository(this.address, primaryManifest.version, "main.js");
        if (remoteMainJsContents === "Not Found") {
            new Notice("The release is not complete and cannot be download. main.js is missing from the release", 20000);
            return;
        }

        const remoteManifestContents = await grabReleaseFileFromRepository(this.address, primaryManifest.version, "manifest.json");
        if (remoteManifestContents === "Not Found") {
            new Notice("The release is not complete and cannot be download. manifest.json is missing from the release", 20000);
            return;
        }
        const remoteManifestJSON = JSON.parse(remoteManifestContents);

        const remoteStylesContents = await grabReleaseFileFromRepository(this.address, primaryManifest.version, "styles.css");

        const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + remoteManifestJSON.id + "/";

        const writefiles = async () => {
            await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "main.js", remoteMainJsContents);
            await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "manifest.json", remoteManifestContents);
            if (remoteStylesContents) await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "styles.css", remoteStylesContents);
        }

        if (await this.plugin.app.vault.adapter.exists(pluginTargetFolderPath) === false || !(await this.plugin.app.vault.adapter.exists(pluginTargetFolderPath + "manifest.json"))) {
            // if plugin folder doesnt exist or manifest.json doesn't exist, create it and save the plugin files
            await this.plugin.app.vault.adapter.mkdir(pluginTargetFolderPath);
            await writefiles();
            new Notice("The plugin has been installed and now needs to be enabled in Community Plugins in Settings. First refresh community plugins and then enable this plugin");
        } else {
            // test if the plugin needs to be updated
            const localManifestContents = await this.plugin.app.vault.adapter.read(pluginTargetFolderPath + "manifest.json")
            const localManifestJSON = await JSON.parse(localManifestContents);
            if (localManifestJSON.version !== remoteManifestJSON.version) { //manifest files are not the same, do an update
                await writefiles();
                await reloadPlugin(this.plugin, remoteManifestJSON.id)
            }
        }

        this.close();
    }

    onOpen(): void {
        this.contentEl.createEl('h4', { text: "Github repository for beta plugin:" });
        this.contentEl.createEl('form', {}, (formEl) => {
            const inputEl = new Setting(formEl)
                .addText((textEl) => {
                    textEl.setPlaceholder('Repository (example: TfTHacker/obsidian-brat');
                    textEl.onChange((value) => {
                        this.address = value.trim();
                    });
                    textEl.inputEl.addEventListener('keydown', async (e: KeyboardEvent) => {
                        if (e.key === 'Enter' && this.address !== ' ') {
                            e.preventDefault();
                            await this.submitForm();
                        }
                    });
                    textEl.inputEl.style.width = "100%";
                    window.setTimeout(() => {
                        const title = document.querySelector(".setting-item-info");
                        if (title) title.remove();
                        textEl.inputEl.focus()
                    }, 10);
                });

            formEl.createDiv('modal-button-container', (buttonContainerEl) => {
                buttonContainerEl
                    .createEl('button', { attr: { type: 'button' }, text: 'Never mind' })
                    .addEventListener('click', () => this.close());
                buttonContainerEl.createEl('button', {
                    attr: { type: 'submit' },
                    cls: 'mod-cta',
                    text: 'Add Plugin',
                });
            });

            // invoked when button is clicked. 
            formEl.addEventListener('submit', async (e: Event) => {
                e.preventDefault();
                if (this.address !== '') await this.submitForm();
            });
        });
    }
}