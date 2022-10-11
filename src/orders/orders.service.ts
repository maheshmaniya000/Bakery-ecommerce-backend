import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult, Types } from 'mongoose';
import {
	omit,
	includes,
	uniq,
	isEmpty,
	concat,
	differenceBy,
	intersectionBy,
	flatten,
} from 'lodash';
import * as moment from 'moment-timezone';
import { Request } from 'express';
import Stripe from 'stripe';
import * as ExcelJS from 'exceljs';
import * as numeral from 'numeral';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CreateOrderDto } from './dto/create-order.dto';
import { ProductDto } from './dto/product.dto';
import { DeliveryDto } from './dto/delivery.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CalcSummaryDto } from './dto/calc-summary.dto';
import { CreateAdhocOrderDto } from './dto/create-adhoc-order.dto';
import { UpdateOrderInfoDto } from './dto/update-order-info.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { UpdateGiftTagDto } from './dto/update-gift-tag-dto';
import { UpdateSpecialInfo } from './dto/update-special-info.dto';

import { Order } from './schemas/order.schema';
import { Product as ProductModel } from 'src/products/schemas/product.schema';

import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { DeliveryMethodsService } from '../delivery_methods/delivery_methods.service';
import { OutskirtsService } from '../outskirts/outskirts.service';
import { DeliveryZonesService } from '../delivery_zones/delivery_zones.service';
import { StocksService } from '../stocks/stocks.service';
import { StripeService } from '../stripe/stripe.service';
import { HitpayService } from '../hitpay/hitpay.service';
import { SettingsService } from '../settings/settings.service';
import { PromoCodesService } from '../promo_codes/promo_codes.service';
import { ReportsService } from 'src/reports/reports.service';
import { PackingSlipService } from './packing-slip.service';
import { ProductSoldsService } from './product-solds.service';
import { BackupOrderService } from './services/backup-order.service';
import { OrderUtilsService } from './services/order-utils.service';
import { ValidatedEmailsService } from 'src/validated_emails/validated_emails.service';
import { BundlesService } from 'src/bundles/bundles.service';
import { OrderBundleService } from './services/order-bundle/order-bundle.service';
import { OrderReportsService } from './services/orer-reports.service';

import { ExportType, OrderStatus, OrderType, PaymentType } from './constants';
import { Product, Delivery, CartItem } from './types/types';
import { generateOrderNo, dateBetweenQuery } from 'src/utils/misc';
import { PromoCodeType } from 'src/promo_codes/constants';
import { ExportOrdersDto } from './dto/export-orders.dto';
import {
	DeliveryMethodEmail,
	DeliveryTimeSlot,
} from 'src/delivery_methods/constants';
import { AccountType } from 'src/accounts/constants';
import { ServiceUnavailableException } from '@nestjs/common';
import { combineLatest, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DeliveryMethodTime } from 'src/delivery_methods/schemas/delivery_method_time.schema';

@Injectable()
export class OrdersService implements OnModuleInit {
	constructor(
		@InjectModel(Order.name) private orderModel: PaginateModel<Order>,

		@Inject(forwardRef(() => CustomersService))
		private readonly customersService: CustomersService,
		@Inject(forwardRef(() => ProductsService))
		private readonly productsService: ProductsService,
		private readonly categoriesService: CategoriesService,
		private readonly outskirtsService: OutskirtsService,
		private readonly deliveryMethodsService: DeliveryMethodsService,
		private readonly deliveryZonesService: DeliveryZonesService,
		private readonly stocksService: StocksService,
		private readonly stripeService: StripeService,
		private readonly hitpayService: HitpayService,
		private readonly settingsService: SettingsService,
		@Inject(forwardRef(() => PromoCodesService))
		private readonly promoCodesService: PromoCodesService,
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,
		private readonly reportsService: ReportsService,
		private readonly packingSlipService: PackingSlipService,
		private readonly productSoldsService: ProductSoldsService,
		private readonly backupOrderService: BackupOrderService,
		private readonly orderUitlsService: OrderUtilsService,
		private readonly validatedEmailsService: ValidatedEmailsService,
		private readonly bundlesService: BundlesService,
		private readonly orderBundleService: OrderBundleService,
		private readonly orderReportsService: OrderReportsService,
	) { }

	onModuleInit() {
		moment.tz.setDefault('Asia/Singapore');
	}

	async getList(params: GetOrdersQueryDto): Promise<PaginateResult<Order>> {
		try {
			const { page, limit } = params;
			const query = this.getQueryFromParams(params);

			const result = [];

			const orders = await this.orderModel.paginate(query, {
				page,
				limit,
				sort: {
					created: -1,
				},
			});

			for (let index = 0; index < orders.docs.length; index++) {
				result.push(await this.getDetail(orders.docs[index]._id));
			}

			return {
				...orders,
				docs: result,
			};
		} catch (err) {
			throw new Error(err);
		}
	}

	async generatePackingSlip(startDate: string, endDate: string) {
		const {
			deliverySettings: { deliveryDays },
		} = await this.settingsService.getOne();

		const query = {
			status: {
				$in: [
					OrderStatus.CONFIRM,
					OrderStatus.DELIVERING,
					OrderStatus.READY_FOR_COLLECTION,
				],
			},
			orderDate: dateBetweenQuery(
				startDate,
				endDate ||
				moment(startDate)
					.startOf('d')
					.add(deliveryDays, 'days')
					.format('YYYY-MM-DD'),
			),
		};

		const orders = await this.orderModel
			.find(query)
			.sort({
				created: -1,
			})
			.populate('delivery.method products.product deliveryZone')
			.populate({
				path: 'sliceBoxes',
				populate: [
					{
						path: 'products',
						populate: { path: 'product' },
					},
					{
						path: 'option',
					},
				],
			})
			.populate({
				path: 'bundles',
				populate: [
					{ path: 'bundle' },
					{
						path: 'products',
						populate: [
							{
								path: 'product',
								populate: [{ path: 'product' }],
							},
						],
					},
				],
			})
			.exec();

		return this.packingSlipService.generate(orders);
	}

	async getListByCustomerId(customerId) {
		const query = {
			status: {
				$nin: [
					OrderStatus.PENDING,
					OrderStatus.CANCELLED,
					OrderStatus.EXPIRED,
				],
			},
		};

		query['customer'] = new Types.ObjectId(customerId);

		return this.orderModel.find(query).sort({ created: -1 }).lean();
	}

	async customExportExcel(
		params: GetOrdersQueryDto,
	): Promise<ExcelJS.Workbook> {
		const query = this.getQueryFromParams(params);

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Orders');
		const orders = await this.orderModel
			.find(query)
			.sort({
				created: -1,
			})
			.populate('customer delivery.method deliveryZone products.product')
			.populate({
				path: 'sliceBoxes',
				populate: [
					{
						path: 'products',
						populate: { path: 'product' },
					},
					{
						path: 'option',
					},
				],
			})
			.populate({
				path: 'bundles',
				populate: [
					{ path: 'bundle' },
					{
						path: 'products',
						populate: [
							{
								path: 'product',
								populate: [{ path: 'product' }],
							},
						],
					},
				],
			});

		const data = [];

		// make columns
		worksheet.columns = this.reportsService.getOrdersMasterColumns();

		orders.forEach((order) => {
			const values = this.orderReportsService.mapperForReport(order);

			const customProducts = order.products.map((product) =>
				this.orderReportsService.mapperProductForReport(product),
			);
			const customSliceBoxes = order.sliceBoxes.map((box) =>
				this.orderReportsService.mapperSliceBoxesForReport(box),
			);
			const customBundles = order.bundles.map((bundle) =>
				this.orderReportsService.mapperBundleForReport(bundle),
			);

			concat(
				customProducts,
				customSliceBoxes,
				flatten(customBundles),
			).forEach((product) => {
				data.push({
					...values,
					...product,
				});
			});
		});

		worksheet.addRows(data);

		return workbook;
	}

	async generateExcel({
		type,
		startDate,
		endDate,
	}: ExportOrdersDto): Promise<ExcelJS.Workbook> {
		switch (type) {
			case ExportType.MASTER:
				return this.generateMasterExport(startDate, endDate);

			case ExportType.PACKING:
				return this.generatePackingExport(startDate, endDate);

			case ExportType.DELIVERY:
				return this.generateDeliveryExport(startDate, endDate);

			case ExportType.WHOLECAKES:
				return this.generateWholecakeExport(startDate, endDate);

			case ExportType.PRODUCT_SOLD:
				return this.generateProductSoldsExport(startDate, endDate);

			default:
				return null;
		}
	}

	async generateMasterExport(
		startDate: string,
		endDate: string,
	): Promise<ExcelJS.Workbook> {
		const {
			deliverySettings: { deliveryDays },
		} = await this.settingsService.getOne();

		const query = {
			status: {
				$ne: OrderStatus.PENDING,
			},
			orderDate: dateBetweenQuery(
				startDate,
				endDate ||
				moment(startDate)
					.startOf('d')
					.add(deliveryDays, 'days')
					.format('YYYY-MM-DD'),
			),
		};

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Orders');
		const orders = await this.orderModel
			.find(query)
			.sort({
				created: -1,
			})
			.populate(
				'customer promoCode delivery.method deliveryZone products.product',
			)
			.populate({
				path: 'sliceBoxes',
				populate: [
					{
						path: 'products',
						populate: { path: 'product' },
					},
					{
						path: 'option',
					},
				],
			})
			.populate({
				path: 'bundles',
				populate: [
					{ path: 'bundle' },
					{
						path: 'products',
						populate: [
							{
								path: 'product',
								populate: [{ path: 'product' }],
							},
						],
					},
				],
			});

		const data = [];

		// make columns
		worksheet.columns = this.reportsService.getOrdersMasterColumns();

		orders.forEach((order) => {
			const values = this.orderReportsService.mapperForReport(order);

			const customProducts = order.products.map((product) =>
				this.orderReportsService.mapperProductForReport(product),
			);
			const customSliceBoxes = order.sliceBoxes.map((box) =>
				this.orderReportsService.mapperSliceBoxesForReport(box),
			);
			const customBundles = order.bundles.map((bundle) =>
				this.orderReportsService.mapperBundleForReport(bundle),
			);

			concat(
				customProducts,
				customSliceBoxes,
				flatten(customBundles),
			).forEach((product) => {
				data.push({
					...values,
					...product,
				});
			});
		});

		worksheet.addRows(data);

		const itemCol = worksheet.getColumn('L');

		itemCol.eachCell(function (cell) {
			cell.alignment = { wrapText: true };
		});

		return workbook;
	}

