import { PoolClient } from "pg";

const getDay = async (
  client: PoolClient,
  sundayBoundary: string,
  saturdayBoundary: string,
  deviceUUID?: string,
) => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return client.query(
    `
      WITH date_series AS (
        SELECT generate_series(
          ($1::timestamptz AT TIME ZONE $4)::date,
          ($2::timestamptz AT TIME ZONE $4)::date,
          '1 day'::interval
        )::date AS date
      )
      SELECT
        ds.date,
        COALESCE(SUM(e.end_time - e.init_time), INTERVAL '0') AS total_time_spent
      FROM
        date_series ds
      LEFT JOIN
        events e ON ds.date = e.init_time::date
        AND init_time >= $1
        AND init_time <= $2
        AND ($3::uuid IS NULL OR device_uuid = $3)
      GROUP BY
        ds.date
      ORDER BY
        ds.date ASC;
    `,
    [sundayBoundary, saturdayBoundary, deviceUUID || null, localTimeZone],
  );
};

export default getDay;
