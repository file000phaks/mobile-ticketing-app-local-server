// Security utilities for the application
// Implements AES encryption for local storage and secure data handling

interface EncryptedData {
  data: string;
  iv: string;
  timestamp: number;
}

class SecurityService {
  private key: CryptoKey | null = null;
  private readonly STORAGE_PREFIX = 'secure_';
  private readonly KEY_NAME = 'app_encryption_key';

  // Initialize the encryption key
  async initialize(): Promise<void> {
    try {
      // Try to retrieve existing key from secure storage
      const existingKey = localStorage.getItem( this.KEY_NAME );

      if ( existingKey ) {
        // Import the existing key
        const keyData = new Uint8Array( JSON.parse( existingKey ) );
        this.key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM' },
          false,
          [ 'encrypt', 'decrypt' ]
        );
      } else {
        // Generate a new key
        this.key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          [ 'encrypt', 'decrypt' ]
        );

        // Export and store the key
        const exportedKey = await crypto.subtle.exportKey( 'raw', this.key );
        localStorage.setItem(
          this.KEY_NAME,
          JSON.stringify( Array.from( new Uint8Array( exportedKey ) ) )
        );
      }
    } catch ( error ) {
      console.warn( 'Encryption not available, falling back to plain storage:', error );
      this.key = null;
    }
  }

  // Encrypt data using AES-GCM
  private async encrypt( data: string ): Promise<EncryptedData> {
    if ( !this.key ) {
      throw new Error( 'Encryption key not initialized' );
    }

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues( new Uint8Array( 12 ) );

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encoder.encode( data )
    );

    return {
      data: Array.from( new Uint8Array( encryptedData ) ).map( b => String.fromCharCode( b ) ).join( '' ),
      iv: Array.from( iv ).map( b => String.fromCharCode( b ) ).join( '' ),
      timestamp: Date.now()
    };
  }

  // Decrypt data using AES-GCM
  private async decrypt( encryptedData: EncryptedData ): Promise<string> {
    if ( !this.key ) {
      throw new Error( 'Encryption key not initialized' );
    }

    const iv = new Uint8Array( encryptedData.iv.split( '' ).map( c => c.charCodeAt( 0 ) ) );
    const data = new Uint8Array( encryptedData.data.split( '' ).map( c => c.charCodeAt( 0 ) ) );

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode( decryptedData );
  }

  // Securely store data in localStorage with encryption
  async setSecureItem( key: string, value: any ): Promise<void> {
    try {
      const serializedValue = JSON.stringify( value );

      if ( this.key ) {
        const encrypted = await this.encrypt( serializedValue );
        localStorage.setItem(
          this.STORAGE_PREFIX + key,
          JSON.stringify( encrypted )
        );
      } else {
        // Fallback to plain storage with warning
        console.warn( 'Storing data without encryption' );
        localStorage.setItem( this.STORAGE_PREFIX + key, serializedValue );
      }
    } catch ( error ) {
      console.error( 'Error storing secure data:', error );
      throw new Error( 'Failed to store secure data' );
    }
  }

  // Retrieve and decrypt data from localStorage
  async getSecureItem( key: string ): Promise<any> {
    try {
      const storedData = localStorage.getItem( this.STORAGE_PREFIX + key );
      if ( !storedData ) return null;

      if ( this.key ) {
        try {
          const encryptedData: EncryptedData = JSON.parse( storedData );
          const decryptedValue = await this.decrypt( encryptedData );
          return JSON.parse( decryptedValue );
        } catch {
          // If decryption fails, might be plain data from before encryption
          return JSON.parse( storedData );
        }
      } else {
        return JSON.parse( storedData );
      }
    } catch ( error ) {
      console.error( 'Error retrieving secure data:', error );
      return null;
    }
  }

  // Remove secure item
  removeSecureItem( key: string ): void {
    localStorage.removeItem( this.STORAGE_PREFIX + key );
  }

  // Clear all secure items
  clearSecureStorage(): void {
    const keys = Object.keys( localStorage );
    keys.forEach( key => {
      if ( key.startsWith( this.STORAGE_PREFIX ) ) {
        localStorage.removeItem( key );
      }
    } );
    localStorage.removeItem( this.KEY_NAME );
  }

  // Validate data integrity
  validateDataIntegrity( data: EncryptedData ): boolean {
    // Check if data is too old (e.g., 30 days)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    return Date.now() - data.timestamp < maxAge;
  }

  // Generate secure random token
  generateSecureToken( length: number = 32 ): string {
    const array = new Uint8Array( length );
    crypto.getRandomValues( array );
    return Array.from( array, byte => byte.toString( 16 ).padStart( 2, '0' ) ).join( '' );
  }

  // Hash sensitive data (like passwords for client-side verification)
  async hashData( data: string ): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest( 'SHA-256', encoder.encode( data ) );
    const hashArray = Array.from( new Uint8Array( hashBuffer ) );
    return hashArray.map( b => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
  }

  // Secure session management
  async createSecureSession( userData: any ): Promise<string> {
    const sessionId = this.generateSecureToken();
    const sessionData = {
      ...userData,
      createdAt: Date.now(),
      expiresAt: Date.now() + ( 8 * 60 * 60 * 1000 ) // 8 hours
    };

    await this.setSecureItem( `session_${sessionId}`, sessionData );
    return sessionId;
  }

  async getSecureSession( sessionId: string ): Promise<any> {
    const sessionData = await this.getSecureItem( `session_${sessionId}` );

    if ( !sessionData ) return null;

    // Check if session has expired
    if ( Date.now() > sessionData.expiresAt ) {
      this.removeSecureItem( `session_${sessionId}` );
      return null;
    }

    return sessionData;
  }

  async clearSecureSession( sessionId: string ): Promise<void> {
    this.removeSecureItem( `session_${sessionId}` );
  }

  // Auto-logout timer management
  private logoutTimer: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  startInactivityTimer( onLogout: () => void ): void {
    this.resetInactivityTimer( onLogout );

    // Listen for user activity
    const events = [ 'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart' ];
    const resetTimer = () => this.resetInactivityTimer( onLogout );

    events.forEach( event => {
      document.addEventListener( event, resetTimer, { passive: true } );
    } );
  }

  private resetInactivityTimer( onLogout: () => void ): void {
    if ( this.logoutTimer ) {
      clearTimeout( this.logoutTimer );
    }

    this.logoutTimer = setTimeout( () => {
      onLogout();
    }, this.INACTIVITY_TIMEOUT );
  }

  stopInactivityTimer(): void {
    if ( this.logoutTimer ) {
      clearTimeout( this.logoutTimer );
      this.logoutTimer = null;
    }
  }
}


interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export const calculatePasswordStrength = ( password: string ): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];

  if ( password.length >= 8 ) score += 1;
  else feedback.push( 'At least 8 characters' );

  if ( /[a-z]/.test( password ) ) score += 1;
  else feedback.push( 'Include lowercase letters' );

  if ( /[A-Z]/.test( password ) ) score += 1;
  else feedback.push( 'Include uppercase letters' );

  if ( /\d/.test( password ) ) score += 1;
  else feedback.push( 'Include numbers' );

  if ( /[!@#$%^&*(),.?":{}|<>]/.test( password ) ) score += 1;
  else feedback.push( 'Include special characters' );

  const colors = [
    'bg-red-500',
    'bg-red-400',
    'bg-yellow-500',
    'bg-yellow-400',
    'bg-green-500'
  ];

  return {
    score,
    feedback: feedback.slice( 0, 2 ), // Show only first 2 suggestions
    color: colors[ score ] || 'bg-gray-200'
  };
};

// Export singleton instance
export const securityService = new SecurityService();

// Initialize security service
securityService.initialize().catch( console.error );

export default securityService;
