// 1. Prevent the bot from crashing on minor warnings
process.on('unhandledRejection', (reason, promise) => {
    console.log('--- Unhandled Rejection Caught ---');
    console.error(reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('--- Uncaught Exception Caught ---');
    console.error(err);
});

// 2. Setup packages
const { token, default_prefix, color } = require("./config.json");
const Discord = require("discord.js");
const { readdirSync } = require("fs");
require("@haileybot/sanitize-role-mentions")();

const client = new Discord.Client({
    disableMentions: "everyone",
    fetchAllMembers: true,
    partials: ['MESSAGE', 'REACTION']
});

// 3. Connect to Database 
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/bleed'; 

mongoose.connect(mongoURI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => console.log('connected to mongoose'))
  .catch(err => console.error('Mongoose connection error:', err));

// 4. Initialize Collections
const jointocreate = require("./jointocreate");
jointocreate(client);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.db = require("quick.db");

module.exports = client;

// 5. Load Commands Directly (Fixes the scandir './commands/' crash)
const categories = ["fun", "information", "lastfm", "moderation", "owner", "utility"];

categories.forEach(dir => {
    try {
        const commands = readdirSync(`./${dir}/`).filter(file => file.endsWith(".js"));

        for (let file of commands) {
            let pull = require(`./${dir}/${file}`);

            if (pull.name) {
                client.commands.set(pull.name, pull);
                console.log(`Loaded command: ${file} ✅`);
            }

            if (pull.aliases && Array.isArray(pull.aliases)) {
                pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
            }
        }
    } catch (err) {
        console.log(`Directory context skip for: ${dir}`);
    }
});

// 6. Load Events Handler natively
try {
    require("./handlers/event")(client);
} catch(e) {
    console.log("Event handler setup info:", e.message);
}

Discord.Constants.DefaultOptions.ws.properties.$browser = "Discord Android";

// 7. Login
const botToken = process.env.TOKEN || token;
client.login(botToken);
