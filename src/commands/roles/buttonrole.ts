import { PermissionFlagsBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { ButtonRolePanelModel as ButtonRoleModel } from "../../database/models/Community.js";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "buttonrole",
  description: "Create button-based role selectors",
  category: "Roles",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5,
  aliases: ["br"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("create")
          .setDescription("Create a button role panel")
          .addStringOption((o) => o.setName("title").setDescription("Panel title").setRequired(true))
          .addStringOption((o) => o.setName("description").setDescription("Panel description").setRequired(false))
          .addChannelOption((o) => o.setName("channel").setDescription("Channel to send panel (default: current)").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("addbutton")
          .setDescription("Add a button to an existing panel")
          .addStringOption((o) => o.setName("messageid").setDescription("Panel message ID").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("Role to assign").setRequired(true))
          .addStringOption((o) => o.setName("label").setDescription("Button label").setRequired(true))
          .addStringOption((o) => o.setName("emoji").setDescription("Button emoji").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("delete")
          .setDescription("Delete a button role panel")
          .addStringOption((o) => o.setName("messageid").setDescription("Panel message ID").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("List all button role panels")),

  registerComponents(client) {
    client.componentHandlers.set("buttonrole", async (interaction) => {
      if (!interaction.isButton()) return;
      const [, messageId, roleId] = interaction.customId.split(":");
      const guild = interaction.guild;
      if (!guild) return;
      const member = await guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return;

      const role = guild.roles.cache.get(roleId);
      if (!role) { await interaction.reply({ content: "Role not found.", ephemeral: true }); return; }

      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId, "Button role remove");
        await interaction.reply({ content: `✅ Removed **${role.name}** from your roles.`, ephemeral: true });
      } else {
        await member.roles.add(roleId, "Button role add");
        await interaction.reply({ content: `✅ Added **${role.name}** to your roles.`, ephemeral: true });
      }
    });
  },

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "create") {
      const title = ctx.isSlash ? ctx.interaction!.options.getString("title", true) : ctx.args.slice(1).join(" ");
      const description = ctx.isSlash ? ctx.interaction!.options.getString("description") ?? "" : "";
      const channel = ctx.isSlash
        ? (ctx.interaction!.options.getChannel("channel") ?? ctx.interaction!.channel)
        : ctx.message?.channel;
      if (!(channel as any)?.isTextBased?.()) { await ctx.reply({ embeds: [errorEmbed("Invalid channel.")] }); return; }

      const embed = baseEmbed("primary").setTitle(title).setDescription(description || "Click a button below to toggle your roles.");
      const msg = await (channel as any).send({ embeds: [embed], components: [] });
      await ButtonRoleModel.create({ guildId: guild.id, messageId: msg.id, channelId: (channel as any).id, title, buttons: [] });
      await ctx.reply({ embeds: [successEmbed(`Button role panel created in ${channel}! Use \`/buttonrole addbutton\` to add buttons.`)] });
    } else if (sub === "addbutton") {
      const messageId = ctx.isSlash ? ctx.interaction!.options.getString("messageid", true) : ctx.args[1];
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : guild.roles.cache.get(ctx.args[2]?.replace(/\D/g, "") ?? "");
      const label = ctx.isSlash ? ctx.interaction!.options.getString("label", true) : ctx.args[3];
      const emoji = ctx.isSlash ? ctx.interaction!.options.getString("emoji") : undefined;
      if (!messageId || !role || !label) { await ctx.reply({ embeds: [errorEmbed("Provide message ID, role, and label.")] }); return; }

      const panel = await ButtonRoleModel.findOne({ guildId: guild.id, messageId });
      if (!panel) { await ctx.reply({ embeds: [errorEmbed("Panel not found.")] }); return; }
      if (panel.buttons.length >= 25) { await ctx.reply({ embeds: [errorEmbed("Max 25 buttons per panel.")] }); return; }

      panel.buttons.push({ roleId: role.id, label, emoji: emoji ?? null } as any);
      await panel.save();

      // Rebuild buttons on the message
      const ch = guild.channels.cache.get(panel.channelId) as any;
      const msg = await ch?.messages.fetch(messageId).catch(() => null);
      if (!msg) { await ctx.reply({ embeds: [errorEmbed("Message not found.")] }); return; }

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      let row = new ActionRowBuilder<ButtonBuilder>();
      panel.buttons.forEach((btn: any, i: number) => {
        if (i > 0 && i % 5 === 0) { rows.push(row); row = new ActionRowBuilder<ButtonBuilder>(); }
        const b = new ButtonBuilder()
          .setCustomId(`buttonrole:${messageId}:${btn.roleId}`)
          .setLabel(btn.label)
          .setStyle(ButtonStyle.Primary);
        if (btn.emoji) b.setEmoji(btn.emoji);
        row.addComponents(b);
      });
      if (row.components.length) rows.push(row);

      await msg.edit({ components: rows.slice(0, 5) });
      await ctx.reply({ embeds: [successEmbed(`Button for **${role.name}** added to panel.`)] });
    } else if (sub === "delete") {
      const messageId = ctx.isSlash ? ctx.interaction!.options.getString("messageid", true) : ctx.args[1];
      const panel = await ButtonRoleModel.findOneAndDelete({ guildId: guild.id, messageId });
      if (!panel) { await ctx.reply({ embeds: [errorEmbed("Panel not found.")] }); return; }
      const ch = guild.channels.cache.get(panel.channelId) as any;
      const msg = await ch?.messages.fetch(messageId).catch(() => null);
      await msg?.delete().catch(() => {});
      await ctx.reply({ embeds: [successEmbed("Button role panel deleted.")] });
    } else if (sub === "list") {
      const panels = await ButtonRoleModel.find({ guildId: guild.id }).lean().limit(10);
      if (!panels.length) { await ctx.reply({ embeds: [infoEmbed("No button role panels.")] }); return; }
      const embed = baseEmbed("primary").setTitle("🔘 Button Role Panels").setDescription(
        panels.map((p) => `**${p.title}** — ${(p.buttons as any[]).length} button(s) · <#${p.channelId}> · \`${p.messageId}\``).join("\n"),
      );
      await ctx.reply({ embeds: [embed] });
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: create | addbutton | delete | list")] });
    }
  },
};
export default command;
