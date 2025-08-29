// Internationalization (i18n) system for Field Engineer Portal
// Supports multiple languages with dynamic loading and context-aware translations

interface TranslationFile {
  [key: string]: string | TranslationFile;
}

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}

// Supported languages configuration
export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false,
    dateFormat: 'MM/dd/yyyy',
    numberFormat: { 
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    rtl: false,
    dateFormat: 'dd.MM.yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    rtl: false,
    dateFormat: 'yyyy/MM/dd',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    rtl: false,
    dateFormat: 'yyyy/MM/dd',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  }
};

// Translation dictionaries
const translations: Record<string, TranslationFile> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      search: 'Search',
      filter: 'Filter',
      reset: 'Reset',
      clear: 'Clear',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No'
    },
    navigation: {
      dashboard: 'Dashboard',
      tickets: 'Tickets',
      create: 'Create',
      map: 'Map',
      profile: 'Profile',
      settings: 'Settings',
      reports: 'Reports'
    },
    tickets: {
      title: 'Tickets',
      create: 'Create Ticket',
      edit: 'Edit Ticket',
      details: 'Ticket Details',
      status: 'Status',
      priority: 'Priority',
      type: 'Type',
      assignedTo: 'Assigned To',
      createdBy: 'Created By',
      location: 'Location',
      equipment: 'Equipment',
      description: 'Description',
      notes: 'Notes',
      attachments: 'Attachments',
      activities: 'Activities',
      dueDate: 'Due Date',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      resolvedAt: 'Resolved At'
    },
    status: {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      verified: 'Verified',
      closed: 'Closed'
    },
    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    },
    type: {
      maintenance: 'Maintenance',
      repair: 'Repair',
      inspection: 'Inspection',
      installation: 'Installation',
      emergency: 'Emergency'
    },
    auth: {
      signIn: 'Sign In',
      signOut: 'Sign Out',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      forgotPassword: 'Forgot Password?',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?"
    },
    dashboard: {
      title: 'Dashboard',
      overview: 'Overview',
      myTickets: 'My Tickets',
      assignedTickets: 'Assigned Tickets',
      recentActivity: 'Recent Activity',
      systemHealth: 'System Health',
      quickActions: 'Quick Actions'
    },
    messages: {
      ticketCreated: 'Ticket created successfully',
      ticketUpdated: 'Ticket updated successfully',
      ticketDeleted: 'Ticket deleted successfully',
      assignmentUpdated: 'Assignment updated successfully',
      profileUpdated: 'Profile updated successfully',
      settingsSaved: 'Settings saved successfully',
      errorOccurred: 'An error occurred. Please try again.',
      networkError: 'Network error. Please check your connection.',
      permissionDenied: 'Permission denied',
      invalidInput: 'Invalid input. Please check your data.',
      fileUploaded: 'File uploaded successfully',
      recordingSaved: 'Recording saved successfully'
    },
    media: {
      addMedia: 'Add Media',
      takePhoto: 'Take Photo',
      recordVideo: 'Record Video',
      recordAudio: 'Record Audio',
      uploadFiles: 'Upload Files',
      recording: 'Recording...',
      stopRecording: 'Stop Recording',
      playRecording: 'Play Recording',
      saveRecording: 'Save Recording',
      discardRecording: 'Discard Recording'
    },
    search: {
      advancedSearch: 'Advanced Search',
      searchPlaceholder: 'Search tickets by title, description, or ticket number...',
      filters: 'Filters',
      dateRange: 'Date Range',
      fromDate: 'From Date',
      toDate: 'To Date',
      location: 'Location',
      assignedTo: 'Assigned To',
      equipment: 'Equipment',
      hasAttachments: 'Has Attachments',
      activeFilters: 'Active Filters',
      resetFilters: 'Reset Filters',
      applyFilters: 'Apply Filters'
    }
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      update: 'Actualizar',
      search: 'Buscar',
      filter: 'Filtrar',
      reset: 'Reiniciar',
      clear: 'Limpiar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      submit: 'Enviar',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No'
    },
    navigation: {
      dashboard: 'Panel de Control',
      tickets: 'Tickets',
      create: 'Crear',
      map: 'Mapa',
      profile: 'Perfil',
      settings: 'Configuración',
      reports: 'Informes'
    },
    tickets: {
      title: 'Tickets',
      create: 'Crear Ticket',
      edit: 'Editar Ticket',
      details: 'Detalles del Ticket',
      status: 'Estado',
      priority: 'Prioridad',
      type: 'Tipo',
      assignedTo: 'Asignado a',
      createdBy: 'Creado por',
      location: 'Ubicación',
      equipment: 'Equipo',
      description: 'Descripción',
      notes: 'Notas',
      attachments: 'Adjuntos',
      activities: 'Actividades',
      dueDate: 'Fecha de Vencimiento',
      createdAt: 'Creado el',
      updatedAt: 'Actualizado el',
      resolvedAt: 'Resuelto el'
    },
    status: {
      open: 'Abierto',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      verified: 'Verificado',
      closed: 'Cerrado'
    },
    priority: {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica'
    },
    auth: {
      signIn: 'Iniciar Sesión',
      signOut: 'Cerrar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña'
    }
    // ... more Spanish translations
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      save: 'Enregistrer',
      cancel: 'Annuler'
    },
    navigation: {
      dashboard: 'Tableau de Bord',
      tickets: 'Tickets',
      create: 'Créer',
      map: 'Carte',
      profile: 'Profil'
    }
    // ... more French translations
  }
  // Add more languages as needed
};

