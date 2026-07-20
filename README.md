<div align="center">

<img src="https://img.shields.io/badge/version-0.2.4-blueviolet?style=for-the-badge" alt="Version">
<img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js">
<img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">

# 🇵🇭 Panindigan Official

**Enterprise-grade, all-in-one Discord bot built for Filipino communities.**

*Moderation · Economy · Leveling · Music · AI · Tickets · Giveaways · and 985+ commands*

</div>

---

## Overview

Panindigan Official is a production-ready Discord bot built from the ground up for Filipino and international Discord communities. It combines every major bot feature — moderation, economy, leveling, AI, music, tickets, giveaways, reaction roles, and rich utility — into a single, thoroughly tested, highly configurable bot.

Every command supports both **slash commands** (`/command`) and **custom prefix commands** (`p!command`). All features are independently configurable per server. The bot supports both **English** and **Filipino/Tagalog** — use `/language` to switch server language.

---

## Feature Highlights

| Category | Commands | Description |
|---|---|---|
| 🔑 **Owner** | 121+ | Bot-level management, premium, packs, global moderation, analytics, rollout, maintenance |
| ⚙️ **Admin** | 87+ | Server config, anti-nuke, automod, backup, onboarding, emoji, sticker, channel management |
| 🛡️ **Moderation** | 57+ | Warn, kick, ban, tempban, mute, softban, cases, notes, purge, lock, voice, appeals |
| 🎵 **Music** | 55+ | Play, queue, filters, equalizer, radio ⭐, soundboard ⭐, DJ mode ⭐, saved queues ⭐ |
| 🎫 **Tickets** | 20+ | Setup, panels, manage, transcript ⭐, archive ⭐, stats ⭐ |
| ✅ **Verification** | 10+ | Button, captcha ⭐, math ⭐, image ⭐ verification |
| 👋 **Welcome** | 18+ | Welcome/goodbye messages, auto-roles, boost messages, custom card ⭐ |
| 📋 **Logging** | 9+ | Event logging, channel config, 22 toggle-able events, export ⭐ |
| 📈 **Leveling** | 20+ | Rank, XP, leaderboard, prestige ⭐, level rewards, rank card ⭐ |
| 💰 **Economy** | 65+ | Balance, work, gambling, shop, pets, fishing, mining, farming, business, market |
| 🎮 **Games** | 34+ | Blackjack, poker, baccarat, roulette, bingo, sudoku, trivia, slots, and more |
| 🎉 **Giveaways** | 13+ | Create, manage, reroll, bonus entries, requirements |
| 🔔 **Reaction Roles** | 16+ | Reaction, button, select, color, and notification role menus |
| 🤖 **AI** | 22+ | Chat, translate, summarize, code, grammar, image gen, voice-to-text |
| ⏰ **Scheduler** | 21+ | Scheduled messages, recurring posts ⭐, birthdays, events ⭐, auto-posts ⭐ |
| 🛠️ **Utility** | 131+ | Userinfo, serverinfo, polls, embeds, weather, wikipedia, URL tools, and more |
| 🎛️ **Settings** | 14+ | Prefix, language, premium, dashboard ⭐, help, changelog, vote, invite, support |
| 🎭 **Roles** | 7+ | Role management, self-assignable roles, color roles |

*⭐ = Premium feature*

---

## Command Reference

### 🔑 Owner Commands (121+)

Bot owner and co-owner commands for system-level management.

| Command | Description |
|---|---|
| `owner` | Owner command hub |
| `botban [user]` | Globally ban a user from the bot |
| `botunban [user]` | Remove a global bot ban |
| `botbans` | List all globally banned users |
| `blacklist add [user/server]` | Blacklist a user or server |
| `blacklist remove [user/server]` | Remove from blacklist |
| `blacklist list` | View all blacklisted entities |
| `premium add [server]` | Grant premium to a server |
| `premium remove [server]` | Revoke premium from a server |
| `premium status [server]` | View premium status |
| `premiumcode generate` | Generate a premium redeem code |
| `premiumcode list` | List generated codes |
| `pack add [server] [pack]` | Add a feature pack to a server |
| `pack remove [server] [pack]` | Remove a feature pack |
| `pack list` | List available packs |
| `maintenance enable [message]` | Enable global maintenance mode |
| `maintenance disable` | Disable maintenance mode |
| `maintenance status` | View maintenance status |
| `botinfo` | View full bot statistics and uptime |
| `guilds` | List all servers the bot is in |
| `shards` | View shard statistics |
| `reload [command]` | Hot-reload a command |
| `reloadall` | Reload all commands |
| `eval [code]` | Execute arbitrary JavaScript (owner only) |
| `shell [command]` | Execute a shell command |
| `dm [user] [message]` | DM any user as the bot |
| `broadcast [message]` | Broadcast a message to all guild log channels |
| `announce [message]` | Send a bot-wide announcement |
| `globalban [user] [reason]` | Ban a user from every guild |
| `globalunban [user]` | Unban a user from every guild |
| `stats` | View bot usage and performance stats |
| `ping` | Check bot latency and database status |
| `leave [server]` | Force bot to leave a server |
| `serverinfo [server]` | View any server's information |
| `userinfo [user]` | View any user's information |

### ⚙️ Admin Commands (87+)

Server configuration, automation, and management tools.

#### General Admin

