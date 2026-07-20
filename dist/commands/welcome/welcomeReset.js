import { PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "welcome reset",
    description: "Reset welcome system to default settings",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const confirmRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("welcome_reset_confirm").setLabel("Confirm Reset").setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId("welcome_reset_cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary));
        const msg = await ctx.reply({
            embeds: [errorEmbed("⚠️ Warning: This will reset all welcome settings to default. This action cannot be undone.")],
            components: [confirmRow],
        });
        const collector = msg.createMessageComponentCollector({ time: 15000 });
        collector.on("collect", async (i) => {
            if (i.user.id !== ctx.userId) {
                await i.reply({ content: "Only the command user can interact with this.", ephemeral: true });
                return;
            }
            if (i.customId === "welcome_reset_confirm") {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
                    $set: {
                        "welcome.enabled": false,
                        "welcome.channelId": null,
                        "welcome.message": "Welcome to {server}, {mention}! You are member #{memberCount}.",
                        "welcome.title": null,
                        "welcome.description": null,
                        "welcome.color": "#57F287",
                        "welcome.footer": null,
                        "welcome.thumbnail": null,
                        "welcome.image": null,
                        "welcome.banner": null,
                        "welcome.background": null,
                        "welcome.autoroleId": null,
                        "welcome.dmEnabled": false,
                        "welcome.language": "en",
                        "welcome.theme": "default",
                        "welcome.buttons": false,
                        "welcome.embed": true,
                        "welcome.cardTemplate": "default",
                        "welcome.cardBackgroundUrl": null,
                        "welcome.randomMessages": [],
                    },
                }, { upsert: true });
                await i.update({ embeds: [successEmbed("Welcome system reset to default settings.")], components: [] });
            }
            else if (i.customId === "welcome_reset_cancel") {
                await i.update({ embeds: [successEmbed("Reset cancelled.")], components: [] });
            }
        });
        collector.on("end", async (collected) => {
            if (collected.size === 0) {
                await msg.edit({ embeds: [errorEmbed("Reset timed out.")], components: [] });
            }
        });
    },
};
export default command;
//# sourceMappingURL=welcomeReset.js.map