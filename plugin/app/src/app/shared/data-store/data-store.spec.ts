import { DataStore } from "./data-store";
import * as _ from "lodash";

describe("DataStore", () => {

	class DreamInception {
		dream0: {
			dream1: {
				dream2: string
			}
		};
	}

	it("should update an object property at given path", (done: Function) => {

		// Given
		const dreamInception: DreamInception = {
			dream0: {
				dream1: {
					dream2: "Wahoo"
				}
			}
		};

		const path = ["dream0", "dream1", "dream2"];
		const newValue = "Bazinga!";

		const expected = _.cloneDeep(dreamInception);
		expected.dream0.dream1.dream2 = newValue;

		// When
		const dreamInceptionUpdated = DataStore.setAtPath<DreamInception, string>(dreamInception, path, newValue);

		// Then
		expect(dreamInceptionUpdated).toEqual(expected);

		done();
	});

	it("should not update an object property at given path", (done: Function) => {

		// Given
		const dreamInception: DreamInception = {
			dream0: {
				dream1: {
					dream2: "Wahoo"
				}
			}
		};

		const path = ["dream0", "dream1", "fakeDream2"];
		const newValue = "Bazinga!";

		const expected = _.cloneDeep(dreamInception);
		expected.dream0.dream1.dream2 = newValue;

		// When
		const call = () => {
			DataStore.setAtPath<DreamInception, string>(dreamInception, path, newValue);
		};

		// Then
		expect(call).toThrow(new Error("Property at path 'dream0,dream1,fakeDream2' do not exists"));

		done();
	});

});
