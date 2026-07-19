import { PermissionFlagsBits } from "discord.js";
import { AppealTicketModel } from "@/database/models/Moderation";
import { ModCaseModel } from "@/database/models/Moderation";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
import { createModCase } from "@/features/moderation/caseEngine";
import { sendLogEvent } from "@/features/logging/logEngine";
const command = {
    name: "appealticket",
    description: "Manage ban/mute appeal tickets for this server",
    category: "Moderation",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["appeal", "appeals"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("setup")
        .setDescription("Set the channel where ban/mute appeals will be posted")
        .addChannelOption((o) => o.setName("channel").setDescription("Appeals channel").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all pending appeals"))
        .addSubcommand((s) => s.setName("approve")
        .setDescription("Approve an appeal (unmutes/unbans the user)")
        .addStringOption((o) => o.setName("id").setDescription("Appeal ID (MongoDB ObjectId or case ID)").setRequired(true)))
        .addSubcommand((s) => s.setName("deny")
        .setDescription("Deny an appeal")
        .addStringOption((o) => o.setName("id").setDescription("Appeal ID").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for denial").setRequired(true)))
        .addSubcommand((s) => s.setName("submit")
        .setDescription("Submit a ban or mute appeal")
        .addStringOption((o) => o.setName("reason").setDescription("Why should your punishment be lifted?").setRequired(true))
        .addIntegerOption((o) => o.setName("caseid").setDescription("Case ID of the punishment (optional)").setRequired(false))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "setup") {
            const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!channel) {
                await ctx.reply({ embeds: [errorEmbed("Channel not found.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { appealChannelId: channel.id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Appeal ticket channel set to ${channel}. Members can now use \`/appealticket submit\` to submit appeals.`)] });
        }
        else if (sub === "list") {
            const appeals = await AppealTicketModel.find({ guildId: guild.id, status: "pending" }).lean().limit(15);
            if (!appeals.length) {
                await ctx.reply({ embeds: [infoEmbed("No pending appeals.")] });
                return;
            }
            const embed = baseEmbed("warning")
                .setTitle("📋 Pending Appeals")
                .setDescription(appeals.map((a, i) => {
                const ts = Math.floor(new Date(a.createdAt).getTime() / 1000);
                return `**${i + 1}.** ID: \`${a._id}\`\n<@${a.userId}>${a.caseId ? ` · Case #${a.caseId}` : ""} · <t:${ts}:R>\n↳ ${a.reason.slice(0, 100)}`;
            }).join("\n\n").slice(0, 4000))
                .setFooter({ text: `${appeals.length} pending appeal${appeals.length !== 1 ? "s" : ""}` });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "approve") {
            const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[1];
            const appeal = await AppealTicketModel.findById(id).catch(() => null);
            if (!appeal || appeal.guildId !== guild.id) {
                await ctx.reply({ embeds: [errorEmbed("Appeal not found.")] });
                return;
            }
            if (appeal.status !== "pending") {
                await ctx.reply({ embeds: [errorEmbed(`Appeal is already **${appeal.status}**.`)] });
                return;
            }
            // Find the linked mod case to determine action type
            const modCase = appeal.caseId ? await ModCaseModel.findOne({ guildId: guild.id, caseId: appeal.caseId }).lean() : null;
            if (modCase?.type === "ban" || modCase?.type === "tempban") {
                await guild.bans.remove(appeal.userId, `Appeal approved by ${ctx.userId}`).catch(() => { });
                await createModCase({ guildId: guild.id, userId: appeal.userId, moderatorId: ctx.userId, type: "unban", reason: `Appeal approved by <@${ctx.userId}>` });
            }
            else if (modCase?.type === "mute" || modCase?.type === "timeout") {
                const member = await guild.members.fetch(appeal.userId).catch(() => null);
                if (member)
                    await member.timeout(null, `Appeal approved by ${ctx.userId}`).catch(() => { });
            }
            appeal.status = "approved";
            appeal.reviewedBy = ctx.userId;
            await appeal.save();
            // Notify user
            const user = await ctx.client.users.fetch(appeal.userId).catch(() => null);
            if (user) {
                await user.send({ embeds: [successEmbed(`Your appeal in **${guild.name}** has been **approved**! Your punishment has been lifted.`)] }).catch(() => { });
            }
            await sendLogEvent(guild.id, "appealapprove", () => baseEmbed("success").setTitle("✅ Appeal Approved").addFields({ name: "User", value: `<@${appeal.userId}>`, inline: true }, { name: "Reviewed By", value: `<@${ctx.userId}>`, inline: true }, { name: "Appeal Reason", value: appeal.reason.slice(0, 500), inline: false }));
            await ctx.reply({ embeds: [successEmbed(`Appeal for <@${appeal.userId}> has been **approved** and punishment lifted.`)] });
        }
        else if (sub === "deny") {
            const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[1];
            const reason = ctx.isSlash ? ctx.interaction.options.getString("reason", true) : ctx.args.slice(2).join(" ") || "No reason provided";
            const appeal = await AppealTicketModel.findById(id).catch(() => null);
            if (!appeal || appeal.guildId !== guild.id) {
                await ctx.reply({ embeds: [errorEmbed("Appeal not found.")] });
                return;
            }
            if (appeal.status !== "pending") {
                await ctx.reply({ embeds: [errorEmbed(`Appeal is already **${appeal.status}**.`)] });
                return;
            }
            appeal.status = "denied";
            appeal.reviewedBy = ctx.userId;
            appeal.reviewReason = reason;
            await appeal.save();
            const user = await ctx.client.users.fetch(appeal.userId).catch(() => null);
            if (user) {
                await user.send({ embeds: [errorEmbed(`Your appeal in **${guild.name}** has been **denied**.\nReason: ${reason}`)] }).catch(() => { });
            }
            await ctx.reply({ embeds: [successEmbed(`Appeal for <@${appeal.userId}> has been **denied**. Reason: ${reason}`)] });
        }
        else if (sub === "submit") {
            const reason = ctx.isSlash ? ctx.interaction.options.getString("reason", true) : ctx.args.slice(1).join(" ");
            const caseId = ctx.isSlash ? ctx.interaction.options.getInteger("caseid") : null;
            if (!reason) {
                await ctx.reply({ embeds: [errorEmbed("Provide a reason for your appeal.")] });
                return;
            }
            // Check if user already has a pending appeal
            const existing = await AppealTicketModel.findOne({ guildId: guild.id, userId: ctx.userId, status: "pending" });
            if (existing) {
                await ctx.reply({ embeds: [errorEmbed("You already have a pending appeal. Wait for it to be reviewed before submitting another.")] });
                return;
            }
            const appeal = await AppealTicketModel.create({ guildId: guild.id, userId: ctx.userId, caseId: caseId ?? null, reason });
            // Post in appeal channel if configured
            const guildDoc = await GuildModel.findOne({ guildId: guild.id }).lean();
            const appealChannelId = guildDoc?.appealChannelId;
            if (appealChannelId) {
                const ch = guild.channels.cache.get(appealChannelId);
                if (ch?.isTextBased()) {
                    const embed = baseEmbed("warning")
                        .setTitle("📋 New Appeal Submitted")
                        .addFields({ name: "User", value: `<@${ctx.userId}>`, inline: true }, { name: "Appeal ID", value: `\`${appeal._id}\``, inline: true }, { name: "Case ID", value: caseId ? String(caseId) : "Not specified", inline: true }, { name: "Reason", value: reason.slice(0, 1000), inline: false })
                        .setFooter({ text: "Use /appealticket approve or deny [appeal id] to review" });
                    await ch.send({ embeds: [embed] }).catch(() => { });
                }
            }
            await ctx.reply({ embeds: [successEmbed(`Your appeal has been submitted!\n\nAppeal ID: \`${appeal._id}\`\n\nA moderator will review it soon. You will be notified via DM when a decision is made.`)], ephemeral: true });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: setup | list | approve | deny | submit")] });
        }
    },
};
export default command;
//# sourceMappingURL=appealticket.js.map