import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "birthdaychannel",
    description: "Set the birthday announcement channel",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addChannelOption((o) => o.setName("channel").setDescription("Birthday channel").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[0]?.replace(/\D/g, "") ?? "");
        if (!channel || !channel?.isTextBased?.()) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a valid text channel.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { birthdayChannelId: channel.id } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Birthday channel set to ${channel}.`)] });
    },
};
export default command;
//# sourceMappingURL=birthdaychannel.js.map