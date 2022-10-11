import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { Article, ArticleSchema } from './schemas/article.schema';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { IsSlugAlreadyExistConstraint } from './validators/is-slug-already-exist.validator';

import { AWSModule } from 'src/aws/aws.module';

@Module({
	imports: [
		ConfigModule,
		AWSModule,

		MongooseModule.forFeatureAsync([
			{
				name: Article.name,
				useFactory: () => {
					const schema = ArticleSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [ArticlesController],
	providers: [ArticlesService, IsSlugAlreadyExistConstraint],
	exports: [ArticlesService],
})
export class ArticlesModule {}