| Command | Description |
|---|---|
| `setup` | Run the interactive server setup wizard |
| `config view` | View all current server settings |
| `config set [key] [value]` | Update a server configuration value |
| `config reset` | Reset all server settings to defaults |
| `prefix [new prefix]` | Set or view the server command prefix |
| `language [en/fil]` | Set the server language (English or Filipino) |
| `adminrole add [role]` | Add a role that grants admin-level bot access |
| `adminrole remove [role]` | Remove an admin role |
| `adminrole list` | List configured admin roles |
| `modrole add [role]` | Add a moderator role |
| `modrole remove [role]` | Remove a moderator role |
| `modrole list` | List configured moderator roles |
| `muterole set [role]` | Set the mute/timeout role |
| `muterole create` | Auto-create a mute role with correct permissions |
| `muterole sync` | Sync mute role permissions across all channels |
| `muterole view` | View current mute role |
| `premiumrole set [role]` | Designate the premium member role |
| `djrole add [role]` | Add a DJ role for music access |
| `djrole remove [role]` | Remove a DJ role |
| `djrole list` | List configured DJ roles |

#### Anti-Nuke

| Command | Description |
|---|---|
| `antinuke enable` | Enable anti-nuke protection |
| `antinuke disable` | Disable anti-nuke protection |
| `antinuke whitelist add [user]` | Whitelist a trusted user from anti-nuke checks |
| `antinuke whitelist remove [user]` | Remove a user from the anti-nuke whitelist |
| `antinuke threshold [action] [count]` | Set the action threshold that triggers anti-nuke |
| `antinuke punishment [ban/kick/strip-roles]` | Set the anti-nuke punishment type |
| `antinuke logs` | View recent anti-nuke incident logs |
| `antinuke status` | View current anti-nuke configuration |

#### Automod (Admin)

| Command | Description |
|---|---|
| `automodadmin setlog [channel]` | Set the automod log channel |
| `automodadmin spamthreshold [count]` | Set the anti-spam message threshold |
| `automodadmin capsthreshold [percent]` | Set the anti-caps percentage threshold |
| `automodadmin emojithreshold [count]` | Set the max emoji per message |
| `automodadmin raidmode [on/off]` | Toggle raid mode |
| `automodadmin muteduration [minutes]` | Set automod mute duration |
| `automodadmin reset` | Reset all automod settings |
| `automodadmin overview` | View full automod admin configuration |

#### Anti-Link

| Command | Description |
|---|---|
| `antilink on` | Enable anti-link protection |
| `antilink off` | Disable anti-link protection |
| `antilink whitelist add [domain]` | Whitelist a domain from anti-link |
| `antilink whitelist remove [domain]` | Remove a domain from the whitelist |
| `antilink whitelist list` | List all whitelisted domains |
| `antilink status` | View anti-link configuration |

#### Bad Words

| Command | Description |
|---|---|
| `badwords add [word]` | Add a word to the filter |
| `badwords remove [word]` | Remove a word from the filter |
| `badwords list` | View all filtered words |
| `badwords clear` | Clear all filtered words |
| `badwords enable` | Enable the bad-word filter |
| `badwords disable` | Disable the bad-word filter |

#### Channel Management

| Command | Description |
|---|---|
| `channel create [name] [type]` | Create a new channel |
| `channel delete [channel]` | Delete a channel |
| `channel rename [channel] [name]` | Rename a channel |
| `channel topic [channel] [topic]` | Set or clear a channel topic |
| `channel clone [channel]` | Clone a channel |
| `channel nsfw [channel]` | Toggle NSFW flag on a channel |
| `channel info [channel]` | View channel information |

#### Emoji & Sticker Management

| Command | Description |
|---|---|
| `emoji add [name] [url]` | Add a custom emoji |
| `emoji delete [emoji]` | Delete a custom emoji |
| `emoji rename [emoji] [name]` | Rename a custom emoji |
| `emoji list` | List all server emojis |
| `emoji info [emoji]` | View emoji details |
| `sticker add [name] [url] [emoji]` | Add a custom sticker |
| `sticker delete [sticker]` | Delete a custom sticker |
| `sticker rename [sticker] [name]` | Rename a custom sticker |
| `sticker list` | List all server stickers |
| `sticker info [sticker]` | View sticker details |

#### Server Management

| Command | Description |
|---|---|
| `backup create` | Create a server configuration backup |
| `backup list` | List saved backups |
| `backup restore [id]` | Restore from a backup |
| `serverbackup create` | Full server backup (roles, channels, config) |
| `serverlock enable [reason]` | Lock all channels |
| `serverlock disable` | Unlock all channels |
| `serverlock status` | View server lock status |
| `servertemplate save [name]` | Save server structure as a template |
| `servertemplate apply [name]` | View and apply a saved template |
| `servertemplate list` | List saved templates |
| `servertemplate delete [name]` | Delete a template |
| `vanityurl set [code]` | Set bot vanity URL code |
| `vanityurl view` | View current vanity URL |
| `vanityurl remove` | Remove vanity URL |
| `serverinsights` | View rich server statistics |
| `rolehierarchy` | View role hierarchy with permission risk |
| `bulkroleaudit` | Audit roles for dangerous permissions |
| `onboarding template` | Configure onboarding template |
| `prunemember [days]` | Prune inactive members |
| `prunedry [days]` | Preview prune without executing |

#### Welcome & Economy (Admin)

