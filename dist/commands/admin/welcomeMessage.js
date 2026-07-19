import { GuildModel } from "../../database/models/Guild";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "welcome_message",
    description: "Set welcome message",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("message").setDescription("Welcome message (use {user} for mention)").setRequired(true)),
    async execute(ctx) {
        const message = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args.join(" ");
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { welcome: { ...((await GuildModel.findOne({ guildId: guild.id }))?.welcome || {}), message } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Welcome message set")] });
    },
};
export default command;
//# sourceMappingURL=welcomeMessage.js.map