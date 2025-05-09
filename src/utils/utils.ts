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

export function createLink(url: string, text: string, prependText?: string, appendText?: string): DocumentFragment {
	const newLink = new DocumentFragment();
	const linkElement = document.createElement("a");
	linkElement.textContent = text;
	linkElement.href = url;
	if (prependText) {
		const textNode = document.createTextNode(prependText);
		newLink.appendChild(textNode);
	}
	newLink.appendChild(linkElement);
	if (appendText) {
		const textNode = document.createTextNode(appendText);
		newLink.appendChild(textNode);
	}
	return newLink;
}
