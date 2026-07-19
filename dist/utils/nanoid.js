/** Lightweight ID generator — no external dep. */
export function nanoid(size = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < size; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}
//# sourceMappingURL=nanoid.js.map