let ticketCount = 3;

const generateTicketId = () => {

    ticketCount++;

    return ticketCount;

}

export {
    generateTicketId
}