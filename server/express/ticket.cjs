const fs = require('fs');
const path = require('path');

const ticketsFile = path.join(__dirname, "tickets.json");

/**
 * Reads tickets from tickets.json file and returns an array of user data
 * @returns {Array}
 */
const readTickets = () => {

    if (!fs.existsSync(ticketsFile)) return [];

    const data = fs.readFileSync(ticketsFile);

    return JSON.parse(data);

}

/**
 * Writes tickets to tickets.json
 * @param {Array} tickets 
 */
const writeTickets = (tickets) => {

    fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));

}

/**
 * Adds a ticket to tickets.json
 * @param {object} newTicket 
 * @returns 
 */
const addTicket = (newTicket) => {

    const tickets = readTickets();

    const exists = tickets.find(ticket => ticket.id === newTicket.id);

    if (exists) return { error: "Duplication Error. A ticket of this id already exists" }

    tickets.push(newTicket);

    writeTickets(tickets);

    return { success: true };

}

/**
 * Removes a ticket by ID
 * @param {string} ticketId 
 */
const removeTicket = (ticketId) => {

    let tickets = readTickets();

    const ticket = tickets.find(t => t.id === ticketId);

    tickets = tickets.filter(ticket => ticket.id !== ticketId);

    if (!ticket) return { error: "Ticket does not exist in database" };

    writeTickets(tickets);

    return { success: true };

}

const getTicketById = (ticketId) => {

    const tickets = readTickets();

    const ticket = tickets.find(ticket => ticket.id === ticketId);

    if (!ticket) return { error: "Ticket does not exist in database" };

    return { data: ticket };

}

const getTicketsCreatedBy = (userId) => {

    const tickets = readTickets();

    const ticketsCreatedByUser = tickets.filter(ticket => ticket.createdBy === userId);

    return { data: ticketsCreatedByUser };

}

const getTicketsAssignedTo = (userId) => {

    const tickets = readTickets();

    const ticketsAssignedToUser = tickets.filter(ticket => ticket.assignedTo === userId);

    return { data: ticketsAssignedToUser };

}

const getTicketsAssignedBy = (userId) => {

    const tickets = readTickets();

    const ticketsAssignedByUser = tickets.filter(ticket => ticket.assignedBy === userId);

    return { data: ticketsAssignedByUser };

}

const updateTicket = (id, updates) => {

    const tickets = readTickets();

    const ticket = tickets.find(ticket => ticket.id === id);

    if (!ticket) return { error: "Ticket does not exist in database" };

    Object.assign(ticket, updates);

    return { data: ticket, message: "Ticket update successful" };

}

const getUnresolvedTickets = () => {

    const tickets = readTickets();

    const unresolvedTickets = tickets.filter(tk => tk.status !== "resolved");

    return { data: unresolvedTickets };

}

const getResolvedTickets = () => {

    const tickets = readTickets();

    const unresolvedTickets = tickets.filter(tk => tk.status === "resolved");

    return { data: unresolvedTickets };

}

/**
 * Writes all tickets to json
 * @param {Array} tickets 
 */
const saveTickets = (tickets) => {

    writeTickets(tickets);

}

module.exports = {

    readTickets,
    addTicket,
    removeTicket,
    saveTickets,

    getTicketById,
    getTicketsAssignedBy,
    getTicketsAssignedTo,
    getTicketsCreatedBy,
    getUnresolvedTickets,
    getResolvedTickets,

    updateTicket,

}
