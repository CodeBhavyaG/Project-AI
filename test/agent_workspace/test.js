console.log("Hello! This JavaScript file was executed safely inside the Docker container!");
const fs = require("fs");
fs.writeFileSync("/workspace/output.txt", "The agent successfully wrote this file back to the host!");
