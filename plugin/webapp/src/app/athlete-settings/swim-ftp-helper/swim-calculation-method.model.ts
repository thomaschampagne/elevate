import { FormulaParams } from "./formula-params.model";

export class SwimCalculationMethod {
	public active: boolean;
	public name: string;
	public params: FormulaParams[];
	public formula: (params: FormulaParams[]) => number;
}
