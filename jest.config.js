/** @type {import('ts-jest').JestConfigWithTsJest} **/
/// <reference types="@testing-library/jest-dom" />

export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  setupFilesAfterEnv: ['./jest.setup.js', '<rootDir>/jestMocks/text-encoding-polyfill.js'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    '!src/**/constants.{js,ts,jsx,tsx}',
    '!src/**/styles.{js,ts,jsx,tsx}',
    '!src/types/**',
    '!**/types.ts',
    '!**/node_modules/**',
  ],
};
