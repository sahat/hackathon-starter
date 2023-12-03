import { Protobuf, Types } from "@meshtastic/meshtasticjs";
import React, { useEffect } from "react";

interface Region {
  freq_start: number;
  freq_end: number;
  duty_cycle: number;
  spacing: number;
  power_limit: number;
}

interface Modem {
  bw: number;
  cr: number;
  sf: number;
}

const RegionData = new Map<Protobuf.Config_LoRaConfig_RegionCode, Region>([
  [
    Protobuf.Config_LoRaConfig_RegionCode.US,
    {
      freq_start: 902.0,
      freq_end: 928.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 30,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.EU_433,
    {
      freq_start: 433.0,
      freq_end: 434.0,
      duty_cycle: 10,
      spacing: 0,
      power_limit: 12,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.EU_868,
    {
      freq_start: 869.4,
      freq_end: 869.65,
      duty_cycle: 10,
      spacing: 0,
      power_limit: 27,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.CN,
    {
      freq_start: 470.0,
      freq_end: 510.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 19,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.JP,
    {
      freq_start: 920.8,
      freq_end: 927.8,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 16,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.ANZ,
    {
      freq_start: 915.0,
      freq_end: 928.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 30,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.RU,
    {
      freq_start: 868.7,
      freq_end: 869.2,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 20,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.KR,
    {
      freq_start: 920.0,
      freq_end: 923.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 0,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.TW,
    {
      freq_start: 920.0,
      freq_end: 925.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 0,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.IN,
    {
      freq_start: 865.0,
      freq_end: 867.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 30,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.NZ_865,
    {
      freq_start: 864.0,
      freq_end: 868.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 36,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.TH,
    {
      freq_start: 920.0,
      freq_end: 925.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 16,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.UA_433,
    {
      freq_start: 433.0,
      freq_end: 434.7,
      duty_cycle: 10,
      spacing: 0,
      power_limit: 10,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.UA_868,
    {
      freq_start: 868.0,
      freq_end: 868.6,
      duty_cycle: 1,
      spacing: 0,
      power_limit: 14,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.LORA_24,
    {
      freq_start: 2400.0,
      freq_end: 2483.5,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 10,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_RegionCode.UNSET,
    {
      freq_start: 902.0,
      freq_end: 928.0,
      duty_cycle: 100,
      spacing: 0,
      power_limit: 30,
    },
  ],
]);

const modemPresets = new Map<Protobuf.Config_LoRaConfig_ModemPreset, Modem>([
  [
    Protobuf.Config_LoRaConfig_ModemPreset.SHORT_FAST,
    {
      bw: 250,
      cr: 8,
      sf: 7,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_ModemPreset.SHORT_SLOW,
    {
      bw: 250,
      cr: 8,
      sf: 8,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_ModemPreset.MEDIUM_FAST,
    {
      bw: 250,
      cr: 8,
      sf: 9,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_ModemPreset.MEDIUM_SLOW,
    {
      bw: 250,
      cr: 8,
      sf: 10,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_ModemPreset.LONG_FAST,
    {
      bw: 250,
      cr: 8,
      sf: 11,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_ModemPreset.LONG_MODERATE,
    {
      bw: 125,
      cr: 8,
      sf: 11,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_ModemPreset.LONG_SLOW,
    {
      bw: 125,
      cr: 8,
      sf: 12,
    },
  ],
  [
    Protobuf.Config_LoRaConfig_ModemPreset.VERY_LONG_SLOW,
    {
      bw: 62.5,
      cr: 8,
      sf: 12,
    },
  ],
]);

export const FrequencyCalculator = (): JSX.Element => {
  const [modemPreset, setModemPreset] =
    React.useState<Protobuf.Config_LoRaConfig_ModemPreset>(
      Protobuf.Config_LoRaConfig_ModemPreset.LONG_FAST,
    );
  const [region, setRegion] =
    React.useState<Protobuf.Config_LoRaConfig_RegionCode>(
      Protobuf.Config_LoRaConfig_RegionCode.US,
    );
  const [channel, setChannel] = React.useState<Types.ChannelNumber>(
    Types.ChannelNumber.PRIMARY,
  );
  const [numChannels, setNumChannels] = React.useState<number>(0);
  const [channelFrequency, setChannelFrequency] = React.useState<number>(0);

  useEffect(() => {
    const selectedRegion = RegionData.get(region);
    const selectedModemPreset = modemPresets.get(modemPreset);
    const calculatedNumChannels = Math.floor(
      (selectedRegion.freq_end - selectedRegion.freq_start) /
        (selectedRegion.spacing + selectedModemPreset.bw / 1000),
    );

    setNumChannels(calculatedNumChannels);

    let updatedChannel = channel;
    if (updatedChannel >= calculatedNumChannels) {
      updatedChannel = 0;
    }

    setChannel(updatedChannel);

    setChannelFrequency(
      selectedRegion.freq_start +
        selectedModemPreset.bw / 2000 +
        updatedChannel * (selectedModemPreset.bw / 1000),
    );
  }, [modemPreset, region, channel]);

  return (
    <div className="flex flex-col border-l-[5px] shadow-md my-4 border-accent rounded-lg p-4 bg-secondary gap-2">
      <div className="flex gap-2">
        <label>Modem Preset:</label>
        <select
          value={modemPreset}
          onChange={(e) =>
            setModemPreset(
              parseInt(
                e.target.value,
              ) as Protobuf.Config_LoRaConfig_ModemPreset,
            )
          }
        >
          {Array.from(modemPresets.keys()).map((key) => (
            <option key={key} value={key}>
              {Protobuf.Config_LoRaConfig_ModemPreset[key]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <label>Region:</label>
        <select
          value={region}
          onChange={(e) => setRegion(parseInt(e.target.value))}
        >
          {Array.from(RegionData.keys()).map((key) => (
            <option key={key} value={key}>
              {Protobuf.Config_LoRaConfig_RegionCode[key]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <label>Channel:</label>
        <select
          value={channel}
          onChange={(e) => setChannel(parseInt(e.target.value))}
        >
          {Array.from(Array(numChannels).keys()).map((key) => (
            <option key={key} value={key}>
              {key + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <label className="font-semibold">Number of channels:</label>
        <input type="number" disabled value={numChannels} />
      </div>
      <div className="flex gap-2">
        <label className="font-semibold">Channel Frequency:</label>
        <input type="number" disabled value={channelFrequency} />
      </div>
    </div>
  );
};
