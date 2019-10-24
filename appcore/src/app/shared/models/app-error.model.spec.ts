import { AppError } from "./app-error.model";

describe("AppError", () => {

	it("should have been registered to be used", (done: Function) => {

		// Given
		const genuineErrorCode = AppError.FT_NO_ACTIVITIES;
		const genuineErrorMessage = "No minimum required activities!";

		// When
		const appError = new AppError(genuineErrorCode, genuineErrorMessage);

		// Then
		expect(appError).not.toBeNull();
		expect(appError.code).toBe(genuineErrorCode);
		expect(appError.message).toBe(genuineErrorMessage);

		done();
	});

	it("should not be used if not registered", (done: Function) => {

		// Given
		const myErrorCode = "MY_ERR_01";
		const myErrorMessage = "This is error message";

		// When
		const call = () => {
			new AppError(myErrorCode, myErrorMessage);
		};

		// Then
		expect(call).toThrow(new Error(myErrorCode + " error is not registered"));
		done();
	});

	it("should not be used if duplicate", (done: Function) => {

		// Given a fakeAppError with duplicate codes
		const genuineErrorCode = AppError.FT_NO_ACTIVITIES;
		const genuineErrorMessage = "No minimum required activities!";
		const fakeAppError = new AppError(genuineErrorCode, genuineErrorMessage);

		const duplicateErrorCode = "FAKE_DUPLICATE";
		fakeAppError._codes = [
			AppError.FT_NO_ACTIVITIES,
			duplicateErrorCode,
			duplicateErrorCode,
		];

		// When
		const call = () => {
			fakeAppError.checkForDuplicatesErrors();
		};

		// Then
		expect(call).toThrow(new Error(duplicateErrorCode + " error codes are duplicated"));
		done();

	});

});
