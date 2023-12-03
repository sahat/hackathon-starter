// @ts-check

require("dotenv").config();

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: "Meshtastic",
	tagline:
		"An open source, off-grid, decentralized, mesh network built to run on affordable, low-power devices",
	url: "https://meshtastic.org",
	baseUrl: "/",
	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",
	favicon: "design/web/favicon.ico",
	organizationName: "meshtastic",
	projectName: "meshtastic",
	themeConfig: /** @type {import('@docusaurus/preset-classic').ThemeConfig} */ {
		docs: {
			sidebar: {
				autoCollapseCategories: true,
			},
		},
		navbar: {
			title: "Meshtastic",
			hideOnScroll: true,
			logo: {
				alt: "Meshtastic Logo",
				src: "design/logo/svg/Mesh_Logo_Black.svg",
				srcDark: "design/logo/svg/Mesh_Logo_White.svg",
			},
			items: [
				{
					label: "Docs",
					to: "docs/introduction",
				},
				{
					label: "Downloads",
					to: "downloads",
				},
				{
					label: "About",
					position: "right",
					items: [
						{
							label: "Introduction",
							to: "docs/introduction",
						},
						{
							label: "Getting Started",
							to: "docs/getting-started",
						},
						{
							label: "Contributing",
							to: "docs/contributing",
						},
						{
							label: "Legal",
							to: "docs/legal",
						},
						{
							label: "FAQs",
							to: "docs/faq",
						},
					],
				},
				{
					href: "https://github.com/meshtastic",
					position: "right",
					className: "header-github-link",
					"aria-label": "GitHub repository",
				},
			],
		},
		footer: {
			copyright: `<a href="https://vercel.com/?utm_source=meshtastic&utm_campaign=oss">Powered by ▲ Vercel</a> | Meshtastic® is a registered trademark of Meshtastic LLC. | <a href="/docs/legal">Legal Information</a>.`,
		},
		algolia: {
			appId: "IG2GQB8L3V",
			apiKey: "2e4348812173ec7ea6f7879c7032bb21",
			indexName: "meshtastic",
			contextualSearch: false,
			searchPagePath: "search",
		},
		colorMode: {
			respectPrefersColorScheme: true,
		},
		mermaid: {
			theme: { light: "base", dark: "base" },
			options: {
				themeVariables: {
					primaryColor: "#67EA94",
					primaryTextColor: "var(--tw-prose-headings)",
					primaryBorderColor: "#4D4D4D",
					lineColor: "#EAD667",
					secondaryColor: "#EA67BD",
					tertiaryColor: "#677CEA",
				},
			},
		},
	},
	plugins: [
		() => {
			return {
				name: "docusaurus-tailwindcss",
				configurePostCss(postcssOptions) {
					postcssOptions.plugins.push(require("tailwindcss"));
					postcssOptions.plugins.push(require("autoprefixer"));
					return postcssOptions;
				},
			};
		},
	],
	presets: [
		[
			"@docusaurus/preset-classic",
			/** @type {import('@docusaurus/preset-classic').Options} */
			{
				docs: {
					sidebarPath: require.resolve("./sidebars.js"),
					editUrl: "https://github.com/meshtastic/meshtastic/edit/master/",
					breadcrumbs: false,
					showLastUpdateAuthor: true,
				},
				theme: {
					customCss: require.resolve("./src/css/custom.css"),
				},
			},
		],
	],
	customFields: {
		API_URL: process.env.API_URL,
	},
	markdown: {
		mermaid: true,
	},
	themes: ["@docusaurus/theme-mermaid"],
};

module.exports = config;
