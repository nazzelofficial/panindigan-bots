import { PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "goodbye reset",
    description: "Reset goodbye system to default settings",
    category: "Goodbye",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const confirmRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("goodbye_reset_confirm").setLabel("Confirm Reset").setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId("goodbye_reset_cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary));
        const msg = await ctx.reply({
            embeds: [errorEmbed("⚠️ Warning: This will reset all goodbye settings to default. This action cannot be undone.")],
            components: [confirmRow],
        });
        const collector = msg.createMessageComponentCollector({ time: 15000 });
        collector.on("collect", async (i) => {
            if (i.user.id !== ctx.userId) {
                await i.reply({ content: "Only the command user can interact with this.", ephemeral: true });
                return;
            }
            if (i.customId === "goodbye_reset_confirm") {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
                    $set: {
                        "goodbye.enabled": false,
                        "goodbye.channelId": null,
                        "goodbye.message": "{user} has left {server}. We now have {memberCount} members.",
                        "goodbye.title": null,
                        "goodbye.description": null,
                        "goodbye.color": "#ED4245",
                        "goodbye.footer": null,
                        "goodbye.thumbnail": null,
                        "goodbye.image": null,
                        "goodbye.banner": null,
                        "goodbye.background": null,
                        "goodbye.dmEnabled": false,
                        "goodbye.language": "en",
                        "goodbye.theme": "default",
                        "goodbye.buttons": false,
                        "goodbye.embed": true,
                        "goodbye.cardTemplate": "default",
                        "goodbye.cardBackgroundUrl": null,
                        "goodbye.randomMessages": [],
                    },
                }, { upsert: true });
                await i.update({ embeds: [successEmbed("Goodbye system reset to default settings.")], components: [] });
            }
            else if (i.customId === "goodbye_reset_cancel") {
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
//# sourceMappingURL=goodbyeReset.js.map