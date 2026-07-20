import { ChannelType, PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "thread",
    description: "Manage threads: create, archive, unarchive, lock, rename, add members, remove members",
    category: "Utility",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageThreads],
    botPermissions: [PermissionFlagsBits.ManageThreads],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("create").setDescription("Create bagong thread")
        .addStringOption((o) => o.setName("name").setDescription("Pangalan ng thread").setRequired(true).setMaxLength(100))
        .addBooleanOption((o) => o.setName("private").setDescription("Private thread? (default: false)").setRequired(false))
        .addIntegerOption((o) => o.setName("duration").setDescription("Auto-archive duration").setRequired(false)
        .addChoices({ name: "1 hour", value: 60 }, { name: "1 day", value: 1440 }, { name: "3 days", value: 4320 }, { name: "1 week", value: 10080 })))
        .addSubcommand((s) => s.setName("archive").setDescription("Archive current thread")
        .addBooleanOption((o) => o.setName("lock").setDescription("I-lock din?").setRequired(false)))
        .addSubcommand((s) => s.setName("unarchive").setDescription("I-unarchive ang current thread"))
        .addSubcommand((s) => s.setName("rename").setDescription("Palitan ang pangalan ng thread")
        .addStringOption((o) => o.setName("name").setDescription("Bagong pangalan").setRequired(true).setMaxLength(100)))
        .addSubcommand((s) => s.setName("add").setDescription("Add member sa thread")
        .addUserOption((o) => o.setName("user").setDescription("Member na ia-add").setRequired(true)))
        .addSubcommand((s) => s.setName("remove").setDescription("Remove member mula sa thread")
        .addUserOption((o) => o.setName("user").setDescription("Member na aalisin").setRequired(true)))
        .addSubcommand((s) => s.setName("info").setDescription("View info ng current thread")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const channel = ctx.interaction?.channel ?? ctx.message?.channel;
        if (sub === "create") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const isPrivate = (ctx.isSlash ? ctx.interaction.options.getBoolean("private") : false) ?? false;
            const duration = (ctx.isSlash ? ctx.interaction.options.getInteger("duration") : 1440) ?? 1440;
            if (!name) {
                await ctx.reply({ embeds: [errorEmbed("Provide a pangalan ng thread.")] });
                return;
            }
            if (!channel || !channel.threads) {
                await ctx.reply({ embeds: [errorEmbed("This channel does not support threads.")] });
                return;
            }
            const thread = await channel.threads.create({
                name,
                autoArchiveDuration: duration,
                type: isPrivate ? ChannelType.PrivateThread : ChannelType.PublicThread,
                reason: `Created by ${ctx.userId}`,
            }).catch(() => null);
            if (!thread) {
                await ctx.reply({ embeds: [errorEmbed("Hindi magawa ang thread.")] });
                return;
            }
            await ctx.reply({ embeds: [successEmbed(`✅ Thread created: ${thread}`)] });
            return;
        }
        const thread = channel?.isThread?.() ? channel : null;
        if (!thread && ["archive", "unarchive", "rename", "add", "remove", "info"].includes(sub ?? "")) {
            await ctx.reply({ embeds: [errorEmbed("Use command na ito sa loob ng isang thread.")] });
            return;
        }
        if (sub === "archive") {
            const lock = (ctx.isSlash ? ctx.interaction.options.getBoolean("lock") : false) ?? false;
            await thread.setArchived(true);
            if (lock)
                await thread.setLocked(true).catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`Thread ${lock ? "locked and " : ""}archived.`)] });
            return;
        }
        if (sub === "unarchive") {
            await thread.setArchived(false);
            await ctx.reply({ embeds: [successEmbed("Thread un-archived!")] });
            return;
        }
        if (sub === "rename") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            if (!name) {
                await ctx.reply({ embeds: [errorEmbed("Provide a bagong pangalan.")] });
                return;
            }
            await thread.setName(name);
            await ctx.reply({ embeds: [successEmbed(`Thread renamed to **${name}**.`)] });
            return;
        }
        if (sub === "add") {
            const userId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!userId) {
                await ctx.reply({ embeds: [errorEmbed("Provide a user.")] });
                return;
            }
            await thread.members.add(userId).catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`<@${userId}> ay na-add sa thread.`)] });
            return;
        }
        if (sub === "remove") {
            const userId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!userId) {
                await ctx.reply({ embeds: [errorEmbed("Provide a user.")] });
                return;
            }
            await thread.members.remove(userId).catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`<@${userId}> ay na-remove mula sa thread.`)] });
            return;
        }
        if (sub === "info") {
            const t = thread;
            const embed = baseEmbed("primary")
                .setTitle(`🧵 Thread Info: ${t.name}`)
                .addFields({ name: "ID", value: t.id, inline: true }, { name: "Type", value: t.type === ChannelType.PrivateThread ? "Private" : "Public", inline: true }, { name: "Archived", value: t.archived ? "Yes" : "No", inline: true }, { name: "Locked", value: t.locked ? "Yes" : "No", inline: true }, { name: "Member Count", value: String(t.memberCount ?? "Unknown"), inline: true }, { name: "Created", value: `<t:${Math.floor(t.createdTimestamp / 1000)}:R>`, inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Gamitin ang: create | archive | unarchive | rename | add | remove | info")] });
    },
};
export default command;
//# sourceMappingURL=thread.js.map