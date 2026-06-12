const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('connected to mongoose'))
    .catch((err) => console.log('mongoose connection error:', err));

// Only keep the handlers you actually use (like events)
// REMOVE ANY LINES THAT LOOK LIKE: ["command"].forEach(handler => ... )

const handlersFolder = fs.readdirSync('./handlers');
for (const file of handlersFolder) {
    if (file.endsWith('.js') && file !== 'command.js') {
        require(`./handlers/${file}`)(client);
    }
}

client.login(process.env.TOKEN);
