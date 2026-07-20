import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";

const command: CommandDefinition = {
  name: "modrole_set",
  description: "Set the moderator role",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addRoleOption((o) => o.setName("role").setDescription("Moderator role").setRequired(true)),
  async execute(ctx) {
    const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : null;
    if (!role) return;

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { modRoleIds: [role.id] },
      { upsert: true }
    );

    await ctx.reply({ content: `✅ Set moderator role to ${role.name}` });
  },
};
export default command;
