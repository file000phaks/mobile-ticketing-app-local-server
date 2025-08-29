const fs = require('fs');
const path = require('path');

const notificationsFile = path.join(__dirname, 'notifications.json');

/**
 * Reads notifications from notifications.json file and returns an array of user data
 * @returns {Array}
 */
const readNotifications = () => {

    if (!fs.existsSync(notificationsFile)) return [];

    const data = fs.readFileSync(notificationsFile);

    return JSON.parse(data);

}

/**
 * Writes notifications to notifications.json
 * @param {Array} notifications 
 */
const writeNotifications = (notifications) => {

    fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));

}

module.exports = {

    readNotifications,
    writeNotifications

}