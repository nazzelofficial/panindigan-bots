import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";

const command: CommandDefinition = {
  name: "autorole_remove",
  description: "Remove an auto role",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
  async execute(ctx) {
    const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : null;
    if (!role) return;

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const config = await GuildModel.findOne({ guildId: guild.id });
    const autoRoleIds = config?.autoRoleIds || [];

    if (!autoRoleIds.includes(role.id)) {
      return ctx.reply({ content: "❌ Role is not an auto role" });
    }

    const newAutoRoleIds = autoRoleIds.filter((id: string) => id !== role.id);
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { autoRoleIds: newAutoRoleIds },
      { upsert: true }
    );

    await ctx.reply({ content: `✅ Removed ${role.name} from auto roles` });
  },
};
export default command;
