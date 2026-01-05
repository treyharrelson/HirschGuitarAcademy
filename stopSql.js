/*
In order to use this file/script you must run the terminal as an administrator
and enter this into the terminal:
node stopSql.js
*/

const { exec } = require('child_process');
const sqlServiceName = '"MySQL80"'; // Use double quotes for service names with spaces
const command = `net stop ${sqlServiceName}`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error stopping SQL service: ${error.message}`);
        return;
    }
    console.log(`SQL service ${sqlServiceName} stopped: ${stdout}`);
});
