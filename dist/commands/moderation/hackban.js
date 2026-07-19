import { PermissionFlagsBits } from 'discord.js';
import { createModCase } from '@/features/moderation/caseEngine';
import { sendLogEvent } from '@/features/logging/logEngine';
import { baseEmbed, errorEmbed, successEmbed } from '@/utils/embeds';
const command = {
    name: 'hackban',
    description: 'Ban a user by ID even if they are not in the server',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 5,
    memberPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    slashData: (b) => b
        .addStringOption(o => o.setName('user_id').setDescription('Discord user ID to ban').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason for the ban').setRequired(false))
        .addIntegerOption(o => o.setName('deletedays').setDescription('Days of messages to delete (0-7)').setRequired(false).setMinValue(0).setMaxValue(7)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const userId = ctx.isSlash ? ctx.interaction.options.getString('user_id', true) : ctx.args[0];
        const reason = ctx.isSlash ? ctx.interaction.options.getString('reason') : ctx.args[1];
        const deleteDays = ctx.isSlash ? ctx.interaction.options.getInteger('deletedays') : parseInt(ctx.args[2] ?? '0');
        if (!userId || !/^\d{17,20}$/.test(userId)) {
            await ctx.reply({ embeds: [errorEmbed('Invalid user ID format.')] });
            return;
        }
        if (userId === ctx.userId) {
            await ctx.reply({ embeds: [errorEmbed('You cannot ban yourself.')] });
            return;
        }
        const user = await ctx.client.users.fetch(userId).catch(() => null);
        if (!user) {
            await ctx.reply({ embeds: [errorEmbed('No Discord user found with that ID.')] });
            return;
        }
        const existingBan = await guild.bans.fetch(userId).catch(() => null);
        if (existingBan) {
            await ctx.reply({ embeds: [errorEmbed(`**${user.tag}** is already banned from this server.`)] });
            return;
        }
        try {
            await guild.bans.create(userId, { reason: `[Hackban by ${ctx.isSlash ? ctx.interaction.user.tag : ctx.message.author.tag}] ${reason || 'No reason provided'}`, deleteMessageSeconds: (deleteDays ?? 0) * 86400 });
        }
        catch (error) {
            await ctx.reply({ embeds: [errorEmbed(`Failed to ban user: ${error.message}`)] });
            return;
        }
        await createModCase({
            guildId: guild.id,
            userId,
            moderatorId: ctx.userId,
            type: 'ban',
            reason: `[Hackban] ${reason || 'No reason provided'}`,
        });
        await sendLogEvent(guild.id, 'ban', () => baseEmbed('danger')
            .setTitle('🔨 Hackban — User Banned by ID')
            .addFields({ name: 'User', value: `${user.tag} (\`${userId}\`)`, inline: true }, { name: 'Moderator', value: `<@${ctx.userId}>`, inline: true }, { name: 'Reason', value: reason || 'No reason provided', inline: false }, { name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true }));
        await ctx.reply({ embeds: [successEmbed(`**${user.tag}** (\`${userId}\`) has been hackbanned. Reason: ${reason || 'No reason provided'}`)] });
    },
};
export default command;
//# sourceMappingURL=hackban.js.map