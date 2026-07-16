import type { LocaleStrings } from "./en";

export const ja = {
	common: {
		and: " と ",
		promotional: {
			learnMore: "作者の他の作品を見る：",
		},
	},
	settings: {
		general: {
			heading: "一般",
			autoEnablePluginsAfterInstallation: {
				name: "インストール後に Beta プラグインを自動で有効化",
				desc: "有効にすると、新しくインストールした Beta プラグインは既定で自動的に有効になります。個別のプラグインについては「プラグインを追加」フォームで切り替えられます。",
			},
			autoUpdatePluginsAtStartup: {
				name: "起動時に Beta プラグインを自動更新",
				desc: "有効にすると、Obsidian の起動時にすべての Beta プラグインの更新を確認します。固定バージョンのプラグインは更新されません。",
			},
			autoUpdateThemesAtStartup: {
				name: "起動時に Beta テーマを自動更新",
				desc: "有効にすると、Obsidian の起動時にすべての Beta テーマの更新を確認します。",
			},
			selectLatestPluginVersionByDefault: {
				name: "既定で最新のプラグインバージョンを選択",
				desc: "有効にすると、新しいプラグインを追加するときに最新バージョンが既定で選択されます。",
			},
			allowIncompatiblePlugins: {
				name: "互換性のないプラグインを許可",
				desc: "有効にすると、より新しい Obsidian バージョンを必要とするプラグインをインストールできます。また、デスクトップ専用プラグインをモバイル端末にインストールすることも許可されます。",
			},
		},
		monitoring: {
			heading: "監視",
			enableNotifications: {
				name: "通知を有効化",
				desc: "有効にすると、BRAT は各種アクティビティについてポップアップ通知を表示します。オフにすると通知は表示されません。",
			},
			enableLogging: {
				name: "ログを有効化",
				desc: "プラグインの更新はログファイルに記録されます。",
			},
			bratLogFileLocation: {
				name: "BRAT ログファイルの場所",
				desc: "ログはこのファイルに保存されます。ファイル名に .md は追加しないでください。",
				placeholder: "例：BRAT-log",
			},
			enableVerboseLogging: {
				name: "詳細ログを有効化",
				desc: "ログにより多くの情報を記録します。",
			},
			debuggingMode: {
				name: "デバッグモード",
				desc: "非常に詳細なコンソールログを出力します。トラブルシューティングや開発に使用できます。",
			},
		},
		githubPersonalAccessToken: {
			heading: "GitHub 個人アクセストークン",
			personalAccessToken: {
				name: "個人アクセストークン",
				desc: {
					prependText: "個人アクセストークンを設定すると、GitHub の公開リポジトリに対するレート制限を緩和できます。トークンは ",
					linkText: "GitHub アカウント設定",
					appendText: " で作成し、ここに追加できます。詳しくはドキュメントを参照してください。",
				},
			},
			clearPersonalAccessToken: "個人アクセストークンをクリア",
			validate: "検証",
		},
		betaPluginList: {
			heading: "Beta プラグイン一覧",
			filterPlaceholder: "プラグインを絞り込み",
			emptyState: "ベータプラグインはまだ追加されていません。",
			description: {
				intro:
					'以下は、"add a beta plugin for testing" コマンドで追加された Beta プラグインの一覧です。最新バージョンを使うことも、特定のバージョンに固定することもできます。固定バージョンとは、リリースタグに基づく特定のプラグインリリースです。',
				editAndRemove:
					"プラグイン横の「編集」ボタンをクリックすると、インストールするバージョンを変更できます。プラグイン横の「X」ボタンをクリックすると、一覧から削除できます。",
				noteLabel: "注意：",
				noteText: "一覧から削除してもプラグイン本体は削除されません。削除するには、設定のコミュニティプラグインタブから操作してください。",
			},
			addBetaPlugin: "Beta プラグインを追加",
			trackedVersion: (version: string, frozen: boolean): string =>
				` 追跡中のバージョン：${version === "latest" ? "最新バージョン" : version}${frozen ? "（固定）" : ""}`,
			incompatible: "（互換性なし）",
			secretMissing: (secretName: string): string => ` シークレットが未定義または空です：${secretName}`,
			secretMissingTitle:
				"トークン名は設定されていますが、シークレットが見つからないか空です。シークレットを追加するか、プラグイン設定を更新してください。",
			secretMissingTooltip: (secretName: string): string =>
				`シークレットが見つかりません：${secretName}。シークレットを追加するか、プラグイン設定を更新してください。`,
			checkAndUpdatePlugin: "プラグインを確認して更新",
			changeVersionAndUpdateSettings: "バージョンを変更して設定を更新",
			removeThisBetaPlugin: "この Beta プラグインを削除",
			confirmRemoval: "もう一度クリックして削除を確認",
			copyPluginIdentifier: "プラグイン識別子をコピー",
		},
		betaThemeList: {
			heading: "Beta テーマ一覧",
			addBetaTheme: "Beta テーマを追加",
			filterPlaceholder: "テーマを絞り込み",
			emptyState: "ベータテーマはまだ追加されていません。",
			deleteThisBetaTheme: "この Beta テーマを削除",
			confirmRemoval: "もう一度クリックして削除を確認",
			copyThemeIdentifier: "テーマ識別子をコピー",
		},
		copyIdentifier: {
			copied: (identifier: string): string => `コピーしました：${identifier}`,
			failed: "識別子のコピーに失敗しました。クリップボードの権限を確認してください。",
		},
	},
	addBetaPluginModal: {
		buttons: {
			addPlugin: "プラグインを追加",
			changeVersion: "バージョンを変更",
			installing: "インストール中…",
			neverMind: "キャンセル",
			valid: "有効",
			invalid: "無効",
		},
		heading: {
			changePluginVersion: "プラグインのバージョンを変更：",
			githubRepositoryForBetaPlugin: "Beta プラグインの GitHub リポジトリ：",
		},
		repository: {
			label: "リポジトリ",
			placeholder: "リポジトリ（例：https://GitHub.com/githubusername/repository-name）",
			pasteTooltip: "クリップボードから貼り付け",
			enterAddressToValidate: "検証する GitHub リポジトリアドレスを入力してください。",
			addressRequired: "リポジトリアドレスが必要です。",
			validating: "リポジトリアドレスを検証中...",
			noReleasesFound: "エラー：このリポジトリにリリースが見つかりません。",
			notFound:
				"リポジトリが見つかりません。アドレスを確認するか、プライベートリポジトリにアクセスできる有効なトークンを指定してください。",
			accessDenied: "アクセスが拒否されました。個人アクセストークンを確認してください。",
			error: (message: string): string => `エラー：${message}`,
			rateLimitExceeded: (minutes: number): string => `GitHub API のレート制限を超過しました。${minutes} 分後にもう一度お試しください。`,
			rateLimitToast: (message: string): string =>
				`${message} BRAT 設定で個人アクセストークンを追加すると、より高い制限を利用できます。詳しくはドキュメントを参照してください。`,
			gitHubResponseToast: (message: string): string => `${message} `,
		},
		version: {
			selectVersion: "バージョンを選択",
			selectVersionEllipsis: "バージョンを選択...",
			latestVersion: "最新バージョン",
			prereleaseSuffix: "（プレリリース）",
			useLatestName: "常に最新バージョンを使用",
			useLatestDesc: "このプラグインを最新リリースに保ち、自動的に更新します。オフにすると、一覧から特定のバージョンを固定できます。",
		},
		token: {
			name: "GitHub トークン",
			desc: "「Link…」ボタンから、このリポジトリの GitHub トークンとして使う保存済みシークレットをリンクします（任意）。",
			settingCleared: (repository: string): string => `${repository} のトークン設定をクリアしました`,
			settingUpdated: (repository: string): string => `${repository} のトークン設定を更新しました`,
		},
		enableAfterInstall: "インストール後にプラグインを有効化",
		alreadyInList: "このプラグインはすでに Beta テスト一覧にあります",
	},
	addBetaThemeModal: {
		heading: {
			githubRepositoryForBetaTheme: "Beta テーマの GitHub リポジトリ：",
		},
		alreadyInList: "このテーマはすでに Beta テスト一覧にあります",
	},
	themeMessages: {
		noThemeCssFile: "このリポジトリのルートパスには theme.css または theme-beta.css がないため、インストールできるテーマがありません。",
		noManifestFile: "このリポジトリのルートパスには manifest.json がないため、テーマをインストールできません。",
		unsafeThemeName: (repository: string, themeName: string): string =>
			`${repository}: テーマの manifest に安全でない名前（「${themeName}」）が指定されているため、このテーマはインストールできません。`,
		installed: (themeName: string, repository: string): string => `${repository} からテーマ ${themeName} をインストールしました。`,
		updated: (themeName: string, repository: string): string => `${repository} からテーマ ${themeName} を更新しました。`,
		removed: (repository: string): string =>
			`${repository} を BRAT のテーマ一覧から削除したため、今後は更新されません。ただし、テーマファイル自体は Vault に残ります。削除するには、設定 > 外観 からテーマを削除してください。`,
	},
	versionSuggestModal: {
		title: "バージョンを選択",
		placeholder: (repository: string): string => `${repository} のバージョンを検索`,
		versionLabel: (version: string): string => (version === "latest" ? "最新バージョン" : version),
		instructions: {
			navigateVersions: "バージョンを移動",
			selectVersion: "バージョンを選択",
			dismissModal: "モーダルを閉じる",
		},
		prereleaseSuffix: "（プレリリース）",
	},
} satisfies LocaleStrings;
