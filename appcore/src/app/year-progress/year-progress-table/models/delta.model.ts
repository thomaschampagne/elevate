import { DeltaType } from "./delta-type.enum";

export class Delta {
	public type: DeltaType;
	public date: string;
	public value: number;
	public signSymbol: string;
	public class: string;
}
