import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Bubble from "./components/Bubble";
import GraphControls from "./components/GraphControls";
import Select from "./components/Select";
import type { Activity } from "./models/Activity";

const getWeeklyData = async () => {
  const response = await fetch(import.meta.env.VITE_API_URL + "/activity/week");
  const data = ((await response.json()) as Activity).averageDailyTime;

  return `${data.hours ? data.hours + "h " : ""} ${data.minutes ? data.minutes + "m " : ""}`;
};

function App() {
  const [weeklyData, setWeeklyData] = useState("");

  useEffect(() => {
    getWeeklyData().then((data) => setWeeklyData(data));
  }, []);

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
              <h3 className={styles.data}>{weeklyData}</h3>
            </div>
            <GraphControls />
          </div>
        </Bubble.Body>
      </Bubble>
    </div>
  );
}

export default App;
