import { ListItem } from "./list-item.model";

export class Option {
	public key: string;
	public type: string;
	public title: string;
	public labels: string[];
	public list?: ListItem[];
	public enableSubOption?: string[];
	public active?: any;
	public hidden?: boolean;
	public value?: any;
	public min?: number; // For input number type only
	public max?: number; // For input number type only
	public step?: number; // For input number type only
	public disableTooltip?: boolean; // For input number type only
}
