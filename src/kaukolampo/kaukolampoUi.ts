import Decimal from 'decimal.js'
import { createState, State, StateListener } from '../../../ki-frame/src'
import {
  a,
  appendChildren,
  b,
  br,
  button,
  div,
  h2,
  h3,
  inputs,
  li,
  p,
  replaceChildren,
  table,
  tbody,
  td,
  text,
  th,
  thead,
  tr,
  ul,
} from '../../../ki-frame/src/domBuilder'
import { events, setEvents } from '../../../ki-frame/src/domBuilderEvents'
import { styles } from '../../../ki-frame/src/domBuilderStyles'
import { createFormatter } from '../../../ki-frame/src/stringFormatter'
import { printMoney, printPower } from './formatting'
import { calculateValues, indexToYm, months, resolveMonthlyPricingLookup, ymToIndex } from './kaukolampoBilling'
import type { MonthBillInfo, PaybackInterestYear, UnpackedPowerUsage, YearTotal } from './kaukolampoTypes'
import { formatAsUnderscoreSeparated, parseUnderscoreSeparatedYmNumbers } from './powerUsageString'
import { tuusulanjarvenLampo } from './prices/tuusulanjarvenLampo'
import { range } from './range'
import { shortHexHash } from './util'

const showIncrease = (inc?: number) =>
  styles({ backgroundColor: !inc || inc === 0 ? '' : inc > 0 ? 'lightpink' : 'lightgreen' })

const uiStyles = {
  pageBreakAfter: { class: 'pagebreak' },
  noPrint: { class: 'no-print' },
  borderLeft: styles({ borderLeft: '2px solid #6b7280' }),
  numberTableRight: styles({ width: 'auto', textAlign: 'right', verticalAlign: 'top' }),
  numberTableLeft: styles({ width: 'auto', verticalAlign: 'top' }),
  bold: styles({ fontWeight: 'bold' }),
}

const formatter = createFormatter({
  P: (v, s) => Decimal(v).toFixed(s.precision || 3),
  M: printMoney,
})

function BillItemTDs(index?: number) {
  const usedPowerText = text()
  const usedPowerTextDiv = div(usedPowerText)
  const usedPowerInput = index && inputs.text({ name: index.toString(), hidden: true }, styles({ width: '7ch' }))
  const usedPower = td(uiStyles.borderLeft, usedPowerTextDiv, usedPowerInput)
  const mwPrice = td()
  const powerPrice = td()
  const monthlyFee = td()
  const total = td(uiStyles.bold)
  const setText = (info?: Partial<MonthBillInfo>) => {
    if (usedPowerInput)
      if (info?.usedPower) {
        usedPowerText.textContent = printPower(info.usedPower)
        usedPowerInput.value = printPower(info.usedPower)
      } else {
        usedPowerText.textContent = ''
        usedPowerInput.value = ''
      }
    replaceChildren(mwPrice, info?.powerPrice ? printMoney(info?.powerPrice) : '', showIncrease(info?.mWPriceDelta))
    replaceChildren(powerPrice, info?.usedPowerPrice ? printMoney(info.usedPowerPrice) : '')
    replaceChildren(
      monthlyFee,
      info?.monthlyFee ? printMoney(info.monthlyFee) : '',
      showIncrease(info?.monthlyFeeDelta)
    )
    replaceChildren(total, info?.total ? printMoney(info.total) : '')
  }

  return {
    billTDList: [usedPower, mwPrice, powerPrice, monthlyFee, total],
    setText,
    usedPowerText,
    usedPowerTextDiv,
    usedPowerInput,
  }
}

