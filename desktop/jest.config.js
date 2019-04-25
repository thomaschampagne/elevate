module.exports = {
	transform: {
		".(ts|tsx)": "ts-jest"
	},
	globals: {
		"ts-jest": {
			"tsConfig": "./tsconfig.json"
		}
	},
	testEnvironment: "node",
	testRegex: "desktop/src.*\\.(test|spec)\\.(ts|tsx|js)$",
	moduleFileExtensions: [
		"ts",
		"tsx",
		"js"
	],
	moduleNameMapper: {
		"^@elevate\/shared\/(.*)$": "<rootDir>/../plugin/app/modules/shared/$1/"
	}
};
