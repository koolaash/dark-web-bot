const db = require(`quick.db`);

module.exports = {
    name: "clearwarn",
    aliases: ["cwarns", "cwarn"],
    description: "helps you see the last message which got deleted",
    category: "Account",
    usage: "acreate `tag_here`",
    botPermissions: ["EMBED_LINKS"],
    userPermissions: [],

    async run(client, message, args) {
        if (!message.member.roles.cache.get(client.config.adminrole)) {
            return message.reply("This Command Is For Admins Only!")
        };
        if (!args[0]) {
            return message.reply("You forgot to mention the tag")
        };

        let tag_use = db.get(args[0]);

        if (tag_use !== true) {
            return message.reply("This Tag Is Not In Use");
        };
        let warns = await db.get(`warns${args[0]}`);
        db.delete(`warns${args[0]}`);
        return message.reply(`Cleard all warns of ${args[0]}\nThis user had ${warns}/3 warnings!`);
    },
};