import { PermissionFlagsBits } from "discord.js";
import { baseEmbed, successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "unmuteallmembers",
    description: "Remove active timeouts from all currently timed-out members in this server",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],
    guildOnly: true,
    cooldown: 30,
    aliases: ["removeallmutes", "clearalltimeouts"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("reason").setDescription("Reason for removing all timeouts").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const reason = ctx.isSlash ? (ctx.interaction.options.getString("reason") ?? "Mass unmute by moderator") : ctx.args.join(" ") || "Mass unmute by moderator";
        await ctx.reply({ embeds: [baseEmbed("warning").setDescription("⏳ Fetching all members — this may take a moment for large servers...")] });
        let members;
        try {
            members = await guild.members.fetch();
        }
        catch {
            await ctx.reply({ embeds: [errorEmbed("Failed to fetch member list.")] });
            return;
        }
        const timedOut = members.filter((m) => m.communicationDisabledUntilTimestamp !== null && m.communicationDisabledUntilTimestamp > Date.now());
        if (!timedOut.size) {
            await ctx.reply({ embeds: [baseEmbed("info").setDescription("ℹ️ No members are currently timed out.")] });
            return;
        }
        let success = 0, failed = 0;
        for (const [, member] of timedOut) {
            try {
                await member.timeout(null, reason);
                success++;
            }
            catch {
                failed++;
            }
        }
        await ctx.reply({
            embeds: [
                successEmbed(`✅ Unmuted **${success}** member${success !== 1 ? "s" : ""}.${failed ? ` Failed for **${failed}** (insufficient permissions or hierarchy).` : ""}\nReason: ${reason}`),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=unmuteallmembers.js.map