function priceChangeComparedToFirstYear(state: CalculatedValuesState) {
  const priceChangeComparedToFirstYear = div()
  state.onValueChange(({ totalsByYear, years }) => {
    const [firstYear] = years
    const firstData = totalsByYear[firstYear].calculatedTotals
    replaceChildren(
      priceChangeComparedToFirstYear,
      table(
        uiStyles.numberTableRight,
        thead(
          tr(
            th('Vuosi'),
            th('Laskutuskuukausia'),
            th('Kulutus'),
            th('Toteutunut laskutus'),
            th(`Laskutus edellisen vuoden tasolla`, uiStyles.borderLeft),
            th('Korotus €'),
            th('Korotus %'),
            th('Ylilaskutus €'),
            th(`Laskutus vuoden ${years[0]} tasolla`, uiStyles.borderLeft),
            th('Korotus €'),
            th('Korotus %')
          ),
          years.map((y) => {
            const currentYear = totalsByYear[y]
            const usedPower = currentYear.usedPower
            const totalOnFirstYearLevel = usedPower
              .mul(firstData.avgPowerPrice)
              .add(firstData.avgMonthlyFee.mul(currentYear.monthCount))
            return tr(
              td(y),
              td(currentYear.monthCount),
              td(printPower(usedPower), ' MW'),
              td(printMoney(currentYear.billedTotals.total), ' €'),
              td(
                currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.totalsBasedOnLastYearLevel.total),
                ' €',
                uiStyles.borderLeft
              ),
              td(
                currentYear.totalsBasedOnLastYearLevel &&
                  printMoney(currentYear.billedTotals.total.minus(currentYear.totalsBasedOnLastYearLevel.total)),
                ' €'
              ),
              td(
                currentYear.totalsBasedOnLastYearLevel &&
                  printPower(
                    currentYear.billedTotals.total.div(currentYear.totalsBasedOnLastYearLevel.total).minus(1).mul(100)
                  )
              ),
              td(
                currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.calculatedTotals.excessBilling),
                ' €'
              ),
              td(printMoney(totalOnFirstYearLevel), ' €', uiStyles.borderLeft),
              td(printMoney(currentYear.billedTotals.total.minus(totalOnFirstYearLevel)), ' €'),
              td(printPower(currentYear.billedTotals.total.div(totalOnFirstYearLevel).minus(1).mul(100)))
            )
          })
        )
      )
    )
  })
  return priceChangeComparedToFirstYear
}

function priceChangesByMonth(state: CalculatedValuesState) {
  const priceChangeTBody = tbody()
  state.onValueChange(({ years, monthBillInfos }) => {
    const allBills = years.flatMap((year) => months.map((month) => monthBillInfos[ymToIndex({ year, month })]))
    const billsWithChanges = allBills.filter((bill) => bill && (bill.monthlyFeeDelta != 0 || bill.mWPriceDelta != 0))
    const rows = billsWithChanges.map((bill) => {
      const prevBill = monthBillInfos[bill.index - 1]
      const yearMonth = indexToYm(bill.index)
      return tr(
        td(`${yearMonth.year}.${yearMonth.month}`),
        td(
          `${printMoney(prevBill.powerPrice)}€/MW -> ${printMoney(bill.powerPrice)}€/MW`,
          `, muutos ${printMoney(bill.powerPrice.div(prevBill.powerPrice).minus(1).mul(100))}%`
        ),
        td(
          `${printMoney(prevBill.monthlyFee)}€/kk -> ${printMoney(bill.monthlyFee)}€/kk`,
          `, muutos ${printMoney(bill.monthlyFee.div(prevBill.monthlyFee).minus(1).mul(100))}%`
        )
      )
    })
    replaceChildren(priceChangeTBody, rows)
  })
  return table(uiStyles.numberTableRight, priceChangeTBody)
}

