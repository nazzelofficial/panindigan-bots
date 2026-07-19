import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const TIMEZONES: Record<string, string> = {
  "Manila": "Asia/Manila",
  "Singapore": "Asia/Singapore",
  "Tokyo": "Asia/Tokyo",
  "Seoul": "Asia/Seoul",
  "Hong Kong": "Asia/Hong_Kong",
  "Jakarta": "Asia/Jakarta",
  "Kuala Lumpur": "Asia/Kuala_Lumpur",
  "Bangkok": "Asia/Bangkok",
  "Kolkata": "Asia/Kolkata",
  "Dubai": "Asia/Dubai",
  "Moscow": "Europe/Moscow",
  "Istanbul": "Europe/Istanbul",
  "Paris": "Europe/Paris",
  "London": "Europe/London",
  "New York": "America/New_York",
  "Chicago": "America/Chicago",
  "Denver": "America/Denver",
  "Los Angeles": "America/Los_Angeles",
  "São Paulo": "America/Sao_Paulo",
  "Sydney": "Australia/Sydney",
  "Auckland": "Pacific/Auckland",
  "Honolulu": "Pacific/Honolulu",
  "UTC": "UTC",
};

const command: CommandDefinition = {
  name: "timezone",
  description: "View current oras sa iba't ibang timezone sa mundo",
  category: "Utility",
  access: "general",
  guildOnly: false,
  cooldown: 5,
  aliases: ["tz", "time", "worldclock"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("city").setDescription("View oras sa isang lungsod")
          .addStringOption((o) =>
            o.setName("city").setDescription("Lungsod").setRequired(true)
              .addChoices(...Object.keys(TIMEZONES).map((c) => ({ name: c, value: c }))),
          ),
      )
      .addSubcommand((s) =>
        s.setName("list").setDescription("View all available na timezone")
      )
      .addSubcommand((s) =>
        s.setName("convert").setDescription("I-convert ang oras mula sa isang timezone papunta sa isa pa")
          .addStringOption((o) => o.setName("time").setDescription("Oras na ico-convert (e.g. 18:00)").setRequired(true))
          .addStringOption((o) =>
            o.setName("from").setDescription("Source timezone").setRequired(true)
              .addChoices(...Object.keys(TIMEZONES).map((c) => ({ name: c, value: c }))),
          )
          .addStringOption((o) =>
            o.setName("to").setDescription("Target timezone").setRequired(true)
              .addChoices(...Object.keys(TIMEZONES).map((c) => ({ name: c, value: c }))),
          ),
      ),
  async execute(ctx) {
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "list");

    if (sub === "list") {
      const now = new Date();
      const lines = Object.entries(TIMEZONES).map(([city, tz]) => {
        const time = now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
        const date = now.toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
        return `**${city}** — ${time} (${date})`;
      });
      await ctx.reply({
        embeds: [
          baseEmbed("primary")
            .setTitle("🌍 World Clock")
            .setDescription(lines.join("\n"))
            .setFooter({ text: "Times are approximate and updated every command use" }),
        ],
      });
      return;
    }

    if (sub === "city") {
      const city = ctx.isSlash ? ctx.interaction!.options.getString("city", true) : ctx.args[1];
      if (!city || !TIMEZONES[city]) { await ctx.reply({ embeds: [errorEmbed(`Unknown city. Use \`/timezone list\` para makita ang available na cities.`)] }); return; }
      const tz = TIMEZONES[city];
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      const date = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", year: "numeric", month: "long", day: "numeric" });
      await ctx.reply({
        embeds: [
          baseEmbed("primary")
            .setTitle(`🕐 ${city}`)
            .addFields(
              { name: "Time", value: `**${time}**`, inline: true },
              { name: "Date", value: date, inline: true },
              { name: "Timezone", value: `\`${tz}\``, inline: true },
            ),
        ],
      });
      return;
    }

    if (sub === "convert") {
      const timeStr = ctx.isSlash ? ctx.interaction!.options.getString("time", true) : ctx.args[1];
      const fromCity = ctx.isSlash ? ctx.interaction!.options.getString("from", true) : ctx.args[2];
      const toCity = ctx.isSlash ? ctx.interaction!.options.getString("to", true) : ctx.args[3];

      if (!timeStr || !fromCity || !toCity) { await ctx.reply({ embeds: [errorEmbed("Provide a time, from, at to timezone.")] }); return; }
      if (!TIMEZONES[fromCity] || !TIMEZONES[toCity]) { await ctx.reply({ embeds: [errorEmbed("Unknown city.")] }); return; }

      const [hours, minutes] = timeStr.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) { await ctx.reply({ embeds: [errorEmbed("Invalid na oras. Use format: `18:00`")] }); return; }

      // Build a date at today's date in the from timezone at the given time
      const today = new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONES[fromCity] }); // YYYY-MM-DD
      const sourceDate = new Date(`${today}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);

      const converted = sourceDate.toLocaleTimeString("en-US", { timeZone: TIMEZONES[toCity], hour: "2-digit", minute: "2-digit", hour12: true });
      const convertedDate = sourceDate.toLocaleDateString("en-US", { timeZone: TIMEZONES[toCity], month: "short", day: "numeric" });

      await ctx.reply({
        embeds: [
          baseEmbed("primary")
            .setTitle("🔄 Timezone Conversion")
            .addFields(
              { name: `From: ${fromCity}`, value: `**${timeStr}**`, inline: true },
              { name: `To: ${toCity}`, value: `**${converted}** (${convertedDate})`, inline: true },
            ),
        ],
      });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Gamitin ang: city | list | convert")] });
  },
};

export default command;
