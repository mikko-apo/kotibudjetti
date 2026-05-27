import { createState, mergeStates, type State } from '../../../ki-frame/src'
import Decimal from 'decimal.js'
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
  stack: styles({ display: 'flex', flexDirection: 'column', gap: '22px' }),
  denseStack: styles({ display: 'flex', flexDirection: 'column', gap: '10px' }),
  gridTwo: styles({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }),
  field: styles({ display: 'flex', flexDirection: 'column', gap: '6px' }),
  compactField: styles({ width: '140px' }),
  compactTable: styles({ width: 'auto', maxWidth: 'fit-content', tableLayout: 'auto' }),
  rowButtons: styles({ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }),
  topAlignedRowButtons: styles({ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }),
  splitActions: styles({
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  }),
  rightAlignedActions: styles({
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginLeft: 'auto',
  }),
  actionGroup: styles({ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }),
  compactParagraph: styles({ margin: '0' }),
  storageTable: styles({ width: '100%', borderCollapse: 'collapse' }),
  storageCellTop: styles({ verticalAlign: 'top', padding: '10px 12px', borderTop: '1px solid rgba(15, 23, 42, 0.08)' }),
  storageLabelCell: styles({ width: '220px', fontWeight: '600' }),
  storageDescriptionCell: styles({ minWidth: '280px' }),
  storageActionsCell: styles({ width: '320px' }),
  summaryGrid: styles({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }),
  summaryItem: styles({
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }),
  cardMutedText: styles({
    color: 'rgb(75, 85, 99)',
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
  attentionButton: styles({
    border: '1px solid rgba(22, 101, 52, 0.55)',
    backgroundColor: 'rgba(134, 239, 172, 0.65)',
    color: '#166534',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.35)',
  }),
  disabledButton: styles({
    border: '1px solid rgba(15, 23, 42, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    color: 'rgba(15, 23, 42, 0.3)',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: 'not-allowed',
    opacity: '0.55',
    boxShadow: 'none',
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
  stickyWarningBox: styles({
    position: 'sticky',
    top: '12px',
    zIndex: '20',
    border: '1px solid rgba(153, 27, 27, 0.45)',
    backgroundColor: 'rgba(254, 226, 226, 0.92)',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 10px 28px rgba(127, 29, 29, 0.12)',
    backdropFilter: 'blur(6px)',
  }),
  errorBox: styles({
    border: '1px solid rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: '8px',
    padding: '12px',
  }),
  redNote: styles({
    color: 'rgb(153, 27, 27)',
  }),
  mismatchRow: styles({
    backgroundColor: 'rgba(254, 226, 226, 0.45)',
  }),
  rowErrorText: styles({
    color: 'rgb(153, 27, 27)',
    fontSize: '12px',
  }),
  listCompact: styles({ margin: '0', paddingLeft: '20px' }),
}

function euro(value: { toFixed: (precision?: number) => string }) {
  return `${value.toFixed(2)}\u00A0€`
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
  windowFormData: 'osakkeet-ipo-laskuri-window',
  browserFormData: 'osakkeet-ipo-laskuri-browser',
  lastFileSavedHash: 'osakkeet-ipo-laskuri-last-file-hash',
} as const
const shareUrlQueryKey = 'osakkeet'

function tryStorageGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function tryStorageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // ignore storage write failures
  }
}

function tryStorageRemove(storage: Storage, key: string) {
  try {
    storage.removeItem(key)
  } catch {
    // ignore storage write failures
  }
}

function tryLoadLanguage(): Language {
  return localStorage.getItem(storageKeys.language) === 'en' ? 'en' : 'fi'
}

function createOsakkeetFormData(demo: boolean): OsakkeetFormData {
  return {
    subscriptions: demo
      ? [
          {
            id: createId('sub'),
            date: '15.03.2009',
            vestingEndsOn: '',
            amount: '80000',
            pricePerShare: '0.14',
            otherTotalAcquisitionCosts: '450',
          },
          {
            id: createId('sub'),
            date: '20.09.2013',
            vestingEndsOn: '',
            amount: '55000',
            pricePerShare: '0.32',
            otherTotalAcquisitionCosts: '300',
          },
          {
            id: createId('sub'),
            date: '02.05.2018',
            vestingEndsOn: '',
            amount: '35000',
            pricePerShare: '0.48',
            otherTotalAcquisitionCosts: '220',
          },
        ]
      : [
          {
            id: createId('sub'),
            date: '',
            vestingEndsOn: '',
            amount: '',
            pricePerShare: '',
            otherTotalAcquisitionCosts: '',
          },
        ],
    cashDistributions: demo
      ? [
          {
            id: createId('distribution'),
            type: 'capital_return',
            date: '31.03.2022',
            amountPerShare: '0.08',
            shareCount: '',
          },
          {
            id: createId('distribution'),
            type: 'capital_return',
            date: '30.09.2022',
            amountPerShare: '0.06',
            shareCount: '',
          },
          {
            id: createId('distribution'),
            type: 'capital_return',
            date: '30.06.2023',
            amountPerShare: '0.10',
            shareCount: '',
          },
          {
            id: createId('distribution'),
            type: 'capital_return',
            date: '28.06.2024',
            amountPerShare: '0.12',
            shareCount: '',
          },
          {
            id: createId('distribution'),
            type: 'capital_return',
            date: '30.06.2025',
            amountPerShare: '0.15',
            shareCount: '',
          },
        ]
      : [{ id: createId('distribution'), type: 'capital_return', date: '', amountPerShare: '', shareCount: '' }],
    mathematicalShareValues: demo
      ? [
          { id: createId('math'), year: '2022', valuePerShare: '28.50' },
          { id: createId('math'), year: '2023', valuePerShare: '33.00' },
          { id: createId('math'), year: '2024', valuePerShare: '39.00' },
          { id: createId('math'), year: '2025', valuePerShare: '47.00' },
          { id: createId('math'), year: '2026', valuePerShare: '54.55' },
        ]
      : [{ id: createId('math'), year: '', valuePerShare: '' }],
    ipo: {
      ipoDate: demo ? '15.09.2026' : '',
      totalShareCount: demo ? '1100000' : '',
      totalIpoCost: demo ? '800000' : '',
      currentShareValue: demo ? '54.55' : '',
      estimatedPreIpoValue: demo ? '120000000' : '',
      estimatedSecondaryShareSellPercentage: demo ? '10' : '',
    },
    sell: {
      amount: demo ? '60000' : '',
      otherAnnualCapitalGainsOrLosses: '',
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
      pricePerShare: subscription.pricePerShare || '',
      otherTotalAcquisitionCosts: subscription.otherTotalAcquisitionCosts || '',
    })),
    cashDistributions: (data.cashDistributions || []).map((cashDistribution) => ({
      id: cashDistribution.id || createId('distribution'),
      date: cashDistribution.date || '',
      type: cashDistribution.type || 'capital_return',
      amountPerShare: cashDistribution.amountPerShare || '',
      shareCount: cashDistribution.shareCount || '',
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
      otherAnnualCapitalGainsOrLosses: data.sell?.otherAnnualCapitalGainsOrLosses || '',
    },
  }
}

