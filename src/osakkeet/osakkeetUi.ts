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
  th,
  thead,
  tr,
  ul,
} from '../../../ki-frame/src/domBuilder'
import { events } from '../../../ki-frame/src/domBuilderEvents'
import { setStyle, styles } from '../../../ki-frame/src/domBuilderStyles'
import {
  calculateOsakkeet,
  type CapitalRepaymentBreakdown,
  type IpoDetailsInput,
  type OsakkeetCalculation,
  type OsakkeetFormData,
} from './osakkeetCalculator'
import {
  createStateCollectionEditor,
  createTextNodesFromState,
  mapStatePathToInput,
  mapStateToDomChildren,
  persistState,
  type TextNodesFromValue,
} from './ki-frame-extensions'
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
  hoverInfo: styles({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'help',
  }),
  hoverInfoIcon: styles({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '14px',
    height: '14px',
    borderRadius: '999px',
    border: '1px solid rgba(15, 23, 42, 0.2)',
    color: 'rgb(75, 85, 99)',
    fontSize: '10px',
    fontWeight: '700',
    lineHeight: '1',
    flexShrink: '0',
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

function parseSupportedDate(trimmed: string) {
  const finnishDateMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed)
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)

  if (finnishDateMatch) {
    const [, day, month, year] = finnishDateMatch
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  }
  if (isoDateMatch) {
    return new Date(`${trimmed}T00:00:00Z`)
  }
  return undefined
}

function decimalOrUndefined(value?: string) {
  const normalized = value?.trim() || ''
  if (!normalized) return undefined
  try {
    return new Decimal(normalized)
  } catch {
    return undefined
  }
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

type ExamplePreset = 'small2y' | 'medium8y' | 'large16y'

function createOsakkeetFormData(demo: boolean): OsakkeetFormData {
  if (demo) {
    return createExampleOsakkeetFormData('medium8y')
  }
  return {
    subscriptions: [
      {
        id: createId('sub'),
        date: '',
        vestingEndsOn: '',
        amount: '',
        pricePerShare: '',
        otherTotalAcquisitionCosts: '',
      },
    ],
    cashDistributions: [
      { id: createId('distribution'), type: 'capital_return', date: '', amountPerShare: '', shareCount: '' },
    ],
    shareSplits: [{ id: createId('split'), date: '', multiplier: '' }],
    demergers: [{ id: createId('demerger'), date: '', oldCompanyRatio: '' }],
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
      otherAnnualCapitalGainsOrLosses: '',
    },
  }
}

