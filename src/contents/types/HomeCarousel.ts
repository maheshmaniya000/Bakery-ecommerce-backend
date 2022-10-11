export interface HomeCarousel {
	images: string[];
	updated: Date;
}

export type FeaturedOn = {
	data: Array<{
		name: string;
		image: string;
	}>;
	updated: Date;
};

export type OurClients = {
	data: Array<{
		name: string;
		testimonial: string;
		image: string;
	}>;
	updated: Date;
};

export type RefundPolicy = {
	data: string;
	updated: Date;
};

export type PrivacyPolicy = {
	data: string;
	updated: Date;
};

export type TNC = {
	data: string;
	updated: Date;
};

export type AboutUs = {
	data: string;
	updated: Date;
};

export type OurStory = {
	image: string;
	description: string;
	updated: Date;
};

export type FAQ = {
	data: Array<{
		question: string;
		answer: string;
	}>;
	updated: Date;
};

export type FAQCakecare = {
	data: Array<{
		question: string;
		answer: string;
	}>;
	updated: Date;
};
