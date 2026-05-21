import styles from "./App.module.css";
import Bubble from "./components/Bubble";
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
          <p>Test</p>
        </Bubble.Body>
      </Bubble>
    </div>
  );
}

export default App;
