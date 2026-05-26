import { createState } from '../../../ki-frame/src'
import {
  a,
  b,
  button,
  div,
  h2,
  h3,
  input,
  inputs,
  label,
  li,
  p,
  option,
  replaceChildren,
  section,
  select,
  span,
  table,
  tbody,
  td,
  text,
  th,
  thead,
  tr,
  ul,
} from '../../../ki-frame/src/domBuilder'
import { events } from '../../../ki-frame/src/domBuilderEvents'
import { styles } from '../../../ki-frame/src/domBuilderStyles'
import {
  calculateOsakkeet,
  type IpoDetailsInput,
  type IpoSellDetailsInput,
  type MathematicalShareValueInput,
  type OsakkeetCalculation,
  type OsakkeetFormData,
  type ShareReimbursementInput,
  type ShareSubscriptionInput,
} from './osakkeetCalculator'

type Language = 'fi' | 'en'

const pageStyles = {
  stack: styles({ display: 'flex', flexDirection: 'column', gap: '18px' }),
  denseStack: styles({ display: 'flex', flexDirection: 'column', gap: '10px' }),
  gridTwo: styles({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }),
  field: styles({ display: 'flex', flexDirection: 'column', gap: '6px' }),
  rowButtons: styles({ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }),
  summaryGrid: styles({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }),
  summaryItem: styles({
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }),
  inlineCode: styles({
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    padding: '2px 6px',
    borderRadius: '6px',
  }),
  smallButton: styles({
    border: '1px solid rgba(15, 23, 42, 0.12)',
    backgroundColor: '#fff',
    color: '#0f172a',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
  }),
  input: styles({
    border: '1px solid rgba(15, 23, 42, 0.12)',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '14px',
    width: '100%',
    backgroundColor: '#fff',
  }),
  warningBox: styles({
    border: '1px solid rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: '8px',
    padding: '12px',
  }),
  errorBox: styles({
    border: '1px solid rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: '8px',
    padding: '12px',
  }),
}

function euro(value: { toFixed: (precision?: number) => string }) {
  return `${value.toFixed(2)} €`
}

function amount(value: { toFixed: (precision?: number) => string }) {
  return value.toFixed(2)
}

function percentage(value: { toFixed: (precision?: number) => string }) {
  return `${value.toFixed(2)} %`
}

function multiplier(value: { toFixed: (precision?: number) => string }) {
  return `${value.toFixed(2)}x`
}

