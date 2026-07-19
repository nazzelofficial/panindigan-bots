import mongoose, { Schema, model, type InferSchemaType } from "mongoose";

const AutoModSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    antiSpam: { type: Boolean, default: false },
    antiRaid: { type: Boolean, default: false },
    antiLink: { type: Boolean, default: false },
    antiInvite: { type: Boolean, default: false },
    antiMentionLimit: { type: Number, default: 0 }, // 0 = disabled
    antiNsfw: { type: Boolean, default: false },
    antiScam: { type: Boolean, default: false },
    antiToxicity: { type: Boolean, default: false },
    antiAlt: { type: Boolean, default: false },
    antiBot: { type: Boolean, default: false },
    antiFlood: { type: Boolean, default: false },
    antiMassJoin: { type: Boolean, default: false },
    antiGhostPing: { type: Boolean, default: false },
    antiCaps: { type: Boolean, default: false },
    capsPercent: { type: Number, default: 70 },
    whitelistUsers: { type: [String], default: [] },
    whitelistRoles: { type: [String], default: [] },
    whitelistChannels: { type: [String], default: [] },
    linkWhitelistDomains: { type: [String], default: [] },
    badWords: { type: [String], default: [] },
  },
  { _id: false },
);

const AntiNukeSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    whitelistUsers: { type: [String], default: [] },
    whitelistRoles: { type: [String], default: [] },
    thresholds: {
      channelDelete: { type: Number, default: 3 },
      channelCreate: { type: Number, default: 5 },
      roleDelete: { type: Number, default: 3 },
      ban: { type: Number, default: 3 },
      kick: { type: Number, default: 5 },
      webhookCreate: { type: Number, default: 3 },
    },
    windowSeconds: { type: Number, default: 10 },
    punishment: { type: String, enum: ["ban", "kick", "strip-roles"], default: "strip-roles" },
  },
  { _id: false },
);

const LoggingSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channels: { type: Map, of: String, default: {} }, // eventKey -> channelId
    disabledEvents: { type: [String], default: [] },
    ignoredChannels: { type: [String], default: [] },
    ignoredUsers: { type: [String], default: [] },
    ignoredRoles: { type: [String], default: [] },
  },
  { _id: false },
);

const WelcomeSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "Welcome to {server}, {mention}! You are member #{memberCount}." },
    embed: { type: Boolean, default: true },
    cardTemplate: { type: String, default: "default" },
    cardBackgroundUrl: { type: String, default: null },
  },
  { _id: false },
);

const GoodbyeSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "{user} has left {server}. We now have {memberCount} members." },
  },
  { _id: false },
);

const BoostMessageSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "🎉 {user} just boosted the server! Thank you!" },
  },
  { _id: false },
);

const VerificationSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    method: { type: String, enum: ["button", "captcha", "math", "image"], default: "button" },
    roleId: { type: String, default: null },
    channelId: { type: String, default: null },
    logChannelId: { type: String, default: null },
    timeoutMinutes: { type: Number, default: 10 },
  },
  { _id: false },
);

const TicketSettingsSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    logChannelId: { type: String, default: null },
    categoryId: { type: String, default: null },
    supportRoleId: { type: String, default: null },
    blacklistedUserIds: { type: [String], default: [] },
    nextTicketNumber: { type: Number, default: 1 },
  },
  { _id: false },
);

const LevelingSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    announceChannelId: { type: String, default: null },
    announceMessage: { type: String, default: "🎉 GG {mention}, you've reached level **{level}**!" },
    announceInDm: { type: Boolean, default: false },
    xpMultiplier: { type: Number, default: 1 },
    ignoredChannels: { type: [String], default: [] },
    rewards: {
      type: [
        new Schema(
          { level: { type: Number, required: true }, roleId: { type: String, required: true } },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { _id: false },
);

const EconomySchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    multiplier: { type: Number, default: 1 },
  },
  { _id: false },
);

