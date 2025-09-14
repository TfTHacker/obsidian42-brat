import { type App, SuggestModal } from "obsidian";
import type { ReleaseVersion } from "src/features/githubUtils";

export class VersionSuggestModal extends SuggestModal<ReleaseVersion> {
	selected: string;
	versions: ReleaseVersion[];
	onChoose: (version: string) => void;

	constructor(app: App, repository: string, versions: ReleaseVersion[], selected: string, onChoose: (version: string) => void) {
		super(app);
		this.versions = versions;
		this.selected = selected;
		this.onChoose = onChoose;
		this.setTitle("Select a version");
		this.setPlaceholder(`Type to search for a version for ${repository}`);
		this.setInstructions([
			{ command: "↑↓", purpose: "Navigate versions" },
			{ command: "↵", purpose: "Select version" },
			{ command: "esc", purpose: "Dismiss modal" },
		]);
	}

	getSuggestions(query: string): ReleaseVersion[] {
		const lowerQuery = query.toLowerCase();
		return this.versions.filter((version) => version.version.toLowerCase().contains(lowerQuery));
	}

	renderSuggestion(version: ReleaseVersion, el: HTMLElement) {
		el.createEl("div", {
			text: `${version.version} ${version.prerelease ? "(Prerelease)" : ""}`,
		});
	}

	onChooseSuggestion(version: ReleaseVersion) {
		this.onChoose(version.version);
	}

	onNoSuggestion(): void {
		this.onChoose(this.selected ? this.selected : "");
		this.close();
	}
}
