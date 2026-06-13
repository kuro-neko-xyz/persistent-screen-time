import "dotenv/config";
import ensureLaunchdScheduled from "./ensureLaunchdScheduled.js";
import retrieveData from "./retrieveData.js";
import seedDatabase from "./seedDatabase.js";

process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled Promise Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught Exception:", error);
  process.exit(1);
});

async function main() {
  await ensureLaunchdScheduled();
  await retrieveData();
  await seedDatabase();
}

main();