function createExampleOsakkeetFormData(preset: ExamplePreset): OsakkeetFormData {
  if (preset === 'small2y') {
    return {
      subscriptions: [
        {
          id: createId('sub'),
          date: '15.04.2024',
          vestingEndsOn: '',
          amount: '1200',
          pricePerShare: '2.80',
          otherTotalAcquisitionCosts: '25',
        },
        {
          id: createId('sub'),
          date: '15.02.2025',
          vestingEndsOn: '31.12.2026',
          amount: '800',
          pricePerShare: '3.20',
          otherTotalAcquisitionCosts: '20',
        },
      ],
      cashDistributions: [
        {
          id: createId('distribution'),
          type: 'capital_return',
          date: '30.06.2025',
          amountPerShare: '0.18',
          shareCount: '',
        },
      ],
      shareSplits: [],
      demergers: [],
      mathematicalShareValues: [
        { id: createId('math'), year: '2025', valuePerShare: '7.50' },
        { id: createId('math'), year: '2026', valuePerShare: '10.20' },
      ],
      ipo: {
        ipoDate: '15.09.2026',
        totalShareCount: '850000',
        totalIpoCost: '95000',
        currentShareValue: '10.20',
        estimatedPreIpoValue: '9000000',
        estimatedSecondaryShareSellPercentage: '3',
      },
      sell: {
        amount: '900',
        otherAnnualCapitalGainsOrLosses: '',
      },
    }
  }

  if (preset === 'medium8y') {
    return {
      subscriptions: [
        {
          id: createId('sub'),
          date: '20.05.2018',
          vestingEndsOn: '',
          amount: '12000',
          pricePerShare: '0.85',
          otherTotalAcquisitionCosts: '120',
        },
        {
          id: createId('sub'),
          date: '10.02.2021',
          vestingEndsOn: '',
          amount: '12000',
          pricePerShare: '8.50',
          otherTotalAcquisitionCosts: '300',
        },
      ],
      cashDistributions: [
        {
          id: createId('distribution'),
          type: 'capital_return',
          date: '28.06.2022',
          amountPerShare: '0.12',
          shareCount: '',
        },
        {
          id: createId('distribution'),
          type: 'capital_return',
          date: '30.06.2023',
          amountPerShare: '0.16',
          shareCount: '',
        },
        {
          id: createId('distribution'),
          type: 'capital_return',
          date: '28.06.2024',
          amountPerShare: '0.22',
          shareCount: '',
        },
        {
          id: createId('distribution'),
          type: 'capital_return',
          date: '30.06.2025',
          amountPerShare: '0.28',
          shareCount: '',
        },
      ],
      shareSplits: [{ id: createId('split'), date: '02.01.2026', multiplier: '2' }],
      demergers: [],
      mathematicalShareValues: [
        { id: createId('math'), year: '2022', valuePerShare: '18.00' },
        { id: createId('math'), year: '2023', valuePerShare: '21.50' },
        { id: createId('math'), year: '2024', valuePerShare: '27.00' },
        { id: createId('math'), year: '2025', valuePerShare: '33.00' },
        { id: createId('math'), year: '2026', valuePerShare: '41.00' },
      ],
      ipo: {
        ipoDate: '15.09.2026',
        totalShareCount: '1960000',
        totalIpoCost: '320000',
        currentShareValue: '20.50',
        estimatedPreIpoValue: '40000000',
        estimatedSecondaryShareSellPercentage: '10',
      },
      sell: {
        amount: '18000',
        otherAnnualCapitalGainsOrLosses: '-12000',
      },
    }
  }

  return {
    subscriptions: [
      {
        id: createId('sub'),
        date: '15.03.2010',
        vestingEndsOn: '',
        amount: '85000',
        pricePerShare: '0.18',
        otherTotalAcquisitionCosts: '550',
      },
      {
        id: createId('sub'),
        date: '01.06.2021',
        vestingEndsOn: '',
        amount: '20000',
        pricePerShare: '18.00',
        otherTotalAcquisitionCosts: '800',
      },
    ],
    cashDistributions: [
      {
        id: createId('distribution'),
        type: 'capital_return',
        date: '31.03.2022',
        amountPerShare: '0.10',
        shareCount: '',
      },
      {
        id: createId('distribution'),
        type: 'capital_return',
        date: '30.06.2023',
        amountPerShare: '0.14',
        shareCount: '',
      },
      {
        id: createId('distribution'),
        type: 'capital_return',
        date: '28.06.2024',
        amountPerShare: '0.18',
        shareCount: '',
      },
      {
        id: createId('distribution'),
        type: 'capital_return',
        date: '30.06.2025',
        amountPerShare: '0.24',
        shareCount: '',
      },
      {
        id: createId('distribution'),
        type: 'capital_return',
        date: '30.06.2026',
        amountPerShare: '0.28',
        shareCount: '',
      },
      {
        id: createId('distribution'),
        type: 'dividend',
        date: '30.09.2026',
        amountPerShare: '0.42',
        shareCount: '',
      },
    ],
    shareSplits: [],
    demergers: [{ id: createId('demerger'), date: '02.01.2024', oldCompanyRatio: '0.68' }],
    mathematicalShareValues: [
      { id: createId('math'), year: '2022', valuePerShare: '24.00' },
      { id: createId('math'), year: '2023', valuePerShare: '31.00' },
      { id: createId('math'), year: '2024', valuePerShare: '39.50' },
      { id: createId('math'), year: '2025', valuePerShare: '49.00' },
      { id: createId('math'), year: '2026', valuePerShare: '63.00' },
    ],
    ipo: {
      ipoDate: '15.09.2026',
      totalShareCount: '1050000',
      totalIpoCost: '720000',
      currentShareValue: '63.00',
      estimatedPreIpoValue: '66000000',
      estimatedSecondaryShareSellPercentage: '12',
    },
    sell: {
      amount: '90000',
      otherAnnualCapitalGainsOrLosses: '25000',
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
    shareSplits: (data.shareSplits || []).map((shareSplit) => ({
      id: shareSplit.id || createId('split'),
      date: shareSplit.date || '',
      multiplier: shareSplit.multiplier || '',
    })),
    demergers: (data.demergers || []).map((demerger) => ({
      id: demerger.id || createId('demerger'),
      date: demerger.date || '',
      oldCompanyRatio: demerger.oldCompanyRatio || '',
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

type ShareableOsakkeetUrlData = Pick<
  OsakkeetFormData,
  'cashDistributions' | 'shareSplits' | 'demergers' | 'mathematicalShareValues' | 'ipo'
>

function createShareableOsakkeetUrlData(data: OsakkeetFormData): ShareableOsakkeetUrlData {
  const sanitized = sanitizeOsakkeetFormData(data)
  return {
    cashDistributions: sanitized.cashDistributions.map((cashDistribution) => ({
      id: cashDistribution.id,
      date: cashDistribution.date,
      type: cashDistribution.type,
      amountPerShare: cashDistribution.amountPerShare,
    })),
    shareSplits: sanitized.shareSplits,
    demergers: sanitized.demergers,
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
    shareSplits: (parsed.shareSplits || []).map((shareSplit) => ({
      id: shareSplit.id || createId('split'),
      date: shareSplit.date || '',
      multiplier: shareSplit.multiplier || '',
    })),
    demergers: (parsed.demergers || []).map((demerger) => ({
      id: demerger.id || createId('demerger'),
      date: demerger.date || '',
      oldCompanyRatio: demerger.oldCompanyRatio || '',
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
      shareSplits: parsed.shareSplits || [],
      demergers: parsed.demergers || [],
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

function numberInput(value: string, onInput: (value: string) => void = () => {}, numeric: boolean = true) {
  return inputs.text(
    {
      value,
      ...(numeric ? { inputMode: 'decimal' as const } : {}),
    },
    pageStyles.input,
    events({
      input({ node }) {
        onInput(node.value)
      },
    })
  )
}

function finnishDateInput(value: string, onInput: (value: string) => void = () => {}) {
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
  onChange: (value: Value) => void = () => {}
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

function withHoverInfo(content: string | Text | Node, tooltip: string) {
  return span({ title: tooltip }, pageStyles.hoverInfo, content, span(pageStyles.hoverInfoIcon, 'i'))
}

function hoverValue(value: string, tooltip: string, emphasized = false) {
  const node = withHoverInfo(value, tooltip)
  return emphasized ? b(node) : node
}

function linkToSource(textValue: string, href: string) {
  return a(textValue, { href, target: '_blank', rel: 'noreferrer' })
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

function applyButtonStyle(
  node: HTMLButtonElement,
  style: (typeof pageStyles)[keyof typeof pageStyles],
  className = ''
) {
  node.removeAttribute('style')
  node.className = className
  setStyle(node, style.styles)
}

function setButtonVariant(node: HTMLButtonElement, primary: boolean) {
  if (primary) {
    node.removeAttribute('style')
    node.className = 'blueButton'
    return
  }
  applyButtonStyle(node, pageStyles.smallButton)
}

function setButtonAttention(node: HTMLButtonElement, needsAttention: boolean) {
  if (node.disabled) {
    applyButtonStyle(node, pageStyles.disabledButton)
    return
  }
  if (needsAttention) {
    applyButtonStyle(node, pageStyles.attentionButton)
    return
  }
  applyButtonStyle(node, pageStyles.smallButton)
}

function setButtonDisabled(node: HTMLButtonElement, disabled: boolean) {
  node.disabled = disabled
  applyButtonStyle(node, disabled ? pageStyles.disabledButton : pageStyles.smallButton)
}

function createRemoveButton(labelNode: Text, remove: () => void) {
  return button(
    labelNode,
    pageStyles.smallButton,
    events({
      click() {
        remove()
      },
    })
  ) as HTMLButtonElement
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

type LocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization>
type CommonLocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization['common']>

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
        t.sources.reporting,
        'https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/veroilmoitus_ja_verotuspaato/ilmoittamisen-ohje/'
      ),
      ', ',
      linkToSource(
        t.sources.demergerAcquisitionCost,
        'https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/48262/arvopaperien-luovutusten-verotus4/'
      ),
      ', ',
      linkToSource(
        t.sources.demergers,
        'https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/49340/yritysjarjestelyt-ja-verotus-jakautuminen4/'
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

function createMathematicalShareValuesEditor(
  dataState: State<OsakkeetFormData>,
  localizedTextNodes: LocalizedTextNodes
) {
  const mathematicalShareValuesTextNodes = localizedTextNodes.mathematicalShareValues
  const tbodyNode = tbody()
  const rowsState = createState<{ id: string; year: string; valuePerShare: string; removeLabel: string }[]>({
    value: [],
  })
  const mathematicalShareValues = createStateCollectionEditor(dataState, ['mathematicalShareValues'])

  mapStateToDomChildren(rowsState, tbodyNode, {
    render: (row) => {
      const rowState = createState({
        value: {
          row,
        },
      })
      const rowTextNodes = createTextNodesFromState(rowState, { path: ['row'] })
      const yearInput = numberInput(row.year, (value) => {
        mathematicalShareValues.patch(row.id, { year: value })
      })
      const valuePerShareInput = numberInput(row.valuePerShare, (value) => {
        mathematicalShareValues.patch(row.id, { valuePerShare: value })
      })
      const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
        mathematicalShareValues.remove(row.id)
      })

      return {
        node: tr(
          td(div(pageStyles.compactField, yearInput)),
          td(div(pageStyles.compactField, valuePerShareInput)),
          td({ class: 'no-print' }, removeButton)
        ),
        set(nextRow) {
          setInputValue(yearInput, nextRow.year)
          setInputValue(valuePerShareInput, nextRow.valuePerShare)
          rowState.set({ row: nextRow })
        },
      }
    },
  })

  const addButton = createActionButton(mathematicalShareValuesTextNodes.actions.add, 'primary', () => {
    mathematicalShareValues.append({
      year: '',
      valuePerShare: '',
    })
  })

  const root = div(
    h3(mathematicalShareValuesTextNodes.title),
    table(
      pageStyles.compactTable,
      thead(
        tr(
          th(mathematicalShareValuesTextNodes.fields.year),
          th(mathematicalShareValuesTextNodes.fields.valuePerShare),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )

  return {
    root,
    set({ texts, osakkeetCalculation }: Pick<OsakkeetPageReadModel, 'texts' | 'osakkeetCalculation'>) {
      void texts
      rowsState.set(
        osakkeetCalculation.formData.mathematicalShareValues.map((row) => ({
          id: row.id,
          year: row.year,
          valuePerShare: row.valuePerShare,
          removeLabel: texts.common.remove,
        }))
      )
    },
  }
}

type ShareSplitRowViewModel = {
  id: string
  date: string
  multiplier: string
  removeLabel: string
}

function createShareSplitsSection(
  dataState: State<OsakkeetFormData>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const textState = createState({
    value: {
      rowCount: '',
    },
  })
  const shareSplitTextNodes = localizedTextNodes.shareSplits
  const rowCountNode = createTextNodesFromState(textState, { path: ['rowCount'] })
  const tbodyNode = tbody()
  const rowsState = createState<ShareSplitRowViewModel[]>({ value: [] })
  const shareSplits = createStateCollectionEditor(dataState, ['shareSplits'])

  mapStateToDomChildren(rowsState, tbodyNode, {
    render: (row) => {
      const rowState = createState({ value: { row } })
      const rowTextNodes = createTextNodesFromState(rowState, { path: ['row'] })
      const dateInput = finnishDateInput(row.date, (value) => {
        shareSplits.patch(row.id, { date: value })
      })
      const multiplierInput = numberInput(row.multiplier, (value) => {
        shareSplits.patch(row.id, { multiplier: value })
      })
      const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
        shareSplits.remove(row.id)
      })

      return {
        node: tr(
          td(div(pageStyles.compactField, dateInput)),
          td(div(pageStyles.compactField, multiplierInput)),
          td({ class: 'no-print' }, removeButton)
        ),
        set(nextRow) {
          setInputValue(dateInput, nextRow.date)
          setInputValue(multiplierInput, nextRow.multiplier)
          rowState.set({ row: nextRow })
        },
      }
    },
  })

  const addButton = createActionButton(shareSplitTextNodes.actions.add, 'primary', () => {
    shareSplits.append({
      date: '',
      multiplier: '',
    })
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(shareSplitTextNodes.title), span({ class: 'muted' }, rowCountNode)),
    p({ class: 'muted' }, shareSplitTextNodes.help),
    table(
      pageStyles.compactTable,
      thead(
        tr(
          th(commonTextNodes.date),
          th(shareSplitTextNodes.fields.multiplier),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )

  return {
    root,
    set({ osakkeetCalculation, texts }: OsakkeetPageReadModel) {
      const current = osakkeetCalculation.formData
      textState.set({
        rowCount: `${current.shareSplits.length} ${texts.common.rows}`,
      })
      rowsState.set(
        current.shareSplits.map((shareSplit) => ({
          id: shareSplit.id,
          date: shareSplit.date,
          multiplier: shareSplit.multiplier,
          removeLabel: texts.common.remove,
        }))
      )
    },
  }
}

type DemergerRowViewModel = {
  id: string
  date: string
  oldCompanyRatio: string
  removeLabel: string
}

function createDemergersSection(
  dataState: State<OsakkeetFormData>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const textState = createState({
    value: {
      rowCount: '',
    },
  })
  const demergerTextNodes = localizedTextNodes.demergers
  const rowCountNode = createTextNodesFromState(textState, { path: ['rowCount'] })
  const tbodyNode = tbody()
  const rowsState = createState<DemergerRowViewModel[]>({ value: [] })
  const demergers = createStateCollectionEditor(dataState, ['demergers'])

  mapStateToDomChildren(rowsState, tbodyNode, {
    render: (row) => {
      const rowState = createState({ value: { row } })
      const rowTextNodes = createTextNodesFromState(rowState, { path: ['row'] })
      const dateInput = finnishDateInput(row.date, (value) => {
        demergers.patch(row.id, { date: value })
      })
      const oldCompanyRatioInput = numberInput(row.oldCompanyRatio, (value) => {
        demergers.patch(row.id, { oldCompanyRatio: value })
      })
      const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
        demergers.remove(row.id)
      })

      return {
        node: tr(
          td(div(pageStyles.compactField, dateInput)),
          td(div(pageStyles.compactField, oldCompanyRatioInput)),
          td({ class: 'no-print' }, removeButton)
        ),
        set(nextRow) {
          setInputValue(dateInput, nextRow.date)
          setInputValue(oldCompanyRatioInput, nextRow.oldCompanyRatio)
          rowState.set({ row: nextRow })
        },
      }
    },
  })

  const addButton = createActionButton(demergerTextNodes.actions.add, 'primary', () => {
    demergers.append({
      date: '',
      oldCompanyRatio: '',
    })
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(demergerTextNodes.title), span({ class: 'muted' }, rowCountNode)),
    p({ class: 'muted' }, demergerTextNodes.help),
    table(
      pageStyles.compactTable,
      thead(
        tr(
          th(commonTextNodes.date),
          th(demergerTextNodes.fields.oldCompanyRatio),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )

  return {
    root,
    set({ osakkeetCalculation, texts }: OsakkeetPageReadModel) {
      const current = osakkeetCalculation.formData
      textState.set({
        rowCount: `${current.demergers.length} ${texts.common.rows}`,
      })
      rowsState.set(
        current.demergers.map((demerger) => ({
          id: demerger.id,
          date: demerger.date,
          oldCompanyRatio: demerger.oldCompanyRatio,
          removeLabel: texts.common.remove,
        }))
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

  const renderTaxTable = (entries: OsakkeetCalculation['cashDistributions'], mode: 'unlisted' | 'listed') => {
    const totalCapitalRepayment = entries.reduce((acc, row) => acc.add(row.capitalRepaymentTotal), zeroMoney)
    const totalDividend = entries.reduce((acc, row) => acc.add(row.dividendTotal), zeroMoney)
    const totalTaxableCapitalIncome = entries.reduce((acc, row) => acc.add(row.taxableCapitalIncome), zeroMoney)
    const totalTaxFreeCapitalIncome = entries.reduce((acc, row) => acc.add(row.taxFreeCapitalIncomePortion), zeroMoney)
    const totalTaxableEarnedDividend = entries.reduce((acc, row) => acc.add(row.taxableEarnedDividend), zeroMoney)
    const totalTaxFreeEarnedDividend = entries.reduce((acc, row) => acc.add(row.taxFreeEarnedDividend), zeroMoney)
    const totalWithholding = entries.reduce((acc, row) => acc.add(row.withholdingToTaxOffice), zeroMoney)
    const totalCash = entries.reduce((acc, row) => acc.add(row.paidInCash), zeroMoney)
    const capitalRepaymentHeaderNode =
      mode === 'unlisted'
        ? withHoverInfo(t.cashDistributions.fields.capitalRepayment, t.taxReturns.fields.unlistedCapitalRepaymentHelp)
        : t.cashDistributions.fields.capitalRepayment
    const dividendHeaderNode = withHoverInfo(
      t.cashDistributions.fields.dividend,
      mode === 'unlisted' ? t.taxReturns.fields.unlistedDividendHelp : t.taxReturns.fields.listedDividendHelp
    )

    return table(
      thead(
        tr(
          th(t.common.date),
          th(t.common.type),
          th(t.cashDistributions.fields.cashPaid),
          th(t.cashDistributions.fields.withholding),
          mode === 'unlisted' && th(capitalRepaymentHeaderNode),
          th(dividendHeaderNode),
          th(t.taxReturns.fields.taxableCapitalIncome),
          th(t.taxReturns.fields.taxFreeCapitalIncome),
          mode === 'unlisted' && th(t.taxReturns.fields.taxableEarnedDividend),
          mode === 'unlisted' && th(t.taxReturns.fields.taxFreeEarnedDividend),
        )
      ),
      tbody(
        entries.map((row) =>
          tr(
            td(row.date),
            td(row.type === 'dividend' ? t.cashDistributions.types.dividend : t.cashDistributions.types.capitalReturn),
            td(euro(row.paidInCash)),
            td(euro(row.withholdingToTaxOffice)),
            mode === 'unlisted' && td(euro(row.capitalRepaymentTotal)),
            td(euro(row.dividendTotal)),
            td(euro(row.taxableCapitalIncome)),
            td(euro(row.taxFreeCapitalIncomePortion)),
            mode === 'unlisted' && td(euro(row.taxableEarnedDividend)),
            mode === 'unlisted' && td(euro(row.taxFreeEarnedDividend))
          )
        ),
        tr(
          td(b(t.summary.totalRow)),
          td(),
          td(euro(totalCash)),
          td(euro(totalWithholding)),
          mode === 'unlisted' && td(euro(totalCapitalRepayment)),
          td(euro(totalDividend)),
          td(euro(totalTaxableCapitalIncome)),
          td(euro(totalTaxFreeCapitalIncome)),
          mode === 'unlisted' && td(euro(totalTaxableEarnedDividend)),
          mode === 'unlisted' && td(euro(totalTaxFreeEarnedDividend))
        )
      )
    )
  }

  return div(
    years.map((year) => {
      const yearEntries = calculation.cashDistributions.filter((cashDistribution) =>
        cashDistribution.date.endsWith(String(year))
      )
      const unlistedEntries = yearEntries.filter((row) => !row.treatedAsListedDividend)
      const listedEntries = yearEntries.filter((row) => row.treatedAsListedDividend)
      const yearMathWarnings = unlistedEntries.filter(
        (row) => row.dividendTotal.gt(0) && !row.treatedAsListedDividend && row.shareholderMathematicalValue.eq(0)
      )
      return div(
        pageStyles.denseStack,
        h3(String(year)),
        yearMathWarnings.length > 0 &&
          div(
            pageStyles.warningBox,
            ul(yearMathWarnings.map((row) => li(`${row.date}: ${t.taxReturns.yearWarningMissingMathValue}`)))
          ),
        unlistedEntries.length > 0 &&
          div(
            pageStyles.denseStack,
            h3(withHoverInfo(t.taxReturns.sections.unlisted, t.taxReturns.sections.unlistedHelp)),
            renderTaxTable(unlistedEntries, 'unlisted')
          ),
        listedEntries.length > 0 &&
          div(pageStyles.denseStack, h3(t.taxReturns.sections.listed), renderTaxTable(listedEntries, 'listed')),
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

type SubscriptionRowViewModel = {
  id: string
  date: string
  vestingEndsOn: string
  amount: string
  pricePerShare: string
  otherTotalAcquisitionCosts: string
  totalPricePerShare: string
  totalPricePerShareTooltip: string
  capitalRepaymentTotal: string
  capitalRepaymentTotalTooltip: string
  capitalRepaymentPerShare: string
  remainingCostPerShare: string
  removeLabel: string
}

function createCapitalRepaymentTooltip(breakdown: CapitalRepaymentBreakdown[], texts: OsakkeetLocalization) {
  if (!breakdown.length) return ''
  return [
    texts.subscriptions.fields.totalReimbursementsTooltipIntro,
    ...breakdown.map((entry) =>
      texts.subscriptions.fields.totalReimbursementsTooltipLine(
        entry.distributionDate,
        euro(entry.capitalRepaymentPerShare),
        amount(entry.shares),
        euro(entry.capitalRepaymentTotal)
      )
    ),
  ].join('\n')
}

function createTotalPricePerShareTooltip(
  subscription: OsakkeetFormData['subscriptions'][number],
  formData: OsakkeetFormData,
  summary: OsakkeetCalculation['subscriptions'][number] | undefined,
  texts: OsakkeetLocalization
) {
  if (!summary) return ''

  const baseShares = decimalOrUndefined(subscription.amount)
  const pricePerShare = decimalOrUndefined(subscription.pricePerShare || '') || new Decimal(0)
  const otherCosts = decimalOrUndefined(subscription.otherTotalAcquisitionCosts || '') || new Decimal(0)
  if (!baseShares) return ''

  let currentTotal = baseShares.mul(pricePerShare).add(otherCosts)
  let currentShares = baseShares
  const subscriptionDate = parseSupportedDate(subscription.date.trim())
  const events = [
    ...formData.demergers.map((demerger) => ({ kind: 'demerger' as const, date: demerger.date, entry: demerger })),
    ...formData.shareSplits.map((shareSplit) => ({ kind: 'split' as const, date: shareSplit.date, entry: shareSplit })),
  ]
    .filter((event) => {
      const eventDate = parseSupportedDate(event.date.trim())
      if (!eventDate) return false
      if (!subscriptionDate) return true
      return subscriptionDate.getTime() <= eventDate.getTime()
    })
    .sort((a, b) => {
      const dateA = parseSupportedDate(a.date.trim())
      const dateB = parseSupportedDate(b.date.trim())
      const dateComparison = (dateA?.getTime() || 0) - (dateB?.getTime() || 0)
      if (dateComparison !== 0) return dateComparison
      if (a.kind === b.kind) return 0
      return a.kind === 'split' ? -1 : 1
    })

  const lines = [
    texts.subscriptions.fields.totalPricePerShareTooltipBase(
      amount(baseShares),
      euro(pricePerShare),
      euro(otherCosts),
      euro(currentTotal)
    ),
  ]

  for (const event of events) {
    if (event.kind === 'demerger') {
      const ratio = decimalOrUndefined(event.entry.oldCompanyRatio)
      if (!ratio) continue
      const nextTotal = currentTotal.mul(ratio)
      lines.push(
        texts.subscriptions.fields.totalPricePerShareTooltipDemerger(
          event.entry.date,
          euro(currentTotal),
          amount(ratio),
          euro(nextTotal)
        )
      )
      currentTotal = nextTotal
      continue
    }

    const splitMultiplier = decimalOrUndefined(event.entry.multiplier)
    if (!splitMultiplier) continue
    const nextShares = currentShares.mul(splitMultiplier)
    lines.push(
      texts.subscriptions.fields.totalPricePerShareTooltipSplit(
        event.entry.date,
        amount(currentShares),
        amount(splitMultiplier),
        amount(nextShares)
      )
    )
    currentShares = nextShares
  }

  lines.push(
    texts.subscriptions.fields.totalPricePerShareTooltipResult(
      euro(summary.totalPrice),
      amount(summary.amount),
      euro(summary.totalPricePerShare)
    )
  )
  return lines.join('\n')
}

function createSubscriptionsSection(
  dataState: State<OsakkeetFormData>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const textState = createState({
    value: {
      rowCount: '',
    },
  })
  const subscriptionTextNodes = localizedTextNodes.subscriptions
  const rowCountNode = createTextNodesFromState(textState, { path: ['rowCount'] })
  const summaryRoot = div(pageStyles.summaryGrid)
  const vestingEndsOnHeaderNode = withHoverInfo(subscriptionTextNodes.fields.vestingEndsOn, '')
  const otherTotalAcquisitionCostsHeaderNode = withHoverInfo(
    subscriptionTextNodes.fields.otherTotalAcquisitionCosts,
    ''
  )
  const totalReimbursementsHeaderNode = withHoverInfo(subscriptionTextNodes.fields.totalReimbursements, '')
  const tbodyNode = tbody()
  const rowsState = createState<SubscriptionRowViewModel[]>({ value: [] })
  const subscriptions = createStateCollectionEditor(dataState, ['subscriptions'])

  mapStateToDomChildren(rowsState, tbodyNode, {
    render: (row) => {
      const rowState = createState({
        value: {
          row,
        },
      })
      const rowTextNodes = createTextNodesFromState(rowState, { path: ['row'] })
      const dateInput = finnishDateInput(row.date, (value) => {
        subscriptions.patch(row.id, { date: value })
      })
      const vestingEndsOnInput = finnishDateInput(row.vestingEndsOn, (value) => {
        subscriptions.patch(row.id, { vestingEndsOn: value })
      })
      const amountInput = numberInput(row.amount, (value) => {
        subscriptions.patch(row.id, { amount: value })
      })
      const pricePerShareInput = numberInput(row.pricePerShare, (value) => {
        subscriptions.patch(row.id, { pricePerShare: value })
      })
      const otherTotalAcquisitionCostsInput = numberInput(row.otherTotalAcquisitionCosts, (value) => {
        subscriptions.patch(row.id, { otherTotalAcquisitionCosts: value })
      })
      const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
        subscriptions.remove(row.id)
      })
      const totalPricePerShareCell = td(
        row.totalPricePerShareTooltip ? hoverValue(row.totalPricePerShare, row.totalPricePerShareTooltip) : row.totalPricePerShare
      )
      const capitalRepaymentTotalCell = td(
        row.capitalRepaymentTotalTooltip
          ? hoverValue(row.capitalRepaymentTotal, row.capitalRepaymentTotalTooltip)
          : row.capitalRepaymentTotal
      )

      return {
        node: tr(
          td(dateInput),
          td(vestingEndsOnInput),
          td(amountInput),
          td(pricePerShareInput),
          td(otherTotalAcquisitionCostsInput),
          totalPricePerShareCell,
          td(rowTextNodes.capitalRepaymentPerShare),
          td(rowTextNodes.remainingCostPerShare),
          capitalRepaymentTotalCell,
          td({ class: 'no-print' }, removeButton)
        ),
        set(nextRow) {
          setInputValue(dateInput, nextRow.date)
          setInputValue(vestingEndsOnInput, nextRow.vestingEndsOn)
          setInputValue(amountInput, nextRow.amount)
          setInputValue(pricePerShareInput, nextRow.pricePerShare)
          setInputValue(otherTotalAcquisitionCostsInput, nextRow.otherTotalAcquisitionCosts)
          rowState.set({ row: nextRow })
          replaceChildren(
            totalPricePerShareCell,
            nextRow.totalPricePerShareTooltip
              ? hoverValue(nextRow.totalPricePerShare, nextRow.totalPricePerShareTooltip)
              : nextRow.totalPricePerShare
          )
          replaceChildren(
            capitalRepaymentTotalCell,
            nextRow.capitalRepaymentTotalTooltip
              ? hoverValue(nextRow.capitalRepaymentTotal, nextRow.capitalRepaymentTotalTooltip)
              : nextRow.capitalRepaymentTotal
          )
        },
      }
    },
  })

  const addButton = createActionButton(subscriptionTextNodes.actions.add, 'primary', () => {
    subscriptions.append({
      date: '',
      vestingEndsOn: '',
      amount: '',
      pricePerShare: '',
      otherTotalAcquisitionCosts: '',
    })
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(subscriptionTextNodes.title), span({ class: 'muted' }, rowCountNode)),
    p({ class: 'muted' }, subscriptionTextNodes.help),
    summaryRoot,
    table(
      thead(
        tr(
          th(commonTextNodes.date),
          th(vestingEndsOnHeaderNode),
          th(commonTextNodes.amount),
          th(subscriptionTextNodes.fields.pricePerShare),
          th(otherTotalAcquisitionCostsHeaderNode),
          th(subscriptionTextNodes.fields.totalPricePerShare),
          th(subscriptionTextNodes.fields.capitalRepaymentPerShare),
          th(subscriptionTextNodes.fields.remainingCostPerShare),
          th(totalReimbursementsHeaderNode),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )

  return {
    root,
    set({ osakkeetCalculation, texts }: OsakkeetPageReadModel) {
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
      textState.set({
        rowCount: `${current.subscriptions.length} ${texts.common.rows}`,
      })
      vestingEndsOnHeaderNode.title = texts.subscriptions.fields.vestingEndsOnHelp
      otherTotalAcquisitionCostsHeaderNode.title = texts.subscriptions.fields.otherTotalAcquisitionCostsHelp
      totalReimbursementsHeaderNode.title = texts.subscriptions.fields.totalReimbursementsHelp
      replaceChildren(
        summaryRoot,
        infoCard(texts.subscriptions.summary.totalShares, amount(totalShares)),
        infoCard(texts.subscriptions.summary.vestedShares, sharePercent(vestedShares)),
        infoCard(texts.subscriptions.summary.unvestedShares, sharePercent(unvestedShares))
      )
      rowsState.set(
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
          totalPricePerShareTooltip: createTotalPricePerShareTooltip(
            subscription,
            current,
            summariesById[subscription.id],
            texts
          ),
          capitalRepaymentTotal: summariesById[subscription.id]
            ? euro(summariesById[subscription.id].capitalRepaymentTotal)
            : '-',
          capitalRepaymentTotalTooltip: summariesById[subscription.id]
            ? createCapitalRepaymentTooltip(summariesById[subscription.id].capitalRepaymentBreakdown, texts)
            : '',
          capitalRepaymentPerShare: summariesById[subscription.id]
            ? euro(summariesById[subscription.id].capitalRepaymentPerShare)
            : '-',
          remainingCostPerShare: summariesById[subscription.id]
            ? euro(summariesById[subscription.id].remainingCostPerShare)
            : '-',
          removeLabel: texts.common.remove,
        }))
      )
    },
  }
}

type CashDistributionRowViewModel = {
  id: string
  date: string
  type: 'capital_return' | 'dividend'
  shareCount: string
  amountPerShare: string
  grossTotal: string
  withholdingToTaxOffice: string
  paidInCash: string
  capitalRepaymentTotal: string
  capitalRepaymentTotalTooltip: string
  dividendTotal: string
  dividendTotalTooltip: string
  shareCountMismatch: string
  removeLabel: string
  capitalReturnLabel: string
  dividendLabel: string
}

function createCashDistributionsSection(
  dataState: State<OsakkeetFormData>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const textState = createState({
    value: {
      rowCount: '',
    },
  })
  const cashDistributionTextNodes = localizedTextNodes.cashDistributions
  const rowCountNode = createTextNodesFromState(textState, { path: ['rowCount'] })
  const withholdingHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.withholding, '')
  const cashPaidHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.cashPaid, '')
  const capitalRepaymentHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.capitalRepayment, '')
  const dividendHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.dividend, '')
  const tbodyNode = tbody()
  const rowsState = createState<CashDistributionRowViewModel[]>({ value: [] })
  const cashDistributions = createStateCollectionEditor(dataState, ['cashDistributions'])

  mapStateToDomChildren(rowsState, tbodyNode, {
    render: (row) => {
      const rowState = createState({
        value: {
          row,
        },
      })
      const rowTextNodes = createTextNodesFromState(rowState, { path: ['row'] })
      const dateInput = finnishDateInput(row.date, (value) => {
        cashDistributions.patch(row.id, { date: value })
      })
      const typeInput = enumSelectInput(
        row.type,
        [
          { label: row.capitalReturnLabel, value: 'capital_return' },
          { label: row.dividendLabel, value: 'dividend' },
        ],
        (value) => {
          cashDistributions.patch(row.id, { type: value })
        }
      )
      const shareCountInput = numberInput(row.shareCount, (value) => {
        cashDistributions.patch(row.id, { shareCount: value })
      })
      const amountPerShareInput = numberInput(row.amountPerShare, (value) => {
        cashDistributions.patch(row.id, { amountPerShare: value })
      })
      const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
        cashDistributions.remove(row.id)
      })
      const shareCountCell = td(
        div(pageStyles.denseStack, shareCountInput, span(pageStyles.rowErrorText, rowTextNodes.shareCountMismatch))
      )
      const capitalRepaymentTotalCell = td(
        row.capitalRepaymentTotalTooltip
          ? hoverValue(row.capitalRepaymentTotal, row.capitalRepaymentTotalTooltip)
          : row.capitalRepaymentTotal
      )
      const dividendTotalCell = td(
        row.dividendTotalTooltip ? hoverValue(row.dividendTotal, row.dividendTotalTooltip) : row.dividendTotal
      )
      const rowNode = tr(
        td(dateInput),
        td(typeInput),
        shareCountCell,
        td(amountPerShareInput),
        td(rowTextNodes.grossTotal),
        td(rowTextNodes.paidInCash),
        td(rowTextNodes.withholdingToTaxOffice),
        capitalRepaymentTotalCell,
        dividendTotalCell,
        td({ class: 'no-print' }, removeButton)
      ) as HTMLTableRowElement

      return {
        node: rowNode,
        set(nextRow) {
          setInputValue(dateInput, nextRow.date)
          setSelectValue(typeInput, nextRow.type)
          typeInput.options[0]!.textContent = nextRow.capitalReturnLabel
          typeInput.options[1]!.textContent = nextRow.dividendLabel
          setInputValue(shareCountInput, nextRow.shareCount)
          setInputValue(amountPerShareInput, nextRow.amountPerShare)
          rowState.set({ row: nextRow })
          replaceChildren(
            capitalRepaymentTotalCell,
            nextRow.capitalRepaymentTotalTooltip
              ? hoverValue(nextRow.capitalRepaymentTotal, nextRow.capitalRepaymentTotalTooltip)
              : nextRow.capitalRepaymentTotal
          )
          replaceChildren(
            dividendTotalCell,
            nextRow.dividendTotalTooltip
              ? hoverValue(nextRow.dividendTotal, nextRow.dividendTotalTooltip)
              : nextRow.dividendTotal
          )
          rowTextNodes.shareCountMismatch.parentElement!.style.display = nextRow.shareCountMismatch ? '' : 'none'
          rowNode.className = nextRow.shareCountMismatch ? String(pageStyles.mismatchRow) : ''
        },
      }
    },
  })

  const addButton = createActionButton(cashDistributionTextNodes.actions.add, 'primary', () => {
    cashDistributions.append({
      type: 'capital_return',
      date: '',
      amountPerShare: '',
      shareCount: '',
    })
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(cashDistributionTextNodes.title), span({ class: 'muted' }, rowCountNode)),
    p({ class: 'muted' }, cashDistributionTextNodes.help),
    table(
      thead(
        tr(
          th(commonTextNodes.date),
          th(commonTextNodes.type),
          th(cashDistributionTextNodes.fields.shareCount),
          th(cashDistributionTextNodes.fields.amountPerShare),
          th(commonTextNodes.total),
          th(cashPaidHeaderNode),
          th(withholdingHeaderNode),
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
    set({ osakkeetCalculation, texts }: OsakkeetPageReadModel) {
      const current = osakkeetCalculation.formData
      const summariesById = Object.fromEntries(
        osakkeetCalculation.cashDistributions.map((cashDistribution) => [cashDistribution.id, cashDistribution])
      )
      textState.set({
        rowCount: `${current.cashDistributions.length} ${texts.common.rows}`,
      })
      withholdingHeaderNode.title = texts.cashDistributions.fields.withholdingHelp
      cashPaidHeaderNode.title = texts.cashDistributions.fields.cashPaidHelp
      capitalRepaymentHeaderNode.title = texts.cashDistributions.fields.capitalRepaymentHelp
      dividendHeaderNode.title = texts.cashDistributions.fields.dividendHelp
      rowsState.set(
        current.cashDistributions.map((cashDistribution) => {
          const summary = summariesById[cashDistribution.id]
          const capitalRepaymentShares = summary
            ? summary.allocations.reduce(
                (total, allocation) => (allocation.capitalRepayment.gt(0) ? total.add(allocation.shares) : total),
                new Decimal(0)
              )
            : new Decimal(0)
          const dividendShares = summary
            ? summary.allocations.reduce(
                (total, allocation) => (allocation.dividend.gt(0) ? total.add(allocation.shares) : total),
                new Decimal(0)
              )
            : new Decimal(0)
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
            capitalRepaymentTotalTooltip: summary
              ? texts.cashDistributions.fields.capitalRepaymentSharesHelp(amount(capitalRepaymentShares))
              : '',
            dividendTotal: summary ? euro(summary.dividendTotal) : '-',
            dividendTotalTooltip: summary
              ? texts.cashDistributions.fields.dividendSharesHelp(amount(dividendShares))
              : '',
            shareCountMismatch: hasShareCountMismatch
              ? texts.cashDistributions.messages.shareCountMismatch(expectedShareCount, givenShareCount)
              : '',
            removeLabel: texts.common.remove,
            capitalReturnLabel: texts.cashDistributions.types.capitalReturn,
            dividendLabel: texts.cashDistributions.types.dividend,
          }
        })
      )
    },
  }
}

function createIpoSection(dataState: State<OsakkeetFormData>, localizedTextNodes: LocalizedTextNodes) {
  const viewState = createState({
    value: {
      values: {
        currentTotalValue: '',
        subscribedShares: '',
        ipoSharePrice: '',
        increasePercent: '',
        increaseMultiplier: '',
        ipoCostPerSecondaryShare: '',
        secondarySharesTotal: '',
      },
    },
  })
  const ipoTextNodes = localizedTextNodes.ipo
  const summaryCardTextNodes = localizedTextNodes.summary.cards
  const valueNodes = createTextNodesFromState(viewState, { path: ['values'] })

  const currentShareValueInput = numberInput('')
  const totalShareCountInput = numberInput('')
  const estimatedPreIpoValueInput = numberInput('')
  const totalIpoCostInput = numberInput('')
  const secondarySellPercentInput = numberInput('')
  const ipoDateInput = finnishDateInput('')

  mapStatePathToInput(dataState, ['ipo', 'currentShareValue'], currentShareValueInput)
  mapStatePathToInput(dataState, ['ipo', 'totalShareCount'], totalShareCountInput)
  mapStatePathToInput(dataState, ['ipo', 'estimatedPreIpoValue'], estimatedPreIpoValueInput)
  mapStatePathToInput(dataState, ['ipo', 'totalIpoCost'], totalIpoCostInput)
  mapStatePathToInput(dataState, ['ipo', 'estimatedSecondaryShareSellPercentage'], secondarySellPercentInput)
  mapStatePathToInput(dataState, ['ipo', 'ipoDate'], ipoDateInput)

  const root = section(
    { class: 'card' },
    h2(ipoTextNodes.title),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(ipoTextNodes.fields.currentShareValue), currentShareValueInput),
      div(pageStyles.field, label(ipoTextNodes.fields.totalShareCount), totalShareCountInput),
      div(pageStyles.field, label(ipoTextNodes.fields.currentTotalValue), b(valueNodes.currentTotalValue)),
      div(pageStyles.field, label(summaryCardTextNodes.subscribedShares), b(valueNodes.subscribedShares))
    ),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(ipoTextNodes.fields.estimatedPreIpoValue), estimatedPreIpoValueInput),
      div(pageStyles.field, label(ipoTextNodes.fields.ipoSharePrice), b(valueNodes.ipoSharePrice)),
      div(pageStyles.field, label(ipoTextNodes.fields.increasePercent), b(valueNodes.increasePercent)),
      div(pageStyles.field, label(ipoTextNodes.fields.increaseMultiplier), b(valueNodes.increaseMultiplier))
    ),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(ipoTextNodes.fields.totalIpoCost), totalIpoCostInput),
      div(
        pageStyles.field,
        label(ipoTextNodes.fields.secondarySellPercent),
        secondarySellPercentInput,
        span({ class: 'muted' }, ipoTextNodes.help.secondary)
      ),
      div(
        pageStyles.field,
        label(summaryCardTextNodes.ipoCostPerSecondaryShare),
        b(valueNodes.ipoCostPerSecondaryShare)
      ),
      div(pageStyles.field, label(summaryCardTextNodes.secondarySharesTotal), b(valueNodes.secondarySharesTotal))
    ),
    div(
      pageStyles.gridTwo,
      div(
        pageStyles.field,
        label(ipoTextNodes.fields.ipoDate),
        ipoDateInput,
        span({ class: 'muted' }, ipoTextNodes.help.dateFormat)
      ),
      div(),
      div()
    )
  )

  return {
    root,
    set({ texts, osakkeetCalculation }: OsakkeetPageReadModel) {
      void texts
      viewState.set({
        values: {
          currentTotalValue: euro(osakkeetCalculation.ipo.currentTotalValue),
          subscribedShares: amount(osakkeetCalculation.ipo.totalSubscribedShares),
          ipoSharePrice: euro(osakkeetCalculation.ipo.ipoPricePerShare),
          increasePercent: percentage(osakkeetCalculation.ipo.increasePercentage),
          increaseMultiplier: multiplier(osakkeetCalculation.ipo.increaseMultiplier),
          ipoCostPerSecondaryShare: euro(osakkeetCalculation.ipo.ipoCostPerShare),
          secondarySharesTotal: amount(osakkeetCalculation.ipo.estimatedSecondaryShareCount),
        },
      })
    },
  }
}

function createResultsSection(dataState: State<OsakkeetFormData>, localizedTextNodes: LocalizedTextNodes) {
  const warningRoot = div()
  const ipoSellContentRoot = div(pageStyles.denseStack)
  const summaryTextNodes = localizedTextNodes.summary
  const annualAdjustmentTaxEffectRoot = div()
  const annualAdjustmentReserveRoot = div()
  const annualAdjustmentKeepRoot = div()
  const sellInput = numberInput('')
  const otherAnnualCapitalInput = numberInput('')
  mapStatePathToInput(dataState, ['sell', 'amount'], sellInput)
  mapStatePathToInput(dataState, ['sell', 'otherAnnualCapitalGainsOrLosses'], otherAnnualCapitalInput)
  const annualAdjustmentInputCard = div(
    pageStyles.summaryItem,
    h3(summaryTextNodes.ipoSell.cashReserve.otherAnnualCapitalGainsOrLosses),
    div(
      pageStyles.field,
      otherAnnualCapitalInput,
      span({ class: 'muted' }, summaryTextNodes.ipoSell.cashReserve.otherAnnualCapitalGainsOrLossesHelp)
    )
  )
  const annualAdjustmentRoot = div(
    pageStyles.denseStack,
    h3(summaryTextNodes.ipoSell.cashReserve.annualAdjustmentTitle),
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
      h2(summaryTextNodes.ipoSell.title),
      div(
        pageStyles.gridTwo,
        div(
          pageStyles.compactField,
          div(pageStyles.field, label(summaryTextNodes.ipoSell.fields.sharesToSell), sellInput)
        )
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

      void texts

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

function createIntroSection(languageSelectionState: State<Language>, localizedTextNodes: LocalizedTextNodes) {
  const introTextNodes = localizedTextNodes.intro
  const languageSwitchTextNodes = localizedTextNodes.languageSwitch
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
      h2(introTextNodes.title),
      div(
        { class: 'no-print' },
        pageStyles.rowButtons,
        span({ class: 'muted' }, languageSwitchTextNodes.label),
        fiButton,
        enButton
      )
    ),
    p({ class: 'muted' }, introTextNodes.description),
    p({ class: 'muted' }, introTextNodes.unlistedDescription),
    div(
      pageStyles.denseStack,
      h3(introTextNodes.securityTitle),
      p(pageStyles.compactParagraph, { class: 'muted' }, introTextNodes.securityText),
      p(pageStyles.compactParagraph, { class: 'muted' }, introTextNodes.securityAdditionalText),
      p(pageStyles.redNote, pageStyles.compactParagraph, introTextNodes.securityNote),
      p(pageStyles.compactParagraph, { class: 'muted' }, introTextNodes.securityIssues)
    ),
    assumptionsRoot
  )
  return {
    root,
    set({ languageSelection, texts }: OsakkeetPageReadModel) {
      void texts
      setButtonVariant(fiButton, languageSelection === 'fi')
      setButtonVariant(enButton, languageSelection === 'en')
      replaceChildren(assumptionsRoot, assumptionsContent(texts))
    },
  }
}

function createStickyWarningsSection(localizedTextNodes: LocalizedTextNodes) {
  const introTextNodes = localizedTextNodes.intro
  const warningListRoot = ul()
  const root = div(pageStyles.stickyWarningBox, h3(introTextNodes.warningsTitle), warningListRoot)

  return {
    root,
    set({ texts }: Pick<OsakkeetPageReadModel, 'texts'>) {
      void texts
      replaceChildren(
        warningListRoot,
        texts.intro.warnings.map((warning) => li(warning))
      )
    },
  }
}

function createToolbarSection(dataState: State<OsakkeetFormData>, localizedTextNodes: LocalizedTextNodes) {
  const viewState = createState({
    value: {
      status: '',
    },
  })
  const storageTextNodes = localizedTextNodes.storage
  const statusNode = createTextNodesFromState(viewState, { path: ['status'] })
  let currentTexts = getOsakkeetLocalization(tryLoadLanguage())
  const setStatus = (status: string) => {
    viewState.set((current) => ({ ...current, status }))
  }
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
            setStatus(currentTexts.storage.status.loaded)
            refreshStorageButtons()
          } catch {
            setStatus(currentTexts.storage.errors.invalidFile)
          }
          inputNode.value = ''
        }
        reader.onerror = () => {
          setStatus(currentTexts.storage.errors.fileReadFailed)
          inputNode.value = ''
        }
        reader.readAsText(file)
      },
    })
  )
  const buttonConfigs = [
    {
      labelNode: storageTextNodes.actions.saveFile,
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
        setStatus(currentTexts.storage.status.fileSaved)
        refreshStorageButtons()
      },
    },
    {
      labelNode: storageTextNodes.actions.saveToBrowserStorage,
      variant: 'secondary' as const,
      action: () => {
        tryStorageSet(localStorage, storageKeys.browserFormData, serializeOsakkeetFormData(dataState.get()))
        setStatus(currentTexts.storage.status.browserSaved)
        refreshStorageButtons()
      },
    },
    {
      labelNode: storageTextNodes.actions.loadFromBrowserStorage,
      variant: 'secondary' as const,
      action: () => {
        const saved = tryStorageGet(localStorage, storageKeys.browserFormData)
        if (!saved) return
        try {
          const parsed = JSON.parse(saved) as Partial<OsakkeetFormData>
          dataState.set(normalizeLoadedData(parsed))
          setStatus(currentTexts.storage.status.browserLoaded)
          refreshStorageButtons()
        } catch {
          setStatus(currentTexts.storage.errors.invalidFile)
        }
      },
    },
    {
      labelNode: storageTextNodes.actions.removeFromBrowserStorage,
      variant: 'secondary' as const,
      action: () => {
        tryStorageRemove(localStorage, storageKeys.browserFormData)
        setStatus(currentTexts.storage.status.browserRemoved)
        refreshStorageButtons()
      },
    },
    {
      labelNode: storageTextNodes.actions.loadFile,
      variant: 'secondary' as const,
      action: () => {
        fileInput.click()
      },
    },
    {
      labelNode: storageTextNodes.actions.showSmallExample,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createExampleOsakkeetFormData('small2y'))
        setStatus(currentTexts.storage.status.exampleShown)
      },
    },
    {
      labelNode: storageTextNodes.actions.showMediumExample,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createExampleOsakkeetFormData('medium8y'))
        setStatus(currentTexts.storage.status.exampleShown)
      },
    },
    {
      labelNode: storageTextNodes.actions.showLargeExample,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createExampleOsakkeetFormData('large16y'))
        setStatus(currentTexts.storage.status.exampleShown)
      },
    },
    {
      labelNode: storageTextNodes.actions.clearExample,
      variant: 'secondary' as const,
      action: () => {
        if (!window.confirm(currentTexts.storage.confirmations.clearExample)) {
          return
        }
        dataState.set(createOsakkeetFormData(false))
        setStatus(currentTexts.storage.status.exampleCleared)
      },
    },
    {
      labelNode: storageTextNodes.actions.copyShareUrl,
      variant: 'secondary' as const,
      action: () => {
        void copyTextToClipboard(buildShareUrl(dataState.get())).then(
          (copied) => {
            setStatus(copied ? currentTexts.storage.status.shareUrlCopied : currentTexts.storage.errors.clipboardFailed)
          },
          () => {
            setStatus(currentTexts.storage.errors.clipboardFailed)
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
    smallExampleButton,
    mediumExampleButton,
    largeExampleButton,
    clearExampleButton,
    copyShareUrlButton,
  ] = buttonConfigs.map(({ labelNode, variant, action }) => createActionButton(labelNode, variant, action))
  dataState.onValueChange(() => {
    refreshStorageButtons()
  })
  refreshStorageButtons()
  const root = div(
    { class: 'card no-print' },
    div({ class: 'heading' }, h2(storageTextNodes.title), span({ class: 'muted' }, statusNode)),
    fileInput,
    table(
      pageStyles.storageTable,
      thead(
        tr(
          th(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.rowTitle),
          th(pageStyles.storageCellTop, pageStyles.storageActionsCell, storageTextNodes.table.actionsTitle),
          th(pageStyles.storageCellTop, pageStyles.storageDescriptionCell, storageTextNodes.table.descriptionTitle)
        )
      ),
      tbody(
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.autoSaveTitle),
          td(pageStyles.storageCellTop, pageStyles.storageActionsCell),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, storageTextNodes.table.autoSaveDescription)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.fileTitle),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageActionsCell,
            div(pageStyles.topAlignedRowButtons, saveFileButton, loadFileButton)
          ),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, storageTextNodes.table.fileDescription)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.browserTitle),
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
            span({ class: 'muted' }, storageTextNodes.table.browserDescription)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.clearTitle),
          td(pageStyles.storageCellTop, pageStyles.storageActionsCell, clearExampleButton),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, storageTextNodes.table.clearDescription)
          )
        ),
        tr(
          td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.exampleTitle),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageActionsCell,
            div(pageStyles.topAlignedRowButtons, smallExampleButton, mediumExampleButton, largeExampleButton)
          ),
          td(
            pageStyles.storageCellTop,
            pageStyles.storageDescriptionCell,
            span({ class: 'muted' }, storageTextNodes.table.exampleDescription)
          )
        )
      )
    ),
    div(
      pageStyles.rightAlignedActions,
      div(
        pageStyles.actionGroup,
        copyShareUrlButton,
        span({ class: 'muted' }, storageTextNodes.copyShareUrlHelp),
        span(pageStyles.redNote, storageTextNodes.copyShareUrlNote)
      )
    )
  )

  return {
    root,
    set({ texts }: OsakkeetPageReadModel) {
      currentTexts = texts
      refreshStorageButtons()
    },
  }
}

