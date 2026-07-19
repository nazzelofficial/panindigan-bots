import { PermissionFlagsBits } from "discord.js";
import { GiveawayModel } from "@/database/models/Community";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "giveawayreroll",
    description: "Reroll a giveaway to pick new winners (giveaway must be ended)",
    category: "Giveaways",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["greroll"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the ended giveaway").setRequired(true))
        .addIntegerOption((o) => o.setName("winners").setDescription("Number of winners to reroll (default: original count)").setRequired(false).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide the giveaway message ID.")] });
            return;
        }
        const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId, ended: true }).lean();
        if (!giveaway) {
            await ctx.reply({ embeds: [errorEmbed("No ended giveaway found with that message ID.")] });
            return;
        }
        const participants = giveaway.participants ?? [];
        const winnerCount = ctx.isSlash ? (ctx.interaction.options.getInteger("winners") ?? giveaway.winnerCount ?? 1) : giveaway.winnerCount ?? 1;
        if (!participants.length) {
            await ctx.reply({ embeds: [errorEmbed("No participants to reroll from.")] });
            return;
        }
        const newWinners = shuffle(participants).slice(0, winnerCount);
        await GiveawayModel.findOneAndUpdate({ messageId }, { $set: { winners: newWinners } });
        const ch = guild.channels.cache.get(giveaway.channelId);
        if (ch?.isTextBased()) {
            await ch.send({ content: `🎉 **Giveaway rerolled!** New winner${newWinners.length !== 1 ? "s" : ""}: ${newWinners.map((id) => `<@${id}>`).join(", ")}! Congratulations!` }).catch(() => { });
        }
        await ctx.reply({ embeds: [successEmbed(`Giveaway rerolled! New winner${newWinners.length !== 1 ? "s" : ""}: ${newWinners.map((id) => `<@${id}>`).join(", ")}`)], ...(ctx.isSlash ? { ephemeral: true } : {}) });
    },
};
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
export default command;
//# sourceMappingURL=giveawayReroll.js.map