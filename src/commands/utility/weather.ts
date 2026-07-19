import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "weather",
  description: "Get current weather for a location using Open-Meteo (no API key needed)",
  category: "Utility",
  access: "general",
  guildOnly: false,
  cooldown: 10,
  aliases: ["w", "wx"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("location").setDescription("City or location name").setRequired(true)),
  async execute(ctx) {
    const location = ctx.isSlash ? ctx.interaction!.options.getString("location", true) : ctx.args.join(" ");
    if (!location) { await ctx.reply({ embeds: [errorEmbed("Provide a location.")] }); return; }

    // Geocode using Open-Meteo's geocoding API (free, no API key)
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&format=json`).catch(() => null);
    if (!geoRes?.ok) { await ctx.reply({ embeds: [errorEmbed("Geocoding service unavailable.")] }); return; }
    const geoData: any = await geoRes.json();
    const place = geoData?.results?.[0];
    if (!place) { await ctx.reply({ embeds: [infoEmbed(`No results found for **${location}**.`)] }); return; }

    // Fetch weather
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature` +
      `&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto`,
    ).catch(() => null);
    if (!wxRes?.ok) { await ctx.reply({ embeds: [errorEmbed("Weather service unavailable.")] }); return; }
    const wxData: any = await wxRes.json();
    const curr = wxData?.current;

    const WMO_CODES: Record<number, string> = {
      0: "☀️ Clear sky", 1: "🌤️ Mainly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast",
      45: "🌫️ Fog", 48: "🌫️ Icy fog", 51: "🌦️ Light drizzle", 53: "🌦️ Drizzle", 55: "🌧️ Heavy drizzle",
      61: "🌧️ Slight rain", 63: "🌧️ Rain", 65: "🌧️ Heavy rain",
      71: "❄️ Slight snow", 73: "❄️ Snow", 75: "❄️ Heavy snow",
      77: "🌨️ Snow grains", 80: "🌦️ Rain showers", 81: "🌧️ Rain showers", 82: "⛈️ Violent showers",
      85: "🌨️ Snow showers", 86: "🌨️ Heavy snow showers",
      95: "⛈️ Thunderstorm", 96: "⛈️ Thunderstorm + hail", 99: "⛈️ Severe thunderstorm",
    };
    const condition = WMO_CODES[curr?.weather_code] ?? "🌡️ Unknown";
    const cityName = [place.name, place.admin1, place.country].filter(Boolean).join(", ");

    const embed = baseEmbed("info")
      .setTitle(`🌍 Weather — ${cityName}`)
      .setDescription(condition)
      .addFields(
        { name: "🌡️ Temperature", value: `**${curr?.temperature_2m ?? "?"}°C** (feels like ${curr?.apparent_temperature ?? "?"}°C)`, inline: true },
        { name: "💧 Humidity", value: `${curr?.relative_humidity_2m ?? "?"}%`, inline: true },
        { name: "💨 Wind Speed", value: `${curr?.wind_speed_10m ?? "?"} km/h`, inline: true },
        { name: "📍 Coordinates", value: `${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`, inline: true },
        { name: "🕐 Timezone", value: wxData?.timezone ?? "Unknown", inline: true },
      )
      .setFooter({ text: "Powered by Open-Meteo (open-meteo.com)" });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
