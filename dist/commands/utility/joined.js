import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "joined",
    description: "Show when a user joined the server",
    category: "Utility",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user") ?? ctx.interaction.user : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, "") ?? "");
        const member = await guild.members.fetch(targetUser.id).catch(() => null);
        const embed = baseEmbed("primary")
            .setTitle("📅 Join Date")
            .setDescription(`<@${targetUser.id}> joined ${member?.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown"}`)
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=joined.js.map