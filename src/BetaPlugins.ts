import ThePlugin from "./main";
import AddNewPluginModal from "./AddNewPluginModal";

export default class BetaPlugins {
    plugin: ThePlugin;

    constructor(plugin: ThePlugin) {
        this.plugin = plugin;
    }

    async displayAddNewPluginModal() {
        const newPlugin = new AddNewPluginModal(this.plugin, this);
        newPlugin.open();
    }

    // Adds a plugin for beta testing to the list of plugins
    // also verifies that this is a vaild plugin before adding to the list
    // if valid will also install the plugin
    addPlugin() {

    }

    // Removes plugin from the list of beta plugins
    // unistalls the beta
    deletePlugin() {

    }

    checkForUpdates() {

    }

    updatePlugin() {

    }

}