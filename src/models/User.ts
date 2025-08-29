/**
 * @fileoverview User model classes for the Field Engineer Portal application
 * @author Field Engineer Portal Team
 */

/**
 * Represents the role of the user 
 */
export type UserRole = 'field_engineer' | 'supervisor' | 'admin';

/**
 * Represents a user profile in the system
 * @class UserProfile
 */
export class UserProfile {
  /** @type {string} Unique identifier for the user */
  public readonly id: string;
  
  /** @type {string} User's email address */
  public readonly email: string;
  
  /** @type {string|null} User's full name */
  public fullName: string | null;
  
  /** @type {'admin'|'supervisor'|'field_engineer'} User's role in the system */
  public role: 'admin' | 'supervisor' | 'field_engineer';
  
  /** @type {string|null} User's department */
  public department: string | null;
  
  /** @type {string|null} User's phone number */
  public phone: string | null;
  
  /** @type {boolean} Whether the user account is active */
  public isActive: boolean;
  
  /** @type {Date} When the user account was created */
  public readonly createdAt: Date;
  
  /** @type {Date} When the user account was last updated */
  public updatedAt: Date;

  /**
   * Creates a new UserProfile instance
   * @param {Object} userData - The user data object
   * @param {string} userData.id - Unique identifier
   * @param {string} userData.email - Email address
   * @param {string|null} userData.fullName - Full name
   * @param {'admin'|'supervisor'|'field_engineer'} userData.role - User role
   * @param {string|null} userData.department - Department
   * @param {string|null} userData.phone - Phone number
   * @param {boolean} userData.isActive - Account status
   * @param {Date} userData.createdAt - Creation date
   * @param {Date} userData.updatedAt - Last update date
   */
  constructor(userData: {
    id: string;
    email: string;
    fullName: string | null;
    role: 'admin' | 'supervisor' | 'field_engineer';
    department: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = userData.id;
    this.email = userData.email;
    this.fullName = userData.fullName;
    this.role = userData.role;
    this.department = userData.department;
    this.phone = userData.phone;
    this.isActive = userData.isActive;
    this.createdAt = userData.createdAt;
    this.updatedAt = userData.updatedAt;
  }

  /**
   * Checks if the user has administrator privileges
   * @returns {boolean} True if user is an admin
   */
  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Checks if the user has supervisor privileges
   * @returns {boolean} True if user is a supervisor
   */
  public isSupervisor(): boolean {
    return this.role === 'supervisor';
  }

  /**
   * Checks if the user is a field engineer
   * @returns {boolean} True if user is a field engineer
   */
  public isFieldEngineer(): boolean {
    return this.role === 'field_engineer';
  }

  /**
   * Checks if the user has management privileges (admin or supervisor)
   * @returns {boolean} True if user can manage others
   */
  public hasManagementPrivileges(): boolean {
    return this.isAdmin() || this.isSupervisor();
  }

  /**
   * Gets the user's display name (full name or email)
   * @returns {string} Display name
   */
  public getDisplayName(): string {
    return this.fullName || this.email;
  }

  /**
   * Gets the user's initials for avatar display
   * @returns {string} User initials (max 2 characters)
   */
  public getInitials(): string {
    if (this.fullName) {
      return this.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return this.email.substring(0, 2).toUpperCase();
  }

  /**
   * Updates user profile information
   * @param {Partial<UserProfile>} updates - Fields to update
   */
  public updateProfile(updates: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }

  /**
   * Deactivates the user account
   */
  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Activates the user account
   */
  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Converts the user profile to a plain object
   * @returns {Object} Plain object representation
   */
  public toJSON(): object {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      department: this.department,
      phone: this.phone,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a UserProfile instance from a database record
   * @param {any} record - Database record
   * @returns {UserProfile} UserProfile instance
   */
  public static fromDatabaseRecord(record: any): UserProfile {
    return new UserProfile({
      id: record.id,
      email: record.email,
      fullName: record.full_name,
      role: record.role,
      department: record.department,
      phone: record.phone,
      isActive: record.is_active,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    });
  }
}

/**
 * Specialized class for Administrator users
 * @class Admin
 * @extends UserProfile
 */
export class Admin extends UserProfile {
  /**
   * Creates a new Admin instance
   * @param {Object} userData - User data (role must be 'admin')
   */
  constructor(userData: Parameters<typeof UserProfile.prototype.constructor>[0]) {
    if (userData.role !== 'admin') {
      throw new Error('Admin class requires role to be "admin"');
    }
    super(userData);
  }

  /**
   * Checks if admin can manage a specific user
   * @param {UserProfile} user - User to check
   * @returns {boolean} True if admin can manage the user
   */
  public canManageUser(user: UserProfile): boolean {
    return user.id !== this.id; // Admin can manage all users except themselves
  }

  /**
   * Gets all manageable roles for assignment
   * @returns {Array<string>} Array of role names
   */
  public getManageableRoles(): string[] {
    return ['admin', 'supervisor', 'field_engineer'];
  }
}

/**
 * Specialized class for Supervisor users
 * @class Supervisor
 * @extends UserProfile
 */
export class Supervisor extends UserProfile {
  /**
   * Creates a new Supervisor instance
   * @param {Object} userData - User data (role must be 'supervisor')
   */
  constructor(userData: Parameters<typeof UserProfile.prototype.constructor>[0]) {
    if (userData.role !== 'supervisor') {
      throw new Error('Supervisor class requires role to be "supervisor"');
    }
    super(userData);
  }

  /**
   * Checks if supervisor can manage a specific user
   * @param {UserProfile} user - User to check
   * @returns {boolean} True if supervisor can manage the user
   */
  public canManageUser(user: UserProfile): boolean {
    return user.isFieldEngineer(); // Supervisors can only manage field engineers
  }

  /**
   * Gets all manageable roles for assignment
   * @returns {Array<string>} Array of role names
   */
  public getManageableRoles(): string[] {
    return ['field_engineer'];
  }

  /**
   * Checks if supervisor should be notified about ticket events
   * @param {string} eventType - Type of event ('created', 'updated', etc.)
   * @returns {boolean} True if should be notified
   */
  public shouldReceiveNotification(eventType: string): boolean {
    const notificationEvents = ['created', 'escalated', 'overdue'];
    return notificationEvents.includes(eventType);
  }
}

/**
 * Specialized class for Field Engineer users
 * @class FieldEngineer
 * @extends UserProfile
 */
export class FieldEngineer extends UserProfile {
  /**
   * Creates a new FieldEngineer instance
   * @param {Object} userData - User data (role must be 'field_engineer')
   */
  constructor(userData: Parameters<typeof UserProfile.prototype.constructor>[0]) {
    if (userData.role !== 'field_engineer') {
      throw new Error('FieldEngineer class requires role to be "field_engineer"');
    }
    super(userData);
  }

  /**
   * Checks if field engineer can manage a specific user
   * @param {UserProfile} user - User to check
   * @returns {boolean} Always false for field engineers
   */
  public canManageUser(user: UserProfile): boolean {
    return false; // Field engineers cannot manage other users
  }

  /**
   * Gets all manageable roles for assignment
   * @returns {Array<string>} Empty array (no management privileges)
   */
  public getManageableRoles(): string[] {
    return [];
  }

  /**
   * Checks if field engineer should be notified about ticket events
   * @param {string} eventType - Type of event
   * @param {string} ticketCreatorId - ID of ticket creator
   * @param {string|null} assignedToId - ID of assigned user
   * @returns {boolean} True if should be notified
   */
  public shouldReceiveNotification(
    eventType: string, 
    ticketCreatorId: string, 
    assignedToId: string | null
  ): boolean {
    const isCreator = ticketCreatorId === this.id;
    const isAssigned = assignedToId === this.id;
    
    switch (eventType) {
      case 'assigned':
        return isAssigned;
      case 'resolved':
        return isCreator;
      case 'commented':
        return isCreator || isAssigned;
      default:
        return false;
    }
  }
}

/**
 * Factory class for creating user instances based on role
 * @class UserFactory
 */
export class UserFactory {
  /**
   * Creates a user instance based on the role
   * @param {Object} userData - User data
   * @returns {UserProfile|Admin|Supervisor|FieldEngineer} Appropriate user instance
   */
  public static createUser(userData: Parameters<typeof UserProfile.prototype.constructor>[0]): UserProfile {
    switch (userData.role) {
      case 'admin':
        return new Admin(userData);
      case 'supervisor':
        return new Supervisor(userData);
      case 'field_engineer':
        return new FieldEngineer(userData);
      default:
        throw new Error(`Unknown user role: ${userData.role}`);
    }
  }

  /**
   * Creates a user instance from database record
   * @param {any} record - Database record
   * @returns {UserProfile|Admin|Supervisor|FieldEngineer} Appropriate user instance
   */
  public static fromDatabaseRecord(record: any): UserProfile {
    const userData = {
      id: record.id,
      email: record.email,
      fullName: record.full_name,
      role: record.role,
      department: record.department,
      phone: record.phone,
      isActive: record.is_active,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
    
    return UserFactory.createUser(userData);
  }
}
