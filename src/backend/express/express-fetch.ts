import { Ticket } from "../../models/Ticket";
import { UserProfile, UserRole } from "../../models/User";

const signUp = async ( user: UserProfile, password: string ): Promise<{ data: UserProfile, error: string }> => {

    const res = await fetch( "http://localhost:5000/api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify( { user, password } ),
    } );

    const result = await res.json();

    let profile: UserProfile;

    if ( result.data ) profile = generateUsers( [ result.data ] )[ 0 ];

    return { error: result.error, data: profile }

};

const signIn = async ( email: string, password: string ): Promise<{ data: UserProfile, error: string }> => {

    const res = await fetch( "http://localhost:5000/api/signin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify( { email, password } ),
    } );

    const result = await res.json();

    let user: UserProfile;

    if ( result.data ) user = generateUsers( [ result.data ] )[ 0 ];

    return { data: result.data, error: result.error }

}

const fetchUsers = async ( role?: string ): Promise<{ data: UserProfile[], error: string }> => {

    const res = await fetch( `http://localhost:5000/api/users?role=${role}` );

    const result = await res.json();

    let users: UserProfile[];

    if ( result.data ) users = generateUsers( result.data );

    return { error: result.error, data: users }

};

const getUserById = async ( id: string ) => {

    const res = await fetch( `http://localhost:5000/api/users/${id}` );

    const result = await res.json();

    let user: UserProfile;

    if ( result.data ) user = generateUsers( [ result.data ] )[ 0 ];

    return { data: user, error: result.error }

}

const getUsersByIds = async ( ids: string[] ): Promise<{ data: UserProfile[], error: string }> => {

    const res = await fetch( `http://localhost:5000/api/users/batch`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify( { ids } ),
    } );

    const result = await res.json();

    return { data: result.data, error: result.error }

}

const updateUserById = async ( id: string, updates: Partial<UserProfile> ): Promise<{ data: UserProfile, error: string }> => {

    const res = await fetch( `http://localhost:5000/api/users/${id}/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify( { updates } ),
    } );

    const result = await res.json();

    let user: UserProfile;

    if ( result.data ) user = generateUsers( [ result.data ] )[ 0 ];

    return { data: user, error: result.error }

};

const promoteUser = async ( adminId: string, userId: string, role: UserRole ): Promise<{ error: string }> => {

    const res = await fetch( "http://localhost:5000/api/users/promote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify( {
            requesterId: adminId,
            targetId: userId,
            newRole: role,
        } ),
    } );

    const result = await res.json();

    return { error: result.error }

};

const createTicket = async ( ticket: Partial<Ticket> ): Promise<{ error: string | undefined }> => {

    const res = await fetch( "http://localhost:5000/api/tickets/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify( { ticket } ),
    } );

    const result = await res.json();

    return { error: result.error };

};

const getTickets = async (): Promise<{ data: Ticket[] }> => {

    const res = await fetch( "http://localhost:5000/api/tickets" );

    const result = await res.json();

    const tickets = await generateTickets( result.data );

    return { data: tickets };

};

const generateTickets = async ( tickets: Partial<Ticket>[] ): Promise<Ticket[]> => {

    const generatedTickets: Ticket[] = [];

    // Extract unique user IDs
    const userIds: Set<string> = new Set();

    tickets.forEach( t => {

        userIds.add( t.createdBy );
        userIds.add( t.assignedBy );
        userIds.add( t.assignedTo );

    } )

    // Fetch users by these ids
    const { data: users } = await getUsersByIds( [ ...userIds ].filter( id => id ) );

    // Create a map for fast lookup
    const userMap = {};
    users.forEach( u => userMap[ u.id ] = u );

    // Attacj profiles to tickets
    for ( const ticketData of tickets ) {

        const ticket = new Ticket( {

            id: ticketData.id,
            ticketNumber: ticketData.ticketNumber,
            title: ticketData.title,
            description: ticketData.description,
            type: ticketData.type,
            priority: ticketData.priority,
            status: ticketData.status,
            createdBy: ticketData.createdBy,
            assignedTo: ticketData.assignedTo,
            assignedBy: ticketData.assignedBy,
            equipmentId: ticketData.equipmentId,
            location: ticketData.location,
            createdAt: ticketData.createdAt,
            updatedAt: ticketData.updatedAt,
            assignedAt: ticketData.assignedAt,
            dueDate: ticketData.dueDate,
            estimatedHours: ticketData.estimatedHours,
            actualHours: ticketData.actualHours,
            notes: ticketData.notes,
            equipment: ticketData.equipment,
            createdByProfile: userMap[ ticketData.createdBy ] || null,
            assignedByProfile: userMap[ ticketData.assignedBy ] || null,
            assignedToProfile: userMap[ ticketData.assignedTo ] || null
        } )

        generatedTickets.push( ticket );

    }

    return generatedTickets

}

const generateUsers = ( users: UserProfile[] ): UserProfile[] => {

    const generatedUsers: UserProfile[] = users.map( user => new UserProfile( { ...user } ) )

    return generatedUsers;

}

const getTicketsCreatedByUser = async ( id: string ) => {

    const res = await fetch( `http://localhost:5000/api/tickets/user/created-by/${id}` );

    const result = await res.json();

    return { data: result.data, error: result.error };

};

const updateTicket = async ( id: string, updates: Partial<Ticket> ): Promise<{ data: Ticket | undefined, error: string | undefined }> => {

    const res = await fetch(
        `http://localhost:5000/api/tickets/${id}/update`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify( { updates } ),
        }
    );

    const result = await res.json();

    let tickets: Ticket[];

    if ( result.data ) tickets = await generateTickets( [ result.data ] );

    return { data: tickets[0], error: result.error }

};

const deleteTicket = async ( id: string ): Promise<{ error: string }> => {

    const res = await fetch( `http://localhost:5000/api/tickets/${id}`, {
        method: 'DELETE'
    } );

    const result = await res.json();

    return { error: result.error }

}

const getTicketsAssignedByUser = async ( id: string ) => {

    const res = await fetch( `http://localhost:5000/api/tickets/user/assigned-by/${id}` );

    const result = await res.json();

    return { data: result.data, error: result.error };

}

const getTicketsAssignedToUser = async ( id: string ) => {

    const res = await fetch( `http://localhost:5000/api/tickets/user/assigned-to/${id}` );

    const result = await res.json();

    return { data: result.data, error: result.error };

}

const userExistsById = async ( id: string ) => {

    const res = await fetch( `http://localhost:5000/api/users/${id}/exists` );

    const result = await res.json();

    return { data: result.data };

}

const ticketExists = async ( id: string ) => {

    const res = await fetch( `http://localhost:5000/api/tickets/${id}/exists` );

    const result = await res.json();

    return { data: result.data };

}

export const express = {

    signUp,
    signIn,
    promoteUser,

    fetchUsers,

    createTicket,
    deleteTicket,
    updateTicket,

    getTickets,
    getTicketsCreatedByUser,
    getTicketsAssignedToUser,
    getTicketsAssignedByUser,

    updateUserById,
    getUserById,

    userExistsById,
    ticketExists,
    getUsersByIds,

}