export function billSummary(
  years: number[],
  calculatedValuesState: CalculatedValuesState,
  powerUsageState: State<UnpackedPowerUsage>
) {
  const usedPowerEditable = createState({ value: false })
  const billRows = months.map((month) =>
    tr(
      td(month),
      years.map((year) => {
        const index = ymToIndex({ year, month })
        const { billTDList, setText, usedPowerInput, usedPowerText, usedPowerTextDiv } = BillItemTDs(index)
        // monthSummary has changed, update other fields than usedPower
        calculatedValuesState.onValueChange(({ monthBillInfos }) => {
          setText(monthBillInfos[index])
        })
        if (usedPowerInput) {
          // toggle input and text view
          usedPowerEditable.onValueChange((showInput) => {
            usedPowerInput.hidden = !showInput
            usedPowerTextDiv.hidden = showInput
          })
          // catch change event and update other tables
          setEvents<'input'>(
            usedPowerInput,
            events({
              change({ node }) {
                const value = node.value
                const newUsedPower = ['0', ''].includes(value.trimEnd().trimStart()) ? undefined : Decimal(value)
                usedPowerText.textContent = newUsedPower ? value : ''
                powerUsageState.set((cur) => {
                  const numbers = { ...cur.numbers }
                  if (newUsedPower) {
                    numbers[index] = Decimal(value)
                  } else {
                    delete numbers[index]
                  }
                  return {
                    ...cur,
                    numbers,
                  }
                })
              },
            })
          )
        }
        return billTDList
      })
    )
  )
  const totalRow = tr(
    uiStyles.bold,
    td('Yhteensä', uiStyles.bold),
    years.map((y) => {
      const { billTDList, setText } = BillItemTDs()
      calculatedValuesState.onValueChange(({ totalsByYear }) => {
        const {
          billedTotals: { monthlyFees, usedPowerPrice, total },
          usedPower,
        } = totalsByYear[y]
        setText({
          usedPower,
          usedPowerPrice,
          monthlyFee: monthlyFees,
          total,
        })
      })
      return billTDList
    })
  )

  const powerUsageHashInfo = text()
  const powerUsageAsLink = a('Kulutusarvot linkkinä', uiStyles.noPrint)
  powerUsageState.onValueChange((powerUsage) => {
    const data = formatAsUnderscoreSeparated(powerUsage)
    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set('p', data)
    appendChildren(powerUsageAsLink, { href: url.toString() })
    shortHexHash(data, 12).then((s) => (powerUsageHashInfo.textContent = `Kulutusarvojen tarkisteluku: ${s}`))
  })
  return div(
    table(
      uiStyles.numberTableRight,
      thead(
        tr(
          th({ rowSpan: 2 }),
          years.map((y) => th(y, { colSpan: 5 }, uiStyles.borderLeft))
        ),
        tr(
          years.map(() => [th('Kulutus', uiStyles.borderLeft), th('€/MWh'), th('Energia €'), th('$/kk'), th('Lasku €')])
        )
      ),
      tbody(billRows, totalRow)
    ),
    div(
      powerUsageHashInfo,
      powerUsageAsLink,
      button(
        'Muokkaa kulutusarvoja',
        { class: 'blueButton' },
        uiStyles.noPrint,
        events({
          click() {
            usedPowerEditable.set((cur) => !cur)
          },
        })
      ),
      powerUsageAsLink,
      powerUsageHashInfo
    ),
    h3('Hinnanmuutokset'),
    table(styles({ width: 'auto' }), priceChangeTBody),
    h3('Hinnanmuutokset edelliseen kuukauteen verrattuna'),
    table(uiStyles.numberTableRight, priceChangeTBody),
    h3(`Hinnanmuutokset vuositasolla`),
    priceChangeComparedToFirstYear
  )
}

