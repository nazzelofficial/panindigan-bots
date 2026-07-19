import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "members",
    description: "View server member counts (total, humans, bots, online, etc.)",
    category: "Utility",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["membercount", "mc"],
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        await guild.members.fetch();
        const total = guild.memberCount;
        const humans = guild.members.cache.filter((m) => !m.user.bot).size;
        const bots = guild.members.cache.filter((m) => m.user.bot).size;
        const online = guild.members.cache.filter((m) => m.presence?.status === "online").size;
        const idle = guild.members.cache.filter((m) => m.presence?.status === "idle").size;
        const dnd = guild.members.cache.filter((m) => m.presence?.status === "dnd").size;
        const offline = total - online - idle - dnd;
        const embed = baseEmbed("primary")
            .setTitle(`👥 Member Count — ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields({ name: "📊 Total", value: total.toLocaleString(), inline: true }, { name: "👤 Humans", value: humans.toLocaleString(), inline: true }, { name: "🤖 Bots", value: bots.toLocaleString(), inline: true }, { name: "🟢 Online", value: online.toLocaleString(), inline: true }, { name: "🌙 Idle", value: idle.toLocaleString(), inline: true }, { name: "⛔ Do Not Disturb", value: dnd.toLocaleString(), inline: true }, { name: "⚫ Offline", value: offline.toLocaleString(), inline: true })
            .setFooter({ text: `Verification Level: ${guild.verificationLevel}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=members.js.map