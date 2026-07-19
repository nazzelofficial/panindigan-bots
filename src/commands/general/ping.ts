import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";
import { isDatabaseConnected } from "@/database/connection";

const command: CommandDefinition = {
  name: "ping",
  description: "Check bot latency — WebSocket ping, roundtrip, and database status",
  category: "Utility",
  access: "general",
  guildOnly: false,
  cooldown: 3,
  async execute(ctx) {
    const start = Date.now();
    const sent = await ctx.reply({ embeds: [baseEmbed("info").setDescription("🏓 Pinging...")] });
    const roundTrip = Date.now() - start;
    const wsPing = ctx.client.ws.ping;

    const embed = baseEmbed("primary")
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "Roundtrip Latency", value: `${roundTrip}ms`, inline: true },
        { name: "WebSocket Latency", value: `${wsPing < 0 ? "calculating..." : `${wsPing}ms`}`, inline: true },
        { name: "Database", value: isDatabaseConnected() ? "🟢 Connected" : "🔴 Disconnected", inline: true },
      );

    if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [embed] });
    else await sent.edit({ embeds: [embed] });
  },
};

export default command;
