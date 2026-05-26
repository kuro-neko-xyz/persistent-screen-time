import type { FC } from "react";
import Select from "../Select";
import styles from "./styles.module.css";

interface GraphControlsProps {
  handleDateChange: (date: Date) => void;
  selectedDate: Date;
}

const getLabel = (selectedDate: Date) => {
  const lastSunday = new Date();
  lastSunday.setDate(new Date().getDate() - new Date().getDay());
  lastSunday.setHours(0, 0, 0, 0);

  const previousSunday = new Date(selectedDate);
  previousSunday.setDate(selectedDate.getDate() - selectedDate.getDay());
  previousSunday.setHours(0, 0, 0, 0);

  if (lastSunday.toISOString() === previousSunday.toISOString()) {
    return "This Week";
  } else {
    lastSunday.setDate(lastSunday.getDate() - 7);
    if (lastSunday.toISOString() === previousSunday.toISOString()) {
      return "Last Week";
    } else {
      const nextSaturday = new Date(selectedDate);
      nextSaturday.setDate(
        selectedDate.getDate() + (6 - selectedDate.getDay()),
      );
      nextSaturday.setHours(0, 0, 0, 0);

      return `${previousSunday.toDateString()} - ${nextSaturday.toDateString()}`;
    }
  }
};

const GraphControls: FC<GraphControlsProps> = ({
  handleDateChange,
  selectedDate,
}) => {
  return (
    <div className={styles.container}>
      <Select>
        <option value="">{getLabel(selectedDate)}</option>
      </Select>
      <button
        className={styles.button}
        onClick={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(selectedDate.getDate() - 7);
          handleDateChange(newDate);
        }}
        type="button"
      >
        {"<"}
      </button>
      <button className={styles.button} type="button">
        Today
      </button>
      <button
        className={styles.button}
        onClick={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(selectedDate.getDate() + 7);
          handleDateChange(newDate);
        }}
        type="button"
      >
        {">"}
      </button>
    </div>
  );
};

export default GraphControls;
