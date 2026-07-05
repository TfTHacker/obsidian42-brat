import type { LocaleStrings } from "./en";

export const de = {
	common: {
		and: " und ",
		promotional: {
			learnMore: "Mehr über meine Arbeit:",
		},
	},
	settings: {
		general: {
			heading: "Allgemein",
			autoEnablePluginsAfterInstallation: {
				name: "Beta-Plugins nach der Installation automatisch aktivieren",
				desc: "Wenn aktiviert, werden neu installierte Beta-Plugins standardmäßig automatisch aktiviert. Diese Option kann im Formular zum Hinzufügen eines Plugins pro Plugin angepasst werden.",
			},
			autoUpdatePluginsAtStartup: {
				name: "Beta-Plugins beim Start automatisch aktualisieren",
				desc: "Wenn aktiviert, prüft BRAT bei jedem Start von Obsidian alle Beta-Plugins auf Updates. Plugins mit fixierter Version werden nicht aktualisiert.",
			},
			autoUpdateThemesAtStartup: {
				name: "Beta-Themes beim Start automatisch aktualisieren",
				desc: "Wenn aktiviert, prüft BRAT bei jedem Start von Obsidian alle Beta-Themes auf Updates.",
			},
			selectLatestPluginVersionByDefault: {
				name: "Neueste Plugin-Version standardmäßig auswählen",
				desc: "Wenn aktiviert, wird beim Hinzufügen eines neuen Plugins standardmäßig die neueste Version ausgewählt.",
			},
			allowIncompatiblePlugins: {
				name: "Inkompatible Plugins erlauben",
				desc: "Wenn aktiviert, können Plugins installiert werden, die eine höhere Obsidian-Version voraussetzen. Außerdem können Desktop-only-Plugins auf Mobilgeräten installiert werden.",
			},
		},
		monitoring: {
			heading: "Überwachung",
			enableNotifications: {
				name: "Benachrichtigungen aktivieren",
				desc: "Wenn aktiviert, zeigt BRAT Popup-Benachrichtigungen zu verschiedenen Aktivitäten an. Wenn deaktiviert, werden keine Benachrichtigungen angezeigt.",
			},
			enableLogging: {
				name: "Protokollierung aktivieren",
				desc: "Plugin-Updates werden in eine Protokolldatei geschrieben.",
			},
			bratLogFileLocation: {
				name: "Speicherort der BRAT-Protokolldatei",
				desc: "Protokolle werden in dieser Datei gespeichert. Füge dem Dateinamen kein .md hinzu.",
				placeholder: "Beispiel: BRAT-log",
			},
			enableVerboseLogging: {
				name: "Ausführliche Protokollierung aktivieren",
				desc: "Schreibt deutlich mehr Informationen in das Protokoll.",
			},
			debuggingMode: {
				name: "Debug-Modus",
				desc: "Sehr ausführliche Konsolenprotokollierung. Kann zur Fehlerbehebung und Entwicklung verwendet werden.",
			},
		},
		githubPersonalAccessToken: {
			heading: "GitHub Personal Access Token",
			personalAccessToken: {
				name: "Persönliches Zugriffstoken",
				desc: {
					prependText:
						"Lege ein persönliches Zugriffstoken fest, um die Rate Limits für öffentliche GitHub-Repositorys zu erhöhen. Du kannst es in ",
					linkText: "deinen GitHub-Kontoeinstellungen",
					appendText: " erstellen und anschließend hier hinzufügen. Weitere Informationen findest du in der Dokumentation.",
				},
			},
			clearPersonalAccessToken: "Persönliches Zugriffstoken löschen",
			validate: "Validieren",
		},
		betaPluginList: {
			heading: "Beta-Plugin-Liste",
			filterPlaceholder: "Plugins filtern",
			emptyState: "Noch keine Beta-Plugins hinzugefügt.",
			description: {
				intro:
					'Dies ist die Liste der Beta-Plugins, die über den Befehl "add a beta plugin for testing" hinzugefügt wurden. Du kannst die neueste Version verwenden oder eine Version fixieren. Eine fixierte Version ist ein bestimmtes Plugin-Release anhand seines Release-Tags.',
				editAndRemove:
					'Klicke auf die Schaltfläche "Bearbeiten" neben einem Plugin, um die installierte Version zu ändern. Klicke auf die Schaltfläche "X" neben einem Plugin, um es aus der Liste zu entfernen.',
				noteLabel: "Hinweis: ",
				noteText:
					"Das Entfernen aus der Liste löscht das Plugin nicht. Das sollte über den Bereich Community-Plugins in den Einstellungen erfolgen.",
			},
			addBetaPlugin: "Beta-Plugin hinzufügen",
			trackedVersion: (version: string, frozen: boolean): string =>
				` Verfolgte Version: ${version === "latest" ? "neueste Version" : version} ${frozen ? "(fixiert)" : ""}`,
			incompatible: " (inkompatibel)",
			secretMissing: (secretName: string): string => ` Secret nicht definiert oder leer: ${secretName}`,
			secretMissingTitle:
				"Ein Token-Name ist konfiguriert, aber das Secret fehlt. Füge das Secret hinzu oder aktualisiere die Plugin-Konfiguration.",
			secretMissingTooltip: (secretName: string): string =>
				`Secret fehlt: ${secretName}. Bitte füge das Secret hinzu oder aktualisiere die Plugin-Konfiguration.`,
			checkAndUpdatePlugin: "Plugin prüfen und aktualisieren",
			changeVersionAndUpdateSettings: "Version ändern und Einstellungen aktualisieren",
			removeThisBetaPlugin: "Dieses Beta-Plugin entfernen",
			confirmRemoval: "Zum Bestätigen erneut klicken",
			copyPluginIdentifier: "Plugin-Kennung kopieren",
		},
		betaThemeList: {
			heading: "Beta-Theme-Liste",
			addBetaTheme: "Beta-Theme hinzufügen",
			filterPlaceholder: "Themes filtern",
			emptyState: "Noch keine Beta-Themes hinzugefügt.",
			deleteThisBetaTheme: "Dieses Beta-Theme löschen",
			confirmRemoval: "Zum Bestätigen erneut klicken",
			copyThemeIdentifier: "Theme-Kennung kopieren",
		},
		copyIdentifier: {
			copied: (identifier: string): string => `Kopiert: ${identifier}`,
			failed: "Kennung konnte nicht kopiert werden. Bitte prüfe die Clipboard-Berechtigungen.",
		},
	},
	addBetaPluginModal: {
		buttons: {
			addPlugin: "Plugin hinzufügen",
			changeVersion: "Version ändern",
			installing: "Wird installiert …",
			neverMind: "Abbrechen",
			valid: "Gültig",
			invalid: "Ungültig",
		},
		heading: {
			changePluginVersion: "Plugin-Version ändern: ",
			githubRepositoryForBetaPlugin: "GitHub-Repository für das Beta-Plugin:",
		},
		repository: {
			label: "Repository",
			placeholder: "Repository (Beispiel: https://GitHub.com/githubusername/repository-name)",
			pasteTooltip: "Aus Zwischenablage einfügen",
			enterAddressToValidate: "Gib eine GitHub-Repository-Adresse ein, um sie zu validieren.",
			addressRequired: "Repository-Adresse ist erforderlich.",
			validating: "Repository-Adresse wird validiert...",
			noReleasesFound: "Fehler: In diesem Repository wurden keine Releases gefunden.",
			notFound: "Repository nicht gefunden. Prüfe die Adresse oder gib ein gültiges Token für den Zugriff auf ein privates Repository an.",
			accessDenied: "Zugriff verweigert. Prüfe dein persönliches Zugriffstoken.",
			error: (message: string): string => `Fehler: ${message}`,
			rateLimitExceeded: (minutes: number): string => `GitHub API Rate Limit überschritten. Versuche es in ${minutes} Minuten erneut.`,
			rateLimitToast: (message: string): string =>
				`${message} Du kannst in den BRAT-Einstellungen ein persönliches Zugriffstoken hinzufügen, um höhere Limits zu erhalten. Siehe Dokumentation für Details.`,
			gitHubResponseToast: (message: string): string => `${message} `,
		},
		version: {
			selectVersion: "Version auswählen",
			selectVersionEllipsis: "Version auswählen...",
			latestVersion: "Neueste Version",
			prereleaseSuffix: "(Vorabversion)",
		},
		token: {
			name: "GitHub-Token",
			desc: "Wähle ein Secret als Token für dieses Repository aus (optional)",
			settingCleared: (repository: string): string => `Token-Einstellung für ${repository} gelöscht`,
			settingUpdated: (repository: string): string => `Token-Einstellung für ${repository} aktualisiert`,
		},
		enableAfterInstall: "Plugin nach der Installation aktivieren",
		alreadyInList: "Dieses Plugin ist bereits in der Beta-Testliste",
	},
	addBetaThemeModal: {
		heading: {
			githubRepositoryForBetaTheme: "GitHub-Repository für das Beta-Theme:",
		},
		alreadyInList: "Dieses Theme ist bereits in der Beta-Testliste",
	},
	themeMessages: {
		noThemeCssFile:
			"Im Stammverzeichnis dieses Repositorys gibt es keine Datei theme.css oder theme-beta.css, daher kann kein Theme installiert werden.",
		noManifestFile:
			"Im Stammverzeichnis dieses Repositorys gibt es keine Datei manifest.json, daher kann das Theme nicht installiert werden.",
		installed: (themeName: string, repository: string): string => `Theme ${themeName} wurde aus ${repository} installiert. `,
		updated: (themeName: string, repository: string): string => `Theme ${themeName} wurde aus ${repository} aktualisiert.`,
		removed: (repository: string): string =>
			`${repository} wurde aus der BRAT-Theme-Liste entfernt und wird nicht mehr aktualisiert. Die Theme-Dateien sind jedoch weiterhin im Vault vorhanden. Um sie zu entfernen, öffne Einstellungen > Erscheinungsbild und entferne das Theme dort.`,
	},
	versionSuggestModal: {
		title: "Version auswählen",
		placeholder: (repository: string): string => `Version für ${repository} suchen`,
		versionLabel: (version: string): string => (version === "latest" ? "Neueste Version" : version),
		instructions: {
			navigateVersions: "Versionen durchsuchen",
			selectVersion: "Version auswählen",
			dismissModal: "Dialog schließen",
		},
		prereleaseSuffix: "(Vorabversion)",
	},
} satisfies LocaleStrings;
