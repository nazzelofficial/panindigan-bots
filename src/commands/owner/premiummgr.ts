import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { PremiumModel, PremiumCodeModel } from "../../database/models/Premium.js";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
import { nanoid } from "../../utils/nanoid.js";

const TIERS = ["basic", "standard", "gold", "enterprise"];
const TIER_LABELS: Record<string, string> = { basic: "Basic ⭐", standard: "Standard ⭐⭐", gold: "Gold 🥇", enterprise: "Enterprise 🏆" };

const command: CommandDefinition = {
  name: "premiummgr",
  description: "Manage server premium tiers and generate codes (owner only)",
  category: "Owner",
  access: "owner",
  guildOnly: false,
  cooldown: 3,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("grant")
          .setDescription("Grant premium to a guild")
          .addStringOption((o) => o.setName("guildid").setDescription("Guild ID").setRequired(true))
          .addStringOption((o) => o.setName("tier").setDescription("Tier").setRequired(true)
            .addChoices(...TIERS.map((t) => ({ name: t, value: t })))),
      )
      .addSubcommand((s) =>
        s.setName("revoke")
          .setDescription("Remove premium from a guild")
          .addStringOption((o) => o.setName("guildid").setDescription("Guild ID").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("status")
          .setDescription("Check premium status of a guild")
          .addStringOption((o) => o.setName("guildid").setDescription("Guild ID").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("generatecode")
          .setDescription("Generate a one-time premium activation code")
          .addStringOption((o) => o.setName("tier").setDescription("Tier for this code").setRequired(true)
            .addChoices(...TIERS.map((t) => ({ name: t, value: t }))))
          .addIntegerOption((o) => o.setName("count").setDescription("How many codes to generate").setRequired(false).setMinValue(1).setMaxValue(20)),
      )
      .addSubcommand((s) => s.setName("listcodes").setDescription("List unused premium codes")),

  async execute(ctx) {
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "grant") {
      const guildId = ctx.isSlash ? ctx.interaction!.options.getString("guildid", true) : ctx.args[1];
      const tier = ctx.isSlash ? ctx.interaction!.options.getString("tier", true) : ctx.args[2];
      if (!guildId || !TIERS.includes(tier)) { await ctx.reply({ embeds: [errorEmbed("Provide valid guild ID and tier.")] }); return; }
      await PremiumModel.findOneAndUpdate(
        { guildId },
        { $set: { tier, active: true, grantedBy: ctx.userId, grantedAt: new Date() } },
        { upsert: true },
      );
      await ctx.reply({ embeds: [successEmbed(`✅ **${TIER_LABELS[tier]}** granted to guild \`${guildId}\`.`)] });
    } else if (sub === "revoke") {
      const guildId = ctx.isSlash ? ctx.interaction!.options.getString("guildid", true) : ctx.args[1];
      if (!guildId) { await ctx.reply({ embeds: [errorEmbed("Provide guild ID.")] }); return; }
      await PremiumModel.findOneAndUpdate({ guildId }, { $set: { active: false, tier: "free" } });
      await ctx.reply({ embeds: [successEmbed(`Premium revoked from guild \`${guildId}\`.`)] });
    } else if (sub === "status") {
      const guildId = ctx.isSlash ? ctx.interaction!.options.getString("guildid", true) : ctx.args[1];
      if (!guildId) { await ctx.reply({ embeds: [errorEmbed("Provide guild ID.")] }); return; }
      const prem = await PremiumModel.findOne({ guildId }).lean();
      const guild = ctx.client.guilds.cache.get(guildId);
      if (!prem || !(prem as any).active) {
        await ctx.reply({ embeds: [infoEmbed(`Guild \`${guildId}\`${guild ? ` (${guild.name})` : ""} — **Free** tier.`)] });
      } else {
        const embed = baseEmbed("warning")
          .setTitle(`⭐ Premium Status — ${guild?.name ?? guildId}`)
          .addFields(
            { name: "Tier", value: TIER_LABELS[(prem as any).tier] ?? (prem as any).tier, inline: true },
            { name: "Active", value: "✅", inline: true },
            { name: "Granted by", value: (prem as any).grantedBy ? `<@${(prem as any).grantedBy}>` : "Code activation", inline: true },
          );
        await ctx.reply({ embeds: [embed] });
      }
    } else if (sub === "generatecode") {
      const tier = ctx.isSlash ? ctx.interaction!.options.getString("tier", true) : ctx.args[1];
      const count = ctx.isSlash ? ctx.interaction!.options.getInteger("count") ?? 1 : 1;
      if (!tier || !TIERS.includes(tier)) { await ctx.reply({ embeds: [errorEmbed("Provide valid tier.")] }); return; }
      const codes: string[] = [];
      for (let i = 0; i < count; i++) {
        const code = `PAN-${tier.toUpperCase().slice(0, 3)}-${nanoid(8).toUpperCase()}`;
        await PremiumCodeModel.create({ code, tier: tier as any, createdBy: ctx.userId });
        codes.push(code);
      }
      const embed = baseEmbed("success")
        .setTitle(`✨ Generated ${count} Premium Code${count !== 1 ? "s" : ""} (${TIER_LABELS[tier]})`)
        .setDescription(codes.map((c) => `\`${c}\``).join("\n"))
        .setFooter({ text: "Each code is single-use. Share securely!" });
      await ctx.reply({ embeds: [embed] });
    } else if (sub === "listcodes") {
      const codes = await PremiumCodeModel.find({ used: false }).lean().limit(20);
      if (!codes.length) { await ctx.reply({ embeds: [infoEmbed("No unused premium codes.")] }); return; }
      const embed = baseEmbed("primary")
        .setTitle("🔑 Unused Premium Codes")
        .setDescription(codes.map((c) => `\`${c.code}\` — ${TIER_LABELS[c.tier] ?? c.tier}`).join("\n").slice(0, 4000))
        .setFooter({ text: `${codes.length} unused code(s)` });
      await ctx.reply({ embeds: [embed] });
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: grant | revoke | status | generatecode | listcodes")] });
    }
  },
};

export default command;
