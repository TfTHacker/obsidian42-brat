import type { PluginManifest } from "obsidian";
import {
	Platform,
	apiVersion,
	Notice,
	normalizePath,
	requireApiVersion,
} from "obsidian";
import {
	GHRateLimitError,
	GitHubResponseError,
} from "src/utils/GitHubAPIErrors";
import type BratPlugin from "../main";
import { addBetaPluginToList } from "../settings";
import AddNewPluginModal from "../ui/AddNewPluginModal";
import { isConnectedToInternet } from "../utils/internetconnection";
import { toastMessage } from "../utils/notifications";
import {
	grabReleaseFileFromRepository,
	grabReleaseFromRepository,
	isPrivateRepo,
	type Release,
} from "./githubUtils";
import { confirm } from "src/ui/ConfirmModal";

const compareVersions = require("semver/functions/compare");
const semverCoerce = require("semver/functions/coerce");
/**
 * all the files needed for a plugin based on the release files are hre
 */
interface ReleaseFiles {
	mainJs: string | null;
	manifest: string | null;
	styles: string | null;
}

interface PluginManifestEx extends PluginManifest {
	brat: {
		isIncompatible?: boolean;
		isDesktopOnlyOriginal?: boolean;
		minAppVersionOriginal?: string;
	};
}

/**
 * Primary handler for adding, updating, deleting beta plugins tracked by this plugin
 */
export default class BetaPlugins {
	plugin: BratPlugin;

	constructor(plugin: BratPlugin) {
		this.plugin = plugin;
	}

	/**
	 * opens the AddNewPluginModal to get info for  a new beta plugin
	 * @param openSettingsTabAfterwards - will open settings screen afterwards. Used when this command is called from settings tab
	 * @param useFrozenVersion - install the plugin using frozen version.
	 * @param prefillRepo - prefill the repository field in the modal.
	 * @param prefillVersion - prefill the version field in the modal.
	 * @param prefillPrivateApiKey - prefill the private API key field in the modal.
	 */
	displayAddNewPluginModal(
		openSettingsTabAfterwards = false,
		useFrozenVersion = false,
		prefillRepo = "",
		prefillVersion = "",
		prefillPrivateApiKey = "",
	): void {
		const newPlugin = new AddNewPluginModal(
			this.plugin,
			this,
			openSettingsTabAfterwards,
			useFrozenVersion,
			prefillRepo,
			prefillVersion,
			prefillPrivateApiKey,
		);
		newPlugin.open();
	}

