import type { App } from "obsidian";

/**
 * Helper utilities for managing GitHub tokens in SecretStorage
 *
 * SecretStorage stores named secrets that users can share across plugins.
 * Settings store the secret *names*, and we retrieve values with get().
 */

/**
 * Retrieves the global personal access token value
 * @param app - Obsidian app instance
 * @param secretName - The name of the secret to retrieve
 * @returns The token value or null if not set
 */
export function getGlobalToken(app: App, secretName: string): string | null {
	if (!secretName || secretName.trim() === "") {
		return null;
	}
	return app.secretStorage.getSecret(secretName);
}

/**
 * Retrieves a per-repository token value
 * @param app - Obsidian app instance
 * @param secretName - The name of the secret to retrieve
 * @returns The token value or null if not set
 */
export function getRepoToken(app: App, secretName: string): string | null {
	if (!secretName || secretName.trim() === "") {
		return null;
	}
	return app.secretStorage.getSecret(secretName);
}

/**
 * Retrieves the appropriate token for a repository
 * Falls back to global token if no repo-specific token is set
 *
 * @param app - Obsidian app instance
 * @param repoTokenName - Secret name for repo-specific token
 * @param globalTokenName - Secret name for global PAT
 * @returns The token value to use, or empty string if none available
 */
export function getTokenForRepo(
	app: App,
	repoTokenName: string,
	globalTokenName: string,
): string {
	// Try repo-specific token first
	const repoToken = getRepoToken(app, repoTokenName);
	if (repoToken && repoToken.trim() !== "") {
		return repoToken;
	}

	// Fall back to global token
	const globalToken = getGlobalToken(app, globalTokenName);
	return globalToken || "";
}
