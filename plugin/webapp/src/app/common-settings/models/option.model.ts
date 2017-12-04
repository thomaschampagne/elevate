import { ListItem } from "./list-item.model";

export class Option {
	key: string;
	type: string;
	title: string;
	labels: string[];
	list?: ListItem[];
	enableSubOption?: string[];
	active?: any;
	hidden?: boolean;
	value?: any;
	min?: number; // For input number type only
	max?: number; // For input number type only
	step?: number; // For input number type only
	disableTooltip?: boolean; // For input number type only
}
