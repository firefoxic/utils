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

function parseArgs (): { dependencies: string[] } {
	let dependencies: string[] = []

	for (let i = 2; i < process.argv.length; i += 1) {
		let arg = process.argv[i]

		if (!arg) continue

		if (arg === `--dependencies` || arg === `-d`) {
			if (i + 1 >= process.argv.length) throw new Error(`--dependencies requires a list of package names`)

			i += 1
			let next = process.argv[i]
			if (!next) throw new Error(`--dependencies requires a list of package names`)
			dependencies = dependencies.concat(parseDependencyList(next))
		}
		else if (arg.startsWith(`--dependencies=`) || arg.startsWith(`-d=`)) {
			let prefix = arg.startsWith(`--dependencies=`) ? `--dependencies=` : `-d=`
			dependencies = dependencies.concat(parseDependencyList(arg.slice(prefix.length)))
		}
	}

	return { dependencies }
}

function parseDependencyList (value: string): string[] {
	return value
		.split(`,`)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
}

function parseVersionTuple (version: string): [number, number, number] {
	let parts = version.split(`.`)

	return [
		Number(parts[0]),
		Number(parts[1]),
		Number(parts[2]),
	]
}

function readNodeRange (packageJsonPath: string): string[] | undefined {
	let packageJson: PackageJson

	try {
		packageJson = JSON.parse(readFileSync(packageJsonPath, `utf8`)) as PackageJson
	}
	catch {
		// Dependency package.json missing or unreadable — skip it.
		return undefined
	}

	let range = packageJson.engines?.node
	if (!range) return undefined

	return range.split(`||`).map((part) => {
		let version = part.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/u)

		if (!version) throw new Error(`Cannot resolve minimum Node.js version: ${part}`)

		return `${version[1]}.${version[2] ?? 0}.${version[3] ?? 0}`
	})
}

let { dependencies } = parseArgs()

let projectPackageJsonPath = resolvePackageJsonPath()
let projectRoot = path.dirname(projectPackageJsonPath)

let versions: string[] = []

// Always include versions from the calling project itself.
let projectVersions = readNodeRange(projectPackageJsonPath)

if (projectVersions) versions = versions.concat(projectVersions)

// Include versions from each specified dependency.
for (let dependency of dependencies) {
	let dependencyVersions = readNodeRange(path.resolve(projectRoot, `node_modules`, dependency, `package.json`))
	if (dependencyVersions) versions = versions.concat(dependencyVersions)
}

let uniqueVersions = [...new Set(versions)]

// Keep only the lowest version in each major line (e.g. 22.18.0 over 22.22.2).
let byMajor = new Map<number, { version: string, tuple: [number, number, number] }>()

for (let version of uniqueVersions) {
	let [major, minor, patch] = parseVersionTuple(version)

	let current = byMajor.get(major)

	if (
		!current
		|| minor < current.tuple[1]
		|| (minor === current.tuple[1] && patch < current.tuple[2])
	) byMajor.set(major, { version, tuple: [major, minor, patch] })
}

let outputVersions = [...byMajor.values()]
	.toSorted((a, b) => {
		if (a.tuple[0] !== b.tuple[0]) return a.tuple[0] - b.tuple[0]
		if (a.tuple[1] !== b.tuple[1]) return a.tuple[1] - b.tuple[1]
		return a.tuple[2] - b.tuple[2]
	})
	.map((entry) => entry.version)

if (outputVersions.length === 0) throw new Error(`No engines.node found in the project package.json or any of the specified dependencies`)

let output = JSON.stringify(outputVersions)

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `node_versions=${output}\n`)

console.info(`Node.js matrix: ${output}`)
