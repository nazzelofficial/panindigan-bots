import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { randomUUID } from "node:crypto";

const command: CommandDefinition = {
  name: "customcommandadd",
  description: "Create a custom command that responds with a set message when triggered",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["addcustomcmd", "ccadd"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("name").setDescription("Command trigger name (no spaces)").setRequired(true).setMaxLength(32))
      .addStringOption((o) => o.setName("response").setDescription("Response message (supports {user}, {server}, {memberCount})").setRequired(true).setMaxLength(2000)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const name = (ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[0])?.toLowerCase().replace(/\s+/g, "");
    const response = ctx.isSlash ? ctx.interaction!.options.getString("response", true) : ctx.args.slice(1).join(" ");
    if (!name || !response) { await ctx.reply({ embeds: [errorEmbed("Provide both a command name and a response.")] }); return; }
    if (!/^[a-z0-9_-]+$/.test(name)) { await ctx.reply({ embeds: [errorEmbed("Command name can only contain letters, numbers, underscores, and hyphens.")] }); return; }
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const existing = (cfg as any)?.customCommands ?? [];
    if (existing.some((c: any) => c.name === name)) {
      await ctx.reply({ embeds: [errorEmbed(`A custom command named \`${name}\` already exists. Remove it first.`)] }); return;
    }
    if (existing.length >= 100) { await ctx.reply({ embeds: [errorEmbed("Maximum of 100 custom commands reached.")] }); return; }
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $push: { customCommands: { id: randomUUID(), name, response, createdBy: ctx.userId, createdAt: new Date() } } },
      { upsert: true },
    );
    await ctx.reply({ embeds: [successEmbed(`Custom command \`${name}\` created. Members can trigger it with your server prefix + \`${name}\`.`)] });
  },
};
export default command;
