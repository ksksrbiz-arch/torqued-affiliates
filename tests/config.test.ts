import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear module cache to reload config with new env vars
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
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
