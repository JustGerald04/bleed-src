const { readdirSync } = require("fs");
const path = require("path");

module.exports = (client) => {
    try {
        // Build an absolute path to your root "events" folder
        const eventsPath = path.join(__dirname, "..", "events");
        
        // Read the directory contents cleanly, filtering only JavaScript files
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith(".js"));

        for (let file of eventFiles) {
            // Securely load the file using its full system path
            let pull = require(path.join(eventsPath, file));

            if (pull.name) {
                client.events.set(pull.name, pull);
                console.log(`Loaded event module: ${file} ⚡`);
            }
        }
    } catch (error) {
        console.error("Critical error inside event handler initialization:", error.message);
    }
};
