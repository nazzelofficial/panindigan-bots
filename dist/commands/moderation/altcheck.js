import { baseEmbed, errorEmbed } from "@/utils/embeds";
const SUSPICION_THRESHOLD_DAYS = 14;
function accountAgeDays(userId) {
    const createdAt = Number(BigInt(userId) >> 22n) + 1420070400000;
    return Math.floor((Date.now() - createdAt) / 86_400_000);
}
const command = {
    name: "altcheck",
    description: "Check if a member is likely an alt account based on account age and join patterns",
    category: "Moderation",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    aliases: ["isalt", "altdetect"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash
            ? ctx.interaction.options.getUser("user", true).id
            : ctx.args[0]?.replace(/\D/g, "");
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a user to check.")] });
            return;
        }
        const user = await ctx.client.users.fetch(targetId).catch(() => null);
        if (!user) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        const ageDays = accountAgeDays(targetId);
        const joinedDaysAgo = member?.joinedAt ? Math.floor((Date.now() - member.joinedAt.getTime()) / 86_400_000) : null;
        const hasAvatar = !!user.avatar;
        const hasDefaultName = /^[A-Za-z]+#\d{4}$/.test(user.tag) || user.username.match(/^[a-z]+\d{4}$/) !== null;
        const suspicionPoints = [];
        let riskLevel = "🟢 Low";
        if (ageDays < SUSPICION_THRESHOLD_DAYS) {
            suspicionPoints.push(`⚠️ Account is only **${ageDays} day${ageDays !== 1 ? "s" : ""}** old (new accounts are more likely alts)`);
        }
        if (!hasAvatar) {
            suspicionPoints.push("⚠️ No custom avatar set");
        }
        if (joinedDaysAgo !== null && joinedDaysAgo < 1) {
            suspicionPoints.push("⚠️ Joined this server within the last 24 hours");
        }
        if (ageDays < 7) {
            suspicionPoints.push("🚨 Account is less than 7 days old — high alt likelihood");
        }
        if (suspicionPoints.length >= 3 || ageDays < 7)
            riskLevel = "🔴 High";
        else if (suspicionPoints.length === 2)
            riskLevel = "🟡 Medium";
        else if (suspicionPoints.length === 1)
            riskLevel = "🟠 Moderate";
        const createdAt = Number(BigInt(targetId) >> 22n) + 1420070400000;
        const embed = baseEmbed(suspicionPoints.length >= 2 ? "danger" : "warning")
            .setTitle(`🔍 Alt Account Check — ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields({ name: "Risk Level", value: riskLevel, inline: true }, { name: "Account Age", value: `${ageDays} day${ageDays !== 1 ? "s" : ""}`, inline: true }, { name: "Account Created", value: `<t:${Math.floor(createdAt / 1000)}:F>`, inline: true }, { name: "Has Avatar", value: hasAvatar ? "✅ Yes" : "❌ No", inline: true }, {
            name: "Joined Server",
            value: member?.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Not in server",
            inline: true,
        });
        if (suspicionPoints.length) {
            embed.addFields({ name: "Suspicion Indicators", value: suspicionPoints.join("\n"), inline: false });
        }
        else {
            embed.addFields({ name: "Suspicion Indicators", value: "✅ No strong indicators of alt account behavior.", inline: false });
        }
        embed.setFooter({ text: "Note: This is a heuristic check only — confirm with manual review before taking action." });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=altcheck.js.map