	async generateProductSoldsExport(startDate: string, endDate: string) {
		const {
			deliverySettings: { deliveryDays },
		} = await this.settingsService.getOne();

		const query = {
			status: {
				$nin: [
					OrderStatus.PENDING,
					OrderStatus.EXPIRED,
					OrderStatus.CANCELLED,
				],
			},
			orderDate: dateBetweenQuery(
				startDate,
				endDate ||
				moment(startDate)
					.startOf('d')
					.add(deliveryDays, 'days')
					.format('YYYY-MM-DD'),
			),
		};

		const orders = await this.orderModel.find(query).exec();

		return this.productSoldsService.generateProductSoldsExport(orders);
	}

	async updateSpeicalInfo(
		id: string,
		payload: UpdateSpecialInfo,
	): Promise<boolean> {
		const order = await this.orderModel.findById(id);

		if (!order || order.status !== OrderStatus.CONFIRM) {
			return false;
		}

		const index = order.products.findIndex(
			(_item) => _item.product.toString() === payload.product,
		);

		if (index > -1) {
			order.products[index].candles = payload.candles;
			order.products[index].knifes = payload.knife ? 1 : 0;
			order.products[index].message = payload.message;

			await order.save();

			return true;
		}

		return false;
	}

	async generatePackingExport(
		startDate: string,
		endDate: string,
	): Promise<ExcelJS.Workbook> {
		const {
			deliverySettings: { deliveryDays },
		} = await this.settingsService.getOne();

		const query = {
			status: {
				$in: [
					OrderStatus.CONFIRM,
					OrderStatus.DELIVERING,
					OrderStatus.READY_FOR_COLLECTION,
				],
			},
			orderDate: dateBetweenQuery(
				startDate,
				endDate ||
				moment(startDate)
					.startOf('d')
					.add(deliveryDays, 'days')
					.format('YYYY-MM-DD'),
			),
		};

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Orders');
		const orders = await this.orderModel
			.find(query)
			.sort({
				created: -1,
			})
			.populate(
				'customer promoCode delivery.method deliveryZone products.product',
			)
			.populate({
				path: 'sliceBoxes',
				populate: [
					{
						path: 'products',
						populate: { path: 'product' },
					},
					{
						path: 'option',
					},
				],
			})
			.populate({
				path: 'bundles',
				populate: [
					{ path: 'bundle' },
					{
						path: 'products',
						populate: [
							{
								path: 'product',
								populate: [{ path: 'product' }],
							},
						],
					},
				],
			});

		const data = [];

		// make columns
		worksheet.columns = this.reportsService.getOrdersPackingColumns();

		orders.forEach((order) => {
			const values = this.orderReportsService.mapperForReport(order);

			const customProducts = order.products.map((product) =>
				this.orderReportsService.mapperProductForReport(product),
			);
			const customSliceBoxes = order.sliceBoxes.map((box) =>
				this.orderReportsService.mapperSliceBoxesForReport(box),
			);
			const customBundles = order.bundles.map((bundle) =>
				this.orderReportsService.mapperBundleForReport(bundle),
			);

			concat(
				customProducts,
				customSliceBoxes,
				flatten(customBundles),
			).forEach((product) => {
				data.push({
					...values,
					...product,
				});
			});
		});

		worksheet.addRows(data);

		const itemCol = worksheet.getColumn('G');

		itemCol.eachCell(function (cell) {
			cell.alignment = { wrapText: true };
		});

		return workbook;
	}

	async generateDeliveryExport(
		startDate: string,
		endDate: string,
	): Promise<ExcelJS.Workbook> {
		const {
			deliverySettings: { deliveryDays },
		} = await this.settingsService.getOne();

		const query = {
			status: { $in: [OrderStatus.CONFIRM, OrderStatus.DELIVERING] },
			orderDate: dateBetweenQuery(
				startDate,
				endDate ||
				moment(startDate)
					.startOf('d')
					.add(deliveryDays, 'days')
					.format('YYYY-MM-DD'),
			),
			'delivery.postalCode': { $ne: '' },
		};

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Orders');
		const orders = await this.orderModel
			.find(query)
			.sort({
				created: -1,
			})
			.populate(
				'customer promoCode delivery.method deliveryZone products.product',
			);

		const data = [];

		// make columns
		worksheet.columns = this.reportsService.getOrdersDeliveryColumns();

		orders.forEach((order) => {
			const values = this.orderReportsService.mapperForReport(order);

			data.push(values);
		});

		worksheet.addRows(data);

		return workbook;
	}

	async generateWholecakeExport(
		startDate: string,
		endDate: string,
	): Promise<ExcelJS.Workbook> {
		const {
			deliverySettings: { deliveryDays },
		} = await this.settingsService.getOne();

		const wholeCakes = await this.categoriesService.getDetailBySlug(
			'whole-cakes',
		);

		const query = {
			status: {
				$in: [
					OrderStatus.CONFIRM,
					OrderStatus.DELIVERING,
					OrderStatus.READY_FOR_COLLECTION,
				],
			},
			orderDate: dateBetweenQuery(
				startDate,
				endDate ||
				moment(startDate)
					.startOf('d')
					.add(deliveryDays, 'days')
					.format('YYYY-MM-DD'),
			),
		};

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Orders');
		const orders = await this.orderModel
			.find(query)
			.sort({
				created: -1,
			})
			.populate(
				'customer promoCode delivery.method deliveryZone products.product',
			)
			.populate({
				path: 'sliceBoxes',
				populate: [
					{
						path: 'products',
						populate: { path: 'product' },
					},
					{
						path: 'option',
					},
				],
			})
			.populate({
				path: 'bundles',
				populate: [
					{ path: 'bundle' },
					{
						path: 'products',
						populate: [
							{
								path: 'product',
								populate: [{ path: 'product' }],
							},
						],
					},
				],
			});

		const data = [];

		// make columns
		worksheet.columns = this.reportsService.getOrdersWholeCakeColumns();

		orders.forEach((order) => {
			const values = this.orderReportsService.mapperForReport(order);

			const customProducts = order.products.map((product) =>
				this.orderReportsService.mapperProductForReport(product),
			);

			const customSliceBoxes = order.sliceBoxes.map((box) =>
				this.orderReportsService.mapperSliceBoxesForReport(box),
			);

			const customBundles = order.bundles.map((bundle) =>
				this.orderReportsService.mapperBundleForReport(bundle),
			);

			concat(
				customProducts,
				customSliceBoxes,
				flatten(customBundles),
			).map(({ categories, ...detail }) => {
				if (includes(categories, wholeCakes._id.toString())) {
					data.push({ ...values, ...detail });
				}
			});
		});

		worksheet.addRows(data);

		return workbook;
	}

	async calcSummary({ cart, bundles = [] }: CalcSummaryDto) {
		// const dates = await this.stocksService.getDeliverableDates(cart);
		const settings = await this.settingsService.getOne();

		// reduced duplicate products into one
		const products = cart.reduce((acc, curr) => {
			const existed = acc.findIndex(
				(item) => item.productId === curr.productId,
			);

			if (existed === -1) {
				return [...acc, { ...curr }];
			}

			acc[existed].qty += curr.qty;

			return acc;
		}, []);

		const productsAmount = (
			await Promise.all(
				products.map(async (item) => {
					const price = await this.productsService.getPrice({
						...item,
					});

					return item.qty * price;
				}),
			)
		).reduce((acc, curr) => acc + curr, 0);

		const bundlesAmount = await combineLatest(
			bundles.map((item) =>
				from(this.bundlesService.getBundle(item.bundle)).pipe(
					switchMap((bundle) => of(bundle.price * item.quantity)),
				),
			),
		)
			.pipe(
				switchMap((amounts) =>
					of(amounts.reduce((acc, curr) => acc + curr, 0)),
				),
			)
			.toPromise();

		const subtotal = productsAmount + (bundlesAmount || 0);

		const response = {
			productsAmount: subtotal,
			deliverableDates: [],
			minAmountCart: settings.minAmount,
			peakDaySurcharge: settings?.peakDaySurcharge?.price || 0,
			freeDelivery: false,
			deliveryDiscount: 0,
		};

		if (
			settings.minForDelivery.active &&
			subtotal >= settings.minForDelivery.minAmount
		) {
			if (settings.minForDelivery.freeDelivery) {
				response['freeDelivery'] = true;
			} else {
				response['deliveryDiscount'] =
					settings.minForDelivery.deliveryDiscount;
			}
		}

		return response;
	}

	getDeliverableDates({ cart, bundles = [] }: CalcSummaryDto) {
		return this.orderUitlsService.getDeliverableDates(
			cart,
			[],
			bundles.map((bundle) => ({ ...bundle, products: [] })),
		);
	}

	async getDeliveryFee(
		methodId,
		timeId = '',
		postalCode = '',
	): Promise<number> {
		const deliveryfee = await this.deliveryMethodsService.updatedeliveryfee(methodId)			
		return this.deliveryMethodsService.getPrice({
			id: methodId,
			timeId,
			postalCode,
		});
	}

	async updateStatus(ids: string[], status: OrderStatus): Promise<boolean> {
		try {
			for (let index = 0; index < ids.length; index++) {
				const order = await this.orderModel.findById(ids[index]);

				order.status = status;

				await order.save();

				if (order.sender.email) {
					setTimeout(() => {
						this.sendEmail(order._id);
					}, 500);
				}
			}

			return true;
		} catch (err) {
			throw new Error(err);
		}
	}

