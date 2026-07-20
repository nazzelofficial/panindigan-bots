import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "verifykick",
    description: "Kick all unverified members who have been in the server longer than the verification timeout",
    category: "Verification",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.KickMembers],
    guildOnly: true,
    cooldown: 30,
    slashData: (b) => b
        .addBooleanOption((o) => o.setName("confirm").setDescription("Confirm the kick action").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const confirmed = ctx.isSlash ? ctx.interaction.options.getBoolean("confirm", true) : ctx.args[0]?.toLowerCase() === "confirm";
        if (!confirmed) {
            await ctx.reply({ embeds: [errorEmbed("Cancelled. Pass `confirm: true` to kick unverified members.")] });
            return;
        }
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const verifiedRoleId = cfg?.verification?.roleId ?? cfg?.verifiedRoleId;
        const timeoutMinutes = cfg?.verification?.timeoutMinutes ?? 1440;
        if (!verifiedRoleId) {
            await ctx.reply({ embeds: [errorEmbed("No verified role is configured. Use `verifyrole` to set one.")] });
            return;
        }
        await guild.members.fetch();
        const cutoff = Date.now() - timeoutMinutes * 60 * 1000;
        const unverified = guild.members.cache.filter((m) => !m.user.bot && !m.roles.cache.has(verifiedRoleId) && m.joinedTimestamp < cutoff);
        let kicked = 0;
        for (const [, member] of unverified) {
            try {
                await member.kick("Unverified — auto-kick after timeout");
                kicked++;
            }
            catch { /* skip if unkickable */ }
        }
        await ctx.reply({ embeds: [successEmbed(`Kicked **${kicked}** unverified member${kicked !== 1 ? "s" : ""} who exceeded the ${timeoutMinutes}-minute verification timeout.`)] });
    },
};
export default command;
//# sourceMappingURL=verifyKick.js.map