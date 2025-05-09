export function createGitHubResourceLink(githubResource: string, optionalText?: string): DocumentFragment {
	const newLink = new DocumentFragment();
	const linkElement = document.createElement("a");
	linkElement.textContent = githubResource;
	linkElement.href = `https://github.com/${githubResource}`;
	linkElement.target = "_blank";
	newLink.appendChild(linkElement);
	if (optionalText) {
		const textNode = document.createTextNode(optionalText);
		newLink.appendChild(textNode);
	}
	return newLink;
}
