import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "verifytoggle",
  description: "Enable or disable the verification system",
  category: "Verification",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable verification").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
    if (enabled) {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      if (!(cfg as any)?.verification?.roleId && !(cfg as any)?.verifiedRoleId) {
        await ctx.reply({ embeds: [errorEmbed("Set a verified role first using `verifyrole` or `verifysetup`.")] }); return;
      }
    }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.enabled": enabled } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`Verification **${enabled ? "enabled" : "disabled"}**.`)] });
  },
};
export default command;
