import { infoEmbed } from "../../utils/embeds";
const command = {
    name: "invite",
    description: "Get an invite link for the bot",
    category: "Settings",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🔗 Invite the bot: https://discord.com/oauth2/authorize")] });
    },
};
export default command;
//# sourceMappingURL=invite.js.map