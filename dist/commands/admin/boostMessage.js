import { GuildModel } from "@/database/models/Guild";
import { successEmbed } from "@/utils/embeds";
const command = {
    name: "boost_message",
    description: "Set boost message",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("message").setDescription("Boost message (use {user} for mention)").setRequired(true)),
    async execute(ctx) {
        const message = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args.join(" ");
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { boostMessage: { ...((await GuildModel.findOne({ guildId: guild.id }))?.boostMessage || {}), message } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Boost message set")] });
    },
};
export default command;
//# sourceMappingURL=boostMessage.js.map