import { createState, mergeStates, type State } from '../../../ki-frame/src'
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
  option,
  p,
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
  type OsakkeetCalculation,
  type OsakkeetFormData,
} from './osakkeetCalculator'
import { getOsakkeetLocalization, type Language, type OsakkeetLocalization } from './osakkeetLocalizations'

const pageStyles = {
  stack: styles({ display: 'flex', flexDirection: 'column', gap: '18px' }),
  denseStack: styles({ display: 'flex', flexDirection: 'column', gap: '10px' }),
  gridTwo: styles({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }),
  field: styles({ display: 'flex', flexDirection: 'column', gap: '6px' }),
  compactField: styles({ width: '140px' }),
  compactTable: styles({ width: 'auto', maxWidth: 'fit-content', tableLayout: 'auto' }),
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

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const storageKeys = {
  language: 'osakkeet-language',
  formData: 'osakkeet-ipo-laskuri',
} as const

function tryLoadLanguage(): Language {
  return localStorage.getItem(storageKeys.language) === 'en' ? 'en' : 'fi'
}

function createOsakkeetFormData(demo: boolean): OsakkeetFormData {
  return {
    subscriptions: demo
      ? [
          {
            id: createId('sub'),
            date: '15.05.2017',
            vestingEndsOn: '',
            amount: '100000',
            totalPrice: '8000',
            originalShareValue: '0.08',
          },
          {
            id: createId('sub'),
            date: '01.10.2021',
            vestingEndsOn: '',
            amount: '25000',
            totalPrice: '11250',
            originalShareValue: '0.45',
          },
        ]
      : [{ id: createId('sub'), date: '', vestingEndsOn: '', amount: '', totalPrice: '', originalShareValue: '' }],
    cashDistributions: demo
      ? [
          { id: createId('distribution'), type: 'capital_return', date: '30.06.2024', amountPerShare: '0.12' },
          { id: createId('distribution'), type: 'dividend', date: '30.06.2025', amountPerShare: '0.20' },
        ]
      : [{ id: createId('distribution'), type: 'capital_return', date: '', amountPerShare: '' }],
    mathematicalShareValues: demo
      ? [
          { id: createId('math'), year: '2024', valuePerShare: '1.28' },
          { id: createId('math'), year: '2025', valuePerShare: '1.35' },
          { id: createId('math'), year: '2026', valuePerShare: '1.40' },
        ]
      : [{ id: createId('math'), year: '', valuePerShare: '' }],
    ipo: {
      ipoDate: demo ? '15.09.2026' : '',
      totalShareCount: demo ? '2500000' : '',
      totalIpoCost: demo ? '1800000' : '',
      currentShareValue: demo ? '66' : '',
      estimatedPreIpoValue: demo ? '125000000' : '',
      estimatedSecondaryShareSellPercentage: demo ? '12' : '',
    },
    sell: {
      amount: demo ? '50000' : '',
    },
  }
}

function sanitizeOsakkeetFormData(data: Partial<OsakkeetFormData>): OsakkeetFormData {
  const ipo = (data.ipo || {}) as Partial<IpoDetailsInput>
  return {
    subscriptions: (data.subscriptions || []).map((subscription) => ({
      id: subscription.id || createId('sub'),
      date: subscription.date || '',
      vestingEndsOn: subscription.vestingEndsOn || '',
      amount: subscription.amount || '',
      totalPrice: subscription.totalPrice || subscription.pricePerShare || '',
      originalShareValue: subscription.originalShareValue || subscription.pricePerShare || '',
    })),
    cashDistributions: (data.cashDistributions || []).map((cashDistribution) => ({
      id: cashDistribution.id || createId('distribution'),
      date: cashDistribution.date || '',
      type: cashDistribution.type || 'capital_return',
      amountPerShare: cashDistribution.amountPerShare || '',
    })),
    mathematicalShareValues: (data.mathematicalShareValues || []).map((row) => ({
      id: row.id || createId('math'),
      year: row.year || '',
      valuePerShare: row.valuePerShare || '',
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
      amount: data.sell?.amount || '',
    },
  }
}

function normalizeLoadedData(parsed: Partial<OsakkeetFormData>): OsakkeetFormData {
  const ipo = (parsed.ipo || {}) as Partial<IpoDetailsInput>
  return {
    subscriptions: (parsed.subscriptions || []).map((subscription) => ({
      ...subscription,
      vestingEndsOn: subscription.vestingEndsOn || '',
      totalPrice: subscription.totalPrice || subscription.pricePerShare || '',
      originalShareValue: subscription.originalShareValue || subscription.pricePerShare || '',
    })),
    cashDistributions: (parsed.cashDistributions || []).map((cashDistribution) => ({
      id: cashDistribution.id || createId('distribution'),
      date: cashDistribution.date || '',
      type: cashDistribution.type || 'capital_return',
      amountPerShare: cashDistribution.amountPerShare || '',
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
      ...createOsakkeetFormData(false).sell,
      ...parsed.sell,
    },
  }
}

function tryLoadSavedData(): OsakkeetFormData {
  const saved = localStorage.getItem(storageKeys.formData)
  if (!saved) return createOsakkeetFormData(true)
  try {
    const parsed = JSON.parse(saved) as Partial<OsakkeetFormData>
    return normalizeLoadedData(parsed)
  } catch {
    return createOsakkeetFormData(true)
  }
}

function updateArrayItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function removeArrayItem<T extends { id: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id)
}

type FormArrayKey = 'subscriptions' | 'cashDistributions' | 'mathematicalShareValues'
type FormArrayItem<Key extends FormArrayKey> = OsakkeetFormData[Key][number]

function updateFormArrayItem<Key extends FormArrayKey>(
  dataState: State<OsakkeetFormData>,
  key: Key,
  id: string,
  patch: Partial<FormArrayItem<Key>>
) {
  const items = dataState.get()[key] as FormArrayItem<Key>[]
  dataState.update({
    [key]: updateArrayItem(items, id, patch),
  } as Pick<OsakkeetFormData, Key>)
}

function removeFormArrayItem<Key extends FormArrayKey>(dataState: State<OsakkeetFormData>, key: Key, id: string) {
  const items = dataState.get()[key] as FormArrayItem<Key>[]
  dataState.update({
    [key]: removeArrayItem(items, id),
  } as Pick<OsakkeetFormData, Key>)
}

function appendFormArrayItem<Key extends FormArrayKey>(
  dataState: State<OsakkeetFormData>,
  key: Key,
  item: FormArrayItem<Key>
) {
  const items = dataState.get()[key] as FormArrayItem<Key>[]
  dataState.update({
    [key]: [...items, item],
  } as Pick<OsakkeetFormData, Key>)
}

function numberInput(value: string, options: { step: string; min: string }, onInput: (value: string) => void) {
  return inputs.number(
    {
      ...options,
      value,
    },
    pageStyles.input,
    events({
      input({ node }) {
        onInput(node.value)
      },
    })
  )
}

function finnishDateInput(value: string, onInput: (value: string) => void) {
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
    })
  )
}

function enumSelectInput<Value extends string>(
  value: Value,
  options: Array<{ label: string; value: Value }>,
  onChange: (value: Value) => void
) {
  return select(
    pageStyles.input,
    { value },
    events({
      change({ node }) {
        onChange(node.value as Value)
      },
    }),
    options.map((optionValue) => option(optionValue.label, { value: optionValue.value }))
  )
}

function infoCard(title: string, value: string, help?: string) {
  return div(pageStyles.summaryItem, span({ class: 'muted' }, title), b(value), help && span({ class: 'muted' }, help))
}

function hoverValue(value: string, tooltip: string, emphasized = false) {
  const node = span({ title: tooltip }, value)
  return emphasized ? b(node) : node
}

function linkToSource(textValue: string, href: string) {
  return a(textValue, { href, target: '_blank', rel: 'noreferrer' })
}

function setTextValue(node: Node, value: string) {
  if (node.textContent !== value) {
    node.textContent = value
  }
}

function setInputValue(node: HTMLInputElement, value: string) {
  if (node.value !== value) {
    node.value = value
  }
}

function setSelectValue(node: HTMLSelectElement, value: string) {
  if (node.value !== value) {
    node.value = value
  }
}

function setButtonVariant(node: HTMLButtonElement, primary: boolean) {
  node.className = primary ? 'blueButton' : String(pageStyles.smallButton)
}

function createRemoveButton(dataState: State<OsakkeetFormData>, remove: () => void) {
  const labelNode = text('')
  const buttonNode = button(
    labelNode,
    pageStyles.smallButton,
    events({
      click() {
        remove()
      },
    })
  ) as HTMLButtonElement
  return {
    buttonNode,
    setLabel({ texts }: Pick<OsakkeetPageReadModel, 'texts'>) {
      setTextValue(labelNode, texts.common.remove)
    },
  }
}

function createActionButton(labelNode: Text, variant: 'primary' | 'secondary', onClick: () => void) {
  return button(
    labelNode,
    variant === 'primary' ? { class: 'blueButton' } : pageStyles.smallButton,
    events({
      click() {
        onClick()
      },
    })
  ) as HTMLButtonElement
}

type RowController<T extends { id: string }> = {
  id: string
  node: HTMLTableRowElement
  set: (value: T, pageReadModel: OsakkeetPageReadModel) => void
}

function syncRowControllers<T extends { id: string }>(
  tbodyNode: HTMLElement,
  rowControllers: Map<string, RowController<T>>,
  values: T[],
  pageReadModel: OsakkeetPageReadModel,
  createRowController: (value: T) => RowController<T>
) {
  const nextControllers = new Map<string, RowController<T>>()
  const desiredIds = values.map((value) => value.id)
  for (const value of values) {
    const rowController = rowControllers.get(value.id) || createRowController(value)
    rowController.set(value, pageReadModel)
    nextControllers.set(value.id, rowController)
  }
  for (const [id, rowController] of rowControllers) {
    if (!nextControllers.has(id)) {
      rowController.node.remove()
    }
  }
  values.forEach((value, index) => {
    const rowController = nextControllers.get(value.id)!
    const existingNode = tbodyNode.children[index]
    if (existingNode !== rowController.node) {
      tbodyNode.insertBefore(rowController.node, existingNode || null)
    }
  })
  while (tbodyNode.children.length > desiredIds.length) {
    tbodyNode.lastElementChild?.remove()
  }
  rowControllers.clear()
  nextControllers.forEach((rowController, id) => rowControllers.set(id, rowController))
}

function assumptionsContent(t: OsakkeetLocalization) {
  return div(
    pageStyles.denseStack,
    h3(t.assumptions.title),
    ul(t.assumptions.items.map((item) => li(item))),
    p(
      { class: 'muted' },
      t.assumptions.sourcesLabel,
      linkToSource(
        t.sources.dividends,
        'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/osingot-listaamattomasta-yhtiosta/'
      ),
      ', ',
      linkToSource(
        t.sources.form9a,
        'https://www.vero.fi/tietoa-verohallinnosta/yhteystiedot-ja-asiointi/lomakkeet/tayttoohjeet/9a-arvopapereiden-luovutusvoitot-ja--tappiot-t%C3%A4ytt%C3%B6ohje/'
      ),
      ', ',
      linkToSource(t.sources.sales, 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osakkeiden_myynt/')
    )
  )
}

function createIpoNumberUpdater(
  dataState: State<OsakkeetFormData>,
  key: keyof Pick<
    IpoDetailsInput,
    | 'currentShareValue'
    | 'totalShareCount'
    | 'estimatedPreIpoValue'
    | 'totalIpoCost'
    | 'estimatedSecondaryShareSellPercentage'
  >
) {
  return (value: string) => {
    dataState.update({ ipo: { ...dataState.get().ipo, [key]: value } })
  }
}

function createIpoTextUpdater(dataState: State<OsakkeetFormData>, key: keyof Pick<IpoDetailsInput, 'ipoDate'>) {
  return (value: string) => {
    dataState.update({ ipo: { ...dataState.get().ipo, [key]: value } })
  }
}

function createMathematicalShareValuesEditor(dataState: State<OsakkeetFormData>) {
  const titleNode = text('')
  const yearHeaderNode = text('')
  const valueHeaderNode = text('')
  const addButtonLabelNode = text('')
  const tbodyNode = tbody()
  const rowControllers = new Map<string, RowController<{ id: string; year: string; valuePerShare: string }>>()

  const createRowController = (row: { id: string; year: string; valuePerShare: string }) => {
    const yearInput = numberInput(row.year, { step: '1', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'mathematicalShareValues', row.id, { year: value })
    })
    const valuePerShareInput = numberInput(row.valuePerShare, { step: '0.0001', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'mathematicalShareValues', row.id, { valuePerShare: value })
    })
    const removeButton = createRemoveButton(dataState, () => {
      removeFormArrayItem(dataState, 'mathematicalShareValues', row.id)
    })

    return {
      id: row.id,
      node: tr(
        td(div(pageStyles.compactField, yearInput)),
        td(div(pageStyles.compactField, valuePerShareInput)),
        td({ class: 'no-print' }, removeButton.buttonNode)
      ),
      set(nextRow, pageReadModel) {
        setInputValue(yearInput, nextRow.year)
        setInputValue(valuePerShareInput, nextRow.valuePerShare)
        removeButton.setLabel(pageReadModel)
      },
    } satisfies RowController<{ id: string; year: string; valuePerShare: string }>
  }

  const addButton = createActionButton(addButtonLabelNode, 'primary', () => {
    appendFormArrayItem(dataState, 'mathematicalShareValues', {
      id: createId('math'),
      year: '',
      valuePerShare: '',
    })
  })

  const root = div(
    h3(titleNode),
    table(
      pageStyles.compactTable,
      thead(tr(th(yearHeaderNode), th(valueHeaderNode), th({ class: 'no-print' }, ''))),
      tbodyNode
    ),
    div(pageStyles.rowButtons, addButton)
  )

  return {
    root,
    set({ texts, osakkeetCalculation, ...rest }: OsakkeetPageReadModel) {
      setTextValue(titleNode, texts.mathematicalShareValues.title)
      setTextValue(yearHeaderNode, texts.mathematicalShareValues.fields.year)
      setTextValue(valueHeaderNode, texts.mathematicalShareValues.fields.valuePerShare)
      setTextValue(addButtonLabelNode, texts.mathematicalShareValues.actions.add)
      syncRowControllers(
        tbodyNode,
        rowControllers,
        osakkeetCalculation.formData.mathematicalShareValues,
        { texts, osakkeetCalculation, ...rest },
        createRowController
      )
    },
  }
}

