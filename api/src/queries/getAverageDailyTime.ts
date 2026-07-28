import { PoolClient } from "pg";

const getAverageDailyTime = async (
  client: PoolClient,
  sundayBoundary: string,
  saturdayBoundary: string,
  deviceUUID?: string,
  dayOfTheWeek?: number,
) => {
  return client.query(
    `
      SELECT
        SUM(end_time - init_time) / NULLIF(COUNT(DISTINCT init_time::date), 0) AS average_daily_time
      FROM
        events
      WHERE
        init_time >= $1
        AND init_time <= $2
        AND ($3::uuid IS NULL OR device_uuid = $3)
        AND ($4::int IS NULL OR EXTRACT (DOW FROM init_time) = $4);
    `,
    [
      sundayBoundary,
      saturdayBoundary,
      deviceUUID || null,
      dayOfTheWeek ?? null,
    ],
  );
};

export default getAverageDailyTime;