| Command | Description |
|---|---|
| `welcomemessage [message]` | Set the welcome message |
| `goodbyemessage [message]` | Set the goodbye message |
| `boostmessage [message]` | Set the boost message |
| `autorole add [role]` | Add a role given to new members |
| `autorole remove [role]` | Remove an auto-role |
| `autorole list` | List configured auto-roles |
| `economysetup` | Configure the economy system |
| `economyadd [user] [amount]` | Add coins to a user |
| `economyremove [user] [amount]` | Remove coins from a user |
| `economyreset [user]` | Reset a user's economy profile |
| `economyset [user] [amount]` | Set a user's exact coin balance |
| `economyevent start [type] [duration]` | Start an economy bonus event ⭐ |
| `economyevent stop` | Stop the current economy event ⭐ |
| `economyevent status` | View economy event status ⭐ |
| `xpboost start [multiplier] [duration]` | Start an XP boost event ⭐ |
| `xpboost stop` | Stop the current XP boost ⭐ |
| `xpboost status` | View XP boost status ⭐ |
| `levelset [user] [level]` | Set a user's level |
| `levelreset [user]` | Reset a user's XP/level |
| `levelmultiplier set [role] [multiplier]` | Set XP multiplier for a role |
| `levelmultiplier remove [role]` | Remove a role XP multiplier |
| `levelmultiplier list` | List all XP multipliers |
| `joingate setup [days]` | Require minimum account age ⭐ |
| `joingate disable` | Disable join gate ⭐ |
| `joingate status` | View join gate configuration ⭐ |
| `warningtemplate add [name] [reason]` | Save a reusable warning reason |
| `warningtemplate use [name] [user]` | Warn a user using a saved template |
| `warningtemplate list` | List warning templates |
| `warningtemplate delete [name]` | Delete a warning template |
| `modrotation setup` | Set up moderation shift rotation |
| `modrotation view` | View rotation schedule |
| `modrotation disable` | Disable rotation |
| `boostperks setup` | Configure booster perks |
| `boostperks list` | List booster perks |
| `boostperks remove` | Remove a booster perk |

### 🛡️ Moderation Commands (57+)

| Command | Description |
|---|---|
| `warn [user] [reason]` | Warn a member |
| `warnings [user]` | View a member's warning history |
| `delwarn [id]` | Delete a warning |
| `clearwarns [user]` | Clear all warnings for a member |
| `kick [user] [reason]` | Kick a member |
| `ban [user] [reason]` | Ban a member |
| `unban [user]` | Unban a member |
| `tempban [user] [duration] [reason]` | Temporarily ban a member |
| `softban [user] [reason]` | Softban (ban+unban to delete messages) |
| `mute [user] [duration] [reason]` | Timeout (mute) a member |
| `unmute [user]` | Remove a member's timeout |
| `purge [amount]` | Delete messages in bulk |
| `purgeuser [user] [amount]` | Delete messages from a specific user |
| `lock [channel]` | Lock a channel |
| `unlock [channel]` | Unlock a channel |
| `slowmode [seconds] [channel]` | Set slowmode on a channel |
| `nick [user] [nickname]` | Change a member's nickname |
| `role add [user] [role]` | Give a role to a member |
| `role remove [user] [role]` | Remove a role from a member |
| `cases [user]` | View moderation cases |
| `case [id]` | View a specific moderation case |
| `modlog [page]` | View the full moderation log |
| `note add [user] [note]` | Add a moderator note |
| `note list [user]` | View notes for a member |
| `note delete [id]` | Delete a moderator note |
| `voice kick [user]` | Kick a user from a voice channel |
| `voice move [user] [channel]` | Move a user to a different voice channel |
| `voice mute [user]` | Server mute a member |
| `voice unmute [user]` | Remove server mute |
| `voice deafen [user]` | Server deafen a member |
| `voice undeafen [user]` | Remove server deafen |
| `raidmode enable` | Enable raid mode |
| `raidmode disable` | Disable raid mode |
| `warnlist [page]` | List members with active warnings |
| `kicklist [limit]` | List recently kicked members |
| `recentactions [limit] [type]` | View recent moderation actions |
| `unmuteallmembers [reason]` | Remove timeouts from all muted members |
| `altcheck [user]` | Heuristic alt account detection |
| `spamcheck [user]` | Spam probability analysis |
| `similaraccounts [user]` | Find members with similar usernames |
| `escalation [user]` | View a user's escalation stage |
| `appealticket setup` | Configure the appeal ticket system |
| `appealticket list` | List active appeals |
| `appealticket approve [id]` | Approve an appeal |
| `appealticket deny [id]` | Deny an appeal |
| `appealticket submit` | Submit a ban/mute appeal |
| `automod enable [feature]` | Enable an automod protection |
| `automod disable [feature]` | Disable an automod protection |
| `automod status` | View all automod feature statuses |
| `automod config` | View full automod configuration |
| `automod whitelist add [type] [id]` | Add to automod whitelist |
| `automod whitelist remove [type] [id]` | Remove from automod whitelist |
| `automod whitelist list` | List automod whitelist entries |
| `automod badword add [word]` | Add a filtered word |
| `automod badword remove [word]` | Remove a filtered word |
| `automod badwords` | View all filtered words |
| `automod antispam [on/off]` | Toggle anti-spam ⭐ |
| `automod antiraid [on/off]` | Toggle anti-raid ⭐ |
| `automod antilink [on/off]` | Toggle anti-link |
| `automod antiinvite [on/off]` | Block Discord invite links |
| `automod antimention [count]` | Set max mentions per message |
| `automod antinsfw [on/off]` | Toggle AI NSFW detection ⭐ |
| `automod antiscam [on/off]` | Toggle AI anti-scam ⭐ |
| `automod antitoxicity [on/off]` | Toggle AI toxicity filter ⭐ |
| `automod antialt [on/off]` | Block alt accounts ⭐ |
| `automod antibot [on/off]` | Block unauthorized bots |
| `automod antiflood [on/off]` | Block message flooding |
| `automod antimassjoin [on/off]` | Detect and block mass join raids ⭐ |
| `automod antighostping [on/off]` | Detect and log ghost pings |
| `automod action [punishment]` | Set violation punishment |
| `channel create [name] [type]` | Create a channel |
| `channel delete [channel]` | Delete a channel |
| `channel rename [channel] [name]` | Rename a channel |
| `channel topic [channel] [topic]` | Set channel topic |
| `channel clone [channel]` | Clone a channel |
| `channel nsfw [channel]` | Toggle NSFW on channel |
| `channel info [channel]` | View channel information |

