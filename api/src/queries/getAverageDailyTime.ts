import { PoolClient } from "pg";

const getAverageDailyTime = async (
  client: PoolClient,
  sundayBoundary: string,
  saturdayBoundary: string,
  deviceUUID?: string,
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
        AND ($3::uuid IS NULL OR device_uuid = $3);
    `,
    [sundayBoundary, saturdayBoundary, deviceUUID || null],
  );
};

export default getAverageDailyTime;
