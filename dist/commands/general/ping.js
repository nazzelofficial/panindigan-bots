import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { isDatabaseConnected } from "../../database/connection.js";
const command = {
    name: "ping",
    description: "Check bot latency — WebSocket ping, roundtrip, and database status",
    category: "Utility",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    async execute(ctx) {
        const start = Date.now();
        const sent = await ctx.reply({ embeds: [EmbedFactory.loading("🏓 Pinging...")] });
        const roundTrip = Date.now() - start;
        const wsPing = ctx.client.ws.ping;
        const embed = EmbedFactory.info(`**Roundtrip Latency:** \`${roundTrip}ms\`\n` +
            `**WebSocket Latency:** \`${wsPing < 0 ? "calculating..." : `${wsPing}ms`}\`\n` +
            `**Database:** ${isDatabaseConnected() ? "🟢 Connected" : "🔴 Disconnected"}`, "🏓 Pong!");
        if (ctx.isSlash)
            await ctx.interaction.editReply({ embeds: [embed] });
        else
            await sent.edit({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=ping.js.map