function taxSummarySection(calculation: OsakkeetCalculation, t: OsakkeetLocalization) {
  const zeroMoney = calculation.ipo.totalIpoCost.mul(0)
  const yearSet = new Set<number>()
  calculation.cashDistributions.forEach((cashDistribution) => {
    const date = cashDistribution.date.match(/(\d{4})$/)?.[1]
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
      const yearEntries = calculation.cashDistributions.filter((cashDistribution) =>
        cashDistribution.date.endsWith(String(year))
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
            ul(yearMathWarnings.map((row) => li(`${row.date}: ${t.taxReturns.yearWarningMissingMathValue}`)))
          ),
        yearEntries.length > 0 &&
          table(
            thead(
              tr(
                th(t.common.date),
                th(t.common.type),
                th(t.cashDistributions.fields.capitalRepayment),
                th(t.taxReturns.fields.taxableCapitalIncome),
                th(t.taxReturns.fields.taxFreeCapitalIncome),
                th(t.taxReturns.fields.taxableEarnedDividend),
                th(t.taxReturns.fields.taxFreeEarnedDividend),
                th(t.cashDistributions.fields.withholding),
                th(t.cashDistributions.fields.cashPaid)
              )
            ),
            tbody(
              yearEntries.map((row) =>
                tr(
                  td(row.date),
                  td(
                    row.type === 'dividend'
                      ? t.cashDistributions.types.dividend
                      : t.cashDistributions.types.capitalReturn
                  ),
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
                td(b(t.summary.totalRow)),
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
            h3(t.taxReturns.fields.ipoSaleAllocation),
            div(
              pageStyles.summaryGrid,
              infoCard(t.summary.ipoSell.cards.grossSale, euro(calculation.sell.grossTotal)),
              infoCard(t.summary.ipoSell.cards.ipoCostsAllocated, euro(calculation.sell.totalIpoCostAllocated)),
              infoCard(t.summary.ipoSell.cards.taxableCapitalGain, euro(calculation.sell.taxableGainTotal)),
              infoCard(t.summary.ipoSell.cards.taxMan, euro(calculation.sell.estimatedTax)),
              infoCard(t.summary.ipoSell.cards.netCash, euro(calculation.sell.netAfterTaxAndIpoCost))
            )
          )
      )
    })
  )
}

function createSubscriptionsSection(dataState: State<OsakkeetFormData>) {
  const titleNode = text('')
  const countNode = text('')
  const helpNode = text('')
  const summaryRoot = div(pageStyles.summaryGrid)
  const dateHeaderNode = text('')
  const vestingEndsOnHeaderNode = text('')
  const amountHeaderNode = text('')
  const totalPriceHeaderNode = text('')
  const originalShareValueHeaderNode = text('')
  const capitalRepaymentHeaderNode = text('')
  const remainingCostHeaderNode = text('')
  const addButtonLabelNode = text('')
  const tbodyNode = tbody()
  const rowControllers = new Map<
    string,
    RowController<{
      id: string
      date: string
      vestingEndsOn: string
      amount: string
      totalPrice: string
      originalShareValue: string
      capitalRepaymentPerShare: string
      remainingCostPerShare: string
    }>
  >()

  const createRowController = (row: {
    id: string
    date: string
    vestingEndsOn: string
    amount: string
    totalPrice: string
    originalShareValue: string
    capitalRepaymentPerShare: string
    remainingCostPerShare: string
  }) => {
    const dateInput = finnishDateInput(row.date, (value) => {
      updateFormArrayItem(dataState, 'subscriptions', row.id, { date: value })
    })
    const vestingEndsOnInput = finnishDateInput(row.vestingEndsOn, (value) => {
      updateFormArrayItem(dataState, 'subscriptions', row.id, { vestingEndsOn: value })
    })
    const amountInput = numberInput(row.amount, { step: '1', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'subscriptions', row.id, { amount: value })
    })
    const totalPriceInput = numberInput(row.totalPrice, { step: '0.01', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'subscriptions', row.id, { totalPrice: value })
    })
    const originalShareValueInput = numberInput(row.originalShareValue, { step: '0.0001', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'subscriptions', row.id, { originalShareValue: value })
    })
    const capitalRepaymentNode = text('-')
    const remainingCostNode = text('-')
    const removeButton = createRemoveButton(dataState, () => {
      removeFormArrayItem(dataState, 'subscriptions', row.id)
    })

    return {
      id: row.id,
      node: tr(
        td(dateInput),
        td(vestingEndsOnInput),
        td(amountInput),
        td(totalPriceInput),
        td(originalShareValueInput),
        td(capitalRepaymentNode),
        td(remainingCostNode),
        td({ class: 'no-print' }, removeButton.buttonNode)
      ),
      set(nextRow, pageReadModel) {
        setInputValue(dateInput, nextRow.date)
        setInputValue(vestingEndsOnInput, nextRow.vestingEndsOn)
        setInputValue(amountInput, nextRow.amount)
        setInputValue(totalPriceInput, nextRow.totalPrice)
        setInputValue(originalShareValueInput, nextRow.originalShareValue)
        setTextValue(capitalRepaymentNode, nextRow.capitalRepaymentPerShare)
        setTextValue(remainingCostNode, nextRow.remainingCostPerShare)
        removeButton.setLabel(pageReadModel)
      },
    } satisfies RowController<{
      id: string
      date: string
      vestingEndsOn: string
      amount: string
      totalPrice: string
      originalShareValue: string
      capitalRepaymentPerShare: string
      remainingCostPerShare: string
    }>
  }

  const addButton = createActionButton(addButtonLabelNode, 'primary', () => {
    appendFormArrayItem(dataState, 'subscriptions', {
      id: createId('sub'),
      date: '',
      vestingEndsOn: '',
      amount: '',
      totalPrice: '',
      originalShareValue: '',
    })
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(titleNode), span({ class: 'muted' }, countNode)),
    p({ class: 'muted' }, helpNode),
    summaryRoot,
    table(
      thead(
        tr(
          th(dateHeaderNode),
          th(vestingEndsOnHeaderNode),
          th(amountHeaderNode),
          th(totalPriceHeaderNode),
          th(originalShareValueHeaderNode),
          th(capitalRepaymentHeaderNode),
          th(remainingCostHeaderNode),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div(pageStyles.rowButtons, addButton)
  )

  return {
    root,
    set({ osakkeetCalculation, texts, ...rest }: OsakkeetPageReadModel) {
      const current = osakkeetCalculation.formData
      const totalShares = osakkeetCalculation.vesting.totalShares
      const vestedShares = osakkeetCalculation.vesting.vestedShares
      const unvestedShares = osakkeetCalculation.vesting.unvestedShares
      const sharePercent = (value: typeof totalShares) =>
        totalShares.gt(0)
          ? `${amount(value)} (${percentage(value.div(totalShares).mul(100))})`
          : `${amount(value)} (0.00 %)`
      const summariesById = Object.fromEntries(
        osakkeetCalculation.subscriptions.map((subscription) => [subscription.id, subscription])
      )
      setTextValue(titleNode, texts.subscriptions.title)
      setTextValue(countNode, `${current.subscriptions.length} ${texts.common.rows}`)
      setTextValue(helpNode, texts.subscriptions.help)
      setTextValue(dateHeaderNode, texts.common.date)
      setTextValue(vestingEndsOnHeaderNode, texts.subscriptions.fields.vestingEndsOn)
      setTextValue(amountHeaderNode, texts.common.amount)
      setTextValue(totalPriceHeaderNode, texts.subscriptions.fields.totalPrice)
      setTextValue(originalShareValueHeaderNode, texts.subscriptions.fields.originalShareValue)
      setTextValue(capitalRepaymentHeaderNode, texts.subscriptions.fields.capitalRepaymentPerShare)
      setTextValue(remainingCostHeaderNode, texts.subscriptions.fields.remainingCostPerShare)
      setTextValue(addButtonLabelNode, texts.subscriptions.actions.add)
      replaceChildren(
        summaryRoot,
        infoCard(texts.subscriptions.summary.totalShares, amount(totalShares)),
        infoCard(texts.subscriptions.summary.vestedShares, sharePercent(vestedShares)),
        infoCard(texts.subscriptions.summary.unvestedShares, sharePercent(unvestedShares))
      )
      syncRowControllers(
        tbodyNode,
        rowControllers,
        current.subscriptions.map((subscription) => ({
          id: subscription.id,
          date: subscription.date,
          vestingEndsOn: subscription.vestingEndsOn || '',
          amount: subscription.amount,
          totalPrice: subscription.totalPrice,
          originalShareValue: subscription.originalShareValue || '',
          capitalRepaymentPerShare: summariesById[subscription.id]
            ? euro(summariesById[subscription.id].capitalRepaymentPerShare)
            : '-',
          remainingCostPerShare: summariesById[subscription.id]
            ? euro(summariesById[subscription.id].remainingCostPerShare)
            : '-',
        })),
        { osakkeetCalculation, texts, ...rest },
        createRowController
      )
    },
  }
}

function createCashDistributionsSection(dataState: State<OsakkeetFormData>) {
  const titleNode = text('')
  const countNode = text('')
  const helpNode = text('')
  const dateHeaderNode = text('')
  const typeHeaderNode = text('')
  const amountPerShareHeaderNode = text('')
  const totalHeaderNode = text('')
  const withholdingHeaderNode = text('')
  const cashPaidHeaderNode = text('')
  const capitalRepaymentHeaderNode = text('')
  const dividendHeaderNode = text('')
  const addButtonLabelNode = text('')
  const tbodyNode = tbody()
  const rowControllers = new Map<
    string,
    RowController<{
      id: string
      date: string
      type: 'capital_return' | 'dividend'
      amountPerShare: string
      grossTotal: string
      withholdingToTaxOffice: string
      paidInCash: string
      capitalRepaymentTotal: string
      dividendTotal: string
    }>
  >()

  const createRowController = (row: {
    id: string
    date: string
    type: 'capital_return' | 'dividend'
    amountPerShare: string
    grossTotal: string
    withholdingToTaxOffice: string
    paidInCash: string
    capitalRepaymentTotal: string
    dividendTotal: string
  }) => {
    const dateInput = finnishDateInput(row.date, (value) => {
      updateFormArrayItem(dataState, 'cashDistributions', row.id, { date: value })
    })
    const typeInput = enumSelectInput(
      row.type,
      [
        { label: '', value: 'capital_return' },
        { label: '', value: 'dividend' },
      ],
      (value) => {
        updateFormArrayItem(dataState, 'cashDistributions', row.id, { type: value })
      }
    )
    const amountPerShareInput = numberInput(row.amountPerShare, { step: '0.0001', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'cashDistributions', row.id, { amountPerShare: value })
    })
    const grossTotalNode = text('-')
    const withholdingNode = text('-')
    const paidInCashNode = text('-')
    const capitalRepaymentNode = text('-')
    const dividendNode = text('-')
    const removeButton = createRemoveButton(dataState, () => {
      removeFormArrayItem(dataState, 'cashDistributions', row.id)
    })

    return {
      id: row.id,
      node: tr(
        td(dateInput),
        td(typeInput),
        td(amountPerShareInput),
        td(grossTotalNode),
        td(withholdingNode),
        td(paidInCashNode),
        td(capitalRepaymentNode),
        td(dividendNode),
        td({ class: 'no-print' }, removeButton.buttonNode)
      ),
      set(nextRow, pageReadModel) {
        setInputValue(dateInput, nextRow.date)
        setSelectValue(typeInput, nextRow.type)
        typeInput.options[0]!.textContent = pageReadModel.texts.cashDistributions.types.capitalReturn
        typeInput.options[1]!.textContent = pageReadModel.texts.cashDistributions.types.dividend
        setInputValue(amountPerShareInput, nextRow.amountPerShare)
        setTextValue(grossTotalNode, nextRow.grossTotal)
        setTextValue(withholdingNode, nextRow.withholdingToTaxOffice)
        setTextValue(paidInCashNode, nextRow.paidInCash)
        setTextValue(capitalRepaymentNode, nextRow.capitalRepaymentTotal)
        setTextValue(dividendNode, nextRow.dividendTotal)
        removeButton.setLabel(pageReadModel)
      },
    } satisfies RowController<{
      id: string
      date: string
      type: 'capital_return' | 'dividend'
      amountPerShare: string
      grossTotal: string
      withholdingToTaxOffice: string
      paidInCash: string
      capitalRepaymentTotal: string
      dividendTotal: string
    }>
  }

  const addButton = createActionButton(addButtonLabelNode, 'primary', () => {
    appendFormArrayItem(dataState, 'cashDistributions', {
      id: createId('distribution'),
      type: 'capital_return',
      date: '',
      amountPerShare: '',
    })
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(titleNode), span({ class: 'muted' }, countNode)),
    p({ class: 'muted' }, helpNode),
    table(
      thead(
        tr(
          th(dateHeaderNode),
          th(typeHeaderNode),
          th(amountPerShareHeaderNode),
          th(totalHeaderNode),
          th(withholdingHeaderNode),
          th(cashPaidHeaderNode),
          th(capitalRepaymentHeaderNode),
          th(dividendHeaderNode),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div(pageStyles.rowButtons, addButton)
  )

  return {
    root,
    set({ osakkeetCalculation, texts, ...rest }: OsakkeetPageReadModel) {
      const current = osakkeetCalculation.formData
      const summariesById = Object.fromEntries(
        osakkeetCalculation.cashDistributions.map((cashDistribution) => [cashDistribution.id, cashDistribution])
      )
      setTextValue(titleNode, texts.cashDistributions.title)
      setTextValue(countNode, `${current.cashDistributions.length} ${texts.common.rows}`)
      setTextValue(helpNode, texts.cashDistributions.help)
      setTextValue(dateHeaderNode, texts.common.date)
      setTextValue(typeHeaderNode, texts.common.type)
      setTextValue(amountPerShareHeaderNode, texts.cashDistributions.fields.amountPerShare)
      setTextValue(totalHeaderNode, texts.common.total)
      setTextValue(withholdingHeaderNode, texts.cashDistributions.fields.withholding)
      setTextValue(cashPaidHeaderNode, texts.cashDistributions.fields.cashPaid)
      setTextValue(capitalRepaymentHeaderNode, texts.cashDistributions.fields.capitalRepayment)
      setTextValue(dividendHeaderNode, texts.cashDistributions.fields.dividend)
      setTextValue(addButtonLabelNode, texts.cashDistributions.actions.add)
      syncRowControllers(
        tbodyNode,
        rowControllers,
        current.cashDistributions.map((cashDistribution) => ({
          id: cashDistribution.id,
          date: cashDistribution.date,
          type: cashDistribution.type,
          amountPerShare: cashDistribution.amountPerShare,
          grossTotal: summariesById[cashDistribution.id] ? euro(summariesById[cashDistribution.id].grossTotal) : '-',
          withholdingToTaxOffice: summariesById[cashDistribution.id]
            ? euro(summariesById[cashDistribution.id].withholdingToTaxOffice)
            : '-',
          paidInCash: summariesById[cashDistribution.id] ? euro(summariesById[cashDistribution.id].paidInCash) : '-',
          capitalRepaymentTotal: summariesById[cashDistribution.id]
            ? euro(summariesById[cashDistribution.id].capitalRepaymentTotal)
            : '-',
          dividendTotal: summariesById[cashDistribution.id]
            ? euro(summariesById[cashDistribution.id].dividendTotal)
            : '-',
        })),
        { osakkeetCalculation, texts, ...rest },
        createRowController
      )
    },
  }
}

function createIpoSection(dataState: State<OsakkeetFormData>) {
  const titleNode = text('')
  const currentShareValueLabelNode = text('')
  const totalShareCountLabelNode = text('')
  const currentTotalValueLabelNode = text('')
  const subscribedSharesLabelNode = text('')
  const estimatedPreIpoValueLabelNode = text('')
  const ipoSharePriceLabelNode = text('')
  const increasePercentLabelNode = text('')
  const increaseMultiplierLabelNode = text('')
  const totalIpoCostLabelNode = text('')
  const secondarySellPercentLabelNode = text('')
  const ipoCostPerSecondaryShareLabelNode = text('')
  const secondarySharesTotalLabelNode = text('')
  const ipoDateLabelNode = text('')
  const secondarySellHelpNode = text('')
  const ipoDateHelpNode = text('')
  const currentTotalValueNode = text('')
  const subscribedSharesNode = text('')
  const ipoSharePriceNode = text('')
  const increasePercentNode = text('')
  const increaseMultiplierNode = text('')
  const ipoCostPerSecondaryShareNode = text('')
  const secondarySharesTotalNode = text('')

  const currentShareValueInput = numberInput(
    '',
    { step: '0.01', min: '0' },
    createIpoNumberUpdater(dataState, 'currentShareValue')
  )
  const totalShareCountInput = numberInput(
    '',
    { step: '1', min: '0' },
    createIpoNumberUpdater(dataState, 'totalShareCount')
  )
  const estimatedPreIpoValueInput = numberInput(
    '',
    { step: '0.01', min: '0' },
    createIpoNumberUpdater(dataState, 'estimatedPreIpoValue')
  )
  const totalIpoCostInput = numberInput(
    '',
    { step: '0.01', min: '0' },
    createIpoNumberUpdater(dataState, 'totalIpoCost')
  )
  const secondarySellPercentInput = numberInput(
    '',
    { step: '0.01', min: '0' },
    createIpoNumberUpdater(dataState, 'estimatedSecondaryShareSellPercentage')
  )
  const ipoDateInput = finnishDateInput('', createIpoTextUpdater(dataState, 'ipoDate'))

  const root = section(
    { class: 'card' },
    h2(titleNode),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(currentShareValueLabelNode), currentShareValueInput),
      div(pageStyles.field, label(totalShareCountLabelNode), totalShareCountInput),
      div(pageStyles.field, label(currentTotalValueLabelNode), b(currentTotalValueNode)),
      div(pageStyles.field, label(subscribedSharesLabelNode), b(subscribedSharesNode))
    ),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(estimatedPreIpoValueLabelNode), estimatedPreIpoValueInput),
      div(pageStyles.field, label(ipoSharePriceLabelNode), b(ipoSharePriceNode)),
      div(pageStyles.field, label(increasePercentLabelNode), b(increasePercentNode)),
      div(pageStyles.field, label(increaseMultiplierLabelNode), b(increaseMultiplierNode))
    ),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(totalIpoCostLabelNode), totalIpoCostInput),
      div(
        pageStyles.field,
        label(secondarySellPercentLabelNode),
        secondarySellPercentInput,
        span({ class: 'muted' }, secondarySellHelpNode)
      ),
      div(pageStyles.field, label(ipoCostPerSecondaryShareLabelNode), b(ipoCostPerSecondaryShareNode)),
      div(pageStyles.field, label(secondarySharesTotalLabelNode), b(secondarySharesTotalNode))
    ),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(ipoDateLabelNode), ipoDateInput, span({ class: 'muted' }, ipoDateHelpNode)),
      div(),
      div()
    )
  )

  return {
    root,
    set({ texts, osakkeetCalculation }: OsakkeetPageReadModel) {
      const { ipo } = osakkeetCalculation.formData
      setTextValue(titleNode, texts.ipo.title)
      setTextValue(currentShareValueLabelNode, texts.ipo.fields.currentShareValue)
      setTextValue(totalShareCountLabelNode, texts.ipo.fields.totalShareCount)
      setTextValue(currentTotalValueLabelNode, texts.ipo.fields.currentTotalValue)
      setTextValue(subscribedSharesLabelNode, texts.summary.cards.subscribedShares)
      setTextValue(estimatedPreIpoValueLabelNode, texts.ipo.fields.estimatedPreIpoValue)
      setTextValue(ipoSharePriceLabelNode, texts.ipo.fields.ipoSharePrice)
      setTextValue(increasePercentLabelNode, texts.ipo.fields.increasePercent)
      setTextValue(increaseMultiplierLabelNode, texts.ipo.fields.increaseMultiplier)
      setTextValue(totalIpoCostLabelNode, texts.ipo.fields.totalIpoCost)
      setTextValue(secondarySellPercentLabelNode, texts.ipo.fields.secondarySellPercent)
      setTextValue(ipoCostPerSecondaryShareLabelNode, texts.summary.cards.ipoCostPerSecondaryShare)
      setTextValue(secondarySharesTotalLabelNode, texts.summary.cards.secondarySharesTotal)
      setTextValue(ipoDateLabelNode, texts.ipo.fields.ipoDate)
      setTextValue(secondarySellHelpNode, texts.ipo.help.secondary)
      setTextValue(ipoDateHelpNode, texts.ipo.help.dateFormat)
      setInputValue(currentShareValueInput, ipo.currentShareValue)
      setInputValue(totalShareCountInput, ipo.totalShareCount)
      setInputValue(estimatedPreIpoValueInput, ipo.estimatedPreIpoValue)
      setInputValue(totalIpoCostInput, ipo.totalIpoCost)
      setInputValue(secondarySellPercentInput, ipo.estimatedSecondaryShareSellPercentage)
      setInputValue(ipoDateInput, ipo.ipoDate)
      setTextValue(currentTotalValueNode, euro(osakkeetCalculation.ipo.currentTotalValue))
      setTextValue(subscribedSharesNode, amount(osakkeetCalculation.ipo.totalSubscribedShares))
      setTextValue(ipoSharePriceNode, euro(osakkeetCalculation.ipo.ipoPricePerShare))
      setTextValue(increasePercentNode, percentage(osakkeetCalculation.ipo.increasePercentage))
      setTextValue(increaseMultiplierNode, multiplier(osakkeetCalculation.ipo.increaseMultiplier))
      setTextValue(ipoCostPerSecondaryShareNode, euro(osakkeetCalculation.ipo.ipoCostPerShare))
      setTextValue(secondarySharesTotalNode, amount(osakkeetCalculation.ipo.estimatedSecondaryShareCount))
    },
  }
}

