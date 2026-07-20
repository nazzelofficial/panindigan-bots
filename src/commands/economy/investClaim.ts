import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "invest_claim",
  description: "Claim investment returns",
  category: "Economy",
  access: "general",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const user = await UserModel.findOneAndUpdate(
      { userId: ctx.userId },
      { $setOnInsert: { userId: ctx.userId } },
      { upsert: true, new: true }
    );
    let profile = user.guilds.find((g: any) => g.guildId === guild.id);
    if (!profile) {
      user.guilds.push({ guildId: guild.id } as any);
      await user.save();
      profile = user.guilds[user.guilds.length - 1];
    }

    if (!(profile as any).investmentAmount) {
      return ctx.reply({ embeds: [errorEmbed("❌ You have no active investments")] });
    }

    const returnAmount = (profile as any).investmentReturn || 0;

    (profile as any).balance = ((profile as any).balance ?? 0) + returnAmount;
    (profile as any).investmentAmount = 0;
    (profile as any).investmentReturn = 0;
    (profile as any).investmentType = null;
    await user.save();

    await ctx.reply({ embeds: [successEmbed(`✅ Claimed ${returnAmount} coins from your investment!`)] });
  },
};
export default command;
