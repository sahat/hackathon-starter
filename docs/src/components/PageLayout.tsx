import React from "react";

import Layout from "@theme/Layout";

export interface PageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const PageLayout = ({
  title,
  description,
  children,
}: PageLayoutProps): JSX.Element => {
  return (
    <Layout title={title} description={description}>
      {children}
    </Layout>
  );
};

export interface ColorModeProps {
  children: React.ReactNode;
}
