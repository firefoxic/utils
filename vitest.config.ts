import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		watch: false,
		coverage: {
			include: [`src/**`],
			reporter: [`text`, `html`],
			thresholds: {
				statements: 100,
				functions: 100,
				lines: 100,
				branches: 96,
			},
		},
	},
})
