/**
 * @fileoverview Environment configuration for the Field Engineer Portal application
 * @author Field Engineer Portal Team
 */

/**
 * Environment configuration interface
 * @interface EnvironmentConfig
 */
interface EnvironmentConfig {
  /** Whether the app is running in production mode */
  isProduction: boolean;
  
  /** Whether the app is running in development mode */
  isDevelopment: boolean;
  
  /** Whether to enable debug features */
  enableDebug: boolean;
  
  /** Supabase configuration */
  supabase: {
    url: string;
    anonKey: string;
    isConfigured: boolean;
  };
  
  /** Application configuration */
  app: {
    name: string;
    version: string;
    baseUrl: string;
  };
  
  /** Feature flags */
  features: {
    enableMockFallback: boolean;
    enableOfflineMode: boolean;
    enablePushNotifications: boolean;
    enableAuditLogging: boolean;
  };
}

/**
 * Gets the current environment configuration
 * @returns {EnvironmentConfig} Environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;
  
  // Supabase configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'your-supabase-url' && 
    supabaseAnonKey !== 'your-supabase-anon-key'
  );

  return {
    isProduction,
    isDevelopment,
    enableDebug: isDevelopment,
    
    supabase: {
      url: supabaseUrl || '',
      anonKey: supabaseAnonKey || '',
      isConfigured: isSupabaseConfigured
    },
    
    app: {
      name: 'Field Engineer Portal',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      baseUrl: import.meta.env.VITE_APP_BASE_URL || window.location.origin
    },
    
    features: {
      // In production, only enable mock fallback if Supabase is not configured
      enableMockFallback: !isProduction || !isSupabaseConfigured,
      enableOfflineMode: true,
      enablePushNotifications: isProduction && isSupabaseConfigured,
      enableAuditLogging: isSupabaseConfigured
    }
  };
}

/**
 * Validates the environment configuration
 * @returns {Object} Validation result with any errors
 */
export function validateEnvironmentConfig(): { isValid: boolean; errors: string[] } {
  const config = getEnvironmentConfig();
  const errors: string[] = [];

  // Check if running in production without proper Supabase configuration
  if (config.isProduction && !config.supabase.isConfigured) {
    errors.push('Production mode requires valid Supabase configuration (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)');
  }

  // Validate Supabase URL format
  if (config.supabase.url && !config.supabase.url.includes('supabase.co')) {
    errors.push('Invalid Supabase URL format');
  }

  // Check for placeholder values
  if (config.supabase.url === 'your-supabase-url' || config.supabase.anonKey === 'your-supabase-anon-key') {
    errors.push('Please replace placeholder Supabase credentials with actual values');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Logs environment configuration (excluding sensitive data)
 */
export function logEnvironmentConfig(): void {
  const config = getEnvironmentConfig();
  const validation = validateEnvironmentConfig();
  
  console.log('🔧 Environment Configuration:', {
    mode: config.isProduction ? 'production' : 'development',
    app: config.app,
    features: config.features,
    supabase: {
      configured: config.supabase.isConfigured,
      url: config.supabase.url ? `${config.supabase.url.substring(0, 20)}...` : 'not set'
    },
    validation: validation.isValid ? '✅ Valid' : `❌ Invalid: ${validation.errors.join(', ')}`
  });
  
  if (!validation.isValid) {
    console.warn('⚠️ Environment configuration issues:', validation.errors);
    
    if (config.isProduction) {
      console.error('🚨 Production deployment with invalid configuration!');
    }
  }
}

// Export the singleton configuration
export const config = getEnvironmentConfig();

// Log configuration on module load (only in development)
if (config.isDevelopment) {
  logEnvironmentConfig();
}

/**
 * Environment-aware console logging
 * @param {string} level - Log level (log, warn, error)
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
export function envLog(level: 'log' | 'warn' | 'error', message: string, ...args: any[]): void {

  if (config.enableDebug || level === 'error') {

    console[level](`[${config.app.name}]`, message, ...args);

  }

}

/**
 * Checks if a feature is enabled
 * @param {keyof EnvironmentConfig['features']} feature - Feature name
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  return config.features[feature];
}
