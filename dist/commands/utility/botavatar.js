import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "botavatar",
    description: "View the bot avatar",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const bot = ctx.client.user;
        const avatar = bot?.avatarURL();
        const embed = baseEmbed("primary")
            .setTitle("🤖 Bot Avatar")
            .setThumbnail(avatar ?? null)
            .setDescription(`${bot?.tag}`)
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=botavatar.js.map