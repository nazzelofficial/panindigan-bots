import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { baseEmbed, successEmbed, errorEmbed } from "@/utils/embeds";
import { config } from "@/config/config";

const command: CommandDefinition = {
  name: "prestige",
  description: "Reset your XP at max level to gain a prestige rank",
  category: "Leveling",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const requiredLevel: number = (config as any).leveling?.prestigeRequiredLevel ?? 100;

    const user = await UserModel.findOne({ userId: ctx.userId });
    if (!user) { await ctx.reply({ embeds: [errorEmbed("No leveling data found.")] }); return; }

    let profile = user.guilds.find((g: any) => g.guildId === guild.id);
    if (!profile) { await ctx.reply({ embeds: [errorEmbed("You have no XP in this server yet.")] }); return; }

    if ((profile as any).level < requiredLevel) {
      await ctx.reply({ embeds: [errorEmbed(`You need to reach **Level ${requiredLevel}** before prestiging. You are currently Level **${(profile as any).level}**.`)] });
      return;
    }

    const currentPrestige: number = (profile as any).prestige ?? 0;
    (profile as any).prestige = currentPrestige + 1;
    (profile as any).xp = 0;
    (profile as any).level = 0;

    await user.save();

    const embed = baseEmbed("warning")
      .setTitle("✨ Prestige Unlocked!")
      .setDescription(
        `Congratulations <@${ctx.userId}>!\nYou've reached **Prestige ${currentPrestige + 1}**!\n\nYour XP and level have been reset. Keep grinding!`,
      )
      .setFooter({ text: `Prestige ${currentPrestige} → Prestige ${currentPrestige + 1}` });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
