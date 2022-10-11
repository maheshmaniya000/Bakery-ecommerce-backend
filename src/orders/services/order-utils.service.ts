import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';
import { combineLatest, from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { concat, flatten, includes, pick } from 'lodash';

import { Order } from '../schemas/order.schema';
import {
	OrderBundle,
	OrderBundleDocument,
} from '../schemas/order-bundle/order-bundle.schema';
import {
	SliceBox,
	SliceBoxDocument,
} from 'src/slice_boxes/schemas/slice_box.schema';

import { SettingsService } from 'src/settings/settings.service';
import { BundlesService } from 'src/bundles/bundles.service';
import { StocksService } from 'src/stocks/stocks.service';
import { ProductsService } from 'src/products/products.service';
import { SliceBoxesService } from 'src/slice_boxes/slice_boxes.service';
import { OrderBundleService } from './order-bundle/order-bundle.service';
import { OrderBundleProductService } from './order-bundle/order-bundle-product.service';

import { CreateSliceBoxBodyDto } from 'src/slice_boxes/dto/create-slice-box-body.dto';
import { OrderBundlePayloadDto } from '../dto/order-bundle-payload.dto';
import { CreateOrderProductDto } from '../dto/create-order.dto';
import { ProductDto } from '../dto/product.dto';
import { Product } from '../types/types';
import { ProductUsage } from 'src/types/product-usage.interface';

@Injectable()
export class OrderUtilsService implements OnModuleInit {
	constructor(
		@InjectModel(Order.name)
		private orderModel: Model<Order>,

		private readonly settingsService: SettingsService,
		private readonly bundlesService: BundlesService,
		private readonly stocksService: StocksService,
		private readonly productsService: ProductsService,
		private readonly sliceBoxesService: SliceBoxesService,
		private readonly orderBundleService: OrderBundleService,
		private readonly orderBundleProductService: OrderBundleProductService,
	) {}

	onModuleInit() {
		moment.tz.setDefault('Asia/Singapore');
	}

	getProductsUsageOfBundles(orderId: string): Observable<ProductUsage[]> {
		return from(
			this.orderModel.findById(orderId).populate([{ path: 'bundles' }]),
		).pipe(
			switchMap((order) => {
				if (order.bundles.length === 0) return of([]);

				return combineLatest(
					order.bundles.map((bundle) =>
						this.orderBundleService.getProducts(
							(bundle as OrderBundleDocument)._id,
						),
					),
				).pipe(switchMap((products) => of(flatten(products))));
			}),
		);
	}

	getProductsUsageOfSliceBoxes(orderId: string): Observable<ProductUsage[]> {
		return from(
			this.orderModel
				.findById(orderId)
				.populate([{ path: 'sliceBoxes' }]),
		).pipe(
			switchMap((order) => {
				if (order.sliceBoxes.length === 0) return of([]);

				return combineLatest(
					order.sliceBoxes.map((box) =>
						this.sliceBoxesService.getProducts(
							(box as SliceBoxDocument)._id,
						),
					),
				).pipe(switchMap((products) => of(flatten(products))));
			}),
		);
	}

	getProductUsage(orderId: string): Observable<ProductUsage[]> {
		return combineLatest([
			this.getProductsUsageOfBundles(orderId),
			this.getProductsUsageOfSliceBoxes(orderId),
			from(
				this.orderModel
					.findById(orderId)
					.populate([{ path: 'products.product' }]),
			).pipe(
				switchMap((order) =>
					of(
						order.products
							.filter((item) => !!item.product)
							.map((item) => ({
								productId: item.product._id.toString(),
								variantId: item?.variant?._id || '',
								qty: item.quantity,
							})) as ProductUsage[],
					),
				),
			),
		]).pipe(
			switchMap((products) => of(flatten(products))),
			switchMap((products) =>
				of(
					products.reduce((acc, curr) => {
						const existed = acc.findIndex(
							(item) =>
								item.productId === curr.productId &&
								item.variantId === curr.variantId,
						);

						if (existed === -1) {
							return [...acc, { ...curr }];
						}

						acc[existed].qty += curr.qty;

						return acc;
					}, []),
				),
			),
		);
	}

	async getDeliverableDates(
		products: CreateOrderProductDto[],
		sliceBoxes: CreateSliceBoxBodyDto[],
		bundles: OrderBundlePayloadDto[],
	) {
		const sliceBoxProducts = sliceBoxes
			.map((item) =>
				item.products.map((_product) => ({
					productId: _product.product.toString(),
					variantId: '',
					qty: _product.qty * item.qty,
				})),
			)
			.reduce((acc, item) => flatten(concat(acc, item)), []);

		const bundleProducts = await combineLatest(
			bundles.map((item) =>
				from(
					this.bundlesService.getProducts(item.bundle, item.quantity),
				),
			),
		)
			.pipe(switchMap((values) => of(flatten(concat(values)))))
			.toPromise();

		return this.stocksService.getDeliverableDates(
			concat(
				products.map((item) => ({
					variantId: '',
					...pick(item, ['productId', 'variantId', 'qty']),
				})),
				sliceBoxProducts || [],
				bundleProducts || [],
			).reduce((acc, curr) => {
				const existed = acc.findIndex(
					(item) =>
						item.productId === curr.productId &&
						item.variantId === curr.variantId,
				);

				if (existed === -1) {
					return [...acc, { ...curr }];
				}

				acc[existed].qty += curr.qty;

				return acc;
			}, []),
		);
	}

	useProducts(payload: ProductDto[]): Observable<[Product[], number]> {
		if (payload.length === 0) return of([[], 0]);

		return combineLatest(
			payload.map<Observable<Product>>((item) => {
				if (item.itemName) {
					return of({
						price: 0,
						...pick(item, ['itemName', 'price', 'quantity']),
					});
				}

				return from(
					this.productsService.getDetail(item.productId),
				).pipe(
					switchMap((product: any) => {
						const { variantId, categoryId } = item;

						let variant = null;

						if (variantId) {
							variant = product.variants.find(
								({ _id }) =>
									_id.toString() == variantId.toString(),
							);
						}

						return of({
							category: categoryId
								? categoryId
								: product.categories[0]._id,
							product: product._id,
							variant: variant || undefined,
							price: variant ? variant.price : product.price,
							quantity: item.quantity,
							candles: product.isSpecial ? item.candles : 0,
							knifes: product.isSpecial ? item.knifes : 0,
							message: product.isSpecial ? item.message : '',
						});
					}),
				);
			}),
		).pipe(
			switchMap((products) => {
				const total = products.reduce(
					(total, product) =>
						total + product.quantity * product.price,
					0,
				);

				return of([products, total] as [Array<Product>, number]);
			}),
		);
	}

	useSliceBoxes(
		payload: CreateSliceBoxBodyDto[],
	): Observable<[SliceBox[], number]> {
		if (payload.length === 0) return of([[], 0]);

		return combineLatest(
			payload.map((item) => this.sliceBoxesService.createSliceBox(item)),
		).pipe(
			switchMap((boxes) => {
				const total = boxes.reduce(
					(total, box) => total + box.total,
					0,
				);

				return of([boxes, total] as [Array<SliceBox>, number]);
			}),
		);
	}

	useBundles(
		payload: OrderBundlePayloadDto[],
	): Observable<[OrderBundle[], number]> {
		if (payload.length === 0) return of([[], 0]);

		return combineLatest(
			payload.map((item) =>
				from(this.bundlesService.getBundle(item.bundle)).pipe(
					switchMap((bundle) =>
						combineLatest(
							item.products.map((_product) =>
								from(
									this.bundlesService.getBundleProduct(
										_product.product,
									),
								).pipe(
									switchMap((product) =>
										from(
											this.orderBundleProductService.create(
												{
													..._product,
													product,
												},
											),
										),
									),
								),
							),
						).pipe(
							switchMap((products) =>
								from(
									this.orderBundleService.create({
										bundle,
										quantity: item.quantity,
										price: bundle.price,
										products,
									}),
								),
							),
						),
					),
				),
			),
		).pipe(
			switchMap((bundles) => {
				const total = bundles.reduce(
					(total, bundle) => total + bundle.price * bundle.quantity,
					0,
				);

				return of([bundles, total] as [Array<OrderBundle>, number]);
			}),
		);
	}

	usePeakDay(date: Date): Observable<[boolean, number]> {
		return from(this.settingsService.getOne()).pipe(
			switchMap(({ peakDaySurcharge }) => {
				const isPeakDay = includes(
					peakDaySurcharge.dates,
					moment(date).startOf('d').format('YYYY-MM-DD'),
				);

				return of([isPeakDay, peakDaySurcharge.price] as [
					boolean,
					number,
				]);
			}),
		);
	}
}
