import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import type { User, Guild, TextChannel, GuildBasedChannel } from "discord.js";
import { generateGoodbyeCanvas } from "./goodbyeCanvas.js";

export interface GoodbyeEmbedOptions {
  user: User;
  guild: Guild;
  channel: GuildBasedChannel;
  config: any;
}

export async function createGoodbyeEmbed(options: GoodbyeEmbedOptions): Promise<{ embed: EmbedBuilder; attachment?: AttachmentBuilder }> {
  const { user, guild, config } = options;

  const replacements: Record<string, string> = {
    user: `<@${user.id}>`,
    mention: `<@${user.id}>`,
    username: user.username,
    displayname: user.displayName,
    server: guild.name,
    membercount: String(guild.memberCount),
    leavetime: new Date().toLocaleDateString(),
    joindate: user.createdAt.toLocaleDateString(),
    avatar: user.displayAvatarURL(),
    icon: guild.iconURL() || "",
  };

  const fillTemplate = (template: string): string => {
    return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
  };

  const embed = new EmbedBuilder()
    .setColor(config.color || "#ED4245")
    .setTimestamp();

  if (config.title) {
    embed.setTitle(fillTemplate(config.title));
  }

  if (config.description) {
    embed.setDescription(fillTemplate(config.description));
  } else {
    embed.setDescription(fillTemplate(config.message || "{user} has left {server}. We now have {memberCount} members."));
  }

  if (config.thumbnail) {
    embed.setThumbnail(fillTemplate(config.thumbnail));
  } else {
    embed.setThumbnail(user.displayAvatarURL());
  }

  if (config.image) {
    embed.setImage(fillTemplate(config.image));
  }

  if (config.footer) {
    embed.setFooter({ text: fillTemplate(config.footer) });
  }

  if (config.banner) {
    embed.setImage(fillTemplate(config.banner));
  }

  // Generate canvas if enabled
  let attachment: AttachmentBuilder | undefined;
  if (config.cardEnabled || config.cardTemplate !== "default") {
    try {
      const canvasBuffer = await generateGoodbyeCanvas({
        user,
        guild,
        memberCount: guild.memberCount,
        theme: config.cardTemplate || "default",
        backgroundUrl: config.cardBackgroundUrl || config.background,
        borderRadius: 20,
        blur: 0,
      });
      attachment = new AttachmentBuilder(canvasBuffer, { name: "goodbye.png" });
      embed.setImage("attachment://goodbye.png");
    } catch (error) {
      console.error("Failed to generate goodbye canvas:", error);
    }
  }

  return { embed, attachment };
}
