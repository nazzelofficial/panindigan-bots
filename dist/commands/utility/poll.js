import { ActionRowBuilder, ButtonBuilder, ButtonStyle, } from "discord.js";
import { PollModel } from "../../database/models/Community";
import { baseEmbed, successEmbed, errorEmbed } from "../../utils/embeds";
function normalizeVotes(votes) {
    if (votes instanceof Map)
        return votes;
    if (votes && typeof votes === "object") {
        return new Map(Object.entries(votes));
    }
    return new Map();
}
function buildPollEmbed(question, options, votes) {
    const counts = options.map((_, index) => [...votes.values()].filter((vote) => vote === String(index)).length);
    const total = counts.reduce((sum, count) => sum + count, 0);
    return baseEmbed("primary")
        .setTitle(`📊 ${question}`)
        .setDescription(options
        .map((opt, index) => {
        const count = counts[index];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
        return `**${index + 1}. ${opt}**\n[${bar}] ${count} vote${count !== 1 ? "s" : ""} (${pct}%)`;
    })
        .join("\n\n"))
        .setFooter({ text: `${total} total vote${total !== 1 ? "s" : ""}` });
}
const command = {
    name: "poll",
    description: "Create or end a poll",
    category: "Utility",
    access: "moderator",
    guildOnly: true,
    cooldown: 10,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("create")
        .setDescription("Create a poll")
        .addStringOption((o) => o.setName("question").setDescription("Poll question").setRequired(true))
        .addStringOption((o) => o.setName("options").setDescription("Options separated by | (max 5)").setRequired(true))
        .addIntegerOption((o) => o.setName("duration").setDescription("Duration in minutes (0 = no auto-end)").setRequired(false).setMinValue(0).setMaxValue(1440)))
        .addSubcommand((s) => s.setName("end")
        .setDescription("End a poll early")
        .addStringOption((o) => o.setName("messageid").setDescription("Poll message ID").setRequired(true)))
        .addSubcommand((s) => s.setName("results")
        .setDescription("View poll results without ending it")
        .addStringOption((o) => o.setName("messageid").setDescription("Poll message ID").setRequired(true))),
    registerComponents(client) {
        client.componentHandlers.set("poll", async (interaction) => {
            if (!interaction.isButton())
                return;
            const [, messageId, optionIdx] = interaction.customId.split(":");
            const guild = interaction.guild;
            if (!guild)
                return;
            const poll = await PollModel.findOne({ guildId: guild.id, messageId });
            if (!poll || poll.ended) {
                await interaction.reply({ content: "This poll has ended.", ephemeral: true });
                return;
            }
            const voteIndex = Number(optionIdx);
            if (Number.isNaN(voteIndex) || voteIndex < 0 || voteIndex >= poll.options.length) {
                await interaction.reply({ content: "That option is no longer available.", ephemeral: true });
                return;
            }
            const votes = normalizeVotes(poll.votes);
            votes.set(interaction.user.id, String(voteIndex));
            poll.votes = votes;
            await poll.save();
            await interaction.reply({ content: `✅ Vote recorded for **${poll.options[voteIndex]}**. You can change your vote by clicking another option.`, ephemeral: true });
        });
    },
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "create";
        if (sub === "create") {
            const question = ctx.isSlash ? ctx.interaction.options.getString("question", true) : ctx.args.slice(1).join(" ").split("|")[0]?.trim();
            const optionsRaw = ctx.isSlash ? ctx.interaction.options.getString("options", true) : ctx.args.slice(1).join(" ").split("|").slice(1).join("|");
            const duration = ctx.isSlash ? (ctx.interaction.options.getInteger("duration") ?? 0) : 0;
            if (!question) {
                await ctx.reply({ embeds: [errorEmbed("Provide a question.")] });
                return;
            }
            const options = optionsRaw.split("|").map((option) => option.trim()).filter(Boolean).slice(0, 5);
            if (options.length < 2) {
                await ctx.reply({ embeds: [errorEmbed("Provide at least 2 options separated by `|`.")] });
                return;
            }
            const channel = ctx.interaction?.channel ?? ctx.message?.channel;
            if (!channel?.isTextBased())
                return;
            const endsAt = duration > 0 ? new Date(Date.now() + duration * 60_000) : null;
            const embed = buildPollEmbed(question, options, new Map());
            if (endsAt)
                embed.setFooter({ text: `0 total votes · Ends at` }).setTimestamp(endsAt);
            const rows = [];
            let row = new ActionRowBuilder();
            options.forEach((opt, index) => {
                if (index > 0 && index % 5 === 0) {
                    rows.push(row);
                    row = new ActionRowBuilder();
                }
                row.addComponents(new ButtonBuilder().setCustomId(`poll:${index}`).setLabel(`${index + 1}. ${opt.slice(0, 50)}`).setStyle(ButtonStyle.Primary));
            });
            rows.push(row);
            const msg = await channel.send({ embeds: [embed], components: rows });
            const realRows = [];
            let realRow = new ActionRowBuilder();
            options.forEach((opt, index) => {
                if (index > 0 && index % 5 === 0) {
                    realRows.push(realRow);
                    realRow = new ActionRowBuilder();
                }
                realRow.addComponents(new ButtonBuilder().setCustomId(`poll:${msg.id}:${index}`).setLabel(`${index + 1}. ${opt.slice(0, 50)}`).setStyle(ButtonStyle.Primary));
            });
            realRows.push(realRow);
            await msg.edit({ components: realRows });
            await PollModel.create({
                guildId: guild.id,
                channelId: channel.id,
                messageId: msg.id,
                authorId: ctx.userId,
                question,
                options,
                votes: new Map(),
                ended: false,
                endsAt,
            });
            await ctx.reply({ embeds: [successEmbed(`Poll created! ${endsAt ? `Ends <t:${Math.floor(endsAt.getTime() / 1000)}:R>.` : "No auto-end set."}`)] });
        }
        else if (sub === "end" || sub === "results") {
            const msgId = ctx.isSlash ? ctx.interaction.options.getString("messageid", true) : ctx.args[1];
            const poll = await PollModel.findOne({ guildId: guild.id, messageId: msgId });
            if (!poll) {
                await ctx.reply({ embeds: [errorEmbed("Poll not found.")] });
                return;
            }
            if (sub === "end") {
                poll.ended = true;
                await poll.save();
                const channel = guild.channels.cache.get(poll.channelId);
                const message = await channel?.messages.fetch(msgId).catch(() => null);
                if (message) {
                    await message.edit({ embeds: [buildPollEmbed(poll.question, poll.options, normalizeVotes(poll.votes)).setTitle(`📊 [ENDED] ${poll.question}`)], components: [] }).catch(() => { });
                }
            }
            const embed = buildPollEmbed(poll.question, poll.options, normalizeVotes(poll.votes));
            if (sub === "end")
                embed.setTitle(`📊 [ENDED] ${poll.question}`);
            await ctx.reply({ embeds: [embed] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: create | end | results")] });
        }
    },
};
export default command;
//# sourceMappingURL=poll.js.map