import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult, Types } from 'mongoose';
import { concat, sortBy } from 'lodash';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { Category } from './schemas/category.schema';
import { Product } from 'src/products/schemas/product.schema';

import { StocksService } from 'src/stocks/stocks.service';
import { ProductsService } from 'src/products/products.service';
import { BundlesService } from 'src/bundles/bundles.service';

@Injectable()
export class CategoriesService {
	constructor(
		@InjectModel(Category.name)
		private categoryModel: PaginateModel<Category>,

		private stocksService: StocksService,

		@Inject(forwardRef(() => BundlesService))
		private readonly bundlesService: BundlesService,

		@Inject(forwardRef(() => ProductsService))
		private productsService: ProductsService,
	) {}

	async getList(
		{ status },
		{ page, limit },
	): Promise<PaginateResult<Category>> {
		try {
			const query = {};

			if (status) {
				query['active'] = status === 'true';
			}

			return this.categoryModel.paginate(query, {
				page,
				limit,
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDetail(id) {
		const items = [];
		const ymals = [];

		try {
			const category = await this.categoryModel.findById(id).lean();

			for (const item of category.items || []) {
				if (item.type === 'product') {
					const product = await this.productsService.findById(
						item.product,
					);

					items.push({
						product,
						type: 'product',
					});
				} else if (item.type === 'bundle') {
					const product = await this.bundlesService.getBundle(
						item.product,
					);

					items.push({
						product,
						type: 'bundle',
					});
				}
			}

			for (const item of category.ymals || []) {
				if (item.type === 'product') {
					const product = await this.productsService.findById(
						item.product,
					);

					ymals.push({
						product,
						type: 'product',
					});
				} else if (item.type === 'bundle') {
					const product = await this.bundlesService.getBundle(
						item.product,
					);

					ymals.push({
						product,
						type: 'bundle',
					});
				}
			}

			return { ...category, items, ymals };
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDetailBySlug(slug: string): Promise<Category> {
		try {
			return this.categoryModel.findOne({ slug }).exec();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getYMAL(id: string) {
		try {
			const category = await this.categoryModel
				.findById(id)
				.lean()
				.exec();

			if (!category) {
				return [];
			}

			const list = [];

			for (const item of category.ymals || []) {
				if (item.type === 'product') {
					const product = await this.productsService.findById(
						item.product,
						true,
					);

					if (product.active) {
						const variants = await Promise.all(
							product.variants.map(async (variant) => {
								return {
									...variant,
									stocks: await this.stocksService.getAvailabeStocks(
										product._id,
										variant._id,
									),
								};
							}),
						);
						const stocks =
							await this.stocksService.getAvailabeStocks(
								product._id,
							);

						list.push({
							...product,
							type: 'product',
							variants,
							stocks,
						});
					}
				} else if (item.type === 'bundle') {
					const product = await this.bundlesService.getBundle(
						item.product,
						true,
					);

					if (product.isActive) {
						list.push({
							...product,
							type: 'bundle',
						});
					}
				}
			}

			const soldout = list.filter((item) => {
				if (item.type === 'bundle') return false;

				const variantStocks = item.variants.reduce(
					(acc, cur) => cur.stocks.length + acc,
					0,
				);

				const stock = item.stocks.length + variantStocks;

				return stock === 0;
			});

			const instock = list.filter((item) => {
				if (item.type === 'bundle') return true;

				const variantStocks = item.variants.reduce(
					(acc, cur) => cur.stocks.length + acc,
					0,
				);

				const stock = item.stocks.length + variantStocks;

				return stock > 0;
			});

			return concat(instock, soldout);
		} catch (err) {
			throw new Error(err);
		}
	}

	async getProducts(slug: string, sort = ''): Promise<Product[]> {
		try {
			const category = await this.categoryModel
				.findOne({ slug })
				.lean()
				.exec();

			if (!category) {
				return [];
			}

			const list = [];

			for (const item of category.items || []) {
				if (item.type === 'product') {
					const product = await this.productsService.findById(
						item.product,
						true,
					);

					if (product.active) {
						const variants = await Promise.all(
							product.variants.map(async (variant) => {
								return {
									...variant,
									stocks: await this.stocksService.getAvailabeStocks(
										product._id,
										variant._id,
									),
								};
							}),
						);
						const stocks =
							await this.stocksService.getAvailabeStocks(
								product._id,
							);

						list.push({
							...product,
							type: 'product',
							variants,
							stocks,
						});
					}
				} else if (item.type === 'bundle') {
					const product = await this.bundlesService.getBundle(
						item.product,
						true,
					);

					if (product.isActive) {
						list.push({
							...product,
							type: 'bundle',
						});
					}
				}
			}

			const soldout = list.filter((item) => {
				if (item.type === 'bundle') return false;

				const variantStocks = item.variants.reduce(
					(acc, cur) => cur.stocks.length + acc,
					0,
				);

				const stock = item.stocks.length + variantStocks;

				return stock === 0;
			});

			const instock = list.filter((item) => {
				if (item.type === 'bundle') return true;

				const variantStocks = item.variants.reduce(
					(acc, cur) => cur.stocks.length + acc,
					0,
				);

				const stock = item.stocks.length + variantStocks;

				return stock > 0;
			});

			const data = concat(instock, soldout);

			if (sort === 'name') {
				return sortBy(data, 'name');
			} else if (sort === 'basePrice') {
				return sortBy(data, function (item) {
					if (item.type === 'bundle') return item.price;

					return item.basePrice;
				});
			}

			return data;
		} catch (err) {
			throw new Error(err);
		}
	}

	async create({ name, description }: CreateCategoryDto): Promise<Category> {
		try {
			const category = new this.categoryModel();

			category.name = name;
			category.description = description;
			category.slug = name.toLowerCase().split(' ').join('-');
			category.products = [];
			category.ymal = [];

			return category.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async update(
		id: string,
		{ name, description, items, ymals }: UpdateCategoryDto,
	): Promise<Category> {
		try {
			const category = await this.categoryModel.findById(id);

			category.name = name;
			category.description = description;
			category.slug = name.toLowerCase().split(' ').join('-');
			category.items = items;
			category.ymals = ymals;

			return category.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateProducts(
		categoryIds: string[],
		productId: string,
	): Promise<void> {
		try {
			// remove in products array which already injected
			await this.categoryModel.updateMany(
				{
					_id: {
						$nin: categoryIds.map((id) => new Types.ObjectId(id)),
					},
					"items.product": productId,
				},
				{
					$pull: {
						items: { product: productId, type: 'product' },
						ymals: { product: productId, type: 'product' },
					},
				},
			);

			// attach into products array
			for (let index = 0; index < categoryIds.length; index++) {
				await this.categoryModel.updateOne(
					{
						_id: categoryIds[index],
						"items.product": {
							$ne: productId,
						}
					},
					{
						$push: {
							items: { type: "product", product: productId }
						},
					},
				);
			}
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<void> {
		try {
			await this.categoryModel.updateOne({ _id: id }, { active: status });
		} catch (err) {
			throw new Error(err);
		}
	}
}
