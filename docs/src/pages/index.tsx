import React from "react";

import Head from "@docusaurus/Head";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import { SocialCard, SocialCardProps } from "../components/homepage/SocialCard";

const SocialCards: SocialCardProps[] = [
  {
    color: "bg-[#5865F2]",
    link: "https://discord.com/invite/ktMAKGBnBs",
    children: (
      <img
        alt="discord"
        className="m-auto h-10"
        src="/img/homepage/Discord-Logo-White.svg"
      />
    ),
  },
  {
    color: "bg-[#4A99E9]",
    link: "https://twitter.com/TheMeshtastic",
    children: (
      <img
        alt="twitter"
        className="m-auto h-14"
        src="/img/homepage/Twitter-Logo-White.svg"
      />
    ),
  },
  {
    color: "bg-[#3875EA]",
    link: "https://facebook.com/themeshtastic",
    children: (
      <img
        alt="facebook"
        className="m-auto h-14"
        src="/img/homepage/f_logo_RGB-White_1024.png"
      />
    ),
  },
  {
    color: "bg-[#ffffff]",
    link: "https://www.instagram.com/themeshtastic/",
    children: (
      <img
        alt="instagram"
        className="m-auto h-14"
        src="/img/homepage/Instagram_Glyph_Gradient.svg"
      />
    ),
  },
  {
    color: "bg-[#FF0000]",
    link: "https://www.youtube.com/meshtastic",
    children: (
      <img
        alt="youtube"
        className="m-auto h-16"
        src="/img/homepage/YouTube-Logo-White.svg"
      />
    ),
  },
  {
    color: "bg-[#ffffff]",
    link: "https://meshtastic.discourse.group",
    children: (
      <img
        alt="discourse"
        className="m-auto h-12"
        src="/img/homepage/Discourse-Logo-White.svg"
      />
    ),
  },
  {
    color: "bg-[#FF4500]",
    link: "https://reddit.com/r/meshtastic",
    children: (
      <img
        alt="reddit"
        className="m-auto h-20"
        src="/img/homepage/Reddit-Logo-White.svg"
      />
    ),
  },
];

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig } = context;
  return (
    <Layout>
      <Head>
        <meta property="og:title" content="Meshtastic" />
        <meta
          property="og:image"
          content={useBaseUrl("design/web/social-preview-1200x630.png")}
        />
        <meta
          property="og:description"
          content="An open source, off-grid, decentralized, mesh network built to run on affordable, low-power devices"
        />
        <meta property="og:url" content="https://meshtastic.org/" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className="hero hero--primary text-center">
        <div className="container">
          <h1 className="hero__title">
            <img
              alt="Meshtastic Logo"
              className="header__logo py-8"
              src={useBaseUrl("design/typelogo/typelogo.svg")}
            />
          </h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className="indexCtas">
            <Link className="button button--lg" to="/docs/introduction">
              Learn More
            </Link>
            <Link className="button button--lg" to="/docs/getting-started">
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-col gap-4">
        <div className="bg-primaryDark mx-auto flex w-full lg:w-auto flex-col gap-4 p-4 shadow-inner">
          <h3 className="text-xl font-bold">Connect with us.</h3>
          <div className="flex w-full overflow-x-auto">
            {SocialCards.map((card) => (
              <SocialCard key={card.link} color={card.color} link={card.link}>
                {card.children}
              </SocialCard>
            ))}
          </div>
        </div>

        <div className="container mx-auto flex w-auto flex-col">
          <h2 className="mb-2 text-xl font-medium">
            Getting started with Meshtastic is as easy as 1, 2, 3!
          </h2>
          <ul
            className="mx-auto relative grid gap-6"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            <div className="card">
              <div className="card__header flex justify-between">
                <h3>1. Purchase Supported Hardware</h3>
              </div>
              <div className="card__body flex justify-center">
                <p>
                  Hardware you will want to consider:
                  <ul>
                    <li>Radio</li>
                    <li>Battery</li>
                    <li>Case</li>
                    <li>
                      Antenna (most devices include an antenna, but the quality
                      can be a bit of a mixed bag from some suppliers on stock
                      antennas)
                    </li>
                  </ul>
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card__header flex justify-between">
                <h3>2. Flash & Configure Node</h3>
              </div>
              <div className="card__body flex justify-center">
                <p>
                  The Meshtastic Web-Based Flasher & Clients can assist you in
                  flashing the firmware and configuring settings.
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card__header flex justify-between">
                <h3>3. Connect to Node</h3>
              </div>
              <div className="card__body flex justify-center">
                <p>
                  Applications are available for the following systems:
                  <ul>
                    <li>Android</li>
                    <li>iOS</li>
                    <li>Mac</li>
                    <li>Web Browser</li>
                  </ul>
                </p>
              </div>
            </div>
          </ul>
        </div>
        <br />
      </main>
    </Layout>
  );
}

export default Home;
