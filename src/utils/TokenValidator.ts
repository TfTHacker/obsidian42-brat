import {
	type GitHubTokenInfo,
	TokenErrorType,
	type TokenValidationError,
	validateGitHubToken,
} from "../features/githubUtils";

export class TokenValidator {
	private statusEl?: HTMLElement | null;

	constructor(statusEl?: HTMLElement | null) {
		this.statusEl = statusEl;
	}

	async validateToken(token: string, repository?: string): Promise<boolean> {
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
				this.statusEl?.addClass("valid");
				this.showValidTokenInfo(patInfo);
				return true;
			}

			this.statusEl?.addClass("invalid");
			this.showErrorMessage(patInfo.error);
			return false;
		} catch (error) {
			console.error("Token validation error:", error);
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
			const daysLeft = Math.ceil(
				(expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
			);

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
