export enum DeliveryMethodType {
	NORMAL = 'NORMAL',
	SPECIFIC = 'SPECIFIC',
}

export enum DeliveryMethodEmail {
	FLEXI_COMM = 'FLEXI_COMM',
	FIXED = 'FIXED',
	FlEXI_HOME = 'FLEXI_HOME',
	STORE = 'STORE',
}

export interface DeliveryTimeSlot {
	_id?: string;
	startTime: string;
	endTime: string;
}
