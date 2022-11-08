const block = require('./commands/admins/block.js');
const config = require('./config.js'),
    db = require('quick.db');

require('./live.js');
require('colors')

const { Intents, Collection, Client, MessageEmbed, MessageButton, MessageActionRow, WebhookClient } = require("discord.js"),
    intents = new Intents([
        "GUILD_MEMBERS",
        "GUILD_MESSAGES",
        "DIRECT_MESSAGES",
        "GUILDS",
        "GUILD_MESSAGE_REACTIONS",
        "DIRECT_MESSAGE_REACTIONS"
    ]),
    client = new Client({
        intents: [
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
        ],
        allowedMentions: { parse: ['users'], repliedUser: true },
        presence: {
            status: "online",
            activities: [{
                name: config.status,
                type: config.statusType
            }]
        },
        ws: { intents },
        fetchAllMembers: true,
        restTimeOffset: 0,
        shards: "auto",
        restWsBridgetimeout: 100,
        disableEveryone: true,
        partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER', 'USER']
    });

// loading local cache for the commands and its aliases
client.commands = new Collection();
client.aliases = new Collection();
client.config = config;
client.errweb = new WebhookClient({
    id: process.env.errid || config.errid,
    token: process.env.errtoken || config.errtoken
});

["command", "events"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});
let godfather = new WebhookClient({
    id: process.env.webid || config.webid,
    token: process.env.webtoken || config.webtoken
});

let adminmenu = new MessageActionRow();

client.on("messageCreate", async (message) => { // main message data

    // if message author is a bot user acction will be null
    if (message.author.bot) return;

    // if message is recieved in the dm then trigger this event
    if (!message.guild && message.author.id !== client.user.id) {

        // loading all necassory data
        const server = client.guilds.cache.get(config.serverid);
        const logChannel = client.channels.cache.get(config.logChannel);
        const darkwebChannel = client.channels.cache.get(config.darkwebChannel);
        const darkwebRole = server.roles.cache.get(config.darkwebRole);
        const syndicate = server.roles.cache.get(config.syndicate);

        let embed = new MessageEmbed();

        await server.members.fetch(); // caching all members for the bot to fetch all members.

        const serverUser = server.members.cache.get(message.author.id);
        // to check if user is in the server 
        if (!serverUser) {
            return message.author.send("You are not in server server!");
        };
        // to check if user have access to dark web
        if (!serverUser.roles.cache.has(darkwebRole.id)) {
            return message.author.send("You don't have access to server DARK WEB");
        };

        // checking if the bot is in locked phase or not 
        let locked = db.get('locked');

        if (locked === true) {
            return message.reply('Darkweb is currently locked for everyone by GODFATHER!')
        };

        // function for the godfather message and normal user message to make a difference
        if (!serverUser.roles.cache.has(syndicate.id)) {
            var sign = db.get(`anon_code${message.author.id}`);
            let blocked = db.get(`block${sign}`);
            if (blocked === true) {
                return message.reply("You have been blocked by the GODFATHER from using darkweb")
            }
            if (!sign) {
                return message.reply("You don't have a tag registered go to the server and use create command to get yourself a tag.")
            }
            var content = `${message.content}`;
            embed.setAuthor({
                name: 'DarkWeb',
                iconURL: 'https://cdn.discordapp.com/attachments/993893179319386223/1006640228901077173/unknown_7.png'
            })
        } else {
            var content = message.content;
        }

        // here are the log channels fetch and embed builder
        let dwchannel = darkwebChannel,
            log = logChannel;
        embed.setColor(config.embedColour)
            .setTimestamp()
            .setFooter({ text: config.footer, iconURL: server.iconURL({ dynamic: true }) });

        if (!serverUser.roles.cache.has(syndicate.id)) {
            if (message.content) {
                embed.setDescription(`${content}`);
            };
        } else {
            if (message.content) {
                embed.setDescription(`${content}`);
            };
        }

        if (message.attachments.first()) {
            embed.setImage(message.attachments.first().proxyURL);
        };

        const button = new MessageButton()
            .setStyle("SUCCESS")
            .setLabel("Send Post")
            .setCustomId("send_post")
            .setDisabled(false),
            button1 = new MessageButton()
                .setStyle("DANGER")
                .setLabel("Cancel Post")
                .setCustomId("cancel_post")
                .setDisabled(false),
            row = new MessageActionRow()
                .addComponents(button, button1);

        let msg = await message.author.send({ embeds: [embed], components: [row] }),
            collector = msg.createMessageComponentCollector({ time: 30000 });

        collector.on("collect", async (button) => {
            if (button.customId === "send_post") {
                if (!serverUser.roles.cache.has(syndicate.id)) {
                    // dwchannel.send({ embeds: [embed] });
                    try {
                        try {
                            let wh = await dwchannel.fetchWebhooks(),
                                webhook = wh.find(wh => wh.token);
                            webhook.send({
                                username: `Anon ${sign}`,
                                avatarURL: config.dwpic,
                                embeds: [embed]
                            });
                        } catch (e) {
                            dwchannel.createWebhook(client.user.username, {
                                avatar: client.user.displayAvatarURL(),
                            }).then(webhook => {
                                webhook.send({
                                    username: `Anon ${sign}`,
                                    avatarURL: config.dwpic,
                                    embeds: [embed]
                                });
                            });
                        };
                    } catch (e) {
                        message.reply({
                            embeds: [
                                new MessageEmbed({
                                    color: config.embedColour,
                                    description: `\`\`\`js\n${e.stack}!\`\`\``
                                })
                            ]
                        })
                    }
                } else {
                    godfather.send({ embeds: [embed] });
                }
                embed.addFields({
                    name: 'Posted By',
                    value: `${message.author} - \`${message.author.tag}\``,
                    inline: true
                })
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

                // let warn = new MessageButton(),
                //     del = new MessageButton();

                // warn.setStyle("DANGER")
                //     .setLabel("WARN USER")
                //     .setCustomId(message.author.id)
                //     .setDisabled(false);
                // del.setStyle("DANGER")
                //     .setLabel("DELETE POST")
                //     .setCustomId(post.id)
                //     .setDisabled(false);
                // adminmenu.addComponents(warn, del);

                return log.send({ embeds: [embed]/*, components: [adminmenu]*/ }) &&
                    message.reply({ content: "Sent Your Post Successfully!" }) &&
                    //   db.set(`sender${post.id}`, message.author.id) &&
                    button.message.delete();
            } else if (button.customId === "cancel_post") {
                return message.author.send({ content: "Post Cancelled!" }) && button.message.delete();
            };
        });

        collector.on("end", (_, reason) => {
            if (reason !== "messageDelete") {
                return message.author.send({ content: "Post Cancelled **`[Timed Out]`**" }) && msg.delete();
            };
        });
    };
});

