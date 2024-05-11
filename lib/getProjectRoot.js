import { env } from "node:process"

/**
 * Get the path to the project root when deploying to GitHub Pages.
 * Your action should set `REPO_NAME` and `PR_NUMBER` environment variables at the step you need
 * (most likely when building the project).
 *
 * @returns {string} The path to the project directory from the domain root if working in a GitHub CI environment. If not, returns `/`.
 */
export function getProjectRoot () {
	if (!env.CI || !env.REPO_NAME) return ``

	if (!env.PR_NUMBER) return `/${env.REPO_NAME}`

	return `/${env.REPO_NAME}/${env.PR_NUMBER}`
}
