import type { PluginManifest } from "obsidian";
import { request } from "obsidian";
import { compareVersions } from 'compare-versions';

const GITHUB_RAW_USERCONTENT_PATH = "https://raw.githubusercontent.com/";

export const isPrivateRepo = async (
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
	release: Release,
	fileName: string,
	debugLogging = true,
	isPrivate = false,
	personalAccessToken = "",
): Promise<string | null> => {
	try {
		// get the asset based on the asset url in the release
		// We can use this both for private and public repos
		const asset = release.assets.find(
			(asset: { name: string }) => asset.name === fileName,
		);
		if (!asset) {
			return null;
		}
		
		const headers: Record<string, string> = {
			Accept: "application/octet-stream"
		};

		// Authenticated requests get a higher rate limit
		if (isPrivate && personalAccessToken || personalAccessToken) {
			headers.Authorization = `Token ${personalAccessToken}`;
		}

		const download = await request({
			url: asset.url,
			headers
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

export type Release = {
    url: string;
    tag_name: string;
    prerelease: boolean;
    assets: {
        name: string;
        url: string;
        browser_download_url: string;
    }[];
};

/**
 * Gets either a specific release or the latest release from a GitHub repository
 * 
 * @param repositoryPath - Repository path in format username/repository
 * @param version - Optional version/tag to fetch. If not provided, fetches latest release
 * @param includePrereleases - Whether to include pre-releases in the results (default: false)
 * @param debugLogging - Enable debug logging (default: false)
 * @param isPrivate - Whether the repository is private (default: false)
 * @param personalAccessToken - GitHub personal access token for private repos
 * @returns Promise<Release | null> Release information or null if not found/error
 * 
 * @example
 * // Get latest release
 * const release = await grabReleaseFromRepository('username/repo');
 * 
 * // Get specific version
 * const release = await grabReleaseFromRepository('username/repo', '1.0.0');
 * 
 * // Include pre-releases
 * const beta = await grabReleaseFromRepository('username/repo', undefined, true);
 * 
 * // Access private repository
 * const private = await grabReleaseFromRepository('username/repo', undefined, false, false, true, 'token');
 */
export const grabReleaseFromRepository = async (
    repositoryPath: string,
    version?: string,
    includePrereleases = false,
    debugLogging = false,
	isPrivate = false,
    personalAccessToken?: string
): Promise<Release | null> => {
    try {
        const apiUrl = version
            ? `https://api.github.com/repos/${repositoryPath}/releases/tags/${version}`
            : `https://api.github.com/repos/${repositoryPath}/releases`;

        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json'
        };

		// Authenticated requests get a higher rate limit
        if (isPrivate && personalAccessToken || personalAccessToken) {
            headers.Authorization = `Token ${personalAccessToken}`;
        }

        const response = await request({ url: apiUrl, headers });

        if (response === "404: Not Found") return null;

        const releases: Release[] = version 
            ? [JSON.parse(response)]
            : JSON.parse(response);

        if (debugLogging) {
            console.log(`grabReleaseFromRepository for ${repositoryPath}:`, releases);
        }

		
        return releases
            .sort((a, b) => compareVersions(b.tag_name, a.tag_name))
            .filter(release => includePrereleases || !release.prerelease)[0] ?? null;

    } catch (error) {
        if (debugLogging) {
            console.log(`Error in grabReleaseFromRepository for ${repositoryPath}:`, error);
        }
        return null;
    }
};
