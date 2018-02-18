import { FormulaParamsModel } from "./formula-params.model";

export class SwimCalculationMethod {
	public active: boolean;
	public name: string;
	public params: FormulaParamsModel[];
	public formula: (params: FormulaParamsModel[]) => number;
}
