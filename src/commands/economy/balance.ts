import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";

const command: CommandDefinition = {
  name: "balance",
  description: "View your or another user's coin balance",
  category: "Economy",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["bal", "coins", "wallet"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const target = ctx.isSlash
      ? ctx.interaction!.options.getUser("user") ?? ctx.interaction!.user
      : ctx.args[0]
        ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null)
        : await ctx.client.users.fetch(ctx.userId);

    if (!target) { await ctx.reply({ embeds: [EmbedFactory.error("User not found.")] }); return; }

    const doc = await UserModel.findOne({ userId: target.id }).lean();
    const guildData = (doc as any)?.guilds?.find((g: any) => g.guildId === guild.id) ?? {};
    const wallet: number = guildData.balance ?? 0;
    const bank: number = guildData.bank ?? 0;

    const embed = EmbedFactory.dashboard(
      `👛 Wallet: **${wallet.toLocaleString()}**\n🏦 Bank: **${bank.toLocaleString()}**\n💎 Net Worth: **${(wallet + bank).toLocaleString()}**`,
      `💰 Balance — ${target.username}`,
    ).setThumbnail(target.displayAvatarURL());
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
