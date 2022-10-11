import { Injectable } from '@nestjs/common';
import { flatten, orderBy } from 'lodash';
import * as ExcelJS from 'exceljs';
import { combineLatest, from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Order } from './schemas/order.schema';
import { Product } from 'src/products/schemas/product.schema';
import { OrderStatus } from './constants';

import { OrderUtilsService } from './services/order-utils.service';
import { ProductsService } from 'src/products/products.service';

type ProductSold = {
	product: string;
	variant?: string;
	sold: number;
};

@Injectable()
export class ProductSoldsService {
	constructor(
		private readonly orderUtilsService: OrderUtilsService,
		private readonly productsService: ProductsService,
	) {}

	getProductSolds(orders: Order[]): Observable<ProductSold[]> {
		if (orders.length === 0) return of([]);

		return combineLatest(
			orders.map((order) =>
				this.orderUtilsService.getProductUsage(order._id).pipe(
					switchMap((usages) => {
						if (usages.length === 0) return of([]);

						return combineLatest(
							usages.map((usage) =>
								from(
									this.productsService.findById(
										usage.productId,
									),
								).pipe(
									switchMap((product) => {
										const variant = usage.variantId
											? product.variants.find(
													(v) =>
														v._id.toString() ===
														usage.variantId,
											  )
											: '';

										return of({
											product: product.name,
											variant: variant
												? variant.size
												: '',
											sold: usage.qty,
										});
									}),
								),
							),
						);
					}),
				),
			),
		).pipe(
			switchMap((solds) => {
				return of(flatten(solds));
			}),

			switchMap((solds) => {
				return of(
					solds.reduce((acc, curr) => {
						const existed = acc.findIndex(
							(item) =>
								item.product === curr.product &&
								item.variant === curr.variant,
						);

						if (existed === -1) {
							return [...acc, { ...curr }];
						}

						acc[existed].sold += curr.sold;

						return acc;
					}, []),
				);
			}),
			switchMap((solds) => of(orderBy(solds, 'sold', 'desc'))),
		);
	}

	async getProductSoldDetail(orders: Order[], product: Product) {
		const result = [];

		for (const status of Object.values(OrderStatus)) {
			const data = [];

			if (product.variants.length === 0) {
				const solds = await this.getProductSolds(
					orders.filter((order) => order.status === status),
				).toPromise();

				const current = solds.find(
					(sold) =>
						sold.product === product.name && sold.variant === '',
				);

				if (current) {
					data.push({ sum: current.sold, status, variant: '' });
				} else {
					data.push({ sum: 0, status, variant: '' });
				}
			} else {
				for (const variant of product.variants) {
					const solds = await this.getProductSolds(
						orders.filter((order) => order.status === status),
					).toPromise();

					const current = solds.find(
						(sold) =>
							sold.product === product.name &&
							sold.variant === variant.size,
					);

					if (current) {
						data.push({
							sum: current.sold,
							status,
							variant: current.variant,
						});
					} else {
						data.push({ sum: 0, status, variant: variant.size });
					}
				}
			}

			result.push(data);
		}

		return result;
	}

	async generateProductSoldsExport(
		orders: Order[],
	): Promise<ExcelJS.Workbook> {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Product Sold');

		const data = await this.getProductSolds(orders).toPromise();

		worksheet.columns = [
			{
				header: 'Product',
				key: 'product',
				width: 50,
			},
			{
				header: 'Variant',
				key: 'variant',
				width: 30,
			},
			{
				header: 'Sold',
				key: 'sold',
				width: 20,
			},
		] as ExcelJS.Column[];

		worksheet.addRows(data);

		return workbook;
	}
}
