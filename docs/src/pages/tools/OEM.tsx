import React, { useEffect, useState } from "react";

import { fromByteArray, toByteArray } from "base64-js";

import { Protobuf } from "@meshtastic/meshtasticjs";
import Layout from "@theme/Layout";

const OEM = (): JSX.Element => {
  const [oemAesKey, setOemAesKey] = useState<Uint8Array>(new Uint8Array());
  const [oemFont, setOemFont] = useState<Protobuf.ScreenFonts>(
    Protobuf.ScreenFonts.FONT_MEDIUM,
  );
  const [oemIconBits, setOemIconBits] = useState<Uint8Array>(new Uint8Array());
  const [oemIconHeight, setOemIconHeight] = useState<number>(0);
  const [oemIconWidth, setOemIconWidth] = useState<number>(0);
  const [oemText, setOemText] = useState<string>("");
  const [oemBytes, setOemBytes] = useState<Uint8Array>(new Uint8Array());

  useEffect(() => {
    setOemBytes(
      new Protobuf.OEMStore({
        oemAesKey,
        oemFont,
        oemIconBits,
        oemIconHeight,
        oemIconWidth,
        oemText,
      }).toBinary(),
    );
  }, [oemAesKey, oemFont, oemIconBits, oemIconHeight, oemIconWidth, oemText]);

  const enumOptions = Protobuf.ScreenFonts
    ? Object.entries(Protobuf.ScreenFonts).filter(
        (value) => typeof value[1] === "number",
      )
    : [];

  const readFile = (file: File) => {
    return new Promise((resolve: (value: string) => void, reject) => {
      const reader = new FileReader();

      reader.onload = (res) => {
        resolve(res.target.result as string);
      };
      reader.onerror = (err) => reject(err);

      reader.readAsText(file);
    });
  };

  return (
    <Layout title="OEM Generator" description="OEM Bin Generator">
      <div className="container mt-8 flex flex-col gap-3">
        <span>AES Key</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const key = new Uint8Array(128 / 8);
              setOemAesKey(crypto.getRandomValues(key));
            }}
            className="cursor-pointer rounded-md bg-tertiary p-2 hover:brightness-90"
          >
            Generate 128bit
          </button>
          <button
            type="button"
            onClick={() => {
              const key = new Uint8Array(256 / 8);
              setOemAesKey(crypto.getRandomValues(key));
            }}
            className="mr-auto cursor-pointer rounded-md bg-tertiary p-2 hover:brightness-90"
          >
            Generate 256bit
          </button>
        </div>
        <input
          type="text"
          name="oemAesKey"
          value={fromByteArray(oemAesKey)}
          onChange={(e) => {
            setOemAesKey(toByteArray(e.target.value));
          }}
        />
        <span>Font</span>
        <select
          onChange={(e) => {
            setOemFont(parseInt(e.target.value));
          }}
        >
          {enumOptions.map(([name, value]) => (
            <option key={name} value={value}>
              {name}
            </option>
          ))}
        </select>
        <span>Logo XBM</span>
        <input
          type="file"
          name="file"
          onChange={(e) => {
            readFile(e.target.files[0]).then((data) => {
              setOemIconBits(
                new Uint8Array(
                  data.split(",").map((s) => parseInt(s.trim(), 16)),
                ),
              );
            });
          }}
        />
        <span>Logo Height</span>
        <input
          type="number"
          name="oemIconHeight"
          onChange={(e) => {
            setOemIconHeight(parseInt(e.target.value));
          }}
        />
        <span>Logo Width</span>
        <input
          type="number"
          name="oemIconWidth"
          onChange={(e) => {
            setOemIconWidth(parseInt(e.target.value));
          }}
        />
        <span>Boot Text</span>
        <input
          type="text"
          name="oemText"
          onChange={(e) => {
            setOemText(e.target.value);
          }}
        />
        <a
          className="cursor-pointer rounded-md bg-tertiary p-2 hover:brightness-90"
          download="OEM.bin"
          onClick={() => {
            const blob = new Blob([oemBytes], {
              type: "application/octet-stream",
            });
            window.open(URL.createObjectURL(blob));
          }}
        >
          Download
        </a>
        {oemBytes.toString()}
      </div>
    </Layout>
  );
};

export default OEM;
