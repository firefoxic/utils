#!/usr/bin/env node

import { appendFileSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

function resolvePackageJsonPath (): string {
	let fromEnv = process.env.npm_package_json

	if (fromEnv) {
		try {
			if (statSync(fromEnv).isFile()) return fromEnv
		}
		catch {
			// Fall through to the directory search below.
		}
	}

	let dir = path.resolve(process.cwd())

	while (true) {
		let candidate = path.resolve(dir, `package.json`)

		try {
			if (statSync(candidate).isFile()) return candidate
		}
		catch {
			// Keep walking up the directory tree.
		}

		let parent = path.dirname(dir)

		if (parent === dir) break

		dir = parent
	}

	throw new Error(`Project package.json not found`)
}

interface PackageJson {
	engines?: {
		node?: string,
	},
}

let packageJson = JSON.parse(readFileSync(resolvePackageJsonPath(), `utf8`)) as PackageJson

let range = packageJson.engines?.node

if (!range) throw new Error(`Project package.json does not specify engines.node`)

let versions = range.split(`||`).map((part) => {
	let version = part.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/u)

	if (!version) throw new Error(`Cannot resolve minimum Node.js version: ${part}`)

	return `${version[1]}.${version[2] ?? 0}.${version[3] ?? 0}`
})

let output = JSON.stringify([...new Set(versions)])

if (process.env.GITHUB_OUTPUT) {
	appendFileSync(
		process.env.GITHUB_OUTPUT,
		`node_versions=${output}\n`,
	)
}

console.info(`Node.js matrix: ${output}`)
