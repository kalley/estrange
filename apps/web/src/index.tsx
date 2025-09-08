/* @refresh reload */

import { render } from "solid-js/web";
import "@/shared/styles";
import App from "@/app/App";

function main(root: HTMLElement | null) {
	if (!root) return;

	render(() => <App />, root);
}

main(document.getElementById("root"));
