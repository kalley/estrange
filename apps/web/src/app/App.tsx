import { HashRouter } from "@solidjs/router";
import { historyRoutes } from "@/pages/history";
import { homeRoute } from "@/pages/home";
import { Layout } from "./ui/layout/layout";

const routes = [
	homeRoute,
	historyRoutes,
	{
		path: "/settings",
		component: () => <div>Settings</div>,
	},
];

function App() {
	return <HashRouter root={Layout}>{routes}</HashRouter>;
}

export default App;