function isYearMathValueWarning(warning: string) {
  return warning.includes('osinkoverotuksen jakoa ei voitu laskea ilman vuoden matemaattista arvoa / osake')
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function languageStorageKey() {
  return 'osakkeet-language'
}

function tryLoadLanguage(): Language {
  return localStorage.getItem(languageStorageKey()) === 'en' ? 'en' : 'fi'
}

function texts(language: Language) {
  return language === 'en'
    ? {
        languageTitle: 'Language',
        ipoCalculatorTitle: 'IPO calculator for shares',
        intro:
          'Calculates how capital repayments are allocated, how acquisition cost remains, and what the IPO sale produces before and after tax.',
        unlistedIntro:
          'This calculator is intended for an unlisted company before listing. From the IPO date onward, distributions are treated as dividends in this view.',
        assumptions: 'Calculation assumptions',
        subscriptions: 'Share subscriptions',
        rows: 'rows',
        subscriptionsHelp: 'Enter all subscription lots in acquisition order. FIFO is used for sales.',
        date: 'Date',
        amount: 'Amount',
        totalPrice: 'Total price',
        originalShareValue: 'Original share value',
        capitalRepaymentPerShare: 'Capital repayment / share',
        remainingCostPerShare: 'Remaining acquisition cost / share',
        remove: 'Remove',
        addSubscription: 'Add subscription',
        payouts: 'Dividends and capital repayments',
        payoutsHelp:
          'Total amount and cash paid are calculated automatically from the per-share amount, holdings, and withholding.',
        type: 'Type',
        amountPerShare: 'EUR / share',
        total: 'Total',
        withholding: 'To tax office in advance',
        cashPaid: 'Paid in cash',
        capitalRepayment: 'Capital repayment',
        dividend: 'Dividend',
        addPayout: 'Add distribution',
        ipoDetails: 'IPO details',
        ipoDate: 'IPO date',
        totalShareCount: 'Total share count',
        totalIpoCost: 'Total IPO costs',
        currentShareValue: 'Current share value',
        currentTotalValue: 'Current total value',
        estimatedPreIpoValue: 'Estimated pre-IPO value',
        ipoSharePrice: 'IPO share price',
        increasePercent: 'Increase %',
        increaseMultiplier: 'Multiplier',
        secondarySellPercent: 'Estimated secondary sell %',
        secondaryHelp: 'Used to allocate IPO cost per sold share.',
        mathematicalValues: 'Mathematical value / share for known years',
        year: 'Year',
        valuePerShare: 'Value / share',
        addYear: 'Add year',
        summary: 'Summary',
        subscribedShares: 'Subscribed shares',
        subscribedCost: 'Subscription acquisition cost',
        ipoPricePerShare: 'IPO price / share',
        currentValuePerShare: 'Current value / share',
        ipoCostPerSecondaryShare: 'IPO cost / secondary share',
        secondarySharesTotal: 'Secondary shares total',
        allocationByLot: 'Allocation by subscription lot',
        distribution: 'Distribution',
        shares: 'Shares',
        remainingPerShare: 'Remaining / share',
        ipoSellDetails: 'IPO sell details',
        sharesToSell: 'Number of shares to sell',
        ipoPriceTotal: 'Total IPO price',
        actualCosts: 'Actual costs',
        hmo20: 'HMO 20%',
        hmo40: 'HMO 40%',
        capitalGain: 'Capital gain',
        taxFreePart: 'Tax-free part',
        taxedPart: 'Taxed part',
        totalRow: 'Total',
        ipoSummary: 'IPO summary',
        grossSale: 'Gross sale',
        netCash: 'In cash',
        taxMan: 'To tax man',
        totalLosses: 'Total losses',
        taxableCapitalGain: 'Taxable capital gain',
        sharesLeft: 'Shares remaining',
        taxReturns: 'Tax return summary',
        yearWarningMissingMathValue:
          'Dividend tax split could not be calculated without the year-specific mathematical value / share.',
        taxableCapitalIncome: 'Taxable capital income',
        taxFreeCapitalIncome: 'Tax-free capital income',
        taxableEarnedDividend: 'Taxable earned-income dividend',
        taxFreeEarnedDividend: 'Tax-free earned-income dividend',
        ipoSaleAllocation: 'IPO sale allocation',
        save: 'Save to browser',
        load: 'Load saved',
        restoreExample: 'Restore example',
        clearExample: 'Clear example',
        storage: 'Storage',
        saved: 'Saved',
        loaded: 'Loaded',
        exampleRestored: 'Example restored',
        exampleCleared: 'Example data cleared',
        sourceDividends: 'Tax Admin: Dividends from an unlisted company',
        source9a: 'Tax Admin: Form 9A instructions',
        sourceSales: 'Tax Admin: Sale of shares',
        typeCapitalReturn: 'Capital repayment',
        typeDividend: 'Dividend',
      }
    : {
        languageTitle: 'Kieli',
        ipoCalculatorTitle: 'IPO-laskuri osakkeille',
        intro:
          'Laskee pääomanpalautusten kohdistuksen, hankintamenon jäljellä olevan määrän sekä IPO-myynnin verollisen ja nettomääräisen lopputuloksen.',
        unlistedIntro:
          'Tämä laskuri on tarkoitettu ennen listautumista olevalle listaamattomalle yhtiölle. IPO-päivästä eteenpäin varojenjako käsitellään tässä näkymässä osinkona.',
        assumptions: 'Laskennan oletukset',
        subscriptions: 'Osakemerkinnät',
        rows: 'riviä',
        subscriptionsHelp:
          'Syötä kaikki merkintäerät omassa hankintajärjestyksessä. Myynnissä käytetään FIFO-periaatetta.',
        date: 'Päivä',
        amount: 'Määrä',
        totalPrice: 'Kokonaishinta',
        originalShareValue: 'Alkuperäinen osakkeen arvo',
        capitalRepaymentPerShare: 'Pääomanpalautus / osake',
        remainingCostPerShare: 'Jäljellä oleva hankintameno / osake',
        remove: 'Poista',
        addSubscription: 'Lisää merkintä',
        payouts: 'Osingot ja pääomanpalautukset',
        payoutsHelp:
          'Yhteensä ja maksettu käteisenä lasketaan automaattisesti osakekohtaisen määrän, omistuksen ja ennakonpidätyksen perusteella.',
        type: 'Tyyppi',
        amountPerShare: '€/osake',
        total: 'Yhteensä',
        withholding: 'Ennakko verottajalle',
        cashPaid: 'Maksettu käteisenä',
        capitalRepayment: 'Pääomanpalautus',
        dividend: 'Osinko',
        addPayout: 'Lisää varojenjako',
        ipoDetails: 'IPO-tiedot',
        ipoDate: 'IPO-päivä',
        totalShareCount: 'Osakkeiden kokonaismäärä',
        totalIpoCost: 'IPO-kulut yhteensä',
        currentShareValue: 'Nykyinen osakkeen arvo',
        currentTotalValue: 'Nykyinen kokonaisarvo',
        estimatedPreIpoValue: 'Arvioitu pre-IPO-arvo',
        ipoSharePrice: 'IPO-hinta / osake',
        increasePercent: 'Nousu %',
        increaseMultiplier: 'Kerroin',
        secondarySellPercent: 'Arvioitu secondary-myynti %',
        secondaryHelp: 'Käytetään IPO-kulun allokointiin per myyty osake.',
        mathematicalValues: 'Matemaattinen arvo / osake tunnetuille vuosille',
        year: 'Vuosi',
        valuePerShare: 'Arvo / osake',
        addYear: 'Lisää vuosi',
        summary: 'Yhteenveto',
        subscribedShares: 'Merkittyjä osakkeita',
        subscribedCost: 'Merkintöjen hankintameno',
        ipoPricePerShare: 'IPO-hinta / osake',
        currentValuePerShare: 'Nykyarvo / osake',
        ipoCostPerSecondaryShare: 'IPO-kulu / secondary-osake',
        secondarySharesTotal: 'Secondary-osakkeita yhteensä',
        allocationByLot: 'Kohdistus merkintäerille',
        distribution: 'Varojenjako',
        shares: 'Osakkeita',
        remainingPerShare: 'Jäljellä / osake',
        ipoSellDetails: 'IPO-myynnin tiedot',
        sharesToSell: 'Myytävien osakkeiden määrä',
        ipoPriceTotal: 'IPO-hinta yhteensä',
        actualCosts: 'Todelliset kulut',
        hmo20: 'HMO 20 %',
        hmo40: 'HMO 40 %',
        capitalGain: 'Luovutusvoitto',
        taxFreePart: 'Veroton osa',
        taxedPart: 'Verotettava osa',
        totalRow: 'Yhteensä',
        ipoSummary: 'IPOn yhteenveto',
        grossSale: 'Myynti brutto',
        netCash: 'Käteen',
        taxMan: 'Verottajalle',
        totalLosses: 'Tappiot yhteensä',
        taxableCapitalGain: 'Verotettava luovutusvoitto',
        sharesLeft: 'Osakkeita jäljelle',
        taxReturns: 'Yhteenveto veroilmoituksista',
        yearWarningMissingMathValue: 'Osinkoverotuksen jakoa ei voitu laskea ilman vuoden matemaattista arvoa / osake.',
        taxableCapitalIncome: 'Veronalaista pääomatuloa',
        taxFreeCapitalIncome: 'Verotonta pääomatuloa',
        taxableEarnedDividend: 'Veronalaista ansiotulo-osinkoa',
        taxFreeEarnedDividend: 'Verotonta ansiotulo-osinkoa',
        ipoSaleAllocation: 'IPO-myynnin jako',
        save: 'Tallenna selaimeen',
        load: 'Lataa tallennettu',
        restoreExample: 'Palauta esimerkki',
        clearExample: 'Poista esimerkki',
        storage: 'Tallennus',
        saved: 'Tallennettu',
        loaded: 'Ladattu',
        exampleRestored: 'Esimerkki palautettu',
        exampleCleared: 'Esimerkkidata poistettu',
        sourceDividends: 'Verohallinto: Osingot listaamattomasta yhtiöstä',
        source9a: 'Verohallinto: 9A täyttöohje',
        sourceSales: 'Verohallinto: Osakkeiden myynti',
        typeCapitalReturn: 'Pääomanpalautus',
        typeDividend: 'Osinko',
      }
}

function initialSubscriptions(): ShareSubscriptionInput[] {
  return [
    { id: createId('sub'), date: '15.05.2017', amount: '100000', totalPrice: '8000', originalShareValue: '0.08' },
    { id: createId('sub'), date: '01.10.2021', amount: '25000', totalPrice: '11250', originalShareValue: '0.45' },
  ]
}

function initialReimbursements(): ShareReimbursementInput[] {
  return [
    { id: createId('reimb'), type: 'capital_return', date: '30.06.2024', amountPerShare: '0.12' },
    { id: createId('reimb'), type: 'dividend', date: '30.06.2025', amountPerShare: '0.20' },
  ]
}

function initialMathematicalShareValues(): MathematicalShareValueInput[] {
  return [
    { id: createId('math'), year: '2024', valuePerShare: '1.28' },
    { id: createId('math'), year: '2025', valuePerShare: '1.35' },
    { id: createId('math'), year: '2026', valuePerShare: '1.40' },
  ]
}

function initialIpoDetails(): IpoDetailsInput {
  return {
    ipoDate: '15.09.2026',
    totalShareCount: '2500000',
    totalIpoCost: '1800000',
    currentShareValue: '66',
    estimatedPreIpoValue: '125000000',
    estimatedSecondaryShareSellPercentage: '12',
  }
}

function initialSellDetails(): IpoSellDetailsInput {
  return {
    amount: '50000',
  }
}

function createDefaultData(): OsakkeetFormData {
  return {
    subscriptions: initialSubscriptions(),
    reimbursements: initialReimbursements(),
    mathematicalShareValues: initialMathematicalShareValues(),
    ipo: initialIpoDetails(),
    sell: initialSellDetails(),
  }
}

function createEmptyData(): OsakkeetFormData {
  return {
    subscriptions: [{ id: createId('sub'), date: '', amount: '', totalPrice: '', originalShareValue: '' }],
    reimbursements: [{ id: createId('reimb'), type: 'capital_return', date: '', amountPerShare: '' }],
    mathematicalShareValues: [{ id: createId('math'), year: '', valuePerShare: '' }],
    ipo: {
      ipoDate: '',
      totalShareCount: '',
      totalIpoCost: '',
      currentShareValue: '',
      estimatedPreIpoValue: '',
      estimatedSecondaryShareSellPercentage: '',
    },
    sell: {
      amount: '',
    },
  }
}

function formStorageKey() {
  return 'osakkeet-ipo-laskuri'
}

function normalizeLoadedData(parsed: Partial<OsakkeetFormData>): OsakkeetFormData {
  const ipo = (parsed.ipo || {}) as Partial<IpoDetailsInput>
  return {
    subscriptions: (parsed.subscriptions || []).map((subscription) => ({
      ...subscription,
      totalPrice: subscription.totalPrice || subscription.pricePerShare || '',
      originalShareValue: subscription.originalShareValue || subscription.pricePerShare || '',
    })),
    reimbursements: (parsed.reimbursements || []).map((reimbursement) => ({
      ...reimbursement,
      type: reimbursement.type || 'capital_return',
    })),
    mathematicalShareValues: (parsed.mathematicalShareValues || []).map((row) => ({
      ...row,
    })),
    ipo: {
      ipoDate: ipo.ipoDate || '',
      totalShareCount: ipo.totalShareCount || '',
      totalIpoCost: ipo.totalIpoCost || '',
      currentShareValue: ipo.currentShareValue || '',
      estimatedPreIpoValue: ipo.estimatedPreIpoValue || '',
      estimatedSecondaryShareSellPercentage: ipo.estimatedSecondaryShareSellPercentage || '',
    },
    sell: {
      ...createEmptyData().sell,
      ...parsed.sell,
    },
  }
}

function tryLoadSavedData(): OsakkeetFormData {
  const saved = localStorage.getItem(formStorageKey())
  if (!saved) return createDefaultData()
  try {
    const parsed = JSON.parse(saved) as Partial<OsakkeetFormData>
    return normalizeLoadedData(parsed)
  } catch {
    return createDefaultData()
  }
}

function updateArrayItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function removeArrayItem<T extends { id: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id)
}

