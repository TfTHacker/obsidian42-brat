import type { App } from "obsidian";
import type { Settings } from "./settings";

/**
 * Migration log entry for tracking which migrations have been applied
 */
interface MigrationLog {
	appliedMigrations: string[];
}

const MIGRATION_LOG_KEY = "brat-migrations";

/**
 * Checks if a migration has already been applied
 */
async function hasMigrationRun(
	app: App,
	migrationId: string,
): Promise<boolean> {
	try {
		const logData = await app.vault.adapter.read(
			`${app.vault.configDir}/plugins/obsidian42-brat/${MIGRATION_LOG_KEY}.json`,
		);
		const log = JSON.parse(logData) as MigrationLog;
		return log.appliedMigrations.includes(migrationId);
	} catch {
		return false;
	}
}

/**
 * Marks a migration as completed
 */
async function markMigrationComplete(
	app: App,
	migrationId: string,
): Promise<void> {
	try {
		const logPath = `${app.vault.configDir}/plugins/obsidian42-brat/${MIGRATION_LOG_KEY}.json`;
		let log: MigrationLog = { appliedMigrations: [] };

		try {
			const logData = await app.vault.adapter.read(logPath);
			log = JSON.parse(logData) as MigrationLog;
		} catch {
			// No existing log, start fresh
		}

		if (!log.appliedMigrations.includes(migrationId)) {
			log.appliedMigrations.push(migrationId);
			await app.vault.adapter.write(logPath, JSON.stringify(log, null, 2));
		}
	} catch (error) {
		console.error(
			`BRAT: Failed to mark migration ${migrationId} complete:`,
			error,
		);
	}
}

/**
 * Migrates tokens from settings to SecretStorage (Obsidian 1.11.4+)
 *
 * This migration moves:
 * 1. Global personal access token from settings.personalAccessToken
 * 2. Per-repository tokens from settings.pluginSubListFrozenVersion[].token
 *
 * Secret IDs created (lowercase, numbers, dashes only, max 64 chars):
 * - 'brat-gh-global' for the global PAT
 * - 'brat-gh-{owner}-{repo}' for per-repository tokens
 *
 * Deduplication: If the same token value already exists in a secret,
 * that secret name is reused instead of creating a duplicate.
 */
export async function migrateTokensToSecretStorage(
	app: App,
	settings: Settings,
	saveSettings: () => Promise<void>,
): Promise<void> {
	const MIGRATION_ID = "tokens-to-secretstorage-v1";

	// Check if migration already ran
	if (await hasMigrationRun(app, MIGRATION_ID)) {
		return;
	}

	try {
		let migrated = 0;

		// Helper: Convert repo path to valid secret ID
		// Valid: lowercase letters, numbers, dashes only, max 64 chars
		const createSecretId = (repo: string): string => {
			const normalized = repo
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with dashes
				.replace(/-+/g, "-") // Replace multiple dashes with single dash
				.replace(/^-|-$/g, ""); // Remove leading/trailing dashes

			const id = `brat-gh-${normalized}`;

			// Truncate if too long (max 64 chars)
			return id.length > 64 ? id.substring(0, 64).replace(/-$/, "") : id;
		};

		// Helper: Find existing secret with same value (for deduplication)
		const findExistingSecret = (tokenValue: string): string | null => {
			const allSecrets = app.secretStorage.listSecrets();
			for (const secretName of allSecrets) {
				const secretValue = app.secretStorage.getSecret(secretName);
				if (secretValue === tokenValue) {
					return secretName;
				}
			}
			return null;
		};

		// Helper: Create or find secret for a token value
		const getOrCreateSecret = (
			tokenValue: string,
			secretId: string,
		): string => {
			// Check if this exact token already exists
			const existing = findExistingSecret(tokenValue);
			if (existing) {
				console.log(`BRAT: Reusing existing secret "${existing}"`);
				return existing;
			}

			// Create new secret
			app.secretStorage.setSecret(secretId, tokenValue);
			console.log(`BRAT: Created new secret "${secretId}"`);
			return secretId;
		};

		// Migrate global personal access token
		if (
			settings.personalAccessToken &&
			settings.personalAccessToken.trim() !== ""
		) {
			const tokenValue = settings.personalAccessToken.trim();
			const secretId = "brat-gh-global";
			const secretName = getOrCreateSecret(tokenValue, secretId);
			settings.globalTokenName = secretName;
			settings.personalAccessToken = "";
			migrated++;
		}

		// Migrate per-repository tokens
		if (settings.pluginSubListFrozenVersion) {
			for (const plugin of settings.pluginSubListFrozenVersion) {
				if (plugin.token && plugin.token.trim() !== "") {
					const tokenValue = plugin.token.trim();
					const secretId = createSecretId(plugin.repo);
					const secretName = getOrCreateSecret(tokenValue, secretId);
					plugin.tokenName = secretName;
					plugin.token = undefined;
					migrated++;
				}
			}
		}

		// Save settings after clearing tokens
		if (migrated > 0) {
			await saveSettings();
			console.log(`BRAT: Migrated ${migrated} token(s) to SecretStorage`);
		}

		// Mark migration as complete
		await markMigrationComplete(app, MIGRATION_ID);
	} catch (error) {
		console.error("BRAT: Failed to migrate tokens to SecretStorage:", error);
		// Don't throw - allow plugin to continue loading
	}
}
