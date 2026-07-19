import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "nickname",
    description: "Change your nickname",
    category: "Utility",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("name").setDescription("New nickname").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const member = await guild.members.fetch(ctx.userId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Could not find your member.")] });
            return;
        }
        const name = ctx.isSlash ? ctx.interaction.options.getString("name") : ctx.args.join(" ");
        if (name) {
            await member.setNickname(name).catch(() => null);
            await ctx.reply({ embeds: [successEmbed(`✅ Nickname changed to ${name}`)] });
        }
        else {
            await member.setNickname(null).catch(() => null);
            await ctx.reply({ embeds: [successEmbed("✅ Nickname reset")] });
        }
    },
};
export default command;
//# sourceMappingURL=nickname.js.map