import { UserProfile } from "../../models/User";
import { Ticket } from "../../models/Ticket";
import { express } from "./express-fetch";

let nextTicketId = 4;

const getTicketsWithRelations = async ( userId?: string, role?: string ): Promise<Ticket[]> => {

    const { data } = await express.getTickets();

    // Filter tickets based on role
    if ( role === 'field_engineer' && userId ) return data.filter( t => t.createdBy === userId || t.assignedTo === userId );

    return data;

};

const createTicket = async ( userId: string, ticketData: Partial<Ticket> ): Promise<{ data: Ticket | null, error: Error | null }> => {

    let user: UserProfile;

    let ticket: Ticket;

    try {

        const { data, error } = await express.getUserById( userId );

        if ( error ) return { data: null, error: new Error( "User attempting ticket creation does not exist in database:" + error ) }

        user = data;

    } catch ( error ) {

        console.log( error )

    }

    const newTicketData = {
        id: String( nextTicketId++ ),
        ticketNumber: `TKT-${String( nextTicketId - 1 ).padStart( 3, '0' )}`,
        title: ticketData.title,
        description: ticketData.description,
        type: ticketData.type || 'maintenance',
        priority: ticketData.priority || 'medium',
        status: 'open' as const,
        createdBy: userId,
        assignedTo: null,
        assignedBy: null,
        equipmentId: ticketData.equipmentId || null,
        location: ticketData.location,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAt: null,
        dueDate: ticketData.dueDate || null,
        estimatedHours: ticketData.estimatedHours || null,
        actualHours: 0,
        notes: null,
        equipment: {
            id: ticketData.equipmentId,
            name: 'Equipment',
            type: 'general',
            model: 'Generic Model',
            serialNumber: 'EQ-001',
            location: ticketData.location,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
    }

    const newTicket = new Ticket( newTicketData )

    const { error } = await express.createTicket( newTicketData );

    if ( error ) return { data: null, error: new Error( error ) }

    return { data: newTicket, error: null };

};

const getTicketActivities = async ( ticketId: string ) => {

    const { data, error } = await express.fetchUsers();

    // Mock activities for tickets
    const activities = [
        {
            id: `act-${ticketId}-1`,
            ticket_id: ticketId,
            user_id: '1',
            type: 'created' as const,
            description: 'Ticket created',
            created_at: new Date( Date.now() - 24 * 60 * 60 * 1000 ), // 1 day ago
            user_profile: data[ 0 ]
        },
        {
            id: `act-${ticketId}-2`,
            ticket_id: ticketId,
            user_id: '2',
            type: 'assigned' as const,
            description: 'Ticket assigned to Field Engineer',
            created_at: new Date( Date.now() - 23 * 60 * 60 * 1000 ), // 23 hours ago
            user_profile: data[ 1 ]
        },
        {
            id: `act-${ticketId}-3`,
            ticket_id: ticketId,
            user_id: '3',
            type: 'comment' as const,
            description: 'Started investigating the issue',
            created_at: new Date( Date.now() - 2 * 60 * 60 * 1000 ), // 2 hours ago
            user_profile: data[ 2 ]
        }
    ];

    return activities;
};

const deleteTicket = async ( ticketId: string ) => {

    const { error } = await express.deleteTicket( ticketId );

    return { success: true, error };

};

const updateTicket = async ( ticketId: string, updates: Partial<Ticket> ): Promise<{ data: Ticket | null, error: Error | null }> => {

    const { data, error } = await express.updateTicket( ticketId, updates );

    if ( error ) return { data: null, error: new Error( error ) }

    return { data, error: null };

};

const assignTicket = async ( ticketId: string, assignedTo: string | null ) => {

    return updateTicket( ticketId, {
        assignedTo,
        status: assignedTo ? 'assigned' : 'open',
        assignedAt: assignedTo ? new Date() : null
    } );

};


export const tickets = {

    getTicketActivities,
    getTicketsWithRelations,
    updateTicket,
    deleteTicket,
    createTicket,
    assignTicket,

}