function textField(labelText: string, inputNode: HTMLInputElement | HTMLSelectElement, help?: string) {
  return div(pageStyles.field, label(labelText), inputNode, help && span({ class: 'muted' }, help))
}

function finnishDateInput(value: string, onInput: (value: string) => void, onChange?: (value: string) => void) {
  return inputs.text(
    {
      value,
      placeholder: 'pp.kk.vvvv',
      inputMode: 'numeric',
    },
    pageStyles.input,
    events({
      input({ node }) {
        onInput(node.value)
      },
      change({ node }) {
        onChange?.(node.value)
      },
    })
  )
}

function infoCard(title: string, value: string, help?: string) {
  return div(pageStyles.summaryItem, span({ class: 'muted' }, title), b(value), help && span({ class: 'muted' }, help))
}

function linkToSource(textValue: string, href: string) {
  return a(textValue, { href, target: '_blank', rel: 'noreferrer' })
}

function assumptionsContent(language: Language) {
  const t = texts(language)
  return div(
    pageStyles.denseStack,
    h3(t.assumptions),
    ul(
      li(
        language === 'en'
          ? 'Sales are allocated to subscription lots using FIFO.'
          : 'Myynti kohdistetaan merkintäeriin FIFO-järjestyksessä.'
      ),
      li(
        language === 'en'
          ? 'Before the IPO date, distributions from invested unrestricted equity are treated as capital repayment only to the extent the same shareholder gets back their own investment made within the last 10 years.'
          : 'Ennen IPO-päivää tehdyt SVOP-varojenjaot käsitellään pääomanpalautuksena vain siltä osin kuin sama osakas saa takaisin omaa enintään 10 vuotta vanhaa sijoitustaan.'
      ),
      li(
        language === 'en'
          ? 'On and after the IPO date, distributions are treated as dividends in this calculator.'
          : 'IPO-päivänä tai sen jälkeen tehdyt varojenjaot käsitellään tässä laskurissa kokonaan osinkona.'
      ),
      li(
        language === 'en'
          ? 'Tax categories for dividends from an unlisted company are calculated using the entered mathematical value per share for each year.'
          : 'Listaamattoman yhtiön osingon verolajit lasketaan syötetyn osakkeiden matemaattisen arvon perusteella.'
      ),
      li(
        language === 'en'
          ? 'The deemed acquisition cost is compared separately for each subscription lot used in the sale.'
          : 'Hankintameno-olettama vertaillaan jokaiselle käytetylle merkintäerälle erikseen.'
      ),
      li(
        language === 'en'
          ? 'Capital income tax is estimated only for this sale using the 2026 30% / 34% rates.'
          : 'Pääomatulovero arvioidaan vain tämän myynnin perusteella vuoden 2026 30 % / 34 % verokannoilla.'
      )
    ),
    p(
      { class: 'muted' },
      language === 'en' ? 'Sources: ' : 'Lähteet: ',
      linkToSource(
        t.sourceDividends,
        'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/osingot-listaamattomasta-yhtiosta/'
      ),
      ', ',
      linkToSource(
        t.source9a,
        'https://www.vero.fi/tietoa-verohallinnosta/yhteystiedot-ja-asiointi/lomakkeet/tayttoohjeet/9a-arvopapereiden-luovutusvoitot-ja--tappiot-t%C3%A4ytt%C3%B6ohje/'
      ),
      ', ',
      linkToSource(t.sourceSales, 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osakkeiden_myynt/')
    )
  )
}

function renderMathematicalShareValuesEditor(
  target: HTMLElement,
  dataState: ReturnType<typeof createState<OsakkeetFormData>>,
  language: Language
) {
  const t = texts(language)
  replaceChildren(
    target,
    h3(t.mathematicalValues),
    table(
      thead(tr(th(t.year), th(t.valuePerShare), th({ class: 'no-print' }, ''))),
      tbody(
        dataState.get().mathematicalShareValues.map((row) =>
          tr(
            td(
              inputs.number(
                { step: '1', min: '0', value: row.year },
                pageStyles.input,
                events({
                  input({ node }) {
                    dataState.update({
                      mathematicalShareValues: updateArrayItem(dataState.get().mathematicalShareValues, row.id, {
                        year: node.value,
                      }),
                    })
                  },
                })
              )
            ),
            td(
              inputs.number(
                { step: '0.0001', min: '0', value: row.valuePerShare },
                pageStyles.input,
                events({
                  input({ node }) {
                    dataState.update({
                      mathematicalShareValues: updateArrayItem(dataState.get().mathematicalShareValues, row.id, {
                        valuePerShare: node.value,
                      }),
                    })
                  },
                })
              )
            ),
            td(
              { class: 'no-print' },
              button(
                t.remove,
                pageStyles.smallButton,
                events({
                  click() {
                    dataState.update({
                      mathematicalShareValues: removeArrayItem(dataState.get().mathematicalShareValues, row.id),
                    })
                    renderMathematicalShareValuesEditor(target, dataState, language)
                  },
                })
              )
            )
          )
        )
      )
    ),
    div(
      pageStyles.rowButtons,
      button(
        t.addYear,
        { class: 'blueButton' },
        events({
          click() {
            dataState.update({
              mathematicalShareValues: [
                ...dataState.get().mathematicalShareValues,
                { id: createId('math'), year: '', valuePerShare: '' },
              ],
            })
            renderMathematicalShareValuesEditor(target, dataState, language)
          },
        })
      )
    )
  )
}

function taxSummarySection(calculation: OsakkeetCalculation, language: Language) {
  const t = texts(language)
  const zeroMoney = calculation.ipo.totalIpoCost.mul(0)
  const yearSet = new Set<number>()
  calculation.reimbursements.forEach((reimbursement) => {
    const date = reimbursement.date.match(/(\d{4})$/)?.[1]
    if (date) yearSet.add(Number(date))
  })
  const ipoYear = calculation.ipo.ipoDate?.getUTCFullYear()
  if (ipoYear && calculation.sell.grossTotal.gt(0)) {
    yearSet.add(ipoYear)
  }
  const years = [...yearSet].sort((a, b) => a - b)

  if (years.length === 0) return false

  return div(
    years.map((year) => {
      const yearEntries = calculation.reimbursements.filter((reimbursement) =>
        reimbursement.date.endsWith(String(year))
      )
      const yearMathWarnings = yearEntries.filter(
        (row) => row.dividendTotal.gt(0) && row.shareholderMathematicalValue.eq(0)
      )
      const totalCapitalRepayment = yearEntries.reduce((acc, row) => acc.add(row.capitalRepaymentTotal), zeroMoney)
      const totalTaxableCapitalIncome = yearEntries.reduce((acc, row) => acc.add(row.taxableCapitalIncome), zeroMoney)
      const totalTaxFreeCapitalIncome = yearEntries.reduce(
        (acc, row) => acc.add(row.taxFreeCapitalIncomePortion),
        zeroMoney
      )
      const totalTaxableEarnedDividend = yearEntries.reduce((acc, row) => acc.add(row.taxableEarnedDividend), zeroMoney)
      const totalTaxFreeEarnedDividend = yearEntries.reduce((acc, row) => acc.add(row.taxFreeEarnedDividend), zeroMoney)
      const totalWithholding = yearEntries.reduce((acc, row) => acc.add(row.withholdingToTaxOffice), zeroMoney)
      const totalCash = yearEntries.reduce((acc, row) => acc.add(row.paidInCash), zeroMoney)
      return div(
        pageStyles.denseStack,
        h3(String(year)),
        yearMathWarnings.length > 0 &&
          div(
            pageStyles.warningBox,
            ul(yearMathWarnings.map((row) => li(`${row.date}: ${t.yearWarningMissingMathValue}`)))
          ),
        yearEntries.length > 0 &&
          table(
            thead(
              tr(
                th(t.date),
                th(t.type),
                th(t.capitalRepayment),
                th(t.taxableCapitalIncome),
                th(t.taxFreeCapitalIncome),
                th(t.taxableEarnedDividend),
                th(t.taxFreeEarnedDividend),
                th(t.withholding),
                th(t.cashPaid)
              )
            ),
            tbody(
              yearEntries.map((row) =>
                tr(
                  td(row.date),
                  td(row.type === 'dividend' ? t.typeDividend : t.typeCapitalReturn),
                  td(euro(row.capitalRepaymentTotal)),
                  td(euro(row.taxableCapitalIncome)),
                  td(euro(row.taxFreeCapitalIncomePortion)),
                  td(euro(row.taxableEarnedDividend)),
                  td(euro(row.taxFreeEarnedDividend)),
                  td(euro(row.withholdingToTaxOffice)),
                  td(euro(row.paidInCash))
                )
              ),
              tr(
                td(b(t.totalRow)),
                td(),
                td(euro(totalCapitalRepayment)),
                td(euro(totalTaxableCapitalIncome)),
                td(euro(totalTaxFreeCapitalIncome)),
                td(euro(totalTaxableEarnedDividend)),
                td(euro(totalTaxFreeEarnedDividend)),
                td(euro(totalWithholding)),
                td(euro(totalCash))
              )
            )
          ),
        ipoYear === year &&
          calculation.sell.grossTotal.gt(0) &&
          div(
            pageStyles.denseStack,
            h3(t.ipoSaleAllocation),
            div(
              pageStyles.summaryGrid,
              infoCard(t.grossSale, euro(calculation.sell.grossTotal)),
              infoCard(t.totalIpoCost, euro(calculation.sell.totalIpoCostAllocated)),
              infoCard(t.taxableCapitalGain, euro(calculation.sell.taxableGainTotal)),
              infoCard(t.taxMan, euro(calculation.sell.estimatedTax)),
              infoCard(t.netCash, euro(calculation.sell.netAfterTaxAndIpoCost)),
              infoCard(
                t.totalLosses,
                euro(
                  calculation.sell.grossTotal
                    .minus(calculation.sell.netAfterTaxAndIpoCost)
                    .minus(calculation.sell.estimatedTax)
                )
              )
            )
          )
      )
    })
  )
}

function renderSubscriptionsEditor(
  target: HTMLElement,
  dataState: ReturnType<typeof createState<OsakkeetFormData>>,
  calculation: OsakkeetCalculation,
  language: Language
) {
  const t = texts(language)
  const current = dataState.get()
  const summariesById = Object.fromEntries(
    calculation.subscriptions.map((subscription) => [subscription.id, subscription])
  )
  replaceChildren(
    target,
    div(
      { class: 'heading' },
      h2(t.subscriptions),
      span({ class: 'muted' }, `${current.subscriptions.length} ${t.rows}`)
    ),
    p({ class: 'muted' }, t.subscriptionsHelp),
    table(
      thead(
        tr(
          th(t.date),
          th(t.amount),
          th(t.totalPrice),
          th(t.originalShareValue),
          th(t.capitalRepaymentPerShare),
          th(t.remainingCostPerShare),
          th({ class: 'no-print' }, '')
        )
      ),
      tbody(
        current.subscriptions.map((subscription) =>
          tr(
            td(
              finnishDateInput(
                subscription.date,
                (value) => {
                  dataState.update({
                    subscriptions: updateArrayItem(dataState.get().subscriptions, subscription.id, {
                      date: value,
                    }),
                  })
                },
                () => renderSubscriptionsEditor(target, dataState, calculateOsakkeet(dataState.get()), language)
              )
            ),
            td(
              inputs.number(
                {
                  step: '1',
                  min: '0',
                  value: subscription.amount,
                },
                pageStyles.input,
                events({
                  input({ node }) {
                    dataState.update({
                      subscriptions: updateArrayItem(dataState.get().subscriptions, subscription.id, {
                        amount: node.value,
                      }),
                    })
                  },
                  change() {
                    renderSubscriptionsEditor(target, dataState, calculateOsakkeet(dataState.get()), language)
                  },
                })
              )
            ),
            td(
              inputs.number(
                {
                  step: '0.01',
                  min: '0',
                  value: subscription.totalPrice,
                },
                pageStyles.input,
                events({
                  input({ node }) {
                    dataState.update({
                      subscriptions: updateArrayItem(dataState.get().subscriptions, subscription.id, {
                        totalPrice: node.value,
                      }),
                    })
                  },
                  change() {
                    renderSubscriptionsEditor(target, dataState, calculateOsakkeet(dataState.get()), language)
                  },
                })
              )
            ),
            td(
              inputs.number(
                {
                  step: '0.0001',
                  min: '0',
                  value: subscription.originalShareValue,
                },
                pageStyles.input,
                events({
                  input({ node }) {
                    dataState.update({
                      subscriptions: updateArrayItem(dataState.get().subscriptions, subscription.id, {
                        originalShareValue: node.value,
                      }),
                    })
                  },
                })
              )
            ),
            td(summariesById[subscription.id] ? euro(summariesById[subscription.id].capitalRepaymentPerShare) : '-'),
            td(summariesById[subscription.id] ? euro(summariesById[subscription.id].remainingCostPerShare) : '-'),
            td(
              { class: 'no-print' },
              button(
                t.remove,
                pageStyles.smallButton,
                events({
                  click() {
                    dataState.update({
                      subscriptions: removeArrayItem(dataState.get().subscriptions, subscription.id),
                    })
                    renderSubscriptionsEditor(target, dataState, calculateOsakkeet(dataState.get()), language)
                  },
                })
              )
            )
          )
        )
      )
    ),
    div(
      pageStyles.rowButtons,
      button(
        t.addSubscription,
        { class: 'blueButton' },
        events({
          click() {
            dataState.update({
              subscriptions: [
                ...dataState.get().subscriptions,
                { id: createId('sub'), date: '', amount: '', totalPrice: '', originalShareValue: '' },
              ],
            })
            renderSubscriptionsEditor(target, dataState, calculateOsakkeet(dataState.get()), language)
          },
        })
      )
    )
  )
}

function renderReimbursementsEditor(
  target: HTMLElement,
  dataState: ReturnType<typeof createState<OsakkeetFormData>>,
  calculation: OsakkeetCalculation,
  refreshRelatedValues: () => void,
  language: Language
) {
  const t = texts(language)
  const current = dataState.get()
  const summariesById = Object.fromEntries(
    calculation.reimbursements.map((reimbursement) => [reimbursement.id, reimbursement])
  )
  replaceChildren(
    target,
    div({ class: 'heading' }, h2(t.payouts), span({ class: 'muted' }, `${current.reimbursements.length} ${t.rows}`)),
    p({ class: 'muted' }, t.payoutsHelp),
    table(
      thead(
        tr(
          th(t.date),
          th(t.type),
          th(t.amountPerShare),
          th(t.total),
          th(t.withholding),
          th(t.cashPaid),
          th(t.capitalRepayment),
          th(t.dividend),
          th({ class: 'no-print' }, '')
        )
      ),
      tbody(
        current.reimbursements.map((reimbursement) =>
          tr(
            td(
              finnishDateInput(
                reimbursement.date,
                (value) => {
                  dataState.update({
                    reimbursements: updateArrayItem(dataState.get().reimbursements, reimbursement.id, {
                      date: value,
                    }),
                  })
                },
                () => refreshRelatedValues()
              )
            ),
            td(
              select(
                pageStyles.input,
                { value: reimbursement.type },
                events({
                  change({ node }) {
                    dataState.update({
                      reimbursements: updateArrayItem(dataState.get().reimbursements, reimbursement.id, {
                        type: node.value as ShareReimbursementInput['type'],
                      }),
                    })
                    refreshRelatedValues()
                  },
                }),
                option(t.typeCapitalReturn, { value: 'capital_return' }),
                option(t.typeDividend, { value: 'dividend' })
              )
            ),
            td(
              inputs.number(
                { step: '0.0001', min: '0', value: reimbursement.amountPerShare },
                pageStyles.input,
                events({
                  input({ node }) {
                    dataState.update({
                      reimbursements: updateArrayItem(dataState.get().reimbursements, reimbursement.id, {
                        amountPerShare: node.value,
                      }),
                    })
                  },
                  change() {
                    refreshRelatedValues()
                  },
                })
              )
            ),
            td(summariesById[reimbursement.id] ? euro(summariesById[reimbursement.id].grossTotal) : '-'),
            td(summariesById[reimbursement.id] ? euro(summariesById[reimbursement.id].withholdingToTaxOffice) : '-'),
            td(summariesById[reimbursement.id] ? euro(summariesById[reimbursement.id].paidInCash) : '-'),
            td(summariesById[reimbursement.id] ? euro(summariesById[reimbursement.id].capitalRepaymentTotal) : '-'),
            td(summariesById[reimbursement.id] ? euro(summariesById[reimbursement.id].dividendTotal) : '-'),
            td(
              { class: 'no-print' },
              button(
                t.remove,
                pageStyles.smallButton,
                events({
                  click() {
                    dataState.update({
                      reimbursements: removeArrayItem(dataState.get().reimbursements, reimbursement.id),
                    })
                    refreshRelatedValues()
                  },
                })
              )
            )
          )
        )
      )
    ),
    div(
      pageStyles.rowButtons,
      button(
        t.addPayout,
        { class: 'blueButton' },
        events({
          click() {
            dataState.update({
              reimbursements: [
                ...dataState.get().reimbursements,
                { id: createId('reimb'), type: 'capital_return', date: '', amountPerShare: '' },
              ],
            })
            refreshRelatedValues()
          },
        })
      )
    )
  )
}

function renderIpoEditor(
  target: HTMLElement,
  dataState: ReturnType<typeof createState<OsakkeetFormData>>,
  calculation: OsakkeetCalculation,
  language: Language
) {
  const t = texts(language)
  const { ipo } = dataState.get()
  const currentTotalValueNode = b(euro(calculation.ipo.currentTotalValue))
  const ipoSharePriceNode = b(euro(calculation.ipo.ipoPricePerShare))
  const increasePercentNode = b(percentage(calculation.ipo.increasePercentage))
  const increaseMultiplierNode = b(multiplier(calculation.ipo.increaseMultiplier))
  const updateDerivedIpoValues = () => {
    const nextIpo = calculateOsakkeet(dataState.get()).ipo
    currentTotalValueNode.textContent = euro(nextIpo.currentTotalValue)
    ipoSharePriceNode.textContent = euro(nextIpo.ipoPricePerShare)
    increasePercentNode.textContent = percentage(nextIpo.increasePercentage)
    increaseMultiplierNode.textContent = multiplier(nextIpo.increaseMultiplier)
  }
  replaceChildren(
    target,
    h2(t.ipoDetails),
    div(
      pageStyles.gridTwo,
      textField(
        t.currentShareValue,
        inputs.number(
          { step: '0.01', min: '0', value: ipo.currentShareValue },
          pageStyles.input,
          events({
            input({ node }) {
              dataState.update({ ipo: { ...dataState.get().ipo, currentShareValue: node.value } })
              updateDerivedIpoValues()
            },
          })
        )
      ),
      textField(
        t.totalShareCount,
        inputs.number(
          { step: '1', min: '0', value: ipo.totalShareCount },
          pageStyles.input,
          events({
            input({ node }) {
              dataState.update({ ipo: { ...dataState.get().ipo, totalShareCount: node.value } })
              updateDerivedIpoValues()
            },
          })
        )
      ),
      div(pageStyles.field, label(t.currentTotalValue), currentTotalValueNode),
      div()
    ),
    div(
      pageStyles.gridTwo,
      textField(
        t.estimatedPreIpoValue,
        inputs.number(
          { step: '0.01', min: '0', value: ipo.estimatedPreIpoValue },
          pageStyles.input,
          events({
            input({ node }) {
              dataState.update({ ipo: { ...dataState.get().ipo, estimatedPreIpoValue: node.value } })
              updateDerivedIpoValues()
            },
          })
        )
      ),
      div(pageStyles.field, label(t.ipoSharePrice), ipoSharePriceNode),
      textField(
        t.totalIpoCost,
        inputs.number(
          { step: '0.01', min: '0', value: ipo.totalIpoCost },
          pageStyles.input,
          events({
            input({ node }) {
              dataState.update({ ipo: { ...dataState.get().ipo, totalIpoCost: node.value } })
            },
          })
        )
      ),
      textField(
        t.secondarySellPercent,
        inputs.number(
          { step: '0.01', min: '0', value: ipo.estimatedSecondaryShareSellPercentage },
          pageStyles.input,
          events({
            input({ node }) {
              dataState.update({
                ipo: { ...dataState.get().ipo, estimatedSecondaryShareSellPercentage: node.value },
              })
            },
          })
        ),
        t.secondaryHelp
      ),
      textField(
        t.ipoDate,
        finnishDateInput(ipo.ipoDate, (value) => {
          dataState.update({ ipo: { ...dataState.get().ipo, ipoDate: value } })
        }),
        language === 'en'
          ? 'Format dd.mm.yyyy. The same date is used when checking eligibility for the 10-year deemed acquisition cost.'
          : 'Muoto pp.kk.vvvv. Samaa päivää käytetään 10 vuoden hankintameno-olettaman tarkistukseen.'
      )
    ),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(t.increasePercent), increasePercentNode),
      div(pageStyles.field, label(t.increaseMultiplier), increaseMultiplierNode)
    )
  )
}

