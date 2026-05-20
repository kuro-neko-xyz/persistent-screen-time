import styles from "./App.module.css";
import Bubble from "./components/Bubble";

function App() {
  return (
    <div className={styles.container}>
      <Bubble>
        <Bubble.Header>
          <p>Test</p>
        </Bubble.Header>
      </Bubble>
    </div>
  );
}

export default App;
