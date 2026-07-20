import { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { GiveawayModel } from "../../database/models/Community.js";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
function parseDuration(str) {
    const match = str?.match(/^(\d+)(s|m|h|d)$/i);
    if (!match)
        return null;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    return value * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 0);
}
function pickWinners(entries, count) {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}
/** Shared autocomplete for giveaway message ID options. */
async function respondGiveawayIds(interaction, filter = {}) {
    const focused = String(interaction.options.getFocused() ?? "").trim();
    const guildId = interaction.guildId;
    try {
        const query = { guildId, ended: false, ...filter };
        if (focused)
            query["messageId"] = { $regex: focused };
        const docs = await GiveawayModel.find(query).sort({ endsAt: 1 }).limit(10).lean();
        await interaction.respond(docs.map((g) => ({
            name: `🎉 ${String(g.prize ?? "Giveaway").slice(0, 80)} (ID: ${g.messageId})`,
            value: String(g.messageId),
        })));
    }
    catch {
        await interaction.respond([]);
    }
}
const command = {
    name: "giveaway",
    description: "Create and manage giveaways",
    category: "Giveaways",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageEvents],
    guildOnly: true,
    cooldown: 5,
    aliases: ["gw"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("start").setDescription("Start a giveaway")
        .addStringOption((o) => o.setName("prize").setDescription("What you're giving away").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("Duration e.g. 1h, 30m, 7d").setRequired(true))
        .addIntegerOption((o) => o.setName("winners").setDescription("Number of winners (default 1)").setRequired(false).setMinValue(1).setMaxValue(20))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel (default: current)").setRequired(false)))
        .addSubcommand((s) => s.setName("end").setDescription("End a giveaway early")
        .addStringOption((o) => o.setName("id").setDescription("Giveaway message ID").setRequired(true).setAutocomplete(true)))
        .addSubcommand((s) => s.setName("reroll").setDescription("Reroll winners")
        .addStringOption((o) => o.setName("id").setDescription("Giveaway message ID").setRequired(true).setAutocomplete(true)))
        .addSubcommand((s) => s.setName("delete").setDescription("Delete a giveaway")
        .addStringOption((o) => o.setName("id").setDescription("Giveaway message ID").setRequired(true).setAutocomplete(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List active giveaways in this server"))
        .addSubcommand((s) => s.setName("pause").setDescription("Pause a running giveaway")
        .addStringOption((o) => o.setName("id").setDescription("Giveaway message ID").setRequired(true).setAutocomplete(true)))
        .addSubcommand((s) => s.setName("resume").setDescription("Resume a paused giveaway")
        .addStringOption((o) => o.setName("id").setDescription("Giveaway message ID — only shows paused giveaways").setRequired(true).setAutocomplete(true))),
    async autocomplete(interaction) {
        const sub = interaction.options.getSubcommand(false);
        if (sub === "resume") {
            await respondGiveawayIds(interaction, { paused: true });
        }
        else {
            await respondGiveawayIds(interaction);
        }
    },
    registerComponents(client) {
        client.componentHandlers.set("giveaway", async (interaction) => {
            if (!interaction.isButton())
                return;
            const [, messageId] = interaction.customId.split(":");
            const guild = interaction.guild;
            if (!guild)
                return;
            const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId });
            if (!giveaway || giveaway.ended) {
                await interaction.reply({ content: "This giveaway has already ended.", ephemeral: true });
                return;
            }
            if (giveaway.paused) {
                await interaction.reply({ content: "⏸️ This giveaway is currently paused.", ephemeral: true });
                return;
            }
            const userId = interaction.user.id;
            if (giveaway.blacklistedUsers?.includes(userId)) {
                await interaction.reply({ content: "❌ You are not allowed to enter this giveaway.", ephemeral: true });
                return;
            }
            if (giveaway.participants.includes(userId)) {
                giveaway.participants = giveaway.participants.filter((e) => e !== userId);
                await giveaway.save();
                await interaction.reply({ content: "✅ You have left the giveaway.", ephemeral: true });
            }
            else {
                giveaway.participants.push(userId);
                await giveaway.save();
                await interaction.reply({ content: "🎉 You have entered the giveaway! Good luck!", ephemeral: true });
            }
        });
    },
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const guildId = guild.id;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        // ── start ──────────────────────────────────────────────────────────────
        if (sub === "start") {
            const prize = ctx.isSlash ? ctx.interaction.options.getString("prize", true) : ctx.args[1];
            const durStr = ctx.isSlash ? ctx.interaction.options.getString("duration", true) : ctx.args[2];
            const winners = ctx.isSlash ? (ctx.interaction.options.getInteger("winners") ?? 1) : 1;
            const channelId = ctx.isSlash
                ? (ctx.interaction.options.getChannel("channel")?.id ?? ctx.interaction.channelId)
                : ctx.message?.channelId;
            if (!prize || !durStr) {
                await ctx.reply({ embeds: [errorEmbed("Provide a prize and duration.")] });
                return;
            }
            const ms = parseDuration(durStr);
            if (!ms || ms < 10_000) {
                await ctx.reply({ embeds: [errorEmbed("Invalid duration. Use: 30s, 5m, 1h, 7d")] });
                return;
            }
            const endsAt = new Date(Date.now() + ms);
            const channel = guild.channels.cache.get(channelId ?? "");
            if (!channel || !("send" in channel)) {
                await ctx.reply({ embeds: [errorEmbed("Invalid channel.")] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle("🎉 GIVEAWAY")
                .setDescription(`**Prize:** ${prize}\n\nClick the button below to enter!`)
                .addFields({ name: "Winners", value: String(winners), inline: true }, { name: "Ends", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true }, { name: "Hosted by", value: `<@${ctx.userId}>`, inline: true });
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("giveaway:pending").setLabel("🎉 Enter").setStyle(ButtonStyle.Primary));
            const msg = await channel.send({ embeds: [embed], components: [row] });
            const doc = await GiveawayModel.create({
                guildId, channelId, messageId: msg.id, prize, endsAt,
                winnersCount: winners, participants: [], ended: false,
                hostId: ctx.userId,
            });
            // Update button with real messageId
            const updatedRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway:${msg.id}`).setLabel("🎉 Enter").setStyle(ButtonStyle.Primary));
            await msg.edit({ components: [updatedRow] });
            await ctx.reply({ embeds: [successEmbed(`🎉 Giveaway for **${prize}** started in <#${channelId}>!\nMessage ID: \`${msg.id}\``)] });
            return;
        }
        const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[1];
        if (!id && sub !== "list") {
            await ctx.reply({ embeds: [errorEmbed("Provide the giveaway message ID.")] });
            return;
        }
        // ── list ───────────────────────────────────────────────────────────────
        if (sub === "list") {
            const docs = await GiveawayModel.find({ guildId, ended: false }).sort({ endsAt: 1 }).limit(10).lean();
            if (!docs.length) {
                await ctx.reply({ embeds: [infoEmbed("No active giveaways in this server.")] });
                return;
            }
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle("🎉 Active Giveaways")
                        .setDescription(docs.map((g, i) => `**${i + 1}.** ${g.prize} — ends <t:${Math.floor(new Date(g.endsAt).getTime() / 1000)}:R>\nID: \`${g.messageId}\``).join("\n\n")),
                ],
            });
            return;
        }
        const giveaway = await GiveawayModel.findOne({ guildId, messageId: id });
        if (!giveaway) {
            await ctx.reply({ embeds: [errorEmbed("Giveaway not found.")] });
            return;
        }
        // ── end ────────────────────────────────────────────────────────────────
        if (sub === "end") {
            if (giveaway.ended) {
                await ctx.reply({ embeds: [errorEmbed("Giveaway already ended.")] });
                return;
            }
            giveaway.ended = true;
            const winners2 = pickWinners(giveaway.participants, giveaway.winnersCount ?? 1);
            await giveaway.save();
            const winnerStr = winners2.length ? winners2.map((w) => `<@${w}>`).join(", ") : "No participants";
            await ctx.reply({ embeds: [successEmbed(`🎉 Giveaway **${giveaway.prize}** ended!\n**Winners:** ${winnerStr}`)] });
            return;
        }
        // ── reroll ─────────────────────────────────────────────────────────────
        if (sub === "reroll") {
            const winners2 = pickWinners(giveaway.participants, giveaway.winnersCount ?? 1);
            const winnerStr = winners2.length ? winners2.map((w) => `<@${w}>`).join(", ") : "No participants";
            await ctx.reply({ embeds: [successEmbed(`🔄 Rerolled! New winners: ${winnerStr}`)] });
            return;
        }
        // ── delete ─────────────────────────────────────────────────────────────
        if (sub === "delete") {
            await GiveawayModel.deleteOne({ guildId, messageId: id });
            await ctx.reply({ embeds: [successEmbed(`🗑️ Deleted giveaway \`${id}\`.`)] });
            return;
        }
        // ── pause ──────────────────────────────────────────────────────────────
        if (sub === "pause") {
            if (giveaway.paused) {
                await ctx.reply({ embeds: [errorEmbed("Giveaway is already paused.")] });
                return;
            }
            giveaway.paused = true;
            await giveaway.save();
            await ctx.reply({ embeds: [successEmbed(`⏸️ Paused giveaway **${giveaway.prize}**.`)] });
            return;
        }
        // ── resume ─────────────────────────────────────────────────────────────
        if (sub === "resume") {
            if (!giveaway.paused) {
                await ctx.reply({ embeds: [errorEmbed("Giveaway is not paused.")] });
                return;
            }
            giveaway.paused = false;
            await giveaway.save();
            await ctx.reply({ embeds: [successEmbed(`▶️ Resumed giveaway **${giveaway.prize}**.`)] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand.")] });
    },
};
export default command;
//# sourceMappingURL=giveaway.js.map