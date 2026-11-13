import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setGitHubEnvVar } from "./set-github-env-var.ts"

describe(`setGitHubEnvVar`, () => {
	let envFile: string

	beforeEach(async () => {
		let dir = await mkdtemp(path.join(tmpdir(), `gh-env-`))
		envFile = path.join(dir, `env`)
		vi.stubEnv(`CI`, ``)
		delete process.env.GITHUB_ENV
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	it(`does nothing outside CI`, async () => {
		await setGitHubEnvVar(`NAME`, `value`)
		// No GITHUB_ENV file should have been created.
		await expect(readFile(envFile, `utf8`)).rejects.toThrow()
	})

	it(`throws when CI is set but GITHUB_ENV is missing`, async () => {
		vi.stubEnv(`CI`, `true`)
		await expect(setGitHubEnvVar(`NAME`, `value`)).rejects.toThrow(/GITHUB_ENV/u)
	})

	it(`appends the variable to GITHUB_ENV inside CI`, async () => {
		vi.stubEnv(`CI`, `true`)
		vi.stubEnv(`GITHUB_ENV`, envFile)
		await setGitHubEnvVar(`PATH_TO_DIST`, `./dist`)
		expect(await readFile(envFile, `utf8`)).toBe(`\nPATH_TO_DIST=./dist`)
	})
})
