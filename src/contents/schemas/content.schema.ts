import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import {
	HomeCarousel,
	FeaturedOn,
	OurClients,
	RefundPolicy,
	PrivacyPolicy,
	TNC,
	FAQ,
	AboutUs,
	OurStory,
	FAQCakecare,
} from '../types/HomeCarousel';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Content extends Document {
	@Prop(
		raw({
			images: {
				type: [String],
			},
			updated: {
				type: Date,
			},
		}),
	)
	homeCarousel: HomeCarousel;

	@Prop(
		raw({
			image: String,
			description: String,
			updated: Date,
		}),
	)
	ourStory?: OurStory;

	@Prop(
		raw({
			data: {
				type: [
					{
						name: String,
						image: String,
					},
				],
			},
			updated: {
				type: Date,
			},
		}),
	)
	featuredOn?: FeaturedOn;

	@Prop(
		raw({
			data: {
				type: [
					{
						name: String,
						testimonial: String,
						image: String,
					},
				],
			},
			updated: {
				type: Date,
			},
		}),
	)
	ourClients?: OurClients;

	@Prop(
		raw({
			data: {
				type: [
					{
						question: String,
						answer: String,
					},
				],
			},
			updated: {
				type: Date,
			},
		}),
	)
	faq?: FAQ;

	@Prop(
		raw({
			data: {
				type: [
					{
						question: String,
						answer: String,
					},
				],
			},
			updated: {
				type: Date,
			},
		}),
	)
	faqCakecare?: FAQCakecare;

	@Prop(
		raw({
			data: String,
			updated: Date,
		}),
	)
	refundPolicy?: RefundPolicy;

	@Prop(
		raw({
			data: String,
			updated: Date,
		}),
	)
	privacyPolicy?: PrivacyPolicy;

	@Prop(
		raw({
			data: String,
			updated: Date,
		}),
	)
	aboutUs?: AboutUs;

	@Prop(
		raw({
			data: String,
			updated: Date,
		}),
	)
	tnc?: TNC;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
