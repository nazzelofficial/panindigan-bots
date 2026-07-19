import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "nick",
    description: "Change or reset a member's nickname",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageNicknames],
    botPermissions: [PermissionFlagsBits.ManageNicknames],
    guildOnly: true,
    cooldown: 3,
    aliases: ["nickname", "setnick"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("set")
        .setDescription("Change a member's nickname")
        .addUserOption((o) => o.setName("user").setDescription("Member to rename").setRequired(true))
        .addStringOption((o) => o.setName("nickname").setDescription("New nickname (max 32 characters)").setRequired(true).setMaxLength(32)))
        .addSubcommand((s) => s
        .setName("reset")
        .setDescription("Reset a member's nickname back to their username")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)))
        .addSubcommand((s) => s
        .setName("me")
        .setDescription("Change your own nickname")
        .addStringOption((o) => o.setName("nickname").setDescription("New nickname (leave blank to reset)").setRequired(false).setMaxLength(32))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "set");
        if (sub === "me") {
            const nick = ctx.isSlash ? (ctx.interaction.options.getString("nickname") ?? null) : (ctx.args[1] ?? null);
            const self = await guild.members.fetch(ctx.userId).catch(() => null);
            if (!self) {
                await ctx.reply({ embeds: [errorEmbed("Could not find you in this server.")] });
                return;
            }
            if (!self.manageable) {
                await ctx.reply({ embeds: [errorEmbed("I cannot change your nickname — my role may be below yours.")] });
                return;
            }
            await self.setNickname(nick, "Self-nickname change");
            await ctx.reply({ embeds: [successEmbed(nick ? `Your nickname has been set to **${nick}**.` : "Your nickname has been reset.")] });
            return;
        }
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a member.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
            return;
        }
        if (!member.manageable) {
            await ctx.reply({ embeds: [errorEmbed("I cannot change this member's nickname — their role may be higher than mine.")] });
            return;
        }
        if (sub === "set") {
            const nick = ctx.isSlash ? ctx.interaction.options.getString("nickname", true) : ctx.args.slice(2).join(" ");
            if (!nick) {
                await ctx.reply({ embeds: [errorEmbed("Provide a new nickname.")] });
                return;
            }
            await member.setNickname(nick, `Moderator: ${ctx.userId}`);
            await ctx.reply({ embeds: [successEmbed(`<@${targetId}>'s nickname has been changed to **${nick}**.`)] });
        }
        else if (sub === "reset") {
            await member.setNickname(null, `Moderator: ${ctx.userId}`);
            await ctx.reply({ embeds: [successEmbed(`<@${targetId}>'s nickname has been reset.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: set | reset | me")] });
        }
    },
};
export default command;
//# sourceMappingURL=nick.js.map