const CustomCommandSchema = new Schema(
  {
    name: { type: String, required: true },
    response: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const AiAutoResponseSchema = new Schema(
  {
    trigger: { type: String, required: true },
    response: { type: String, default: null }, // null = generate with AI dynamically
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const AiSettingsSchema = new Schema(
  {
    ticketAssist: { type: Boolean, default: false },
    personaName: { type: String, default: null },
    personaPrompt: { type: String, default: null },
    language: { type: String, default: "en" },
    aiModerationEnabled: { type: Boolean, default: false },
    autoResponses: { type: [AiAutoResponseSchema], default: [] },
  },
  { _id: false },
);

const AiFaqItemSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const AutopostConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    channelId: { type: String, required: true },
    message: { type: String, required: true },
    interval: { type: String, required: true }, // cron expression
    enabled: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
  },
  { _id: false },
);

const CommandPermissionSchema = new Schema(
  {
    command: { type: String, required: true },
    roleIds: { type: [String], default: [] },
  },
  { _id: false },
);

const guildSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, default: "!" },
    language: { type: String, default: "en", enum: ["en", "fil", "ceb", "ilo", "ja", "ko"] },

    adminRoleIds: { type: [String], default: [] },
    modRoleIds: { type: [String], default: [] },
    djRoleIds: { type: [String], default: [] },
    muteRoleId: { type: String, default: null },
    verifiedRoleId: { type: String, default: null },
    premiumRoleId: { type: String, default: null },

    disabledCommands: { type: [String], default: [] },
    disabledChannelCommands: {
      type: [new Schema({ channelId: String, command: String }, { _id: false })],
      default: [],
    },
    ignoredChannels: { type: [String], default: [] },
    ignoredUsers: { type: [String], default: [] },
    ignoredRoles: { type: [String], default: [] },
    commandPermissions: { type: [CommandPermissionSchema], default: [] },
    commandCooldowns: { type: Map, of: Number, default: {} },

    customCommands: { type: [CustomCommandSchema], default: [] },

    automod: { type: AutoModSchema, default: () => ({}) },
    antinuke: { type: AntiNukeSchema, default: () => ({}) },
    logging: { type: LoggingSchema, default: () => ({}) },
    welcome: { type: WelcomeSchema, default: () => ({}) },
    goodbye: { type: GoodbyeSchema, default: () => ({}) },
    boostMessage: { type: BoostMessageSchema, default: () => ({}) },
    verification: { type: VerificationSchema, default: () => ({}) },
    tickets: { type: TicketSettingsSchema, default: () => ({}) },
    leveling: { type: LevelingSchema, default: () => ({}) },
    economy: { type: EconomySchema, default: () => ({}) },

    shopItems: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String, default: "" },
            stock: { type: Number, default: -1 }, // -1 = unlimited
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    autoRoleIds: { type: [String], default: [] },
    autoRoleEnabled: { type: Boolean, default: true },
    autoRoleBotId: { type: String, default: null },
    autoNicknameFormat: { type: String, default: null },

    suggestionChannelId: { type: String, default: null },
    suggestionVotesEnabled: { type: Boolean, default: true },

    locked: { type: Boolean, default: false },
    lockedReason: { type: String, default: null },

    coverMode: { type: Boolean, default: false },

    raidMode: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          reason: { type: String, default: null },
          enabledAt: { type: Date, default: null },
          enabledBy: { type: String, default: null },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    music: {
      type: new Schema(
        {
          mode247: { type: Boolean, default: false },
          channelId247: { type: String, default: null },
          djMode: { type: Boolean, default: false },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    starboard: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          channelId: { type: String, default: null },
          threshold: { type: Number, default: 3 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    socials: { type: Map, of: String, default: {} },

    reactionRoles: {
      type: [
        new Schema(
          {
            type: { type: String, enum: ["reaction", "button", "select", "color", "notification"], required: true },
            messageId: { type: String },
            channelId: { type: String },
            emoji: { type: String },
            roleId: { type: String },
            roleIds: { type: [String] },
            label: { type: String },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    colorRoles: {
      type: new Schema(
        { roleIds: { type: [String], default: [] } },
        { _id: false },
      ),
      default: () => ({}),
    },

    notificationRoles: {
      type: [new Schema({ roleId: { type: String, required: true }, description: { type: String, default: "" } }, { _id: false })],
      default: [],
    },

    vanityUrlCode: { type: String, default: null },
    onboarding: {
      enabled: { type: Boolean, default: false },
      steps: {
        type: [new Schema({ id: String, title: String, description: String }, { _id: false })],
        default: [],
      },
    },

    // Self-assignable roles
    selfRoleIds: { type: [String], default: [] },

    // Boost perks
    boostPerkRoleIds: {
      type: [new Schema({ roleId: String, description: { type: String, default: "" } }, { _id: false })],
      default: [],
    },

    // Appeal channel
    appealChannelId: { type: String, default: null },

    // Mod rotation schedule
    modRotation: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          userIds: { type: [String], default: [] },
          interval: { type: String, enum: ["daily", "weekly", "biweekly"], default: "weekly" },
          currentIndex: { type: Number, default: 0 },
          channelId: { type: String, default: null },
          lastRotationAt: { type: Date, default: null },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // XP boost event
    xpBoostEvent: {
      type: new Schema(
        {
          active: { type: Boolean, default: false },
          multiplier: { type: Number, default: 2 },
          expiresAt: { type: Date, default: null },
          startedBy: { type: String, default: null },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Economy event
    economyEvent: {
      type: new Schema(
        {
          active: { type: Boolean, default: false },
          type: { type: String, default: null },
          expiresAt: { type: Date, default: null },
          startedBy: { type: String, default: null },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Join gate (anti-alt, minimum account age)
    joinGate: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          minAccountAgeDays: { type: Number, default: 7 },
          kickMessage: { type: String, default: null },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  { timestamps: true },
);

export type GuildDocument = InferSchemaType<typeof guildSchema>;
export const GuildModel = ((mongoose.models["Guild"] as any) ?? model("Guild", guildSchema));
