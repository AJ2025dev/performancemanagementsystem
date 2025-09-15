export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  globals: { 'ts-jest': { useESM: true } },
  extensionsToTreatAsEsm: ['.ts']
};