### 🎵 Music Commands (55+)

Requires Lavalink. Supports YouTube, Spotify, SoundCloud, Deezer, and more.

| Command | Description |
|---|---|
| `play [track/url]` | Play a track from YouTube, Spotify, SoundCloud, Deezer, and more |
| `search [query]` | Search for a track and select from a list |
| `queue` | View the music queue |
| `queue page [page]` | Go to a specific queue page |
| `skip` | Skip the current track |
| `skipto [position]` | Jump directly to a track in the queue |
| `previous` | Return to the previous track |
| `pause` | Pause the music |
| `resume` | Resume paused music |
| `stop` | Stop music and clear the queue |
| `disconnect` | Disconnect the bot from voice |
| `loop` | Loop the current track |
| `loopqueue` | Loop the full queue |
| `shuffle` | Shuffle the queue |
| `move [from] [to]` | Move a track to a different position in the queue |
| `remove [position]` | Remove a track from the queue |
| `clear` | Clear the music queue |
| `jump [position]` | Jump to a specific track |
| `seek [time]` | Seek to a specific position |
| `replay` | Replay the current track from the beginning |
| `volume [0-100]` | Set the music volume |
| `nowplaying` | View the currently playing track with progress bar |
| `lyrics` | Get lyrics for the current track |
| `lyrics [query]` | Get lyrics for a specific track |
| `autoplay` | Toggle autoplay |
| `recommend` | Get song recommendations based on current track |
| `history` | View queue history for this session |
| `movehere` | Move the bot to your current voice channel |
| `summon [channel]` | Move the bot to a specific voice channel |
| `djmode` | Toggle DJ Mode (restricts controls to DJ role) ⭐ |
| `voteskip` | Vote to skip the current track ⭐ |
| `savedqueue save [name]` | Save the current queue ⭐ |
| `savedqueue load [name]` | Load a saved queue ⭐ |
| `savedqueue list` | List saved queues ⭐ |
| `savedqueue delete [name]` | Delete a saved queue ⭐ |
| `filter bassboost` | Apply bass boost filter ⭐ |
| `filter nightcore` | Apply Nightcore effect ⭐ |
| `filter 8d` | Apply 8D audio effect ⭐ |
| `filter vaporwave` | Apply Vaporwave effect ⭐ |
| `filter karaoke` | Apply Karaoke mode ⭐ |
| `filter speed [0.5-2.0]` | Change playback speed ⭐ |
| `filter pitch [value]` | Change audio pitch ⭐ |
| `filter echo` | Apply Echo effect ⭐ |
| `filter reverb` | Apply Reverb effect ⭐ |
| `filter tremolo` | Apply Tremolo effect ⭐ |
| `filter vibrato` | Apply Vibrato effect ⭐ |
| `filter rotation` | Apply Rotation (panning) effect ⭐ |
| `filter distortion` | Apply Distortion effect ⭐ |
| `filter normalize` | Normalize audio volume ⭐ |
| `filter lowpass` | Apply Low Pass filter ⭐ |
| `filter highpass` | Apply High Pass filter ⭐ |
| `filter clear` | Remove all audio filters ⭐ |
| `equalizer` | Manual equalizer settings ⭐ |
| `equalizer preset [name]` | Apply equalizer preset ⭐ |
| `equalizer reset` | Reset equalizer to default ⭐ |
| `radio [station]` | Stream an online radio station ⭐ |
| `soundboard [effect]` | Play a short sound effect ⭐ |
| `247 [on/off]` | Toggle 24/7 mode ⭐ |
| `musicmute` | Mute the music player volume |
| `musicunmute` | Unmute the music player volume |

### 🤖 AI Commands (22+)

Requires `OPENAI_API_KEY`.

| Command | Description |
|---|---|
| `chat [message]` | Chat with the AI assistant |
| `translate [text] [language]` | Translate text using AI |
| `summarize [text]` | Summarize a block of text |
| `code [description]` | Generate code from a description |
| `codeexplain [code]` | Explain what a piece of code does |
| `grammar [text]` | Fix grammar and spelling |
| `rewrite [text]` | Rewrite text in a different style |
| `analyze [text]` | Analyze sentiment and key points |
| `moderate [text]` | Moderate text for policy violations |
| `imagegen [prompt]` | Generate an image from a description |
| `image [prompt]` | Generate and enhance an image |
| `texttoimage [prompt]` | Alternative image generation |
| `voicetotext` | Transcribe voice to text |
| `autoresponse setup` | Configure AI auto-responses |
| `faq [question]` | Answer questions from your server FAQ |
| `ticketassist` | AI-powered ticket response suggestions |
| `persona [name]` | Set the AI's persona |
| `aistats` | View AI usage statistics |
| `ai settings` | View and manage AI settings |
| `ai clear` | Clear AI conversation history |
| `ai language [lang]` | Set AI response language |

