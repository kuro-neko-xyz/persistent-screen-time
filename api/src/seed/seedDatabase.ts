import { Client } from "pg";
import fs from "fs";

const client = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

async function seedDatabase() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS devices (
      uuid UUID PRIMARY KEY,
      name VARCHAR(255)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS apps (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      image_url VARCHAR(255),
      color CHAR(7)
      CHECK (color ~* '^#[0-9a-f]{6}$')
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS events (
      init_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      device_uuid UUID NOT NULL,
      app_id VARCHAR(255) NOT NULL,
      FOREIGN KEY (device_uuid) REFERENCES devices(uuid),
      FOREIGN KEY (app_id) REFERENCES apps(id),
      PRIMARY KEY (init_time, device_uuid, app_id)
    );
  `);

  const insertQuery = `
    INSERT INTO events (init_time, end_time, device_uuid, app_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (init_time, device_uuid, app_id) DO NOTHING;
  `;

  console.log("Reading file...");

  const rawIphoneData = fs.readFileSync("iphone_usage.json");
  const iphone = JSON.parse(rawIphoneData.toString("utf-8"));

  console.log(`Found ${iphone.length} records. Inserting...`);

  await client.query("BEGIN");

  try {
    for (const device of iphone) {
      const deviceUUID = device.device_id;

      await client.query(
        `
          INSERT INTO devices(uuid)
          VALUES ($1)
          ON CONFLICT (uuid) DO NOTHING;
        `,
        [deviceUUID],
      );

      for (const event of device.events) {
        const initTime = event.timestamp;
        const endTime = new Date(
          Date.parse(event.timestamp) + event.duration_seconds * 1000,
        ).toISOString();
        const appID = event.data.app;
        const appName = event.data.title;

        await client.query(
          `
            INSERT INTO apps(id, name)
            VALUES ($1, $2)
            ON CONFLICT (id)
            DO UPDATE SET name = EXCLUDED.name
            WHERE
              (apps.name IS NULL OR apps.name = '') 
              AND (EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '');
          `,
          [appID, appName],
        );

        await client.query(insertQuery, [initTime, endTime, deviceUUID, appID]);
      }

      await client.query("COMMIT");
      console.log("iPhone database seeded successfully.");
    }
  } catch (error: any) {
    await client.query("ROLLBACK");
    
    console.error("------- Error inserting data -------");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);

    if (error.stderr) console.error("Shell STDERR:", error.stderr);
    if (error.stdout) console.error("Shell STDOUT:", error.stdout);

    process.exit(1);
  }

  console.log("Reading file...");

  const rawMacData = fs.readFileSync("mac_usage.json");
  const mac = JSON.parse(rawMacData.toString("utf-8"));

  console.log(`Found ${mac.length} records. Inserting...`);

  await client.query("BEGIN");

  try {
    const deviceUUID = process.env.HARDWARE_UUID;

    await client.query(
      `
        INSERT INTO devices(uuid)
        VALUES ($1)
        ON CONFLICT (uuid) DO NOTHING;
      `,
      [deviceUUID],
    );

    for (const event of mac) {
      const initEpochTime = event.ZSTARTDATE;
      const endEpochTime = event.ZENDDATE;
      const initTime = new Date(
        (initEpochTime + 978307200) * 1000,
      ).toISOString();
      const endTime = new Date((endEpochTime + 978307200) * 1000).toISOString();
      const appID = event.ZVALUESTRING;

      await client.query(
        `
        INSERT INTO apps(id)
        VALUES ($1)
        ON CONFLICT (id) DO NOTHING;
      `,
        [appID],
      );

      await client.query(insertQuery, [initTime, endTime, deviceUUID, appID]);
    }

    await client.query("COMMIT");
    console.log("MAC database seeded successfully.");
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("------- Error inserting data -------");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);

    if (error.stderr) console.error("Shell STDERR:", error.stderr);
    if (error.stdout) console.error("Shell STDOUT:", error.stdout);

    process.exit(1);
  }

  await client.end();
}

export default seedDatabase;
