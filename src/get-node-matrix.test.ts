import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe(`get-node-matrix`, () => {
	let originalCwd = process.cwd()

	let dir: string

	beforeEach(() => {
		dir = mkdtempSync(path.join(tmpdir(), `gnm-`))
		vi.resetModules()
		delete process.env.npm_package_json
		delete process.env.GITHUB_OUTPUT
	})

	afterEach(() => {
		process.chdir(originalCwd)
		rmSync(dir, { recursive: true, force: true })
		vi.unstubAllEnvs()
		vi.restoreAllMocks()
	})

	it(`reads engines.node from the project package.json in a parent directory`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.11.0 || >=22.0.0` } }),
		)
		let nested = path.join(dir, `nested`)
		mkdirSync(nested)
		process.chdir(nested)
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["20.11.0","22.0.0"]`)
	})

	it(`ignores npm_package_json when it is not a file`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=18.0.0` } }),
		)
		process.env.npm_package_json = dir
		process.chdir(dir)
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["18.0.0"]`)
	})

	it(`prefers npm_package_json over the directory search`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=18.0.0` } }),
		)
		process.env.npm_package_json = path.join(dir, `package.json`)
		process.chdir(tmpdir())
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["18.0.0"]`)
	})

	it(`fills missing minor and patch versions with zero`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20 || >=21.5` } }),
		)
		process.chdir(dir)
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["20.0.0","21.5.0"]`)
	})

	it(`deduplicates identical versions`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0 || >=20.0.0` } }),
		)
		process.chdir(dir)
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["20.0.0"]`)
	})

	it(`appends the result to GITHUB_OUTPUT when it is set`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0` } }),
		)
		let outputFile = path.join(dir, `github-output`)
		process.env.GITHUB_OUTPUT = outputFile
		process.chdir(dir)
		vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(readFileSync(outputFile, `utf8`)).toBe(`node_versions=["20.0.0"]\n`)
	})

	it(`throws when engines.node is missing`, async () => {
		writeFileSync(path.join(dir, `package.json`), JSON.stringify({}))

		process.chdir(dir)

		await expect(import(`./get-node-matrix.ts`)).rejects.toThrow(
			`Project package.json does not specify engines.node`,
		)
	})

	it(`throws when a version range cannot be resolved`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `latest` } }),
		)

		process.chdir(dir)

		await expect(import(`./get-node-matrix.ts`)).rejects.toThrow(
			`Cannot resolve minimum Node.js version: latest`,
		)
	})

	it(`throws when no package.json is found`, async () => {
		process.chdir(tmpdir())

		await expect(import(`./get-node-matrix.ts`)).rejects.toThrow(
			`Project package.json not found`,
		)
	})
})