### 💰 Economy Commands (65+)

| Command | Description |
|---|---|
| `balance [user]` | View coin balance |
| `daily` | Claim daily coins |
| `weekly` | Claim weekly reward |
| `work` | Work to earn coins |
| `economyleaderboard` | View top richest members |
| `transfer [user] [amount]` | Send coins to another member |
| `deposit [amount]` | Deposit into bank |
| `withdraw [amount]` | Withdraw from bank |
| `shop` | Browse the item shop |
| `buy [item]` | Purchase an item |
| `sell [item]` | Sell an item |
| `inventory` | View your inventory |
| `invest [amount]` | Invest coins |
| `bet [amount]` | Bet coins |
| `coinflip [amount]` | Flip a coin and wager |
| `blackjack [amount]` | Play blackjack |
| `slots [amount]` | Play the slot machine |
| `roulette [amount]` | Play roulette |
| `dice [amount]` | Roll the dice |
| `fish` | Go fishing |
| `mine` | Mine for resources |
| `farm` | Farm crops |
| `hunt` | Go hunting |
| `pet adopt` | Adopt a pet |
| `pet feed` | Feed your pet |
| `pet play` | Play with your pet |
| `pet stats` | View pet stats |
| `pet rename` | Rename your pet |
| `business start` | Start a business |
| `business upgrade` | Upgrade your business |
| `business income` | Collect business income |
| `market buy [item]` | Buy from the player market |
| `market sell [item] [price]` | List an item on the market |
| `market list` | Browse the player market |
| `rob [user]` | Attempt to rob a member |
| `steal [user]` | Steal from a member |
| `crime` | Commit a crime for coins |
| `heist [members]` | Start a heist with other members |
| `beg` | Beg for coins |
| `quest` | View available quests |
| `quest claim` | Claim quest rewards |
| `achievement` | View your achievements |
| `lottery buy` | Buy a lottery ticket |
| `lottery draw` | Draw the lottery |
| `auction start [item] [price]` | Start an item auction |
| `auction end [id]` | End an auction |
| `job list` | View available jobs |
| `job apply [job]` | Apply for a job |
| `pay [user] [amount]` | Pay a member |

### 📈 Leveling Commands (20+)

| Command | Description |
|---|---|
| `rank [user]` | View XP rank and level |
| `leaderboard` | View the XP leaderboard |
| `level_set [user] [level]` | Set user level (admin) |
| `levelreset [user]` | Reset user XP (admin) |
| `prestige` | Prestige your level ⭐ |
| `rewards` | View level-up rewards |
| `xp [user]` | View raw XP stats |
| `rankcard` | View your rank card ⭐ |
| `levelboard [page]` | View paginated leaderboard |

### 🎮 Games (34+)

| Command | Description |
|---|---|
| `8ball [question]` | Ask the magic 8-ball |
| `trivia` | Play a trivia question |
| `tictactoe [user]` | Play Tic-Tac-Toe |
| `connect4 [user]` | Play Connect 4 |
| `hangman` | Play Hangman |
| `wordle` | Play Wordle |
| `wordscramble` | Unscramble a word |
| `typerace` | Typing race |
| `wordchain` | Word chain game |
| `uno [user]` | Start a game of UNO |
| `rps [choice]` | Rock, Paper, Scissors |
| `truthordare` | Truth or Dare |
| `neverhaveiever` | Never Have I Ever |
| `wouldyourather` | Would You Rather |
| `riddle` | Solve a riddle |
| `quiz` | Answer a quiz question |
| `bingo` | Play Bingo |
| `poker [amount]` | Play poker |
| `sudoku` | Play Sudoku |
| `akinator` | Play Akinator |
| `minesweeper` | Minesweeper game |

### 🎉 Giveaways (13+)

| Command | Description |
|---|---|
| `giveaway start` | Start a giveaway |
| `giveaway end [id]` | End a giveaway early |
| `giveaway reroll [id]` | Reroll the winner |
| `giveaway list` | List active giveaways |
| `giveaway pause [id]` | Pause a giveaway |
| `giveaway resume [id]` | Resume a paused giveaway |
| `giveaway edit [id]` | Edit a giveaway |
| `giveaway delete [id]` | Delete a giveaway |
| `giveaway bonus [id] [user] [entries]` | Add bonus entries |
| `giveaway requirements [id]` | Set entry requirements |
| `giveaway stats [id]` | View giveaway statistics |
| `giveaway winners [id]` | View giveaway winners |
| `giveaway template` | Create from a template |

### 🔔 Reaction Roles (16+)

| Command | Description |
|---|---|
| `reactionrole create` | Create a reaction role message |
| `reactionrole add [msg] [emoji] [role]` | Add a reaction role |
| `reactionrole remove [msg] [emoji]` | Remove a reaction role |
| `reactionrole list` | List all reaction roles |
| `reactionrole delete [msg]` | Delete a reaction role message |
| `buttonrole create` | Create button-based role menus |
| `buttonrole add` | Add a button role |
| `buttonrole remove` | Remove a button role |
| `selectrole create` | Create a dropdown role selector ⭐ |
| `selectrole addoption` | Add an option to a selector ⭐ |
| `selectrole removeoption` | Remove a selector option ⭐ |
| `selectrole delete` | Delete a selector ⭐ |
| `selectrole list` | List selectors ⭐ |
| `colorrole setup` | Set up color roles ⭐ |
| `colorrole add [role]` | Add a color role option ⭐ |
| `colorrole list` | List color roles ⭐ |

