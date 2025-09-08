import { HashRouter } from "@solidjs/router";
import { homeRoute } from "@/pages/home";
import { Layout } from "./ui/layout/layout";

const routes = [
	homeRoute,
	{
		path: "/history",
		component: () => <div>History</div>,
	},
	{
		path: "/settings",
		component: () => <div>Settings</div>,
	},
];

function App() {
	return <HashRouter root={Layout}>{routes}</HashRouter>;
}

export default App;
