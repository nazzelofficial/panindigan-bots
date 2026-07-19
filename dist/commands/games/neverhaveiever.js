import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { baseEmbed } from "@/utils/embeds";
const STATEMENTS = [
    "Never have I ever stayed awake for more than 24 hours.",
    "Never have I ever eaten an entire pizza by myself.",
    "Never have I ever cried during a movie.",
    "Never have I ever gone skinny dipping.",
    "Never have I ever forgotten someone's birthday.",
    "Never have I ever lied to get out of plans.",
    "Never have I ever fallen asleep in class or work.",
    "Never have I ever been in a car accident.",
    "Never have I ever had a crush on a teacher.",
    "Never have I ever sent a message to the wrong person.",
    "Never have I ever read someone's diary without permission.",
    "Never have I ever pretended to be sick to skip something.",
    "Never have I ever cheated on a test or game.",
    "Never have I ever ghosted someone.",
    "Never have I ever talked to myself for more than 5 minutes.",
    "Never have I ever eaten something from the floor.",
    "Never have I ever re-gifted a present.",
    "Never have I ever sung in the shower.",
    "Never have I ever stayed in bed past noon.",
    "Never have I ever spent more than 6 hours gaming in one sitting.",
    "Never have I ever pretended to like a gift I hated.",
    "Never have I ever stalked an ex on social media.",
    "Never have I ever forgotten to reply to someone on purpose.",
    "Never have I ever cried because of a song.",
    "Never have I ever been rejected.",
];
const command = {
    name: "neverhaveiever",
    description: "Kunin ang isang 'Never Have I Ever' statement",
    category: "Games",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["nhie", "neverhave"],
    slashData: (b) => b,
    async execute(ctx) {
        const statement = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("nhie:have").setLabel("🍺 I Have!").setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId("nhie:never").setLabel("✋ Never!").setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId("nhie:next").setLabel("⏭️ Next").setStyle(ButtonStyle.Secondary));
        const haveList = [];
        const neverList = [];
        const makeEmbed = () => baseEmbed("primary")
            .setTitle("🍻 Never Have I Ever")
            .setDescription(`> **${statement}**`)
            .addFields({ name: "🍺 Have", value: haveList.length ? haveList.map((id) => `<@${id}>`).join(", ") : "*(wala pa)*", inline: true }, { name: "✋ Never", value: neverList.length ? neverList.map((id) => `<@${id}>`).join(", ") : "*(wala pa)*", inline: true })
            .setFooter({ text: "Click your answer!" });
        const msg = await ctx.reply({ embeds: [makeEmbed()], components: [row], fetchReply: true });
        if (!msg)
            return;
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000,
        });
        collector.on("collect", async (i) => {
            if (i.customId === "nhie:next") {
                if (i.user.id !== ctx.userId) {
                    await i.reply({ embeds: [baseEmbed("warning").setDescription("Ang host lang ang makakapili ng next.")], ephemeral: true });
                    return;
                }
                collector.stop("next");
                const nextStatement = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];
                await i.update({ embeds: [baseEmbed("primary").setTitle("🍻 Never Have I Ever").setDescription(`> **${nextStatement}**`).setFooter({ text: "New round!" })], components: [row] });
                return;
            }
            await i.deferUpdate();
            const uid = i.user.id;
            if (i.customId === "nhie:have") {
                if (!haveList.includes(uid)) {
                    haveList.push(uid);
                    neverList.splice(neverList.indexOf(uid), 1);
                }
            }
            else {
                if (!neverList.includes(uid)) {
                    neverList.push(uid);
                    haveList.splice(haveList.indexOf(uid), 1);
                }
            }
            await msg.edit({ embeds: [makeEmbed()], components: [row] });
        });
        collector.on("end", async (_, reason) => {
            if (reason === "time")
                await msg.edit({ components: [] }).catch(() => { });
        });
    },
};
export default command;
//# sourceMappingURL=neverhaveiever.js.map