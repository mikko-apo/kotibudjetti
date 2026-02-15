import { createState } from "../../ki-frame/src";
import { div, setElementToId } from "../../ki-frame/src/domBuilder";
import {
  billSummary,
  calculateMonthlyYearBillTotals,
  evaluatePriceIncreases,
  parseUnderscoreSeparatedYmNumbers,
  resolveMonthlyPricingLookup,
} from "./kaukolampo/kaukolampo";
import { tulaPepi } from "./kaukolampo/kaukolampoPricing";
import type { MonthBillInfo, YearTotal } from "./kaukolampo/kaukolampoTypes";
import { range } from "./kaukolampo/range";

console.log("kotibudjetti v0.0.1");

const usage =
  "2022-4_1.945_1.33_0.941_0.897_0.876_1.336_1.758_3.038_3.922_3.597_2.869_2.766_1.683_1.21_1.11_0.973_0.904_0.876_2.278_3.017_3.717_4.456_3.313_2.798_2.096_0.926_0.701_0.73_0.683_0.66_1.721_2.438_3.238_3.357_3.177_2.656_1.558_1.196_0.851_0.789_0.778_0.841_2.2_2.485_2.899";

function printPricing() {
  const contract = tulaPepi;
  const from = { year: 2022, month: 1 };
  const to = { year: 2025, month: 12 };
  const years = range(from.year, to.year);
  const address = "Jätintie 1 A";
  const monthlyPricing = resolveMonthlyPricingLookup(contract, from, to);
  const powerUsage = parseUnderscoreSeparatedYmNumbers(usage);
  const powerUsageState = createState<typeof powerUsage.numbers>({});
  const totalsByYear = createState<Record<number, YearTotal>>({});
  const monthSummary = createState<Record<number, MonthBillInfo>>({});
  const priceIncreases = div();
  powerUsageState.onValueChange((powerUsage) => {
    const newTotals = calculateMonthlyYearBillTotals(years, monthlyPricing, powerUsage);
    totalsByYear.set(newTotals.totalsByYear);
    monthSummary.set(newTotals.monthSummary);
    priceIncreases.replaceChildren(evaluatePriceIncreases(years, newTotals.totalsByYear, newTotals.monthSummary));
  });

  const { bills } = billSummary(address, years, monthSummary, totalsByYear);
  powerUsageState.set(powerUsage.numbers);
  return div(bills, priceIncreases);
}

setElementToId("app", printPricing());
