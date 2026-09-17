import type { Dispatch, FC, SetStateAction } from "react";
import Bubble from "../Bubble";
import Select from "../Select";
import type { Applications, Categories } from "@persistent-screen-time/shared";
import AppLabel from "../AppLabel";
import styles from "./styles.module.css";

interface AppsBubbleParams {
  applications?: Applications;
  categories?: Categories;
  setShowCategories: Dispatch<SetStateAction<boolean>>;
  showCategories: boolean;
}

const AppsBubble: FC<AppsBubbleParams> = ({
  applications,
  categories,
  setShowCategories,
  showCategories,
}) => {
  return (
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
          {applications && (
            <tbody>
              {applications.map((app) => {
                return <AppLabel app={app} key={app.id} />;
              })}
            </tbody>
          )}
          {categories && (
            <tbody>
              {categories
                .filter(
                  (category) =>
                    category.totalTimeSpent.hours ||
                    category.totalTimeSpent.minutes,
                )
                .map((category) => {
                  return (
                    <tr key={category.id}>
                      <td className={styles.appNameContainer}>
                        {category.name || category.id}
                      </td>
                      <td>{`${category.totalTimeSpent.hours ? category.totalTimeSpent.hours + "h " : ""} ${category.totalTimeSpent.minutes ? category.totalTimeSpent.minutes + "m " : ""}`}</td>
                    </tr>
                  );
                })}
            </tbody>
          )}
        </table>
      </Bubble.Body>
    </Bubble>
  );
};

export default AppsBubble;
