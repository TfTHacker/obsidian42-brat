/**
 * id-collision protection.
 *
 * BRAT derives a plugin's install folder from the release's self-declared
 * manifest `id`. Without a guard, a repository could declare a popular
 * plugin's id (e.g. "dataview") and silently overwrite that other plugin's
 * installed files. A collision exists when a plugin with `pluginId` is already
 * installed in the vault, yet the repository being installed is not one BRAT
 * tracks — meaning some other, non-BRAT-managed plugin currently owns that id.
 */
export function isNonBratPluginIdCollision({
	pluginId,
	repositoryPath,
	installedPluginIds,
	bratTrackedRepos,
}: {
	pluginId: string;
	repositoryPath: string;
	installedPluginIds: string[];
	bratTrackedRepos: string[];
}): boolean {
	return installedPluginIds.includes(pluginId) && !bratTrackedRepos.includes(repositoryPath);
}

export function createGitHubResourceLink(
	githubResource: string,
	optionalText?: string,
): DocumentFragment {
	const newLink = new DocumentFragment();
	// eslint-disable-next-line obsidianmd/prefer-active-doc -- BRAT compatibility: activeDocument breaks utility rendering call sites
	const linkElement = document.createElement("a");
	linkElement.textContent = githubResource;
	linkElement.href = `https://github.com/${githubResource}`;
	linkElement.target = "_blank";
	newLink.appendChild(linkElement);
	if (optionalText) {
		// eslint-disable-next-line obsidianmd/prefer-active-doc -- BRAT compatibility: activeDocument breaks utility rendering call sites
		const textNode = document.createTextNode(optionalText);
		newLink.appendChild(textNode);
	}
	return newLink;
}

export function createLink({
	prependText,
	url,
	text,
	appendText,
}: {
	prependText?: string;
	url: string;
	text: string;
	appendText?: string;
}): DocumentFragment {
	const newLink = new DocumentFragment();
	// eslint-disable-next-line obsidianmd/prefer-active-doc -- BRAT compatibility: activeDocument breaks utility rendering call sites
	const linkElement = document.createElement("a");
	linkElement.textContent = text;
	linkElement.href = url;
	if (prependText) {
		// eslint-disable-next-line obsidianmd/prefer-active-doc -- BRAT compatibility: activeDocument breaks utility rendering call sites
		const textNode = document.createTextNode(prependText);
		newLink.appendChild(textNode);
	}
	newLink.appendChild(linkElement);
	if (appendText) {
		// eslint-disable-next-line obsidianmd/prefer-active-doc -- BRAT compatibility: activeDocument breaks utility rendering call sites
		const textNode = document.createTextNode(appendText);
		newLink.appendChild(textNode);
	}
	return newLink;
}
