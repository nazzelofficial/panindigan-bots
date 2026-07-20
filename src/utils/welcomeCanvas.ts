import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from "@napi-rs/canvas";
import type { User, Guild } from "discord.js";

export interface WelcomeCanvasOptions {
  user: User;
  guild: Guild;
  memberCount: number;
  theme?: "default" | "glow" | "gradient" | "dark";
  backgroundUrl?: string | null;
  borderRadius?: number;
  blur?: number;
}

export async function generateWelcomeCanvas(options: WelcomeCanvasOptions): Promise<Buffer> {
  const { user, guild, memberCount, theme = "default", backgroundUrl, borderRadius = 20, blur = 0 } = options;
  const W = 700, H = 250;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  if (backgroundUrl) {
    try {
      const bgImage = await loadImage(backgroundUrl);
      ctx.drawImage(bgImage, 0, 0, W, H);
    } catch {
      drawDefaultBackground(ctx, W, H, theme);
    }
  } else {
    drawDefaultBackground(ctx, W, H, theme);
  }

  // Apply blur if specified
  if (blur > 0) {
    ctx.filter = `blur(${blur}px)`;
  }

  // Rounded corners
  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, borderRadius);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";

  // Avatar
  const avatarUrl = user.displayAvatarURL({ extension: "png", size: 128 });
  const avatarImg = await loadImage(avatarUrl).catch(() => null);
  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, 50, 50, 150, 150);
    ctx.restore();
  }

  // Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Sans";
  ctx.fillText(`Welcome, ${user.username.slice(0, 20)}!`, 240, 100);

  ctx.fillStyle = "#a0a0b0";
  ctx.font = "18px Sans";
  ctx.fillText(`You are member #${memberCount}`, 240, 140);

  ctx.fillStyle = "#c0c0d0";
  ctx.font = "16px Sans";
  ctx.fillText(guild.name.slice(0, 30), 240, 170);

  return canvas.toBuffer("image/png");
}

function drawDefaultBackground(ctx: CanvasRenderingContext2D, W: number, H: number, theme: string): void {
  switch (theme) {
    case "glow":
      const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W);
      glow.addColorStop(0, "#57F287");
      glow.addColorStop(0.5, "#2c2f33");
      glow.addColorStop(1, "#23272a");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      break;
    case "gradient":
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, "#57F287");
      gradient.addColorStop(0.5, "#5865F2");
      gradient.addColorStop(1, "#EB459E");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      break;
    case "dark":
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, W, H);
      break;
    default:
      const defaultBg = ctx.createLinearGradient(0, 0, W, H);
      defaultBg.addColorStop(0, "#2c2f33");
      defaultBg.addColorStop(1, "#23272a");
      ctx.fillStyle = defaultBg;
      ctx.fillRect(0, 0, W, H);
      break;
  }
}