function renderResultSummary(
  target: HTMLElement,
  calculation: OsakkeetCalculation,
  dataState: ReturnType<typeof createState<OsakkeetFormData>>,
  language: Language
) {
  const t = texts(language)
  const reimbursementRows = calculation.reimbursements.flatMap((entry) =>
    entry.allocations.map((allocation) =>
      tr(
        td(entry.date),
        td(allocation.subscriptionDate),
        td(amount(allocation.shares)),
        td(euro(allocation.capitalRepayment)),
        td(euro(allocation.dividend)),
        td(euro(allocation.remainingCostPerShareAfter))
      )
    )
  )
  const totalLosses = calculation.sell.grossTotal
    .minus(calculation.sell.netAfterTaxAndIpoCost)
    .minus(calculation.sell.estimatedTax)
  const grossTotal = calculation.sell.grossTotal
  const grossPercent = (value: typeof grossTotal) =>
    grossTotal.gt(0) ? value.div(grossTotal).mul(100).toFixed(2) : '0.00'
  const zeroMoney = calculation.sell.grossTotal.mul(0)
  const totalActualDeduction = calculation.sell.usedSubscriptions.reduce(
    (acc, lot) => acc.add(lot.actualDeduction),
    zeroMoney
  )
  const totalHmo20 = calculation.sell.usedSubscriptions.reduce((acc, lot) => acc.add(lot.gross.mul(0.2)), zeroMoney)
  const totalHmo40 = calculation.sell.usedSubscriptions.reduce((acc, lot) => acc.add(lot.gross.mul(0.4)), zeroMoney)
  const totalTaxableGain = calculation.sell.usedSubscriptions.reduce((acc, lot) => acc.add(lot.taxableGain), zeroMoney)
  const totalTaxFreeGain = calculation.sell.usedSubscriptions.reduce(
    (acc, lot) => acc.add(lot.taxFreeGainPart),
    zeroMoney
  )
  const totalTaxedGain = calculation.sell.usedSubscriptions.reduce((acc, lot) => acc.add(lot.taxedGainPart), zeroMoney)

  replaceChildren(
    target,
    calculation.errors.length > 0 &&
      div(pageStyles.errorBox, h3('Syötteissä on korjattavaa'), ul(calculation.errors.map((error) => li(error)))),
    calculation.warnings.filter((warning) => !isYearMathValueWarning(warning)).length > 0 &&
      div(
        pageStyles.warningBox,
        h3('Huomiot'),
        ul(calculation.warnings.filter((warning) => !isYearMathValueWarning(warning)).map((warning) => li(warning)))
      ),
    section(
      { class: 'card' },
      h2(t.summary),
      div(
        pageStyles.summaryGrid,
        infoCard(t.subscribedShares, amount(calculation.ipo.totalSubscribedShares)),
        infoCard(t.subscribedCost, euro(calculation.ipo.totalSubscribedCost)),
        infoCard(t.ipoPricePerShare, euro(calculation.ipo.ipoPricePerShare)),
        infoCard(t.currentValuePerShare, euro(calculation.ipo.currentValuePerShare)),
        infoCard(t.ipoCostPerSecondaryShare, euro(calculation.ipo.ipoCostPerShare)),
        infoCard(t.secondarySharesTotal, amount(calculation.ipo.estimatedSecondaryShareCount))
      )
    ),
    calculation.reimbursements.length > 0 &&
      section(
        { class: 'card' },
        h2(t.allocationByLot),
        table(
          thead(
            tr(
              th(t.distribution),
              th(t.subscriptions),
              th(t.shares),
              th(t.capitalRepayment),
              th(t.dividend),
              th(t.remainingPerShare)
            )
          ),
          tbody(reimbursementRows)
        )
      ),
    section(
      { class: 'card' },
      h2(t.ipoSellDetails),
      div(
        pageStyles.gridTwo,
        textField(
          t.sharesToSell,
          inputs.number(
            { step: '1', min: '0', value: dataState.get().sell.amount },
            pageStyles.input,
            events({
              input({ node }) {
                dataState.update({ sell: { ...dataState.get().sell, amount: node.value } })
              },
            })
          )
        )
      ),
      h3(t.allocationByLot),
      table(
        thead(
          tr(
            th(t.date),
            th(t.amount),
            th(t.ipoPriceTotal),
            th(t.actualCosts),
            th(t.hmo20),
            th(t.hmo40),
            th(t.capitalGain),
            th(t.taxFreePart),
            th(t.taxedPart)
          )
        ),
        tbody([
          calculation.sell.usedSubscriptions.map((lot) =>
            tr(
              td(lot.subscriptionDate || '-'),
              td(`${amount(lot.soldAmount)} / ${amount(lot.totalSubscriptionShares)}`),
              td(euro(lot.gross)),
              td(
                lot.selectedMethod === 'Todellinen hankintameno + IPO-kulut'
                  ? b(euro(lot.actualDeduction))
                  : euro(lot.actualDeduction)
              ),
              td(lot.hankintamenoOlettaRate.eq(0.2) ? b(euro(lot.gross.mul(0.2))) : euro(lot.gross.mul(0.2))),
              td(lot.hankintamenoOlettaRate.eq(0.4) ? b(euro(lot.gross.mul(0.4))) : euro(lot.gross.mul(0.4))),
              td(lot.taxableGain.gte(0) ? euro(lot.taxableGain) : `${lot.taxableGain.toFixed(2)} €`),
              td(euro(lot.taxFreeGainPart)),
              td(euro(lot.taxedGainPart))
            )
          ),
          tr(
            td(b(t.totalRow)),
            td(),
            td(euro(calculation.sell.grossTotal)),
            td(euro(totalActualDeduction)),
            td(euro(totalHmo20)),
            td(euro(totalHmo40)),
            td(euro(totalTaxableGain)),
            td(euro(totalTaxFreeGain)),
            td(euro(totalTaxedGain))
          ),
        ])
      ),
      h3(t.ipoSummary),
      div(
        pageStyles.summaryGrid,
        infoCard(t.grossSale, euro(calculation.sell.grossTotal)),
        infoCard(
          t.netCash,
          `${euro(calculation.sell.netAfterTaxAndIpoCost)} (${grossPercent(calculation.sell.netAfterTaxAndIpoCost)} %)`
        ),
        infoCard(t.taxMan, `${euro(calculation.sell.estimatedTax)} (${grossPercent(calculation.sell.estimatedTax)} %)`),
        infoCard(t.totalLosses, `${euro(totalLosses)} (${grossPercent(totalLosses)} %)`),
        infoCard(t.taxableCapitalGain, euro(calculation.sell.taxableGainTotal)),
        infoCard(t.sharesLeft, amount(calculation.sell.remainingUnsoldShares))
      )
    )
  )
}

