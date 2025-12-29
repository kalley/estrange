import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	build: {
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			formats: ["es"],
			name: "Ligature",
		},
		minify: false,
		outDir: "lib",
	},
	plugins: [dts({ include: ["src"] })],
});
