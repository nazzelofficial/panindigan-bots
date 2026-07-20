import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "afk",
  description: "Set or clear your AFK status",
  category: "Utility",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("reason").setDescription("AFK reason (optional)").setRequired(false)),
  async execute(ctx) {
    const user = await UserModel.findOneAndUpdate(
      { userId: ctx.userId },
      { $setOnInsert: { userId: ctx.userId } },
      { upsert: true, new: true },
    );

    if (user.afk?.active) {
      user.afk.active = false;
      user.afk.reason = null as any;
      user.afk.since = null as any;
      await user.save();
      await ctx.reply({ embeds: [successEmbed("Welcome back! Your AFK status has been cleared.")] });
    } else {
      const reason = ctx.isSlash
        ? ctx.interaction!.options.getString("reason") ?? "AFK"
        : ctx.args.join(" ") || "AFK";
      user.afk = { active: true, reason, since: new Date() } as any;
      await user.save();
      await ctx.reply({ embeds: [infoEmbed(`You are now AFK: **${reason}**`)] });
    }
  },
};

export default command;
