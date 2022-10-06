module.exports.run = async (client) => {
    const config = require('../config.js'); // importing the configurations of the bot

    const server = client.guilds.cache.get(config.serverid);  // caching the server here to load all data
    const logChannel = client.channels.cache.get(config.logChannel);
    const darkwebChannel = client.channels.cache.get(config.darkwebChannel);
    const darkwebRole = server.roles.cache.get(config.darkwebRole);

    if (!server) console.log('SERVER NOT FOUND');
    if (!logChannel) console.log('LOGS CHANNEL NOT FOUND');
    if (!darkwebChannel) console.log('DARKWEB CHANNEL NOT FOUND');
    if (!darkwebRole) console.log('DARKWEB ROLE NOT FOUND');

    if (server) console.log(server.name);
    if (logChannel) console.log(logChannel.name);
    if (darkwebChannel) console.log(darkwebChannel.name);
    if (darkwebRole) console.log(darkwebRole.name);
};