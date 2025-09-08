import { HomePage } from "./home-page";
import { PromptPage } from "./prompt-page";
import { RespondPage } from "./respond-page";
import { WelcomePage } from "./welcome-page";

export const homeRoute = {
	path: "/",
	component: HomePage,
	children: [
		{
			path: "/",
			component: WelcomePage,
		},
		{
			path: "/prompt",
			component: PromptPage,
		},
		{
			path: "/respond",
			component: RespondPage,
		},
	],
};
