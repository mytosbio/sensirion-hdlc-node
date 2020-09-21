module.exports = {
    globals: {
        "ts-jest": {
            tsConfig: "tsconfig.json",
        },
    },
    moduleFileExtensions: ["ts", "js"],
    transform: {
        "^.+\\.(ts)$": "ts-jest",
    },
    testMatch: [
        "<rootDir>/src/**/*.test.(ts|js)",
        "<rootDir>/tests/**/*.spec.(ts|js)",
    ],
    testEnvironment: "node",
};
