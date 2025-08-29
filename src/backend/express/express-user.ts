import { Ticket } from "../../models/Ticket";
import { UserProfile } from "../../models/User";
import { express } from "./express-fetch";

// local session storage
let currentSession: { user: UserProfile; access_token: string } | null = null;

// Store auth change listeners
let authChangeListeners: ( ( event: string, session: any ) => void )[] = [];

const signIn = async ( email: string, password: string ) => {

    // Make email lookup case-insensitive
    email = email.toLowerCase().trim();

    const { data, error } = await express.signIn( email, password );

    if ( error ) return { error: new Error( error ) }

    if ( !data.isActive ) return { error: new Error( 'Account is deactivated' ) };

    const session = {
        user: data,
        access_token: `token_${Date.now()}`
    };

    currentSession = session;

    localStorage.setItem( 'ticket_app_session', JSON.stringify( session ) );

    // Trigger auth state change listeners
    authChangeListeners.forEach( callback => {

        try {

            callback( 'SIGNED_IN', session );

        } catch ( error ) {

            console.error( 'Error in auth change listener:', error );

        }

    } );

    return {
        data: {
            user: data,
            session
        },
        error: null
    };

};

const signUp = async ( email: string, password: string, fullName?: string ) => {

    const user = new UserProfile( {
        id: String( Date.now() ),
        email,
        fullName,
        role: "field_engineer",
        department: "field",
        phone: "263780000001",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    } )

    const { data, error } = await express.signUp( user, password );

    return { data, error: new Error( error ) }

};

const signOut = async () => {

    currentSession = null;

    localStorage.removeItem( 'ticket_app_session' );

    // Trigger auth state change listeners
    authChangeListeners.forEach( callback => {

        try {

            callback( 'SIGNED_OUT', null );

        } catch ( error ) {

            console.error( 'Error in auth change listener:', error );

        }

    } );

    return { error: null };

};

const getSession = async () => {

    if ( currentSession ) {

        return { data: { session: currentSession }, error: null };

    }

    const stored = localStorage.getItem( 'ticket_app_session' );

    if ( stored ) {

        currentSession = JSON.parse( stored );
        return { data: { session: currentSession }, error: null };

    }

    return { data: { session: null }, error: null };

};

const getUser = async () => {

    const session = await getSession();

    return {
        data: { user: session.data.session?.user || null },
        error: null
    };

};

const onAuthStateChange = ( callback: ( event: string, session: any ) => void ) => {

    // Add listener to the array
    authChangeListeners.push( callback );

    return {
        data: {
            subscription: {
                unsubscribe: () => {
                    // Remove listener when unsubscribing
                    const index = authChangeListeners.indexOf( callback );
                    if ( index > -1 ) {
                        authChangeListeners.splice( index, 1 );
                    }
                }
            }
        }
    };
}

const getCurrentUserProfile = ( existingUser?: UserProfile ): UserProfile | null => {

    const user = existingUser || currentSession?.user;

    if ( !user ) return null;

    return user || null;

};

const updateProfile = async ( userId: string, updates: Partial<UserProfile> ): Promise<{ data: UserProfile | null, error: Error | null }> => {

    const { data, error } = await express.updateUserById( userId, updates );

    currentSession.user = data;

    return { data, error: error ? new Error( error ) : null }

}

const getUsers = async ( role?: string ) => {

    const { data, error } = await express.fetchUsers( role );

    if ( error ) throw new Error( error )

    return data;

};

const getUserProfile = async ( userId: string ): Promise<UserProfile> => {

    const { data, error } = await express.getUserById( userId );

    if ( error ) throw new Error( error );

    return data;

};

const updateUserProfile = async ( userId: string, updates: Partial<UserProfile> ) => {

    const { data, error } = await express.updateUserById( userId, updates );

    currentSession.user = data;

    if ( error ) throw new Error( error );

    return null;

};

const getUserStats = async ( userId: string ) => {

    // Get tickets for this user
    const { data: createdBy } = await express.getTicketsCreatedByUser( userId );

    const { data: assignedTo } = await express.getTicketsAssignedToUser( userId );

    const userTickets = [ ...createdBy, ...assignedTo ];

    const totalTickets = userTickets.length;

    const completedTickets = userTickets.filter( t => [ 'resolved', 'verified', 'closed' ].includes( t.status ) ).length;

    // Calculate average resolution time
    const resolvedTickets = userTickets.filter( t => t.status === 'resolved' || t.status === 'verified' || t.status === 'closed' );

    const avgResolutionTime = resolvedTickets.length > 0
        ? resolvedTickets.reduce( ( acc, ticket ) => {
            // Mock resolution time calculation (2-24 hours)
            const mockResolutionHours = Math.random() * 22 + 2;
            return acc + mockResolutionHours;
        }, 0 ) / resolvedTickets.length
        : 0;

    const lastActivity = new Date().toISOString();

    return {
        totalTickets,
        completedTickets,
        avgResolutionTime,
        lastActivity
    };
};

const getUserNotifications = async ( userId: string, limit = 50 ) => {

    return { data: [], error: new Error() }

};

const updateUserRole = async ( adminId: string, userId: string, role: 'admin' | 'supervisor' | 'field_engineer' ) => {

    const { error } = await express.promoteUser( adminId, userId, role );

    if ( error ) return { data: null, error: new Error( error ) };

    const { data } = await express.getUserById( userId );

    return { data, error };

};

const deactivateUser = async ( userId: string ) => {

    const { data, error } = await express.updateUserById( userId, { isActive: false } )

    return { data, error };

};

export const users = {

    signIn,
    signOut,
    signUp,
    getUser,
    onAuthStateChange,
    getCurrentUserProfile,
    updateProfile,
    getSession,
    deactivateUser,
    updateUserRole,
    updateUserProfile,
    getUserNotifications,
    getUserStats,
    getUserProfile,
    getUsers

}
