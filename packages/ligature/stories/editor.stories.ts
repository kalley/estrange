import type { Meta, StoryObj } from "@storybook/html-vite";
import { createEditor, type EditorOptions } from "../src/core/editor";

const meta = {
	title: "Editor/Interactive",
	tags: ["autodocs"],
	render: (args) => {
		const editor = createEditor(args);
		const editorElement = document.createElement("div");

		editorElement.classList.add("markdown-editor");
		editor.attach(editorElement);

		if (args.value) {
			editor.setContent(args.value);
		}

		return editorElement;
	},
} satisfies Meta<EditorOptions>;

export default meta;

type Story = StoryObj<EditorOptions>;

export const Empty: Story = {};

export const PrePopulated: Story = {
	args: {
		value: `# Hello, World!
This is a pre-populated editor, full of __bold__ text, and *italic* text.

It's even got some **bolded \`inline code\`**
`,
	},
};
