import mongoose, { Schema, model, type InferSchemaType } from "mongoose";

const premiumHistoryEntrySchema = new Schema(
  {
    action: { type: String, enum: ["grant", "revoke", "upgrade", "downgrade", "refund"], required: true },
    tier: { type: String, default: null },
    moderatorId: { type: String, required: true },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

const premiumSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: ["free", "basic", "standard", "gold", "enterprise"], default: "free" },
    grantedBy: { type: String, default: null },
    packId: { type: Schema.Types.ObjectId, ref: "ServerPack", default: null },
    active: { type: Boolean, default: false },
    history: { type: [premiumHistoryEntrySchema], default: [] },
  },
  { timestamps: true },
);

const premiumCodeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: ["basic", "standard", "gold", "enterprise"], required: true },
    createdBy: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedBy: { type: String, default: null },
    usedInGuildId: { type: String, default: null },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const serverPackSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    packType: { type: String, enum: ["pack3", "pack5", "pack10"], required: true },
    guildIds: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const priceHistorySchema = new Schema(
  {
    target: { type: String, required: true }, // tier name or pack name
    kind: { type: String, enum: ["tier", "pack", "discount"], required: true },
    oldValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
    changedBy: { type: String, required: true },
  },
  { timestamps: true },
);

const licenseSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    licenseKey: { type: String, required: true, unique: true },
    whiteLabelName: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const betaFlagSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true },
  },
  { timestamps: true },
);

const rateLimitExemptSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true },
  },
  { timestamps: true },
);

export type PremiumDocument = InferSchemaType<typeof premiumSchema>;
export const PremiumModel = ((mongoose.models["Premium"] as any) ?? model("Premium", premiumSchema));
export const PremiumCodeModel = ((mongoose.models["PremiumCode"] as any) ?? model("PremiumCode", premiumCodeSchema));
export const ServerPackModel = ((mongoose.models["ServerPack"] as any) ?? model("ServerPack", serverPackSchema));
export const PriceHistoryModel = ((mongoose.models["PriceHistory"] as any) ?? model("PriceHistory", priceHistorySchema));
export const LicenseModel = ((mongoose.models["License"] as any) ?? model("License", licenseSchema));
export const BetaFlagModel = ((mongoose.models["BetaFlag"] as any) ?? model("BetaFlag", betaFlagSchema));
export const RateLimitExemptModel = ((mongoose.models["RateLimitExempt"] as any) ?? model("RateLimitExempt", rateLimitExemptSchema));
