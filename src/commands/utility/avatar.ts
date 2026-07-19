import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "avatar",
  description: "Get a user's avatar in full resolution",
  category: "Utility",
  access: "general",
  guildOnly: false,
  cooldown: 5,
  aliases: ["av", "pfp", "icon"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("User (default: you)").setRequired(false))
      .addStringOption((o) =>
        o.setName("type").setDescription("Avatar type").setRequired(false)
          .addChoices({ name: "global", value: "global" }, { name: "server", value: "server" }),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    const target = ctx.isSlash
      ? ctx.interaction!.options.getUser("user") ?? ctx.interaction!.user
      : ctx.args[0]
        ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null)
        : await ctx.client.users.fetch(ctx.userId);

    if (!target) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }

    const type = ctx.isSlash ? ctx.interaction!.options.getString("type") ?? "global" : "global";
    const formats = ["png", "jpg", "webp", "gif"];

    let avatarUrl: string | null = null;
    if (type === "server" && guild) {
      const member = await guild.members.fetch(target.id).catch(() => null);
      avatarUrl = member?.displayAvatarURL({ size: 4096 }) ?? target.displayAvatarURL({ size: 4096 });
    } else {
      avatarUrl = target.displayAvatarURL({ size: 4096 });
    }

    const links = formats
      .map((f) => `[${f.toUpperCase()}](${target.displayAvatarURL({ extension: f as any, size: 4096 })})`)
      .join(" · ");

    const embed = baseEmbed("primary")
      .setTitle(`🖼️ ${target.username}'s Avatar`)
      .setDescription(links)
      .setImage(avatarUrl);

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
