import { appendFile } from "node:fs/promises"
import { env } from "node:process"

/**
 * Sets an environment variable in the GitHub Actions environment file.
 *
 * @param {string} varName The name of the environment variable to set.
 * @param {string} varValue The value of the environment variable to set.
 *
 * @returns {Promise<void>}
 */
export async function setGitHubEnvVar (varName, varValue) {
	if (!env.CI) return

	await appendFile(env.GITHUB_ENV, `\n${varName}=${varValue}`)
}
