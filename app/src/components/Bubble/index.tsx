import styles from "./styles.module.css";
import Header from "./Header";
import type { FC } from "react";
import Body from "./Body";

interface BubbleProps {
  children?: React.ReactNode;
}

const BubbleRoot: FC<BubbleProps> = ({ children }) => {
  return <div className={styles.container}>{children}</div>;
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const Bubble = Object.assign(BubbleRoot, { Header, Body });

export default Bubble;