	async createOrder({
		products,
		delivery,
		customerId,
		sender,
		recipient,
		orderDate,
		usedCode,
		sliceBoxes = [],
		bundles = [],
		...payload
	}: CreateOrderDto): Promise<any> {
		const settings = await this.settingsService.getOne();
		let promoCode = null;
		let amount = 0,
			discount = 0;

		const deliverableDates = await this.orderUitlsService.getDeliverableDates(
			products,
			sliceBoxes,
			bundles,
		);

		const validDate = deliverableDates.find(
			(date) => date.date === orderDate && date.valid === true,
		);

		if (!validDate) {
			throw new BadRequestException(
				'Sorry, one of item is out of stock.',
			);
		}

		let customer = await this.customersService.findByEmail(sender.email);

		if (!customer) {
			customer = await this.customersService.create(sender);
		}

		const [
			customProducts,
			customProductsTotal,
		] = await this.orderUitlsService
			.useProducts(
				products.map((product) => ({
					...product,
					quantity: product.qty,
				})),
			)
			.toPromise();

		const [
			customSliceBoxes,
			customSliceBoxesTotal,
		] = await this.orderUitlsService.useSliceBoxes(sliceBoxes).toPromise();

		const [
			customBundles,
			customBundlesTotal,
		] = await this.orderUitlsService.useBundles(bundles).toPromise();

		let customDelivery = await this.deliveryMapper(delivery);

		const productsTotal =
			customProductsTotal + customSliceBoxesTotal + customBundlesTotal;

		let subTotal = productsTotal + customDelivery.price;

		let usedFreeDelivery = false;
		const usedPeakDaySurcharge =
			validDate.isPeakDay && customDelivery.postalCode ? true : false;

		if (productsTotal < settings.minAmount) {
			throw new BadRequestException(
				'Minimum amount to checkout is $' + settings.minAmount,
			);
		}

		// check there is min spending for free delivery
		if (settings.minForDelivery.active) {
			if (productsTotal >= settings.minForDelivery.minAmount) {
				usedFreeDelivery = true;

				if (settings.minForDelivery.freeDelivery) {
					subTotal = productsTotal; // delivery fee is zero
					customDelivery = { ...customDelivery, price: 0 };
				} else {
					const fee =
						customDelivery.price -
						settings.minForDelivery.deliveryDiscount;

					subTotal = productsTotal + (fee > 0 ? fee : 0);
					customDelivery.price = fee > 0 ? fee : 0;
				}
			}
		}

		const totalAmount = parseFloat(
			(
				subTotal +
				(usedPeakDaySurcharge ? settings.peakDaySurcharge.price : 0)
			).toFixed(2),
		);

		// check code is valid
		if (usedCode) {
			await this.promoCodesService.isValid(
				usedCode,
				productsTotal,
				customerId ? new Types.ObjectId(customerId) : customer._id,
			);

			promoCode = await this.promoCodesService.findByCode(usedCode);

			discount =
				promoCode.type === PromoCodeType.PERCENTAGE
					? parseFloat(
						(
							(subTotal -
								(!promoCode.isIncludeDeliveryFee
									? usedFreeDelivery
										? 0
										: customDelivery.price
									: 0)) *
							(promoCode.amount / 100)
						).toFixed(2),
					)
					: promoCode.amount;

			amount = totalAmount - discount;
		} else {
			amount = totalAmount;
		}

		// created state
		let created = null;
		let counter = 0;

		do {
			try {
				const latest = await this.getByLatestUniqueNo();

				created = new this.orderModel({
					sender,
					recipient,
					orderDate,
					...payload,
				});

				created.customer = customerId
					? new Types.ObjectId(customerId)
					: customer._id;
				created.products = customProducts;
				created.sliceBoxes = customSliceBoxes;
				created.bundles = customBundles;
				created.delivery = customDelivery;
				created.deliveryZone = created.delivery.postalCode
					? (
						await this.deliveryZonesService.findByPostalCode(
							created.delivery.postalCode
								.toString()
								.substr(0, 2),
						)
					)?._id
					: null;
				created.uniqueNo = generateOrderNo(latest?.uniqueNo);
				created.usedCode = usedCode;
				created.usedFreeDelivery = usedFreeDelivery;
				created.status = OrderStatus.PENDING;
				created.type = OrderType.NORMAL;
				created.totalAmount = totalAmount;
				created.unpaid = totalAmount;

				if (usedPeakDaySurcharge) {
					created.peakDaySurcharge = settings.peakDaySurcharge.price;
				}

				await created.save();
			} catch (err) {
				// reset
				created = null;
			}

			counter++;
		} while (!created && counter <= 5);

		if (!created) throw new ServiceUnavailableException();

		// for giftcard scenario
		if (usedCode && amount <= 0) {
			created.status = OrderStatus.CONFIRM;

			if (promoCode) {
				created.promoCode = promoCode._id;
				created.discount = discount;
				created.unpaid = totalAmount - discount;

				await this.promoCodesService.used(
					promoCode._id,
					usedCode,
					customerId,
				);
			}

			await created.save();
		}

		if (created.status === OrderStatus.CONFIRM) {
			await this.backupOrderService.create(created);

			if (created.sender.email) {
				setTimeout(() => {
					this.sendEmail(created._id);
				}, 300000);
			}
		}

		return this.getDetail(created._id);
	}

	async getStripeSession(id: string) {
		const order = await this.getDetail(id);

		if (
			order.status !== OrderStatus.PENDING &&
			order.status !== OrderStatus.PENDING_PAYMENT
		) {
			throw new BadRequestException();
		}

		const isValid = await this.isValidDate(
			order.orderDate,
			order.products
				.filter((item) => !!item.product)
				.map((product) => ({
					productId: product.product._id,
					variantId: product.variant?._id || '',
					qty: product.quantity,
				})),
		);

		if (!isValid && order.status === OrderStatus.PENDING) {
			throw new BadRequestException(
				'Sorry, one of item is out of stock.',
			);
		}

		const amount = await this.getPayableAmount(id);

		if (order.status === OrderStatus.PENDING_PAYMENT) {
			return this.stripeService.getPaymentIntent({
				order,
				amount,
			});
		}

		return this.stripeService.getPaymentIntent({
			order,
			amount,
		});
	}

	async getHitpaySession(id: string) {
		const order = await this.getDetail(id);

		if (
			order.status !== OrderStatus.PENDING &&
			order.status !== OrderStatus.PENDING_PAYMENT
		) {
			throw new BadRequestException();
		}

		const isValid = await this.isValidDate(
			order.orderDate,
			order.products
				.filter((item) => !!item.product)
				.map((product) => ({
					productId: product.product._id,
					variantId: product.variant?._id || '',
					qty: product.quantity,
				})),
		);

		if (!isValid && order.status === OrderStatus.PENDING) {
			throw new BadRequestException(
				'Sorry, one of item is out of stock.',
			);
		}

		const amount = await this.getPayableAmount(id);

		if (order.status === OrderStatus.PENDING_PAYMENT) {
			const { data } = await this.hitpayService.createRequest(
				order,
				amount,
			);

			return { url: data.url };
		}

		const { data } = await this.hitpayService.createRequest(order, amount);

		return { url: data.url };
	}

	async processStripeWebhook(req: Request): Promise<void> {
		const event = await this.stripeService.getEvent(req);

		try {
			let transactionFee = 0;

			switch (event.type) {
				case 'payment_intent.succeeded':
					const intent: Stripe.PaymentIntent = event.data
						.object as Stripe.PaymentIntent;

					if (intent.charges.data.length === 1) {
						const {
							fee,
						} = await this.stripeService.getBalanceTransaction(
							intent.charges.data[0]
								.balance_transaction as string,
						);

						transactionFee = fee / 100;
					}

					const existed = await this.findByPaymentIntent(intent.id);

					if (existed) return;

					await this.paymentSuccess(
						intent.metadata.orderId.toString(),
						PaymentType.STRIPE,
						intent,
						intent.amount_received / 100,
						transactionFee,
					);
					break;

				case 'charge.refunded':
					const refund: any = event.data.object;
					const refunds = refund.refunds;

					// last refund in first of array
					const currentRefund = refunds.data[0];

					if (currentRefund) {
						const {
							fee,
						} = await this.stripeService.getBalanceTransaction(
							currentRefund.balance_transaction,
						);

						transactionFee = fee / 100;

						await this.paymentSuccess(
							refund.metadata.orderId.toString(),
							PaymentType.STRIPE,
							refund,
							-Math.abs(currentRefund.amount / 100),
							transactionFee,
						);
					}
					break;

				default:
					break;
			}
		} catch (err) {
			throw new Error(err.message + ' -> order.processStripeWebhook');
		}
	}

	async processHitpayWebhook(data: any): Promise<void> {
		const isValid = await this.hitpayService.isValid(data);

		if (isValid && data.status === 'completed') {
			const { data: detail } = await this.hitpayService.getRequest(
				data.payment_request_id,
			);

			const order = await this.orderModel.findById(
				detail.reference_number.toString(),
			);

			if (order) {
				// check there is already in payment log by Id
				const index = order.paymentLog.findIndex(
					(log) => log.id === detail.id,
				);

				if (index === -1) {
					await this.paymentSuccess(
						detail.reference_number.toString(),
						PaymentType.HITPAY,
						detail,
						parseFloat(data.amount),
						parseFloat(detail.payments[0].fees),
					);
				}
			}
		}
	}

