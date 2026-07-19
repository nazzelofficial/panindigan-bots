import { GuildModel } from '@/database/models/Guild';
import { baseEmbed } from '@/utils/embeds';
const command = {
    name: 'level_multiplier_list',
    description: 'List all XP multipliers',
    category: 'Admin',
    access: 'admin',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        // Store level multipliers in customCommands as a temporary workaround
        const levelMultipliers = {};
        config?.customCommands.forEach((cmd) => {
            if (cmd.name.startsWith('level_multiplier:')) {
                const roleId = cmd.name.replace('level_multiplier:', '');
                levelMultipliers[roleId] = parseFloat(cmd.response);
            }
        });
        const entries = Object.entries(levelMultipliers);
        if (entries.length === 0) {
            await ctx.reply({ embeds: [baseEmbed('danger').setDescription('No custom XP multipliers set')] });
            return;
        }
        const multiplierList = entries.map(([roleId, multiplier]) => {
            const role = guild.roles.cache.get(roleId);
            return `${role?.name || roleId}: ${multiplier}x`;
        }).join('\n');
        const embed = baseEmbed('primary')
            .setTitle('📊 XP Multipliers')
            .setDescription(multiplierList)
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=levelMultiplierList.js.map