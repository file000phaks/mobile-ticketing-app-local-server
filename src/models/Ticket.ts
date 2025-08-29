/**
 * @fileoverview Ticket model classes for the Field Engineer Portal application
 * @author Field Engineer Portal Team
 */

import { UserProfile } from './User';

/**
 * Represents the priority levels for tickets
 * @typedef {'low'|'medium'|'high'|'critical'} TicketPriority
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Represents the status states for tickets
 * @typedef {'open'|'assigned'|'in_progress'|'resolved'|'verified'|'closed'} TicketStatus
 */
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'verified' | 'closed';

/**
 * Represents the types of tickets
 * @typedef {'maintenance'|'repair'|'inspection'|'emergency'|'preventive'} TicketType
 */
export type TicketType = 'maintenance' | 'repair' | 'inspection' | 'emergency' | 'preventive';

/**
 * Represents a ticket activity entry
 * @interface TicketActivity
 */
export interface TicketActivity {
  id: string;
  ticketId: string;
  userId: string;
  type: 'comment' | 'status_change' | 'assignment' | 'media_upload';
  description: string;
  createdAt: Date;
  userProfile?: UserProfile;
}

/**
 * Represents ticket media attachments
 * @interface TicketMedia
 */
export interface TicketMedia {
  id: string;
  ticketId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  createdAt: Date;
}

/**
 * Represents equipment information
 * @interface Equipment
 */
export interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a ticket in the system
 * @class Ticket
 */
export class Ticket {
  /** @type {string} Unique identifier for the ticket */
  public readonly id: string;

  /** @type {string} Human-readable ticket number */
  public readonly ticketNumber: string;

  /** @type {string} Ticket title/summary */
  public title: string;

  /** @type {string} Detailed description of the issue */
  public description: string;

  /** @type {TicketType} Type of ticket */
  public type: TicketType;

  /** @type {TicketPriority} Priority level */
  public priority: TicketPriority;

  /** @type {TicketStatus} Current status */
  public status: TicketStatus;

  /** @type {string} ID of user who created the ticket */
  public readonly createdBy: string;

  /** @type {string|null} ID of assigned user */
  public assignedTo: string | null;

  /** @type {string|null} ID of user who verified resolution */
  public verifiedBy: string | null;

  /**@type {UserProfile|null} ID of user assigning the ticket */
  public assignedBy: string | null;

  /** @type {string|null} ID of related equipment */
  public equipmentId: string | null;

  /** @type {string} Location where work is needed */
  public location: string;

  /** @type {Date} When the ticket was created */
  public readonly createdAt: Date;

  /** @type {Date} When the ticket was last updated */
  public updatedAt: Date;

  /** @type {Date|null} Due date for completion */
  public dueDate: Date | null;

  /** @type {Date|null} When the ticket was resolved */
  public resolvedAt: Date | null;

  /** @type {number|null} Estimated hours for completion */
  public estimatedHours: number | null;

  /** @type {number} Actual hours spent */
  public actualHours: number;

  /** @type {string|null} Additional notes */
  public notes: string | null;

  /** @type {UserProfile|null} Profile of ticket creator */
  public createdByProfile: UserProfile | null;

  /** @type {UserProfile|null} Profile of assigned user */
  public assignedToProfile: UserProfile | null;

  /** @type {UserProfile|null} Profile of verifying user */
  public verifiedByProfile: UserProfile | null;

  public verifiedAt: Date | null;

  /** @type {Equipment|null} Related equipment */
  public equipment: Equipment | null;

  /** @type {TicketActivity[]} Ticket activity history */
  public activities: TicketActivity[];

  /** @type {TicketMedia[]} Media attachments */
  public media: TicketMedia[];

  /**@type {Date} Date ticket is assigned to field engineer by supervisor */
  public assignedAt: Date | null;

  /**@type {UserProfile|null} Profile of user assigning the ticket */
  public assignedByProfile: UserProfile | null;

