import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult, Types } from 'mongoose';
import { sumBy, difference, uniq } from 'lodash';
import * as moment from 'moment';
import { MailerService } from '@nestjs-modules/mailer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { AccountType, Provider } from '../accounts/constants';

import { AuthService } from '../auth/auth.service';
import { OrdersService } from '../orders/orders.service';
import { AccountsService } from '../accounts/accounts.service';
import { ProductsService } from '../products/products.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { RegisterCustomerPayloadDto } from './dto/register-customer-payload.dto';

import { Customer } from './schemas/customer.schema';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
	constructor(
		@InjectModel(Customer.name)
		private customerModel: PaginateModel<Customer>,

		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,

		@Inject(forwardRef(() => OrdersService))
		private readonly ordersService: OrdersService,

		private readonly accountsService: AccountsService,
		private readonly productsService: ProductsService,
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,
	) {}

	async getList({
		keyword = '',
		tags,
		ids = '',
		status = '',
		page = 1,
		limit = 10,
	}: GetCustomersQueryDto): Promise<PaginateResult<any>> {
		try {
			const query = {
				authUniqueNo: {
					$ne: null,
				},
			};

			if (keyword) {
				query['$or'] = [
					{
						firstName: {
							$regex: keyword,
							$options: 'i',
						},
					},
					{
						lastName: {
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

			if (ids) {
				query['_id'] = {
					$in: ids.split(',').map((id) => new Types.ObjectId(id)),
				};
			}

			if (tags) {
				query['tags'] = {
					$in: tags.split(','),
				};
			}

			if (status && status === 'ALL') {
				delete query['authUniqueNo'];
			}

			const data = await this.customerModel.paginate(query, {
				page,
				limit,
				lean: true,
				sort: {
					created: -1,
				},
			});

			return {
				...data,
				docs: await Promise.all(
					data.docs.map(async (item) => {
						const orders =
							await this.ordersService.getListByCustomerId(
								item._id.toString(),
							);

						return {
							...item,
							noOfOrders: orders.length,
							spendings: sumBy(orders, 'totalAmount'),
						};
					}),
				),
			};
		} catch (err) {
			throw new Error(err);
		}
	}

	async create(payload: CreateCustomerDto, update = true): Promise<Customer> {
		try {
			const existed = await this.findByEmail(payload.email);

			if (existed) {
				if (update) {
					existed.firstName = payload.firstName;
					existed.lastName = payload.lastName;
					existed.mobileNo = payload.mobileNo;
				}

				existed.authUniqueNo = payload.authUniqueNo;

				return existed.save();
			}

			const customer = new this.customerModel(payload);

			return customer.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByEmail(email: string): Promise<Customer> {
		try {
			return this.customerModel.findOne({
				email: new RegExp(email, 'i'),
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByAuthUniqueNo(uniqueNo: string): Promise<Customer> {
		try {
			return this.customerModel
				.findOne({ authUniqueNo: uniqueNo })
				.lean();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getTags(): Promise<string[]> {
		const docs = await this.customerModel
			.find({ 'tags.0': { $exists: true } }, { tags: 1 })
			.exec();

		return docs
			.map((doc) => doc.tags)
			.reduce((acc, curr) => uniq([...acc, ...curr]), []);
	}

	async getDetail(id: string) {
		const customer = await this.customerModel.findById(id).lean();

		const orders = await this.ordersService.getList({
			customerId: customer._id.toString(),
			page: 1,
			limit: 100,
		});

		const activeOrders = await this.ordersService.getListByCustomerId(
			customer._id.toString(),
		);

		const accounts = await this.accountsService.findByUniqueNo(
			customer.authUniqueNo,
		);

		return {
			...customer,
			noOfOrders: activeOrders.length,
			spendings: sumBy(activeOrders, 'totalAmount'),
			accounts,
			orders,
		};
	}

	async update(id: string, payload: UpdateCustomerDto) {
		const customer = await this.customerModel.findById(id);

		customer.firstName = payload.firstName;
		customer.lastName = payload.lastName;
		customer.mobileNo = payload.mobileNo;
		customer.tags = payload.tags;

		if (payload.email && customer.email !== payload.email) {
			const existed = await this.customerModel.findOne({
				email: payload.email,
			});

			if (existed) {
				throw new BadRequestException('Email had already used');
			}

			customer.email = payload.email;

			// update accounts
			await this.accountsService.changeEmail(
				payload.email,
				customer.authUniqueNo,
			);
		}

		return customer.save();
	}

	async updateCart(id: string, cart: any[]): Promise<Customer> {
		try {
			const customer = await this.customerModel.findById(id);

			const updated =
				difference(
					cart.map(
						({ product_id, variantProduct }) =>
							`${product_id}${variantProduct?.size}`,
					),
					customer.cart.map(
						({ product_id, variantProduct }) =>
							`${product_id}${variantProduct?.size}`,
					),
				).length > 0;

			customer.cart = cart;

			if (updated) customer.cartUpdatedAt = new Date();

			return customer.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async register(payload: RegisterCustomerPayloadDto): Promise<Customer> {
		const { uniqueNo } = await this.authService.register({
			...payload,
			type: AccountType.CUSTOMER,
			provider: Provider.LOCAL,
		});

		try {
			return this.create({ ...payload, authUniqueNo: uniqueNo });
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<Customer> {
		try {
			const customer = await this.customerModel.findById(id);

			customer.active = status;

			return customer.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async sendResetPasswordEmail(id: string) {
		const customer = await this.customerModel.findById(id);

		await this.authService.sendResetPassword(
			customer.email,
			AccountType.CUSTOMER,
		);
	}

	async getRegisteredCount() {
		return this.customerModel.countDocuments({
			authUniqueNo: { $ne: null },
		});
	}

	async destroy(id: string): Promise<boolean> {
		try {
			const customer = await this.customerModel.findById(id).exec();

			customer.firstName = 'Dummy';
			customer.lastName = '';
			customer.email = 'dummy@dummy.com';
			customer.mobileNo = '0000000';
			customer.active = false;

			await customer.save();

			await this.accountsService.deleteByUniqueNo(customer.authUniqueNo);

			return true;
		} catch (err) {
			throw new Error(err);
		}
	}

	@Cron(CronExpression.EVERY_HOUR)
	async sendRemindCart() {
		const customers = await this.customerModel.find({
			'cart.product_id': { $exists: true },
			email: { $ne: null },
		});
		const WEBSITE_URL = this.configService.get<string>('websiteUrl');

		for (let index = 0; index < customers.length; index++) {
			const customer = customers[index];
			const previous = moment(customer.cartUpdatedAt);
			const items = customer.cart.map((item, cartIdex) => {
				return {
					first: cartIdex === 0,
					quantity: item.quantity,
					name: item.product.name,
					variant: item?.variantProduct?.size || '',
					bigCandles: item.bigCandles || '',
					smallCandles: item.smallCandles || '',
					textOnCake: item.message || '',
					knife: item.knifes || '',
					image:
						item.product.mainImage ||
						'https://assets-Online-bake-house.s3-ap-southeast-1.amazonaws.com/images/placeholder-image.png',
				};
			});

			// if 12 hours
			if (moment().diff(previous, 'h') === 12) {
				await this.mailerService.sendMail({
					to: customer.email,
					subject: 'Are you really leaving our cakes behind?',
					template:
						process.cwd() + '/mail_templates/' + 'remind-cart',
					context: {
						name: customer.firstName + ' ' + customer.lastName,
						items,
						CART_URL: WEBSITE_URL + 'shopping-cart?action=sign-in',
						WEBSITE_URL,
					},
				});
			}

			// if 24 hours, clear cart
			if (moment().diff(previous, 'h') === 24) {
				customer.cart = [];

				await customer.save();
			}
		}
	}
}
