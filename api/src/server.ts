import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import postgres from "@fastify/postgres";
import {
  Activity,
  ActivityRequestParams,
} from "@persistent-screen-time/shared";
import calculateBoundaries from "./utils/calculateBoundaries.js";
import getAverageDailyTime from "./queries/getAverageDailyTime.js";
import getDay from "./queries/getDay.js";

dotenv.config();

const fastify = Fastify({
  logger: true,
});

fastify.register(cors, {
  origin: process.env.APP_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

fastify.register(postgres, {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

fastify.get<{
  Querystring: ActivityRequestParams;
  Reply: Activity;
}>("/activity/week", async (request, reply) => {
  const { date: dateString, device: deviceUUID } = request.query;

  const { sundayBoundary, saturdayBoundary } = calculateBoundaries(dateString);

  const client = await fastify.pg.connect();

  const { rows: averageDailyTimeRows } = await getAverageDailyTime(
    client,
    sundayBoundary,
    saturdayBoundary,
    deviceUUID,
  );

  const { rows: dayRows } = await getDay(
    client,
    sundayBoundary,
    saturdayBoundary,
    deviceUUID,
  );

  const { rows: applicationRows } = await client.query(
    `
      SELECT
        app_id,
        apps.name AS app_name,
        apps.image_url AS app_image_url,
        SUM(end_time - init_time) AS total_time_spent
      FROM
        events
      JOIN
        apps ON events.app_id = apps.id
      WHERE
        init_time >= $1
        AND init_time <= $2
        AND ($3::uuid IS NULL OR device_uuid = $3)
      GROUP BY
        app_id,
        app_name,
        app_image_url
      ORDER BY
        total_time_spent DESC;
    `,
    [sundayBoundary, saturdayBoundary, deviceUUID || null],
  );

  client.release();

  return {
    averageDailyTime: averageDailyTimeRows[0].average_daily_time,
    applications: applicationRows.map((row) => ({
      id: row.app_id,
      name: row.app_name,
      imageUrl: row.app_image_url,
      totalTimeSpent: row.total_time_spent,
    })),
    days: dayRows.map((row) => ({
      date: row.date,
      totalTimeSpent: row.total_time_spent,
    })),
  };
});

fastify.get<{
  Querystring: ActivityRequestParams;
  Reply: Activity;
}>("/activity/week/category", async (request, reply) => {
  const { date: dateString, device: deviceUUID } = request.query;

  const { sundayBoundary, saturdayBoundary } = calculateBoundaries(dateString);

  const client = await fastify.pg.connect();

  const { rows: averageDailyTimeRows } = await getAverageDailyTime(
    client,
    sundayBoundary,
    saturdayBoundary,
    deviceUUID,
  );

  const { rows: dayRows } = await getDay(
    client,
    sundayBoundary,
    saturdayBoundary,
    deviceUUID,
  );

  const { rows: categoryRows } = await client.query(
    `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        SUM(e.end_time - e.init_time) AS total_time_spent
      FROM
        events e
      JOIN
        apps a ON e.app_id = a.id
      JOIN
        app_categories ac ON a.id = ac.app_id
      JOIN
        categories c ON ac.category_id = c.id
      WHERE
        e.init_time >= $1
        AND e.init_time <= $2
        AND ($3::uuid IS NULL OR e.device_uuid = $3)
        AND ac.is_primary = TRUE
      GROUP BY
        c.id,
        category_name
      ORDER BY
        total_time_spent DESC;
    `,
    [sundayBoundary, saturdayBoundary, deviceUUID || null],
  );

  client.release();

  return {
    averageDailyTime: averageDailyTimeRows[0].average_daily_time,
    categories: categoryRows.map((row) => ({
      id: row.category_id,
      name: row.category_name,
      totalTimeSpent: row.total_time_spent,
    })),
    days: dayRows.map((row) => ({
      date: row.date,
      totalTimeSpent: row.total_time_spent,
    })),
  };
});

fastify.get<{
  Querystring: ActivityRequestParams;
}>("/activity/day", async (request, reply) => {
  const { date } = request.query;

  const startDate = new Date(`${date}T00:00:00`);

  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  if (!date) {
    return [];
  }

  const client = await fastify.pg.connect();

  const { rows } = await client.query(
    `
      SELECT 
        e.app_id,
        a.name AS app_name,
        COUNT(*) AS total_sessions,
        SUM(e.end_time - e.init_time) AS total_time_spent
      FROM 
        events e
      JOIN 
        apps a ON e.app_id = a.id
      WHERE 
        e.init_time >= $1
        AND e.init_time < $2
      GROUP BY 
        e.app_id,
        a.name
      ORDER BY 
        total_time_spent DESC;
    `,
    [startDate, endDate],
  );

  client.release();

  return rows;
});

fastify.get("/devices", async (request, reply) => {
  const client = await fastify.pg.connect();

  const { rows } = await client.query(
    `
      SELECT * FROM devices;
    `,
  );

  client.release();

  return rows;
});

const start = async () => {
  try {
    await fastify.listen({ host: "0.0.0.0", port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

module.exports = fastify;
