// 1. Global anti-crash handlers to stop old package warnings from killing the bot process
process.on('unhandledRejection', (reason, promise) => {
    console.log('--- Unhandled Rejection Caught ---');
    console.error(reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('--- Uncaught Exception Caught ---');
    console.error(err);
});

// 2. Original bot setup
const { token, default_prefix, color } = require("./config.json");
const Discord = require("discord.js");
require("@haileybot/sanitize-role-mentions")();

const client = new Discord.Client({
    disableMentions: "everyone",
    fetchAllMembers: true,
    partials: ['MESSAGE', 'REACTION']
});

// 3. Database connection using the environment variable from Railway
const mongoose = require('mongoose');
// Uses process.env.MONGO_URL if available, otherwise falls back to config or a default
const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/bleed'; 

mongoose.connect(mongoURI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => console.log('connected to mongoose'))
  .catch(err => console.error('Mongoose connection error:', err));

// 4. Initializing handlers and collections
const jointocreate = require("./jointocreate");
jointocreate(client);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.db = require("quick.db");

module.exports = client;

// Loops through your handler modules
["command", "event"].forEach(handler => {
    try {
        require(`./handlers/${handler}`)(client);
    } catch (err) {
        console.error(`Error loading handler ${handler}:`, err);
    }
});

Discord.Constants.DefaultOptions.ws.properties.$browser = "Discord Android";

// 5. Log in to Discord using your secret token
const botToken = process.env.TOKEN || token;
client.login(botToken);