### 🎭 Roles (7+)

| Command | Description |
|---|---|
| `selfrole add [role]` | Whitelist a self-assignable role |
| `selfrole remove [role]` | Remove a self-assignable role |
| `selfrole list` | List self-assignable roles |
| `selfrole get [role]` | Pick up a self-assignable role |
| `selfrole drop [role]` | Drop a self-assignable role |
| `notificationrole add [role] [type]` | Link a role to event notifications |
| `giverole [user] [role] [duration]` | Give a role temporarily or permanently |

### 🎫 Tickets (20+)

| Command | Description |
|---|---|
| `ticket setup` | Configure the ticket system |
| `ticket panel create` | Create a ticket panel |
| `ticket panel list` | List ticket panels |
| `ticket open` | Open a new ticket |
| `ticket close` | Close a ticket |
| `ticket add [user]` | Add a user to a ticket |
| `ticket remove [user]` | Remove a user from a ticket |
| `ticket transcript` | Generate a ticket transcript ⭐ |
| `ticket archive` | Archive a closed ticket ⭐ |
| `ticket claim` | Claim a ticket |
| `ticket unclaim` | Unclaim a ticket |
| `ticket rename [name]` | Rename the ticket channel |
| `ticket move [category]` | Move a ticket |
| `ticket priority [level]` | Set ticket priority |
| `ticket note [text]` | Add a staff note |
| `ticket stats` | View ticket statistics ⭐ |
| `ticket config` | View ticket configuration |

### ✅ Verification (10+)

| Command | Description |
|---|---|
| `verify setup` | Set up the verification system |
| `verify toggle` | Enable or disable verification |
| `verify channel [channel]` | Set the verification channel |
| `verify role [role]` | Set the verified role |
| `verify method [button/captcha/math/image]` | Set the verification method |
| `verify timeout [seconds]` | Set the verification timeout |
| `verify panel` | Resend the verification panel |
| `verify kick [user]` | Kick an unverified member |
| `verify stats` | View verification statistics |
| `verify` | Start the verification process |

### 👋 Welcome (18+)

| Command | Description |
|---|---|
| `welcome setup` | Set up the welcome system |
| `welcome toggle` | Enable or disable welcome messages |
| `welcome channel [channel]` | Set the welcome channel |
| `welcome message [message]` | Set the welcome message |
| `welcome card [on/off]` | Toggle the welcome card ⭐ |
| `welcome test` | Preview the welcome message |
| `goodbye setup` | Set up goodbye messages |
| `goodbye toggle` | Enable or disable goodbye messages |
| `goodbye channel [channel]` | Set the goodbye channel |
| `goodbye message [message]` | Set the goodbye message |
| `boost channel [channel]` | Set the boost message channel |
| `boost message [message]` | Set the boost message |
| `boost toggle` | Enable or disable boost messages |
| `autoroleadd [role]` | Add an auto-role for new members |
| `autoroleremove [role]` | Remove an auto-role |
| `autorolelist` | List configured auto-roles |
| `autoroletoggle` | Toggle auto-role assignment |

### 📋 Logging (9+)

| Command | Description |
|---|---|
| `logging setup [channel]` | Configure the log channel |
| `logging enable [event]` | Enable logging for a specific event |
| `logging disable [event]` | Disable logging for an event |
| `logging list` | View all loggable events and their status |
| `logging reset` | Reset all logging settings |
| `logging status` | View current log configuration |
| `logging export` | Export the mod log as a file ⭐ |
| `logging test` | Send a test log entry |
| `logging channel [channel]` | Change the log channel |

### ⏰ Scheduler (21+)

| Command | Description |
|---|---|
| `schedule [message] [time]` | Schedule a one-time message |
| `reminder [message] [time]` | Set a personal reminder |
| `reminder list` | View your reminders |
| `reminder cancel [id]` | Cancel a reminder |
| `birthday set [date]` | Set your birthday |
| `birthday list` | View server birthdays |
| `birthday channel [channel]` | Set the birthday announcement channel |
| `birthday unset` | Remove your birthday |
| `event create` | Create a server event ⭐ |
| `event list` | List server events ⭐ |
| `event cancel [id]` | Cancel an event ⭐ |
| `autopost setup` | Set up recurring posts ⭐ |
| `autopost list` | List auto-posts ⭐ |
| `autopost disable [id]` | Disable an auto-post ⭐ |
| `poll create [question]` | Create a poll |
| `poll end [id]` | End a poll |
| `poll results [id]` | View poll results |

### 🎛️ Settings (14+)

| Command | Description |
|---|---|
| `settings` | View all server settings and bot info |
| `prefix [prefix]` | Set or view the command prefix |
| `language [en/fil]` | Set server language (English or Filipino) |
| `ping` | Check bot latency |
| `help [command/category]` | Browse commands or get command details |
| `changelog` | View the latest changelog |
| `vote` | Get bot vote links |
| `invite` | Get the bot invite link |
| `support` | Get the support server link |
| `premium` | View premium plans and activate |

### 🛠️ Utility (131+)

A broad collection of utility commands covering user/server info, fun tools, web lookups, and more.

