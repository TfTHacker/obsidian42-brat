import type ThePlugin from '../main';
import { Modal, Setting } from 'obsidian';
import { themeSave } from '../features/themes';
import { toastMessage } from '../utils/notifications';
import { existBetaThemeinInList } from '../settings';
import { promotionalLinks } from './Promotional';

/**
 * Add a beta theme to the list of plugins being tracked and updated
 */
export default class AddNewTheme extends Modal {
  plugin: ThePlugin;
  address: string;
  openSettingsTabAfterwards: boolean;

  constructor(plugin: ThePlugin, openSettingsTabAfterwards = false) {
    super(plugin.app);
    this.plugin = plugin;
    this.address = '';
    this.openSettingsTabAfterwards = openSettingsTabAfterwards;
  }

  async submitForm(): Promise<void> {
    if (this.address === '') return;
    const scrubbedAddress = this.address.replace('https://github.com/', '');
    if (existBetaThemeinInList(this.plugin, scrubbedAddress)) {
      toastMessage(
        this.plugin,
        `This plugin is already in the list for beta testing`,
        10
      );
      return;
    }

    if (await themeSave(this.plugin, scrubbedAddress, true)) {
      this.close();
    }
  }

  onOpen(): void {
    this.contentEl.createEl('h4', { text: 'Github repository for beta theme:' });
    this.contentEl.createEl('form', {}, (formEl) => {
      formEl.addClass('brat-modal');
      new Setting(formEl).addText((textEl) => {
        textEl.setPlaceholder(
          'Repository (example: https://github.com/GitubUserName/repository-name'
        );
        textEl.onChange((value) => {
          this.address = value.trim();
        });
        textEl.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' && this.address !== ' ') {
            e.preventDefault();
            void this.submitForm();
          }
        });
        textEl.inputEl.style.width = '100%';
        window.setTimeout(() => {
          const title = document.querySelector('.setting-item-info');
          if (title) title.remove();
          textEl.inputEl.focus();
        }, 10);
      });

      formEl.createDiv('modal-button-container', (buttonContainerEl) => {
        buttonContainerEl
          .createEl('button', { attr: { type: 'button' }, text: 'Never mind' })
          .addEventListener('click', () => {
            this.close();
          });
        buttonContainerEl.createEl('button', {
          attr: { type: 'submit' },
          cls: 'mod-cta',
          text: 'Add Theme',
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
        if (this.address !== '') void this.submitForm();
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
