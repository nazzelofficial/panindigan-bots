import { StaffNoteModel } from '../../database/models/Moderation.js';
import { successEmbed } from '../../utils/embeds.js';
const command = {
    name: 'staffnote',
    description: 'Add a private staff note for a user',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption(option => option.setName('user')
        .setDescription('User to note')
        .setRequired(true))
        .addStringOption(option => option.setName('note')
        .setDescription('Note content')
        .setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = ctx.isSlash ? ctx.interaction.options.getUser('user', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
        const note = ctx.isSlash ? ctx.interaction.options.getString('note', true) : ctx.args.slice(1).join(' ');
        if (!user) {
            await ctx.reply({ embeds: [successEmbed('Invalid user.')] });
            return;
        }
        await StaffNoteModel.create({
            userId: user.id,
            guildId: guild.id,
            note,
            authorId: ctx.userId,
        });
        await ctx.reply({ embeds: [successEmbed(`Added staff note for ${user.tag}`)] });
    },
};
export default command;
//# sourceMappingURL=staffnote.js.map