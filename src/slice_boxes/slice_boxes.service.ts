import { Injectable } from '@nestjs/common';
import { of, from, combineLatest, Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CreateSliceBoxBodyDto } from './dto/create-slice-box-body.dto';

import { SliceBoxService } from './services/slice_box.service';
import { SliceBoxProductSerivce } from './services/slice_box_product.service';
import { SliceBoxOptionsService } from 'src/slice_box_options/slice_box_options.service';
import { ProductsService } from 'src/products/products.service';

import { SliceBoxOption } from 'src/slice_box_options/schemas/slice_box_option.schema';
import { SliceBoxProduct } from './schemas/slice_box_product.schema';
import { ProductUsage } from 'src/types/product-usage.interface';

@Injectable()
export class SliceBoxesService {
	constructor(
		private productsService: ProductsService,
		private sliceBoxService: SliceBoxService,
		private sliceBoxProductService: SliceBoxProductSerivce,
		private sliceBoxOptionsService: SliceBoxOptionsService,
	) {}

	createSliceBox(payload: CreateSliceBoxBodyDto) {
		return combineLatest([
			// slice box option
			from(this.sliceBoxOptionsService.getOption(payload.option)),

			// slice box product
			...payload.products.map(({ product, qty }) => {
				return of({ product, qty }).pipe(
					// get product by id
					switchMap(({ product, qty }) =>
						combineLatest([
							from(this.productsService.findById(product)),
							of(qty),
						]),
					),

					switchMap(([product, qty]) =>
						this.sliceBoxProductService.create({
							product,
							price: product.price,
							qty,
						}),
					),
				);
			}),
		]).pipe(
			switchMap(([option, ...products]) => {
				const subtotal = (products as SliceBoxProduct[]).reduce(
					(acc, curr) => acc + curr.product.price * curr.qty,
					0,
				);

				return from(
					this.sliceBoxService.create({
						option: option as SliceBoxOption,
						products: products as SliceBoxProduct[],
						qty: payload.qty,
						total: subtotal * payload.qty,
					}),
				);
			}),

			catchError((err) => {
				throw new Error(err);
			}),
		);
	}

	getProducts(id: string): Observable<ProductUsage[]> {
		return from(this.sliceBoxService.getDetailById(id)).pipe(
			switchMap((box) =>
				of(
					box.products.map((item) => ({
						productId: item.product._id.toString(),
						variantId: '',
						qty: item.qty * box.quantity,
					})),
				),
			),
		);
	}
}
