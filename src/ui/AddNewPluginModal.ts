import type ThePlugin from '../main';
import { Modal, Setting } from 'obsidian';
import type BetaPlugins from '../features/BetaPlugins';
import { toastMessage } from '../utils/notifications';
import { promotionalLinks } from './Promotional';
import { existBetaPluginInList } from '../settings';

/**
 * Add a beta plugin to the list of plugins being tracked and updated
 */
export default class AddNewPluginModal extends Modal {
  plugin: ThePlugin;
  betaPlugins: BetaPlugins;
  address: string;
  openSettingsTabAfterwards: boolean;
  readonly useFrozenVersion: boolean;
  version: string;

  constructor(
    plugin: ThePlugin,
    betaPlugins: BetaPlugins,
    openSettingsTabAfterwards = false,
    useFrozenVersion = false
  ) {
    super(plugin.app);
    this.plugin = plugin;
    this.betaPlugins = betaPlugins;
    this.address = '';
    this.openSettingsTabAfterwards = openSettingsTabAfterwards;
    this.useFrozenVersion = useFrozenVersion;
    this.version = '';
  }

  async submitForm(): Promise<void> {
    if (this.address === '') return;
    let scrubbedAddress = this.address.replace('https://github.com/', '');
    if (scrubbedAddress.endsWith('.git')) scrubbedAddress = scrubbedAddress.slice(0, -4);
    if (existBetaPluginInList(this.plugin, scrubbedAddress)) {
      toastMessage(
        this.plugin,
        `This plugin is already in the list for beta testing`,
        10
      );
      return;
    }
    const result = await this.betaPlugins.addPlugin(
      scrubbedAddress,
      false,
      false,
      false,
      this.version
    );
    if (result) {
      this.close();
    }
  }

  onOpen(): void {
    this.contentEl.createEl('h4', { text: 'Github repository for beta plugin:' });
    this.contentEl.createEl('form', {}, (formEl) => {
      formEl.addClass('brat-modal');
      new Setting(formEl).addText((textEl) => {
        textEl.setPlaceholder(
          'Repository (example: https://github.com/GitubUserName/repository-name)'
        );
        textEl.onChange((value) => {
          this.address = value.trim();
        });
        textEl.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' && this.address !== ' ') {
            if (
              (this.useFrozenVersion && this.version !== '') ||
              !this.useFrozenVersion
            ) {
              e.preventDefault();
              void this.submitForm();
            }
          }
        });
        textEl.inputEl.style.width = '100%';
      });

      if (this.useFrozenVersion) {
        new Setting(formEl).addText((textEl) => {
          textEl.setPlaceholder('Specify the release version tag (example: 1.0.0)');
          textEl.onChange((value) => {
            this.version = value.trim();
          });
          textEl.inputEl.style.width = '100%';
        });
      }

      formEl.createDiv('modal-button-container', (buttonContainerEl) => {
        buttonContainerEl
          .createEl('button', { attr: { type: 'button' }, text: 'Never mind' })
          .addEventListener('click', () => {
            this.close();
          });
        buttonContainerEl.createEl('button', {
          attr: { type: 'submit' },
          cls: 'mod-cta',
          text: 'Add Plugin',
        });
      });

      const newDiv = formEl.createDiv();
      newDiv.style.borderTop = '1px solid #ccc';
      newDiv.style.marginTop = '30px';
      const byTfThacker = newDiv.createSpan();
      byTfThacker.innerHTML =
        "BRAT by <a href='https://bit.ly/o42-twitter'>TFTHacker</a>";
      byTfThacker.style.fontStyle = 'italic';
      newDiv.appendChild(byTfThacker);
      promotionalLinks(newDiv, false);

      window.setTimeout(() => {
        const title = formEl.querySelectorAll('.brat-modal .setting-item-info');
        title.forEach((titleEl) => {
          titleEl.remove();
        });
      }, 50);

      // invoked when button is clicked.
      formEl.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        if (this.address !== '') {
          if ((this.useFrozenVersion && this.version !== '') || !this.useFrozenVersion) {
            void this.submitForm();
          }
        }
      });
    });
  }

  onClose(): void {
    if (this.openSettingsTabAfterwards) {
      this.plugin.app.setting.open();
      this.plugin.app.setting.openTabById(this.plugin.APP_ID);
    }
  }
}
