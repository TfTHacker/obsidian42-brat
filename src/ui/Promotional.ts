

export const promotionalLinks = (containerEl: HTMLElement, settingsTab = true) : HTMLElement => {

    const linkHeight = settingsTab ? 40 : 30;

    const linksDiv = containerEl.createEl("div");
    linksDiv.style.float = "right";
    
    if(settingsTab===false) {
        linksDiv.style.padding = "10px";
        linksDiv.style.paddingLeft = "15px";
        linksDiv.style.paddingRight = "15px";
    } else {
        linksDiv.style.padding = "15px";
        linksDiv.style.paddingLeft = "15px";
        linksDiv.style.paddingRight = "15px";
        linksDiv.style.marginLeft = "15px";    
    }

    const coffeeSpan = linksDiv.createSpan("coffee");
    coffeeSpan.addClass("ex-coffee-span");
    const coffeeLink = coffeeSpan.createEl("a", { href: "https://bit.ly/o42-kofi" });
    // const coffeeLogo = settingsTab ? "https://cdn.ko-fi.com/cdn/kofi3.png?v=3" : "https://uploads-ssl.webflow.com/5c14e387dab576fe667689cf/61e1116779fc0a9bd5bdbcc7_Frame%206.png"
    const coffeeImg = coffeeLink.createEl("img", { attr: { src: "https://cdn.ko-fi.com/cdn/kofi3.png?v=3" } });
    coffeeImg.height = linkHeight;
    
    const twitterSpan = linksDiv.createSpan("coffee");
    twitterSpan.addClass("ex-twitter-span");
    twitterSpan.style.paddingLeft = "10px";
    const twitterLink = twitterSpan.createEl("a", { href: "https://bit.ly/o42-twitter" });
    const twitterImg = twitterLink.createEl("img", { attr: { src: "https://cdn.cdnlogo.com/logos/t/96/twitter-icon.svg" } });
    twitterImg.height = linkHeight;

    const mediumSpan = linksDiv.createSpan("coffee");
    mediumSpan.addClass("ex-twitter-span");
    mediumSpan.style.paddingLeft = "10px";
    mediumSpan.style.right = "0";
    const mediumLink = mediumSpan.createEl("a", { href: "https://bit.ly/o42-medium" });
    const mediumImg = mediumLink.createEl("img", { attr: { src: "https://miro.medium.com/v2/resize:fill:176:176/1*sHhtYhaCe2Uc3IU0IgKwIQ.png" } });
    mediumImg.height = linkHeight;

    return linksDiv;
}

