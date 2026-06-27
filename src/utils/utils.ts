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