function createResultsSection(dataState: State<OsakkeetFormData>) {
  const warningRoot = div()
  const ipoSellContentRoot = div(pageStyles.denseStack)
  const sellInputLabelNode = text('')
  const sellInput = numberInput('', { step: '1', min: '0' }, (value) => {
    dataState.update({ sell: { ...dataState.get().sell, amount: value } })
  })
  const ipoSellSectionTitleNode = text('')

  const root = div(
    pageStyles.stack,
    section(
      { class: 'card' },
      h2(ipoSellSectionTitleNode),
      div(pageStyles.gridTwo, div(pageStyles.field, label(sellInputLabelNode), sellInput)),
      warningRoot,
      ipoSellContentRoot
    )
  )

  return {
    root,
    set({ osakkeetCalculation, texts }: OsakkeetPageReadModel) {
      const totalShares = osakkeetCalculation.vesting.totalShares
      const vestedShares = osakkeetCalculation.vesting.vestedShares
      const unvestedShares = osakkeetCalculation.vesting.unvestedShares
      const sharePercent = (value: typeof totalShares) =>
        totalShares.gt(0)
          ? `${amount(value)} (${percentage(value.div(totalShares).mul(100))})`
          : `${amount(value)} (0.00 %)`
      const soldShareOriginalCost = osakkeetCalculation.sell.soldShareOriginalCostTotal
      const soldShareAcquisitionCost = osakkeetCalculation.sell.soldShareAcquisitionCostTotal
      const keepAfterTaxes = osakkeetCalculation.sell.netAfterTaxAndIpoCost
      const netResultAgainstSubscriptionCost = keepAfterTaxes.minus(soldShareAcquisitionCost)
      const netResultPercent = soldShareAcquisitionCost.gt(0)
        ? percentage(netResultAgainstSubscriptionCost.div(soldShareAcquisitionCost).mul(100))
        : '0.00 %'
      const zeroMoney = osakkeetCalculation.sell.grossTotal.mul(0)
      const totalTaxableGain = osakkeetCalculation.sell.usedSubscriptions.reduce(
        (acc, lot) => acc.add(lot.taxableGain),
        zeroMoney
      )
      const totalTaxFreeGain = osakkeetCalculation.sell.usedSubscriptions.reduce(
        (acc, lot) => acc.add(lot.taxFreeGainPart),
        zeroMoney
      )
      const totalTaxedGain = osakkeetCalculation.sell.usedSubscriptions.reduce(
        (acc, lot) => acc.add(lot.taxedGainPart),
        zeroMoney
      )

      setTextValue(ipoSellSectionTitleNode, texts.summary.ipoSell.title)
      setTextValue(sellInputLabelNode, texts.summary.ipoSell.fields.sharesToSell)
      setInputValue(sellInput, osakkeetCalculation.formData.sell.amount)

      replaceChildren(
        warningRoot,
        osakkeetCalculation.errors.length > 0 &&
          div(
            pageStyles.errorBox,
            h3(texts.messages.errorsTitle),
            ul(osakkeetCalculation.errors.map((error) => li(error)))
          ),
        osakkeetCalculation.warnings.length > 0 &&
          div(
            pageStyles.warningBox,
            h3(texts.messages.warningsTitle),
            ul(osakkeetCalculation.warnings.map((warning) => li(warning)))
          )
      )
      replaceChildren(
        ipoSellContentRoot,
        div(
          pageStyles.summaryGrid,
          infoCard(texts.summary.ipoSell.cards.sellableShares, sharePercent(vestedShares)),
          infoCard(texts.summary.ipoSell.cards.unvestedShares, sharePercent(unvestedShares)),
          infoCard(texts.summary.ipoSell.cards.sharesLeft, amount(osakkeetCalculation.sell.remainingUnsoldShares))
        ),
        h3(texts.summary.allocationByLot.title),
        table(
          thead(
            tr(
              th(texts.common.date),
              th(texts.common.amount),
              th(texts.summary.ipoSell.fields.ipoPriceTotal),
              th(texts.summary.ipoSell.fields.actualCosts),
              th(texts.summary.ipoSell.fields.hmo20),
              th(texts.summary.ipoSell.fields.hmo40),
              th(texts.summary.ipoSell.fields.capitalGain),
              th(texts.summary.ipoSell.fields.taxFreePart),
              th(texts.summary.ipoSell.fields.taxedPart)
            )
          ),
          tbody([
            osakkeetCalculation.sell.usedSubscriptions.map((lot) =>
              tr(
                td(lot.subscriptionDate || '-'),
                td(`${amount(lot.soldAmount)} / ${amount(lot.totalSubscriptionShares)}`),
                td(euro(lot.gross)),
                td(
                  hoverValue(
                    euro(lot.actualDeduction),
                    texts.summary.ipoSell.tooltips.actualCosts(
                      euro(lot.realCostBasis),
                      euro(lot.allocatedIpoCost),
                      euro(lot.actualDeduction)
                    ),
                    lot.selectedMethod === 'actual_costs'
                  )
                ),
                td(
                  hoverValue(
                    euro(lot.gross.mul(0.2)),
                    texts.summary.ipoSell.tooltips.hmo(euro(lot.gross), '20 %', euro(lot.gross.mul(0.2))),
                    lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(0.2)
                  )
                ),
                td(
                  hoverValue(
                    euro(lot.gross.mul(0.4)),
                    texts.summary.ipoSell.tooltips.hmo(euro(lot.gross), '40 %', euro(lot.gross.mul(0.4))),
                    lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(0.4)
                  )
                ),
                td(lot.taxableGain.gte(0) ? euro(lot.taxableGain) : `${lot.taxableGain.toFixed(2)} €`),
                td(euro(lot.taxFreeGainPart)),
                td(euro(lot.taxedGainPart))
              )
            ),
            tr(
              td(b(texts.summary.totalRow)),
              td(),
              td(euro(osakkeetCalculation.sell.grossTotal)),
              td(b(euro(osakkeetCalculation.sell.selectedActualDeductionTotal))),
              td(b(euro(osakkeetCalculation.sell.selectedHmo20DeductionTotal))),
              td(b(euro(osakkeetCalculation.sell.selectedHmo40DeductionTotal))),
              td(euro(totalTaxableGain)),
              td(euro(totalTaxFreeGain)),
              td(euro(totalTaxedGain))
            ),
          ])
        ),
        h3(texts.summary.ipoSell.explanations.title),
        div(
          pageStyles.summaryGrid,
          infoCard(
            texts.summary.ipoSell.explanations.ipoPriceTotal,
            euro(osakkeetCalculation.sell.grossTotal),
            texts.summary.ipoSell.explanations.ipoPriceTotalHelp(euro(osakkeetCalculation.sell.grossTotal))
          ),
          infoCard(
            texts.summary.ipoSell.explanations.ipoCostsAllocated,
            euro(osakkeetCalculation.sell.totalIpoCostAllocated),
            texts.summary.ipoSell.explanations.ipoCostsAllocatedHelp(
              euro(osakkeetCalculation.sell.totalIpoCostAllocated)
            )
          ),
          infoCard(
            texts.summary.ipoSell.explanations.netCash,
            euro(osakkeetCalculation.sell.cashAfterIpoCosts),
            texts.summary.ipoSell.explanations.netCashHelp(
              euro(osakkeetCalculation.sell.grossTotal),
              euro(osakkeetCalculation.sell.totalIpoCostAllocated),
              euro(osakkeetCalculation.sell.cashAfterIpoCosts)
            )
          )
        ),
        h3(texts.summary.ipoSell.capitalGainAnnualTax.title),
        div(
          pageStyles.summaryGrid,
          infoCard(
            texts.summary.ipoSell.capitalGainAnnualTax.driversTitle,
            euro(osakkeetCalculation.sell.taxableGainTotal),
            texts.summary.ipoSell.capitalGainAnnualTax.driversHelp(euro(osakkeetCalculation.sell.taxableGainTotal))
          ),
          infoCard(
            texts.summary.ipoSell.explanations.selectedDeductions,
            euro(osakkeetCalculation.sell.selectedDeductionTotal),
            texts.summary.ipoSell.explanations.selectedDeductionsHelp(
              euro(osakkeetCalculation.sell.selectedActualDeductionTotal),
              euro(osakkeetCalculation.sell.selectedHmo20DeductionTotal),
              euro(osakkeetCalculation.sell.selectedHmo40DeductionTotal),
              euro(osakkeetCalculation.sell.selectedDeductionTotal)
            )
          ),
          infoCard(
            texts.summary.ipoSell.explanations.capitalGain,
            euro(osakkeetCalculation.sell.taxableGainTotal),
            texts.summary.ipoSell.explanations.capitalGainHelp(
              euro(osakkeetCalculation.sell.cashAfterIpoCosts),
              euro(osakkeetCalculation.sell.selectedDeductionTotal),
              euro(osakkeetCalculation.sell.taxableGainTotal)
            )
          ),
          infoCard(
            texts.summary.ipoSell.explanations.taxOnCapitalGain,
            euro(osakkeetCalculation.sell.estimatedTax),
            texts.summary.ipoSell.explanations.taxOnCapitalGainHelp(
              euro(osakkeetCalculation.sell.taxableGainTotal),
              euro(osakkeetCalculation.sell.taxableGainAtLowRate),
              euro(osakkeetCalculation.sell.taxableGainAtHighRate),
              euro(osakkeetCalculation.sell.estimatedTax)
            )
          )
        ),
        h3(texts.summary.ipoSell.cashReserve.title),
        div(
          pageStyles.summaryGrid,
          infoCard(
            texts.summary.ipoSell.cashReserve.keepAfterTaxes,
            euro(osakkeetCalculation.sell.netAfterTaxAndIpoCost),
            texts.summary.ipoSell.cashReserve.keepAfterTaxesHelp(
              euro(osakkeetCalculation.sell.cashAfterIpoCosts),
              euro(osakkeetCalculation.sell.estimatedTax),
              euro(osakkeetCalculation.sell.netAfterTaxAndIpoCost)
            )
          ),
          infoCard(
            texts.summary.ipoSell.cashReserve.reserveForTaxes,
            euro(osakkeetCalculation.sell.estimatedTax),
            texts.summary.ipoSell.cashReserve.reserveForTaxesHelp(euro(osakkeetCalculation.sell.estimatedTax))
          ),
          infoCard(
            texts.summary.ipoSell.cashReserve.taxPaymentStatus,
            texts.summary.ipoSell.cashReserve.taxPaymentManual,
            texts.summary.ipoSell.cashReserve.taxPaymentStatusHelp
          )
        ),
        h3(texts.summary.ipoSell.saleResultComparison.title),
        div(
          pageStyles.summaryGrid,
          infoCard(
            texts.summary.ipoSell.saleResultComparison.cardTitle,
            texts.summary.ipoSell.saleResultComparison.value(
              euro(soldShareOriginalCost),
              euro(soldShareAcquisitionCost),
              euro(netResultAgainstSubscriptionCost),
              netResultPercent
            ),
            texts.summary.ipoSell.saleResultComparison.help(
              euro(soldShareOriginalCost),
              euro(soldShareAcquisitionCost),
              euro(keepAfterTaxes),
              euro(netResultAgainstSubscriptionCost),
              netResultPercent
            )
          )
        ),
        h3(texts.summary.ipoSell.ipoCostEffects.title),
        div(
          pageStyles.summaryGrid,
          infoCard(
            texts.summary.ipoSell.explanations.deductibleIpoCosts,
            euro(osakkeetCalculation.sell.taxSavedFromDeductibleIpoCosts),
            texts.summary.ipoSell.explanations.deductibleIpoCostsHelp(
              euro(osakkeetCalculation.sell.ipoCostDeductedViaActual),
              euro(osakkeetCalculation.sell.taxSavedFromDeductibleIpoCosts)
            )
          ),
          infoCard(
            texts.summary.ipoSell.explanations.hmoIpoCosts,
            euro(osakkeetCalculation.sell.ipoCostPaidWithoutActualDeduction),
            texts.summary.ipoSell.explanations.hmoIpoCostsHelp(
              euro(osakkeetCalculation.sell.ipoCostPaidWithoutActualDeduction)
            )
          )
        )
      )
    },
  }
}

