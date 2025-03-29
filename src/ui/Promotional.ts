export const promotionalLinks = (containerEl: HTMLElement, settingsTab = true): HTMLElement => {
	const linksDiv = containerEl.createEl("div");
	linksDiv.style.float = "right";

	if (!settingsTab) {
		linksDiv.style.padding = "10px";
		linksDiv.style.paddingLeft = "15px";
		linksDiv.style.paddingRight = "15px";
	} else {
		linksDiv.style.padding = "15px";
		linksDiv.style.paddingLeft = "15px";
		linksDiv.style.paddingRight = "15px";
		linksDiv.style.marginLeft = "15px";
	}

	const twitterSpan = linksDiv.createDiv("coffee");
	twitterSpan.addClass("ex-twitter-span");
	twitterSpan.style.paddingLeft = "10px";
	const captionText = twitterSpan.createDiv();
	captionText.innerText = "Learn more about my work at:";
	twitterSpan.appendChild(captionText);
	const twitterLink = twitterSpan.createEl("a", {
		href: "https://tfthacker.com",
	});
	twitterLink.innerText = "https://tfthacker.com";

	return linksDiv;
};
