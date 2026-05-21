import styles from "./App.module.css";
import Bubble from "./components/Bubble";
import GraphControls from "./components/GraphControls";
import Select from "./components/Select";

function App() {
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
            <h2 className={styles.title}>Daily Usage</h2>
            <GraphControls />
          </div>
        </Bubble.Body>
      </Bubble>
    </div>
  );
}

export default App;
