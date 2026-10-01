module.exports = {
    testEnvironment: "jest-environment-jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/main.jsx", "!**/*.test.*"],
    coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } }
};