function createTaxSummarySection(dataState: State<OsakkeetFormData>, localizedTextNodes: LocalizedTextNodes) {
  const taxReturnsTextNodes = localizedTextNodes.taxReturns
  const mathematicalShareValuesEditor = createMathematicalShareValuesEditor(dataState, localizedTextNodes)
  const resultsRoot = div(pageStyles.denseStack)
  const root = section(
    { class: 'card' },
    h2(taxReturnsTextNodes.title),
    mathematicalShareValuesEditor.root,
    resultsRoot
  )

  return {
    root,
    set({ texts, osakkeetCalculation }: OsakkeetPageReadModel) {
      void texts
      mathematicalShareValuesEditor.set({ texts, osakkeetCalculation })
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
  const localizationTexts = languageSelectionState.map((languageSelection) =>
    getOsakkeetLocalization(languageSelection)
  )
  const localizedTextNodes = createTextNodesFromState(localizationTexts)
  const pageReadState = mergeStates(
    { formData: dataState, languageSelection: languageSelectionState, texts: localizationTexts },
    ({ formData, languageSelection, texts }) => {
      return {
        formData,
        languageSelection,
        osakkeetCalculation: calculateOsakkeet(formData, texts),
        texts,
      }
    }
  )

  const stickyWarningsSection = createStickyWarningsSection(localizedTextNodes)
  const introSection = createIntroSection(languageSelectionState, localizedTextNodes)
  const toolbarSection = createToolbarSection(dataState, localizedTextNodes)
  const subscriptionsSection = createSubscriptionsSection(
    dataState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const cashDistributionsSection = createCashDistributionsSection(
    dataState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const demergersSection = createDemergersSection(
    dataState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const shareSplitsSection = createShareSplitsSection(
    dataState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const taxSummarySectionController = createTaxSummarySection(dataState, localizedTextNodes)
  const ipoSection = createIpoSection(dataState, localizedTextNodes)
  const resultsSection = createResultsSection(dataState, localizedTextNodes)
  const root = div(pageStyles.stack)
  const applyPageReadModel = (pageReadModel: OsakkeetPageReadModel) => {
    stickyWarningsSection.set(pageReadModel)
    introSection.set(pageReadModel)
    toolbarSection.set(pageReadModel)
    subscriptionsSection.set(pageReadModel)
    cashDistributionsSection.set(pageReadModel)
    demergersSection.set(pageReadModel)
    shareSplitsSection.set(pageReadModel)
    taxSummarySectionController.set(pageReadModel)
    ipoSection.set(pageReadModel)
    resultsSection.set(pageReadModel)
  }

  persistState(languageSelectionState, {
    storage: localStorage,
    key: storageKeys.language,
    serialize: (languageSelection) => languageSelection,
    deserialize: (raw) => (raw === 'en' ? 'en' : 'fi'),
    hydrate: false,
  })
  persistState(dataState, {
    storage: sessionStorage,
    key: storageKeys.windowFormData,
    serialize: serializeOsakkeetFormData,
    deserialize: (raw) => normalizeLoadedData(JSON.parse(raw) as Partial<OsakkeetFormData>),
    hydrate: false,
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
    demergersSection.root,
    shareSplitsSection.root,
    taxSummarySectionController.root,
    ipoSection.root,
    resultsSection.root
  )
  return root
}
