import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "boostmessage",
  description: "Set the boost message. Placeholders: {user}, {mention}, {server}, {boostCount}",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("set").setDescription("Set the boost message")
          .addStringOption((o) => o.setName("message").setDescription("Boost message (supports {user}, {mention}, {server})").setRequired(true).setMaxLength(1000)),
      )
      .addSubcommand((s) => s.setName("view").setDescription("View the current boost message"))
      .addSubcommand((s) => s.setName("reset").setDescription("Reset to the default boost message")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
    if (sub === "set") {
      const msg = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.slice(1).join(" ");
      if (!msg) { await ctx.reply({ embeds: [errorEmbed("Please provide a message.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "boostMessage.message": msg } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Boost message updated.\n\nPreview:\n> ${msg.replace("{user}", guild.name).replace("{mention}", "@Member").replace("{server}", guild.name)}`)] });
    } else if (sub === "view") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const msg = (cfg as any)?.boostMessage?.message ?? "🎉 {mention} just boosted the server! Thank you!";
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🚀 Boost Message").setDescription(msg)] });
    } else {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "boostMessage.message": "🎉 {mention} just boosted the server! Thank you!" } });
      await ctx.reply({ embeds: [successEmbed("Boost message reset to default.")] });
    }
  },
};
export default command;