function compareYearPriceIncrease(yearTotal: YearTotal, prevTotal: YearTotal, y: number, prevYear: number) {
  const calculatedTotals = yearTotal.calculatedTotals
  const { priceIncreaseTooMuch } = calculatedTotals
  const princeIncreaseInfo =
    priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel
      ? [
          li('Korotus ylittää 15% ja 150e. Kuluttajariitalautakunnan suosituksen mukainen korotus olisi 150e'),
          ul(
            li(
              formatter(
                `150€ korotus edellisen vuoden tasolla laskettuun summaan: %M + 150 = `,
                yearTotal.totalsBasedOnLastYearLevel.total
              ),
              b(printMoney(calculatedTotals.total))
            ),
            li(
              formatter(`Liika laskutus: %M - %M  = `, yearTotal.billedTotals.total, calculatedTotals.total),
              b(printMoney(calculatedTotals.excessBilling))
            )
          ),
        ]
      : [li('Korotus ei ylitä 150e ja 15%')]
  const prevAvgMwPrice = prevTotal?.calculatedTotals.avgPowerPrice
  const explainAdjustment = () =>
    prevTotal && priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel && calculatedTotals.adjustmentMultiplier
      ? p(
          ul(
            li(
              'Liian laskutuksen takia seuraavan vuoden laskutuksessa käytetään tämän vuoden tasona viimevuoden tasoa * korjauskerroin'
            ),
            calculatedTotals.adjustmentMultiplier &&
              li(
                formatter(
                  `Korjauskerroin: %M / %M = %P`,
                  calculatedTotals.total,
                  yearTotal.totalsBasedOnLastYearLevel.total,
                  calculatedTotals.adjustmentMultiplier
                )
              ),
            li(
              formatter(`Energian hinta: %M * %P} = `, prevAvgMwPrice, calculatedTotals.adjustmentMultiplier),
              b(printMoney(calculatedTotals.avgPowerPrice))
            ),
            li(
              formatter(
                `Kuukausi: %M * %P = `,
                prevTotal.calculatedTotals.avgMonthlyFee,
                calculatedTotals.adjustmentMultiplier
              ),
              b(printMoney(calculatedTotals.avgMonthlyFee))
            )
          )
        )
      : p(
          ul(
            li('Taso saadaan laskemalla keskiarvot'),
            li(
              formatter(`Energian hinta: %M / %P = `, yearTotal.billedTotals.usedPowerPrice, yearTotal.usedPower),
              b(printMoney(yearTotal.calculatedTotals.avgPowerPrice))
            ),
            li(
              formatter(`Kuukausi: %M / %d = `, yearTotal.billedTotals.monthlyFees, yearTotal.monthCount),
              b(printMoney(yearTotal.calculatedTotals.avgMonthlyFee))
            )
          )
        )
  const prevAvgMonthlyFee = prevTotal?.calculatedTotals.avgMonthlyFee
  const totalWithPrevYearLevel = yearTotal.totalsBasedOnLastYearLevel?.total || Decimal(0)
  return div(
    h3(prevTotal ? `${y}, vertailu toteutuneella ja ${y - 1} tasolla` : `${y} tason laskeminen`),
    table(
      uiStyles.numberTableLeft,
      thead(
        tr(
          th(''),
          th('kulutus'),
          th('€/MWh'),
          th('$/kk'),
          th('Lasku vuositasolla'),
          priceIncreaseTooMuch && th(uiStyles.bold, 'Liika laskutus')
        )
      ),
      tbody(
        tr(
          td(`${y} toteunut lasku`),
          td(printPower(yearTotal.usedPower)),
          td(),
          td(),
          td(printMoney(yearTotal.billedTotals.total)),
          priceIncreaseTooMuch && td()
        ),
        prevTotal &&
          tr(
            td(
              `edellisen vuoden taso ja lasku vuoden ${y} kulutuksella`,
              ul(
                li(
                  `Vuoden ${y} energiakulutus ${printPower(yearTotal.usedPower)} vuoden ${y - 1} kuukausimaksulla ja energian hinnalla: `,
                  br(),
                  formatter(
                    `%P * %M + %d * %M = `,
                    yearTotal.usedPower,
                    prevAvgMwPrice,
                    yearTotal.monthCount,
                    prevAvgMonthlyFee
                  ),
                  b(printMoney(totalWithPrevYearLevel))
                )
              )
            ),
            td(printPower(yearTotal.usedPower)),
            td(printMoney(prevAvgMwPrice)),
            td(printMoney(prevAvgMonthlyFee)),
            td(printMoney(totalWithPrevYearLevel)),
            priceIncreaseTooMuch && td()
          ),
        prevTotal &&
          tr(
            td(
              `Korotuksen arvionti vuodelle ${y}`,
              ul(
                li(
                  formatter(
                    `${y} yhteensä %M, ${prevYear} tasolla %M`,
                    yearTotal.billedTotals.total,
                    totalWithPrevYearLevel
                  )
                ),
                li(
                  formatter(
                    `Korotus %M euroa %P prosenttia`,
                    calculatedTotals.priceIncreaseEuros || Decimal(0),
                    calculatedTotals.priceIncreasePercents || Decimal(0)
                  )
                ),
                princeIncreaseInfo
              )
            ),
            td(),
            td(),
            td(),
            td(priceIncreaseTooMuch && printMoney(calculatedTotals.total)),
            priceIncreaseTooMuch && td(uiStyles.bold, printMoney(calculatedTotals.excessBilling))
          ),
        tr(
          td(
            `tämän vuoden (${y}) tason laskeminen seuraavan vuoden (${y + 1}) korotuksen arviointia varten`,
            explainAdjustment()
          ),
          td(),
          td(printMoney(calculatedTotals.avgPowerPrice)),
          td(printMoney(calculatedTotals.avgMonthlyFee)),
          td(),
          priceIncreaseTooMuch && td()
        )
      )
    )
  )
}

