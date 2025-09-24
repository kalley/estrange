import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	build: {
		minify: false,
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			formats: ["es"],
			name: "Ligature",
		},
		outDir: "lib",
	},
	plugins: [dts({ include: ["src"] })],
});
