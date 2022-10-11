import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Content } from './schemas/content.schema';

@Injectable()
export class ContentsService implements OnModuleInit {
	constructor(@InjectModel(Content.name) private model: Model<Content>) {}

	async onModuleInit(): Promise<void> {
		const count = await this.model.countDocuments();

		if (count === 0) {
			await this.model.create({
				homeCarousel: undefined,
			});
		}
	}

	async getList(): Promise<Content[]> {
		return this.model.find({});
	}

	async updateHomeCarousel(images: string[]): Promise<Content> {
		const content = await this.model.findOne();

		content.homeCarousel = {
			images,
			updated: new Date(),
		};

		return content.save();
	}

	async updateFeaturedOn(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.featuredOn = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async updateOurClients(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.ourClients = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async updateRefundPolicy(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.refundPolicy = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async updatePrivacyPolicy(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.privacyPolicy = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async updateAboutUs(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.aboutUs = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async updateOurStory({ image, description }): Promise<Content> {
		const content = await this.model.findOne();

		content.ourStory = {
			image,
			description,
			updated: new Date(),
		};

		return content.save();
	}

	async updateTNC(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.tnc = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async updateFAQ(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.faq = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async updateFAQCakecare(payload): Promise<Content> {
		const content = await this.model.findOne();

		content.faqCakecare = {
			data: payload,
			updated: new Date(),
		};

		return content.save();
	}

	async getOne() {
		return this.model.findOne();
	}
}
