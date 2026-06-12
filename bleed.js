// Build Version: 2026-06-12-SafeCategoryLoading
const path = require("path");

// 1. Fail-safe protection against the phantom handlers/command.js file
// If another file tries to require it, this mock object prevents it from crashing on readdirSync
try {
    const commandHandlerPath = path.join(__dirname, "handlers", "command.js");
    require.cache[commandHandlerPath] = {
        id: commandHandlerPath,
        filename: commandHandlerPath,
        loaded: true,
        exports: () => console.log("⚠️ Intercepted and bypassed old command handler call safely.")
    };
} catch (e) {
    // Fail silently if cache injection fails
}

// 2. Prevent the bot from crashing on minor warnings
process.on('unhandledRejection', (reason, promise) => {
    console.log('--- Unhandled Rejection Caught ---');
    console.error(reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('--- Uncaught Exception Caught ---');
    console.error(err);
});

// 3. Setup packages
const { token, default_prefix, color } = require("./config.json");
const Discord = require("discord.js");
const { readdirSync } = require("fs");
require("@haileybot/sanitize-role-mentions")();

const client = new Discord.Client({
    disableMentions: "everyone",
    fetchAllMembers: true,
    partials: ['MESSAGE', 'REACTION']
});

// 4. Connect to Database 
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/bleed'; 

mongoose.connect(mongoURI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => console.log('connected to mongoose'))
  .catch(err => console.error('Mongoose connection error:', err));

// 5. Initialize Collections
const jointocreate = require("./jointocreate");
jointocreate(client);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.db = require("quick.db");

module.exports = client;

// 6. Load Category Folders Directly using robust Absolute Paths
const categories = ["fun", "information", "lastfm", "moderation", "owner", "utility"];

categories.forEach(dir => {
    try {
        const absoluteDirPath = path.join(__dirname, dir);
        const commands = readdirSync(absoluteDirPath).filter(file => file.endsWith(".js"));

        for (let file of commands) {
            let pull = require(path.join(absoluteDirPath, file));

            if (pull.name) {
                client.commands.set(pull.name, pull);
                console.log(`Loaded command: ${file} from folder [${dir}] ✅`);
            }

            if (pull.aliases && Array.isArray(pull.aliases)) {
                pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
            }
        }
    } catch (err) {
        console.log(`Directory context skip or empty folder for: ${dir}`);
    }
});

// 7. Load Events Handler natively
try {
    require("./handlers/event")(client);
} catch(e) {
    console.log("Event handler setup info:", e.message);
}

Discord.Constants.DefaultOptions.ws.properties.$browser = "Discord Android";

// 8. Login
const botToken = process.env.TOKEN || token;
client.login(botToken);
