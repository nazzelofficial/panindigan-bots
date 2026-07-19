import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "slots",
  description: "Play slots",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("bet").setDescription("Bet amount").setRequired(true).setMinValue(10)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const bet = ctx.isSlash ? ctx.interaction!.options.getInteger("bet", true) : parseInt(ctx.args[0]);
    if (!bet) return;

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

    if ((profile as any).balance < bet) {
      return ctx.reply({ embeds: [errorEmbed("❌ Insufficient balance")] });
    }

    const symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      multiplier = result[0] === "7️⃣" ? 10 : result[0] === "💎" ? 5 : 3;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      multiplier = 1.5;
    }

    const winnings = Math.floor(bet * multiplier);

    (profile as any).balance = ((profile as any).balance ?? 0) - bet + winnings;
    await user.save();

    const display = result.join(" ");
    if (multiplier > 0) {
      await ctx.reply({ embeds: [successEmbed(`🎰 ${display}\n🎉 You won ${winnings} coins!`)] });
    } else {
      await ctx.reply({ embeds: [errorEmbed(`🎰 ${display}\n😢 You lost ${bet} coins`)] });
    }
  },
};
export default command;
