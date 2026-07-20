import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "goodbye variables",
  description: "View available goodbye message variables",
  category: "Goodbye",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 5,
  slashData: (b) => (b as SlashCommandBuilder),
  async execute(ctx) {
    const embed = successEmbed("Goodbye Message Variables")
      .setDescription("Use these variables in your goodbye message:")
      .addFields(
        { name: "User Variables", value: "`{user}` - User mention\n`{mention}` - Same as {user}\n`{username}` - Username\n`{displayname}` - Display name\n`{avatar}` - Avatar URL", inline: true },
        { name: "Server Variables", value: "`{server}` - Server name\n`{membercount}` - Member count\n`{icon}` - Server icon URL", inline: true },
        { name: "Date Variables", value: "`{leavetime}` - Leave time\n`{joindate}` - Join date", inline: true },
      );
    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
