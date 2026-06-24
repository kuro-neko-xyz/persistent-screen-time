import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Bubble from "./components/Bubble";
import GraphControls from "./components/GraphControls";
import Select from "./components/Select";
import {
  abbreviatedDaysOfTheWeek,
  type Activity,
  type Device,
  type Time,
} from "@persistent-screen-time/shared";

const getWeeklyData = async ({
  date,
  deviceUUID,
  showCategories,
}: {
  date: Date;
  deviceUUID: string;
  showCategories: boolean;
}) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;

  const dateQuery = `?date=${formattedDate}`;
  const deviceQuery = deviceUUID ? `&device=${deviceUUID}` : "";

  const response = await fetch(
    import.meta.env.VITE_API_URL +
      "/activity/week" +
      (showCategories ? "/category" : "") +
      dateQuery +
      deviceQuery,
  );
  const data = (await response.json()) as Activity;

  return data;
};

const getDevices = async () => {
  const response = await fetch(import.meta.env.VITE_API_URL + "/devices");
  const data = await response.json();

  return data;
};

const calculateTimePercentage = (time: Time, longestDayInTheWeek: number) => {
  if (!longestDayInTheWeek) {
    return "0%";
  }

  const hours = time.hours || 0;
  const minutes = time.minutes || 0;
  const totalMinutes = hours * 60 + minutes;

  const percentage = (totalMinutes / longestDayInTheWeek) * 100;

  return `${percentage}%`;
};

function App() {
  const [data, setData] = useState<Activity>();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    getDevices().then((data) => setDevices(data));
  }, []);

  useEffect(() => {
    getWeeklyData({
      date: selectedDate,
      deviceUUID: selectedDevice,
      showCategories,
    }).then((data) => setData(data));
  }, [selectedDate, selectedDevice, showCategories]);

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
          <Select
            onChange={(e) => setSelectedDevice(e.target.value)}
            value={selectedDevice}
          >
            <option key="all" value="">
              All Devices
            </option>
            {devices.map((device) => {
              return (
                <option key={device.uuid} value={device.uuid}>
                  {device.name || device.uuid}
                </option>
              );
            })}
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
                  <div key={day.date} className={styles.dayContainer}>
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
          <Select
            onChange={(e) => setShowCategories(e.target.value === "true")}
            value={showCategories.toString()}
          >
            <option value="false">Show Apps</option>
            <option value="true">Show Categories</option>
          </Select>
        </Bubble.Header>
        <Bubble.Body>
          <table>
            <thead>
              <tr>
                {showCategories ? null : <th></th>}
                <th>{showCategories ? "Category" : "App"}</th>
                <th>Time</th>
              </tr>
            </thead>
            {data.applications && (
              <tbody>
                {data.applications
                  .filter(
                    (app) =>
                      app.totalTimeSpent.hours || app.totalTimeSpent.minutes,
                  )
                  .map((app) => {
                    return (
                      <tr key={app.id}>
                        <td>
                          {app.imageUrl ? (
                            <img
                              className={styles.appIcon}
                              src={app.imageUrl}
                              width={24}
                              height={24}
                              alt=""
                            />
                          ) : (
                            <div style={{ width: 24, height: 24, margin: 2 }} />
                          )}
                        </td>
                        <td>{app.name || app.id}</td>
                        <td>{`${app.totalTimeSpent.hours ? app.totalTimeSpent.hours + "h " : ""} ${app.totalTimeSpent.minutes ? app.totalTimeSpent.minutes + "m " : ""}`}</td>
                      </tr>
                    );
                  })}
              </tbody>
            )}
            {data.categories && (
              <tbody>
                {data.categories
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
            )}
          </table>
        </Bubble.Body>
      </Bubble>
    </div>
  );
}

export default App;
