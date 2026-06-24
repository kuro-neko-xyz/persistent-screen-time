import { Client } from "pg";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

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

  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS app_categories (
      app_id VARCHAR(255) NOT NULL,
      category_id INTEGER NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (app_id) REFERENCES apps(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      PRIMARY KEY (app_id, category_id)
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

  console.log("Retrieving apps data from iTunes API...");

  await client.query("BEGIN");

  try {
    const appsData = await client.query("SELECT id FROM apps");
    const itunesUrl = "https://itunes.apple.com/lookup?bundleId=";

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const publicIconsDir = path.resolve(__dirname, "../../../app/public/icons");

    for (const app of appsData.rows) {
      const appID = app.id;

      const response = await fetch(itunesUrl + appID);
      const data = await response.json();

      if (data.resultCount > 0) {
        const appInfo = data.results[0];
        const imageUrl = appInfo.artworkUrl60 || null;
        const categories = appInfo.genres || [];
        const categoryIDs = appInfo.genreIds || [];
        const primaryCategoryID = appInfo.primaryGenreId || null;

        await client.query(
          `
          UPDATE apps
          SET image_url = $1
          WHERE id = $2;
        `,
          [imageUrl, appID],
        );

        for (const categoryName of categories) {
          const categoryID = categoryIDs[categories.indexOf(categoryName)];

          await client.query(
            `
              INSERT INTO categories(id, name)
              VALUES ($1, $2)
              ON CONFLICT (id) DO NOTHING;
            `,
            [categoryID, categoryName],
          );

          await client.query(
            `
              INSERT INTO app_categories(app_id, category_id, is_primary)
              VALUES ($1, $2, $3)
              ON CONFLICT (app_id, category_id) DO NOTHING;
            `,
            [appID, categoryID, categoryID === String(primaryCategoryID)],
          );
        }
      } else {
        const filename = `${appID}.png`;
        const filePath = path.join(publicIconsDir, filename);

        if (!fs.existsSync(filePath)) {
          const { stdout } = await execAsync(
            `mdfind "kMDItemCFBundleIdentifier == '${appID}'"`,
          );

          const paths = stdout.trim().split("\n");

          if (paths.length > 0) {
            const appPath = paths[0];
            const plistPath = path.join(appPath, "Contents", "Info.plist");
            const resourcesPath = path.join(appPath, "Contents", "Resources");

            if (fs.existsSync(plistPath) && fs.existsSync(resourcesPath)) {
              const { stdout } = await execAsync(
                `/usr/libexec/PlistBuddy -c "Print :CFBundleIconFile" "${plistPath}"`,
              );

              let icnsFile = stdout.trim();

              if (!icnsFile.endsWith(".icns")) {
                icnsFile += ".icns";
              }

              if (icnsFile) {
                const icnsPath = path.join(resourcesPath, icnsFile);
                await execAsync(
                  `sips -s format png -z 60 60 "${icnsPath}" --out "${filePath}"`,
                );

                const iconUrl = `/icons/${filename}`;

                await client.query(
                  `
                  UPDATE apps
                  SET image_url = $1
                  WHERE id = $2;
                `,
                  [iconUrl, appID],
                );
              }
            }
          }
        }

        await execAsync(`sips -s format png -z 60 60 Applications/`);
      }
    }
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("------- Error retrieving apps data -------");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);

    if (error.stderr) console.error("Shell STDERR:", error.stderr);
    if (error.stdout) console.error("Shell STDOUT:", error.stdout);

    process.exit(1);
  }

  await client.query("COMMIT");
  console.log("Apps data retrieved and updated successfully.");

  await client.end();
}

export default seedDatabase;