function createIntroSection(languageSelectionState: State<Language>) {
  const titleNode = text('')
  const languageSwitchLabelNode = text('')
  const descriptionNode = text('')
  const unlistedDescriptionNode = text('')
  const assumptionsRoot = div()
  const fiButton = button(
    'FI',
    pageStyles.smallButton,
    events({
      click() {
        languageSelectionState.set('fi')
      },
    })
  ) as HTMLButtonElement
  const enButton = button(
    'EN',
    pageStyles.smallButton,
    events({
      click() {
        languageSelectionState.set('en')
      },
    })
  ) as HTMLButtonElement
  const root = section(
    { class: 'card' },
    div(
      { class: 'heading' },
      h2(titleNode),
      div(pageStyles.rowButtons, span({ class: 'muted' }, languageSwitchLabelNode), fiButton, enButton)
    ),
    p({ class: 'muted' }, descriptionNode),
    p({ class: 'muted' }, unlistedDescriptionNode),
    assumptionsRoot
  )
  return {
    root,
    set({ languageSelection, texts }: OsakkeetPageReadModel) {
      setTextValue(titleNode, texts.intro.title)
      setTextValue(languageSwitchLabelNode, texts.languageSwitch.label)
      setTextValue(descriptionNode, texts.intro.description)
      setTextValue(unlistedDescriptionNode, texts.intro.unlistedDescription)
      setButtonVariant(fiButton, languageSelection === 'fi')
      setButtonVariant(enButton, languageSelection === 'en')
      replaceChildren(assumptionsRoot, assumptionsContent(texts))
    },
  }
}

