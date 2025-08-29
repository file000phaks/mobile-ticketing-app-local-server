const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { addUser, authenticateUser, promoteUser, readUsers, saveUsers, writeUsers, getUserById, getUsersByIds } = require('./user.cjs');
const {
    readTickets,
    addTicket,
    removeTicket,
    saveTickets,
    getTicketById,
    getResolvedTickets,
    getTicketsAssignedBy,
    getTicketsAssignedTo,
    getTicketsCreatedBy,
    getUnresolvedTickets,
    updateTicket
} = require('./ticket.cjs');
const { updateUserById } = require('./user.cjs');
const { Rss } = require('lucide-react');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {

    res.send('Server is running');

})

app.get('/api/tickets', (req, res) => {

    const tickets = readTickets();

    res.json({ data: tickets });

})

app.post('/api/tickets/create', (req, res) => {

    const { ticket } = req.body;

    const result = addTicket(ticket);

    if (result.error) return res.json({ error: result.error });

    res.json({ success: result.success })

})

app.delete('/api/tickets/:id', (req, res) => {

    const id = req.params.id;

    const result = removeTicket(id);

    if (result.error) return res.json({ error: result.error });

    res.json({ success: result.success })

})

app.post('/api/tickets/save', (req, res) => {

    const tickets = req.body.tickets;

    saveTickets(tickets)

    res.status(201).json(tickets);

})

// Get ticket by id
app.get("/api/tickets/:id", (req, res) => {

    const id = req.params.id;

    const result = getTicketById(id);

    if (result.error) return res.json({ error: result.error });

    res.json({ data: result.data });

})

// Get tickets created by user id
app.get("/api/tickets/user/created-by/:id", (req, res) => {

    const id = req.params.id;

    const result = getTicketsCreatedBy(id);

    if (result.error) return res.json({ error: result.error });

    res.json({ data: result.data });

})

// Get tickets assigned to user id
app.get("/api/tickets/user/assigned-to/:id", (req, res) => {

    const id = req.params.id;

    const result = getTicketsAssignedTo(id);

    if (result.error) return res.json({ error: result.error });

    res.json({ data: result.data });

})

// Get tickets assigned by user id
app.get("/api/tickets/user/assigned-by/:id", (req, res) => {

    const id = req.params.id;

    const result = getTicketsAssignedBy(id);

    if (result.error) return res.json({ error: result.error });

    res.json({ data: result.data });

})

app.post("/api/tickets/:id/update", (req, res) => {

    const id = req.params.id;

    const { updates } = req.body;

    const result = updateTicket(id, updates);

    if (result.error) return res.json({ error: result.error });

    res.json({ data: result.data, message: result.message });

})

app.get("/api/tickets/:id/exists", (req, res) => {

    const id = req.params.id;

    const result = getTicketById(id);

    if (result.error) return res.json({ data: false });

    res.json({ data: true })

})

// User Auth

app.post('/api/signup', (req, res) => {

    const { user, password } = req.body;

    const { email, fullName } = user;

    if (!email || !password || !fullName) return res.status(400).json({ error: "Missing fields" });

    const result = addUser({ ...user, password });

    if (result.error) return res.status(400).json({ error: result.error })

    res.json({ data: result.data })

});

app.post('/api/signin', (req, res) => {

    const { email, password } = req.body;

    const result = authenticateUser(email, password);

    if (result.error) return res.status(401).json({ error: result.error });

    res.json({ data: result.data })

})


// User updates

app.post('/api/users/promote', (req, res) => {

    const { requesterId, targetId, newRole } = req.body;

    if (!requesterId || !targetId || !newRole) return res.status(401).json({ error: "Missing fields" });

    const result = promoteUser(requesterId, targetId, newRole);

    if (result.error) return res.status(403).json({ error: result.error });

    res.json({ user: result.target });

})

app.post('/api/users/:id/update', (req, res) => {

    const userId = req.params.id;

    const { updates } = req.body;

    if (!userId || !updates) return res.status(401).json({ error: "Missing data" });

    const result = updateUserById(userId, updates);

    if (result.error) return res.json({ error: result.error });

    res.json({ data: result.data })

})

// User retrieval

app.get('/api/users', (req, res) => {

    const role = req.query.role;

    const users = readUsers();

    if (users.length === 0) return res.json({ error: "Could not find users in database" });

    const filtered = role ? users.filter(user => user.role === role) : users

    res.json({ data: filtered });

})

app.post('/api/users/batch', (req, res) => {

    const { ids } = req.body; // expects: { ids: [1, 2, 3] }

    if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid request format. Expected an array' });

    const result = getUsersByIds(ids);

    res.json({ data: result });

})

app.get('/api/users/:id', (req, res) => {

    const userId = req.params.id;

    const { data, error } = getUserById(userId);

    if (error) return res.json({ error });

    res.json({ data });

})

app.post('/api/users/save', (req, res) => {

    const users = req.body.users;

    writeUsers(users);

    res.status(201).json(users);

})

app.get('/api/users/:id/exists', (req, res) => {

    const id = req.params.id;

    const result = getUserById(id);

    if (result.error) return res.json({ data: false });

    if (result.data) return res.json({ data: true });

    res.json({ error: "Unknown error: Occured at getUserById() in server" })

})

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

