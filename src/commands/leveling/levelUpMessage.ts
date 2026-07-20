import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "levelupmessage",
  description: "Set the level-up message. Placeholders: {mention}, {user}, {level}, {server}",
  category: "Leveling",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["levelupmsg"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("set").setDescription("Set the level-up message")
          .addStringOption((o) => o.setName("message").setDescription("Level-up message (supports {mention}, {user}, {level}, {server})").setRequired(true).setMaxLength(500)),
      )
      .addSubcommand((s) => s.setName("view").setDescription("View the current level-up message"))
      .addSubcommand((s) => s.setName("reset").setDescription("Reset to the default level-up message")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "view");
    if (sub === "set") {
      const msg = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.slice(1).join(" ");
      if (!msg) { await ctx.reply({ embeds: [errorEmbed("Please provide a message.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "leveling.announceMessage": msg } }, { upsert: true });
      const preview = msg.replace("{mention}", "@Member").replace("{user}", "Member").replace("{level}", "5").replace("{server}", guild.name);
      await ctx.reply({ embeds: [successEmbed(`Level-up message updated.\n\nPreview:\n> ${preview}`)] });
    } else if (sub === "view") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const msg = (cfg as any)?.leveling?.announceMessage ?? "🎉 GG {mention}, you've reached level **{level}**!";
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle("⬆️ Level-Up Message").setDescription(msg).addFields({ name: "Placeholders", value: "`{mention}` `{user}` `{level}` `{server}`" })] });
    } else {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "leveling.announceMessage": "🎉 GG {mention}, you've reached level **{level}**!" } });
      await ctx.reply({ embeds: [successEmbed("Level-up message reset to default.")] });
    }
  },
};
export default command;
