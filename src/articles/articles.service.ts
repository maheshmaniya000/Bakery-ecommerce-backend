import { Injectable } from '@nestjs/common';
import { PaginateModel, PaginateResult, PaginateOptions } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';
import { concat, uniq } from 'lodash';

import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Status } from './constants';

@Injectable()
export class ArticlesService {
	constructor(
		@InjectModel(Article.name)
		private articleModel: PaginateModel<ArticleDocument>,
	) {}

	async getList(
		search: string,
		category: string,
		feature: string,
		status: Status,
		options: PaginateOptions,
	): Promise<PaginateResult<Article>> {
		const query = {};

		if (search) {
			query['$or'] = [
				{
					title: {
						$regex: search,
						$options: 'i',
					},
				},
				{
					author: {
						$regex: search,
						$options: 'i',
					},
				},
			];
		}

		if (category) {
			query['categories'] = {
				$in: [category],
			};
		}

		if (feature) query['isFeature'] = true;

		if (status) {
			query['status'] = Status[status];
		}

		return this.articleModel.paginate(query, {
			...options,
			sort: { createdAt: -1 },
		});
	}

	async findBySlug(slug: string): Promise<ArticleDocument> {
		return this.articleModel.findOne({ slug });
	}

	async getDetail(id: string): Promise<Article> {
		return await this.articleModel.findById(id);
	}

	async getCategories(): Promise<string[]> {
		const articles = await this.articleModel.find({}, { categories: 1 });

		return uniq(concat([], ...articles.map((a) => a.categories)));
	}

	async create(createArticleDto: CreateArticleDto): Promise<Article> {
		try {
			const article = new this.articleModel();

			article.title = createArticleDto.title;
			article.author = createArticleDto.author;
			article.categories = createArticleDto.categories;
			article.content = createArticleDto.content;
			article.metaTitle = createArticleDto.metaTitle;
			article.metaDescription = createArticleDto.metaDescription;
			article.slug = createArticleDto.slug;
			article.coverImage = createArticleDto.coverImage;
			article.mainImage = createArticleDto.mainImage;
			article.publishStartAt = createArticleDto.publishStartDate
				? moment(
						`${createArticleDto.publishStartDate}`,
						'YYYY-MM-DD',
				  ).toDate()
				: null;
			article.publishStartTime = createArticleDto.publishStartTime;
			article.publishEndTime = createArticleDto.publishEndTime;
			article.publishEndAt = createArticleDto.publishEndDate
				? moment(
						`${createArticleDto.publishEndDate}`,
						'YYYY-MM-DD',
				  ).toDate()
				: null;
			article.status = createArticleDto.status;

			return article.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async update(
		id: string,
		updateArticleDto: UpdateArticleDto,
	): Promise<Article> {
		try {
			const article = await this.articleModel.findById(id);

			const [slug] = updateArticleDto.slug.split('|');

			article.title = updateArticleDto.title;
			article.author = updateArticleDto.author;
			article.categories = updateArticleDto.categories;
			article.content = updateArticleDto.content;
			article.metaTitle = updateArticleDto.metaTitle;
			article.metaDescription = updateArticleDto.metaDescription;
			article.slug = slug;
			article.coverImage = updateArticleDto.coverImage;
			article.mainImage = updateArticleDto.mainImage;
			article.isFeature = updateArticleDto.isFeature;
			article.publishStartAt = updateArticleDto.publishStartDate
				? moment(
						`${updateArticleDto.publishStartDate}`,
						'YYYY-MM-DD',
				  ).toDate()
				: null;
			article.publishEndAt = updateArticleDto.publishEndDate
				? moment(
						`${updateArticleDto.publishEndDate}`,
						'YYYY-MM-DD',
				  ).toDate()
				: null;
			article.publishStartTime = updateArticleDto.publishStartTime;
			article.publishEndTime = updateArticleDto.publishEndTime;
			article.status = updateArticleDto.status;

			return article.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id, status: Status): Promise<ArticleDocument> {
		return this.articleModel.findOneAndUpdate(
			{ _id: id },
			{
				status,
			},
		);
	}

	async resetArticlesByCategory(categoryId: number): Promise<boolean> {
		try {
			// await this.writeRepository
			// 	.createQueryBuilder()
			// 	.update()
			// 	.set({
			// 		category: 1,
			// 		status: Status.DRAFT,
			// 	})
			// 	.where('category_id = :categoryId', { categoryId })
			// 	.execute();

			return true;
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateCoverImagePath(id: string, path: string): Promise<Article> {
		try {
			const article = await this.articleModel.findById(id);

			article.coverImage = path;

			return article.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