function createToolbar(
  dataState: ReturnType<typeof createState<OsakkeetFormData>>,
  rerenderEditors: () => void,
  statusNode: Text,
  language: Language
) {
  const t = texts(language)
  const fileInput = input(
    { type: 'file', accept: 'application/json,.json', hidden: true },
    events({
      change({ node }) {
        const inputNode = node as HTMLInputElement
        const file = inputNode.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result || '{}')) as Partial<OsakkeetFormData>
            dataState.set(normalizeLoadedData(parsed))
            rerenderEditors()
            statusNode.textContent = t.loaded
          } catch {
            statusNode.textContent = language === 'en' ? 'Invalid file' : 'Virheellinen tiedosto'
          }
          inputNode.value = ''
        }
        reader.onerror = () => {
          statusNode.textContent = language === 'en' ? 'File read failed' : 'Tiedoston luku epäonnistui'
          inputNode.value = ''
        }
        reader.readAsText(file)
      },
    })
  )
  return div(
    { class: 'card no-print' },
    div({ class: 'heading' }, h2(t.storage), span({ class: 'muted' }, statusNode)),
    fileInput,
    div(
      pageStyles.rowButtons,
      button(
        t.save,
        { class: 'blueButton' },
        events({
          click() {
            localStorage.setItem(formStorageKey(), JSON.stringify(dataState.get()))
            statusNode.textContent = t.saved
          },
        })
      ),
      button(
        language === 'en' ? 'Save file' : 'Tallenna tiedosto',
        pageStyles.smallButton,
        events({
          click() {
            const blob = new Blob([JSON.stringify(dataState.get(), null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'osakkeet-input-state.json'
            link.click()
            URL.revokeObjectURL(url)
            statusNode.textContent = language === 'en' ? 'File saved' : 'Tiedosto tallennettu'
          },
        })
      ),
      button(
        language === 'en' ? 'Load file' : 'Lataa tiedosto',
        pageStyles.smallButton,
        events({
          click() {
            fileInput.click()
          },
        })
      ),
      button(
        t.load,
        pageStyles.smallButton,
        events({
          click() {
            dataState.set(tryLoadSavedData())
            rerenderEditors()
            statusNode.textContent = t.loaded
          },
        })
      ),
      button(
        t.restoreExample,
        pageStyles.smallButton,
        events({
          click() {
            dataState.set(createDefaultData())
            rerenderEditors()
            statusNode.textContent = t.exampleRestored
          },
        })
      ),
      button(
        t.clearExample,
        pageStyles.smallButton,
        events({
          click() {
            dataState.set(createEmptyData())
            rerenderEditors()
            statusNode.textContent = t.exampleCleared
          },
        })
      )
    )
  )
}

export function osakkeetIpoCalculatorPage() {
  const dataState = createState({ value: tryLoadSavedData() })
  const languageState = createState<Language>({ value: tryLoadLanguage() })
  const calculationState = dataState.map((data) => calculateOsakkeet(data))

  const introSection = section({ class: 'card' })
  const toolbarRoot = div()
  const subscriptionsSection = section({ class: 'card' })
  const reimbursementsSection = section({ class: 'card' })
  const ipoSection = section({ class: 'card' })
  const taxSummarySectionRoot = section({ class: 'card' })
  const taxSummaryResultsRoot = div(pageStyles.denseStack)
  const resultsSection = div(pageStyles.stack)
  const statusNode = text('')
  const root = div(pageStyles.stack)

  const refreshEditors = () => {
    const calculation = calculateOsakkeet(dataState.get())
    const language = languageState.get()
    renderSubscriptionsEditor(subscriptionsSection, dataState, calculation, language)
    renderReimbursementsEditor(reimbursementsSection, dataState, calculation, refreshEditors, language)
  }

  const rerenderEditors = () => {
    const calculation = calculationState.get()
    const language = languageState.get()
    renderSubscriptionsEditor(subscriptionsSection, dataState, calculation, language)
    renderReimbursementsEditor(reimbursementsSection, dataState, calculation, refreshEditors, language)
    renderIpoEditor(ipoSection, dataState, calculation, language)
    replaceChildren(
      taxSummarySectionRoot,
      h2(texts(language).taxReturns),
      (() => {
        const editorRoot = div()
        renderMathematicalShareValuesEditor(editorRoot, dataState, language)
        return editorRoot
      })(),
      taxSummaryResultsRoot
    )
  }

  const renderTopSections = () => {
    const t = texts(languageState.get())
    replaceChildren(
      introSection,
      div(
        { class: 'heading' },
        h2(t.ipoCalculatorTitle),
        div(
          pageStyles.rowButtons,
          span({ class: 'muted' }, t.languageTitle),
          button(
            'FI',
            languageState.get() === 'fi' && { class: 'blueButton' },
            languageState.get() !== 'fi' && pageStyles.smallButton,
            events({
              click() {
                languageState.set('fi')
              },
            })
          ),
          button(
            'EN',
            languageState.get() === 'en' && { class: 'blueButton' },
            languageState.get() !== 'en' && pageStyles.smallButton,
            events({
              click() {
                languageState.set('en')
              },
            })
          )
        )
      ),
      p({ class: 'muted' }, t.intro),
      p({ class: 'muted' }, t.unlistedIntro),
      assumptionsContent(languageState.get())
    )
    replaceChildren(toolbarRoot, createToolbar(dataState, rerenderEditors, statusNode, languageState.get()))
  }

  calculationState.onValueChange((calculation) => {
    renderResultSummary(resultsSection, calculation, dataState, languageState.get())
    replaceChildren(taxSummaryResultsRoot, taxSummarySection(calculation, languageState.get()))
  })
  languageState.onValueChange(() => {
    localStorage.setItem(languageStorageKey(), languageState.get())
    renderTopSections()
    rerenderEditors()
    renderResultSummary(resultsSection, calculationState.get(), dataState, languageState.get())
    replaceChildren(taxSummaryResultsRoot, taxSummarySection(calculationState.get(), languageState.get()))
  })

  renderTopSections()
  rerenderEditors()
  replaceChildren(
    root,
    introSection,
    toolbarRoot,
    subscriptionsSection,
    reimbursementsSection,
    taxSummarySectionRoot,
    ipoSection,
    resultsSection
  )
  return root
}
