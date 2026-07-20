import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { BlacklistModel } from "../../database/models/Moderation.js";
import { successEmbed, errorEmbed, baseEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "blacklist",
  description: "Blacklist a user or guild from using the bot",
  category: "Owner",
  access: "owner",
  guildOnly: false,
  cooldown: 3,
  aliases: ["bl"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s
          .setName("add")
          .setDescription("Add a user or guild to the blacklist")
          .addStringOption((o) => o.setName("id").setDescription("User or Guild ID").setRequired(true))
          .addStringOption((o) =>
            o
              .setName("type")
              .setDescription("user or server")
              .setRequired(true)
              .addChoices({ name: "user", value: "user" }, { name: "server", value: "server" }),
          )
          .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s
          .setName("remove")
          .setDescription("Remove a user or guild from the blacklist")
          .addStringOption((o) => o.setName("id").setDescription("User or Guild ID").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("List all blacklisted entries")),

  async execute(ctx) {
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "add") {
      const id = ctx.isSlash ? ctx.interaction!.options.getString("id", true) : ctx.args[1];
      const entityType = ctx.isSlash
        ? (ctx.interaction!.options.getString("type", true) as "user" | "server")
        : (ctx.args[2]?.toLowerCase() as "user" | "server");
      const reason = ctx.isSlash
        ? ctx.interaction!.options.getString("reason") ?? "No reason provided"
        : ctx.args.slice(3).join(" ") || "No reason provided";

      if (!id || !["user", "server"].includes(entityType)) {
        await ctx.reply({ embeds: [errorEmbed("Usage: `blacklist add <id> <user|server> [reason]`")] });
        return;
      }

      const existing = await BlacklistModel.findOne({ entityId: id, entityType });
      if (existing) {
        await ctx.reply({ embeds: [errorEmbed(`\`${id}\` is already blacklisted.`)] });
        return;
      }

      await BlacklistModel.create({ entityId: id, entityType, reason, moderatorId: ctx.userId });

      if (entityType === "server") {
        const guild = ctx.client.guilds.cache.get(id);
        if (guild) await guild.leave().catch(() => {});
      }

      await ctx.reply({ embeds: [successEmbed(`\`${id}\` (${entityType}) has been blacklisted. Reason: ${reason}`)] });
    } else if (sub === "remove") {
      const id = ctx.isSlash ? ctx.interaction!.options.getString("id", true) : ctx.args[1];
      if (!id) {
        await ctx.reply({ embeds: [errorEmbed("Provide an ID to remove.")] });
        return;
      }
      const deleted = await BlacklistModel.findOneAndDelete({ entityId: id });
      if (!deleted) {
        await ctx.reply({ embeds: [errorEmbed(`\`${id}\` is not in the blacklist.`)] });
        return;
      }
      await ctx.reply({ embeds: [successEmbed(`\`${id}\` has been removed from the blacklist.`)] });
    } else if (sub === "list") {
      const entries = await BlacklistModel.find({}).lean().limit(50);
      if (!entries.length) {
        await ctx.reply({ embeds: [infoEmbed("The blacklist is empty.")] });
        return;
      }
      const embed = baseEmbed("danger")
        .setTitle("🚫 Blacklisted Entries")
        .setDescription(
          entries
            .map((e) => `**${e.entityType === "user" ? "👤" : "🏠"} \`${e.entityId}\`** — ${e.reason} (by <@${e.moderatorId}>)`)
            .join("\n")
            .slice(0, 4000),
        )
        .setFooter({ text: `${entries.length} entries` });
      await ctx.reply({ embeds: [embed] });
    } else {
      await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: add | remove | list")] });
    }
  },
};

export default command;
