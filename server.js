const http = require('http'); // Import the built-in http module
const port = 3000; // Define the port number the server will listen on

// Create the server instance
const server = http.createServer((req, res) => {
  // Set the response header with HTTP status and content type
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');

  // Send the response body
  res.end('Hello, World! This is a simple Node.js server.');
});

// Start the server and make it listen for incoming requests
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});