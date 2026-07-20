import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const MAX_CUSTOM_COMMANDS = 25;
const command = {
    name: "customcommand",
    description: "Create custom auto-response commands for this server (trigger → response)",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["cc", "customcmd"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("add").setDescription("Add a custom command")
        .addStringOption((o) => o.setName("trigger").setDescription("Trigger word or phrase (no spaces, max 30 characters)").setRequired(true).setMaxLength(30))
        .addStringOption((o) => o.setName("response").setDescription("Bot response (max 1000 characters)").setRequired(true).setMaxLength(1000))
        .addBooleanOption((o) => o.setName("embed").setDescription("Reply using an embed?").setRequired(false)))
        .addSubcommand((s) => s.setName("edit").setDescription("Update the response of an existing custom command")
        .addStringOption((o) => o.setName("trigger").setDescription("Trigger of the command to edit").setRequired(true))
        .addStringOption((o) => o.setName("response").setDescription("New response text").setRequired(true).setMaxLength(1000)))
        .addSubcommand((s) => s.setName("remove").setDescription("Remove a custom command")
        .addStringOption((o) => o.setName("trigger").setDescription("Trigger of the command to remove").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("View all custom commands for this server"))
        .addSubcommand((s) => s.setName("info").setDescription("View details of a specific custom command")
        .addStringOption((o) => o.setName("trigger").setDescription("Trigger of the command").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "add") {
            const trigger = (ctx.isSlash ? ctx.interaction.options.getString("trigger", true) : ctx.args[1])?.toLowerCase().replace(/\s+/g, "_");
            const response = ctx.isSlash ? ctx.interaction.options.getString("response", true) : ctx.args.slice(2).join(" ");
            const useEmbed = ctx.isSlash ? (ctx.interaction.options.getBoolean("embed") ?? false) : false;
            if (!trigger || !response) {
                await ctx.reply({ embeds: [errorEmbed("Provide a trigger and response.")] });
                return;
            }
            if (ctx.client.commands.has(trigger)) {
                await ctx.reply({ embeds: [errorEmbed(`\`${trigger}\` is an existing bot command. Choose a different trigger.`)] });
                return;
            }
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const existing = cfg?.customCommands ?? [];
            if (existing.length >= MAX_CUSTOM_COMMANDS) {
                await ctx.reply({ embeds: [errorEmbed(`Maximum of ${MAX_CUSTOM_COMMANDS} custom commands allowed. Remove one before adding another.`)] });
                return;
            }
            if (existing.find((c) => c.trigger === trigger)) {
                await ctx.reply({ embeds: [errorEmbed(`A custom command with trigger \`${trigger}\` already exists. Use \`/customcommand edit\` to update it.`)] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { customCommands: { trigger, response, useEmbed, createdBy: ctx.userId, createdAt: new Date() } } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Custom command \`${trigger}\` has been added! Members can now use it with: \`${trigger}\``)] });
            return;
        }
        if (sub === "edit") {
            const trigger = (ctx.isSlash ? ctx.interaction.options.getString("trigger", true) : ctx.args[1])?.toLowerCase();
            const response = ctx.isSlash ? ctx.interaction.options.getString("response", true) : ctx.args.slice(2).join(" ");
            if (!trigger || !response) {
                await ctx.reply({ embeds: [errorEmbed("Provide a trigger and new response.")] });
                return;
            }
            const result = await GuildModel.findOneAndUpdate({ guildId: guild.id, "customCommands.trigger": trigger }, { $set: { "customCommands.$.response": response } });
            if (!result) {
                await ctx.reply({ embeds: [errorEmbed(`No custom command with trigger \`${trigger}\` found.`)] });
                return;
            }
            await ctx.reply({ embeds: [successEmbed(`Response for \`${trigger}\` has been updated.`)] });
            return;
        }
        if (sub === "remove") {
            const trigger = (ctx.isSlash ? ctx.interaction.options.getString("trigger", true) : ctx.args[1])?.toLowerCase();
            if (!trigger) {
                await ctx.reply({ embeds: [errorEmbed("Provide a trigger.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { customCommands: { trigger } } });
            await ctx.reply({ embeds: [successEmbed(`Custom command \`${trigger}\` has been removed.`)] });
            return;
        }
        if (sub === "list") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const cmds = cfg?.customCommands ?? [];
            if (!cmds.length) {
                await ctx.reply({ embeds: [baseEmbed("primary").setTitle("⚙️ Custom Commands").setDescription("No custom commands configured yet.")] });
                return;
            }
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle(`⚙️ Custom Commands (${cmds.length}/${MAX_CUSTOM_COMMANDS})`)
                        .setDescription(cmds.map((c) => `**\`${c.trigger}\`** — ${c.response.slice(0, 60)}${c.response.length > 60 ? "..." : ""}`).join("\n")),
                ],
            });
            return;
        }
        if (sub === "info") {
            const trigger = (ctx.isSlash ? ctx.interaction.options.getString("trigger", true) : ctx.args[1])?.toLowerCase();
            if (!trigger) {
                await ctx.reply({ embeds: [errorEmbed("Provide a trigger.")] });
                return;
            }
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const cmd = cfg?.customCommands?.find((c) => c.trigger === trigger);
            if (!cmd) {
                await ctx.reply({ embeds: [errorEmbed(`No custom command with trigger \`${trigger}\` found.`)] });
                return;
            }
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle(`⚙️ Custom Command: \`${cmd.trigger}\``)
                        .addFields({ name: "Response", value: cmd.response.slice(0, 500), inline: false }, { name: "Uses Embed", value: cmd.useEmbed ? "Yes" : "No", inline: true }, { name: "Created By", value: cmd.createdBy ? `<@${cmd.createdBy}>` : "Unknown", inline: true }, { name: "Created", value: cmd.createdAt ? `<t:${Math.floor(new Date(cmd.createdAt).getTime() / 1000)}:R>` : "Unknown", inline: true }),
                ],
            });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: add | edit | remove | list | info")] });
    },
};
export default command;
//# sourceMappingURL=customcommand.js.map