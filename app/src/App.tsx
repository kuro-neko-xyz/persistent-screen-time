import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Bubble from "./components/Bubble";
import GraphControls from "./components/GraphControls";
import Select from "./components/Select";
import type { Activity } from "./models/Activity";

const getWeeklyData = async () => {
  const response = await fetch(import.meta.env.VITE_API_URL + "/activity/week");
  const data = (await response.json()) as Activity;

  return data;
};

function App() {
  const [data, setData] = useState<Activity>();

  useEffect(() => {
    getWeeklyData().then((data) => setData(data));
  }, []);

  console.log(data);

  if (!data) return <p>Loading...</p>;

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
              >{`${data.averageDailyTime.hours ? data.averageDailyTime.hours + "h " : ""} ${data.averageDailyTime.minutes ? data.averageDailyTime.minutes + "m " : ""}`}</h3>
            </div>
            <GraphControls />
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
              <th>App</th>
              <th>Time</th>
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
