import type { PluginManifest } from "obsidian";
import { request } from "obsidian";

const GITHUB_RAW_USERCONTENT_PATH = "https://raw.githubusercontent.com/";

const isPrivateRepo = async (
	repository: string,
	debugLogging = true,
	personalAccessToken = "",
): Promise<boolean> => {
	const URL = `https://api.github.com/repos/${repository}`;
	try {
		const response = await request({
			url: URL,
			headers: personalAccessToken
				? {
						Authorization: `Token ${personalAccessToken}`,
					}
				: {},
		});
		const data = await JSON.parse(response);
		return data.private;
	} catch (e) {
		if (debugLogging) console.log("error in isPrivateRepo", URL, e);
		return false;
	}
};

/**
 * pulls from github a release file by its version number
 *
 * @param repository - path to GitHub repository in format USERNAME/repository
 * @param version    - version of release to retrive
 * @param fileName   - name of file to retrieve from release
 *
 * @returns contents of file as string from the repository's release
 */
export const grabReleaseFileFromRepository = async (
	repository: string,
	version: string,
	fileName: string,
	debugLogging = true,
	personalAccessToken = "",
): Promise<string | null> => {
	try {
		// check if the repo is a private repo
		const isPrivate = await isPrivateRepo(
			repository,
			debugLogging,
			personalAccessToken,
		);

		if (isPrivate) {
			type Release = {
				url: string;
				tag_name: string;
				assets: {
					name: string;
					url: string;
				}[];
			};

			// get the asset id
			// fetch https://api.github.com/repos/{repos}/releases , parse the response
			// this will return an array of releases, find the release with the version number by tag_name
			// in the release object, get assets and find the correct asset by name
			// then fetch the url

			const URL = `https://api.github.com/repos/${repository}/releases`;
			const response = await request({
				url: URL,
				headers: {
					Authorization: `Token ${personalAccessToken}`,
				},
			});
			const data = await JSON.parse(response);
			const release = data.find(
				(release: Release) => release.tag_name === version,
			);
			if (!release) {
				return null;
			}
			const asset = release.assets.find(
				(asset: { name: string }) => asset.name === fileName,
			);
			if (!asset) {
				return null;
			}
			const download = await request({
				url: asset.url,
				headers: {
					Authorization: `Token ${personalAccessToken}`,
					Accept: "application/octet-stream",
				},
			});
			return download === "Not Found" || download === `{"error":"Not Found"}`
				? null
				: download;
		}
		const URL = `https://github.com/${repository}/releases/download/${version}/${fileName}`;
		const download = await request({
			url: URL,
			headers: personalAccessToken
				? {
						Authorization: `Token ${personalAccessToken}`,
					}
				: {},
		});

		return download === "Not Found" || download === `{"error":"Not Found"}`
			? null
			: download;
	} catch (error) {
		if (debugLogging)
			console.log("error in grabReleaseFileFromRepository", URL, error);
		return null;
	}
};

/**
 * grabs the manifest.json from the repository. rootManifest - if true grabs manifest.json if false grabs manifest-beta.json
 *
 * @param repositoryPath - path to GitHub repository in format USERNAME/repository
 * @param rootManifest   - if true grabs manifest.json if false grabs manifest-beta.json
 *
 * @returns returns manifest file for  a plugin
 */
export const grabManifestJsonFromRepository = async (
	repositoryPath: string,
	rootManifest = true,
	debugLogging = true,
	personalAccessToken = "",
): Promise<PluginManifest | null> => {
	const manifestJsonPath =
		GITHUB_RAW_USERCONTENT_PATH +
		repositoryPath +
		(rootManifest ? "/HEAD/manifest.json" : "/HEAD/manifest-beta.json");
	if (debugLogging)
		console.log(
			"grabManifestJsonFromRepository manifestJsonPath",
			manifestJsonPath,
		);

	// Function to check if the token is valid
	const isTokenValid = async (token: string): Promise<boolean> => {
		try {
			await request({
				url: "https://api.github.com/user",
				method: "GET",
				headers: {
					Authorization: `token ${token}`,
					"User-Agent": "request",
					accept: "application/vnd.github.v3+json",
				},
			});
			return true;
		} catch (error) {
			if (debugLogging) console.log("Token validation error:", error);
			return false;
		}
	};

	// Check if the token is valid
	let tokenValid = false;
	if (personalAccessToken) {
		tokenValid = await isTokenValid(personalAccessToken);
		if (debugLogging) console.log("Token valid:", tokenValid);
	}

	try {
		const response: string = await request({
			url: manifestJsonPath,
			headers: tokenValid
				? {
						Authorization: `Token ${personalAccessToken}`,
					}
				: {},
		});
		if (debugLogging)
			console.log("grabManifestJsonFromRepository response", response);
		return response === "404: Not Found"
			? null
			: ((await JSON.parse(response)) as PluginManifest);
	} catch (error) {
		if (error !== "Error: Request failed, status 404" && debugLogging) {
			// normal error, ignore
			console.log(
				`error in grabManifestJsonFromRepository for ${manifestJsonPath}`,
				error,
			);
		}
		return null;
	}
};

