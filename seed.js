const { Client } = require("pg");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
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
      init_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      device_uuid UUID NOT NULL,
      app_id VARCHAR(255) NOT NULL,
      FOREIGN KEY (device_uuid) REFERENCES devices(uuid),
      FOREIGN KEY (app_id) REFERENCES apps(id),
      PRIMARY KEY (init_time, device_uuid, app_id)
    );
  `);

  console.log("Reading file...");

  const rawIphoneData = fs.readFileSync("iphone_usage.json");
  const iphone = JSON.parse(rawIphoneData);

  console.log(`Found ${iphone.length} records. Inserting...`);

  const insertQuery = `
    INSERT INTO events (init_time, end_time, device_uuid, app_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (init_time, device_uuid, app_id) DO NOTHING
  `;

  await client.query("BEGIN");

  try {
    for (const device of iphone) {
      const deviceUUID = device.device_id;

      try {
        await client.query(
          `
            INSERT INTO devices(uuid)
            VALUES ($1)
            ON CONFLICT (uuid) DO NOTHING
          `,
          [deviceUUID],
        );
      } catch (error) {
        console.error("Error inserting data:", error);
      }

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
            ON CONFLICT (id) DO NOTHING
          `,
          [appID, appName],
        );

        await client.query(insertQuery, [initTime, endTime, deviceUUID, appID]);
      }

      await client.query("COMMIT");
      console.log("Database seeded successfully.");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error inserting data:", error);
  } finally {
    await client.end();
  }
}

seedDatabase();

module.exports = client;