function excessBillingPaybackInterestTable(paybackInterestYears: PaybackInterestYear[]) {
  return paybackInterestYears.map((info) =>
    div(
      h3(info.year),
      table(
        uiStyles.numberTableRight,
        thead(
          tr(
            th('Pohjatiedot', { colSpan: 3 }),
            th('Ylilaskutus jos verrataan +150 tasoon vuoden yli', { colSpan: 3 }, uiStyles.borderLeft),
            th('Ylilaskutus jos 150€ annetaan kertyä vuoden alussa', { colSpan: 3 }, uiStyles.borderLeft)
          ),
          tr(
            th('vuosi.kk'),
            th('Kulutus'),
            th('Alkuperäinen lasku'),
            // keskiarvoon verrattu
            th('Korjattu lasku', uiStyles.borderLeft),
            th('Ylilaskutus'),
            th('Viivästyskorko'),
            // viime vuoden taso ja 150e puskuri
            th('Lasku aiemman vuoden tasolla', uiStyles.borderLeft),
            th('Korjattu lasku'),
            th('150 eurosta jäljellä'),
            th('Ylilaskutus'),
            th('Viivästyskorko')
          )
        ),
        tbody(
          info.months.map((m) => {
            return tr(
              td(m.month),
              td(printPower(m.originalBill.usedPower)),
              td(printMoney(m.originalBill.total)),
              // keskiarvoon verrattu
              td(printMoney(m.excessFromAveragePrices.total), uiStyles.borderLeft),
              td(printMoney(m.excessFromAveragePrices.excess)),
              td(printMoney(m.excessFromAveragePrices.interest)),
              // viime vuoden taso ja 150e puskuri
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.totalWithLastYearLevel), uiStyles.borderLeft),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.total)),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.leftFrom150)),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.excess)),
              td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.interest))
            )
          })
        ),
        tr(
          uiStyles.bold,
          td('Yhteensä'),
          td(),
          td(),
          td(printMoney(info.fromAveragePricesTotals.total), uiStyles.borderLeft),
          td(printMoney(info.fromAveragePricesTotals.excess)),
          td(printMoney(info.fromAveragePricesTotals.interest)),
          td(uiStyles.borderLeft),
          td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.total)),
          td(),
          td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.excess)),
          td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.interest))
        )
      )
    )
  )
}

const usage =
  '2022-4_1.945_1.33_0.941_0.897_0.876_1.336_1.758_3.038_3.922_3.597_2.869_2.766_1.683_1.21_1.11_0.973_0.904_0.876_2.278_3.017_3.717_4.456_3.313_2.798_2.096_0.926_0.701_0.73_0.683_0.66_1.721_2.438_3.238_3.357_3.177_2.656_1.558_1.196_0.851_0.789_0.778_0.841_2.2_2.485_2.899'

function getPUrlParameter(): string | null {
  const url = new URL(window.location.href)
  return url.searchParams.get('p')
}

