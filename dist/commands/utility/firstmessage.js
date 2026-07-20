import { infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "firstmessage",
    description: "Get the first message in a channel",
    category: "Utility",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addChannelOption((o) => o.setName("channel").setDescription("Channel to check").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel") ?? ctx.interaction.channel : guild.channels.cache.get(ctx.args[0]?.replace(/\D/g, "") ?? "") ?? ctx.message?.channel;
        if (!channel || !("messages" in channel)) {
            await ctx.reply({ embeds: [infoEmbed("Invalid channel.")] });
            return;
        }
        await ctx.reply({ embeds: [infoEmbed(`📜 First message in ${channel}: [Message placeholder]`)] });
    },
};
export default command;
//# sourceMappingURL=firstmessage.js.map