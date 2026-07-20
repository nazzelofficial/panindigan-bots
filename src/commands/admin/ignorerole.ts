import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "ignorerole",
  description: "Prevent all members with a role from using bot commands",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addRoleOption((o) =>
        o.setName("role").setDescription("Role to ignore").setRequired(true),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const roleId = ctx.isSlash
      ? ctx.interaction!.options.getRole("role", true).id
      : ctx.args[0]?.replace(/\D/g, "");

    if (!roleId) {
      await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
      return;
    }

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $addToSet: { ignoredRoles: roleId } },
      { upsert: true },
    );

    await ctx.reply({ embeds: [successEmbed(`Members with <@&${roleId}> are now ignored — they cannot use bot commands.`)] });
  },
};

export default command;
