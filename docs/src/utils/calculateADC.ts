export default function calculateADC() {
	//const variables
	const BAT_MILLIVOLTS_FULL = 4.2;
	const BAT_MILLIVOLTS_EMPTY = 3.27;
	const BAT_FULL_PERCENT = 1;
	//variable
	const batteryChargePercent =
		parseFloat(
			(<HTMLInputElement>document.getElementById("batteryChargePercent")).value,
		) / 100;
	const operativeAdcMultiplier = parseFloat(
		(<HTMLInputElement>document.getElementById("operativeAdcMultiplier")).value,
	);
	const result =
		(operativeAdcMultiplier *
			((BAT_FULL_PERCENT - 1) * BAT_MILLIVOLTS_EMPTY -
				BAT_FULL_PERCENT * BAT_MILLIVOLTS_FULL)) /
		((batteryChargePercent - 1) * BAT_MILLIVOLTS_EMPTY -
			batteryChargePercent * BAT_MILLIVOLTS_FULL);
	(<HTMLInputElement>(
		document.getElementById("newOperativeAdcMultiplier")
	)).value = result.toFixed(4);
}
