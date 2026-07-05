import type { LocaleStrings } from "./en";

export const zhCn = {
	common: {
		and: " 和 ",
		promotional: {
			learnMore: "了解作者的更多作品：",
		},
	},
	settings: {
		general: {
			heading: "常规",
			autoEnablePluginsAfterInstallation: {
				name: "安装后自动启用 Beta 插件",
				desc: "开启后，新安装的 Beta 插件会默认自动启用。你仍然可以在“添加插件”表单中为单个插件单独调整。",
			},
			autoUpdatePluginsAtStartup: {
				name: "启动时自动更新 Beta 插件",
				desc: "开启后，每次 Obsidian 启动时都会检查并安装 Beta 插件更新。固定版本不会自动更新。",
			},
			autoUpdateThemesAtStartup: {
				name: "启动时自动更新 Beta 主题",
				desc: "开启后，每次 Obsidian 启动时都会检查并安装 Beta 主题更新。",
			},
			selectLatestPluginVersionByDefault: {
				name: "默认选择插件最新版本",
				desc: "开启后，添加新插件时会默认选择最新版本。",
			},
			allowIncompatiblePlugins: {
				name: "允许安装不兼容插件",
				desc: "开启后，可以安装要求更高 Obsidian 版本的插件，也可以在移动端安装仅支持桌面端的插件。",
			},
		},
		monitoring: {
			heading: "通知与日志",
			enableNotifications: {
				name: "启用通知",
				desc: "开启后，BRAT 会用弹窗提示安装、更新等操作状态。关闭后不再显示这些通知。",
			},
			enableLogging: {
				name: "启用日志",
				desc: "开启后，插件更新记录会写入日志文件。",
			},
			bratLogFileLocation: {
				name: "BRAT 日志文件",
				desc: "日志会保存到这个文件。填写文件名或库内路径时不要加 .md。",
				placeholder: "示例：BRAT-log",
			},
			enableVerboseLogging: {
				name: "启用详细日志",
				desc: "开启后，日志会记录更多排查信息。",
			},
			debuggingMode: {
				name: "调试模式",
				desc: "开启后，控制台会输出大量调试信息，主要用于排查问题和开发。",
			},
		},
		githubPersonalAccessToken: {
			heading: "GitHub 个人访问令牌",
			personalAccessToken: {
				name: "个人访问令牌",
				desc: {
					prependText: "设置个人访问令牌可以提高访问 GitHub 公共仓库时的请求额度。你可以在 ",
					linkText: "GitHub 令牌设置",
					appendText: " 中创建令牌，然后在这里选择保存该令牌的密钥。更多信息请参考文档。",
				},
			},
			clearPersonalAccessToken: "清除个人访问令牌设置",
			validate: "验证",
		},
		betaPluginList: {
			heading: "Beta 插件列表",
			filterPlaceholder: "筛选插件",
			emptyState: "尚未添加测试插件。",
			description: {
				intro:
					"下方列出已通过 BRAT 添加的 Beta 插件。你可以让插件跟随最新版本，也可以固定到某个发布版本。固定版本指基于 release 标签指定的某个插件版本。",
				editAndRemove: "点击插件旁的编辑按钮可以更改安装版本；点击 X 按钮会将它从列表中移除。",
				noteLabel: "注意：",
				noteText: "从列表中移除不会删除插件本体。如需删除插件，请到设置中的“第三方插件”页面操作。",
			},
			addBetaPlugin: "添加 Beta 插件",
			trackedVersion: (version: string, frozen: boolean): string =>
				`跟踪版本：${version === "latest" ? "最新版本" : version}${frozen ? "（固定）" : ""}`,
			incompatible: "（不兼容）",
			secretMissing: (secretName: string): string => `密钥未定义或为空：${secretName}`,
			secretMissingTitle: "已配置密钥名称，但密钥不存在或为空。请添加密钥，或更新该插件配置。",
			secretMissingTooltip: (secretName: string): string => `密钥缺失：${secretName}。请添加密钥，或更新该插件配置。`,
			checkAndUpdatePlugin: "检查并更新插件",
			changeVersionAndUpdateSettings: "更改版本和设置",
			removeThisBetaPlugin: "移除此 Beta 插件",
			confirmRemoval: "再次点击确认移除",
			copyPluginIdentifier: "复制插件标识符",
		},
		betaThemeList: {
			heading: "Beta 主题列表",
			addBetaTheme: "添加 Beta 主题",
			filterPlaceholder: "筛选主题",
			emptyState: "尚未添加测试主题。",
			deleteThisBetaTheme: "删除此 Beta 主题",
			confirmRemoval: "再次点击确认移除",
			copyThemeIdentifier: "复制主题标识符",
		},
		copyIdentifier: {
			copied: (identifier: string): string => `已复制：${identifier}`,
			failed: "复制标识符失败，请检查剪贴板权限。",
		},
	},
	addBetaPluginModal: {
		buttons: {
			addPlugin: "添加插件",
			changeVersion: "更改版本",
			installing: "正在安装…",
			neverMind: "取消",
			valid: "有效",
			invalid: "无效",
		},
		heading: {
			changePluginVersion: "更改插件版本：",
			githubRepositoryForBetaPlugin: "Beta 插件的 GitHub 仓库：",
		},
		repository: {
			label: "仓库",
			placeholder: "仓库（示例：https://GitHub.com/githubusername/repository-name）",
			pasteTooltip: "从剪贴板粘贴",
			enterAddressToValidate: "输入 GitHub 仓库地址后会自动验证。",
			addressRequired: "需要填写仓库地址。",
			validating: "正在验证仓库地址...",
			noReleasesFound: "错误：此仓库中没有找到发布版本。",
			notFound: "找不到仓库。请检查地址，或提供可访问私有仓库的有效令牌。",
			accessDenied: "访问被拒绝。请检查个人访问令牌。",
			error: (message: string): string => `错误：${message}`,
			rateLimitExceeded: (minutes: number): string => `GitHub API 请求额度已用尽。请在 ${minutes} 分钟后重试。`,
			rateLimitToast: (): string => "GitHub API 请求额度已用尽。可以在 BRAT 设置中添加个人访问令牌以提高额度。详情请查看文档。",
			gitHubResponseToast: (message: string): string => `${message} `,
		},
		version: {
			selectVersion: "选择版本",
			selectVersionEllipsis: "选择版本...",
			latestVersion: "最新版本",
			prereleaseSuffix: "（预发布）",
			useLatestName: "始终使用最新版本",
			useLatestDesc: "让此插件保持最新发布版本并自动更新。关闭后可从列表中固定某个特定版本。",
		},
		token: {
			name: "GitHub 令牌",
			desc: "使用“Link…”按钮，将已保存的密钥关联为此仓库的 GitHub 令牌（可选）。",
			settingCleared: (repository: string): string => `已清除 ${repository} 的令牌设置`,
			settingUpdated: (repository: string): string => `已更新 ${repository} 的令牌设置`,
		},
		enableAfterInstall: "安装后启用此插件",
		alreadyInList: "这个插件已经在 Beta 测试列表中",
	},
	addBetaThemeModal: {
		heading: {
			githubRepositoryForBetaTheme: "Beta 主题的 GitHub 仓库：",
		},
		alreadyInList: "这个主题已经在 Beta 测试列表中",
	},
	themeMessages: {
		noThemeCssFile: "这个仓库的根目录里没有 theme.css 或 theme-beta.css 文件，因此没有可安装的主题。",
		noManifestFile: "这个仓库的根目录里没有 manifest.json 文件，因此无法安装该主题。",
		unsafeThemeName: (repository: string, themeName: string): string =>
			`${repository}：主题 manifest 声明了不安全的名称（“${themeName}”），因此无法安装此主题。`,
		installed: (themeName: string, repository: string): string => `已从 ${repository} 安装主题 ${themeName}。`,
		updated: (themeName: string, repository: string): string => `已从 ${repository} 更新主题 ${themeName}。`,
		removed: (repository: string): string =>
			`已将 ${repository} 从 BRAT 主题列表中移除，之后不会再检查更新。不过主题文件仍然保留在库中。如需删除，请前往“设置 > 外观”中移除该主题。`,
	},
	versionSuggestModal: {
		title: "选择版本",
		placeholder: (repository: string): string => `输入关键词，搜索 ${repository} 的版本`,
		versionLabel: (version: string): string => (version === "latest" ? "最新版本" : version),
		instructions: {
			navigateVersions: "浏览版本",
			selectVersion: "选择版本",
			dismissModal: "关闭弹窗",
		},
		prereleaseSuffix: "（预发布）",
	},
} satisfies LocaleStrings;
