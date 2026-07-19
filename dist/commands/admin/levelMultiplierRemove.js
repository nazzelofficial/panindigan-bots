import { GuildModel } from '../../database/models/Guild';
import { errorEmbed, successEmbed } from '../../utils/embeds';
const command = {
    name: 'level_multiplier_remove',
    description: 'Remove XP multiplier from a role',
    category: 'Admin',
    access: 'admin',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption(option => option.setName('role')
        .setDescription('Role to remove multiplier from')
        .setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const role = ctx.isSlash ? ctx.interaction.options.getRole('role', true) : ctx.args[0] ? await guild.roles.fetch(ctx.args[0].replace(/\D/g, '')).catch(() => null) : null;
        if (!role) {
            await ctx.reply({ embeds: [errorEmbed('Invalid role.')] });
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
        if (!levelMultipliers[role.id]) {
            await ctx.reply({ embeds: [errorEmbed('Role does not have a custom multiplier')] });
            return;
        }
        // Remove from customCommands
        const updatedCommands = config?.customCommands.filter((cmd) => cmd.name !== `level_multiplier:${role.id}`) || [];
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { customCommands: updatedCommands }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Removed XP multiplier from ${role.name}`)] });
    },
};
export default command;
//# sourceMappingURL=levelMultiplierRemove.js.map