export const JOBS = [
    { id: "unemployed", name: "Unemployed", description: "No job. Just vibing.", payMin: 0, payMax: 0, cooldownHours: 1 },
    { id: "cashier", name: "Cashier", description: "Scan items at the local store.", payMin: 80, payMax: 160, cooldownHours: 1 },
    { id: "delivery_rider", name: "Delivery Rider", description: "Deliver orders on your bike.", payMin: 100, payMax: 200, cooldownHours: 1 },
    { id: "programmer", name: "Programmer", description: "Write code for clients.", payMin: 200, payMax: 450, cooldownHours: 1, requiredLevel: 5 },
    { id: "teacher", name: "Teacher", description: "Educate the youth.", payMin: 150, payMax: 280, cooldownHours: 1, requiredLevel: 3 },
    { id: "chef", name: "Chef", description: "Cook meals at a restaurant.", payMin: 120, payMax: 250, cooldownHours: 1, requiredLevel: 2 },
    { id: "doctor", name: "Doctor", description: "Save lives at the hospital.", payMin: 400, payMax: 800, cooldownHours: 1, requiredLevel: 10 },
    { id: "lawyer", name: "Lawyer", description: "Represent clients in court.", payMin: 350, payMax: 700, cooldownHours: 1, requiredLevel: 8 },
    { id: "miner", name: "Miner", description: "Extract resources underground.", payMin: 180, payMax: 350, cooldownHours: 1, requiredLevel: 4 },
    { id: "fisherman", name: "Fisherman", description: "Catch fish at sea.", payMin: 90, payMax: 180, cooldownHours: 1, requiredLevel: 1 },
    { id: "farmer", name: "Farmer", description: "Grow crops and tend livestock.", payMin: 100, payMax: 190, cooldownHours: 1, requiredLevel: 1 },
    { id: "hacker", name: "Hacker", description: "Penetration testing for companies.", payMin: 300, payMax: 600, cooldownHours: 1, requiredLevel: 12 },
    { id: "streamer", name: "Streamer", description: "Stream games for subscribers.", payMin: 50, payMax: 500, cooldownHours: 1, requiredLevel: 3 },
    { id: "engineer", name: "Engineer", description: "Design and build systems.", payMin: 250, payMax: 500, cooldownHours: 1, requiredLevel: 7 },
];
export function getJob(id) {
    return JOBS.find((j) => j.id === id);
}
export function getPayForJob(job, multiplier = 1) {
    const base = Math.floor(Math.random() * (job.payMax - job.payMin + 1)) + job.payMin;
    return Math.floor(base * multiplier);
}
//# sourceMappingURL=jobs.js.map