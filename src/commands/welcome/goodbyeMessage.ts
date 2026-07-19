import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "goodbyemessage",
  description: "Set the goodbye message. Placeholders: {user}, {server}, {memberCount}",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["leavemessage"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("set").setDescription("Set the goodbye message")
          .addStringOption((o) => o.setName("message").setDescription("Goodbye message (supports {user}, {server}, {memberCount})").setRequired(true).setMaxLength(1000)),
      )
      .addSubcommand((s) => s.setName("view").setDescription("View current goodbye message"))
      .addSubcommand((s) => s.setName("reset").setDescription("Reset to default goodbye message")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
    if (sub === "set") {
      const msg = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.slice(1).join(" ");
      if (!msg) { await ctx.reply({ embeds: [errorEmbed("Please provide a message.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.message": msg } }, { upsert: true });
      const preview = msg.replace("{user}", "SomeUser#0000").replace("{server}", guild.name).replace("{memberCount}", guild.memberCount.toString());
      await ctx.reply({ embeds: [successEmbed(`Goodbye message updated.\n\nPreview:\n> ${preview}`)] });
    } else if (sub === "view") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const msg = (cfg as any)?.goodbye?.message ?? "{user} has left {server}. We now have {memberCount} members.";
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle("👋 Goodbye Message").setDescription(msg).addFields({ name: "Placeholders", value: "`{user}` `{server}` `{memberCount}`", inline: false })] });
    } else {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.message": "{user} has left {server}. We now have {memberCount} members." } });
      await ctx.reply({ embeds: [successEmbed("Goodbye message reset to default.")] });
    }
  },
};
export default command;
