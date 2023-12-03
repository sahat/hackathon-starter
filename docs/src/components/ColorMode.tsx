import React from "react";

export interface ColorModeProps {
  children: React.ReactNode;
}

export const Dark = ({ children }: ColorModeProps): JSX.Element => {
  return <div className="hideLight">{children}</div>;
};

export const Light = ({ children }: ColorModeProps): JSX.Element => {
  return <div className="hideDark">{children}</div>;
};
