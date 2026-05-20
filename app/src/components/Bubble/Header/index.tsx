import type { FC } from "react";

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: FC<HeaderProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Header;