| Command | Description |
|---|---|
| `userinfo [user]` | View detailed user information |
| `serverinfo` | View server information |
| `avatar [user]` | View a user's avatar |
| `banner [user]` | View a user's banner |
| `roleinfo [role]` | View role information |
| `channelinfo [channel]` | View channel information |
| `weather [city]` | Get current weather |
| `time [timezone]` | Get current time in a timezone |
| `translate [text] [lang]` | Quick translate text |
| `timezone set [tz]` | Set your timezone |
| `poll [question]` | Create a quick poll |
| `embed [text]` | Send an embedded message |
| `announce [message]` | Send an announcement |
| `say [message]` | Make the bot say something |
| `choose [options]` | Choose randomly from options |
| `random [min] [max]` | Generate a random number |
| `roll [dice]` | Roll dice (e.g. 2d6) |
| `coinflip` | Flip a coin |
| `8ball [question]` | Ask the magic 8-ball |
| `ship [user1] [user2]` | Ship two users |
| `rate [thing]` | Rate something |
| `qr [text]` | Generate a QR code |
| `shorten [url]` | Shorten a URL |
| `wikipedia [query]` | Search Wikipedia |
| `urban [word]` | Look up a word on Urban Dictionary |
| `define [word]` | Dictionary definition |
| `calculate [expression]` | Calculate a math expression |
| `convert [value] [unit]` | Unit conversion |
| `color [hex]` | View a color |
| `base64 [text]` | Encode/decode Base64 |
| `uuid` | Generate a UUID |
| `timestamp [date]` | Convert date to Discord timestamp |
| `emoji [emoji]` | View emoji info |
| `permissions [user]` | View user permissions |
| `botinfo` | View bot information |
| `uptime` | View bot uptime |
| `tos [user]` | Check account age against ToS |
| `remindme [time] [message]` | Set a reminder |
| `snipe` | View the last deleted message |
| `editsnipe` | View the last edited message |
| `afk [reason]` | Set AFK status |
| `unafk` | Remove AFK status |
| `suggest [idea]` | Submit a suggestion |
| `bugreport [description]` | Submit a bug report |
| `feedback [message]` | Send feedback |
| `screenshot [url]` | Screenshot a webpage |
| `github [user/repo]` | Look up a GitHub user or repo |
| `npm [package]` | Look up an npm package |
| `steam [game]` | Look up a Steam game |
| `movie [title]` | Look up a movie |
| `anime [title]` | Look up an anime |
| `manga [title]` | Look up a manga |
| `lyrics [song]` | Quick lyrics lookup |
| `meme` | Get a random meme |
| `joke` | Get a random joke |
| `fact` | Get a random fact |
| `quote` | Get a random inspirational quote |
| `cat` | Get a random cat image |
| `dog` | Get a random dog image |
| `duck` | Get a random duck image |
| `fox` | Get a random fox image |
| `panda` | Get a random panda image |
| `bird` | Get a random bird image |
| `flip [text]` | Flip text upside down |
| `reverse [text]` | Reverse text |
| `upper [text]` | Convert text to uppercase |
| `lower [text]` | Convert text to lowercase |
| `charcount [text]` | Count characters/words |
| `mock [text]` | SaRcAsTiC TeXt |
| `spoiler [text]` | Wrap text in spoiler tags |
| `ascii [text]` | Convert to ASCII art |
| `caesar [text] [shift]` | Caesar cipher encrypt/decrypt |
| `binary [text]` | Convert to/from binary |
| `morse [text]` | Convert to/from Morse code |
| `piglatin [text]` | Convert to Pig Latin |
| `countdown [date]` | Countdown to a date |
| `howlong [user]` | How long a user has been in the server |
| `oldest` | Find the oldest accounts in the server |
| `newest` | Find the newest members |
| `membercount` | View server member count |
| `boostcount` | View boost count and level |
| `invitecount [user]` | View invite count |
| `invites` | View top inviters |
| `timezone list` | List popular timezones |
| `year` | Days remaining in the year |
| `tournament` | Tournament bracket |
| `votereminder` | Set a bot vote reminder |

---

## Premium Plans

Premium is **permanent** — one payment, no subscriptions, no expiry.

| Plan | Price | Best For |
|---|---|---|
| 🥈 Basic | ₱50 | Small servers and friend groups |
| 🥇 Standard | ₱150 | Medium communities |
| 👑 Gold | ₱350 | Large, active servers |
| 💠 Enterprise | ₱600 | Organizations, e-sports teams, networks |

### Server Packs

| Pack | Servers | Price |
|---|---|---|
| 📦 3-Server Pack | 3 | ₱499 |
| 📦 5-Server Pack | 5 | ₱799 |
| 📦 10-Server Pack | 10 | ₱1,199 |

Every higher tier includes all features from lower tiers — more features, never fewer.

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20 LTS or newer |
| pnpm | 11.x (`npm i -g pnpm@11`) |
| MongoDB | Atlas (free tier works) |

### Installation

```bash
# Clone the repository
git clone https://github.com/panindigan/panindigan-official.git
cd panindigan-official

# Install dependencies
pnpm install
```

### Configuration

1. **Copy the environment file and fill in your secrets:**

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Your bot token from the Discord Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Your application's Client ID |
| `MONGODB_URI` | ✅ | MongoDB connection string (e.g. MongoDB Atlas) |
| `SESSION_SECRET` | ✅ | Random secret for the REST API session |
| `BOT_OWNER_IDS` | ✅ | Comma-separated Discord user IDs with owner access |
| `OPENAI_API_KEY` | ⚠️ | Required for AI commands (`chat`, `translate`, `imagegen`, etc.) |
| `LAVALINK_HOST` | ⚠️ | Required for music commands |
| `LAVALINK_PORT` | ⚠️ | Lavalink server port (default: 2333) |
| `LAVALINK_PASSWORD` | ⚠️ | Lavalink server password |
| `API_PORT` | ✅ | REST API port (default: 3001) |
| `NODE_ENV` | ✅ | `development` or `production` |

