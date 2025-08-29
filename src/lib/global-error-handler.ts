// Global error handler for Supabase connection failures

let supabaseUnavailableWarningShown = false;

// Override the global fetch to catch Supabase connection failures
const originalFetch = window.fetch;

window.fetch = async function(...args) {
  try {
    return await originalFetch.apply(this, args);
  } catch (error) {
    // Check if this is a Supabase-related fetch failure
    const url = args[0];
    if (typeof url === 'string' && url.includes('supabase.co')) {
      console.warn('Supabase connection failed, falling back to mock data mode');
      
      // Show warning only once
      if (!supabaseUnavailableWarningShown) {
        supabaseUnavailableWarningShown = true;
        console.info('🔄 Running in offline mode with mock data');
      }
      
      // Re-throw the error so the fallback mechanisms can handle it
      throw error;
    }
    
    // For non-Supabase requests, just re-throw
    throw error;
  }
};

export { };
