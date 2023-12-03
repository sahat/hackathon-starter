import React from "react";

import { DeviceFirmwareResource } from "../../../utils/apiTypes";

export interface releaseCardProps {
  variant: string;
  description: string;
  release?: DeviceFirmwareResource[];
}

export const FirmwareCard = ({
  variant,
  description,
  release,
}: releaseCardProps): JSX.Element => {
  return (
    <div className="card m-4 border-2 border-secondary">
      <div className="card__header flex justify-between">
        <h3>{variant}</h3>
        {release?.length && (
          <a href={release[0].page_url}>{release[0].title}</a>
        )}
      </div>
      <div className="card__body">
        <p>{description}</p>
      </div>
      <div className="card__footer mt-auto">
        <div className="margin-top--sm">
          <details>
            <summary>Older Versions</summary>
            {release.slice(1, 6).map((release) => {
              return (
                <div key={release.id}>
                  <a href={release.zip_url}>{release.title}</a>
                </div>
              );
            })}
          </details>
        </div>
        {release?.length ? (
          <>
            <a
              href={release[0].zip_url}
              className="button button--secondary button--block margin-top--sm"
            >
              Download {variant}
            </a>
          </>
        ) : (
          <button
            type="button"
            disabled
            className="button button--secondary button--block"
          >
            Loading...
          </button>
        )}
      </div>
    </div>
  );
};

export const PlaceholderFirmwareCard = (): JSX.Element => {
  return (
    <div className="card w-full animate-pulse flex gap-4 p-4">
      <div className="flex justify-between mb-4">
        <div className="rounded-md bg-gray-500 w-32 h-4" />
        <div className="rounded-md bg-gray-500 w-32 h-4" />
      </div>
      <div className="card__body rounded-md bg-gray-500 h-12" />
      <a className="button disabled button--primary button--block">&nbsp;</a>
      <div className="rounded-md bg-gray-500 w-32 h-8" />
      <div className="rounded-md bg-gray-500 w-44 h-4" />
      <div className="rounded-md bg-gray-500 w-36 h-4" />
      <div className="rounded-md bg-gray-500 w-52 h-4" />
      <div className="rounded-md bg-gray-500 w-44 h-4" />
    </div>
  );
};
