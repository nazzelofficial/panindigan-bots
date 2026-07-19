import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const command: CommandDefinition = {
  name: "exec",
  description: "Execute a shell command (owner only — DANGEROUS)",
  category: "Owner",
  access: "owner",
  guildOnly: false,
  cooldown: 0,
  async execute(ctx) {
    const cmd = ctx.args.join(" ");
    if (!cmd) { await ctx.reply({ embeds: [errorEmbed("Provide a command.")] }); return; }

    const start = Date.now();
    let stdout = "";
    let stderr = "";
    let isError = false;

    try {
      const result = await execAsync(cmd, { timeout: 15_000 });
      stdout = result.stdout?.trim() || "(no stdout)";
      stderr = result.stderr?.trim() || "";
    } catch (err: any) {
      stdout = err.stdout?.trim() || "";
      stderr = err.stderr?.trim() || err.message;
      isError = true;
    }

    const elapsed = Date.now() - start;
    const embed = baseEmbed(isError ? "danger" : "success")
      .setTitle(isError ? "❌ Exec Error" : "✅ Exec Result")
      .addFields(
        { name: "Command", value: `\`\`\`sh\n${cmd.slice(0, 500)}\`\`\``, inline: false },
        { name: "stdout", value: `\`\`\`\n${stdout.slice(0, 900)}\`\`\``, inline: false },
      );
    if (stderr) embed.addFields({ name: "stderr", value: `\`\`\`\n${stderr.slice(0, 900)}\`\`\``, inline: false });
    embed.setFooter({ text: `Elapsed: ${elapsed}ms` });
    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
