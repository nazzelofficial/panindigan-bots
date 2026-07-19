import mongoose, { Schema, model, type InferSchemaType } from "mongoose";

const ticketPanelSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    categoryId: { type: String, default: null },
    supportRoleIds: { type: [String], default: [] },
    embedTitle: { type: String, default: "Support Tickets" },
    embedDescription: { type: String, default: "Click the button below to open a ticket." },
  },
  { timestamps: true },
);

const ticketSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    ticketNumber: { type: Number, required: true },
    channelId: { type: String, required: true, unique: true },
    openerId: { type: String, required: true },
    panelId: { type: Schema.Types.ObjectId, ref: "TicketPanel", default: null },
    claimedBy: { type: String, default: null },
    status: { type: String, enum: ["open", "closed", "archived"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high", "emergency"], default: "medium" },
    participants: { type: [String], default: [] },
    closedBy: { type: String, default: null },
    closedReason: { type: String, default: null },
    rating: { type: Number, default: null },
    ratingComment: { type: String, default: null },
    transcriptUrl: { type: String, default: null },
  },
  { timestamps: true },
);
ticketSchema.index({ guildId: 1, ticketNumber: 1 }, { unique: true });

export type TicketDocument = InferSchemaType<typeof ticketSchema>;
export const TicketPanelModel = ((mongoose.models["TicketPanel"] as any) ?? model("TicketPanel", ticketPanelSchema));
export const TicketModel = ((mongoose.models["Ticket"] as any) ?? model("Ticket", ticketSchema));
