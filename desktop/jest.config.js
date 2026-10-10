module.exports = {
  testRunner: "jest-jasmine2",
  transform: {
    ".(ts|tsx)": "ts-jest",
    // ESM-only dependencies: transpile them to CJS for the Jest 27 runtime
    "node_modules[\\\\/](retry-axios|serialize-error)[\\\\/].*\\.js$": "ts-jest"
  },
  testTimeout: 60000,
  transformIgnorePatterns: ["json"],
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.json"
    }
  },
  setupFilesAfterEnv: ["<rootDir>/src/test.ts"],
  testEnvironment: "node",
  testRegex: "./src.*\\.(test|spec)\\.(ts|tsx|js)$",
  moduleFileExtensions: ["ts", "tsx", "js"],

  moduleNameMapper: {
    "^@elevate/shared/(.*)$": "<rootDir>/../appcore/modules/shared/$1/",
    // axios ships an ESM entry point (main: index.js) that Jest 27 cannot require;
    // map it to the official Node CJS build
    "^axios$": "<rootDir>/node_modules/axios/dist/node/axios.cjs"
  }
};
