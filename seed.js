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

  await client.end();
}

seedDatabase();

module.exports = client;