function createToolbarSection(dataState: State<OsakkeetFormData>) {
  const statusNode = text('')
  const titleNode = text('')
  const saveToLocalStorageLabelNode = text('')
  const saveFileLabelNode = text('')
  const loadFileLabelNode = text('')
  const loadSavedLabelNode = text('')
  const restoreExampleLabelNode = text('')
  const clearExampleLabelNode = text('')
  let currentTexts = getOsakkeetLocalization(tryLoadLanguage())
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
            statusNode.textContent = currentTexts.storage.status.loaded
          } catch {
            statusNode.textContent = currentTexts.storage.errors.invalidFile
          }
          inputNode.value = ''
        }
        reader.onerror = () => {
          statusNode.textContent = currentTexts.storage.errors.fileReadFailed
          inputNode.value = ''
        }
        reader.readAsText(file)
      },
    })
  )
  const buttonConfigs = [
    {
      labelNode: saveToLocalStorageLabelNode,
      variant: 'primary' as const,
      action: () => {
        localStorage.setItem(storageKeys.formData, JSON.stringify(sanitizeOsakkeetFormData(dataState.get())))
        statusNode.textContent = currentTexts.storage.status.saved
      },
    },
    {
      labelNode: saveFileLabelNode,
      variant: 'secondary' as const,
      action: () => {
        const blob = new Blob([JSON.stringify(sanitizeOsakkeetFormData(dataState.get()), null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'osakkeet-input-state.json'
        link.click()
        URL.revokeObjectURL(url)
        statusNode.textContent = currentTexts.storage.status.fileSaved
      },
    },
    {
      labelNode: loadFileLabelNode,
      variant: 'secondary' as const,
      action: () => {
        fileInput.click()
      },
    },
    {
      labelNode: loadSavedLabelNode,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(tryLoadSavedData())
        statusNode.textContent = currentTexts.storage.status.loaded
      },
    },
    {
      labelNode: restoreExampleLabelNode,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createOsakkeetFormData(true))
        statusNode.textContent = currentTexts.storage.status.exampleRestored
      },
    },
    {
      labelNode: clearExampleLabelNode,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createOsakkeetFormData(false))
        statusNode.textContent = currentTexts.storage.status.exampleCleared
      },
    },
  ]
  const [
    saveToLocalStorageButton,
    saveFileButton,
    loadFileButton,
    loadSavedButton,
    restoreExampleButton,
    clearExampleButton,
  ] = buttonConfigs.map(({ labelNode, variant, action }) => createActionButton(labelNode, variant, action))
  const root = div(
    { class: 'card no-print' },
    div({ class: 'heading' }, h2(titleNode), span({ class: 'muted' }, statusNode)),
    fileInput,
    div(
      pageStyles.rowButtons,
      saveToLocalStorageButton,
      saveFileButton,
      loadFileButton,
      loadSavedButton,
      restoreExampleButton,
      clearExampleButton
    )
  )

  return {
    root,
    set({ texts }: OsakkeetPageReadModel) {
      currentTexts = texts
      setTextValue(titleNode, texts.storage.title)
      setTextValue(saveToLocalStorageLabelNode, texts.storage.actions.saveToLocalStorage)
      setTextValue(saveFileLabelNode, texts.storage.actions.saveFile)
      setTextValue(loadFileLabelNode, texts.storage.actions.loadFile)
      setTextValue(loadSavedLabelNode, texts.storage.actions.loadSaved)
      setTextValue(restoreExampleLabelNode, texts.storage.actions.restoreExample)
      setTextValue(clearExampleLabelNode, texts.storage.actions.clearExample)
    },
  }
}

