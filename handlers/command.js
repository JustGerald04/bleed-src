const { readdirSync } = require("fs");

const ascii = require("ascii-table");

let table = new ascii("Commands");
table.setHeading("Command", "Load status");

module.exports = (client) => {
    // We changed "./commands/" to "./" to read the root folders instead
    // We filter out system folders that aren't command categories
    const categories = ["fun", "information", "lastfm", "moderation", "owner", "utility"];

    categories.forEach(dir => {
        const commands = readdirSync(`./${dir}/`).filter(file => file.endsWith(".js"));

        for (let file of commands) {
            let pull = require(`../${dir}/${file}`);

            if (pull.name) {
                client.commands.set(pull.name, pull);
                table.addRow(file, '✅');
            } else {
                table.addRow(file, `❌ -> missing a help.name, or help.name is not a string.`);
                continue;
            }

            if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
        }
    });

    console.log(table.toString());
}