  /**
   * Creates a new Ticket instance
   * @param {Object} ticketData - The ticket data object
   */
  constructor( ticketData: {
    id: string;
    ticketNumber: string;
    title: string;
    description: string;
    type: TicketType;
    priority: TicketPriority;
    status: TicketStatus;
    createdBy: string;
    assignedTo?: string | null;
    assignedByProfile?: UserProfile | null;
    assignedBy?: string | null;
    verifiedBy?: string | null;
    verifiedAt?: Date | null;
    equipmentId?: string | null;
    location: string;
    createdAt: Date;
    updatedAt: Date;
    assignedAt: Date;
    dueDate?: Date | null;
    resolvedAt?: Date | null;
    estimatedHours?: number | null;
    actualHours?: number;
    notes?: string | null;
    createdByProfile?: UserProfile | null;
    assignedToProfile?: UserProfile | null;
    verifiedByProfile?: UserProfile | null;
    equipment?: Equipment | null;
    activities?: TicketActivity[];
    media?: TicketMedia[];
  } ) {

    this.id = ticketData.id;
    this.ticketNumber = ticketData.ticketNumber;
    this.title = ticketData.title;
    this.description = ticketData.description;
    this.type = ticketData.type;
    this.priority = ticketData.priority;
    this.status = ticketData.status;
    this.createdBy = ticketData.createdBy;
    this.assignedTo = ticketData.assignedTo || null;
    this.assignedBy = ticketData.assignedBy || null;
    this.assignedByProfile = ticketData.assignedByProfile || null;
    this.verifiedBy = ticketData.verifiedBy || null;
    this.verifiedAt = ticketData.verifiedAt || null;
    this.equipmentId = ticketData.equipmentId || null;
    this.location = ticketData.location;
    this.createdAt = ticketData.createdAt;
    this.updatedAt = ticketData.updatedAt;
    this.assignedAt = ticketData.assignedAt;
    this.dueDate = ticketData.dueDate || null;
    this.resolvedAt = ticketData.resolvedAt || null;
    this.estimatedHours = ticketData.estimatedHours || null;
    this.actualHours = ticketData.actualHours || 0;
    this.notes = ticketData.notes || null;
    this.createdByProfile = ticketData.createdByProfile || null;
    this.assignedToProfile = ticketData.assignedToProfile || null;
    this.verifiedByProfile = ticketData.verifiedByProfile || null;
    this.equipment = ticketData.equipment || null;
    this.activities = ticketData.activities || [];
    this.media = ticketData.media || [];
  }

  /**
   * Checks if the ticket is overdue
   * @returns {boolean} True if ticket is past due date and not completed
   */
  public isOverdue(): boolean {
    if ( !this.dueDate ) return false;
    const now = new Date();
    const completedStatuses: TicketStatus[] = [ 'resolved', 'verified', 'closed' ];
    return this.dueDate < now && !completedStatuses.includes( this.status );
  }

  /**
   * Checks if the ticket is completed
   * @returns {boolean} True if ticket is in a completed state
   */
  public isCompleted(): boolean {
    const completedStatuses: TicketStatus[] = [ 'resolved', 'verified', 'closed' ];
    return completedStatuses.includes( this.status );
  }

  /**
   * Checks if the ticket is active (not completed)
   * @returns {boolean} True if ticket is in an active state
   */
  public isActive(): boolean {
    return !this.isCompleted();
  }

  /**
   * Checks if the ticket is high priority
   * @returns {boolean} True if priority is high or critical
   */
  public isHighPriority(): boolean {
    return this.priority === 'high' || this.priority === 'critical';
  }

  /**
   * Checks if the ticket is critical
   * @returns {boolean} True if priority is critical
   */
  public isCritical(): boolean {

    return this.priority === 'critical';

  }

