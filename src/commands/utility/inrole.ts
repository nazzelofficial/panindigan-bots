import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "inrole",
  description: "View all members na may specific role",
  category: "Utility",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  aliases: ["memberswithrole", "roleusers"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addRoleOption((o) => o.setName("role").setDescription("Role na titingnan").setRequired(true))
      .addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const roleId = ctx.isSlash
      ? ctx.interaction!.options.getRole("role", true).id
      : ctx.args[0]?.replace(/\D/g, "");

    if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a role.")] }); return; }

    const role = guild.roles.cache.get(roleId);
    if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }

    if (ctx.isSlash) await ctx.interaction!.deferReply();

    await guild.members.fetch();
    const members = guild.members.cache.filter((m) => m.roles.cache.has(role.id));

    if (!members.size) {
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle(`🏷️ Members with ${role.name}`).setDescription("No members have this role.")] });
      return;
    }

    const PER_PAGE = 20;
    const page = (ctx.isSlash ? (ctx.interaction!.options.getInteger("page") ?? 1) : (parseInt(ctx.args[1]) || 1));
    const total = members.size;
    const pages = Math.ceil(total / PER_PAGE);
    const start = (page - 1) * PER_PAGE;
    const entries = [...members.values()].slice(start, start + PER_PAGE);

    const embed = baseEmbed("primary")
      .setColor(role.color || 0x5865f2)
      .setTitle(`🏷️ Members with ${role.name}`)
      .setDescription(entries.map((m, i) => `${start + i + 1}. ${m.user.username} (\`${m.id}\`)`).join("\n"))
      .setFooter({ text: `Page ${page}/${pages} · ${total} total member${total !== 1 ? "s" : ""}` });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