	async paymentSuccess(
		orderId: string,
		type: PaymentType,
		paymentInfo: any,
		amount = 0,
		fees = 0,
	): Promise<void> {
		try {
			// to support previous unique no
			let order = null;

			if (orderId.length === 6) {
				order = await this.orderModel.findOne({ uniqueNo: orderId });
			} else {
				order = await this.orderModel.findById(orderId);
			}

			if (order) {
				const unpaid = parseFloat(order.unpaid.toFixed(2));

				if (amount > 0 && unpaid > 0 && amount === unpaid) {
					order.status = OrderStatus.CONFIRM;

					// TODO: need to discuss when partial paid
					if (order.paid === 0) {
						// if partial paid, ignore stocks

						const products = await this.orderUitlsService
							.getProductUsage(order._id.toString())
							.toPromise();

						await this.stocksService.updateStocksBySpecific(
							moment(order.orderDate).toDate(),
							products,
						);
					}
				}

				if (
					(order.status === OrderStatus.PENDING ||
						order.status === OrderStatus.PENDING_PAYMENT) &&
					order.usedCode
				) {
					const payableAmount = await this.getPayableAmount(
						order._id,
					);

					if (payableAmount === amount) {
						// used promo code
						const promo = await this.promoCodesService.findByCode(
							order.usedCode,
						);

						order.promoCode = promo._id;
						order.discount = parseFloat(
							(
								order.totalAmount -
								(payableAmount + order.paid)
							).toFixed(2),
						);
						order.unpaid =
							order.totalAmount -
							(order.discount + amount + order.paid);

						if (order.unpaid <= 0) {
							order.status = OrderStatus.CONFIRM;
						}

						await this.promoCodesService.used(
							promo._id,
							order.usedCode,
							order.customer,
						);
					}
				} else {
					order.unpaid = unpaid - amount;
				}

				order.paymentType = type;
				order.paymentLog = [...order.paymentLog, paymentInfo];
				order.paid += amount;

				order.paidAt = moment().toDate();
				order.fees = parseFloat((order.fees + fees).toFixed(2));

				// if there is no amount between paid and unpaid
				// if (order.paid === 0 && order.unpaid === 0) {
				// 	order.status = OrderStatus.CANCELLED;
				// }

				await order.save();

				if (amount > 0) {
					if (order.status === OrderStatus.CONFIRM) {
						await this.backupOrderService.create(order);
					}

					if (order.sender.email) {
						setTimeout(() => {
							this.sendEmail(order._id);
						}, 500);
					}
				}
			}
		} catch (err) {
			throw new Error(err);
		}
	}

	async createAdhocOrder(
		{
			newAccount,
			products,
			delivery,
			customerId,
			orderDate,
			usedCode,
			paid,
			bundles,
			sliceBoxes,
			...payload
		}: CreateAdhocOrderDto,
		loggedInAccountType: string,
	): Promise<Order> {
		const { minForDelivery } = await this.settingsService.getOne();

		const [
			isPeakDay,
			peakDayCharge,
		] = await this.orderUitlsService.usePeakDay(orderDate).toPromise();

		let amount = 0,
			discount = 0,
			promoCode = null;

		const [
			customProducts,
			customProductsTotal,
		] = await this.orderUitlsService.useProducts(products).toPromise();

		const [
			customSliceBoxes,
			customSliceBoxesTotal,
		] = await this.orderUitlsService.useSliceBoxes(sliceBoxes).toPromise();

		const [
			customBundles,
			customBundlesTotal,
		] = await this.orderUitlsService.useBundles(bundles).toPromise();

		let usedFreeDelivery = false;
		const productsTotal =
			customProductsTotal + customSliceBoxesTotal + customBundlesTotal;

		let customDelivery = await this.deliveryMapper(delivery);
		let subTotal = productsTotal + customDelivery.price;

		// check there is min spending for free delivery
		if (minForDelivery.active) {
			if (productsTotal >= minForDelivery.minAmount) {
				usedFreeDelivery = true;

				if (minForDelivery.freeDelivery) {
					subTotal = productsTotal; // delivery fee is zero
					customDelivery = { ...customDelivery, price: 0 };
				} else {
					const fee =
						customDelivery.price - minForDelivery.deliveryDiscount;

					subTotal = productsTotal + (fee > 0 ? fee : 0);
					customDelivery.price = fee > 0 ? fee : 0;
				}
			}
		}

		const totalAmount = parseFloat(
			(
				subTotal +
				(isPeakDay && customDelivery.postalCode ? peakDayCharge : 0)
			).toFixed(2),
		);

		let customer = null;

		if (!customerId) {
			customer = await this.customersService.findByEmail(
				newAccount.email,
			);

			if (!customer) {
				customer = await this.customersService.create(newAccount);
			}
		}

		// check code is valid
		if (usedCode) {
			await this.promoCodesService.isValid(
				usedCode,
				customProductsTotal,
				customerId ? new Types.ObjectId(customerId) : customer._id,
				loggedInAccountType,
			);

			promoCode = await this.promoCodesService.findByCode(usedCode);

			discount =
				promoCode.type === PromoCodeType.PERCENTAGE
					? parseFloat(
						(
							(subTotal -
								(!promoCode.isIncludeDeliveryFee
									? customDelivery.price
									: 0)) *
							(promoCode.amount / 100)
						).toFixed(2),
					)
					: promoCode.amount;

			amount = totalAmount - discount;
		} else {
			amount = totalAmount;
		}

		let created = null;
		let counter = 0;

		do {
			try {
				const latest = await this.getByLatestUniqueNo();

				created = new this.orderModel({
					...payload,
				});

				created.orderDate = moment(orderDate).startOf('date').toDate();
				created.customer = customerId
					? new Types.ObjectId(customerId)
					: customer._id;
				created.products = customProducts;
				created.sliceBoxes = customSliceBoxes;
				created.bundles = customBundles;
				created.delivery = customDelivery;
				created.deliveryZone = created.delivery.postalCode
					? (
						await this.deliveryZonesService.findByPostalCode(
							created.delivery.postalCode
								.toString()
								.substr(0, 2),
						)
					)?._id
					: null;
				created.uniqueNo = generateOrderNo(latest?.uniqueNo);
				created.status = OrderStatus.PENDING_PAYMENT;
				created.type = OrderType.ADHOC;
				created.usedCode = usedCode;
				created.totalAmount = totalAmount;
				created.usedFreeDelivery = usedFreeDelivery;
				created.unpaid = totalAmount - paid;
				created.paid = paid;

				if (isPeakDay) {
					created.peakDaySurcharge = peakDayCharge;
				}

				await created.save();
			} catch (err) {
				created = null;
			}

			counter++;
		} while (!created && counter <= 5);

		if (!created) throw new ServiceUnavailableException();

		// for giftcard scenario
		if (amount <= 0 || created.paid === amount) {
			created.status = OrderStatus.CONFIRM;
			created.unpaid = 0;

			if (promoCode) {
				created.promoCode = promoCode._id;
				created.discount = discount;
				// order.unpaid = amount <= 0 ? 0 : amount - order.paid;

				await this.promoCodesService.used(
					promoCode._id,
					usedCode,
					created.customer.toString(),
				);
			}

			await created.save();
		}

		setTimeout(() => {
			this.sendEmail(created._id);
		}, 500);

		return created;
	}

