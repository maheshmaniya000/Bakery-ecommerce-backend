import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { Status } from '../constants';

export type ArticleDocument = Article & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Article {
	@Prop()
	title: string;

	@Prop()
	author: string;

	@Prop({
		default: '',
	})
	coverImage: string;

	@Prop({
		default: '',
	})
	mainImage: string;

	@Prop([String])
	categories: string[];

	@Prop()
	content: string;

	@Prop()
	metaTitle: string;

	@Prop()
	metaDescription: string;

	@Prop({
		unique: true,
	})
	slug: string;

	@Prop()
	publishStartAt: Date;

	@Prop()
	publishStartTime: string;

	@Prop()
	publishEndAt: Date;

	@Prop()
	publishEndTime: string;

	@Prop({
		default: false,
	})
	isFeature: boolean;

	@Prop({
		type: String,
	})
	status: Status;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
