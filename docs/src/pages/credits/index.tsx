import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import React from "react";

const Credits = (): JSX.Element => {
  return (
    <Layout
      title="Credits"
      description="Meshtastic is made possible by the following people & organizations."
    >
      <main className="relative mt-20">
        <div className="container mx-auto p-6 leading-normal space-y-4">
          <h1>Credits</h1>
          <p>
            Meshtastic is community driven. Thousands of hours have been donated
            by volunteers who want to develop this amazing project. Whether
            you've submitted a pull request or triaged a bug in our
            Discord/Forum. You've made Meshtastic possible. Thank you for your
            contributions.
          </p>
          <p>
            We would also like to recognize those who have donated financially
            to the project. As Meshtastic has grown, we've aquired some ongoing
            costs to keep the project running. Thank you for your generous
            donations.
          </p>
        </div>
        <div className="container mx-auto p-6 leading-normal space-y-4">
          <h2>Fiscal Sponsors</h2>
          <p>
            We have partnered with both the{" "}
            <a
              className="underline"
              href="https://opencollective.com"
              rel="noreferrer"
              target="_blank"
            >
              Open Collective
            </a>{" "}
            and the{" "}
            <a
              className="underline"
              href="https://www.oscollective.org"
              rel="noreferrer"
              target="_blank"
            >
              Open Source Collective
            </a>{" "}
            to help us with a fiscal management framework and banking needs.
            They help support over three thousand open source projects including
            the PHP Foundation, F-Droid, Sonarr, LinuxServer and DarkReader. We
            are in good hands and good company.
          </p>
          <p>
            As with everything we do here, Open Collective provides a fully
            transparent framework for our budget and expenses. You can see what
            we’re bringing in, who is spending money and where that money is
            going{" "}
            <a
              className="underline"
              href="https://opencollective.com/meshtastic"
              rel="noreferrer"
              target="_blank"
            >
              here
            </a>
            .
          </p>
          <p>
            In addition to our partnership with Open Collective and Open Source
            Collective, we have also been approved into the{" "}
            <a
              className="underline"
              href="https://github.com/sponsors"
              rel="noreferrer"
              target="_blank"
            >
              GitHub Sponsors
            </a>{" "}
            program where we can set fundraising goals with GitHub.
          </p>
          <p>
            All donations made through GitHub will be deposited to our account
            with the Open Source Collective and managed by the Open Collective.
            This means we have a single place to monitor and maintain
            transparency of our finances.
          </p>
          <p>If you are able, please contribute to this amazing project.</p>
          <div className="indexCtasBody">
            <Link
              className={"button button--outline  button--lg cta--button"}
              to={"https://opencollective.com/meshtastic/donate"}
            >
              Sponsor Meshtastic
            </Link>
          </div>
        </div>
        <div className="container mx-auto p-6 leading-normal space-y-4">
          <h2>Contributors</h2>
          <p>
            Literally thousands of hours have gone into creating, maintaining,
            and improving Meshtastic. Without our contributors none of this
            would be possible. Thank you for donating the time for each and
            every commit, issue, and pull request.
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default Credits;
