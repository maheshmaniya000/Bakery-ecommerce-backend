import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { combineLatest, from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { BundleProductService } from './services/bundle-product.service';
import { ProductsService } from 'src/products/products.service';
import { BundleService } from './services/bundle.service';
import { StocksService } from 'src/stocks/stocks.service';

import { CreateBundleBodyDto } from './dto/create-bundle-body.dto';
import { UpdateBundleBodyDto } from './dto/update-bundle-body.dto';
import { GetAvailableBundlesQueryDto } from './dto/get-available-bundles-query.dto';
import { GetBundlesQueryDto } from './dto/get-bundles-query.dto';

@Injectable()
export class BundlesService {
	constructor(
		private stocksService: StocksService,
		private bundleService: BundleService,
		@Inject(forwardRef(() => ProductsService))
		private productsService: ProductsService,
		private bundleProductService: BundleProductService,
	) {}

	getBundles(params: GetBundlesQueryDto) {
		return this.bundleService.getList(params);
	}

	getAvailableBundles({ sort, search }: GetAvailableBundlesQueryDto) {
		if (sort === 'name' || sort === 'price') {
			return this.bundleService.getAvailables('', sort);
		}

		if (search) {
			return this.bundleService.getAvailables(search);
		}

		return this.bundleService.getAvailables();
	}

	getBundleDetail(id) {
		return this.bundleService.getDetailbyId(id);
	}

	getBundle(id: string, pure = false) {
		return this.bundleService.findById(id, pure);
	}

	getBundleProduct(id: string) {
		return this.bundleProductService.findById(id);
	}

	getBundleBySlug(slug: string) {
		return this.bundleService.findBySlug(slug);
	}

	getDeliverableDates(id: string, qty = 1) {
		return from(this.bundleService.getDetailbyId(id)).pipe(
			switchMap((product) =>
				from(
					this.stocksService.getDeliverableDates(
						product.products.map((_item) => ({
							productId: _item.product._id,
							variantId: _item.variant || '',
							qty: _item.qty * qty,
						})),
					),
				),
			),
		);
	}

	getProducts(
		id: string,
		qty = 1,
	): Observable<
		Array<{ productId: string; variantId: string; qty: number }>
	> {
		return from(this.bundleService.getDetailbyId(id)).pipe(
			switchMap((product) =>
				of(
					product.products.map((_item) => ({
						productId: _item.product._id.toString(),
						variantId: _item.variant || '',
						qty: _item.qty * qty,
					})),
				),
			),
		);
	}

	updateBundleStatus(id: string, status: boolean) {
		return this.bundleService.updateStatus(id, status);
	}

	createBundle({ products, ...payload }: CreateBundleBodyDto) {
		return combineLatest(
			products.map(({ product, ...payload }) => {
				return from(this.productsService.findById(product)).pipe(
					switchMap((_product) =>
						from(
							this.bundleProductService.create({
								product: _product,
								...payload,
							}),
						),
					),
				);
			}),
		).pipe(
			switchMap(([...products]) =>
				from(
					this.bundleService.create({
						...payload,
						products: products,
					}),
				),
			),
		);
	}

	updateBundle(id: string, { products, ...payload }: UpdateBundleBodyDto) {
		from(this.bundleService.getDetailbyId(id)).subscribe(
			async ({ products }) => {
				await Promise.all(
					products.map((product: any) =>
						this.bundleProductService.deleteById(product._id),
					),
				);
			},
		);

		return combineLatest(
			products.map(({ product, ...payload }) => {
				return from(this.productsService.findById(product)).pipe(
					switchMap((_product) =>
						from(
							this.bundleProductService.create({
								product: _product,
								...payload,
							}),
						),
					),
				);
			}),
		).pipe(
			switchMap(([...products]) =>
				from(
					this.bundleService.update(id, {
						...payload,
						products: products,
					}),
				),
			),
		);
	}

	deleteBundle(id: string) {
		return this.bundleService.delete(id);
	}
}