	/**
	 * Validates a GitHub repository to determine if it contains a valid Obsidian plugin.
	 *
	 * @param repositoryPath - The path to the GitHub repository.
	 * @param getBetaManifest - Whether to fetch the beta manifest instead of the stable one. Defaults to `false`.
	 * @param reportIssues - Whether to display error messages to the user. Defaults to `false`.
	 * @param specifyVersion - A specific version to validate. Defaults to an empty string, which fetches the latest release.
	 * @param privateApiKey - An optional private API key for accessing private repositories. Defaults to an empty string.
	 *
	 * @returns A promise that resolves to the plugin's `PluginManifest` if valid, or `null` if validation fails.
	 *
	 * @throws GHRateLimitError - If the GitHub API rate limit is exceeded.
	 *
	 * @remarks
	 * - The function checks if the repository is private and fetches the latest release or a specified version.
	 * - It validates the presence of a `manifest.json` file and ensures it contains required attributes (`id` and `version`).
	 * - If the version in the `manifest.json` does not match the release version, the release version will override the manifest version.
	 * - Error messages are logged or displayed based on the `reportIssues` flag.
	 */
	async validateRepository(
		repositoryPath: string,
		getBetaManifest = false,
		reportIssues = false,
		specifyVersion = "",
		privateApiKey = "",
	): Promise<PluginManifest | null> {
		const noticeTimeout = 15;

		// GitHub API access might throw a rate limit
		try {
			// check if the repository is private
			const isPrivate = await isPrivateRepo(
				repositoryPath,
				this.plugin.settings.debuggingMode,
				privateApiKey || this.plugin.settings.personalAccessToken,
			);

			// Grab the manifest.json for the latest release from the repository
			const release: Release | null = await grabReleaseFromRepository(
				repositoryPath,
				specifyVersion,
				getBetaManifest,
				this.plugin.settings.debuggingMode,
				isPrivate,
				privateApiKey || this.plugin.settings.personalAccessToken,
			);

			if (!release) {
				if (reportIssues) {
					toastMessage(
						this.plugin,
						`${repositoryPath}\nThis does not seem to be an obsidian plugin with valid releases, as there are no releases available.`,
						noticeTimeout,
					);
					console.error(
						"BRAT: validateRepository",
						repositoryPath,
						getBetaManifest,
						reportIssues,
					);
				}
				return null;
			}

			const rawManifest = await grabReleaseFileFromRepository(
				release,
				"manifest.json",
				this.plugin.settings.debuggingMode,
				isPrivate,
				privateApiKey || this.plugin.settings.personalAccessToken,
			);

			if (!rawManifest) {
				// this is a plugin with a manifest json, try to see if there is a beta version
				if (reportIssues) {
					toastMessage(
						this.plugin,
						`${repositoryPath}\nThis does not seem to be an obsidian plugin, as there is no manifest.json file.`,
						noticeTimeout,
					);
					console.error(
						"BRAT: validateRepository",
						repositoryPath,
						getBetaManifest,
						reportIssues,
					);
				}
				return null;
			}

			// Parse the returned file and verify that the mainfest has some key elements, like ID and version
			const manifestJson = JSON.parse(rawManifest) as PluginManifest;
			if (!("id" in manifestJson)) {
				// this is a plugin with a manifest json, try to see if there is a beta version
				if (reportIssues)
					toastMessage(
						this.plugin,
						`${repositoryPath}\nThe plugin id attribute for the release is missing from the manifest file`,
						noticeTimeout,
					);
				return null;
			}
			if (!("version" in manifestJson)) {
				// this is a plugin with a manifest json, try to see if there is a beta version
				if (reportIssues)
					toastMessage(
						this.plugin,
						`${repositoryPath}\nThe version attribute for the release is missing from the manifest file`,
						noticeTimeout,
					);
				return null;
			}

			const expectedVersion = semverCoerce(release.tag_name, {
				includePrerelease: true,
				loose: true,
			});
			const manifestVersion = semverCoerce(manifestJson.version, {
				includePrerelease: true,
				loose: true,
			});

			if (compareVersions(expectedVersion, manifestVersion) !== 0) {
				if (reportIssues)
					toastMessage(
						this.plugin,
						`${repositoryPath}\nVersion mismatch detected:\nRelease tag version: ${release.tag_name}\nManifest version: ${manifestJson.version}\n\nThe release tag version will be used to ensure consistency.`,
						noticeTimeout,
					);

				// Overwrite the manifest version with the release version
				manifestJson.version = expectedVersion.version;
			}
			return manifestJson;
		} catch (error) {
			if (error instanceof GHRateLimitError) {
				const msg = `GitHub API rate limit exceeded. Reset in ${error.getMinutesToReset()} minutes.`;
				if (reportIssues) toastMessage(this.plugin, msg, noticeTimeout);
				console.error(`BRAT: validateRepository ${error}`);

				toastMessage(
					this.plugin,
					`${error.message} Consider adding a personal access token in BRAT settings for higher limits. See documentation for details.`,
					20,
					(): void => {
						window.open(
							"https://github.com/TfTHacker/obsidian42-brat/blob/main/BRAT-DEVELOPER-GUIDE.md#github-api-rate-limits",
						);
					},
				);

				throw error;
			}

			if (error instanceof GitHubResponseError) {
				if (reportIssues) {
					if (error.status === 401) {
						toastMessage(
							this.plugin,
							`${repositoryPath}\nGitHub API Authentication error. Please verify that your personal access token is valid and set correctly.`,
							noticeTimeout,
						);
					} else {
						toastMessage(
							this.plugin,
							`${repositoryPath}\nGitHub API error ${error.status}: ${error.message}`,
							noticeTimeout,
						);
					}
				}
				console.error(`BRAT: validateRepository ${error}`);

				throw error;
			}

			if (reportIssues)
				toastMessage(
					this.plugin,
					`${repositoryPath}\nUnspecified error encountered: ${error}, verify debug for more information.`,
					noticeTimeout,
				);
			return null;
		}
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
		specifyVersion = "",
		privateApiKey = "",
	): Promise<ReleaseFiles> {
		// check if the repository is private
		const isPrivate = await isPrivateRepo(
			repositoryPath,
			this.plugin.settings.debuggingMode,
			privateApiKey,
		);

		// Get the latest release from the repository
		const release: Release | null = await grabReleaseFromRepository(
			repositoryPath,
			specifyVersion,
			getManifest,
			this.plugin.settings.debuggingMode,
			isPrivate,
			privateApiKey || this.plugin.settings.personalAccessToken,
		);

		if (!release) {
			return Promise.reject("No release found");
		}

		// if we have version specified, we always want to get the remote manifest file.
		const reallyGetManifestOrNot = getManifest || specifyVersion !== "";

		console.log({ reallyGetManifestOrNot, version: release.tag_name });

		return {
			mainJs: await grabReleaseFileFromRepository(
				release,
				"main.js",
				this.plugin.settings.debuggingMode,
				isPrivate,
				privateApiKey || this.plugin.settings.personalAccessToken,
			),
			manifest: reallyGetManifestOrNot
				? await grabReleaseFileFromRepository(
						release,
						"manifest.json",
						this.plugin.settings.debuggingMode,
						isPrivate,
						privateApiKey || this.plugin.settings.personalAccessToken,
					)
				: "",
			styles: await grabReleaseFileFromRepository(
				release,
				"styles.css",
				this.plugin.settings.debuggingMode,
				isPrivate,
				privateApiKey || this.plugin.settings.personalAccessToken,
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
		relFiles: ReleaseFiles,
	): Promise<void> {
		const pluginTargetFolderPath = `${normalizePath(`${this.plugin.app.vault.configDir}/plugins/${betaPluginId}`)}/`;
		const { adapter } = this.plugin.app.vault;
		if (!(await adapter.exists(pluginTargetFolderPath))) {
			await adapter.mkdir(pluginTargetFolderPath);
		}
		await adapter.write(
			`${pluginTargetFolderPath}main.js`,
			relFiles.mainJs ?? "",
		);
		await adapter.write(
			`${pluginTargetFolderPath}manifest.json`,
			relFiles.manifest ?? "",
		);
		if (relFiles.styles)
			await adapter.write(
				`${pluginTargetFolderPath}styles.css`,
				relFiles.styles,
			);
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
	 * @param enableAfterInstall - if true, will enable the plugin after install
	 * @param privateApiKey     - if not empty, will use the private API key to access the repository
	 *
	 * @returns true if succeeds
	 */
	async addPlugin(
		repositoryPath: string,
		updatePluginFiles = false,
		seeIfUpdatedOnly = false,
		reportIfNotUpdted = false,
		specifyVersion = "",
		forceReinstall = false,
		enableAfterInstall = this.plugin.settings.enableAfterInstall,
		privateApiKey = "",
	): Promise<boolean> {
		try {
			if (this.plugin.settings.debuggingMode) {
				console.log(
					"BRAT: addPlugin",
					repositoryPath,
					updatePluginFiles,
					seeIfUpdatedOnly,
					reportIfNotUpdted,
					specifyVersion,
					forceReinstall,
					enableAfterInstall,
					privateApiKey ? "private" : "public",
				);
			}

			const noticeTimeout = 10;
			// attempt to get manifest-beta.json
			let primaryManifest = await this.validateRepository(
				repositoryPath,
				true,
				true,
				specifyVersion,
				privateApiKey,
			);
			const usingBetaManifest: boolean = !!primaryManifest;
			// attempt to get manifest.json
			if (!usingBetaManifest)
				primaryManifest = await this.validateRepository(
					repositoryPath,
					false,
					true,
					specifyVersion,
					privateApiKey,
				);

			if (primaryManifest === null) {
				const msg = `${repositoryPath}\nA manifest.json file does not exist in the latest release of the repository. This plugin cannot be installed.`;
				await this.plugin.log(msg, true);
				toastMessage(this.plugin, msg, noticeTimeout);
				return false;
			}

			if (!Object.hasOwn(primaryManifest, "version")) {
				const msg = `${repositoryPath}\nThe manifest.json file in the latest release or pre-release of the repository does not have a version number in the file. This plugin cannot be installed.`;
				await this.plugin.log(msg, true);
				toastMessage(this.plugin, msg, noticeTimeout);
				return false;
			}

			let isIncompatible = false;

			// Check manifest minAppVersion and current version of Obisidan, don't load plugin if not compatible
			if (Object.hasOwn(primaryManifest, "minAppVersion")) {
				if (!requireApiVersion(primaryManifest.minAppVersion)) {
					if (
						specifyVersion === "" ||
						specifyVersion === "latest" ||
						!this.plugin.settings.allowIncompatiblePlugins
					) {
						const msg = `Plugin: ${repositoryPath}\n\nThe manifest.json for this plugin indicates that the Obsidian version of the app needs to be ${primaryManifest.minAppVersion}, but this installation of Obsidian is ${apiVersion}. \n\nYou will need to update your Obsidian to use this plugin or contact the plugin developer for more information.`;
						await this.plugin.log(msg, true);
						toastMessage(this.plugin, msg, 30);
						return false;
					}

					const confirmResult = await confirm({
						app: this.plugin.app,
						message: createFragment((f) => {
							f.appendText("Plugin: ");
							f.createEl("code", { text: repositoryPath });
							f.createEl("br");
							f.appendText("The ");
							f.createEl("code", { text: "manifest.json" });
							f.appendText(
								" for this plugin indicates that the Obsidian version of the app needs to be ",
							);
							f.createEl("code", { text: primaryManifest.minAppVersion });
							f.appendText(", but this installation of Obsidian is ");
							f.createEl("code", { text: apiVersion });
							f.appendText(".");
							f.createEl("br");
							f.appendText(
								"Using this plugin is not recommended and may not work as expected. Use at your own risk.",
							);
							f.createEl("br");
							f.appendText("Do you want to install it anyways?");
						}),
					});

					if (!confirmResult) {
						return false;
					}

					isIncompatible = true;
				}
			}

			// now the user must be able to access the repo

			interface ErrnoType {
				errno: number;
			}

			const getRelease = async () => {
				const rFiles = await this.getAllReleaseFiles(
					repositoryPath,
					primaryManifest,
					usingBetaManifest,
					specifyVersion,
					privateApiKey,
				);

				console.log("rFiles", rFiles);
				// if beta, use that manifest, or if there is no manifest in release, use the primaryManifest
				if (usingBetaManifest || rFiles.manifest === "")
					rFiles.manifest = JSON.stringify(primaryManifest);
				if (usingBetaManifest || rFiles.manifest === "")
					rFiles.manifest = JSON.stringify(primaryManifest);

				const manifestObj = JSON.parse(
					rFiles.manifest ?? "",
				) as PluginManifestEx;

				if (isIncompatible) {
					manifestObj.brat = {
						isIncompatible: true,
						minAppVersionOriginal: manifestObj.minAppVersion,
					};
					manifestObj.minAppVersion = apiVersion;
				}

				if (
					this.plugin.settings.allowIncompatiblePlugins &&
					Platform.isMobile &&
					manifestObj.isDesktopOnly
				) {
					manifestObj.isDesktopOnly = false;
					manifestObj.brat ??= {};
					manifestObj.brat.isDesktopOnlyOriginal = true;
					manifestObj.brat.isIncompatible = true;
					isIncompatible = true;
				}

				if (isIncompatible) {
					rFiles.manifest = JSON.stringify(manifestObj);
				}

				if (this.plugin.settings.debuggingMode)
					console.log("BRAT: rFiles.manifest", usingBetaManifest, rFiles);

				if (rFiles.mainJs === null) {
					const msg = `${repositoryPath}\nThe release is not complete and cannot be download. main.js is missing from the Release`;
					await this.plugin.log(msg, true);
					toastMessage(this.plugin, msg, noticeTimeout);
					return null;
				}
				return rFiles;
			};

			if (!updatePluginFiles || forceReinstall) {
				const releaseFiles = await getRelease();
				if (releaseFiles === null) return false;
				await this.writeReleaseFilesToPluginFolder(
					primaryManifest.id,
					releaseFiles,
				);
				addBetaPluginToList(
					this.plugin,
					repositoryPath,
					specifyVersion,
					privateApiKey,
					isIncompatible,
				);
				if (enableAfterInstall) {
					// @ts-expect-error
					const { plugins } = this.plugin.app;
					const pluginTargetFolderPath = normalizePath(
						`${plugins.getPluginFolder()}/${primaryManifest.id}`,
					);
					await plugins.loadManifest(pluginTargetFolderPath);
					await plugins.enablePluginAndSave(primaryManifest.id);
				}
				// @ts-expect-error
				await this.plugin.app.plugins.loadManifests();
				if (forceReinstall) {
					// reload if enabled
					await this.reloadPlugin(primaryManifest.id);
					await this.plugin.log(`${repositoryPath} reinstalled`, true);
					toastMessage(
						this.plugin,
						`${repositoryPath}\nPlugin has been reinstalled and reloaded with version ${primaryManifest.version}`,
						noticeTimeout,
					);
				} else {
					const versionText =
						specifyVersion === "" ? "" : ` (version: ${specifyVersion})`;
					let msg = `${repositoryPath}${versionText}\nThe plugin has been registered with BRAT.`;
					if (!enableAfterInstall) {
						msg +=
							" You may still need to enable it the Community Plugin List.";
					}
					await this.plugin.log(msg, true);
					toastMessage(this.plugin, msg, noticeTimeout);
				}
			} else {
				// test if the plugin needs to be updated
				// if a specified version is provided, then we shall skip the update
				const pluginTargetFolderPath = `${this.plugin.app.vault.configDir}/plugins/${primaryManifest.id}/`;
				let localManifestContents = "";
				try {
					localManifestContents = await this.plugin.app.vault.adapter.read(
						`${pluginTargetFolderPath}manifest.json`,
					);
				} catch (e) {
					if (
						(e as ErrnoType).errno === -4058 ||
						(e as ErrnoType).errno === -2
					) {
						// file does not exist, try installing the plugin
						await this.addPlugin(
							repositoryPath,
							false,
							usingBetaManifest,
							false,
							specifyVersion,
							false,
							enableAfterInstall,
							privateApiKey,
						);
						// even though failed, return true since install will be attempted
						return true;
					}
					console.log(
						"BRAT - Local Manifest Load",
						primaryManifest.id,
						JSON.stringify(e, null, 2),
					);
				}

				if (specifyVersion !== "" && specifyVersion !== "latest") {
					// skip the frozen version plugin
					toastMessage(
						this.plugin,
						`The version of ${repositoryPath} is frozen, not updating.`,
						3,
					);
					return false;
				}

				const localManifestJson = (await JSON.parse(
					localManifestContents,
				)) as PluginManifest;
				// FIX for issue #105: Not all developers use semver compliant version tags
				const localVersion = semverCoerce(localManifestJson.version, {
					includePrerelease: true,
					loose: true,
				});
				const remoteVersion = semverCoerce(primaryManifest.version, {
					includePrerelease: true,
					loose: true,
				});
				if (compareVersions(localVersion, remoteVersion) === -1) {
					// Remote version is higher, update
					const releaseFiles = await getRelease();
					if (releaseFiles === null) return false;

					if (seeIfUpdatedOnly) {
						// dont update, just report it
						const msg = `There is an update available for ${primaryManifest.id} from version ${localManifestJson.version} to ${primaryManifest.version}. `;
						await this.plugin.log(
							`${msg}[Release Info](https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version})`,
							true,
						);
						toastMessage(this.plugin, msg, 30, () => {
							if (primaryManifest) {
								window.open(
									`https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version}`,
								);
							}
						});
						return false;
					}
					await this.writeReleaseFilesToPluginFolder(
						primaryManifest.id,
						releaseFiles,
					);
					// @ts-expect-error
					await this.plugin.app.plugins.loadManifests();
					await this.reloadPlugin(primaryManifest.id);
					const msg = `${primaryManifest.id}\nPlugin has been updated from version ${localManifestJson.version} to ${primaryManifest.version}. `;
					await this.plugin.log(
						`${msg}[Release Info](https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version})`,
						true,
					);
					toastMessage(this.plugin, msg, 30, () => {
						if (primaryManifest) {
							window.open(
								`https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version}`,
							);
						}
					});
					return true;
				}

				if (reportIfNotUpdted) {
					toastMessage(
						this.plugin,
						`No update available for ${repositoryPath}`,
						3,
					);
				}
				return true;
			}
		} catch (error) {
			// Log the error with context
			console.error(`BRAT: Error adding plugin ${repositoryPath}:`, {
				error,
				updatePluginFiles,
				seeIfUpdatedOnly,
				specifyVersion,
				forceReinstall,
			});

			// Show user-friendly error message
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			// Log to BRAT's logging system
			await this.plugin.log(
				`Error ${updatePluginFiles ? "updating" : "adding"} plugin ${repositoryPath}: ${errorMessage}`,
				true,
			);

			return false;
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
		// @ts-expect-error
		const { plugins } = this.plugin.app;
		try {
			await plugins.disablePlugin(pluginName);
			await plugins.enablePlugin(pluginName);
		} catch (e) {
			if (this.plugin.settings.debuggingMode) console.log("reload plugin", e);
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
		forceReinstall = false,
		privateApiKey = "",
	): Promise<boolean> {
		const result = await this.addPlugin(
			repositoryPath,
			true,
			onlyCheckDontUpdate,
			reportIfNotUpdted,
			"",
			forceReinstall,
			false,
			privateApiKey,
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
		onlyCheckDontUpdate = false,
	): Promise<void> {
		if (!(await isConnectedToInternet())) {
			console.log("BRAT: No internet detected.");
			return;
		}
		let newNotice: Notice | undefined;
		const msg1 = "Checking for plugin updates STARTED";
		await this.plugin.log(msg1, true);
		if (showInfo && this.plugin.settings.notificationsEnabled)
			newNotice = new Notice(`BRAT\n${msg1}`, 30000);
		// Create a map of repo to version for frozen plugins
		const frozenVersions = new Map(
			this.plugin.settings.pluginSubListFrozenVersion.map((f) => [
				f.repo,
				{ version: f.version, token: f.token },
			]),
		);
		for (const bp of this.plugin.settings.pluginList) {
			// Skip if repo is frozen and not set to "latest"
			if (
				frozenVersions.has(bp) &&
				frozenVersions.get(bp)?.version !== "latest"
			) {
				continue;
			}
			await this.updatePlugin(
				bp,
				onlyCheckDontUpdate,
				false,
				false,
				frozenVersions.get(bp)?.token,
			);
		}
		const msg2 = "Checking for plugin updates COMPLETED";
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
			(b) => b !== repositoryPath,
		);
		this.plugin.settings.pluginSubListFrozenVersion =
			this.plugin.settings.pluginSubListFrozenVersion.filter(
				(b) => b.repo !== repositoryPath,
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
		// @ts-expect-error
		const pl = this.plugin.app.plugins;
		const manifests: PluginManifest[] = Object.values(pl.manifests);
		const enabledPlugins: PluginManifest[] = Object.values(pl.plugins).map(
			// @ts-expect-error
			(p) => p.manifest,
		);
		return enabled
			? manifests.filter((manifest) =>
					enabledPlugins.find((pluginName) => manifest.id === pluginName.id),
				)
			: manifests.filter(
					(manifest) =>
						!enabledPlugins.find((pluginName) => manifest.id === pluginName.id),
				);
	}

	async checkIncompatiblePlugins(): Promise<void> {
		const incompatiblePluginIds =
			this.plugin.settings.pluginSubListFrozenVersion
				.filter((p) => p.isIncompatible)
				.map((p) => p.repo);
		toastMessage(
			this.plugin,
			`The following incompatible plugins were forcefully installed by BRAT and may not work as expected:\n${incompatiblePluginIds.join("\n")}`,
			30,
		);
	}
}
