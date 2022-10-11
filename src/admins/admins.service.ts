import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { Admin } from './schemas/admin.schema';

import { AuthService } from '../auth/auth.service';

import { CreateAdminPayloadDto } from './dto/create/create-admin-payload.dto';
import { AccountType, Provider } from '../accounts/constants';
import { GetAdminsQueryDto } from './dto/get-admins-query.dto';
import { UpdateAdminPayloadDto } from './dto/update-admin-payload.dto';

@Injectable()
export class AdminsService implements OnModuleInit {
	constructor(
		@InjectModel(Admin.name) private adminModel: PaginateModel<Admin>,

		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
	) {}

	async onModuleInit(): Promise<void> {
		const count = await this.adminModel.countDocuments().exec();

		if (count === 0) {
			await this.create({
				name: 'Administrator',
				email: 'admin@admin.com',
				password: '12345678',
				isSuper: true,
			});
		}
	}

	async findByAuthUniqueNo(uniqueNo: string): Promise<Admin> {
		try {
			return this.adminModel.findOne({ authUniqueNo: uniqueNo }).lean();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getList({ page = 1, limit = 10, keyword }: GetAdminsQueryDto) {
		try {
			const query = {};

			if (keyword) {
				query['$or'] = [
					{
						name: {
							$regex: keyword,
							$options: 'i',
						},
					},
					{
						email: {
							$regex: keyword,
							$options: 'i',
						},
					},
					{
						mobileNo: {
							$regex: keyword,
							$options: 'i',
						},
					},
				];
			}

			return this.adminModel.paginate(query, {
				page,
				limit,
				sort: {
					created: -1,
				},
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	async create({
		name,
		isSuper,
		...payload
	}: CreateAdminPayloadDto): Promise<Admin> {
		const { uniqueNo } = await this.authService.register({
			...payload,
			provider: Provider.LOCAL,
			type: AccountType.ADMIN,
		});

		try {
			const admin = new this.adminModel({
				name,
				isSuper,
				authUniqueNo: uniqueNo,
				...payload,
			});

			return admin.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDetail(id) {
		return this.adminModel.findById(id);
	}

	async update(id: string, payload: UpdateAdminPayloadDto) {
		try {
			const admin = await this.adminModel.findById(id);

			admin.name = payload.name;
			admin.mobileNo = payload.mobileNo;

			return admin.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<Admin> {
		try {
			const admin = await this.adminModel.findById(id);

			admin.active = status;

			return admin.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
