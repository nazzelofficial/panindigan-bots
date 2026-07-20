import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";

// In-memory snipe cache: channelId -> { content, author, timestamp }[]
export const snipeCache = new Map<string, Array<{ content: string; authorTag: string; authorId: string; timestamp: number }>>();
export const editSnipeCache = new Map<string, Array<{ oldContent: string; newContent: string; authorTag: string; authorId: string; timestamp: number }>>();

const MAX_CACHE = 10;

export function cacheDeletedMessage(channelId: string, content: string, authorTag: string, authorId: string): void {
  const cache = snipeCache.get(channelId) ?? [];
  cache.unshift({ content, authorTag, authorId, timestamp: Date.now() });
  snipeCache.set(channelId, cache.slice(0, MAX_CACHE));
}

export function cacheEditedMessage(channelId: string, oldContent: string, newContent: string, authorTag: string, authorId: string): void {
  const cache = editSnipeCache.get(channelId) ?? [];
  cache.unshift({ oldContent, newContent, authorTag, authorId, timestamp: Date.now() });
  editSnipeCache.set(channelId, cache.slice(0, MAX_CACHE));
}

const command: CommandDefinition = {
  name: "snipe",
  description: "Retrieve recently deleted or edited messages in this channel",
  category: "Utility",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["sn"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) =>
        o.setName("type").setDescription("deleted or edited").setRequired(false)
          .addChoices({ name: "deleted", value: "deleted" }, { name: "edited", value: "edited" }),
      )
      .addIntegerOption((o) => o.setName("index").setDescription("Which snipe (1-10, default 1)").setRequired(false).setMinValue(1).setMaxValue(10)),

  async execute(ctx) {
    const channelId = ctx.interaction?.channelId ?? ctx.message?.channelId;
    if (!channelId) return;

    const type = (ctx.isSlash ? ctx.interaction!.options.getString("type") : ctx.args[0]) ?? "deleted";
    const index = Math.max(1, ctx.isSlash ? (ctx.interaction!.options.getInteger("index") ?? 1) : (parseInt(ctx.args[1] ?? "1") || 1)) - 1;

    if (type === "edited") {
      const cache = editSnipeCache.get(channelId) ?? [];
      const entry = cache[index];
      if (!entry) { await ctx.reply({ embeds: [infoEmbed("No recently edited messages found.")] }); return; }
      const embed = baseEmbed("info")
        .setTitle(`✏️ Edited Message Snipe #${index + 1}`)
        .addFields(
          { name: "Author", value: `${entry.authorTag} (<@${entry.authorId}>)`, inline: true },
          { name: "Time", value: `<t:${Math.floor(entry.timestamp / 1000)}:R>`, inline: true },
          { name: "Before", value: entry.oldContent.slice(0, 1000) || "*(empty)*", inline: false },
          { name: "After", value: entry.newContent.slice(0, 1000) || "*(empty)*", inline: false },
        );
      await ctx.reply({ embeds: [embed] });
    } else {
      const cache = snipeCache.get(channelId) ?? [];
      const entry = cache[index];
      if (!entry) { await ctx.reply({ embeds: [infoEmbed("No recently deleted messages found.")] }); return; }
      const embed = baseEmbed("danger")
        .setTitle(`🗑️ Deleted Message Snipe #${index + 1}`)
        .setDescription(entry.content.slice(0, 4000) || "*(no text content)*")
        .addFields(
          { name: "Author", value: `${entry.authorTag} (<@${entry.authorId}>)`, inline: true },
          { name: "Time", value: `<t:${Math.floor(entry.timestamp / 1000)}:R>`, inline: true },
        );
      await ctx.reply({ embeds: [embed] });
    }
  },
};

export default command;
