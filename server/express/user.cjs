const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');

/**
 * Reads users from users.json file and returns an array of user data
 * @returns {Array}
 */
const readUsers = () => {

    if (!fs.existsSync(usersFile)) return [];

    const data = fs.readFileSync(usersFile);

    return JSON.parse(data);

}

/**
 * Writes users to users.json
 * @param {Array} users 
 */
const writeUsers = (users) => {

    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

}

/**
 * Adds a user to users.json
 * @param {object} newUser 
 * @returns 
 */
const addUser = (newUser) => {

    const users = readUsers();

    const exists = users.find(u => u.email === newUser.email);

    if (exists) return { error: 'User already exists' }

    users.push(newUser);

    writeUsers(users);

    delete newUser.password;

    return { data: newUser, success: true }

}

/**
 * Authenticates user based on their email and password
 * @param {string} email 
 * @param {string} password 
 * @returns 
 */
const authenticateUser = (email, password) => {

    const user = readUsers().find(u => u.email === email && u.password === password);

    if (!user) return { error: 'Invalid credentials' };

    delete user.password;

    return { data: user };

}

/**
 * Enables users in Admin role to promote other users to either Supervisor or Admin
 * @param {string} requesterId 
 * @param {string} targetId 
 * @param {string} newRole 
 * @returns 
 */
const promoteUser = (requesterId, targetId, newRole) => {

    const users = readUsers();

    const requester = users.find(u => u.id === requesterId);

    const target = users.find(u => u.id === targetId);

    if (!requester || requester.role !== "admin") return { error: "Not authorized" }

    if (!target) return { error: "Target user not found" };

    target.role = newRole;

    writeUsers(users);

    delete target.password;

    return { success: true, data: target };

}

/**
 * Gets a user by id
 * @param {string} id 
 */
const getUserById = (id) => {

    const user = readUsers().find(user => user.id === id);

    let error;

    if (!user) error = "User not found";

    delete user.password;

    return { data: user, error }

}

/**
 * Gets a user by email
 * @param {string} email 
 * @returns {{}}
 */
const getUserByEmail = (email) => {

    const user = readUsers().find(user => user.email === email);

    let error;

    if (!user) error = "User not found";

    delete user.password;

    return { data: user, error }

}

/**
 * Gets multiple users by ids
 * @param {Array<number>} ids 
 */
const getUsersByIds = (ids) => {

    const users = readUsers();

    const idSet = new Set(ids); // 0(1) lookup

    const filteredUsers = users.filter(user => idSet.has(user.id));

    filteredUsers.forEach(user => delete user.password);

    return filteredUsers;

}

/**
 * Updates a user by id
 * @param {string} id 
 * @param {{}} updates 
 * @returns {{}}
 */
const updateUserById = (id, updates) => {

    const users = readUsers();

    const user = users.find(user => user.id === id);

    if (!user) return { error: "User not found" }

    Object.assign(user, updates);

    writeUsers(users);

    delete user.password;

    return { data: user};

}

/**
 * Updates a user by email
 * @param {string} email 
 * @param {{}} updates 
 * @returns {{}}
 */
const updateUserByEmail = (email, updates) => {

    const users = readUsers();

    const user = users.find(user => user.email === email);

    if (!user) return { error: "User not found" }

    Object.assign(user, updates);

    writeUsers(users);

    delete user.password;

    return { data: users };

}

module.exports = {
    addUser,
    authenticateUser,
    promoteUser,
    readUsers,
    writeUsers,
    getUserById,
    getUserByEmail,
    updateUserByEmail,
    updateUserById,
    getUsersByIds
};