import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { SuggestionModel } from "../../database/models/Community.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "suggest",
    description: "Submit or manage suggestions for this server",
    category: "Utility",
    access: "general",
    guildOnly: true,
    cooldown: 30,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("create")
        .setDescription("Submit a suggestion")
        .addStringOption((o) => o.setName("idea").setDescription("Your suggestion").setRequired(true).setMaxLength(1000)))
        .addSubcommand((s) => s.setName("approve")
        .setDescription("Approve a suggestion (Moderator)")
        .addStringOption((o) => o.setName("messageid").setDescription("Suggestion message ID").setRequired(true))
        .addStringOption((o) => o.setName("note").setDescription("Staff note").setRequired(false)))
        .addSubcommand((s) => s.setName("deny")
        .setDescription("Deny a suggestion (Moderator)")
        .addStringOption((o) => o.setName("messageid").setDescription("Suggestion message ID").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)))
        .addSubcommand((s) => s.setName("consider")
        .setDescription("Mark a suggestion as under consideration (Moderator)")
        .addStringOption((o) => o.setName("messageid").setDescription("Suggestion message ID").setRequired(true)))
        .addSubcommand((s) => s.setName("setchannel")
        .setDescription("Set the suggestion channel (Admin)")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "create";
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        if (sub === "create") {
            const idea = ctx.isSlash ? ctx.interaction.options.getString("idea", true) : ctx.args.slice(1).join(" ");
            if (!idea) {
                await ctx.reply({ embeds: [errorEmbed("Provide your suggestion.")] });
                return;
            }
            const channelId = cfg?.suggestionChannelId;
            if (!channelId) {
                await ctx.reply({ embeds: [errorEmbed("No suggestion channel configured. Ask an admin to run `/suggest setchannel`.")] });
                return;
            }
            const channel = guild.channels.cache.get(channelId);
            if (!channel?.isTextBased()) {
                await ctx.reply({ embeds: [errorEmbed("Suggestion channel not found.")] });
                return;
            }
            const author = await ctx.client.users.fetch(ctx.userId);
            const embed = baseEmbed("primary")
                .setTitle("💡 New Suggestion")
                .setDescription(idea)
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .addFields({ name: "Status", value: "⏳ Pending" })
                .setTimestamp();
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("suggest:upvote").setLabel("👍 Upvote").setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId("suggest:downvote").setLabel("👎 Downvote").setStyle(ButtonStyle.Danger));
            const msg = await channel.send({ embeds: [embed], components: [row] });
            await SuggestionModel.create({
                guildId: guild.id, channelId, messageId: msg.id,
                authorId: ctx.userId, content: idea, status: "pending",
            });
            await ctx.reply({ embeds: [successEmbed(`Your suggestion has been submitted! Check ${channel}.`)] });
        }
        else if (["approve", "deny", "consider"].includes(sub)) {
            const msgId = ctx.isSlash ? ctx.interaction.options.getString("messageid", true) : ctx.args[1];
            const note = ctx.isSlash ? ctx.interaction.options.getString("note") ?? ctx.interaction.options.getString("reason") : ctx.args.slice(2).join(" ");
            const suggestion = await SuggestionModel.findOne({ guildId: guild.id, messageId: msgId });
            if (!suggestion) {
                await ctx.reply({ embeds: [errorEmbed("Suggestion not found.")] });
                return;
            }
            const statusMap = { approve: "approved", deny: "denied", consider: "considered" };
            const emojiMap = { approve: "✅", deny: "❌", consider: "🤔" };
            const colorMap = { approve: "success", deny: "danger", consider: "warning" };
            suggestion.status = statusMap[sub];
            if (sub === "approve")
                suggestion.approvedBy = ctx.userId;
            if (sub === "deny")
                suggestion.deniedBy = ctx.userId;
            if (note)
                suggestion.staffNote = note;
            await suggestion.save();
            const ch = guild.channels.cache.get(suggestion.channelId);
            const msg = await ch?.messages.fetch(msgId).catch(() => null);
            if (msg?.embeds[0]) {
                const updated = baseEmbed(colorMap[sub])
                    .setTitle("💡 Suggestion")
                    .setDescription(suggestion.content)
                    .addFields({ name: "Status", value: `${emojiMap[sub]} ${statusMap[sub].charAt(0).toUpperCase() + statusMap[sub].slice(1)}`, inline: true }, { name: "Reviewed by", value: `<@${ctx.userId}>`, inline: true });
                if (note)
                    updated.addFields({ name: "Staff Note", value: note });
                await msg.edit({ embeds: [updated], components: [] }).catch(() => { });
            }
            await ctx.reply({ embeds: [successEmbed(`Suggestion ${statusMap[sub]}.`)] });
        }
        else if (sub === "setchannel") {
            const member = ctx.interaction?.member ?? ctx.message?.member;
            if (!member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
                await ctx.reply({ embeds: [errorEmbed("Manage Server required.")] });
                return;
            }
            const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!channel?.isTextBased?.()) {
                await ctx.reply({ embeds: [errorEmbed("Provide a text channel.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { suggestionChannelId: channel.id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Suggestion channel set to ${channel}.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: create | approve | deny | consider | setchannel")] });
        }
    },
};
export default command;
//# sourceMappingURL=suggest.js.map