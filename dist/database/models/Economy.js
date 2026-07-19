import mongoose, { Schema, model } from "mongoose";
// ── Market Listings ─────────────────────────────────────────────────────────
const marketListingSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true },
    item: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 1 },
    quantity: { type: Number, required: true, default: 1 },
    available: { type: Boolean, default: true },
}, { timestamps: true });
// ── Auctions ─────────────────────────────────────────────────────────────────
const auctionSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    hostId: { type: String, required: true },
    item: { type: String, required: true },
    description: { type: String, default: "" },
    startingBid: { type: Number, required: true },
    currentBid: { type: Number, required: true },
    highestBidderId: { type: String, default: null },
    endsAt: { type: Date, required: true },
    ended: { type: Boolean, default: false },
}, { timestamps: true });
// ── Trades ───────────────────────────────────────────────────────────────────
const tradeSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    offererId: { type: String, required: true },
    targetId: { type: String, required: true },
    offeredCoins: { type: Number, default: 0 },
    requestedCoins: { type: Number, default: 0 },
    offeredItems: { type: [String], default: [] },
    requestedItems: { type: [String], default: [] },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined", "expired"],
        default: "pending",
    },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
export const MarketListingModel = (mongoose.models["MarketListing"] ?? model("MarketListing", marketListingSchema));
export const AuctionModel = (mongoose.models["Auction"] ?? model("Auction", auctionSchema));
export const TradeModel = (mongoose.models["Trade"] ?? model("Trade", tradeSchema));
//# sourceMappingURL=Economy.js.map