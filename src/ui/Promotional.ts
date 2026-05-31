export const promotionalLinks = (containerEl: HTMLElement, settingsTab = true): HTMLElement => {
	const linksDiv = containerEl.createEl("div", { cls: "brat-promotional-links" });

	if (!settingsTab) {
		linksDiv.addClass("brat-promotional-links-modal");
	} else {
		linksDiv.addClass("brat-promotional-links-settings");
	}

	const twitterSpan = linksDiv.createDiv("coffee");
	twitterSpan.addClass("ex-twitter-span");
	twitterSpan.addClass("brat-promotional-links-coffee");
	const captionText = twitterSpan.createDiv();
	captionText.innerText = "Learn more about my work at:";
	twitterSpan.appendChild(captionText);
	const twitterLink = twitterSpan.createEl("a", {
		href: "https://tfthacker.com",
	});
	twitterLink.innerText = "https://tfthacker.com";

	return linksDiv;
};
