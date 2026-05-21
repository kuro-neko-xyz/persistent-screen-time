const Fastify = require("fastify");
const cors = require("@fastify/cors");
require("dotenv").config();

const fastify = Fastify({
  logger: true,
});

fastify.register(cors, {
  origin: process.env.APP_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

fastify.register(require("@fastify/postgres"), {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

fastify.get("/activity/week", async (request, reply) => {
  const now = new Date();

  const latestSunday = new Date(now);
  latestSunday.setDate(now.getDate() - now.getDay());
  latestSunday.setHours(0, 0, 0, 0);
  const sundayBoundary = latestSunday.toISOString();

  const client = await fastify.pg.connect();

  const { rows } = await client.query(
    `
    SELECT
      SUM(end_time - init_time) / NULLIF(COUNT(DISTINCT init_time::date), 0) AS average_daily_time
    FROM
      events
    WHERE
      init_time >= $1;
  `,
    [sundayBoundary],
  );

  client.release();

  return {
    averageDailyTime: rows[0].average_daily_time,
  };
});

fastify.get("/activity/day", async (request, reply) => {
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
