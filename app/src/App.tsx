import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Bubble from "./components/Bubble";
import GraphControls from "./components/GraphControls";
import Select from "./components/Select";
import {
  abbreviatedDaysOfTheWeek,
  type Activity,
  type Time,
} from "@persistent-screen-time/shared";

const getWeeklyData = async ({ date }: { date: Date }) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;

  const query = `?date=${formattedDate}`;

  const response = await fetch(
    import.meta.env.VITE_API_URL + "/activity/week" + query,
  );
  const data = (await response.json()) as Activity;

  return data;
};

const calculateTimePercentage = (time: Time, longestDayInTheWeek: number) => {
  const hours = time.hours || 0;
  const minutes = time.minutes || 0;
  const totalMinutes = hours * 60 + minutes;

  const percentage = (totalMinutes / longestDayInTheWeek) * 100;

  return `${percentage}%`;
};

function App() {
  const [data, setData] = useState<Activity>();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    getWeeklyData({ date: selectedDate }).then((data) => setData(data));
  }, [selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  if (!data)
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );

  const longestDayInTheWeek = data.days.reduce((longest, day) => {
    const minutesInDay =
      (day.totalTimeSpent.hours || 0) * 60 + (day.totalTimeSpent.minutes || 0);

    if (!longest) return minutesInDay;
    if (minutesInDay > longest) return minutesInDay;
    return longest;
  }, 0);

  return (
    <div className={styles.container}>
      <Bubble>
        <Bubble.Header title="Device">
          <Select>
            <option value="">All Devices</option>
          </Select>
        </Bubble.Header>
        <Bubble.Body>
          <div className={styles.row}>
            <div className={styles.dailyUsage}>
              <h2 className={styles.title}>Daily Usage</h2>
              <h3
                className={styles.data}
              >{`${data.averageDailyTime?.hours ? data.averageDailyTime?.hours + "h " : ""} ${data.averageDailyTime?.minutes ? data.averageDailyTime?.minutes + "m " : ""}`}</h3>
            </div>

            <GraphControls
              selectedDate={selectedDate}
              handleDateChange={handleDateChange}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.usageByDay}>
              {data.days.map((day, index) => {
                return (
                  <div className={styles.dayContainer}>
                    <div
                      style={{
                        backgroundColor: "#464646",
                        width: 50,
                        height: calculateTimePercentage(
                          day.totalTimeSpent,
                          longestDayInTheWeek,
                        ),
                        margin: 5,
                      }}
                      key={day.date}
                    />
                    <p className={styles.dayName}>
                      {abbreviatedDaysOfTheWeek[index]}
                    </p>
                  </div>
                );
              })}
              <p className={styles.graphCeiling}>
                {Math.ceil(longestDayInTheWeek / 60)}h
              </p>
            </div>
          </div>
        </Bubble.Body>
      </Bubble>
      <Bubble>
        <Bubble.Header>
          <Select>
            <option value="">Show Apps</option>
          </Select>
        </Bubble.Header>
        <Bubble.Body>
          <table>
            <thead>
              <tr>
                <th>App</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.applications
                .filter(
                  (app) =>
                    app.totalTimeSpent.hours || app.totalTimeSpent.minutes,
                )
                .map((app) => {
                  return (
                    <tr key={app.id}>
                      <td>{app.name || app.id}</td>
                      <td>{`${app.totalTimeSpent.hours ? app.totalTimeSpent.hours + "h " : ""} ${app.totalTimeSpent.minutes ? app.totalTimeSpent.minutes + "m " : ""}`}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Bubble.Body>
      </Bubble>
    </div>
  );
}

export default App;