  /**
   * Gets the ticket age in days
   * @returns {number} Number of days since creation
   */
  public getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs( now.getTime() - this.createdAt.getTime() );
    return Math.ceil( diffTime / ( 1000 * 60 * 60 * 24 ) );
  }

  /**
   * Gets the time until due date in hours
   * @returns {number|null} Hours until due, null if no due date
   */
  public getHoursUntilDue(): number | null {
    if ( !this.dueDate ) return null;
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    return Math.floor( diffTime / ( 1000 * 60 * 60 ) );
  }

  /**
   * Gets the resolution time in hours
   * @returns {number|null} Hours to resolve, null if not resolved
   */
  public getResolutionTimeHours(): number | null {
    if ( !this.resolvedAt ) return null;
    const diffTime = this.resolvedAt.getTime() - this.createdAt.getTime();
    return Math.floor( diffTime / ( 1000 * 60 * 60 ) );
  }

  /**
   * Assigns the ticket to a user
   * @param {string} userId - ID of user to assign to
   * @param {UserProfile} assignedByUser - User making the assignment
   */
  public assignTo( userId: string, assignedByUser: UserProfile ): void {
    const previousAssignee = this.assignedTo;
    this.assignedTo = userId;
    this.status = 'assigned';
    this.updatedAt = new Date();

    // Add activity log
    this.addActivity( {
      id: `act_${Date.now()}`,
      ticketId: this.id,
      userId: assignedByUser.id,
      type: 'assignment',
      description: `Ticket assigned to user ${userId}${previousAssignee ? ` (previously assigned to ${previousAssignee})` : ''}`,
      createdAt: new Date(),
      userProfile: assignedByUser
    } );
  }

  /**
   * Updates the ticket status
   * @param {TicketStatus} newStatus - New status to set
   * @param {UserProfile} updatedByUser - User making the update
   * @param {string} [notes] - Optional notes about the status change
   */
  public updateStatus( newStatus: TicketStatus, updatedByUser: UserProfile, notes?: string ): void {
    const previousStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();

    // Set resolved date if status is resolved
    if ( newStatus === 'resolved' && !this.resolvedAt ) {
      this.resolvedAt = new Date();
    }

    // Add activity log
    this.addActivity( {
      id: `act_${Date.now()}`,
      ticketId: this.id,
      userId: updatedByUser.id,
      type: 'status_change',
      description: `Status changed from ${previousStatus} to ${newStatus}${notes ? `: ${notes}` : ''}`,
      createdAt: new Date(),
      userProfile: updatedByUser
    } );
  }

  /**
   * Updates the ticket priority
   * @param {TicketPriority} newPriority - New priority to set
   * @param {UserProfile} updatedByUser - User making the update
   */
  public updatePriority( newPriority: TicketPriority, updatedByUser: UserProfile ): void {
    const previousPriority = this.priority;
    this.priority = newPriority;
    this.updatedAt = new Date();

    // Add activity log
    this.addActivity( {
      id: `act_${Date.now()}`,
      ticketId: this.id,
      userId: updatedByUser.id,
      type: 'status_change',
      description: `Priority changed from ${previousPriority} to ${newPriority}`,
      createdAt: new Date(),
      userProfile: updatedByUser
    } );
  }

  /**
   * Adds a comment to the ticket
   * @param {string} comment - Comment text
   * @param {UserProfile} commentByUser - User adding the comment
   */
  public addComment( comment: string, commentByUser: UserProfile ): void {
    this.updatedAt = new Date();

    this.addActivity( {
      id: `act_${Date.now()}`,
      ticketId: this.id,
      userId: commentByUser.id,
      type: 'comment',
      description: comment,
      createdAt: new Date(),
      userProfile: commentByUser
    } );
  }

  /**
   * Adds an activity to the ticket
   * @param {TicketActivity} activity - Activity to add
   */
  public addActivity( activity: TicketActivity ): void {
    this.activities.push( activity );
  }

  /**
   * Adds media to the ticket
   * @param {TicketMedia} media - Media to add
   */
  public addMedia( media: TicketMedia ): void {
    this.media.push( media );
  }

  /**
   * Checks if a user can view this ticket
   * @param {UserProfile} user - User to check
   * @returns {boolean} True if user can view the ticket
   */
  public canUserView( user: UserProfile ): boolean {
    // Admins and supervisors can view all tickets
    if ( user.hasManagementPrivileges() ) {
      return true;
    }

    // Field engineers can view tickets they created or are assigned to
    return this.createdBy === user.id || this.assignedTo === user.id;
  }

  /**
   * Checks if a user can edit this ticket
   * @param {UserProfile} user - User to check
   * @returns {boolean} True if user can edit the ticket
   */
  public canUserEdit( user: UserProfile ): boolean {
    // Admins can edit all tickets
    if ( user.isAdmin() ) {
      return true;
    }

    // Supervisors can edit most tickets (except closed ones)
    if ( user.isSupervisor() && this.status !== 'closed' ) {
      return true;
    }

    // Field engineers can edit tickets they created (if not closed) or are assigned to
    if ( user.isFieldEngineer() ) {
      const isCreator = this.createdBy === user.id;
      const isAssigned = this.assignedTo === user.id;
      return ( isCreator || isAssigned ) && this.status !== 'closed';
    }

    return false;
  }

  /**
   * Gets users who should be notified about ticket events
   * @param {string} eventType - Type of event that occurred
   * @returns {string[]} Array of user IDs to notify
   */
  public getUsersToNotify( eventType: string ): string[] {
    const usersToNotify: string[] = [];

    switch ( eventType ) {
      case 'created':
        // Notify all supervisors and admins when a new ticket is created
        // Note: This will need to be expanded with actual supervisor/admin IDs
        break;

      case 'assigned':
        // Notify the assigned user
        if ( this.assignedTo ) {
          usersToNotify.push( this.assignedTo );
        }
        break;

      case 'resolved':
        // Notify the ticket creator
        usersToNotify.push( this.createdBy );
        break;

      case 'commented':
        // Notify creator and assigned user (if different)
        usersToNotify.push( this.createdBy );
        if ( this.assignedTo && this.assignedTo !== this.createdBy ) {
          usersToNotify.push( this.assignedTo );
        }
        break;

      case 'overdue':
        // Notify assigned user and supervisors
        if ( this.assignedTo ) {
          usersToNotify.push( this.assignedTo );
        }
        break;
    }

    return [ ...new Set( usersToNotify ) ]; // Remove duplicates
  }

  /**
   * Converts the ticket to a plain object
   * @returns {Object} Plain object representation
   */
  public toJSON(): object {
    return {
      id: this.id,
      ticketNumber: this.ticketNumber,
      title: this.title,
      description: this.description,
      type: this.type,
      priority: this.priority,
      status: this.status,
      createdBy: this.createdBy,
      assignedTo: this.assignedTo,
      verifiedBy: this.verifiedBy,
      equipmentId: this.equipmentId,
      location: this.location,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      dueDate: this.dueDate,
      resolvedAt: this.resolvedAt,
      estimatedHours: this.estimatedHours,
      actualHours: this.actualHours,
      notes: this.notes,
      createdByProfile: this.createdByProfile?.toJSON(),
      assignedToProfile: this.assignedToProfile?.toJSON(),
      verifiedByProfile: this.verifiedByProfile?.toJSON(),
      equipment: this.equipment,
      activities: this.activities,
      media: this.media
    };
  }

  /**
   * Creates a Ticket instance from a database record
   * @param {any} record - Database record
   * @returns {Ticket} Ticket instance
   */
  public static fromDatabaseRecord( record: any ): Ticket {

    return new Ticket( {
      id: record.id,
      ticketNumber: record.ticketNumber,
      title: record.title,
      description: record.description,
      type: record.type,
      priority: record.priority,
      status: record.status,
      createdBy: record.createdBy,
      assignedTo: record.assigned_to,
      verifiedBy: record.verifiedBy,
      equipmentId: record.equipmentId,
      location: record.location,
      createdAt: new Date( record.createdAt ),
      updatedAt: new Date( record.updatedAt ),
      assignedAt: new Date( record.assignedAt ),
      dueDate: record.due_date ? new Date( record.dueDate ) : null,
      resolvedAt: record.resolvedAt ? new Date( record.resolvedAt ) : null,
      estimatedHours: record.estimated_hours,
      actualHours: record.actual_hours || 0,
      notes: record.notes,
      createdByProfile: record.createdByProfile ? UserProfile.fromDatabaseRecord( record.createdByProfile ) : null,
      assignedToProfile: record.assignedToProfile ? UserProfile.fromDatabaseRecord( record.assignedToProfile ) : null,
      verifiedByProfile: record.verifiedByProfile ? UserProfile.fromDatabaseRecord( record.verifiedByProfile ) : null,
      equipment: record.equipment,
      activities: record.activities || [],
      media: record.media || []
    } );
  }
}

