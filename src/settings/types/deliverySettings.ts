export interface DeliverySettings {
	preparationDays: number;
	deliveryDays: number;
	deliveryNextDayTime: string;
	blackoutDates: string[];
	blackOutDay: number;
}

export interface PeakDaySurCharge {
	price: number;
	dates: string[];
}

export interface MinForDelivery {
	active: boolean;
	minAmount: number;
	deliveryDiscount: number;
	freeDelivery: boolean;
}
