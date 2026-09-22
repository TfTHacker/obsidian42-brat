import { type App, SuggestModal } from "obsidian";
import type { ReleaseVersion } from "src/features/githubUtils";
import { getTranslations } from "../i18n";

export class VersionSuggestModal extends SuggestModal<ReleaseVersion> {
	selected: string;
	versions: ReleaseVersion[];
	onChoose: (version: string) => void;

	constructor(app: App, repository: string, versions: ReleaseVersion[], selected: string, onChoose: (version: string) => void) {
		super(app);
		const text = getTranslations().versionSuggestModal;
		this.versions = versions;
		this.selected = selected;
		this.onChoose = onChoose;
		this.setTitle(text.title);
		this.setPlaceholder(text.placeholder(repository));
		this.setInstructions([
			{ command: "↑↓", purpose: text.instructions.navigateVersions },
			{ command: "↵", purpose: text.instructions.selectVersion },
			{ command: "esc", purpose: text.instructions.dismissModal },
		]);
	}

	getSuggestions(query: string): ReleaseVersion[] {
		const lowerQuery = query.toLowerCase();
		return this.versions.filter((version) => version.version.toLowerCase().contains(lowerQuery));
	}

	renderSuggestion(version: ReleaseVersion, el: HTMLElement) {
		const text = getTranslations().versionSuggestModal;
		el.createEl("div", {
			text: `${text.versionLabel(version.version)} ${version.prerelease ? text.prereleaseSuffix : ""}`,
		});
	}

	onChooseSuggestion(version: ReleaseVersion) {
		this.onChoose(version.version);
	}
}