export interface CommunityPlugin {
	id: string;
	name: string;
	author: string;
	description: string;
	repo: string;
}

export const grabCommmunityPluginList = async (
	debugLogging = true,
): Promise<CommunityPlugin[] | null> => {
	const pluginListUrl =
		"https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json";
	try {
		const response = await request({ url: pluginListUrl });
		return response === "404: Not Found"
			? null
			: ((await JSON.parse(response)) as CommunityPlugin[]);
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityPluginList", error);
		return null;
	}
};

export interface CommunityTheme {
	name: string;
	author: string;
	repo: string;
}

export const grabCommmunityThemesList = async (
	debugLogging = true,
): Promise<CommunityTheme[] | null> => {
	const themesUrl =
		"https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-css-themes.json";
	try {
		const response = await request({ url: themesUrl });
		return response === "404: Not Found"
			? null
			: ((await JSON.parse(response)) as CommunityTheme[]);
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityThemesList", error);
		return null;
	}
};

export const grabCommmunityThemeCssFile = async (
	repositoryPath: string,
	betaVersion = false,
	debugLogging = false,
): Promise<string | null> => {
	const themesUrl = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/theme${
		betaVersion ? "-beta" : ""
	}.css`;
	try {
		const response = await request({ url: themesUrl });
		return response === "404: Not Found" ? null : response;
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityThemeCssFile", error);
		return null;
	}
};

export const grabCommmunityThemeManifestFile = async (
	repositoryPath: string,
	debugLogging = true,
): Promise<string | null> => {
	const themesUrl = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/manifest.json`;
	try {
		const response = await request({ url: themesUrl });
		return response === "404: Not Found" ? null : response;
	} catch (error) {
		if (debugLogging)
			console.log("error in grabCommmunityThemeManifestFile", error);
		return null;
	}
};

const checksum = (str: string): number => {
	let sum = 0;
	for (let i = 0; i < str.length; i++) {
		sum += str.charCodeAt(i);
	}
	return sum;
};

export const checksumForString = (str: string): string => {
	return checksum(str).toString();
};

export const grabChecksumOfThemeCssFile = async (
	repositoryPath: string,
	betaVersion: boolean,
	debugLogging: boolean,
): Promise<string> => {
	const themeCss = await grabCommmunityThemeCssFile(
		repositoryPath,
		betaVersion,
		debugLogging,
	);
	return themeCss ? checksumForString(themeCss) : "0";
};

interface CommitInfo {
	commit: {
		committer?: {
			date?: string;
		};
	};
}

export const grabLastCommitInfoForFile = async (
	repositoryPath: string,
	path: string,
	debugLogging = true,
): Promise<CommitInfo[] | null> => {
	const url = `https://api.github.com/repos/${repositoryPath}/commits?path=${path}&page=1&per_page=1`;
	try {
		const response = await request({ url: url });
		return response === "404: Not Found"
			? null
			: (JSON.parse(response) as CommitInfo[]);
	} catch (error) {
		if (debugLogging) console.log("error in grabLastCommitInfoForAFile", error);
		return null;
	}
};

export const grabLastCommitDateForFile = async (
	repositoryPath: string,
	path: string,
): Promise<string> => {
	const test: CommitInfo[] | null = await grabLastCommitInfoForFile(
		repositoryPath,
		path,
	);
	if (test && test.length > 0 && test[0].commit.committer?.date) {
		return test[0].commit.committer.date;
	}
	return "";
};
