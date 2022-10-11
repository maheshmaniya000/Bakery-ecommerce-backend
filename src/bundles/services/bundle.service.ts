import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult } from 'mongoose';
import { BundleDTO } from '../dto/bundle.dto';
import { GetBundlesQueryDto } from '../dto/get-bundles-query.dto';

import { Bundle, BundleDocument } from '../schemas/bundle.schema';

@Injectable()
export class BundleService {
	constructor(
		@InjectModel(Bundle.name)
		private bundleModel: PaginateModel<BundleDocument>,
	) {}

	getList({ page }: GetBundlesQueryDto): Promise<PaginateResult<BundleDocument>> {
		return this.bundleModel.paginate(
			{},
			{
				page,
				sort: {
					createdAt: -1,
				},
			},
		);
	}

	getAvailables(name = '', sortBy = '') {
		const query = {
			isActive: true,
		};
		const sort = {};

		if (name) {
			query['name'] = {
				$regex: name,
				$options: 'i',
			};
		}

		switch (sortBy) {
			case 'name':
			case 'price':
				sort[sortBy] = 1;
				break;

			default:
				sort['createdAt'] = -1;
				break;
		}

		return this.bundleModel
			.find(query)
			.populate({ path: 'products', populate: { path: 'product' } })
			.sort(sort);
	}

	findById(id: string, pure = false) {
		if (pure) {
			return this.bundleModel
				.findById(id)
				.populate({ path: 'products' })
				.lean();
		}

		return this.bundleModel.findById(id).populate({ path: 'products' });
	}

	findBySlug(slug: string) {
		return this.bundleModel
			.findOne({ slug })
			.populate({ path: 'products', populate: { path: 'product' } });
	}

	getDetailbyId(id: string) {
		return this.bundleModel.findById(id).populate({
			path: 'products',
			populate: { path: 'product' },
		});
	}

	create(payload: BundleDTO): Promise<BundleDocument> {
		const bundle = new this.bundleModel(payload);

		bundle.isActive = true;

		return bundle.save();
	}

	update(id: string, payload: Partial<BundleDTO>) {
		return this.bundleModel.findByIdAndUpdate(
			id,
			{
				...payload,
			},
			{ new: true },
		);
	}

	updateStatus(id: string, status: boolean) {
		return this.bundleModel.findByIdAndUpdate(
			id,
			{ isActive: status },
			{ new: true },
		);
	}

	delete(id: string) {
		return this.bundleModel.findByIdAndDelete(id);
	}
}
