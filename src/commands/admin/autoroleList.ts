import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";

const command: CommandDefinition = {
  name: "autorole_list",
  description: "List all auto roles",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const config = await GuildModel.findOne({ guildId: guild.id });
    const autoRoleIds = config?.autoRoleIds || [];

    if (autoRoleIds.length === 0) {
      return ctx.reply({ content: "❌ No auto roles configured" });
    }

    const roleNames = autoRoleIds
      .map((roleId: string) => {
        const role = guild.roles.cache.get(roleId);
        return role ? role.name : roleId;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("🎭 Auto Roles")
      .setColor("#00ff00")
      .setDescription(roleNames)
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
