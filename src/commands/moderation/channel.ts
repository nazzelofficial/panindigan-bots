import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "channel",
  description: "Manage channels — create, delete, rename, topic, clone, slowmode, NSFW toggle, and info",
  category: "Moderation",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("create").setDescription("Create a new channel (text, voice, or announcement)")
          .addStringOption((o) => o.setName("name").setDescription("Channel name").setRequired(true))
          .addStringOption((o) =>
            o.setName("type").setDescription("Channel type").setRequired(false)
              .addChoices({ name: "Text", value: "text" }, { name: "Voice", value: "voice" }, { name: "Announcement", value: "news" }),
          )
          .addStringOption((o) => o.setName("topic").setDescription("Channel topic").setRequired(false))
          .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("delete").setDescription("Delete a channel from the server")
          .addChannelOption((o) => o.setName("channel").setDescription("Channel to delete").setRequired(false))
          .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("rename").setDescription("Rename a channel")
          .addStringOption((o) => o.setName("name").setDescription("New channel name").setRequired(true))
          .addChannelOption((o) => o.setName("channel").setDescription("Target channel (defaults to current)").setRequired(false))
          .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("topic").setDescription("Set or clear the topic of a text channel")
          .addStringOption((o) => o.setName("topic").setDescription("New topic (leave blank to clear)").setRequired(false))
          .addChannelOption((o) => o.setName("channel").setDescription("Target channel (defaults to current)").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("clone").setDescription("Clone a channel with the same permissions and settings")
          .addChannelOption((o) => o.setName("channel").setDescription("Channel to clone (defaults to current)").setRequired(false))
          .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("nsfw").setDescription("Toggle the NSFW flag on a text channel")
          .addChannelOption((o) => o.setName("channel").setDescription("Target channel (defaults to current)").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("info").setDescription("View detailed information about a channel")
          .addChannelOption((o) => o.setName("channel").setDescription("Target channel (defaults to current)").setRequired(false)),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
    const reason = (ctx.isSlash ? ctx.interaction!.options.getString("reason") : null) ?? `Action by ${ctx.userId}`;

    const resolveChannel = (opt: string) => {
      if (!ctx.isSlash) return ctx.message?.channel;
      const ch = ctx.interaction!.options.getChannel(opt);
      return ch ? (guild.channels.cache.get((ch as any).id) ?? ctx.interaction!.channel) : ctx.interaction!.channel;
    };

    if (sub === "create") {
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[1];
      if (!name) { await ctx.reply({ embeds: [errorEmbed("Provide a pangalan ng channel.")] }); return; }
      const typeStr = ctx.isSlash ? (ctx.interaction!.options.getString("type") ?? "text") : "text";
      const topic = ctx.isSlash ? (ctx.interaction!.options.getString("topic") ?? undefined) : undefined;
      const type = typeStr === "voice" ? ChannelType.GuildVoice : typeStr === "news" ? ChannelType.GuildAnnouncement : ChannelType.GuildText;
      const ch = await guild.channels.create({ name, type, topic, reason });
      await ctx.reply({ embeds: [successEmbed(`Nagawa ang channel ${ch}.`)] });
      return;
    }

    if (sub === "delete") {
      const target = resolveChannel("channel");
      if (!target) { await ctx.reply({ embeds: [errorEmbed("Channel not found.")] }); return; }
      const name = (target as any).name ?? "channel";
      await (target as any).delete(reason);
      // Can't reply to deleted channel if it was the current one; try DM
      await ctx.userId && ctx.client.users.fetch(ctx.userId).then((u) => u.send({ embeds: [successEmbed(`Na-delete ang channel **#${name}**.`)] })).catch(() => {});
      if (target.id !== ctx.interaction?.channelId && target.id !== ctx.message?.channelId) {
        await ctx.reply({ embeds: [successEmbed(`Na-delete ang channel **#${name}**.`)] });
      }
      return;
    }

    if (sub === "rename") {
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[2];
      if (!name) { await ctx.reply({ embeds: [errorEmbed("Provide a bagong pangalan.")] }); return; }
      const target = resolveChannel("channel");
      if (!target) { await ctx.reply({ embeds: [errorEmbed("Channel not found.")] }); return; }
      await (target as any).setName(name, reason);
      await ctx.reply({ embeds: [successEmbed(`Pinalitan ng pangalan ang channel sa **#${name}**.`)] });
      return;
    }

    if (sub === "topic") {
      const topic = ctx.isSlash ? (ctx.interaction!.options.getString("topic") ?? "") : ctx.args.slice(1).join(" ");
      const target = resolveChannel("channel");
      if (!target || !(target as any).setTopic) { await ctx.reply({ embeds: [errorEmbed("Not a valid text channel.")] }); return; }
      await (target as any).setTopic(topic || null, reason);
      await ctx.reply({ embeds: [successEmbed(topic ? `Topic changed to: **${topic}**` : "Topic cleared.")] });
      return;
    }

    if (sub === "clone") {
      const target = resolveChannel("channel");
      if (!target) { await ctx.reply({ embeds: [errorEmbed("Channel not found.")] }); return; }
      const cloned = await (target as any).clone({ reason });
      await ctx.reply({ embeds: [successEmbed(`Channel cloned as ${cloned}.`)] });
      return;
    }

    if (sub === "nsfw") {
      const target = resolveChannel("channel");
      if (!target || !(target as any).setNSFW) { await ctx.reply({ embeds: [errorEmbed("Text channel lang ang maaring i-toggle ng NSFW.")] }); return; }
      const current = (target as any).nsfw ?? false;
      await (target as any).setNSFW(!current, reason);
      await ctx.reply({ embeds: [successEmbed(`NSFW for ${target} set to **${!current ? "ON" : "OFF"}**.`)] });
      return;
    }

    if (sub === "info") {
      const target = resolveChannel("channel") ?? ctx.interaction?.channel ?? ctx.message?.channel;
      if (!target) { await ctx.reply({ embeds: [errorEmbed("Channel not found.")] }); return; }
      const ch = target as any;
      const embed = baseEmbed("primary")
        .setTitle(`📋 Channel Info: #${ch.name ?? "unknown"}`)
        .addFields(
          { name: "ID", value: ch.id, inline: true },
          { name: "Type", value: ChannelType[ch.type] ?? String(ch.type), inline: true },
          { name: "Created", value: `<t:${Math.floor((ch.createdTimestamp ?? Date.now()) / 1000)}:R>`, inline: true },
        );
      if (ch.topic) embed.addFields({ name: "Topic", value: ch.topic, inline: false });
      if (ch.nsfw !== undefined) embed.addFields({ name: "NSFW", value: ch.nsfw ? "Yes" : "No", inline: true });
      if (ch.rateLimitPerUser !== undefined) embed.addFields({ name: "Slowmode", value: ch.rateLimitPerUser ? `${ch.rateLimitPerUser}s` : "Off", inline: true });
      if (ch.members) embed.addFields({ name: "Members", value: String(ch.members.size), inline: true });
      await ctx.reply({ embeds: [embed] });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: create | delete | rename | topic | clone | nsfw | info")] });
  },
};

export default command;
