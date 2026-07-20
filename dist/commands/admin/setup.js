import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "setup",
    description: "Set up all essential server features in one guided wizard",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
            $setOnInsert: {
                guildId: guild.id,
                prefix: ctx.client.config.bot.defaultPrefix,
            },
        }, { upsert: true });
        await ctx.reply({
            embeds: [
                successEmbed("Basic server setup complete! Default prefix, leveling, and economy are now active.\n\n" +
                    "Next steps:\n" +
                    `• \`${ctx.client.config.bot.defaultPrefix}welcome setup\` — configure welcome messages\n` +
                    `• \`${ctx.client.config.bot.defaultPrefix}logs setup\` — configure logging\n` +
                    `• \`${ctx.client.config.bot.defaultPrefix}automod enable\` — enable automod\n` +
                    `• \`${ctx.client.config.bot.defaultPrefix}ticket setup\` — configure the ticket system\n` +
                    `• \`${ctx.client.config.bot.defaultPrefix}verify setup\` — configure member verification`),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=setup.js.map