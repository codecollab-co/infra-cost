// Manual mock for @alicloud/tea-util
const jestGlobals = require('@jest/globals');

const mockRuntimeOptions = {
  autoretry: false,
  ignoreSSL: false,
  maxAttempts: 3,
  backoffPolicy: '',
  backoffPeriod: 1,
  readTimeout: 10000,
  connectTimeout: 5000,
  httpProxy: '',
  httpsProxy: '',
  noProxy: '',
  maxIdleConns: 60,
  socks5Proxy: '',
  socks5NetWork: '',
  uploadLimitSpeed: 0,
  downloadLimitSpeed: 0,
  listener: null,
  tracker: null,
};

class RuntimeOptions {
  constructor(options = {}) {
    Object.assign(this, mockRuntimeOptions, options);
  }

  static names() {
    return Object.keys(mockRuntimeOptions);
  }
}

const mockSleep = jestGlobals.jest.fn().mockImplementation(async (ms) => {
  // In tests, we don't actually sleep
  return Promise.resolve();
});

const mockToBytes = jestGlobals.jest.fn().mockImplementation((str) => {
  return Buffer.from(str, 'utf-8');
});

const mockToString = jestGlobals.jest.fn().mockImplementation((bytes) => {
  return bytes.toString('utf-8');
});

const mockParseJSON = jestGlobals.jest.fn().mockImplementation((str) => {
  return JSON.parse(str);
});

const mockReadAsString = jestGlobals.jest.fn().mockResolvedValue('mock file content');

const mockReadAsBytes = jestGlobals.jest.fn().mockResolvedValue(Buffer.from('mock file content'));

const mockReadAsJSON = jestGlobals.jest.fn().mockResolvedValue({
  mock: 'data',
});

const mockGetNonce = jestGlobals.jest.fn().mockImplementation(() => {
  return Math.random().toString(36).substring(2, 15);
});

const mockGetDateUTCString = jestGlobals.jest.fn().mockImplementation(() => {
  return new Date().toUTCString();
});

const mockDefaultString = jestGlobals.jest.fn().mockImplementation((value, defaultValue) => {
  return value || defaultValue;
});

const mockDefaultNumber = jestGlobals.jest.fn().mockImplementation((value, defaultValue) => {
  return typeof value === 'number' ? value : defaultValue;
});

const mockToFormString = jestGlobals.jest.fn().mockImplementation((obj) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    params.append(key, String(value));
  }
  return params.toString();
});

const mockToJSONString = jestGlobals.jest.fn().mockImplementation((obj) => {
  return JSON.stringify(obj);
});

const mockEmpty = jestGlobals.jest.fn().mockImplementation((value) => {
  return value === null || value === undefined || value === '';
});

const mockEqualString = jestGlobals.jest.fn().mockImplementation((str1, str2) => {
  return str1 === str2;
});

const mockEqualNumber = jestGlobals.jest.fn().mockImplementation((num1, num2) => {
  return num1 === num2;
});

const mockIsUnset = jestGlobals.jest.fn().mockImplementation((value) => {
  return value === null || value === undefined;
});

const mockStringifyMapValue = jestGlobals.jest.fn().mockImplementation((map) => {
  const result = {};
  for (const [key, value] of Object.entries(map)) {
    result[key] = String(value);
  }
  return result;
});

const mockAssertAsMap = jestGlobals.jest.fn().mockImplementation((value) => {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Value is not a map');
  }
  return value;
});

const mockAssertAsString = jestGlobals.jest.fn().mockImplementation((value) => {
  if (typeof value !== 'string') {
    throw new Error('Value is not a string');
  }
  return value;
});

const mockAssertAsNumber = jestGlobals.jest.fn().mockImplementation((value) => {
  if (typeof value !== 'number') {
    throw new Error('Value is not a number');
  }
  return value;
});

const mockAssertAsBoolean = jestGlobals.jest.fn().mockImplementation((value) => {
  if (typeof value !== 'boolean') {
    throw new Error('Value is not a boolean');
  }
  return value;
});

module.exports = {
  RuntimeOptions,
  sleep: mockSleep,
  toBytes: mockToBytes,
  toString: mockToString,
  parseJSON: mockParseJSON,
  readAsString: mockReadAsString,
  readAsBytes: mockReadAsBytes,
  readAsJSON: mockReadAsJSON,
  getNonce: mockGetNonce,
  getDateUTCString: mockGetDateUTCString,
  defaultString: mockDefaultString,
  defaultNumber: mockDefaultNumber,
  toFormString: mockToFormString,
  toJSONString: mockToJSONString,
  empty: mockEmpty,
  equalString: mockEqualString,
  equalNumber: mockEqualNumber,
  isUnset: mockIsUnset,
  stringifyMapValue: mockStringifyMapValue,
  assertAsMap: mockAssertAsMap,
  assertAsString: mockAssertAsString,
  assertAsNumber: mockAssertAsNumber,
  assertAsBoolean: mockAssertAsBoolean,
  // Export all mock functions for testing
  mockSleep,
  mockToBytes,
  mockToString,
  mockParseJSON,
  mockReadAsString,
  mockReadAsBytes,
  mockReadAsJSON,
  mockGetNonce,
  mockGetDateUTCString,
  mockDefaultString,
  mockDefaultNumber,
  mockToFormString,
  mockToJSONString,
  mockEmpty,
  mockEqualString,
  mockEqualNumber,
  mockIsUnset,
  mockStringifyMapValue,
  mockAssertAsMap,
  mockAssertAsString,
  mockAssertAsNumber,
  mockAssertAsBoolean,
};
