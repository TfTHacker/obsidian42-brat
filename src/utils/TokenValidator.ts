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
		// Remove valid/invalid classes from the input element
		this.tokenEl?.inputEl.removeClass("valid-input", "invalid-input");

		// No token provided
		if (!token) {
			this.statusEl?.setText("No token provided");
			this.statusEl?.addClass("invalid");
			this.statusEl?.removeClass("valid");
			return false;
		}

		try {
			const patInfo = await validateGitHubToken(token, repository);
			this.statusEl?.removeClass("invalid", "valid");
			this.statusEl?.empty();

			if (patInfo.validToken) {
				this.tokenEl?.inputEl.addClass("valid-input");
				this.statusEl?.addClass("valid");
				this.showValidTokenInfo(patInfo);
				return true;
			}

			this.tokenEl?.inputEl.addClass("invalid-input");
			this.statusEl?.addClass("invalid");
			this.showErrorMessage(patInfo.error);
			return false;
		} catch (error) {
			console.error("Token validation error:", error);
			this.tokenEl?.inputEl.addClass("invalid-input");
			this.statusEl?.setText("Failed to validate token");
			this.statusEl?.addClass("invalid");
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
