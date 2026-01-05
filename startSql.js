/*
In order to use this file/script you must run the terminal as an administrator
and enter this into the terminal:
node startSql.js
*/
const { exec } = require('child_process');

// Replace "SQL Server (MSSQLSERVER)" with your exact SQL service name if different.
const sqlServiceName = '"MySQL80"';

const command = `net start ${sqlServiceName}`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error starting SQL service: ${error.message}`);
        // Often, the error is due to lack of administrative privileges or the service already running.
        return;
    }
    if (stderr) {
        console.error(`Service control error: ${stderr}`);
        return;
    }
    console.log(`Service start command successful: ${stdout}`);
    console.log(`SQL service ${sqlServiceName} started (or was already running).`);
});
