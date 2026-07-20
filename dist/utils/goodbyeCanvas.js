import { createCanvas, loadImage } from "@napi-rs/canvas";
export async function generateGoodbyeCanvas(options) {
    const { user, guild, memberCount, theme = "default", backgroundUrl, borderRadius = 20, blur = 0 } = options;
    const W = 700, H = 250;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    // Background
    if (backgroundUrl) {
        try {
            const bgImage = await loadImage(backgroundUrl);
            ctx.drawImage(bgImage, 0, 0, W, H);
        }
        catch {
            drawDefaultBackground(ctx, W, H, theme);
        }
    }
    else {
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
    ctx.fillText(`Goodbye, ${user.username.slice(0, 20)}!`, 240, 100);
    ctx.fillStyle = "#a0a0b0";
    ctx.font = "18px Sans";
    ctx.fillText(`We now have ${memberCount} members`, 240, 140);
    ctx.fillStyle = "#c0c0d0";
    ctx.font = "16px Sans";
    ctx.fillText(guild.name.slice(0, 30), 240, 170);
    return canvas.toBuffer("image/png");
}
function drawDefaultBackground(ctx, W, H, theme) {
    switch (theme) {
        case "farewell":
            const farewell = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W);
            farewell.addColorStop(0, "#ED4245");
            farewell.addColorStop(0.5, "#2c2f33");
            farewell.addColorStop(1, "#23272a");
            ctx.fillStyle = farewell;
            ctx.fillRect(0, 0, W, H);
            break;
        case "dark":
            ctx.fillStyle = "#1a1a1a";
            ctx.fillRect(0, 0, W, H);
            break;
        case "red-accent":
            const redAccent = ctx.createLinearGradient(0, 0, W, H);
            redAccent.addColorStop(0, "#ED4245");
            redAccent.addColorStop(0.5, "#991B1B");
            redAccent.addColorStop(1, "#2c2f33");
            ctx.fillStyle = redAccent;
            ctx.fillRect(0, 0, W, H);
            break;
        default:
            const defaultBg = ctx.createLinearGradient(0, 0, W, H);
            defaultBg.addColorStop(0, "#ED4245");
            defaultBg.addColorStop(1, "#991B1B");
            ctx.fillStyle = defaultBg;
            ctx.fillRect(0, 0, W, H);
            break;
    }
}
//# sourceMappingURL=goodbyeCanvas.js.map