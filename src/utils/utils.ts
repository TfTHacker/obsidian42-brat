/**
 * Validates a plugin id or theme folder name that will be concatenated into a
 * filesystem path inside the vault (e.g. `.obsidian/plugins/<id>`). These values
 * come from a remote, attacker-controllable manifest.json, and Obsidian's
 * `normalizePath` does not strip `..`, so an unchecked value like
 * `"../../.obsidian/plugins/other"` can escape the intended folder and overwrite
 * unrelated files. Returns true only for plain identifiers with no path
 * separators or `..` segments.
 */
export function isSafeVaultFolderName(name: string): boolean {
	if (!name || name.length > 100) return false;
	// Allow only letters, numbers, spaces, dot, underscore and hyphen. This
	// excludes "/" and "\", so no path separators can slip through.
	if (!/^[A-Za-z0-9 ._-]+$/.test(name)) return false;
	// Reject "." / ".." and any embedded parent-directory traversal.
	if (name === "." || name.includes("..")) return false;
	return true;
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
