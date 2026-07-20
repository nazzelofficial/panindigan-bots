import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "coinflip",
  description: "Flip a coin",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("bet").setDescription("Bet amount").setRequired(true).setMinValue(10))
      .addStringOption((o) =>
        o.setName("choice").setDescription("Heads or tails").setRequired(true).addChoices(
          { name: "Heads", value: "heads" },
          { name: "Tails", value: "tails" }
        )
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const bet = ctx.isSlash ? ctx.interaction!.options.getInteger("bet", true) : parseInt(ctx.args[0]);
    const choice = ctx.isSlash ? ctx.interaction!.options.getString("choice", true) : ctx.args[1]?.toLowerCase();
    if (!bet || !choice) return;

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

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = choice === result;
    const winnings = won ? bet : 0;

    (profile as any).balance = ((profile as any).balance ?? 0) - bet + winnings;
    await user.save();

    const emoji = { heads: "🪙", tails: "🪙" };
    if (won) {
      await ctx.reply({ embeds: [successEmbed(`${emoji[result]} ${result.toUpperCase()}\n🎉 You won ${winnings} coins!`)] });
    } else {
      await ctx.reply({ embeds: [errorEmbed(`${emoji[result]} ${result.toUpperCase()}\n😢 You lost ${bet} coins`)] });
    }
  },
};
export default command;