/**
 * Factory class for creating specialized ticket instances
 * @class TicketFactory
 */
export class TicketFactory {
  /**
   * Creates a new ticket with default values
   * @param {Object} ticketData - Basic ticket data
   * @returns {Ticket} New ticket instance
   */
  public static createNewTicket( ticketData: {
    title: string;
    description: string;
    type: TicketType;
    priority: TicketPriority;
    createdBy: string;
    location: string;
    equipmentId?: string;
    dueDate?: Date;
    estimatedHours?: number;
  } ): Ticket {

    const now = new Date();
    const ticketNumber = `TKT-${Date.now().toString().slice( -6 )}`;

    return new Ticket( {
      id: `ticket_${Date.now()}_${Math.random().toString( 36 ).substr( 2, 9 )}`,
      ticketNumber,
      title: ticketData.title,
      description: ticketData.description,
      type: ticketData.type,
      priority: ticketData.priority,
      status: 'open',
      createdBy: ticketData.createdBy,
      location: ticketData.location,
      createdAt: now,
      updatedAt: now,
      equipmentId: ticketData.equipmentId,
      dueDate: ticketData.dueDate,
      estimatedHours: ticketData.estimatedHours
    } );
  }

  /**
   * Creates an emergency ticket with high priority and immediate due date
   * @param {Object} ticketData - Basic ticket data
   * @returns {Ticket} Emergency ticket instance
   */
  public static createEmergencyTicket( ticketData: {
    title: string;
    description: string;
    createdBy: string;
    location: string;
    equipmentId?: string;
  } ): Ticket {
    const now = new Date();
    const dueDate = new Date( now.getTime() + 4 * 60 * 60 * 1000 ); // 4 hours from now

    return TicketFactory.createNewTicket( {
      ...ticketData,
      type: 'emergency',
      priority: 'critical',
      dueDate,
      estimatedHours: 4
    } );
  }
}