// client.on("interactionCreate", async interaction => {
//     if (!interaction.isButton()) return;
//     let button = interaction
//     if (button.message.author.id !== client.user.id) return;
//     if (isNaN(button.customId)) return;
//     let user = await button.guild.members.fetch(button.user.id);
//     if (!user.roles.cache.get(client.config.adminrole)) {
//         return button.reply({ content: "These Buttons Are For Admins Only!", ephemeral: true });
//     }
//     try {
//         let chann = button.guild.channels.cache.get(config.darkwebChannel);

//         let output = await button.guild.members.fetch(button.customId).catch(() => null);

//         const logChannel = client.channels.cache.get(config.wdlog);
//         try { // if output is ia user

//             const dtag = db.get(`anon_code${output.id}`);
//             let blocked = db.get(`block${dtag}`);
//             let warns = db.get(`warns${dtag}`); // getting the user warnings
//             if (!warns) { // setting warns 
//                 warns = "1";
//                 db.set(`warns${dtag}`, 1);
//             } else { // adding warns
//                 db.add(`warns${dtag}`, 1);
//             };
//             let bl = '!';
//             if (warns === 3) {
//                 db.set(`block${dtag}`, true);
//                 bl = `\n${dtag} have been blocked from useing darkweb any further!`;
//             };
//             if (warns > 3) {
//                 if (blocked !== true) {
//                     db.set(`block${dtag}`, true);
//                 };
//                 return button.reply({ content: `This user is on max warns and has been blocked already!`, ephemeral: true })
//             };

//             button.setDisabled(true); // disabeling buttons

//             return output.send({
//                 embeds: [
//                     new MessageEmbed({
//                         description: `You have been warned for the wrong usage of dark web by GODFATHER!\nYou've recieved ${warns}/3 warnings ${bl}`,
//                         color: config.embedColour
//                     })
//                 ]
//             }) && button.message.edit({ components: [adminmenu] }) &&
//                 button.reply({ content: `Warning sent to ${output} whose darkweb tag is ${dtag}\nThis user have recieved ${warns}/3 warnings ${bl}`, ephemeral: true }) &&
//                 logChannel.send({
//                     embeds: [
//                         new MessageEmbed({
//                             description: `${output} with tag ${dtag} was warned by ${button.user}\nThis user have recieved ${warns}/3 warnings ${bl}`,
//                             color: config.embedColour
//                         })
//                     ]
//                 });
//         } catch (e) { // if output is a message
//             output = await chann.messages.fetch(button.customId).catch(() => null);
//             if (!output) {
//                 return;
//             } else {
//                 try {
//                     let sender = db.get(`sender${output.id}`),
//                         dtag = db.get(`anon_code${sender}`);

//                     button.setDisabled(true);
//                     //    client.del.setDisabled(true);
//                     return output.delete() &&
//                         button.message.edit({ components: [adminmenu] }) &&
//                         button.reply({ content: `Deleted <@${sender}> message from darkweb`, ephemeral: true }) &&
//                         logChannel.send({
//                             embeds: [
//                                 new MessageEmbed({
//                                     description: `<@${sender}> with tag ${dtag} message was deleted by ${button.user}`,
//                                     color: config.embedColour
//                                 })
//                             ]
//                         });
//                 } catch (error) {
//                     return client.errweb.send(`\`\`\`js\n${error.stack}\`\`\``);
//                 };
//             };
//         };
//     } catch (error) {
//         return client.errweb.send(`\`\`\`js\n${error.stack}\`\`\``);
//     };
// });

client.login(config.TOKEN);

process.on("unhandledRejection", (error) => {
    client.errweb.send(`\`\`\`js\n${error.stack}\`\`\``);
});
process.on("uncaughtException", (err, origin) => {
    client.errweb.send(`\`\`\`js\n${err.stack}\`\`\``);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
    client.errweb.send(`\`\`\`js\n${err.stack}\`\`\``);
});
process.on("beforeExit", (code) => {
    client.errweb.send(`\`\`\`js\n${code}\`\`\``);
});
process.on("exit", (code) => {
    client.errweb.send(`\`\`\`js\n${code}\`\`\``);
});
process.on("multipleResolves", (type, promise, reason) => { });