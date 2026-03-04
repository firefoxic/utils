import { defineConfig } from "tsup"

export default defineConfig({
	entry: {
		index: `src/index.ts`,
	},
	format: [`esm`],
	target: `esnext`,
	minify: true,
	dts: true,
	clean: true,
})
