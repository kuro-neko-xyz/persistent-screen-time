import type { FC } from "react";
import styles from "./styles.module.css";

interface HeaderProps {
  children?: React.ReactNode;
  title?: string;
}

const Header: FC<HeaderProps> = ({ children, title }) => {
  return (
    <div className={styles.container}>
      {title && <h1 className={styles.title}>{title}</h1>}
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default Header;
