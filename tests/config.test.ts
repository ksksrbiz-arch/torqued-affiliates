import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateConfig, config } from '../src/config/index';

describe('config validation', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

describe('config validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Mock console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Clear module cache to reload config with new env vars
    vi.resetModules();
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
    vi.resetModules();
  });

  describe('parsePort', () => {
    it('should parse valid PORT', async () => {
      process.env.PORT = '3000';
      const { config } = await import('../src/config');
      expect(config.PORT).toBe(3000);
    });

    it('should use default PORT when not provided', async () => {
      delete process.env.PORT;
      const { config } = await import('../src/config');
      expect(config.PORT).toBe(4000);
    });

    it('should throw error for invalid PORT string', async () => {
      process.env.PORT = 'abc';
      await expect(() => import('../src/config')).rejects.toThrow('Invalid PORT "abc". Must be a positive integer.');
    });

    it('should throw error for negative PORT', async () => {
      process.env.PORT = '-100';
      await expect(() => import('../src/config')).rejects.toThrow('Invalid PORT "-100". Must be a positive integer.');
    });

    it('should throw error for zero PORT', async () => {
      process.env.PORT = '0';
      await expect(() => import('../src/config')).rejects.toThrow('Invalid PORT "0". Must be a positive integer.');
    });
  });

  describe('parseDatabaseType', () => {
    it('should accept valid DATABASE_TYPE: memory', async () => {
      process.env.DATABASE_TYPE = 'memory';
      const { config } = await import('../src/config');
      expect(config.DATABASE_TYPE).toBe('memory');
    });

    it('should accept valid DATABASE_TYPE: postgres', async () => {
      process.env.DATABASE_TYPE = 'postgres';
      const { config } = await import('../src/config');
      expect(config.DATABASE_TYPE).toBe('postgres');
    });

    it('should accept valid DATABASE_TYPE: mongo', async () => {
      process.env.DATABASE_TYPE = 'mongo';
      const { config } = await import('../src/config');
      expect(config.DATABASE_TYPE).toBe('mongo');
    });

    it('should default to memory when DATABASE_TYPE not provided', async () => {
      delete process.env.DATABASE_TYPE;
      const { config } = await import('../src/config');
      expect(config.DATABASE_TYPE).toBe('memory');
    });

    it('should throw error for invalid DATABASE_TYPE', async () => {
      process.env.DATABASE_TYPE = 'mysql';
      await expect(() => import('../src/config')).rejects.toThrow('Invalid DATABASE_TYPE "mysql". Must be one of: memory, postgres, mongo.');
    });
  });

  describe('validateConfig', () => {
    it('should pass validation with valid config', async () => {
      process.env.PORT = '4000';
      process.env.DATABASE_TYPE = 'memory';
      process.env.APP_SECRET = 'test-secret';
      process.env.SHOPIFY_API_KEY = 'test-key';
      process.env.SHOPIFY_API_SECRET = 'test-secret';
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should fail when DATABASE_URL is missing for postgres', async () => {
      process.env.DATABASE_TYPE = 'postgres';
      delete process.env.DATABASE_URL;
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).toThrow('DATABASE_URL is required when DATABASE_TYPE is postgres');
    });

    it('should fail when DATABASE_URL is missing for mongo', async () => {
      process.env.DATABASE_TYPE = 'mongo';
      delete process.env.DATABASE_URL;
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).toThrow('DATABASE_URL is required when DATABASE_TYPE is mongo');
    });

    it('should pass when DATABASE_URL is missing for memory', async () => {
      process.env.DATABASE_TYPE = 'memory';
      delete process.env.DATABASE_URL;
      process.env.SHOPIFY_API_KEY = 'test-key';
      process.env.SHOPIFY_API_SECRET = 'test-secret';
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should fail in production when MONGO_DB is not explicitly set for mongo type', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_TYPE = 'mongo';
      process.env.DATABASE_URL = 'mongodb://localhost:27017';
      process.env.APP_SECRET = 'prod-secret';
      process.env.SHOPIFY_API_KEY = 'test-key';
      process.env.SHOPIFY_API_SECRET = 'test-secret';
      delete process.env.MONGO_DB;
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).toThrow('MONGO_DB must be explicitly set in production when DATABASE_TYPE is mongo');
    });

    it('should fail in production with default APP_SECRET', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.APP_SECRET;
      process.env.SHOPIFY_API_KEY = 'test-key';
      process.env.SHOPIFY_API_SECRET = 'test-secret';
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).toThrow('APP_SECRET must be set to a non-default value in production');
    });

    it('should fail in production when SHOPIFY_API_KEY is missing', async () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_SECRET = 'prod-secret';
      delete process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_SECRET = 'test-secret';
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).toThrow('SHOPIFY_API_KEY and SHOPIFY_API_SECRET are required in production');
    });

    it('should fail in production when SHOPIFY_API_SECRET is missing', async () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_SECRET = 'prod-secret';
      process.env.SHOPIFY_API_KEY = 'test-key';
      delete process.env.SHOPIFY_API_SECRET;
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).toThrow('SHOPIFY_API_KEY and SHOPIFY_API_SECRET are required in production');
    });

    it('should warn but not fail in development when Shopify credentials are missing', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SHOPIFY_API_KEY;
      delete process.env.SHOPIFY_API_SECRET;
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SHOPIFY_API_KEY and SHOPIFY_API_SECRET should be set for Shopify integrations')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should pass with complete production config', async () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.DATABASE_TYPE = 'postgres';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.APP_SECRET = 'prod-secret-key';
      process.env.SHOPIFY_API_KEY = 'prod-key';
      process.env.SHOPIFY_API_SECRET = 'prod-secret';
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should pass with complete mongo config', async () => {
      process.env.DATABASE_TYPE = 'mongo';
      process.env.DATABASE_URL = 'mongodb://localhost:27017';
      process.env.MONGO_DB = 'test_db';
      process.env.SHOPIFY_API_KEY = 'test-key';
      process.env.SHOPIFY_API_SECRET = 'test-secret';
      
      const { validateConfig } = await import('../src/config');
      expect(() => validateConfig()).not.toThrow();
    });
  });
});
