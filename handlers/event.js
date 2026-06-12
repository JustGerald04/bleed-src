const { readdirSync } = require("fs");
const path = require("path");

module.exports = (client) => {
    try {
        const eventsPath = path.join(__dirname, "..", "events");
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith(".js"));

        for (let file of eventFiles) {
            let pull = require(path.join(eventsPath, file));

            if (pull.name) {
                client.events.set(pull.name, pull);
                console.log(`Loaded event module: ${file} ⚡`);
            }
        }
    } catch (error) {
        console.error("Error inside event handler initialization:", error.message);
    }
};
