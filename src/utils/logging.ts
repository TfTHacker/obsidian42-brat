import type ThePlugin from '../main';
import type { TFile } from 'obsidian';
import { moment, Platform } from 'obsidian';
import { getDailyNoteSettings } from 'obsidian-daily-notes-interface';

/**
 * Logs events to a log file
 *
 * @param plugin           - Plugin object
 * @param textToLog        - text to be saved to log file
 * @param verboseLoggingOn - True if should only be logged if verbose logging is enabled
 *
 */
export function logger(
  plugin: ThePlugin,
  textToLog: string,
  verboseLoggingOn = false
): void {
  if (plugin.settings.debuggingMode) console.log('BRAT: ' + textToLog);
  if (plugin.settings.loggingEnabled) {
    if (!plugin.settings.loggingVerboseEnabled && verboseLoggingOn) {
      return;
    } else {
      const fileName = plugin.settings.loggingPath + '.md';
      const dateOutput =
        '[[' +
        moment().format(getDailyNoteSettings().format).toString() +
        ']] ' +
        moment().format('HH:mm');
      const os = window.require('os') as { hostname: () => string };
      const machineName = Platform.isDesktop ? os.hostname() : 'MOBILE';
      let output =
        dateOutput + ' ' + machineName + ' ' + textToLog.replace('\n', ' ') + '\n\n';
      (async () => {
        if (await plugin.app.vault.adapter.exists(fileName)) {
          const fileContents = await plugin.app.vault.adapter.read(fileName);
          output = output + fileContents;
          const file = plugin.app.vault.getAbstractFileByPath(fileName) as TFile;
          void plugin.app.vault.modify(file, output);
        } else void plugin.app.vault.create(fileName, output);
      })();
    }
  }
}