/**
 * Utility class for ticket operations and queries
 * @class TicketUtils
 */
export class TicketUtils {
  /**
   * Filters tickets by status
   * @param {Ticket[]} tickets - Array of tickets
   * @param {TicketStatus[]} statuses - Statuses to filter by
   * @returns {Ticket[]} Filtered tickets
   */
  public static filterByStatus( tickets: Ticket[], statuses: TicketStatus[] ): Ticket[] {
    return tickets.filter( ticket => statuses.includes( ticket.status ) );
  }

  /**
   * Filters tickets by priority
   * @param {Ticket[]} tickets - Array of tickets
   * @param {TicketPriority[]} priorities - Priorities to filter by
   * @returns {Ticket[]} Filtered tickets
   */
  public static filterByPriority( tickets: Ticket[], priorities: TicketPriority[] ): Ticket[] {
    return tickets.filter( ticket => priorities.includes( ticket.priority ) );
  }

  /**
   * Gets overdue tickets
   * @param {Ticket[]} tickets - Array of tickets
   * @returns {Ticket[]} Overdue tickets
   */
  public static getOverdueTickets( tickets: Ticket[] ): Ticket[] {
    return tickets.filter( ticket => ticket.isOverdue() );
  }

  /**
   * Gets completed tickets
   * @param {Ticket[]} tickets - Array of tickets
   * @returns {Ticket[]} Completed tickets
   */
  public static getCompletedTickets( tickets: Ticket[] ): Ticket[] {
    return tickets.filter( ticket => ticket.isCompleted() );
  }

  /**
   * Gets active tickets
   * @param {Ticket[]} tickets - Array of tickets
   * @returns {Ticket[]} Active tickets
   */
  public static getActiveTickets( tickets: Ticket[] ): Ticket[] {
    return tickets.filter( ticket => ticket.isActive() );
  }

  /**
   * Sorts tickets by priority (critical first)
   * @param {Ticket[]} tickets - Array of tickets
   * @returns {Ticket[]} Sorted tickets
   */
  public static sortByPriority( tickets: Ticket[] ): Ticket[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return [ ...tickets ].sort( ( a, b ) => priorityOrder[ b.priority ] - priorityOrder[ a.priority ] );
  }

  /**
   * Sorts tickets by creation date (newest first)
   * @param {Ticket[]} tickets - Array of tickets
   * @returns {Ticket[]} Sorted tickets
   */
  public static sortByCreatedDate( tickets: Ticket[] ): Ticket[] {
    return [ ...tickets ].sort( ( a, b ) => b.createdAt.getTime() - a.createdAt.getTime() );
  }

  /**
   * Sorts tickets by due date (earliest first)
   * @param {Ticket[]} tickets - Array of tickets
   * @returns {Ticket[]} Sorted tickets
   */
  public static sortByDueDate( tickets: Ticket[] ): Ticket[] {
    return [ ...tickets ].sort( ( a, b ) => {
      if ( !a.dueDate && !b.dueDate ) return 0;
      if ( !a.dueDate ) return 1;
      if ( !b.dueDate ) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    } );
  }
}
