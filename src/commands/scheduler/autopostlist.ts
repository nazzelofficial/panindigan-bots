import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "autopostlist",
  description: "List all auto-posts",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const autoPosts = (cfg as any)?.autoPosts ?? [];

    if (!autoPosts.length) {
      await ctx.reply({ embeds: [infoEmbed("No auto-posts configured.")] });
      return;
    }

    const embed = baseEmbed("primary")
      .setTitle("📝 Auto-Posts")
      .setDescription(autoPosts.map((p: any) => `**${p.id}** — ${p.interval} in <#${p.channelId}>`).join("\n"))
      .setFooter({ text: `${autoPosts.length} auto-post(s) configured` });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
