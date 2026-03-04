import { appendFile } from "node:fs/promises"
import { env } from "node:process"

/**
 * Sets an environment variable in the GitHub Actions environment file.
 * @async
 * @param {string} varName - The name of the environment variable to set.
 * @param {string} varValue - The value of the environment variable to set.
 * @returns {Promise<void>} A promise that resolves when the environment variable has been set.
 * @throws {Error} If the function is called outside of a GitHub Actions environment or if the GITHUB_ENV environment variable is not set.
 */
export async function setGitHubEnvVar (varName: string, varValue: string): Promise<void> {
	if (!env.CI) return
	if (!env.GITHUB_ENV) throw new Error(`GITHUB_ENV environment variable is not set. This function should only be used in a GitHub Actions environment.`)
	await appendFile(env.GITHUB_ENV, `\n${varName}=${varValue}`)
}
