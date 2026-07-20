import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { BirthdayModel } from "../../database/models/Community.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const command: CommandDefinition = {
  name: "birthdayview",
  description: "View your birthday",
  category: "Scheduler",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("User (default: you)").setRequired(false)),
  async execute(ctx) {
    const target = ctx.isSlash ? ctx.interaction!.options.getUser("user") ?? ctx.interaction!.user : await ctx.client.users.fetch(ctx.userId);
    const bday = await BirthdayModel.findOne({ userId: target.id }).lean();
    if (!bday) {
      await ctx.reply({ embeds: [infoEmbed(`${target.username} has no birthday set.`)] });
      return;
    }
    const now = new Date();
    const nextYear = now.getMonth() + 1 > (bday as any).month || (now.getMonth() + 1 === (bday as any).month && now.getDate() > (bday as any).day) ? now.getFullYear() + 1 : now.getFullYear();
    const nextDate = new Date(nextYear, (bday as any).month - 1, (bday as any).day);
    await ctx.reply({ embeds: [baseEmbed("warning").setTitle(`🎂 ${target.username}'s Birthday`).setDescription(`**${MONTHS[(bday as any).month - 1]} ${(bday as any).day}**\nNext birthday: <t:${Math.floor(nextDate.getTime() / 1000)}:R>`)] });
  },
};
export default command;
