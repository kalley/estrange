import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	build: {
		sourcemap: true,
	},
	plugins: [solid(), vanillaExtractPlugin(), tsconfigPaths()],
});
