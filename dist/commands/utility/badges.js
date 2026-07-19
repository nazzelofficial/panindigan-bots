import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "badges",
    description: "View a user badges",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),
    async execute(ctx) {
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user") ?? ctx.interaction.user : await ctx.client.users.fetch(ctx.userId);
        const flags = targetUser.flags?.toArray() || [];
        const badgeNames = flags.map((f) => f).join(", ") || "No badges";
        const embed = baseEmbed("primary")
            .setTitle("🏅 User Badges")
            .setDescription(`<@${targetUser.id}>\nBadges: ${badgeNames}`)
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=badges.js.map