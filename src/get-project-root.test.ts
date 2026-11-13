import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getProjectRoot } from "./get-project-root.ts"

describe(`getProjectRoot`, () => {
	beforeEach(() => {
		vi.stubEnv(`CI`, ``)
		vi.stubEnv(`REPO_NAME`, ``)
		vi.stubEnv(`PR_NUMBER`, ``)
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	it(`returns an empty string outside CI`, () => {
		expect(getProjectRoot()).toBe(``)
	})

	it(`returns an empty string when REPO_NAME is missing`, () => {
		vi.stubEnv(`CI`, `true`)
		expect(getProjectRoot()).toBe(``)
	})

	it(`returns the repo path when only REPO_NAME is set`, () => {
		vi.stubEnv(`CI`, `true`)
		vi.stubEnv(`REPO_NAME`, `utils`)
		expect(getProjectRoot()).toBe(`/utils`)
	})

	it(`returns the PR path when PR_NUMBER is set`, () => {
		vi.stubEnv(`CI`, `true`)
		vi.stubEnv(`REPO_NAME`, `utils`)
		vi.stubEnv(`PR_NUMBER`, `42`)
		expect(getProjectRoot()).toBe(`/utils/42`)
	})
})
