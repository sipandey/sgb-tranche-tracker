import cron from "node-cron";
import { runIngest } from "../src/lib/ingest";

console.log("SGB worker started — weekday 18:30 IST (~13:00 UTC) ingest");

// NSE cash market usually closes 15:30 IST; bhavcopy often ready later.
// Run Mon–Fri at 13:00 UTC ≈ 18:30 IST
cron.schedule("0 13 * * 1-5", async () => {
  console.log(new Date().toISOString(), "Scheduled ingest starting");
  try {
    const result = await runIngest();
    console.log(JSON.stringify(result));
  } catch (e) {
    console.error("Ingest failed", e);
  }
});

// Keep process alive
setInterval(() => {}, 1 << 30);
