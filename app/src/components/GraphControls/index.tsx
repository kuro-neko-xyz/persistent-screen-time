import type { FC } from "react";
import Select from "../Select";
import styles from "./styles.module.css";

const GraphControls: FC = () => {
  return (
    <div className={styles.container}>
      <Select>
        <option value="">This Week</option>
      </Select>
      <button className={styles.button} type="button">
        {"<"}
      </button>
      <button className={styles.button} type="button">
        Today
      </button>
      <button className={styles.button} type="button">
        {">"}
      </button>
    </div>
  );
};

export default GraphControls;
