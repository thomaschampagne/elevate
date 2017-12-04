import { FormulaParams } from "./formula-params.model";

export class SwimCalculationMethod {
	active: boolean;
	name: string;
	params: FormulaParams[];
	formula: (params: FormulaParams[]) => number;
}