type ShareableOsakkeetUrlData = Pick<OsakkeetFormData, 'cashDistributions' | 'mathematicalShareValues' | 'ipo'>

function createShareableOsakkeetUrlData(data: OsakkeetFormData): ShareableOsakkeetUrlData {
  const sanitized = sanitizeOsakkeetFormData(data)
  return {
    cashDistributions: sanitized.cashDistributions.map((cashDistribution) => ({
      id: cashDistribution.id,
      date: cashDistribution.date,
      type: cashDistribution.type,
      amountPerShare: cashDistribution.amountPerShare,
    })),
    mathematicalShareValues: sanitized.mathematicalShareValues,
    ipo: sanitized.ipo,
  }
}

function normalizeLoadedData(parsed: Partial<OsakkeetFormData>): OsakkeetFormData {
  const ipo = (parsed.ipo || {}) as Partial<IpoDetailsInput>
  return {
    subscriptions: (parsed.subscriptions || []).map((subscription) => ({
      id: subscription.id || createId('sub'),
      date: subscription.date || '',
      vestingEndsOn: subscription.vestingEndsOn || '',
      amount: subscription.amount || '',
      pricePerShare: subscription.pricePerShare || '',
      otherTotalAcquisitionCosts: subscription.otherTotalAcquisitionCosts || '',
    })),
    cashDistributions: (parsed.cashDistributions || []).map((cashDistribution) => ({
      id: cashDistribution.id || createId('distribution'),
      date: cashDistribution.date || '',
      type: cashDistribution.type || 'capital_return',
      amountPerShare: cashDistribution.amountPerShare || '',
      shareCount: cashDistribution.shareCount || '',
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
  const saved = tryStorageGet(localStorage, storageKeys.browserFormData)
  if (!saved) return createOsakkeetFormData(true)
  try {
    const parsed = JSON.parse(saved) as Partial<OsakkeetFormData>
    return normalizeLoadedData(parsed)
  } catch {
    return createOsakkeetFormData(true)
  }
}

function tryLoadWindowSavedData(): OsakkeetFormData | undefined {
  const saved = tryStorageGet(sessionStorage, storageKeys.windowFormData)
  if (!saved) return undefined
  try {
    const parsed = JSON.parse(saved) as Partial<OsakkeetFormData>
    return normalizeLoadedData(parsed)
  } catch {
    return undefined
  }
}

function encodeUrlState(value: ShareableOsakkeetUrlData) {
  const json = JSON.stringify(value)
  const bytes = new TextEncoder().encode(json)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeUrlState(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const padded = normalized.padEnd(normalized.length + paddingLength, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as Partial<ShareableOsakkeetUrlData>
}

function tryLoadSharedUrlData(): OsakkeetFormData | undefined {
  const encoded = new URL(window.location.href).searchParams.get(shareUrlQueryKey)
  if (!encoded) return undefined
  try {
    const parsed = decodeUrlState(encoded)
    const emptyForm = createOsakkeetFormData(false)
    return normalizeLoadedData({
      ...emptyForm,
      cashDistributions: parsed.cashDistributions || [],
      mathematicalShareValues: parsed.mathematicalShareValues || [],
      ipo: {
        ...emptyForm.ipo,
        ...(parsed.ipo || {}),
      },
      subscriptions: emptyForm.subscriptions,
      sell: emptyForm.sell,
    })
  } catch {
    return undefined
  }
}

function tryLoadInitialData() {
  return tryLoadSharedUrlData() || tryLoadWindowSavedData() || tryLoadSavedData()
}

function serializeOsakkeetFormData(data: OsakkeetFormData) {
  return JSON.stringify(sanitizeOsakkeetFormData(data))
}

function buildShareUrl(data: OsakkeetFormData) {
  const url = new URL(window.location.href)
  url.searchParams.set(shareUrlQueryKey, encodeUrlState(createShareableOsakkeetUrlData(data)))
  return url.toString()
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
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
  return inputs.text(
    {
      value,
      inputMode: options.step.includes('.') ? 'decimal' : 'numeric',
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
  return div(
    pageStyles.summaryItem,
    span({ class: 'muted' }, pageStyles.cardMutedText, title),
    ...(value ? [b(value)] : []),
    help && span({ class: 'muted' }, pageStyles.cardMutedText, help)
  )
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

function setButtonAttention(node: HTMLButtonElement, needsAttention: boolean) {
  if (node.disabled) {
    node.className = String(pageStyles.disabledButton)
    return
  }
  if (needsAttention) {
    node.className = String(pageStyles.attentionButton)
  } else if (!node.classList.contains('active')) {
    node.className = String(pageStyles.smallButton)
  }
}

function setButtonDisabled(node: HTMLButtonElement, disabled: boolean) {
  node.disabled = disabled
  node.className = disabled ? String(pageStyles.disabledButton) : String(pageStyles.smallButton)
}

function createRemoveButton(dataState: State<OsakkeetFormData>, remove: () => void) {
  const labelNode = text()
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
    ul(
      pageStyles.listCompact,
      t.assumptions.items.map((item) => li(item))
    ),
    p(
      { class: 'muted' },
      t.assumptions.sourcesLabel,
      linkToSource(
        t.sources.dividends,
        'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/osingot-listaamattomasta-yhtiosta/'
      ),
      ', ',
      linkToSource(
        t.sources.listedDividends,
        'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/listatusta-yhti%C3%B6st%C3%A4-saadut-osingot/'
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
  const titleNode = text()
  const yearHeaderNode = text()
  const valueHeaderNode = text()
  const addButtonLabelNode = text()
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
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
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
        (row) => row.dividendTotal.gt(0) && !row.treatedAsListedDividend && row.shareholderMathematicalValue.eq(0)
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
  const titleNode = text()
  const countNode = text()
  const helpNode = text()
  const summaryRoot = div(pageStyles.summaryGrid)
  const dateHeaderNode = text()
  const vestingEndsOnHeaderNode = text()
  const amountHeaderNode = text()
  const pricePerShareHeaderNode = text()
  const otherTotalAcquisitionCostsHeaderLabelNode = text()
  const otherTotalAcquisitionCostsHeaderNode = span({ title: '' }, otherTotalAcquisitionCostsHeaderLabelNode)
  const totalPricePerShareHeaderNode = text()
  const capitalRepaymentTotalHeaderNode = text()
  const capitalRepaymentHeaderNode = text()
  const remainingCostHeaderNode = text()
  const addButtonLabelNode = text()
  const tbodyNode = tbody()
  const rowControllers = new Map<
    string,
    RowController<{
      id: string
      date: string
      vestingEndsOn: string
      amount: string
      pricePerShare: string
      otherTotalAcquisitionCosts: string
      totalPricePerShare: string
      capitalRepaymentTotal: string
      capitalRepaymentPerShare: string
      remainingCostPerShare: string
    }>
  >()

  const createRowController = (row: {
    id: string
    date: string
    vestingEndsOn: string
    amount: string
    pricePerShare: string
    otherTotalAcquisitionCosts: string
    totalPricePerShare: string
    capitalRepaymentTotal: string
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
    const pricePerShareInput = numberInput(row.pricePerShare, { step: '0.0001', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'subscriptions', row.id, { pricePerShare: value })
    })
    const otherTotalAcquisitionCostsInput = numberInput(
      row.otherTotalAcquisitionCosts,
      { step: '0.01', min: '0' },
      (value) => {
        updateFormArrayItem(dataState, 'subscriptions', row.id, { otherTotalAcquisitionCosts: value })
      }
    )
    const totalPricePerShareNode = text('-')
    const capitalRepaymentTotalNode = text('-')
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
        td(pricePerShareInput),
        td(otherTotalAcquisitionCostsInput),
        td(totalPricePerShareNode),
        td(capitalRepaymentTotalNode),
        td(capitalRepaymentNode),
        td(remainingCostNode),
        td({ class: 'no-print' }, removeButton.buttonNode)
      ),
      set(nextRow, pageReadModel) {
        setInputValue(dateInput, nextRow.date)
        setInputValue(vestingEndsOnInput, nextRow.vestingEndsOn)
        setInputValue(amountInput, nextRow.amount)
        setInputValue(pricePerShareInput, nextRow.pricePerShare)
        setInputValue(otherTotalAcquisitionCostsInput, nextRow.otherTotalAcquisitionCosts)
        setTextValue(totalPricePerShareNode, nextRow.totalPricePerShare)
        setTextValue(capitalRepaymentTotalNode, nextRow.capitalRepaymentTotal)
        setTextValue(capitalRepaymentNode, nextRow.capitalRepaymentPerShare)
        setTextValue(remainingCostNode, nextRow.remainingCostPerShare)
        removeButton.setLabel(pageReadModel)
      },
    } satisfies RowController<{
      id: string
      date: string
      vestingEndsOn: string
      amount: string
      pricePerShare: string
      otherTotalAcquisitionCosts: string
      totalPricePerShare: string
      capitalRepaymentTotal: string
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
      pricePerShare: '',
      otherTotalAcquisitionCosts: '',
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
          th(pricePerShareHeaderNode),
          th(otherTotalAcquisitionCostsHeaderNode),
          th(totalPricePerShareHeaderNode),
          th(capitalRepaymentTotalHeaderNode),
          th(capitalRepaymentHeaderNode),
          th(remainingCostHeaderNode),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
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
      setTextValue(pricePerShareHeaderNode, texts.subscriptions.fields.pricePerShare)
      setTextValue(otherTotalAcquisitionCostsHeaderLabelNode, texts.subscriptions.fields.otherTotalAcquisitionCosts)
      otherTotalAcquisitionCostsHeaderNode.title = texts.subscriptions.fields.otherTotalAcquisitionCostsHelp
      setTextValue(totalPricePerShareHeaderNode, texts.subscriptions.fields.totalPricePerShare)
      setTextValue(capitalRepaymentTotalHeaderNode, texts.subscriptions.fields.totalReimbursements)
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
          pricePerShare: subscription.pricePerShare || '',
          otherTotalAcquisitionCosts: subscription.otherTotalAcquisitionCosts || '',
          totalPricePerShare: summariesById[subscription.id]
            ? euro(summariesById[subscription.id].totalPricePerShare)
            : '-',
          capitalRepaymentTotal: summariesById[subscription.id]
            ? euro(summariesById[subscription.id].capitalRepaymentTotal)
            : '-',
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
  const titleNode = text()
  const countNode = text()
  const helpNode = text()
  const dateHeaderNode = text()
  const typeHeaderNode = text()
  const shareCountHeaderNode = text()
  const amountPerShareHeaderNode = text()
  const totalHeaderNode = text()
  const withholdingHeaderNode = text()
  const cashPaidHeaderNode = text()
  const capitalRepaymentHeaderNode = text()
  const dividendHeaderNode = text()
  const addButtonLabelNode = text()
  const tbodyNode = tbody()
  const rowControllers = new Map<
    string,
    RowController<{
      id: string
      date: string
      type: 'capital_return' | 'dividend'
      shareCount: string
      amountPerShare: string
      grossTotal: string
      withholdingToTaxOffice: string
      paidInCash: string
      capitalRepaymentTotal: string
      dividendTotal: string
      shareCountMismatch?: string
    }>
  >()

  const createRowController = (row: {
    id: string
    date: string
    type: 'capital_return' | 'dividend'
    shareCount: string
    amountPerShare: string
    grossTotal: string
    withholdingToTaxOffice: string
    paidInCash: string
    capitalRepaymentTotal: string
    dividendTotal: string
    shareCountMismatch?: string
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
    const shareCountInput = numberInput(row.shareCount, { step: '1', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'cashDistributions', row.id, { shareCount: value })
    })
    const amountPerShareInput = numberInput(row.amountPerShare, { step: '0.0001', min: '0' }, (value) => {
      updateFormArrayItem(dataState, 'cashDistributions', row.id, { amountPerShare: value })
    })
    const grossTotalNode = text('-')
    const withholdingNode = text('-')
    const paidInCashNode = text('-')
    const capitalRepaymentNode = text('-')
    const dividendNode = text('-')
    const shareCountMismatchNode = text()
    const removeButton = createRemoveButton(dataState, () => {
      removeFormArrayItem(dataState, 'cashDistributions', row.id)
    })
    const shareCountCell = td(
      div(pageStyles.denseStack, shareCountInput, span(pageStyles.rowErrorText, shareCountMismatchNode))
    )
    const rowNode = tr(
      td(dateInput),
      td(typeInput),
      shareCountCell,
      td(amountPerShareInput),
      td(grossTotalNode),
      td(withholdingNode),
      td(paidInCashNode),
      td(capitalRepaymentNode),
      td(dividendNode),
      td({ class: 'no-print' }, removeButton.buttonNode)
    ) as HTMLTableRowElement

    return {
      id: row.id,
      node: rowNode,
      set(nextRow, pageReadModel) {
        setInputValue(dateInput, nextRow.date)
        setSelectValue(typeInput, nextRow.type)
        typeInput.options[0]!.textContent = pageReadModel.texts.cashDistributions.types.capitalReturn
        typeInput.options[1]!.textContent = pageReadModel.texts.cashDistributions.types.dividend
        setInputValue(shareCountInput, nextRow.shareCount)
        setInputValue(amountPerShareInput, nextRow.amountPerShare)
        setTextValue(grossTotalNode, nextRow.grossTotal)
        setTextValue(withholdingNode, nextRow.withholdingToTaxOffice)
        setTextValue(paidInCashNode, nextRow.paidInCash)
        setTextValue(capitalRepaymentNode, nextRow.capitalRepaymentTotal)
        setTextValue(dividendNode, nextRow.dividendTotal)
        setTextValue(shareCountMismatchNode, nextRow.shareCountMismatch || '')
        shareCountMismatchNode.parentElement!.style.display = nextRow.shareCountMismatch ? '' : 'none'
        rowNode.className = nextRow.shareCountMismatch ? String(pageStyles.mismatchRow) : ''
        removeButton.setLabel(pageReadModel)
      },
    } satisfies RowController<{
      id: string
      date: string
      type: 'capital_return' | 'dividend'
      shareCount: string
      amountPerShare: string
      grossTotal: string
      withholdingToTaxOffice: string
      paidInCash: string
      capitalRepaymentTotal: string
      dividendTotal: string
      shareCountMismatch?: string
    }>
  }

  const addButton = createActionButton(addButtonLabelNode, 'primary', () => {
    appendFormArrayItem(dataState, 'cashDistributions', {
      id: createId('distribution'),
      type: 'capital_return',
      date: '',
      amountPerShare: '',
      shareCount: '',
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
          th(shareCountHeaderNode),
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
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
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
      setTextValue(shareCountHeaderNode, texts.cashDistributions.fields.shareCount)
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
        current.cashDistributions.map((cashDistribution) => {
          const summary = summariesById[cashDistribution.id]
          const expectedShareCount = summary ? amount(summary.sharesHeld) : ''
          const givenShareCount = cashDistribution.shareCount || ''
          const hasShareCountMismatch =
            givenShareCount !== '' &&
            summary &&
            (Number.isNaN(Number(givenShareCount)) || Number(givenShareCount) !== Number(expectedShareCount))
          return {
            id: cashDistribution.id,
            date: cashDistribution.date,
            type: cashDistribution.type,
            shareCount: givenShareCount,
            amountPerShare: cashDistribution.amountPerShare,
            grossTotal: summary ? euro(summary.grossTotal) : '-',
            withholdingToTaxOffice: summary ? euro(summary.withholdingToTaxOffice) : '-',
            paidInCash: summary ? euro(summary.paidInCash) : '-',
            capitalRepaymentTotal: summary ? euro(summary.capitalRepaymentTotal) : '-',
            dividendTotal: summary ? euro(summary.dividendTotal) : '-',
            shareCountMismatch: hasShareCountMismatch
              ? texts.cashDistributions.messages.shareCountMismatch(expectedShareCount, givenShareCount)
              : undefined,
          }
        }),
        { osakkeetCalculation, texts, ...rest },
        createRowController
      )
    },
  }
}

function createIpoSection(dataState: State<OsakkeetFormData>) {
  const titleNode = text()
  const currentShareValueLabelNode = text()
  const totalShareCountLabelNode = text()
  const currentTotalValueLabelNode = text()
  const subscribedSharesLabelNode = text()
  const estimatedPreIpoValueLabelNode = text()
  const ipoSharePriceLabelNode = text()
  const increasePercentLabelNode = text()
  const increaseMultiplierLabelNode = text()
  const totalIpoCostLabelNode = text()
  const secondarySellPercentLabelNode = text()
  const ipoCostPerSecondaryShareLabelNode = text()
  const secondarySharesTotalLabelNode = text()
  const ipoDateLabelNode = text()
  const secondarySellHelpNode = text()
  const ipoDateHelpNode = text()
  const currentTotalValueNode = text()
  const subscribedSharesNode = text()
  const ipoSharePriceNode = text()
  const increasePercentNode = text()
  const increaseMultiplierNode = text()
  const ipoCostPerSecondaryShareNode = text()
  const secondarySharesTotalNode = text()

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
  const annualAdjustmentTitleNode = text()
  const annualAdjustmentInputTitleNode = text()
  const annualAdjustmentInputHelpNode = text()
  const annualAdjustmentTaxEffectRoot = div()
  const annualAdjustmentReserveRoot = div()
  const annualAdjustmentKeepRoot = div()
  const sellInputLabelNode = text()
  const sellInput = numberInput('', { step: '1', min: '0' }, (value) => {
    dataState.update({ sell: { ...dataState.get().sell, amount: value } })
  })
  const otherAnnualCapitalInput = numberInput('', { step: '0.01', min: '' }, (value) => {
    dataState.update({ sell: { ...dataState.get().sell, otherAnnualCapitalGainsOrLosses: value } })
  })
  const ipoSellSectionTitleNode = text()
  const annualAdjustmentInputCard = div(
    pageStyles.summaryItem,
    h3(annualAdjustmentInputTitleNode),
    div(pageStyles.field, otherAnnualCapitalInput, span({ class: 'muted' }, annualAdjustmentInputHelpNode))
  )
  const annualAdjustmentRoot = div(
    pageStyles.denseStack,
    h3(annualAdjustmentTitleNode),
    div(
      pageStyles.summaryGrid,
      annualAdjustmentInputCard,
      annualAdjustmentTaxEffectRoot,
      annualAdjustmentReserveRoot,
      annualAdjustmentKeepRoot
    )
  )

  const root = div(
    pageStyles.stack,
    section(
      { class: 'card' },
      h2(ipoSellSectionTitleNode),
      div(
        pageStyles.gridTwo,
        div(pageStyles.compactField, div(pageStyles.field, label(sellInputLabelNode), sellInput))
      ),
      warningRoot,
      ipoSellContentRoot,
      annualAdjustmentRoot
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
      const selectedHmoDeductionTotal = osakkeetCalculation.sell.selectedHmo20DeductionTotal.add(
        osakkeetCalculation.sell.selectedHmo40DeductionTotal
      )

      setTextValue(ipoSellSectionTitleNode, texts.summary.ipoSell.title)
      setTextValue(sellInputLabelNode, texts.summary.ipoSell.fields.sharesToSell)
      setInputValue(sellInput, osakkeetCalculation.formData.sell.amount)
      setInputValue(otherAnnualCapitalInput, osakkeetCalculation.formData.sell.otherAnnualCapitalGainsOrLosses || '')
      setTextValue(annualAdjustmentTitleNode, texts.summary.ipoSell.cashReserve.annualAdjustmentTitle)
      setTextValue(annualAdjustmentInputTitleNode, texts.summary.ipoSell.cashReserve.otherAnnualCapitalGainsOrLosses)
      setTextValue(annualAdjustmentInputHelpNode, texts.summary.ipoSell.cashReserve.otherAnnualCapitalGainsOrLossesHelp)

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
              th(texts.summary.ipoSell.fields.hmo),
              th(texts.summary.ipoSell.fields.capitalGain)
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
                    euro(lot.hankintamenoOlettaDeduction),
                    texts.summary.ipoSell.tooltips.hmo(
                      euro(lot.gross),
                      percentage(lot.hankintamenoOlettaRate.mul(100)),
                      euro(lot.hankintamenoOlettaDeduction)
                    ),
                    lot.selectedMethod === 'hmo'
                  )
                ),
                td(lot.taxableGain.gte(0) ? euro(lot.taxableGain) : `${lot.taxableGain.toFixed(2)} €`)
              )
            ),
            tr(
              td(b(texts.summary.totalRow)),
              td(),
              td(euro(osakkeetCalculation.sell.grossTotal)),
              td(b(euro(osakkeetCalculation.sell.selectedActualDeductionTotal))),
              td(b(euro(selectedHmoDeductionTotal))),
              td(euro(totalTaxableGain))
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
            texts.summary.ipoSell.capitalGainAnnualTax.driversValue,
            texts.summary.ipoSell.capitalGainAnnualTax.driversHelp
          ),
          infoCard(
            texts.summary.ipoSell.explanations.selectedDeductions,
            euro(osakkeetCalculation.sell.selectedDeductionTotal),
            texts.summary.ipoSell.explanations.selectedDeductionsHelp(
              euro(osakkeetCalculation.sell.selectedActualDeductionTotal),
              euro(selectedHmoDeductionTotal)
            )
          ),
          infoCard(
            texts.summary.ipoSell.explanations.capitalGain,
            euro(osakkeetCalculation.sell.taxableGainTotal),
            texts.summary.ipoSell.explanations.capitalGainHelp(
              euro(osakkeetCalculation.sell.grossTotal),
              euro(osakkeetCalculation.sell.selectedDeductionTotal)
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
            texts.summary.ipoSell.explanations.hmoIpoCostsHelp()
          )
        )
      )
      replaceChildren(
        annualAdjustmentTaxEffectRoot,
        infoCard(
          texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapital,
          osakkeetCalculation.sell.taxReductionFromOtherLosses.gt(0)
            ? euro(osakkeetCalculation.sell.taxReductionFromOtherLosses)
            : osakkeetCalculation.sell.annualTaxChange.gt(0)
              ? `+${euro(osakkeetCalculation.sell.annualTaxChange)}`
              : euro(osakkeetCalculation.sell.grossTotal.mul(0)),
          texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapitalHelp(
            euro(osakkeetCalculation.sell.otherAnnualCapitalGainsOrLosses),
            euro(osakkeetCalculation.sell.taxReductionFromOtherLosses),
            euro(Decimal.max(osakkeetCalculation.sell.annualTaxChange, osakkeetCalculation.sell.grossTotal.mul(0)))
          )
        )
      )
      replaceChildren(
        annualAdjustmentReserveRoot,
        infoCard(
          texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxes,
          euro(osakkeetCalculation.sell.annualEstimatedTax),
          texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxesHelp(
            euro(osakkeetCalculation.sell.annualEstimatedTax)
          )
        )
      )
      replaceChildren(
        annualAdjustmentKeepRoot,
        infoCard(
          texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxes,
          euro(osakkeetCalculation.sell.netAfterAnnualTaxAndIpoCost),
          texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxesHelp(
            euro(osakkeetCalculation.sell.cashAfterIpoCosts),
            euro(osakkeetCalculation.sell.annualEstimatedTax),
            euro(osakkeetCalculation.sell.netAfterAnnualTaxAndIpoCost)
          )
        )
      )
    },
  }
}

function createIntroSection(languageSelectionState: State<Language>) {
  const titleNode = text()
  const languageSwitchLabelNode = text()
  const descriptionNode = text()
  const unlistedDescriptionNode = text()
  const securityTitleNode = text()
  const securityTextNode = text()
  const securityAdditionalTextNode = text()
  const securityNoteNode = text()
  const securityIssuesNode = text()
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
      div(
        { class: 'no-print' },
        pageStyles.rowButtons,
        span({ class: 'muted' }, languageSwitchLabelNode),
        fiButton,
        enButton
      )
    ),
    p({ class: 'muted' }, descriptionNode),
    p({ class: 'muted' }, unlistedDescriptionNode),
    div(
      pageStyles.denseStack,
      h3(securityTitleNode),
      p(pageStyles.compactParagraph, { class: 'muted' }, securityTextNode),
      p(pageStyles.compactParagraph, { class: 'muted' }, securityAdditionalTextNode),
      p(pageStyles.redNote, pageStyles.compactParagraph, securityNoteNode),
      p(pageStyles.compactParagraph, { class: 'muted' }, securityIssuesNode)
    ),
    assumptionsRoot
  )
  return {
    root,
    set({ languageSelection, texts }: OsakkeetPageReadModel) {
      setTextValue(titleNode, texts.intro.title)
      setTextValue(languageSwitchLabelNode, texts.languageSwitch.label)
      setTextValue(descriptionNode, texts.intro.description)
      setTextValue(unlistedDescriptionNode, texts.intro.unlistedDescription)
      setTextValue(securityTitleNode, texts.intro.securityTitle)
      setTextValue(securityTextNode, texts.intro.securityText)
      setTextValue(securityAdditionalTextNode, texts.intro.securityAdditionalText)
      setTextValue(securityNoteNode, texts.intro.securityNote)
      setTextValue(securityIssuesNode, texts.intro.securityIssues)
      setButtonVariant(fiButton, languageSelection === 'fi')
      setButtonVariant(enButton, languageSelection === 'en')
      replaceChildren(assumptionsRoot, assumptionsContent(texts))
    },
  }
}

function createStickyWarningsSection() {
  const titleNode = text()
  const warningListRoot = ul()
  const root = div(pageStyles.stickyWarningBox, h3(titleNode), warningListRoot)

  return {
    root,
    set({ texts }: Pick<OsakkeetPageReadModel, 'texts'>) {
      setTextValue(titleNode, texts.intro.warningsTitle)
      replaceChildren(
        warningListRoot,
        texts.intro.warnings.map((warning) => li(warning))
      )
    },
  }
}

function createToolbarSection(dataState: State<OsakkeetFormData>) {
  const statusNode = text()
  const titleNode = text()
  const rowTitleHeaderNode = text()
  const rowDescriptionHeaderNode = text()
  const rowActionsHeaderNode = text()
  const autoSaveTitleNode = text()
  const autoSaveDescriptionNode = text()
  const fileTitleNode = text()
  const fileDescriptionNode = text()
  const browserTitleNode = text()
  const browserDescriptionNode = text()
  const clearTitleNode = text()
  const clearDescriptionNode = text()
  const exampleTitleNode = text()
  const exampleDescriptionNode = text()
  const saveToBrowserStorageLabelNode = text()
  const loadFromBrowserStorageLabelNode = text()
  const removeFromBrowserStorageLabelNode = text()
  const copyShareUrlLabelNode = text()
  const copyShareUrlHelpNode = text()
  const copyShareUrlNoteNode = text()
  const saveFileLabelNode = text()
  const loadFileLabelNode = text()
  const restoreExampleLabelNode = text()
  const clearExampleLabelNode = text()
  let currentTexts = getOsakkeetLocalization(tryLoadLanguage())
  const refreshStorageButtons = () => {
    const currentSerialized = serializeOsakkeetFormData(dataState.get())
    const browserSerialized = tryStorageGet(localStorage, storageKeys.browserFormData)
    const lastFileSavedHash = tryStorageGet(sessionStorage, storageKeys.lastFileSavedHash)
    const browserNeedsSave = browserSerialized !== currentSerialized
    const hasBrowserSavedData = !!browserSerialized
    const fileNeedsSave = lastFileSavedHash !== currentSerialized
    setButtonAttention(saveToBrowserStorageButton, browserNeedsSave)
    setButtonAttention(saveFileButton, fileNeedsSave)
    setButtonDisabled(loadFromBrowserStorageButton, !hasBrowserSavedData)
    setButtonDisabled(removeFromBrowserStorageButton, !hasBrowserSavedData)
    saveToBrowserStorageButton.title = browserNeedsSave
      ? currentTexts.storage.saveIndicators.browserNeedsSave
      : currentTexts.storage.saveIndicators.browserSaved
    loadFromBrowserStorageButton.title = hasBrowserSavedData
      ? currentTexts.storage.actions.loadFromBrowserStorage
      : currentTexts.storage.saveIndicators.browserLoadUnavailable
    removeFromBrowserStorageButton.title = hasBrowserSavedData
      ? currentTexts.storage.actions.removeFromBrowserStorage
      : currentTexts.storage.saveIndicators.browserLoadUnavailable
    saveFileButton.title = fileNeedsSave
      ? currentTexts.storage.saveIndicators.fileNeedsSave
      : currentTexts.storage.saveIndicators.fileSaved
  }
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
            const normalized = normalizeLoadedData(parsed)
            dataState.set(normalized)
            tryStorageSet(sessionStorage, storageKeys.lastFileSavedHash, serializeOsakkeetFormData(normalized))
            statusNode.textContent = currentTexts.storage.status.loaded
            refreshStorageButtons()
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
      labelNode: saveFileLabelNode,
      variant: 'secondary' as const,
      action: () => {
        const blob = new Blob([JSON.stringify(sanitizeOsakkeetFormData(dataState.get()), null, 2)], {
          type: 'application/json',
        })
        const serialized = serializeOsakkeetFormData(dataState.get())
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'osakkeet-input-state.json'
        link.click()
        URL.revokeObjectURL(url)
        tryStorageSet(sessionStorage, storageKeys.lastFileSavedHash, serialized)
        statusNode.textContent = currentTexts.storage.status.fileSaved
        refreshStorageButtons()
      },
    },
    {
      labelNode: saveToBrowserStorageLabelNode,
      variant: 'secondary' as const,
      action: () => {
        tryStorageSet(localStorage, storageKeys.browserFormData, serializeOsakkeetFormData(dataState.get()))
        statusNode.textContent = currentTexts.storage.status.browserSaved
        refreshStorageButtons()
      },
    },
    {
      labelNode: loadFromBrowserStorageLabelNode,
      variant: 'secondary' as const,
      action: () => {
        const saved = tryStorageGet(localStorage, storageKeys.browserFormData)
        if (!saved) return
        try {
          const parsed = JSON.parse(saved) as Partial<OsakkeetFormData>
          dataState.set(normalizeLoadedData(parsed))
          statusNode.textContent = currentTexts.storage.status.browserLoaded
          refreshStorageButtons()
        } catch {
          statusNode.textContent = currentTexts.storage.errors.invalidFile
        }
      },
    },
    {
      labelNode: removeFromBrowserStorageLabelNode,
      variant: 'secondary' as const,
      action: () => {
        tryStorageRemove(localStorage, storageKeys.browserFormData)
        statusNode.textContent = currentTexts.storage.status.browserRemoved
        refreshStorageButtons()
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
      labelNode: restoreExampleLabelNode,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createOsakkeetFormData(true))
        statusNode.textContent = currentTexts.storage.status.exampleShown
      },
    },
    {
      labelNode: clearExampleLabelNode,
      variant: 'secondary' as const,
      action: () => {
        if (!window.confirm(currentTexts.storage.confirmations.clearExample)) {
          return
        }
        dataState.set(createOsakkeetFormData(false))
        statusNode.textContent = currentTexts.storage.status.exampleCleared
      },
    },
    {
      labelNode: copyShareUrlLabelNode,
      variant: 'secondary' as const,
      action: () => {
        void copyTextToClipboard(buildShareUrl(dataState.get())).then(
          (copied) => {
            statusNode.textContent = copied
              ? currentTexts.storage.status.shareUrlCopied
              : currentTexts.storage.errors.clipboardFailed
          },
          () => {
            statusNode.textContent = currentTexts.storage.errors.clipboardFailed
          }
        )
      },
    },
  ]
  const [
    saveFileButton,
    saveToBrowserStorageButton,
    loadFromBrowserStorageButton,
    removeFromBrowserStorageButton,
    loadFileButton,
    restoreExampleButton,
    clearExampleButton,
    copyShareUrlButton,
  ] = buttonConfigs.map(({ labelNode, variant, action }) => createActionButton(labelNode, variant, action))
  const root = div(
    { class: 'card no-print' },
    div({ class: 'heading' }, h2(titleNode), span({ class: 'muted' }, statusNode)),
    fileInput,
    table(
      pageStyles.storageTable,
      thead(
        tr(
          th(pageStyles.storageCellTop, pageStyles.storageLabelCell, rowTitleHeaderNode),
          th(pageStyles.storageCellTop, pageStyles.storageActionsCell, rowActionsHeaderNode),
          th(pageStyles.storageCellTop, pageStyles.storageDescriptionCell, rowDescriptionHeaderNode)
        )
      ),
      tbody(
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, autoSaveTitleNode),
          td(pageStyles.storageCellTop, pageStyles.storageActionsCell),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, autoSaveDescriptionNode)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, fileTitleNode),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageActionsCell,
            div(pageStyles.topAlignedRowButtons, saveFileButton, loadFileButton)
          ),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, fileDescriptionNode)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, browserTitleNode),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageActionsCell,
            div(
              pageStyles.topAlignedRowButtons,
              saveToBrowserStorageButton,
              loadFromBrowserStorageButton,
              removeFromBrowserStorageButton
            )
          ),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, browserDescriptionNode)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, clearTitleNode),
          td(pageStyles.storageCellTop, pageStyles.storageActionsCell, clearExampleButton),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, clearDescriptionNode)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, exampleTitleNode),
          td(pageStyles.storageCellTop, pageStyles.storageActionsCell, restoreExampleButton),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, exampleDescriptionNode)
          )
        )
      )
    ),
    div(
      pageStyles.rightAlignedActions,
      div(
        pageStyles.actionGroup,
        copyShareUrlButton,
        span({ class: 'muted' }, copyShareUrlHelpNode),
        span(pageStyles.redNote, copyShareUrlNoteNode)
      )
    )
  )

  return {
    root,
    set({ texts }: OsakkeetPageReadModel) {
      currentTexts = texts
      setTextValue(titleNode, texts.storage.title)
      setTextValue(rowTitleHeaderNode, texts.storage.table.rowTitle)
      setTextValue(rowDescriptionHeaderNode, texts.storage.table.descriptionTitle)
      setTextValue(rowActionsHeaderNode, texts.storage.table.actionsTitle)
      setTextValue(autoSaveTitleNode, texts.storage.table.autoSaveTitle)
      setTextValue(autoSaveDescriptionNode, texts.storage.table.autoSaveDescription)
      setTextValue(fileTitleNode, texts.storage.table.fileTitle)
      setTextValue(fileDescriptionNode, texts.storage.table.fileDescription)
      setTextValue(browserTitleNode, texts.storage.table.browserTitle)
      setTextValue(browserDescriptionNode, texts.storage.table.browserDescription)
      setTextValue(clearTitleNode, texts.storage.table.clearTitle)
      setTextValue(clearDescriptionNode, texts.storage.table.clearDescription)
      setTextValue(exampleTitleNode, texts.storage.table.exampleTitle)
      setTextValue(exampleDescriptionNode, texts.storage.table.exampleDescription)
      setTextValue(saveToBrowserStorageLabelNode, texts.storage.actions.saveToBrowserStorage)
      setTextValue(loadFromBrowserStorageLabelNode, texts.storage.actions.loadFromBrowserStorage)
      setTextValue(removeFromBrowserStorageLabelNode, texts.storage.actions.removeFromBrowserStorage)
      setTextValue(copyShareUrlLabelNode, texts.storage.actions.copyShareUrl)
      setTextValue(copyShareUrlHelpNode, texts.storage.copyShareUrlHelp)
      setTextValue(copyShareUrlNoteNode, texts.storage.copyShareUrlNote)
      setTextValue(saveFileLabelNode, texts.storage.actions.saveFile)
      setTextValue(loadFileLabelNode, texts.storage.actions.loadFile)
      setTextValue(restoreExampleLabelNode, texts.storage.actions.showExample)
      setTextValue(clearExampleLabelNode, texts.storage.actions.clearExample)
      refreshStorageButtons()
    },
  }
}

function createTaxSummarySection(dataState: State<OsakkeetFormData>) {
  const titleNode = text()
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
  const dataState = createState({ value: tryLoadInitialData() })
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

  const stickyWarningsSection = createStickyWarningsSection()
  const introSection = createIntroSection(languageSelectionState)
  const toolbarSection = createToolbarSection(dataState)
  const subscriptionsSection = createSubscriptionsSection(dataState)
  const cashDistributionsSection = createCashDistributionsSection(dataState)
  const taxSummarySectionController = createTaxSummarySection(dataState)
  const ipoSection = createIpoSection(dataState)
  const resultsSection = createResultsSection(dataState)
  const root = div(pageStyles.stack)
  const applyPageReadModel = (pageReadModel: OsakkeetPageReadModel) => {
    stickyWarningsSection.set(pageReadModel)
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
  dataState.onValueChange((data) => {
    tryStorageSet(sessionStorage, storageKeys.windowFormData, serializeOsakkeetFormData(data))
  })
  pageReadState.onValueChange(applyPageReadModel)

  const initialPageReadModel = pageReadState.get()
  applyPageReadModel(initialPageReadModel)
  replaceChildren(
    root,
    stickyWarningsSection.root,
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
