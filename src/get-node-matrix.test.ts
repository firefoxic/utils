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
		process.argv = [`node`, `get-node-matrix.ts`]
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

	it(`throws when engines.node is missing everywhere`, async () => {
		writeFileSync(path.join(dir, `package.json`), JSON.stringify({}))

		process.chdir(dir)

		await expect(import(`./get-node-matrix.ts`)).rejects.toThrow(
			`No engines.node found in the project package.json or any of the specified dependencies`,
		)
	})

	it(`reads engines.node from the project and merges with a single peer`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0` } }),
		)
		let peerDir = path.join(dir, `node_modules`, `stylelint`)
		mkdirSync(peerDir, { recursive: true })
		writeFileSync(
			path.join(peerDir, `package.json`),
			JSON.stringify({ engines: { node: `>=18.0.0 || >=20.0.0` } }),
		)
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `--dependencies`, `stylelint`]
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["18.0.0","20.0.0"]`)
	})

	it(`reads engines.node from multiple dependencies passed as a comma-separated list`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0` } }),
		)
		for (let peer of [`stylelint`, `postcss`]) {
			let peerDir = path.join(dir, `node_modules`, peer)
			mkdirSync(peerDir, { recursive: true })
			writeFileSync(
				path.join(peerDir, `package.json`),
				JSON.stringify({ engines: { node: `>=18.0.0` } }),
			)
		}
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `--dependencies`, `stylelint,postcss`]
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["18.0.0","20.0.0"]`)
	})

	it(`reads engines.node from peers only when the project has none`, async () => {
		writeFileSync(path.join(dir, `package.json`), JSON.stringify({}))
		let peerDir = path.join(dir, `node_modules`, `postcss`)
		mkdirSync(peerDir, { recursive: true })
		writeFileSync(
			path.join(peerDir, `package.json`),
			JSON.stringify({ engines: { node: `>=18.0.0` } }),
		)
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `--dependencies=postcss`]
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["18.0.0"]`)
	})

	it(`deduplicates versions across project and peers`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0 || >=22.0.0` } }),
		)
		let peerDir = path.join(dir, `node_modules`, `stylelint`)
		mkdirSync(peerDir, { recursive: true })
		writeFileSync(
			path.join(peerDir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0` } }),
		)
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `--dependencies`, `stylelint`]
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["20.0.0","22.0.0"]`)
	})

	it(`keeps only the lowest version in each major line`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=22.22.2 || >=22.18.0 || >=26.13.0` } }),
		)
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`]
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["22.18.0","26.13.0"]`)
	})

	it(`keeps only the lowest version in each major line across project and dependencies`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=22.22.2 || >=26.0.0` } }),
		)
		let peerDir = path.join(dir, `node_modules`, `stylelint`)
		mkdirSync(peerDir, { recursive: true })
		writeFileSync(
			path.join(peerDir, `package.json`),
			JSON.stringify({ engines: { node: `>=22.18.0 || >=26.13.0` } }),
		)
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `--dependencies`, `stylelint`]
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["22.18.0","26.0.0"]`)
	})

	it(`supports the short -d flag`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0` } }),
		)
		let peerDir = path.join(dir, `node_modules`, `postcss`)
		mkdirSync(peerDir, { recursive: true })
		writeFileSync(
			path.join(peerDir, `package.json`),
			JSON.stringify({ engines: { node: `>=18.0.0` } }),
		)
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `-d`, `postcss`]
		let spy = vi.spyOn(console, `info`).mockReturnValue()

		await import(`./get-node-matrix.ts`)

		expect(spy).toHaveBeenCalledWith(`Node.js matrix: ["18.0.0","20.0.0"]`)
	})

	it(`throws when --dependencies is passed without a value`, async () => {
		writeFileSync(
			path.join(dir, `package.json`),
			JSON.stringify({ engines: { node: `>=20.0.0` } }),
		)
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `--dependencies`]

		await expect(import(`./get-node-matrix.ts`)).rejects.toThrow(
			`--dependencies requires a list of package names`,
		)
	})

	it(`throws when --dependencies is passed but none of them nor the project has engines.node`, async () => {
		writeFileSync(path.join(dir, `package.json`), JSON.stringify({}))
		let peerDir = path.join(dir, `node_modules`, `stylelint`)
		mkdirSync(peerDir, { recursive: true })
		writeFileSync(path.join(peerDir, `package.json`), JSON.stringify({}))
		process.chdir(dir)
		process.argv = [`node`, `get-node-matrix.ts`, `--dependencies`, `stylelint`]

		await expect(import(`./get-node-matrix.ts`)).rejects.toThrow(
			`No engines.node found in the project package.json or any of the specified dependencies`,
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