function summaryList(
  excessYears: number[],
  totalsByYear: Record<number, YearTotal>,
  paybackInterestYears: PaybackInterestYear[]
) {
  const paybackInterestTotal = paybackInterestYears.reduce(
    (acc, y) => acc.add(y.fromAveragePricesTotals.interest),
    Decimal(0)
  )
  return ul(
    excessYears.map((y) => li(`${y}: ${printMoney(totalsByYear[y].calculatedTotals.excessBilling)}€`)),
    li(`Viivästyskorko: ${printMoney(paybackInterestTotal)}€`),
    li(
      `Yhteensä: ${printMoney(excessYears.reduce((acc, y) => acc.add(totalsByYear[y].calculatedTotals.excessBilling), paybackInterestTotal))}€`
    )
  )
}

function priceIncreaseByYear(state: CalculatedValuesState) {
  const priceIncreases = div()
  state.onValueChange(({ totalsByYear, years }) => {
    replaceChildren(
      priceIncreases,
      years.map((y) => {
        const yearTotal = totalsByYear[y]
        const prevYear = y - 1
        const prevTotal: YearTotal | undefined = totalsByYear[prevYear]
        return compareYearPriceIncrease(yearTotal, prevTotal, y, prevYear)
      })
    )
  })
  return priceIncreases
}

type CalculatedValues = ReturnType<typeof calculateValues>
type CalculatedValuesState = StateListener<CalculatedValues>

function summaryOfExcessBillingAndInterest(calculatedValuesState: CalculatedValuesState) {
  const summary = div()
  calculatedValuesState.onValueChange(({ excessYears, totalsByYear, paybackInterestYears }) => {
    replaceChildren(summary, summaryList(excessYears, totalsByYear, paybackInterestYears))
  })
  return summary
}

function analysisOfPaybackInterest(calculatedValuesState: CalculatedValuesState) {
  const paybackInterest = div()
  calculatedValuesState.onValueChange(({ excessYears, paybackInterestYears }) => {
    replaceChildren(
      paybackInterest,
      excessYears.length > 0 &&
        div(
          p(
            'Viivästyskorko laskettuna korjattujen kuukausien laskujen maksupäivästä. Korjattuina kuukausina rahaa on kerätty perusteettomasti'
          ),
          excessBillingPaybackInterestTable(paybackInterestYears)
        )
    )
  })
  return paybackInterest
}

export function kaukolampoExcessPricingCalculator() {
  const contract = tuusulanjarvenLampo
  const from = { year: 2022, month: 1 }
  const to = { year: 2025, month: 12 }
  const years = range(from.year, to.year)
  const address = 'Jätintie 1 A'
  const monthlyPricing = resolveMonthlyPricingLookup(contract, from, to)
  const pFromBrowserUrl = getPUrlParameter()
  const powerUsage = parseUnderscoreSeparatedYmNumbers(pFromBrowserUrl || usage)

  const powerUsageState = createState({ value: powerUsage })
  const calculatedValuesState = powerUsageState.map((powerUsage) =>
    calculateValues(years, monthlyPricing, powerUsage.numbers)
  )

  return div(
    div(
      h2('Liiallinen laskutus ja viivästyskorko'),
      summaryOfExcessBillingAndInterest(calculatedValuesState),
      h2(`${address} laskut ${years[0]}-${years[years.length - 1]}`),
      billSummary(years, calculatedValuesState, powerUsageState),
      h3('Hinnanmuutokset edelliseen kuukauteen verrattuna'),
      priceChangesByMonth(calculatedValuesState),
      h3(`Hinnanmuutokset vuositasolla`),
      priceChangeComparedToFirstYear(calculatedValuesState),
      uiStyles.pageBreakAfter
    ),
    div(h2('Korotusten arviointi vuositasolla'), priceIncreaseByYear(calculatedValuesState), uiStyles.pageBreakAfter),
    div(h2('Kuukausikohtaisen viivästyskoron laskeminen'), analysisOfPaybackInterest(calculatedValuesState))
  )
}
