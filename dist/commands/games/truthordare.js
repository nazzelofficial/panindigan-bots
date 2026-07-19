import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { baseEmbed } from "../../utils/embeds";
const TRUTHS = [
    "Ano ang pinakamalaking lihim mo na ayaw mong malaman ng pamilya mo?",
    "Who do you have a crush on in real life right now?",
    "Anong pinaka-embarrassing na bagay ang nangyari sa iyo sa public?",
    "Kailan ka huling umiyak at bakit?",
    "Anong ugali mo ang gusto mong baguhin?",
    "Who in this server would you least want to be stuck with on a deserted island?",
    "Anong pinaka-weird na panaginip ang nangyari sa iyo?",
    "Nagtago ka na ba ng pagkain para hindi na-share? Ano?",
    "Anong bagay ang nagpapahiya sa iyo na inaamin mo ngayon?",
    "Kung pwede kang maging ibang tao sa loob ng isang araw, sino?",
    "Anong paborito mong track na nahihiya kang aminin?",
    "Ilang beses ka nang ma-ghosted ng iyong crush?",
    "Anong pinakamalaking kasinungalingan ang sinabi mo sa magulang mo?",
    "Sino ang kontaktong pinaka-bihirang tumawag sa iyo sa phone?",
    "Anong social media account mo ang gusto mong itago sa lahat?",
    "Nakatulog ka na ba sa klase o sa trabaho? Ilang beses?",
    "Anong pinaka-weird na bagay ang nagpapa-relax sa iyo?",
    "Who do you think is the most attractive person in this chat right now?",
    "Anong pinakamahal mong binili na pagsisisihan mo?",
    "Ilang oras ka nanonood ng TikTok/YouTube nang hindi natutulog?",
];
const DARES = [
    "Send a random meme to your family group chat.",
    "Sing one line from your favorite song in a voice channel.",
    "Set your crush's name as your server nickname for the next 10 minutes.",
    "Type \"I am the champion\" in another channel of this server.",
    "Remove iyong pfp sa loob ng 30 minuto.",
    "Magpadala ng 'Hello po, kumain ka na?' sa isang random na contact mo.",
    "React with 🥕 to the oldest visible message in this channel.",
    "I-change ang iyong Discord status sa 'Hahaha funny lang' sa susunod na 1 oras.",
    "Mention a random person in the server and say \"You are the greatest.\"",
    "Ilagay ang pinaka-embarrassing na photo mo bilang pfp sa susunod na 5 minuto.",
    "Mag-send ng voice message na nagbibigay ng payo sa buhay.",
    "Create haiku tungkol sa pagkain sa susunod na 2 minuto.",
    "Sabihin ng 3 beses nang mabilis: 'She sells seashells by the seashore.'",
    "Mag-type ng iyong buong pangalan sa reverse.",
    "Magpadala ng 'Miss na kita' sa huling person na nag-chat sa iyo.",
    "Mag-imitate ng famous personality sa loob ng isang minuto sa chat.",
    "Mag-send ng selfie (kahit doodle ng iyong mukha).",
    "Sabihin sa susunod mong reply sa isang taong ihahalal ng group.",
    "Post \"I believe in myself\" in another server or chat.",
    "Mag-sing ng Happy Birthday sa pinaka-random na oras ng laro.",
];
const command = {
    name: "truthordare",
    description: "Kunin ang isang Truth or Dare challenge",
    category: "Games",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["tod", "truth", "dare"],
    slashData: (b) => b.addStringOption((o) => o.setName("choice").setDescription("Truth o Dare?").setRequired(false).addChoices({ name: "Truth", value: "truth" }, { name: "Dare", value: "dare" })),
    async execute(ctx) {
        const choice = (ctx.isSlash ? ctx.interaction.options.getString("choice") : ctx.args[0]?.toLowerCase());
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("tod:truth").setLabel("🤔 Truth").setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId("tod:dare").setLabel("🔥 Dare").setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId("tod:random").setLabel("🎲 Random").setStyle(ButtonStyle.Secondary));
        const getCard = (type) => {
            const pool = type === "truth" ? TRUTHS : DARES;
            const text = pool[Math.floor(Math.random() * pool.length)];
            return baseEmbed(type === "truth" ? "primary" : "danger")
                .setTitle(type === "truth" ? "🤔 TRUTH" : "🔥 DARE")
                .setDescription(`> ${text}`)
                .setFooter({ text: `Requested by ${ctx.isSlash ? ctx.interaction.user.username : ctx.message.author.username}` });
        };
        if (choice) {
            await ctx.reply({ embeds: [getCard(choice)], components: [row] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("🎭 Truth or Dare")
            .setDescription("Pumili: **Truth** — sagutin ang tanong nang totoo, o **Dare** — gawin ang hamon!");
        const msg = await ctx.reply({ embeds: [embed], components: [row], fetchReply: true });
        if (!msg)
            return;
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30_000,
        });
        collector.on("collect", async (i) => {
            const type = i.customId === "tod:random" ? (Math.random() < 0.5 ? "truth" : "dare") : i.customId.split(":")[1];
            await i.update({ embeds: [getCard(type)], components: [row] });
        });
        collector.on("end", async (_, reason) => {
            if (reason === "time")
                await msg.edit({ components: [] }).catch(() => { });
        });
    },
};
export default command;
//# sourceMappingURL=truthordare.js.map