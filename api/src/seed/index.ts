import ensureLaunchdScheduled from "./ensureLaunchdScheduled.js";
import seedDatabase from "./seedDatabase.js";

async function main() {
  await ensureLaunchdScheduled();
  await seedDatabase();
}

main();