2. **Configure `config.json`** for non-sensitive settings (prefix, economy amounts, colors, tier pricing, etc.).

3. **Register slash commands:**

```bash
pnpm run deploy-commands
```

### Running the Bot

```bash
# Development (hot-reload)
pnpm run dev

# Production (compile first)
pnpm run build
pnpm start
```

---

## Music Setup (Lavalink)

Music commands require a running Lavalink v4 server. If Lavalink is not configured, all music commands fail gracefully with a clear error message — the rest of the bot is unaffected.

**Recommended:** [Lavalink v4](https://github.com/lavalink-devs/Lavalink)

Set `LAVALINK_HOST`, `LAVALINK_PORT`, and `LAVALINK_PASSWORD` in your `.env` to enable music.

---

## Architecture

```
src/
├── commands/          # All commands organized by category
│   ├── admin/         # Server configuration and admin tools
│   ├── ai/            # OpenAI-powered commands
│   ├── economy/       # Full economy system
│   ├── games/         # Games and mini-games
│   ├── giveaways/     # Giveaway management
│   ├── leveling/      # XP and leveling system
│   ├── logging/       # Event logging
│   ├── moderation/    # Moderation tools
│   ├── music/         # Lavalink-powered music
│   ├── owner/         # Bot owner only commands
│   ├── reaction-roles/ # Role menu systems
│   ├── scheduler/     # Scheduled tasks and birthdays
│   ├── settings/      # Server-level settings
│   ├── tickets/       # Ticket system
│   ├── utility/       # General utility commands
│   ├── verification/  # Member verification
│   └── welcome/       # Welcome, goodbye, boost messages
├── database/
│   ├── models/        # Mongoose schemas (Guild, User, Moderation, etc.)
│   └── connection.ts  # MongoDB connection with retry logic
├── events/            # Discord.js event handlers
├── features/          # Core business logic engines
│   ├── ai/            # OpenAI client
│   ├── automod/       # AutoMod detection engine
│   ├── economy/       # Job and economy processors
│   ├── leveling/      # XP calculation engine
│   ├── logging/       # Log event dispatcher
│   ├── moderation/    # Case management engine
│   ├── music/         # Lavalink music manager
│   └── scheduler/     # Cron-based task schedulers
├── handlers/          # Command and event loader
├── structures/        # Client, types, and registries
├── utils/             # Shared utilities (embeds, logger, permissions, cache)
├── api/               # Express REST API
└── index.ts           # Entry point
```

### Command Pattern

All commands follow a unified `RunContext` pattern that works identically for slash commands and prefix commands:

```typescript
import type { CommandDefinition } from "@/structures/types";

const command: CommandDefinition = {
  name: "example",
  description: "An example command",
  category: "Utility",
  access: "general",      // "general" | "moderator" | "admin" | "owner"
  premium: false,         // true = ⭐ Premium only
  guildOnly: true,
  cooldown: 5,
  aliases: ["ex"],
  slashData: (b) => b.addStringOption((o) => o.setName("text").setDescription("Input").setRequired(true)),
  async execute(ctx) {
    const text = ctx.isSlash
      ? ctx.interaction!.options.getString("text", true)
      : ctx.args.join(" ");
    await ctx.reply({ content: `You said: ${text}` });
  },
};
export default command;
```

## Language Support

Panindigan supports both **English** and **Filipino/Tagalog**:

- All command descriptions and bot responses are in **English by default**
- Server admins can switch to Filipino with `/language fil`
- Members can query bot language with `/language`
- Commands: `/language en` (English) | `/language fil` (Filipino/Tagalog)

## Access Tiers

| Tier | Who |
|---|---|
| `general` | All server members |
| `moderator` | Members with Manage Members permission or a configured Mod Role |
| `admin` | Members with Administrator permission or a configured Admin Role |
| `coowner` | Configured co-owner IDs |
| `owner` | Bot owner ID(s) in `BOT_OWNER_IDS` |

---

## Security & Privacy

- 🔒 All sensitive data is stored encrypted at rest
- 🚫 No data selling — your server's data stays yours
- 🗑️ Data deletion available on request
- 🔐 Credentials are stored via environment variables, never in code
- 🛡️ Anti-nuke system with configurable thresholds and punishment
- 🔍 Global ban and blacklist system for cross-server protection

---

## AI Features

Requires `OPENAI_API_KEY`. Enables 22+ commands including:

`chat` · `translate` · `summarize` · `code` · `codeexplain` · `grammar` · `rewrite` · `analyze` · `moderate` · `imagegen` · `voicetotext` · `texttoimage` · `autoresponse` · `faq` · `ticketassist` · `persona`

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start in development mode with hot-reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled bot from `dist/` |
| `pnpm run deploy-commands` | Register slash commands globally |
| `pnpm run typecheck` | Type-check without emitting output |

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Follow the existing command pattern (`@/structures/types` + `RunContext`)
4. Open a pull request with a clear description

---

<div align="center">

**🇵🇭 Made with ❤️ for Filipino communities**

*Panindigan — to stand up for, to defend, to champion.*

</div>
