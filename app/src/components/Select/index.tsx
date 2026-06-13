import type { FC } from "react";
import styles from "./styles.module.css";

interface SelectProps {
  children: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  value?: string;
}

const Select: FC<SelectProps> = ({ ...props }) => {
  return <select className={styles.container} {...props} />;
};

export default Select;
