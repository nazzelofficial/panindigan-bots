import { version as djsVersion } from "discord.js";
import { baseEmbed } from "@/utils/embeds";
import { isDatabaseConnected } from "@/database/connection";
function formatUptime(ms) {
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    const parts = [];
    if (d)
        parts.push(`${d}d`);
    if (h)
        parts.push(`${h}h`);
    if (m)
        parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 ** 2)
        return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 ** 3)
        return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
const command = {
    name: "botinfo",
    description: "View bot information and statistics",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 10,
    aliases: ["about", "info", "botstats"],
    slashData: (b) => b,
    async execute(ctx) {
        const client = ctx.client;
        const mem = process.memoryUsage();
        const uptime = formatUptime(client.uptime ?? 0);
        const guildCount = client.guilds.cache.size;
        const userCount = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
        const channelCount = client.channels.cache.size;
        const commandCount = client.commands.size;
        const embed = baseEmbed("primary")
            .setTitle(`🤖 ${client.user?.username ?? "Panindigan Official"} — Bot Info`)
            .setThumbnail(client.user?.displayAvatarURL({ size: 256 }) ?? null)
            .addFields({ name: "👤 Owner", value: client.config.bot.ownerId ? `<@${client.config.bot.ownerId}>` : "Not configured", inline: true }, { name: "📅 Created", value: `<t:${Math.floor((client.user?.createdTimestamp ?? Date.now()) / 1000)}:D>`, inline: true }, { name: "🆔 Bot ID", value: `\`${client.user?.id ?? "unknown"}\``, inline: true }, { name: "🌐 Servers", value: guildCount.toLocaleString(), inline: true }, { name: "👥 Users", value: userCount.toLocaleString(), inline: true }, { name: "📝 Channels", value: channelCount.toLocaleString(), inline: true }, { name: "📟 Commands", value: String(commandCount), inline: true }, { name: "⏱️ Uptime", value: uptime, inline: true }, { name: "🏓 Latency", value: `${client.ws.ping}ms`, inline: true }, { name: "🗄️ Database", value: isDatabaseConnected() ? "🟢 Connected" : "🔴 Disconnected", inline: true }, { name: "💾 RAM Usage", value: `${formatBytes(mem.rss)} (heap: ${formatBytes(mem.heapUsed)})`, inline: true }, { name: "📦 discord.js", value: `v${djsVersion}`, inline: true }, { name: "🟢 Node.js", value: process.version, inline: true })
            .setFooter({ text: `Panindigan Official v0.3.0 • TypeScript + discord.js v14` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=botinfo.js.map