class I18nService {
  private currentLanguage: string = 'en';
  private fallbackLanguage: string = 'en';
  private translations: Record<string, TranslationFile> = translations;
  private observers: ((language: string) => void)[] = [];

  constructor() {
    // Initialize with browser language or stored preference
    this.currentLanguage = this.detectLanguage();
    this.applyLanguageSettings();
  }

  // Detect user's preferred language
  private detectLanguage(): string {
    // Check stored preference
    const stored = localStorage.getItem('preferred-language');
    if (stored && SUPPORTED_LANGUAGES[stored]) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES[browserLang]) {
      return browserLang;
    }

    // Default to English
    return 'en';
  }

  // Apply language settings to document
  private applyLanguageSettings(): void {
    const config = SUPPORTED_LANGUAGES[this.currentLanguage];
    if (config) {
      document.documentElement.lang = config.code;
      document.documentElement.dir = config.rtl ? 'rtl' : 'ltr';
    }
  }

  // Get translation for a key
  translate(key: string, variables?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];

    // Traverse the translation object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if not found
        value = this.translations[this.fallbackLanguage];
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace variables in translation
    if (variables) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName]?.toString() || match;
      });
    }

    return value;
  }

  // Set current language
  setLanguage(languageCode: string): void {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      this.currentLanguage = languageCode;
      localStorage.setItem('preferred-language', languageCode);
      this.applyLanguageSettings();
      this.notifyObservers();
    }
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Get current language config
  getCurrentLanguageConfig(): LanguageConfig {
    return SUPPORTED_LANGUAGES[this.currentLanguage];
  }

  // Get all supported languages
  getSupportedLanguages(): Record<string, LanguageConfig> {
    return SUPPORTED_LANGUAGES;
  }

  // Format date according to current language
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const config = this.getCurrentLanguageConfig();
    
    return new Intl.DateTimeFormat(config.code, {
      ...options,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(dateObj);
  }

  // Format number according to current language
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const config = this.getCurrentLanguageConfig();
    return new Intl.NumberFormat(config.code, {
      ...config.numberFormat,
      ...options
    }).format(number);
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'USD'): string {
    const config = this.getCurrentLanguageConfig();
    return new Intl.NumberFormat(config.code, {
      style: 'currency',
      currency
    }).format(amount);
  }

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const config = this.getCurrentLanguageConfig();
    const rtf = new Intl.RelativeTimeFormat(config.code, { numeric: 'auto' });

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }

  // Check if current language is RTL
  isRTL(): boolean {
    return this.getCurrentLanguageConfig().rtl;
  }

  // Subscribe to language changes
  subscribe(callback: (language: string) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // Notify observers of language change
  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.currentLanguage));
  }

  // Load translations dynamically (for lazy loading)
  async loadTranslations(languageCode: string): Promise<boolean> {
  
    if (this.translations[languageCode]) {
      return true; // Already loaded
    }

    try {
      // In a real app, this would load from an external file or API
      // const response = await fetch(`/locales/${languageCode}.json`);
      // const translations = await response.json();
      // this.translations[languageCode] = translations;
      
      console.log(`Loading translations for ${languageCode}...`);
      return true;
    } catch (error) {
      console.error(`Failed to load translations for ${languageCode}:`, error);
      return false;
    }
  }
}

// Create and export singleton instance
export const i18n = new I18nService();

// Convenient translation function
export const t = (key: string, variables?: Record<string, string | number>): string => {
  return i18n.translate(key, variables);
};

// Export types
export type { LanguageConfig, TranslationFile };

export default i18n;
