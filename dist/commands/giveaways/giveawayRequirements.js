import { PermissionFlagsBits } from "discord.js";
import { GiveawayModel } from "@/database/models/Community";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "giveawayrequirements",
    description: "Set entry requirements for a giveaway (required role, minimum level, etc.)",
    category: "Giveaways",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["grequirements", "greqs"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true))
        .addRoleOption((o) => o.setName("required_role").setDescription("Role required to enter").setRequired(false))
        .addIntegerOption((o) => o.setName("min_level").setDescription("Minimum level required to enter").setRequired(false).setMinValue(1))
        .addIntegerOption((o) => o.setName("min_messages").setDescription("Minimum message count required").setRequired(false).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide the giveaway message ID.")] });
            return;
        }
        const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId, ended: false }).lean();
        if (!giveaway) {
            await ctx.reply({ embeds: [errorEmbed("No active giveaway found.")] });
            return;
        }
        const requirements = {};
        if (ctx.isSlash) {
            const role = ctx.interaction.options.getRole("required_role");
            const level = ctx.interaction.options.getInteger("min_level");
            const messages = ctx.interaction.options.getInteger("min_messages");
            if (role)
                requirements.requiredRoleId = role.id;
            if (level)
                requirements.minLevel = level;
            if (messages)
                requirements.minMessages = messages;
        }
        if (!Object.keys(requirements).length) {
            await ctx.reply({ embeds: [errorEmbed("Please specify at least one requirement.")] });
            return;
        }
        await GiveawayModel.findOneAndUpdate({ messageId }, { $set: { requirements } });
        const lines = Object.entries(requirements).map(([k, v]) => `**${k}:** ${k === "requiredRoleId" ? `<@&${v}>` : v}`);
        await ctx.reply({ embeds: [successEmbed(`Giveaway requirements set:\n${lines.join("\n")}`)] });
    },
};
export default command;
//# sourceMappingURL=giveawayRequirements.js.map