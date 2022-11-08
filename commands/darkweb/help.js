const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');

module.exports = {
    name: "help",
    // aliases: ["create"],
    description: "shows the help menu of the bot",
    category: "help",
    usage: "help",
    botPermissions: ["EMBED_LINKS"],
    userPermissions: [],

    async run(client, message, args) {

        setTimeout(() => message.delete().catch(() => null), 5000);

        let embed = new MessageEmbed()
            .setTitle(`${client.user.username} Help Menu`);

        if (message.member.roles.cache.get(client.config.adminrole)) {
            embed.addField("Admin Commands", "block `user_tag`, unblock `user_tag`, warn `user_tag`, clearwarn `user_tag`")
                .addField("Switch Commands", "lock, unlock")
        };

        embed.addField('User Commands', "create `tag_here`, delete `tag_here`")
            .setFooter({
                text: 'DM ME TO SEND POST ON DARK WEB BOT',
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            });

        return message.reply({ embeds: [embed] })
            .then(m => setTimeout(() => m.delete().catch(() => null), 10000));
    },
};