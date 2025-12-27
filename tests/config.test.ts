import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateConfig, config } from '../src/config/index';

describe('config validation', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Mock console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console methods
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should validate successfully with default config', () => {
    // Default config should pass validation in dev
    expect(() => validateConfig()).not.toThrow();
  });

  it('should throw error when DATABASE_URL is missing for postgres', () => {
    // Temporarily modify config object to test validation
    const originalDatabaseType = config.DATABASE_TYPE;
    const originalDatabaseUrl = config.DATABASE_URL;
    
    (config as any).DATABASE_TYPE = 'postgres';
    (config as any).DATABASE_URL = '';

    expect(() => validateConfig()).toThrow('DATABASE_URL is required when DATABASE_TYPE is postgres.');
    
    // Restore
    (config as any).DATABASE_TYPE = originalDatabaseType;
    (config as any).DATABASE_URL = originalDatabaseUrl;
  });

  it('should throw error when DATABASE_URL is missing for mongo', () => {
    const originalDatabaseType = config.DATABASE_TYPE;
    const originalDatabaseUrl = config.DATABASE_URL;
    
    (config as any).DATABASE_TYPE = 'mongo';
    (config as any).DATABASE_URL = '';

    expect(() => validateConfig()).toThrow('DATABASE_URL is required when DATABASE_TYPE is mongo.');
    
    // Restore
    (config as any).DATABASE_TYPE = originalDatabaseType;
    (config as any).DATABASE_URL = originalDatabaseUrl;
  });

  it('should throw error when MONGO_DB is missing for mongo database type', () => {
    const originalDatabaseType = config.DATABASE_TYPE;
    const originalDatabaseUrl = config.DATABASE_URL;
    const originalMongoDb = config.MONGO_DB;
    
    (config as any).DATABASE_TYPE = 'mongo';
    (config as any).DATABASE_URL = 'mongodb://localhost:27017/test';
    (config as any).MONGO_DB = '';

    expect(() => validateConfig()).toThrow('MONGO_DB is required when DATABASE_TYPE is mongo.');
    
    // Restore
    (config as any).DATABASE_TYPE = originalDatabaseType;
    (config as any).DATABASE_URL = originalDatabaseUrl;
    (config as any).MONGO_DB = originalMongoDb;
  });

  it('should throw error when APP_SECRET is default in production', () => {
    const originalNodeEnv = config.NODE_ENV;
    const originalAppSecret = config.APP_SECRET;
    const originalShopifyKey = config.SHOPIFY_API_KEY;
    const originalShopifySecret = config.SHOPIFY_API_SECRET;
    
    (config as any).NODE_ENV = 'production';
    (config as any).APP_SECRET = 'dev-secret';
    (config as any).SHOPIFY_API_KEY = 'test-key';
    (config as any).SHOPIFY_API_SECRET = 'test-secret';

    expect(() => validateConfig()).toThrow('APP_SECRET must be set to a non-default value in production.');
    
    // Restore
    (config as any).NODE_ENV = originalNodeEnv;
    (config as any).APP_SECRET = originalAppSecret;
    (config as any).SHOPIFY_API_KEY = originalShopifyKey;
    (config as any).SHOPIFY_API_SECRET = originalShopifySecret;
  });

  it('should throw error when Shopify credentials are missing in production', () => {
    const originalNodeEnv = config.NODE_ENV;
    const originalAppSecret = config.APP_SECRET;
    const originalShopifyKey = config.SHOPIFY_API_KEY;
    const originalShopifySecret = config.SHOPIFY_API_SECRET;
    
    (config as any).NODE_ENV = 'production';
    (config as any).APP_SECRET = 'production-secret';
    (config as any).SHOPIFY_API_KEY = '';
    (config as any).SHOPIFY_API_SECRET = '';

    expect(() => validateConfig()).toThrow('SHOPIFY_API_KEY and SHOPIFY_API_SECRET are required in production.');
    
    // Restore
    (config as any).NODE_ENV = originalNodeEnv;
    (config as any).APP_SECRET = originalAppSecret;
    (config as any).SHOPIFY_API_KEY = originalShopifyKey;
    (config as any).SHOPIFY_API_SECRET = originalShopifySecret;
  });

  it('should warn but not throw when Shopify credentials are missing in development', () => {
    const originalNodeEnv = config.NODE_ENV;
    const originalShopifyKey = config.SHOPIFY_API_KEY;
    const originalShopifySecret = config.SHOPIFY_API_SECRET;
    
    (config as any).NODE_ENV = 'development';
    (config as any).SHOPIFY_API_KEY = '';
    (config as any).SHOPIFY_API_SECRET = '';

    expect(() => validateConfig()).not.toThrow();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('SHOPIFY_API_KEY and SHOPIFY_API_SECRET should be set')
    );
    
    // Restore
    (config as any).NODE_ENV = originalNodeEnv;
    (config as any).SHOPIFY_API_KEY = originalShopifyKey;
    (config as any).SHOPIFY_API_SECRET = originalShopifySecret;
  });

  it('should throw error for PORT zero', () => {
    const originalPort = config.PORT;
    
    (config as any).PORT = 0;

    expect(() => validateConfig()).toThrow('PORT must be a positive number.');
    
    // Restore
    (config as any).PORT = originalPort;
  });

  it('should throw error for negative PORT', () => {
    const originalPort = config.PORT;
    
    (config as any).PORT = -1;

    expect(() => validateConfig()).toThrow('PORT must be a positive number.');
    
    // Restore
    (config as any).PORT = originalPort;
  });

  it('should throw error for NaN PORT', () => {
    const originalPort = config.PORT;
    
    (config as any).PORT = NaN;

    expect(() => validateConfig()).toThrow('PORT must be a positive number.');
    
    // Restore
    (config as any).PORT = originalPort;
  });

  it('should accept valid PORT as a positive number', () => {
    const originalPort = config.PORT;
    
    (config as any).PORT = 8080;

    expect(() => validateConfig()).not.toThrow();
    
    // Restore
    (config as any).PORT = originalPort;
  });

  it('should accept memory database type without DATABASE_URL', () => {
    const originalDatabaseType = config.DATABASE_TYPE;
    const originalDatabaseUrl = config.DATABASE_URL;
    
    (config as any).DATABASE_TYPE = 'memory';
    (config as any).DATABASE_URL = '';

    expect(() => validateConfig()).not.toThrow();
    
    // Restore
    (config as any).DATABASE_TYPE = originalDatabaseType;
    (config as any).DATABASE_URL = originalDatabaseUrl;
  });

  it('should accept postgres with valid DATABASE_URL', () => {
    const originalDatabaseType = config.DATABASE_TYPE;
    const originalDatabaseUrl = config.DATABASE_URL;
    
    (config as any).DATABASE_TYPE = 'postgres';
    (config as any).DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

    expect(() => validateConfig()).not.toThrow();
    
    // Restore
    (config as any).DATABASE_TYPE = originalDatabaseType;
    (config as any).DATABASE_URL = originalDatabaseUrl;
  });

  it('should accept mongo with valid DATABASE_URL and MONGO_DB', () => {
    const originalDatabaseType = config.DATABASE_TYPE;
    const originalDatabaseUrl = config.DATABASE_URL;
    const originalMongoDb = config.MONGO_DB;
    
    (config as any).DATABASE_TYPE = 'mongo';
    (config as any).DATABASE_URL = 'mongodb://localhost:27017';
    (config as any).MONGO_DB = 'test_db';

    expect(() => validateConfig()).not.toThrow();
    
    // Restore
    (config as any).DATABASE_TYPE = originalDatabaseType;
    (config as any).DATABASE_URL = originalDatabaseUrl;
    (config as any).MONGO_DB = originalMongoDb;
  });
});
