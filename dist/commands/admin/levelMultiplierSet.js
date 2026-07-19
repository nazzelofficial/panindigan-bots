import { GuildModel } from '../../database/models/Guild';
import { successEmbed } from '../../utils/embeds';
const command = {
    name: 'level_multiplier_set',
    description: 'Set XP multiplier for a role',
    category: 'Admin',
    access: 'admin',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption(option => option.setName('role')
        .setDescription('Role to set multiplier for')
        .setRequired(true))
        .addNumberOption(option => option.setName('multiplier')
        .setDescription('XP multiplier (e.g., 1.5 for 50% more XP)')
        .setRequired(true)
        .setMinValue(0.1)
        .setMaxValue(10)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const role = ctx.isSlash ? ctx.interaction.options.getRole('role', true) : ctx.args[0] ? await guild.roles.fetch(ctx.args[0].replace(/\D/g, '')).catch(() => null) : null;
        const multiplier = ctx.isSlash ? ctx.interaction.options.getNumber('multiplier', true) : parseFloat(ctx.args[1] ?? '1');
        if (!role) {
            await ctx.reply({ embeds: [successEmbed('Invalid role.')] });
            return;
        }
        const config = await GuildModel.findOne({ guildId: guild.id });
        // Store level multipliers in customCommands as a temporary workaround
        const levelMultipliers = {};
        config?.customCommands.forEach((cmd) => {
            if (cmd.name.startsWith('level_multiplier:')) {
                const roleId = cmd.name.replace('level_multiplier:', '');
                levelMultipliers[roleId] = parseFloat(cmd.response);
            }
        });
        levelMultipliers[role.id] = multiplier;
        // Convert back to customCommands format
        const updatedCommands = config?.customCommands.filter((cmd) => !cmd.name.startsWith('level_multiplier:')) || [];
        Object.entries(levelMultipliers).forEach(([roleId, mult]) => {
            updatedCommands.push({ name: `level_multiplier:${roleId}`, response: mult.toString(), createdBy: ctx.userId, createdAt: new Date() });
        });
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { customCommands: updatedCommands }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Set XP multiplier for ${role.name} to ${multiplier}x`)] });
    },
};
export default command;
//# sourceMappingURL=levelMultiplierSet.js.map