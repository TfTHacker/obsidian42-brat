import type { TextComponent } from "obsidian";
import { type GitHubTokenInfo, TokenErrorType, type TokenValidationError, validateGitHubToken } from "../features/githubUtils";

export class TokenValidator {
	private tokenEl: TextComponent | null;
	private statusEl?: HTMLElement | null;

	constructor(tokenEl: TextComponent | null, statusEl?: HTMLElement | null) {
		this.tokenEl = tokenEl;
		this.statusEl = statusEl;
	}

	async validateToken(token: string, repository?: string): Promise<boolean> {
		this.tokenEl?.inputEl.removeClass("valid-input", "invalid-input");
		this.statusEl?.empty();

		// No token provided
		if (!token) {
			this.statusEl?.setText("No token provided");
			return false;
		}

		try {
			const patInfo = await validateGitHubToken(token, repository);

			if (patInfo.validToken) {
				this.tokenEl?.inputEl.addClass("valid-input");
				this.showValidTokenInfo(patInfo);
				return true;
			}

			this.tokenEl?.inputEl.addClass("invalid-input");
			this.showErrorMessage(patInfo.error);
			return false;
		} catch (error) {
			console.error("Token validation error:", error);
			this.tokenEl?.inputEl.addClass("invalid-input");
			this.statusEl?.setText("Failed to validate token");
			return false;
		}
	}

	private showValidTokenInfo(patInfo: GitHubTokenInfo): void {
		const details = this.statusEl?.createDiv({ cls: "brat-token-details" });

		if (!details) return;

		details.createDiv({
			text: "✓ Valid token",
			cls: "brat-token-status valid",
		});

		if (patInfo.currentScopes?.length) {
			details.createDiv({
				text: `Scopes: ${patInfo.currentScopes.join(", ")}`,
				cls: "brat-token-scopes",
			});
		}

		if (patInfo.rateLimit) {
			details.createDiv({
				text: `Rate Limit: ${patInfo.rateLimit.remaining}/${patInfo.rateLimit.limit}`,
				cls: "brat-token-rate",
			});
		}

		if (patInfo.expirationDate) {
			const expires = new Date(patInfo.expirationDate);
			const daysLeft = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

			if (daysLeft < 7) {
				details.createDiv({
					text: `⚠️ Token expires in ${daysLeft} days`,
					cls: "brat-token-warning",
				});
			}
		}
	}

	private showErrorMessage(error: TokenValidationError): void {
		const details = this.statusEl?.createDiv({ cls: "brat-token-error" });
		if (!details) return;

		details.createDiv({ text: error.message });

		if (error.details) {
			switch (error.type) {
				case TokenErrorType.INVALID_PREFIX:
					details.createDiv({
						text: `Valid prefixes: ${error.details.validPrefixes?.join(", ")}`,
					});
					break;
				case TokenErrorType.INSUFFICIENT_SCOPE:
					details.createDiv({
						text: `Required scopes: ${error.details.requiredScopes?.join(", ")}`,
					});
					break;
			}
		}
	}
}
