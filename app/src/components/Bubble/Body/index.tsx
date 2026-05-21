import type { FC } from "react";
import styles from "./styles.module.css";

interface BodyProps {
  children?: React.ReactNode;
}

const Body: FC<BodyProps> = ({ children }) => {
  return <div className={styles.container}>{children}</div>;
};

export default Body;
