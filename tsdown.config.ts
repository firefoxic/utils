import { defineConfig } from "tsdown"

export default defineConfig({
	entry: {
		index: `src/index.ts`,
	},
	fixedExtension: false,
	minify: true,
})
