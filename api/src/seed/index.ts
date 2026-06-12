import ensureLaunchdScheduled from "./ensureLaunchdScheduled.js";
import retrieveData from "./retrieveData.js";
import seedDatabase from "./seedDatabase.js";

async function main() {
  await ensureLaunchdScheduled();
  await retrieveData();
  await seedDatabase();
}

main();
