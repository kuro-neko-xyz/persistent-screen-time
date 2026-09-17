import type { Application } from "@persistent-screen-time/shared";
import type { FC } from "react";
import getTimeLabel from "../../utils/getTimeLabel";
import styles from "./styles.module.css";

interface AppLabelParams {
  app: Application;
}

const AppLabel: FC<AppLabelParams> = ({ app }) => {
  return (
    <tr key={app.id}>
      <td className={styles.appIconContainer}>
        {app.imageUrl ? (
          <button className={styles.button} type="button">
            <img
              className={styles.appIcon}
              src={app.imageUrl}
              width={24}
              height={24}
              alt=""
            />
          </button>
        ) : (
          <div style={{ width: 24, height: 24, margin: 2 }} />
        )}
      </td>
      <td className={styles.appNameContainer}>
        <button className={styles.button} type="button">
          {app.name || app.id}
        </button>
      </td>
      <td>{getTimeLabel(app.totalTimeSpent)}</td>
    </tr>
  );
};

export default AppLabel;
