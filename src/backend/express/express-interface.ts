import { UserProfile } from "../../models/User";
import { Ticket } from "../../models/Ticket";
import { express } from "./express-fetch";
import { tickets } from "./express-ticket";
import { users } from "./express-user";

const getTimeEntries = async ( ticketId: string ) => { };

const createTimeEntry = async ( timeEntry: any ) => { };

const updateTimeEntry = async ( entryId: string, updates: any ) => { };

const deleteTimeEntry = async ( entryId: string ) => { };

const getUserTimeEntries = async ( userId: string, limit = 50 ) => { }


const subscribeToNotifications = async ( callback: ( payload: any ) => void, userId?: string ) => { return { unsubscribe: () => { } } }
const deleteFile = async () => { }

/**
 * Returns a query with a subscribe method
 */
const subscribeToTickets = ( callback: ( payload: any ) => void, userId?: string ) => { return { unsubscribe: () => { } } }
const uploadFile = async () => { }
const getFileUrl = async () => { }
const getCurrentUserProfile = async () => { }
const checkUserRole = async () => { }

const addTicketComment = async ( userId: string, ticketId: string, comment: string ) => {

    let error: Error;

    return { error }

}

const addTicketNote = async ( userId: string, ticketId: string, note: string ) => {

    let error: Error;

    return { error }

}

const getTicketMedia = async ( ticketId: string ) => {

    return []

};

const getDashboardStats = async ( userId: string ) => {

    await new Promise( resolve => setTimeout( resolve, 200 ) );

    return {};

};

// Optimize by decalring in server instead of sending all the tickets
const getEquipment = async () => {

    const { data } = await express.getTickets();

    return data.map( ( ticket: Ticket ) => ticket.equipment ).filter( e => e );

};

export const expressInterface = {

    ...tickets,
    ...users,

    subscribeToNotifications,

    subscribeToTickets,
    deleteFile,
    uploadFile,
    getFileUrl,
    getCurrentUserProfile,
    checkUserRole,

    addTicketComment,
    addTicketNote,
    getTicketMedia,

    getDashboardStats,

    getTimeEntries,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getUserTimeEntries,

    getEquipment,

    auth: users,

}