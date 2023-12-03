import React from "react";

import { FiExternalLink } from "react-icons/fi";

export interface SocialCardProps {
  children: React.ReactNode;
  color: string;
  link: string;
}

export const SocialCard = ({
  children,
  color,
  link,
}: SocialCardProps): JSX.Element => {
  return (
    <div
      className={`group relative flex h-24 w-36 min-w-max flex-shrink-0 rounded-xl shadow-xl ${color} m-2`}
    >
      {children}
      <a
        className="absolute top-0 left-0 right-0 bottom-0 hidden rounded-xl border border-accent bg-secondary bg-opacity-95 text-2xl shadow-xl group-hover:flex"
        href={link}
        rel="noreferrer"
        target="_blank"
      >
        <FiExternalLink className="m-auto" />
      </a>
    </div>
  );
};