function createTaxSummarySection(dataState: State<OsakkeetFormData>) {
  const titleNode = text('')
  const mathematicalShareValuesEditor = createMathematicalShareValuesEditor(dataState)
  const resultsRoot = div(pageStyles.denseStack)
  const root = section({ class: 'card' }, h2(titleNode), mathematicalShareValuesEditor.root, resultsRoot)

  return {
    root,
    set({ texts, osakkeetCalculation, ...rest }: OsakkeetPageReadModel) {
      setTextValue(titleNode, texts.taxReturns.title)
      mathematicalShareValuesEditor.set({ texts, osakkeetCalculation, ...rest })
      replaceChildren(resultsRoot, taxSummarySection(osakkeetCalculation, texts))
    },
  }
}

type OsakkeetPageReadModel = {
  formData: OsakkeetFormData
  languageSelection: Language
  texts: OsakkeetLocalization
  osakkeetCalculation: OsakkeetCalculation
}

export function osakkeetIpoCalculatorPage() {
  const dataState = createState({ value: tryLoadSavedData() })
  const languageSelectionState = createState<Language>({ value: tryLoadLanguage() })
  const pageReadState = mergeStates(
    { formData: dataState, languageSelection: languageSelectionState },
    ({ formData, languageSelection }) => {
      const texts = getOsakkeetLocalization(languageSelection)
      return {
        formData,
        languageSelection,
        osakkeetCalculation: calculateOsakkeet(formData, texts),
        texts,
      }
    }
  )

  const introSection = createIntroSection(languageSelectionState)
  const toolbarSection = createToolbarSection(dataState)
  const subscriptionsSection = createSubscriptionsSection(dataState)
  const cashDistributionsSection = createCashDistributionsSection(dataState)
  const taxSummarySectionController = createTaxSummarySection(dataState)
  const ipoSection = createIpoSection(dataState)
  const resultsSection = createResultsSection(dataState)
  const root = div(pageStyles.stack)
  const applyPageReadModel = (pageReadModel: OsakkeetPageReadModel) => {
    introSection.set(pageReadModel)
    toolbarSection.set(pageReadModel)
    subscriptionsSection.set(pageReadModel)
    cashDistributionsSection.set(pageReadModel)
    taxSummarySectionController.set(pageReadModel)
    ipoSection.set(pageReadModel)
    resultsSection.set(pageReadModel)
  }

  languageSelectionState.onValueChange((languageSelection) => {
    localStorage.setItem(storageKeys.language, languageSelection)
  })
  pageReadState.onValueChange(applyPageReadModel)

  const initialPageReadModel = pageReadState.get()
  applyPageReadModel(initialPageReadModel)
  replaceChildren(
    root,
    introSection.root,
    toolbarSection.root,
    subscriptionsSection.root,
    cashDistributionsSection.root,
    taxSummarySectionController.root,
    ipoSection.root,
    resultsSection.root
  )
  return root
}
