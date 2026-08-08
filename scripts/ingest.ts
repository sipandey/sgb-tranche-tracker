import { runIngest } from "../src/lib/ingest";
import { closeDb } from "../src/lib/db";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--demo");
  const preferDate = args[0];
  const forceDemo = process.argv.includes("--demo");
  console.log(
    "Running SGB ingest…",
    preferDate || "(auto session)",
    forceDemo ? "[demo]" : ""
  );

  if (forceDemo) {
    const { seedDemoSession } = await import("../src/lib/ingest/demo");
    const result = await seedDemoSession(preferDate || "2026-08-07");
    console.log(JSON.stringify(result, null, 2));
  } else {
    const result = await runIngest(preferDate);
    console.log(JSON.stringify(result, null, 2));
  }
  closeDb();
}

main().catch((e) => {
  console.error(e);
  closeDb();
  process.exit(1);
});
