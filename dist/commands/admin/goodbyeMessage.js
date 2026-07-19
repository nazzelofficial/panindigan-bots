import { GuildModel } from "../../database/models/Guild";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "goodbye_message",
    description: "Set goodbye message",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("message").setDescription("Goodbye message (use {user} for mention)").setRequired(true)),
    async execute(ctx) {
        const message = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args.join(" ");
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { goodbye: { ...((await GuildModel.findOne({ guildId: guild.id }))?.goodbye || {}), message } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye message set")] });
    },
};
export default command;
//# sourceMappingURL=goodbyeMessage.js.map