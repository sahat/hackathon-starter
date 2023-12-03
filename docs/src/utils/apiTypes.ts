export interface Showcase {
	id: string;
	title: string;
	summary: string;
	body: string;
	createdAt: Date;
	updatedAt: Date;

	tags: ShowcaseTag[];
	nodes?: Node[];
	materials?: Material[];
	author?: Author;
	authorId?: string;
}

export interface ShowcaseTag {
	id: string;
	label: string;
	description: string;
	color: string;

	showcases?: Showcase[];
}

export interface Node {
	id: string;
	latitude: string;
	longitude: string;

	showcase?: Showcase;
	showcaseId?: string;
}

export interface Material {
	id: string;
	name: string;
	details: string;
	image: string;
	url: string;

	showcases?: Showcase[];
}

export interface Author {
	id: string;
	githubUsername: string;
	bio: string;

	showcase?: Showcase[];
}

export interface DeviceFirmwareResource {
	id: string;
	title: string;
	page_url?: string;
	zip_url?: string;
}

export interface FirmwareReleases {
	releases: {
		stable: DeviceFirmwareResource[];
		alpha: DeviceFirmwareResource[];
	};
	pullRequests: DeviceFirmwareResource[];
}
