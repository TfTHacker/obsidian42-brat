export const en = {
	common: {
		and: " and ",
		promotional: {
			learnMore: "Learn more about my work at:",
		},
	},
	settings: {
		general: {
			autoEnablePluginsAfterInstallation: {
				name: "Auto-enable plugins after installation",
				desc: 'If enabled beta plugins will be automatically enabled after installtion by default. Note: you can toggle this on and off for each plugin in the "add plugin" form.',
			},
			autoUpdatePluginsAtStartup: {
				name: "Auto-update plugins at startup",
				desc: "If enabled all beta plugins will be checked for updates each time Obsidian starts. Note: this does not update frozen version plugins.",
			},
			autoUpdateThemesAtStartup: {
				name: "Auto-update themes at startup",
				desc: "If enabled all beta themes will be checked for updates each time Obsidian starts.",
			},
			selectLatestPluginVersionByDefault: {
				name: "Select latest plugin version by default",
				desc: "If enabled the latest version will be selected by default when adding a new plugin.",
			},
			allowIncompatiblePlugins: {
				name: "Allow incompatible plugins",
				desc: "If enabled, plugins with higher app versions will be allowed to be installed. Also it allows desktop-only plugins to be installed on mobile devices.",
			},
		},
		monitoring: {
			heading: "Monitoring",
			enableNotifications: {
				name: "Enable notifications",
				desc: "BRAT will provide popup notifications for its various activities. Turn this off means no notifications.",
			},
			enableLogging: {
				name: "Enable logging",
				desc: "Plugin updates will be logged to a file in the log file.",
			},
			bratLogFileLocation: {
				name: "BRAT log file location",
				desc: "Logs will be saved to this file. Don't add .md to the file name.",
				placeholder: "Example: BRAT-log",
			},
			enableVerboseLogging: {
				name: "Enable verbose logging",
				desc: "Get a lot  more information in  the log.",
			},
			debuggingMode: {
				name: "Debugging mode",
				desc: "Atomic bomb level console logging. Can be used for troubleshooting and development.",
			},
		},
		githubPersonalAccessToken: {
			heading: "GitHub Personal Access Token",
			personalAccessToken: {
				name: "Personal access token",
				desc: {
					prependText:
						"Set a personal access token to increase rate limits for public repositories on GitHub. You can create one in ",
					linkText: "your GitHub account settings",
					appendText:
						" and then add it here. Please consult the documentation for more details.",
				},
			},
			clearPersonalAccessToken: "Clear personal access token",
			validate: "Validate",
		},
		betaPluginList: {
			heading: "Beta plugin list",
			filterPlaceholder: "Filter plugins",
			description: {
				intro:
					'The following is a list of beta plugins added via the command "add a beta plugin for testing". You can chose to add the latest version or a frozen version. A frozen version is a specific release of a plugin based on its release tag.',
				editAndRemove:
					'Click the "edit" button next to a plugin to change the installed version. Click the "X" button next to a plugin to remove it from the list.',
				noteLabel: "Note: ",
				noteText:
					"Removing from the list does not delete the plugin, this should be done from the Community Plugins tab in Settings.",
			},
			addBetaPlugin: "Add beta plugin",
			trackedVersion: (version: string, frozen: boolean): string =>
				` Tracked version: ${version} ${frozen ? "(frozen)" : ""}`,
			incompatible: " (incompatible)",
			secretMissing: (secretName: string): string =>
				` Secret not defined or empty: ${secretName}`,
			secretMissingTitle:
				"Token name configured but secret is missing. Add the secret or update the plugin configuration.",
			secretMissingTooltip: (secretName: string): string =>
				`Secret missing: ${secretName}. Please add the secret or update the plugin configuration.`,
			checkAndUpdatePlugin: "Check and update plugin",
			changeVersionAndUpdateSettings: "Change version and update settings",
			removeThisBetaPlugin: "Remove this beta plugin",
			confirmRemoval: "Click once more to confirm removal",
			copyPluginIdentifier: "Copy plugin identifier",
		},
		betaThemeList: {
			heading: "Beta themes list",
			addBetaTheme: "Add beta theme",
			filterPlaceholder: "Filter themes",
			deleteThisBetaTheme: "Delete this beta theme",
			confirmRemoval: "Click once more to confirm removal",
			copyThemeIdentifier: "Copy theme identifier",
		},
		copyIdentifier: {
			copied: (identifier: string): string => `Copied: ${identifier}`,
			failed: "Failed to copy identifier. Check clipboard permissions.",
		},
	},
	addBetaPluginModal: {
		buttons: {
			addPlugin: "Add plugin",
			changeVersion: "Change version",
			installing: "Installing …",
			neverMind: "Never mind",
			valid: "Valid",
			invalid: "Invalid",
		},
		heading: {
			changePluginVersion: "Change plugin version: ",
			githubRepositoryForBetaPlugin: "GitHub repository for beta plugin:",
		},
		repository: {
			label: "Repository",
			placeholder:
				"Repository (example: https://GitHub.com/githubusername/repository-name)",
			enterAddressToValidate:
				"Enter a GitHub repository address to validate it.",
			addressRequired: "Repository address is required.",
			validating: "Validating repository address...",
			noReleasesFound: "Error: No releases found in this repository.",
			notFound:
				"Repository not found. Check the address or provide a valid token for access to a private repository.",
			accessDenied: "Access denied. Check your personal access token.",
			error: (message: string): string => `Error: ${message}`,
			rateLimitExceeded: (minutes: number): string =>
				`GitHub API rate limit exceeded. Try again in ${minutes} minutes.`,
			rateLimitToast: (message: string): string =>
				`${message} Consider adding a personal access token in BRAT settings for higher limits. See documentation for details.`,
			gitHubResponseToast: (message: string): string => `${message} `,
		},
		version: {
			selectVersion: "Select a version",
			selectVersionEllipsis: "Select a version...",
			latestVersion: "Latest version",
			prereleaseSuffix: "(Prerelease)",
		},
		token: {
			name: "GitHub token",
			desc: "Select a secret as token for this repository (optional)",
			settingCleared: (repository: string): string =>
				`Token setting cleared for ${repository}`,
			settingUpdated: (repository: string): string =>
				`Token setting updated for ${repository}`,
		},
		enableAfterInstall: "Enable after installing the plugin",
		alreadyInList: "This plugin is already in the list for beta testing",
	},
	versionSuggestModal: {
		title: "Select a version",
		placeholder: (repository: string): string =>
			`Type to search for a version for ${repository}`,
		versionLabel: (version: string): string => version,
		instructions: {
			navigateVersions: "Navigate versions",
			selectVersion: "Select version",
			dismissModal: "Dismiss modal",
		},
		prereleaseSuffix: "(Prerelease)",
	},
};

export type LocaleStrings = typeof en;