	async updateOrder(
		id: string,
		{ delivery, orderDate, recipient, sender, giftMessage }: UpdateOrderDto,
	): Promise<Order> {
		const order = await this.orderModel.findById(id).populate('promoCode');

		if (order.status !== OrderStatus.PENDING) {
			throw new Error('Order already confimred');
		}

		try {
			order.delivery = await this.deliveryMapper(delivery);
			order.deliveryZone = order.delivery.postalCode
				? (
					await this.deliveryZonesService.findByPostalCode(
						order.delivery.postalCode.toString().substr(0, 2),
					)
				)?._id
				: null;
			order.orderDate = orderDate;
			order.recipient = recipient;
			order.sender = sender;
			order.giftMessage = giftMessage;

			// new total amount
			const totalAmount =
				order.products
					.map((product) => product.price * product.quantity)
					.reduce((acc, curr) => acc + curr, 0) +
				order.delivery.price;

			if (order.promoCode) {
				// const discount =
				// 	order.promoCode.type === PromoCodeType.PERCENTAGE
				// 		? parseFloat(
				// 				(
				// 					totalAmount *
				// 					(order.promoCode.amount / 100)
				// 				).toFixed(2),
				// 		  )
				// 		: order.promoCode.amount;

				const discount =
					order.promoCode.type === PromoCodeType.PERCENTAGE
						? parseFloat(
							(
								(totalAmount -
									(!order.promoCode.isIncludeDeliveryFee
										? order.delivery.price
										: 0)) *
								(order.promoCode.amount / 100)
							).toFixed(2),
						)
						: order.promoCode.amount;

				const netTotal = totalAmount - discount;

				order.unpaid =
					order.unpaid +
					(netTotal - (order.totalAmount - order.discount));
			} else {
				// update unpaid
				order.unpaid = order.unpaid + (totalAmount - order.totalAmount);

				order.totalAmount = totalAmount;
			}

			// we need to refund if there is
			// if (order.unpaid < 0) {
			// 	// Todo: Refund stripe
			// }

			return order.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateOrderByAdmin(
		id: string,
		{
			products,
			delivery,
			orderDate,
			recipient,
			sender,
			giftMessage,
			note,
			paid,
			makeRefund,
			sliceBoxes,
			bundles,
		}: UpdateOrderDto,
	): Promise<Order> {
		// TODO: promo code check valid because there is min spending

		const order = await this.orderModel
			.findById(id)
			.populate('promoCode')
			.populate({
				path: 'sliceBoxes',
				populate: { path: 'products' },
			})
			.populate({ path: 'bundles' });
		const settings = await this.settingsService.getOne();

		const isConfirmed = order.status === OrderStatus.CONFIRM;
		const isPending = order.status === OrderStatus.PENDING;
		const isPendingPayment = order.status === OrderStatus.PENDING_PAYMENT;

		if (!(isConfirmed || isPending || isPendingPayment)) {
			throw new Error('Order already processed');
		}

		// delete previous order-bundles
		await combineLatest(
			(order.bundles as any[]).map((bundle) =>
				from(this.orderBundleService.delete(bundle._id)),
			),
		).toPromise();

		const [
			customProducts,
			customProductsTotal,
		] = await this.orderUitlsService.useProducts(products).toPromise();

		const [
			customSliceBoxes,
			customSliceBoxesTotal,
		] = await this.orderUitlsService.useSliceBoxes(sliceBoxes).toPromise();

		const [
			customBundles,
			customBundlesTotal,
		] = await this.orderUitlsService.useBundles(bundles).toPromise();

		let customDelivery = await this.deliveryMapper(delivery);

		const productsTotal =
			customProductsTotal + customSliceBoxesTotal + customBundlesTotal;

		let subTotal = productsTotal + customDelivery.price;
		let usedFreeDelivery = false;

		const refund = await this.getRefundAmount(order);

		// for previous order products
		const oldProducts = await this.orderUitlsService
			.getProductUsage(id)
			.toPromise();

		// if delivery date changed, switch stocks
		if (!moment(orderDate).isSame(moment(order.orderDate))) {
			// add stocks to previous date
			await this.stocksService.updateStocksBySpecific(
				moment(order.orderDate).toDate(),
				concat(oldProducts).map((product) => ({
					...product,
					qty: -Math.abs(product.qty),
				})),
			);

			// reduce stocks from new date
			await this.stocksService.updateStocksBySpecific(
				moment(orderDate).toDate(),
				concat(oldProducts).map((product) => ({
					...product,
					qty: Math.abs(product.qty),
				})),
			);
		}

		// check there is min spending for free delivery
		if (settings.minForDelivery.active) {
			if (productsTotal >= settings.minForDelivery.minAmount) {
				usedFreeDelivery = true;

				if (settings.minForDelivery.freeDelivery) {
					subTotal = productsTotal; // delivery fee is zero
					customDelivery = { ...customDelivery, price: 0 };
				} else {
					const fee =
						customDelivery.price -
						settings.minForDelivery.deliveryDiscount;

					subTotal = productsTotal + (fee > 0 ? fee : 0);
					customDelivery.price = fee > 0 ? fee : 0;
				}
			}
		}

		const [
			isPeakDay,
			peakDayCharge,
		] = await this.orderUitlsService.usePeakDay(orderDate).toPromise();

		const usedPeakDaySurcharge =
			isPeakDay && customDelivery.postalCode ? true : false;

		if (usedPeakDaySurcharge) {
			subTotal += settings.peakDaySurcharge.price || 0;
		}

		const totalAmount = parseFloat(subTotal.toFixed(2));

		try {
			order.products = customProducts;
			order.sliceBoxes = customSliceBoxes;
			order.bundles = customBundles;
			order.delivery = customDelivery;
			order.deliveryZone = order.delivery.postalCode
				? (
					await this.deliveryZonesService.findByPostalCode(
						order.delivery.postalCode.toString().substr(0, 2),
					)
				)?._id
				: null;
			order.orderDate = moment(orderDate).startOf('date').toDate();
			order.recipient = recipient;
			order.sender = sender;
			order.giftMessage = giftMessage;
			order.note = note;
			order.usedFreeDelivery = usedFreeDelivery;
			order.peakDaySurcharge = usedPeakDaySurcharge ? peakDayCharge : 0;

			if (order.promoCode) {
				const discount =
					order.promoCode.type === PromoCodeType.PERCENTAGE
						? parseFloat(
							(
								(customProductsTotal +
									(order.promoCode.isIncludeDeliveryFee
										? order.delivery.price
										: 0)) *
								(order.promoCode.amount / 100)
							).toFixed(2),
						)
						: order.promoCode.amount;

				const netTotal = totalAmount - discount;

				order.unpaid = parseFloat(
					(
						order.unpaid +
						(netTotal -
							(order.totalAmount - order.discount - refund))
					).toFixed(2),
				);

				// set updated
				order.discount = discount;
				order.totalAmount = totalAmount;

				if (paid > 0) {
					order.unpaid -= paid - order.paid;
					order.paid = paid;
				}
			} else {
				// update unpaid
				order.unpaid =
					order.unpaid + (totalAmount - (order.totalAmount - refund));

				order.totalAmount = totalAmount;

				if (paid > 0) {
					order.unpaid -= paid - order.paid;
					order.paid = paid;
				}
			}

			if (order.unpaid > 0) {
				if (order.status === OrderStatus.CONFIRM) {
					order.status = OrderStatus.PENDING_PAYMENT;
				}
			}
			// we need to refund if there is
			else if (
				order.unpaid < 0 &&
				order.paid > 0 &&
				makeRefund === true
			) {
				const amount =
					order.paid >= Math.abs(order.unpaid)
						? order.unpaid
						: -Math.abs(order.paid);

				if (order.paymentType === PaymentType.STRIPE) {
					await this.refundByStripe(Math.abs(amount), order._id);
				} else if (order.paymentType === PaymentType.HITPAY) {
					order.paid += amount;
					order.paymentLog = [
						...order.paymentLog,
						{
							type: 'refund',
							amount: Math.abs(amount),
							remark: 'Refund update by system',
							date: new Date().toISOString(),
						},
					];
					order.unpaid -= amount;
				}
			}
			// else if unpaid is zero and status is PENDING_PAYMENT
			else if (
				order.unpaid === 0 &&
				order.status === OrderStatus.PENDING_PAYMENT
			) {
				order.status = OrderStatus.CONFIRM;
			}

			await order.save();

			// ------------- resync the stocks -----------------
			const newProducts = await this.orderUitlsService
				.getProductUsage(order._id)
				.toPromise();

			// find difference (new) ones then, reduce the stocks
			await this.stocksService.updateStocksBySpecific(
				moment(order.orderDate).toDate(),
				differenceBy(oldProducts, newProducts, 'productId'),
			);

			// find same (previous) ones then, calculate the qty
			await this.stocksService.updateStocksBySpecific(
				moment(order.orderDate).toDate(),
				intersectionBy(oldProducts, newProducts, 'productId').map(
					(item) => {
						const newed = newProducts.find(
							({ productId, variantId }) =>
								productId === item.productId &&
								variantId === item.variantId,
						);

						const old = oldProducts.find(
							({ productId, variantId }) =>
								productId === item.productId &&
								variantId === item.variantId,
						);

						return { ...item, qty: newed.qty - old.qty };
					},
				),
			);
			// -------------------------------------------------

			if (order.status === OrderStatus.PENDING_PAYMENT) {
				// if (order.sender.email) {
				// 	setTimeout(() => {
				// 		this.sendEmail(order._id);
				// 	}, 500);
				// }
			}

			return order;
		} catch (err) {
			throw new Error(err);
		}
	}

	async cancelOrder(id: string, refundAmount: number): Promise<Order> {
		const order = await this.orderModel.findById(id);

		if (order.paid > 0) {
			if (refundAmount > order.paid) {
				throw new BadRequestException('Over refund');
			}

			// we need to refund
			if (order.paymentType === PaymentType.STRIPE) {
				order.unpaid = order.unpaid - refundAmount;

				await this.refundByStripe(refundAmount, id);
			} else if (order.paymentType === PaymentType.HITPAY) {
				order.paid = order.paid - refundAmount;
				order.paymentLog = [
					...order.paymentLog,
					{
						type: 'refund',
						amount: refundAmount,
						remark: 'Refund update by system (Cancelled)',
						date: new Date().toISOString(),
					},
				];
			}
		}

		order.status = OrderStatus.CANCELLED;

		await order.save();

		if (order.sender.email) {
			await this.sendEmail(order._id);
		}

		return order;
	}

	async getOrdersByProduct(product: string): Promise<Order[]> {
		return this.orderModel.find({
			'products.product': new Types.ObjectId(product),
		});
	}

	async getProductSoldDetail(product: ProductModel) {
		const orders = await this.getOrdersByProduct(product._id);

		return this.productSoldsService.getProductSoldDetail(orders, product);
	}

	async refundOrder(id: string, refundAmount: number): Promise<Order> {
		const order = await this.orderModel.findById(id);

		if (order.paid > 0) {
			if (refundAmount > order.paid) {
				throw new BadRequestException('Over refund');
			}

			// we need to refund
			if (order.paymentType === PaymentType.STRIPE) {
				order.unpaid = order.unpaid - refundAmount;

				await order.save();

				await this.refundByStripe(refundAmount, id);
			} else if (order.paymentType === PaymentType.HITPAY) {
				order.paid = order.paid - refundAmount;
				order.paymentLog = [
					...order.paymentLog,
					{
						type: 'refund',
						amount: Math.abs(refundAmount),
						remark: 'Refund update by system',
						date: new Date().toISOString(),
					},
				];

				await order.save();
			}
		}

		return order;
	}

	async getDetail(id: string): Promise<any> {
		try {
			const order = await this.orderModel
				.findById(id)
				.populate([
					{
						path: 'customer',
					},
					{
						path: 'promoCode',
					},
					{
						path: 'delivery.method',
						populate: { path: 'times' },
					},
					{
						path: 'products.category',
					},
					{
						path: 'products.product',
					},
					{
						path: 'sliceBoxes',
						populate: [
							{
								path: 'products',
								populate: { path: 'product' },
							},
							{
								path: 'option',
							},
						],
					},
					{
						path: 'bundles',
						populate: [
							{ path: 'bundle' },
							{
								path: 'products',
								populate: [
									{
										path: 'product',
										populate: [{ path: 'product' }],
									},
								],
							},
						],
					},
				])
				.lean()
				.exec();

			const isPending = order.status === OrderStatus.PENDING;
			const isPendingPayment =
				order.status === OrderStatus.PENDING_PAYMENT;

			if (!(isPending || isPendingPayment) || !order.usedCode) {
				return order;
			}

			// virtual promo discount for adhoc create orders
			let discount = 0;
			const promoCode = await this.promoCodesService.findByOnlyCode(
				order.usedCode,
			);

			const subTotal = order.products
				// .filter((item) => !!item.product)
				.map((item) => item.price * item.quantity)
				.reduce((acc, curr) => acc + curr, 0);

			if (promoCode) {
				const { type, amount, isIncludeDeliveryFee } = promoCode;

				discount =
					type === PromoCodeType.PERCENTAGE
						? parseFloat(
							(
								(subTotal -
									(isIncludeDeliveryFee
										? order.delivery.price
										: 0)) *
								(amount / 100)
							).toFixed(2),
						)
						: amount;
			}

			order.virtualDiscount = discount;

			return order;
		} catch (err) {
			throw new Error(err);
		}
	}

	async sendEmail(id: string): Promise<any> {
		const order = await this.getDetail(id);
		const WEBSITE_URL = this.configService.get<string>('WEBSITE_URL');

		const isValid = await this.validatedEmailsService
			.isDeliverable(order.sender.email.toString())
			.toPromise();

		if (!isValid) {
			await this.notifyEmailIsInvalid(order.sender.email.toString());

			return;
		}

		let refund = 0;
		let discount = order.discount || 0;
		let intents = [];

		switch (order.paymentType) {
			case 'STRIPE':
				intents = order.paymentLog.filter(
					(log) => log.object === 'payment_intent',
				);

				for (let index = 0; index < intents.length; index++) {
					const refunded = order.paymentLog.filter(
						(log) =>
							log.object === 'charge' &&
							log.payment_intent === intents[index].id,
					);

					if (refunded.length > 0) {
						refund += refunded[refunded.length - 1].amount_refunded;
					}
				}

				refund = refund / 100;
				break;

			case 'HITPAY':
				refund = order.paymentLog
					.filter((log) => log.type === 'refund')
					.map((log) => log.amount)
					.reduce((acc, curr) => acc + curr, 0);
				break;

			default:
				break;
		}

		let label = '';
		let dateLabel = '';
		let status = '';

		switch (order.status) {
			case OrderStatus.CONFIRM:
				label = order.delivery.postalCode
					? "We're getting your order ready for delivery"
					: "We're getting your order ready for collection";
				dateLabel = order.delivery.postalCode
					? 'Delivery date'
					: 'Collection date';
				status = 'Confirmed';
				break;

			case OrderStatus.COMPLETED:
				label = 'Your order is completed';
				dateLabel = 'Completed date';
				status = 'Completed';
				break;

			case OrderStatus.CANCELLED:
				label = 'Your order is cancelled';
				dateLabel = 'Cancelled date';
				status = 'Cancelled';
				break;

			case OrderStatus.READY_FOR_COLLECTION:
				label = 'Your order is ready for collection';
				dateLabel = 'Collection date';
				status = 'Ready for collection';
				break;

			case OrderStatus.DELIVERING:
				label = 'Your order is on its way.';
				dateLabel = 'Delivery date';
				status = 'Delivering';
				break;
		}

		const productsFee = order.products
			?.map(({ price, quantity }) => price * quantity)
			.reduce((acc, curr) => acc + curr, 0);

		const sliceBoxesFee =
			order.sliceBoxes?.reduce((acc, curr) => acc + curr.total, 0) || 0;

		const bundlesFee =
			order.bundles?.reduce(
				(total, bundle) => total + bundle.price * bundle.quantity,
				0,
			) || 0;

		// A Trio for A Hero
		const isSpecialProduct =
			order.products
				.filter((_product) => _product.product)
				.filter(
					(_product) =>
						_product.product._id.toString() ===
						'60fa1fcf95384b01ffa5ad3a',
				).length > 0
				? true
				: false;

		// for pending payment discount
		if (order.status === OrderStatus.PENDING_PAYMENT && order.usedCode) {
			const amount = await this.getPayableAmount(order._id, false);

			discount = order.totalAmount - (amount + order.paid);
		}

		const customProducts = order.products.map((product) => {
			return {
				quantity: product.quantity,
				name: product.itemName
					? product.itemName
					: product.product.name,
				variant: product.variant ? product.variant.size : '',
				price: product.price,
				candles: product.candles ? product.candles : '',
				textOnCake: product.message,
				knife: product.knifes > 0 ? 'Yes' : '',
				image: product.itemName
					? 'https://assets-Online-bake-house.s3-ap-southeast-1.amazonaws.com/images/placeholder-image.png'
					: product.product.mainImage ||
					'https://assets-Online-bake-house.s3-ap-southeast-1.amazonaws.com/images/placeholder-image.png',
				total: numeral(product.price * product.quantity).format(
					'$0.00',
				),
			};
		});

		const customSliceBoxes =
			order.sliceBoxes?.map((box) => {
				return {
					quantity: box.quantity,
					name: box.option.name,
					image: box.option.image,
					total: numeral(box.total).format('$0.00'),
					list: box.products.map(
						(item) => `${item.qty} ${item.product.name}`,
					),
				};
			}) || [];

		const customBundles =
			order.bundles?.map((item) => ({
				quantity: item.quantity,
				name: item.bundle.name,
				image: item.bundle.image,
				total: numeral(item.price * item.quantity).format('$0.00'),
				list: item.products
					.map(({ product: item, candles, knife, cakeText }) => {
						const variant = item.variant
							? item.product.variants.find(
								(variant) => variant._id === item.variant,
							)
							: '';

						const texts = [
							`${item.product.name}${variant ? `(${variant.size})` : ''
							} (x${item.qty})`,
						];

						if (item.product.isSpecial) {
							texts.push(
								`-> Candles (standard size): ${candles}`,
							);
							texts.push(
								`-> Cake Knife: ${knife ? 'Yes' : 'No'}`,
							);

							if (!item.product.isNoCakeText) {
								texts.push(`-> Cake Text: ${cakeText}`);
							}
						}

						return texts;
					})
					.reduce((prev, curr) => [...prev, ...curr], []),
			})) || [];

		const netTotal = order.totalAmount - discount;
		const deliveryMethod = order.delivery.method;

		const data = {
			label,
			dateLabel,
			cancelled: order.status === OrderStatus.CANCELLED,
			delivering: order.status === OrderStatus.DELIVERING,
			completed: order.status === OrderStatus.COMPLETED,
			collectable: order.status === OrderStatus.READY_FOR_COLLECTION,
			isStorePickup:
				deliveryMethod.emailType === DeliveryMethodEmail.STORE,
			isDelivery:
				order.status === OrderStatus.CONFIRM &&
				deliveryMethod.emailType !== DeliveryMethodEmail.STORE,
			isHourSpecific:
				deliveryMethod.emailType === DeliveryMethodEmail.FIXED,
			isFlexiTime:
				deliveryMethod.emailType === DeliveryMethodEmail.FlEXI_HOME,
			orderNo: order.uniqueNo.toUpperCase(),
			name: order.sender.firstName,
			deliveryDate: moment(order.orderDate).format('dddd, MMMM DD, YYYY'),
			storePickupTime:
				moment(order.orderDate).format('YYYY-MM-DD') === '2021-12-24'
					? '9am - 2pm'
					: '9am - 4pm',
			items: concat(
				customProducts,
				customSliceBoxes,
				customBundles,
			).map((product, index) => ({ ...product, first: index === 0 })),
			productsFee: numeral(
				productsFee + sliceBoxesFee + bundlesFee,
			).format('$0.00'),
			deliveryFee: numeral(order.delivery?.price).format('$0.00'),
			subtotal: numeral(
				productsFee +
				sliceBoxesFee +
				bundlesFee +
				order.delivery?.price,
			).format('$0.00'),
			peakDaySurcharge: order.peakDaySurcharge
				? numeral(order.peakDaySurcharge).format('$0.00')
				: '',
			refund: refund ? numeral(refund).format('$0.00') : '',
			discount: numeral(discount).format('$0.00'),
			code:
				order?.discount > 0
					? order?.usedCode || order?.promoCode?.code
					: '',
			total: numeral(netTotal > 0 ? netTotal : 0).format('$0.00'),
			giftMessage: order.giftMessage || '',
			note: order.note || '',
			deliveryMethod: order.delivery.method?.needPostalCode
				? order.delivery.method?.name
				: `${order.delivery.method?.name} from Online Bakehouse`,
			address: order.delivery.method?.needPostalCode
				? (order.delivery.address as string).toLowerCase()
				: `301 Joo Chiat Rd Singapore 427552`,
			buildingUnitNo: order.delivery.buildingUnitNo,
			postalCode: order.delivery.postalCode,
			paymentType:
				order.paymentType === PaymentType.HITPAY
					? 'Hitpay'
					: 'Credit card',

			senderName: order.sender.firstName + ' ' + order.sender.lastName,
			senderMobileNo: order.sender.mobileNo,
			senderEmail: order.sender.email,

			recipientName:
				order.recipient.firstName + ' ' + order.recipient.lastName,
			recipientMobileNo: order.recipient.mobileNo,
			WEBSITE_URL: WEBSITE_URL + '?action=sign-in',
			instructionLabel: isSpecialProduct
				? 'Message of encouragement for the Healthcare Hero'
				: 'Instructions to team',
		};

		if (
			order.delivery?.specificTime?.startTime &&
			order.delivery?.specificTime?.endTime
		) {
			data[
				'specificTime'
			] = `${order.delivery.specificTime.startTime} - ${order.delivery.specificTime.endTime}`;
			data['deliveryMethod'] += ` (${data['specificTime']})`;
		}

		if (order.delivery?.specificTime?.name) {
			data['specificTime'] = order.delivery.specificTime.name;
			data['deliveryMethod'] += ` (${data['specificTime']})`;
		}

		try {
			if (order.sender.email) {
				if (
					order.status === OrderStatus.PENDING_PAYMENT ||
					order.status === OrderStatus.PENDING
				) {
					data['unpaid'] = numeral(
						order.totalAmount - discount - order.paid,
					).format('$0.00');
					data['paid'] = numeral(order.paid).format('$0.00');
					data['paynow'] =
						this.configService.get<string>('websiteUrl') +
						'checkout/' +
						order._id.toString();

					await this.mailerService.sendMail({
						to: order.sender.email.toString(),
						subject: `Order #${order.uniqueNo.toUpperCase()} - Payment needed to confirm order`,
						template:
							process.cwd() +
							'/mail_templates/' +
							'pending-payment',
						context: data,
					});
				} else {
					await this.mailerService.sendMail({
						to: order.sender.email.toString(),
						subject: `Order #${order.uniqueNo.toUpperCase()} ${status}`,
						template:
							process.cwd() + '/mail_templates/' + 'order-detail',
						context: data,
					});
				}

				return 'sent';
			}
		} catch (err) {
			throw new Error(err);
		}
	}

	async getTags(): Promise<string[]> {
		const orders = await this.orderModel
			.find({ 'tags.0': { $exists: true } }, { tags: 1 })
			.exec();

		return orders
			.map((doc) => doc.tags)
			.reduce((acc, curr) => uniq([...acc, ...curr]), []);
	}

	async getRefundAmount(order: Order): Promise<number> {
		let refund = 0;
		let intents = [];

		switch (order.paymentType) {
			case 'STRIPE':
				intents = order.paymentLog.filter(
					(log) => log.object === 'payment_intent',
				);

				for (let index = 0; index < intents.length; index++) {
					const refunded = order.paymentLog.filter(
						(log) =>
							log.object === 'charge' &&
							log.payment_intent === intents[index].id,
					);

					if (refunded.length > 0) {
						refund += refunded[refunded.length - 1].amount_refunded;
					}
				}

				return refund / 100;

			case 'HITPAY':
				return order.paymentLog
					.filter((log) => log.type === 'refund')
					.map((log) => log.amount)
					.reduce((acc, curr) => acc + curr, 0);

			default:
				return 0;
		}
	}

	async refundByStripe(amount: number, id: string) {
		if (amount === 0) {
			// won't do nothing
			return;
		}

		let refundAmount = amount * 100;
		const order = await this.orderModel.findById(id);
		const intents = order.paymentLog.filter(
			(log) => log.object === 'payment_intent',
		);

		for (let index = 0; index < intents.length; index++) {
			const refunded = order.paymentLog.filter(
				(log) =>
					log.object === 'charge' &&
					log.payment_intent === intents[index].id,
			);

			let refundedAmount = 0;

			if (refunded.length > 0) {
				refundedAmount = refunded[refunded.length - 1].amount_refunded;
			}

			const netRefundable =
				intents[index].amount_received - refundedAmount;

			// if it's enough
			if (netRefundable > refundAmount) {
				await this.stripeService.createRefund(
					refundAmount / 100,
					intents[index].id,
				);

				refundAmount -= refundAmount;

				break; // exit from loop
			} else if (netRefundable > 0) {
				// if it's not enough, make partial refund first
				refundAmount -= netRefundable;

				await this.stripeService.createRefund(
					netRefundable / 100,
					intents[index].id,
				);
			}
		}
	}

	async findByUniqueNo(uniqueNo: string): Promise<Order> {
		return this.orderModel.findOne({ uniqueNo }).exec();
	}

	async updateOrderInfo(
		id: string,
		payload: UpdateOrderInfoDto,
	): Promise<Order> {
		try {
			const order = await this.orderModel.findById(id);

			order.remark = payload.remark;
			order.tags = payload.tags;

			return order.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateGiftTag(
		id: string,
		{ giftTag }: UpdateGiftTagDto,
	): Promise<Order> {
		try {
			const order = await this.orderModel.findById(id);

			order.giftMessage = giftTag;

			return order.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateInstruction(id, payload: string): Promise<Order> {
		return this.orderModel.findByIdAndUpdate(id, { note: payload });
	}

	async deliveryMapper({
		methodId,
		specificId,
		...payload
	}: DeliveryDto): Promise<Delivery> {
		let isOutskirtPostalCode = null;
		let specific: DeliveryMethodTime = null;
		let price = 0;
		let outskirtPrice = 0;

		const method = await this.deliveryMethodsService.getDetail(methodId);

		if (method.needPostalCode && payload.postalCode) {
			isOutskirtPostalCode = await this.outskirtsService.findByPostalCode(
				payload.postalCode.substring(0, 3),
			);

			price = method.deliveryPrice;
			outskirtPrice = method.outskirtPrice;
		}

		if (specificId) {
			specific = method.times.find(
				(time) => time._id.toString() === specificId,
			);

			if (specific) {
				price = specific.price;
				outskirtPrice = specific.outskirtPrice;
			}
		}

		return {
			method: method._id,
			specificTime: specific
				? { _id: specific._id, name: specific.name }
				: undefined,
			isOutSkirt: isOutskirtPostalCode ? true : false,
			price: isOutskirtPostalCode ? outskirtPrice : price,
			postalCode: method.needPostalCode ? payload.postalCode : '',
			buildingUnitNo: method.needPostalCode ? payload.buildingUnitNo : '',
			address: method.needPostalCode ? payload.address.toLowerCase() : '',
		};
	}

	async productMapper({
		itemName,
		price,
		quantity,
		productId,
		variantId,
		candles,
		knifes,
		categoryId,
		message,
	}: ProductDto): Promise<Product> {
		if (itemName) {
			return {
				itemName,
				price,
				quantity,
			};
		}

		let variant = null;

		const product = await this.productsService.getDetail(productId);

		if (variantId) {
			variant = product.variants.find(
				({ _id }) => _id.toString() == variantId.toString(),
			);
		}

		return {
			category: categoryId ? categoryId : product.categories[0]._id,
			product: product._id,
			variant: variant || undefined,
			price: variant ? variant.price : product.price,
			quantity,
			candles: product.isSpecial ? candles : 0,
			knifes: product.isSpecial ? knifes : 0,
			message: product.isSpecial ? message : '',
		};
	}

	async isValidDate(date: Date, products: CartItem[]): Promise<boolean> {
		const dates = await this.stocksService.getDeliverableDates(products);

		const findIndex = dates.findIndex(
			(item) => item.date === date.toISOString() && item.valid === true,
		);

		return findIndex > -1;
	}

	async getByLatestUniqueNo(): Promise<Order> {
		try {
			return this.orderModel.findOne().sort({ uniqueNo: -1 }).exec();
		} catch (err) {
			throw new Error(err);
		}
	}

	getByLatestOrderDate() {
		return this.orderModel.findOne().sort({ orderDate: -1 });
	}

	async getTotalOrdersOfToday() {
		return this.orderModel.countDocuments({
			$nor: [
				{ status: OrderStatus.PENDING },
				{ status: OrderStatus.CANCELLED },
			],
			created: {
				$gte: moment().startOf('d').toDate(),
				$lt: moment().add(1, 'd').startOf('d').toDate(),
			},
		});
	}

	getIntentData(intentId: string) {
		return this.stripeService.retrievePaymentIntent(intentId);
	}

	async getDailyRevenue() {
		let counter = 14;
		const data = [];

		do {
			const date = moment().startOf('d').subtract(counter, 'days');

			const orders = await this.orderModel
				.find(
					{
						$nor: [
							{ status: OrderStatus.PENDING },
							{ status: OrderStatus.CANCELLED },
						],
						created: {
							$gte: date.toDate(),
							$lt: date.clone().add(1, 'd').toDate(),
						},
					},
					'totalAmount',
				)
				.exec();

			data.push({
				label: date.format('DD MMM'),
				value: orders
					.map((order) => order.totalAmount)
					.reduce((acc, curr) => acc + curr, 0),
			});

			counter--;
		} while (counter >= 0);

		return data;
	}

	async getMonthlyRevenue() {
		let counter = 14;
		const data = [];

		do {
			const date = moment().startOf('month').subtract(counter, 'months');

			const orders = await this.orderModel
				.find(
					{
						$nor: [
							{ status: OrderStatus.PENDING },
							{ status: OrderStatus.CANCELLED },
						],
						created: {
							$gte: date.toDate(),
							$lte: date.clone().endOf('month').toDate(),
						},
					},
					'totalAmount',
				)
				.exec();

			data.push({
				label: date.format('MMM YY'),
				value: orders
					.map((order) => order.totalAmount)
					.reduce((acc, curr) => acc + curr, 0),
			});

			counter--;
		} while (counter >= 0);

		return data;
	}

	async getYearlyRevenue() {
		let counter = 5;
		const data = [];

		do {
			const date = moment().startOf('year').subtract(counter, 'years');

			const orders = await this.orderModel
				.find(
					{
						$nor: [
							{ status: OrderStatus.PENDING },
							{ status: OrderStatus.CANCELLED },
						],
						created: {
							$gte: date.toDate(),
							$lte: date.clone().endOf('year').toDate(),
						},
					},
					'totalAmount',
				)
				.exec();

			data.push({
				label: date.format('YYYY'),
				value: orders
					.map((order) => order.totalAmount)
					.reduce((acc, curr) => acc + curr, 0),
			});

			counter--;
		} while (counter >= 0);

		return data;
	}

	async getDailyTotalOrders() {
		let counter = 14;
		const data = [];

		do {
			const date = moment().startOf('d').subtract(counter, 'days');

			const count = await this.orderModel
				.countDocuments({
					$nor: [
						{ status: OrderStatus.PENDING },
						{ status: OrderStatus.CANCELLED },
					],
					created: {
						$gte: date.toDate(),
						$lt: date.clone().add(1, 'd').toDate(),
					},
				})
				.exec();

			data.push({
				label: date.format('DD MMM'),
				value: count,
			});

			counter--;
		} while (counter >= 0);

		return data;
	}

	async getMonthlyTotalOrders() {
		let counter = 14;
		const data = [];

		do {
			const date = moment().startOf('month').subtract(counter, 'months');

			const count = await this.orderModel
				.countDocuments({
					$nor: [
						{ status: OrderStatus.PENDING },
						{ status: OrderStatus.CANCELLED },
					],
					created: {
						$gte: date.toDate(),
						$lt: date.clone().endOf('month').toDate(),
					},
				})
				.exec();

			data.push({
				label: date.format('MMM YY'),
				value: count,
			});

			counter--;
		} while (counter >= 0);

		return data;
	}

	async getYearlyTotalOrders() {
		let counter = 5;
		const data = [];

		do {
			const date = moment().startOf('year').subtract(counter, 'years');

			const count = await this.orderModel
				.countDocuments({
					$nor: [
						{ status: OrderStatus.PENDING },
						{ status: OrderStatus.CANCELLED },
					],
					created: {
						$gte: date.toDate(),
						$lt: date.clone().endOf('year').toDate(),
					},
				})
				.exec();

			data.push({
				label: date.format('YYYY'),
				value: count,
			});

			counter--;
		} while (counter >= 0);

		return data;
	}

	async getTotalRevenueOfToday() {
		const orders = await this.orderModel
			.find(
				{
					$nor: [
						{ status: OrderStatus.PENDING },
						{ status: OrderStatus.CANCELLED },
					],
					created: {
						$gte: moment().startOf('d').toDate(),
						$lt: moment().add(1, 'd').startOf('d').toDate(),
					},
				},
				'totalAmount',
			)
			.exec();

		return orders
			.map((order) => order.totalAmount)
			.reduce((acc, curr) => acc + curr, 0);
	}

	async getTotalRevenue() {
		const orders = await this.orderModel
			.find(
				{
					$nor: [
						{ status: OrderStatus.PENDING },
						{ status: OrderStatus.CANCELLED },
					],
				},
				'totalAmount',
			)
			.exec();

		return orders
			.map((order) => order.totalAmount)
			.reduce((acc, curr) => acc + curr, 0);
	}

	async getTotalOrdersCount() {
		return this.orderModel.countDocuments({
			$nor: [
				{ status: OrderStatus.PENDING },
				{ status: OrderStatus.CANCELLED },
			],
		});
	}

	async getCountsOfOrders(range = 14, starter) {
		const data = [];

		for (let index = 0; index < range; index++) {
			const date = moment(starter ? starter : undefined)
				.startOf('d')
				.add(index, index > 1 ? 'days' : 'd');

			const orders = await this.orderModel
				.find({
					orderDate: date.toDate(),
				})
				.exec();

			data.push({
				date: date.toISOString(),
				confirmed: orders
					.filter((order) => order.status === OrderStatus.CONFIRM)
					.reduce((acc) => acc + 1, 0),
				delivering: orders
					.filter((order) => order.status === OrderStatus.DELIVERING)
					.reduce((acc) => acc + 1, 0),
				readyForCollection: orders
					.filter(
						(order) =>
							order.status === OrderStatus.READY_FOR_COLLECTION,
					)
					.reduce((acc) => acc + 1, 0),
			});
		}

		return data;
	}

	findByPaymentIntent(intent: string) {
		return this.orderModel.findOne({ 'paymentLog.id': intent });
	}

	async findByPromoCode({ promoId, customerId }): Promise<Order[]> {
		const query = {};

		if (promoId) {
			query['promoCode'] = new Types.ObjectId(promoId);
		}

		if (customerId) {
			query['customer'] = new Types.ObjectId(customerId);
		}

		if (isEmpty(query)) {
			return [];
		}

		return this.orderModel.find(query).exec();
	}

	private async getPayableAmount(
		id: string,
		checkIsValid = true,
	): Promise<number> {
		const order = await this.orderModel.findById(id).populate('sliceBoxes');

		if (!order.usedCode) {
			return order.unpaid;
		}

		const productsTotal = order.products
			.map((item) => item.price * item.quantity)
			.reduce((acc, curr) => acc + curr, 0);

		const sliceBoxesTotal =
			order.sliceBoxes?.reduce((acc, curr) => acc + curr.total, 0) || 0;

		const subTotal = productsTotal + sliceBoxesTotal;

		try {
			const promoCode = await this.promoCodesService.findByCode(
				order.usedCode,
			);

			if (checkIsValid) {
				await this.promoCodesService.isValid(
					order.usedCode,
					subTotal,
					// eslint-disable-next-line
					// @ts-ignore
					order.customer,
					promoCode?.isOnlyAdmin // for validation checking
						? AccountType.ADMIN
						: AccountType.CUSTOMER,
				);
			}

			const discount =
				promoCode.type === PromoCodeType.PERCENTAGE
					? parseFloat(
						(
							(subTotal -
								(promoCode.isIncludeDeliveryFee
									? order.usedFreeDelivery
										? 0
										: order.delivery.price
									: 0)) *
							(promoCode.amount / 100)
						).toFixed(2),
					)
					: promoCode.amount;

			return order.totalAmount - discount - order.paid;
		} catch (err) {
			console.log(err.message);

			return order.unpaid;
		}
	}

	private getQueryFromParams(params: GetOrdersQueryDto) {
		const {
			keyword,
			customerId,
			promoCodeId,
			type,
			methods,
			statuses,
			orderDate,
			zones,
			tags,
			createdDate,
			products,
			categories,
			customers,
		} = params;

		const query = {};

		// default
		// query['status'] = {
		// 	$ne: 'PENDING',
		// };

		if (keyword) {
			query['$or'] = [
				{
					uniqueNo: {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'delivery.postalCode': {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'sender.firstName': {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'sender.lastName': {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'sender.email': {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'sender.mobileNo': {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'recipient.firstName': {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'recipient.lastName': {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					'recipient.mobileNo': {
						$regex: keyword,
						$options: 'i',
					},
				},
			];
		}

		if (customerId) {
			query['customer'] = new Types.ObjectId(customerId);
		}

		if (customers) {
			query['customer'] = {
				$in: customers.split(',').map((id) => new Types.ObjectId(id)),
			};
		}

		if (promoCodeId) {
			query['promoCode'] = new Types.ObjectId(promoCodeId);
		}

		if (type) {
			query['type'] = type;
		}

		if (methods) {
			query['delivery.method'] = {
				$in: methods.split(',').map((v) => new Types.ObjectId(v)),
			};
		}

		if (statuses) {
			if (statuses === 'all') {
				delete query['status'];
			} else {
				query['status'] = {
					$in: statuses.split(','),
				};
			}
		}

		if (orderDate) {
			query['orderDate'] = moment(orderDate, 'YYYY-MM-DD').toDate();
		}

		if (zones) {
			query['deliveryZone'] = {
				$in: zones.split(',').map((v) => new Types.ObjectId(v)),
			};
		}

		if (products) {
			query['products.product'] = {
				$in: products.split(',').map((v) => new Types.ObjectId(v)),
			};
		}

		if (categories) {
			query['products.category'] = {
				$in: categories.split(',').map((v) => new Types.ObjectId(v)),
			};
		}

		if (tags) {
			query['tags'] = {
				$in: tags.split(','),
			};
		}

		if (createdDate) {
			query['created'] = {
				$gte: moment(createdDate, 'YYYY-MM-DD').toDate(),
				$lt: moment(createdDate, 'YYYY-MM-DD').add(1, 'd').toDate(),
			};
		}

		return query;
	}

	async notifyEmailIsInvalid(email) {
		const text = `The email sent to ${email} fail.`;

		if (process.env.NODE_ENV !== 'production') {
			return;
		}

		await this.mailerService.sendMail({
			to: 'hello@Onlinebakehouse.com',
			subject: text,
			template: process.cwd() + '/mail_templates/' + 'system-reports',
			context: {
				text: text,
			},
		});
	}

	@Cron(CronExpression.EVERY_DAY_AT_7AM)
	async sendExports() {
		const today = moment().startOf('d').format('dddd');
		let nextday = null;

		if (today === 'Sunday') {
			nextday = moment().startOf('d').add(2, 'd');
		} else {
			nextday = moment().startOf('d').add(1, 'd');
		}

		const QUERY_DATE = nextday.format('YYYY-MM-DD');

		if (process.env.NODE_ENV !== 'production') {
			return;
		}

		try {
			const master = await this.generateMasterExport(
				QUERY_DATE,
				QUERY_DATE,
			);
			const packingList = await this.generatePackingExport(
				QUERY_DATE,
				QUERY_DATE,
			);
			const deliveries = await this.generateDeliveryExport(
				QUERY_DATE,
				QUERY_DATE,
			);
			const wholecakes = await this.generateWholecakeExport(
				QUERY_DATE,
				QUERY_DATE,
			);
			const packingSlip = await new Promise<Buffer>(async (resolve) => {
				const doc = await this.generatePackingSlip(
					QUERY_DATE,
					QUERY_DATE,
				);

				doc.end();

				const buffers = [];
				doc.on('data', buffers.push.bind(buffers));
				doc.on('end', () => {
					const pdfData = Buffer.concat(buffers);
					resolve(pdfData);
				});
			});
			const productSolds = await this.generateProductSoldsExport(
				QUERY_DATE,
				QUERY_DATE,
			);

			await this.mailerService.sendMail({
				to: 'hello@Onlinebakehouse.com',
				subject: `Reports for ${nextday.format('DD/MM/YY')}`,
				template: process.cwd() + '/mail_templates/' + 'system-reports',
				context: {
					text: `System reported for ${nextday.format('DD/MM/YY')}.`,
				},
				attachments: [
					{
						filename: 'Master.xlsx',
						content: Buffer.from(await master.xlsx.writeBuffer()),
					},
					{
						filename: 'Packing List.xlsx',
						content: Buffer.from(
							await packingList.xlsx.writeBuffer(),
						),
					},
					{
						filename: 'Deliveries.xlsx',
						content: Buffer.from(
							await deliveries.xlsx.writeBuffer(),
						),
					},
					{
						filename: 'Wholecakes.xlsx',
						content: Buffer.from(
							await wholecakes.xlsx.writeBuffer(),
						),
					},
					{
						filename: 'Packing Slip.pdf',
						content: packingSlip,
					},
					{
						filename: 'Product Solds.xlsx',
						content: Buffer.from(
							await productSolds.xlsx.writeBuffer(),
						),
					},
				],
			});
		} catch (err) {
			throw new Error(err);
		}
	}
}
