import { SlashCommandBuilder, ActivityType } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
// Module-level rotation state (lives as long as the process does)
let rotationInterval = null;
let rotationStatuses = [];
let rotationIndex = 0;
let rotationSpeed = 30; // seconds
function clearRotation() {
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
}
function startRotation(client, statuses, speedSecs) {
    clearRotation();
    rotationStatuses = statuses;
    rotationIndex = 0;
    rotationSpeed = speedSecs;
    const tick = () => {
        const status = rotationStatuses[rotationIndex % rotationStatuses.length];
        client.user?.setActivity({ name: status, type: ActivityType.Playing });
        rotationIndex++;
    };
    tick(); // set immediately
    rotationInterval = setInterval(tick, speedSecs * 1000);
}
export default {
    data: new SlashCommandBuilder()
        .setName('statusrotate')
        .setDescription('Rotate multiple bot activities automatically')
        .addSubcommand(sub => sub.setName('start')
        .setDescription('Start rotating through a list of statuses')
        .addStringOption(option => option.setName('statuses')
        .setDescription('Pipe-separated statuses, e.g. "Status 1|Status 2|Status 3"')
        .setRequired(true))
        .addIntegerOption(option => option.setName('speed')
        .setDescription('Seconds between each rotation (default: 30, min: 5)')
        .setRequired(false)
        .setMinValue(5)))
        .addSubcommand(sub => sub.setName('off')
        .setDescription('Stop the status rotation'))
        .addSubcommand(sub => sub.setName('speed')
        .setDescription('Change the rotation speed without restarting')
        .addIntegerOption(option => option.setName('seconds')
        .setDescription('Seconds between each rotation (min: 5)')
        .setRequired(true)
        .setMinValue(5)))
        .addSubcommand(sub => sub.setName('status')
        .setDescription('View current rotation settings')),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const client = clientRegistry.get();
        if (sub === 'start') {
            const raw = interaction.options.getString('statuses', true);
            const speed = interaction.options.getInteger('speed') ?? 30;
            const statuses = raw.split('|').map(s => s.trim()).filter(Boolean);
            if (statuses.length < 2) {
                return interaction.reply({ content: '❌ Provide at least 2 pipe-separated statuses.', ephemeral: true });
            }
            startRotation(client, statuses, speed);
            return interaction.reply({
                content: `✅ Status rotation started with **${statuses.length}** statuses, rotating every **${speed}s**.\nStatuses:\n${statuses.map((s, i) => `\`${i + 1}.\` ${s}`).join('\n')}`,
                ephemeral: true,
            });
        }
        if (sub === 'off') {
            clearRotation();
            client.user?.setActivity(null);
            return interaction.reply({ content: '✅ Status rotation disabled.', ephemeral: true });
        }
        if (sub === 'speed') {
            const seconds = interaction.options.getInteger('seconds', true);
            if (!rotationInterval || rotationStatuses.length === 0) {
                return interaction.reply({ content: '❌ No rotation is currently active. Use `statusrotate start` first.', ephemeral: true });
            }
            startRotation(client, rotationStatuses, seconds);
            return interaction.reply({ content: `✅ Rotation speed updated to **${seconds}s**.`, ephemeral: true });
        }
        if (sub === 'status') {
            if (!rotationInterval) {
                return interaction.reply({ content: 'ℹ️ Status rotation is currently **disabled**.', ephemeral: true });
            }
            return interaction.reply({
                content: `ℹ️ **Status Rotation Active**\nSpeed: every **${rotationSpeed}s** | Statuses (${rotationStatuses.length}):\n${rotationStatuses.map((s, i) => `\`${i + 1}.\` ${s}`).join('\n')}`,
                ephemeral: true,
            });
        }
    },
};
//# sourceMappingURL=statusRotate.js.map