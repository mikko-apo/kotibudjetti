import { createState, mergeStates, type State } from '../../../ki-frame/src'
import Decimal from 'decimal.js'
import {
  a,
  b,
  button,
  div,
  h2,
  h3,
  h4,
  input,
  inputs,
  label,
  li,
  p,
  replaceChildren,
  section,
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
import { calculateOsakkeet, type OsakkeetCalculation } from './osakkeetCalculator'
import type { OsakkeetFormData } from './osakkeetTypes'
import {
  createComputedTextState,
  createEditableCollectionTable,
  createFormBinder,
  createOptionBoundSelect,
  createRowViewModelBinder,
  createSectionController,
  createSectionCounter,
  createStorageSource,
  createStorageBackedState,
  createStateCollectionEditor,
  createTextNodesFromState,
  replaceChildrenFromState,
  type StateCollectionEditor,
  type TextNodesFromValue,
} from './ki-frame-extensions'
import { DEFAULT_EXAMPLE_PRESET, createExampleOsakkeetFormData } from './osakkeetExamples'
import { amount, euro, multiplier, percentage } from './osakkeetFormat'
import { getOsakkeetLocalization, type Language, type OsakkeetLocalization } from './osakkeetLocalizations'
import { sumDecimals } from './osakkeetUtils'
import {
  createSharePercent,
  createSubscriptionHistoryTooltip,
  createSubscriptionHistoryRows,
  createSubscriptionsSummaryCards,
  createSummaryById,
  type SubscriptionHistoryRow,
} from './osakkeetUiSummary'

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
    border: '1px solid rgba(153, 27, 27, 0.45)',
    backgroundColor: 'rgba(254, 226, 226, 0.92)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 10px 28px rgba(127, 29, 29, 0.12)',
    backdropFilter: 'blur(6px)',
  }),
  stickyWarningHeader: styles({
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  }),
  stickyWarningActions: styles({
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
  }),
  stickyWarningTitle: styles({
    margin: '0',
    fontSize: '14px',
  }),
  stickyWarningList: styles({
    margin: '0',
    paddingLeft: '18px',
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
  historyCell: styles({
    padding: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
  }),
  historyTable: styles({
    width: '100%',
    borderCollapse: 'collapse',
  }),
  historyTableCell: styles({
    verticalAlign: 'top',
    padding: '8px 10px',
    borderTop: '1px solid rgba(15, 23, 42, 0.08)',
  }),
  historyDetailsCell: styles({
    whiteSpace: 'normal',
  }),
  listCompact: styles({ margin: '0', paddingLeft: '20px' }),
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const storageKeys = {
  language: 'osakkeet-language',
  windowFormData: 'osakkeet-ipo-laskuri-window',
  lastFileSavedHash: 'osakkeet-ipo-laskuri-last-file-hash',
} as const
const shareUrlQueryKey = 'osakkeet'

function tryLoadLanguage() {
  return localStorage.getItem(storageKeys.language) === 'en' ? 'en' : 'fi'
}

type FormCollectionKey =
  | 'subscriptions'
  | 'sells'
  | 'cashDistributions'
  | 'shareSplits'
  | 'demergers'
  | 'mathematicalShareValues'

type FormCollectionRow<K extends FormCollectionKey> = OsakkeetFormData[K][number]

const formCollectionDefinitions = {
  subscriptions: {
    prefix: 'sub',
    create: () =>
      ({
        date: '',
        vestingEndsOn: '',
        amount: '',
        pricePerShare: '',
        otherTotalAcquisitionCosts: '',
      }) satisfies Omit<OsakkeetFormData['subscriptions'][number], 'id'>,
    normalize: (row: Partial<OsakkeetFormData['subscriptions'][number]>) =>
      ({
        id: row.id || createId('sub'),
        date: row.date || '',
        vestingEndsOn: row.vestingEndsOn || '',
        amount: row.amount || '',
        pricePerShare: row.pricePerShare || '',
        otherTotalAcquisitionCosts: row.otherTotalAcquisitionCosts || '',
      }) satisfies OsakkeetFormData['subscriptions'][number],
  },
  cashDistributions: {
    prefix: 'distribution',
    create: () =>
      ({
        type: 'capital_return',
        date: '',
        amountPerShare: '',
        shareCount: '',
      }) satisfies Omit<OsakkeetFormData['cashDistributions'][number], 'id'>,
    normalize: (row: Partial<OsakkeetFormData['cashDistributions'][number]>) =>
      ({
        id: row.id || createId('distribution'),
        date: row.date || '',
        type: row.type || 'capital_return',
        amountPerShare: row.amountPerShare || '',
        shareCount: row.shareCount || '',
      }) satisfies OsakkeetFormData['cashDistributions'][number],
  },
  sells: {
    prefix: 'sell',
    create: () =>
      ({
        date: '',
        shareCount: '',
        sellPrice: '',
        pricePerShare: '',
      }) satisfies Omit<OsakkeetFormData['sells'][number], 'id'>,
    normalize: (row: Partial<OsakkeetFormData['sells'][number]>) => {
      return {
        id: row.id || createId('sell'),
        date: row.date || '',
        shareCount: row.shareCount || '',
        sellPrice: row.sellPrice || '',
        pricePerShare: row.pricePerShare || '',
      } satisfies OsakkeetFormData['sells'][number]
    },
  },
  shareSplits: {
    prefix: 'split',
    create: () =>
      ({
        date: '',
        multiplier: '',
      }) satisfies Omit<OsakkeetFormData['shareSplits'][number], 'id'>,
    normalize: (row: Partial<OsakkeetFormData['shareSplits'][number]>) =>
      ({
        id: row.id || createId('split'),
        date: row.date || '',
        multiplier: row.multiplier || '',
      }) satisfies OsakkeetFormData['shareSplits'][number],
  },
  demergers: {
    prefix: 'demerger',
    create: () =>
      ({
        date: '',
        oldCompanyRatio: '',
      }) satisfies Omit<OsakkeetFormData['demergers'][number], 'id'>,
    normalize: (row: Partial<OsakkeetFormData['demergers'][number]>) =>
      ({
        id: row.id || createId('demerger'),
        date: row.date || '',
        oldCompanyRatio: row.oldCompanyRatio || '',
      }) satisfies OsakkeetFormData['demergers'][number],
  },
  mathematicalShareValues: {
    prefix: 'math',
    create: () =>
      ({
        year: '',
        valuePerShare: '',
      }) satisfies Omit<OsakkeetFormData['mathematicalShareValues'][number], 'id'>,
    normalize: (row: Partial<OsakkeetFormData['mathematicalShareValues'][number]>) =>
      ({
        id: row.id || createId('math'),
        year: row.year || '',
        valuePerShare: row.valuePerShare || '',
      }) satisfies OsakkeetFormData['mathematicalShareValues'][number],
  },
} satisfies {
  [K in FormCollectionKey]: {
    prefix: string
    create: () => Omit<FormCollectionRow<K>, 'id'>
    normalize: (row: Partial<FormCollectionRow<K>>) => FormCollectionRow<K>
  }
}

function createEmptyCollectionRow(key: 'subscriptions'): OsakkeetFormData['subscriptions'][number]
function createEmptyCollectionRow(key: 'sells'): OsakkeetFormData['sells'][number]
function createEmptyCollectionRow(key: 'cashDistributions'): OsakkeetFormData['cashDistributions'][number]
function createEmptyCollectionRow(key: 'shareSplits'): OsakkeetFormData['shareSplits'][number]
function createEmptyCollectionRow(key: 'demergers'): OsakkeetFormData['demergers'][number]
function createEmptyCollectionRow(key: 'mathematicalShareValues'): OsakkeetFormData['mathematicalShareValues'][number]
function createEmptyCollectionRow(
  key: FormCollectionKey
):
  | OsakkeetFormData['subscriptions'][number]
  | OsakkeetFormData['sells'][number]
  | OsakkeetFormData['cashDistributions'][number]
  | OsakkeetFormData['shareSplits'][number]
  | OsakkeetFormData['demergers'][number]
  | OsakkeetFormData['mathematicalShareValues'][number] {
  switch (key) {
    case 'subscriptions':
      return formCollectionDefinitions.subscriptions.normalize({
        id: createId(formCollectionDefinitions.subscriptions.prefix),
        ...formCollectionDefinitions.subscriptions.create(),
      })
    case 'cashDistributions':
      return formCollectionDefinitions.cashDistributions.normalize({
        id: createId(formCollectionDefinitions.cashDistributions.prefix),
        ...formCollectionDefinitions.cashDistributions.create(),
      })
    case 'sells':
      return formCollectionDefinitions.sells.normalize({
        id: createId(formCollectionDefinitions.sells.prefix),
        ...formCollectionDefinitions.sells.create(),
      })
    case 'shareSplits':
      return formCollectionDefinitions.shareSplits.normalize({
        id: createId(formCollectionDefinitions.shareSplits.prefix),
        ...formCollectionDefinitions.shareSplits.create(),
      })
    case 'demergers':
      return formCollectionDefinitions.demergers.normalize({
        id: createId(formCollectionDefinitions.demergers.prefix),
        ...formCollectionDefinitions.demergers.create(),
      })
    case 'mathematicalShareValues':
      return formCollectionDefinitions.mathematicalShareValues.normalize({
        id: createId(formCollectionDefinitions.mathematicalShareValues.prefix),
        ...formCollectionDefinitions.mathematicalShareValues.create(),
      })
  }
}

function createAppendCollectionRow(key: 'subscriptions'): Omit<OsakkeetFormData['subscriptions'][number], 'id'>
function createAppendCollectionRow(key: 'sells'): Omit<OsakkeetFormData['sells'][number], 'id'>
function createAppendCollectionRow(key: 'cashDistributions'): Omit<OsakkeetFormData['cashDistributions'][number], 'id'>
function createAppendCollectionRow(key: 'shareSplits'): Omit<OsakkeetFormData['shareSplits'][number], 'id'>
function createAppendCollectionRow(key: 'demergers'): Omit<OsakkeetFormData['demergers'][number], 'id'>
function createAppendCollectionRow(
  key: 'mathematicalShareValues'
): Omit<OsakkeetFormData['mathematicalShareValues'][number], 'id'>
function createAppendCollectionRow(
  key: FormCollectionKey
):
  | Omit<OsakkeetFormData['subscriptions'][number], 'id'>
  | Omit<OsakkeetFormData['sells'][number], 'id'>
  | Omit<OsakkeetFormData['cashDistributions'][number], 'id'>
  | Omit<OsakkeetFormData['shareSplits'][number], 'id'>
  | Omit<OsakkeetFormData['demergers'][number], 'id'>
  | Omit<OsakkeetFormData['mathematicalShareValues'][number], 'id'> {
  switch (key) {
    case 'subscriptions':
      return formCollectionDefinitions.subscriptions.create()
    case 'cashDistributions':
      return formCollectionDefinitions.cashDistributions.create()
    case 'sells':
      return formCollectionDefinitions.sells.create()
    case 'shareSplits':
      return formCollectionDefinitions.shareSplits.create()
    case 'demergers':
      return formCollectionDefinitions.demergers.create()
    case 'mathematicalShareValues':
      return formCollectionDefinitions.mathematicalShareValues.create()
  }
}

function normalizeCollectionRows<K extends FormCollectionKey>(
  key: K,
  rows: Array<Partial<FormCollectionRow<K>>> | undefined
): FormCollectionRow<K>[] {
  return (rows || []).map((row) => formCollectionDefinitions[key].normalize(row))
}

function createBlankOsakkeetFormData(): OsakkeetFormData {
  return {
    subscriptions: [],
    sells: [],
    cashDistributions: [],
    shareSplits: [],
    demergers: [],
    mathematicalShareValues: [],
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

function normalizeOsakkeetFormData(data: Partial<OsakkeetFormData>): OsakkeetFormData {
  const blank = createBlankOsakkeetFormData()
  const ipo = data.ipo ?? blank.ipo
  return {
    subscriptions: normalizeCollectionRows('subscriptions', data.subscriptions),
    sells: normalizeCollectionRows('sells', data.sells),
    cashDistributions: normalizeCollectionRows('cashDistributions', data.cashDistributions),
    shareSplits: normalizeCollectionRows('shareSplits', data.shareSplits),
    demergers: normalizeCollectionRows('demergers', data.demergers),
    mathematicalShareValues: normalizeCollectionRows('mathematicalShareValues', data.mathematicalShareValues),
    ipo: {
      ...blank.ipo,
      ipoDate: ipo.ipoDate || '',
      totalShareCount: ipo.totalShareCount || '',
      totalIpoCost: ipo.totalIpoCost || '',
      currentShareValue: ipo.currentShareValue || '',
      estimatedPreIpoValue: ipo.estimatedPreIpoValue || '',
      estimatedSecondaryShareSellPercentage: ipo.estimatedSecondaryShareSellPercentage || '',
    },
    sell: {
      ...blank.sell,
      ...data.sell,
      amount: data.sell?.amount || '',
      otherAnnualCapitalGainsOrLosses: data.sell?.otherAnnualCapitalGainsOrLosses || '',
    },
  }
}

function createOsakkeetFormData(demo: boolean): OsakkeetFormData {
  if (demo) {
    return createExampleOsakkeetFormData(DEFAULT_EXAMPLE_PRESET, createId)
  }
  return {
    ...createBlankOsakkeetFormData(),
    subscriptions: [createEmptyCollectionRow('subscriptions')],
    sells: [],
    cashDistributions: [createEmptyCollectionRow('cashDistributions')],
  }
}

function createShareableOsakkeetUrlData(data: OsakkeetFormData): ShareableOsakkeetUrlData {
  const sanitized = normalizeOsakkeetFormData(data)
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

type ShareableOsakkeetUrlData = Pick<
  OsakkeetFormData,
  'cashDistributions' | 'shareSplits' | 'demergers' | 'mathematicalShareValues' | 'ipo'
>

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

function tryLoadWindowSavedData(): OsakkeetFormData | undefined {
  return createStorageSource<OsakkeetFormData>({
    storage: sessionStorage,
    key: storageKeys.windowFormData,
    serialize: serializeOsakkeetFormData,
    deserialize: (raw) => normalizeOsakkeetFormData(JSON.parse(raw) as Partial<OsakkeetFormData>),
  }).load()
}

function tryLoadSharedUrlData(): OsakkeetFormData | undefined {
  const encoded = new URL(window.location.href).searchParams.get(shareUrlQueryKey)
  if (!encoded) return undefined
  try {
    const parsed = decodeUrlState(encoded)
    const emptyForm = createBlankOsakkeetFormData()
    return normalizeOsakkeetFormData({
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
      sells: emptyForm.sells,
      sell: emptyForm.sell,
    })
  } catch {
    return undefined
  }
}

function tryLoadInitialData() {
  return tryLoadSharedUrlData() || tryLoadWindowSavedData() || createOsakkeetFormData(true)
}

function serializeOsakkeetFormData(data: OsakkeetFormData) {
  return JSON.stringify(normalizeOsakkeetFormData(data))
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

function createRemoveButton(labelNode: Text, remove: () => void) {
  return button(
    labelNode,
    pageStyles.smallButton,
    events({
      click() {
        remove()
      },
    })
  )
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
  )
}

type LocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization>
type CommonLocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization['common']>
type SourceKey = keyof OsakkeetLocalization['sources']

const sourceLinkDefinitions: Array<{ key: SourceKey; href: string }> = [
  {
    key: 'dividends',
    href: 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/osingot-listaamattomasta-yhtiosta/',
  },
  {
    key: 'listedDividends',
    href: 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/listatusta-yhti%C3%B6st%C3%A4-saadut-osingot/',
  },
  {
    key: 'reporting',
    href: 'https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/veroilmoitus_ja_verotuspaato/ilmoittamisen-ohje/',
  },
  {
    key: 'demergerAcquisitionCost',
    href: 'https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/48262/arvopaperien-luovutusten-verotus4/',
  },
  {
    key: 'demergers',
    href: 'https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/49340/yritysjarjestelyt-ja-verotus-jakautuminen4/',
  },
  {
    key: 'form9a',
    href: 'https://www.vero.fi/tietoa-verohallinnosta/yhteystiedot-ja-asiointi/lomakkeet/tayttoohjeet/9a-arvopapereiden-luovutusvoitot-ja--tappiot-t%C3%A4ytt%C3%B6ohje/',
  },
  {
    key: 'sales',
    href: 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osakkeiden_myynt/',
  },
]

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
      ...sourceLinkDefinitions.flatMap((source, index) => [
        ...(index > 0 ? [', '] : []),
        linkToSource(t.sources[source.key], source.href),
      ])
    )
  )
}

function createCollectionAppendButton<TItem extends { id: string }>(
  editor: StateCollectionEditor<TItem>,
  labelNode: Text,
  createEmptyItem: () => Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>
) {
  return createActionButton(labelNode, 'primary', () => {
    editor.append(createEmptyItem())
  })
}

function createMathematicalShareValuesEditor(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes
) {
  const mathematicalShareValuesTextNodes = localizedTextNodes.mathematicalShareValues
  const rowsState = createRowViewModelBinder(
    pageReadState,
    ({ osakkeetCalculation }) => osakkeetCalculation.formData.mathematicalShareValues,
    (row, _index, { texts }) => ({
      id: row.id,
      year: row.year,
      valuePerShare: row.valuePerShare,
      removeLabel: texts.common.remove,
    })
  )
  const mathematicalShareValues = createStateCollectionEditor(dataState, ['mathematicalShareValues'])
  const tbodyNode = createEditableCollectionTable<{
    id: string
    year: string
    valuePerShare: string
    removeLabel: string
  }>({
    rowsState,
    createRemoveButton,
    remove: mathematicalShareValues.remove,
    render: ({ row, removeButton }) => {
      const yearInput = numberInput(row.year, (value) => {
        mathematicalShareValues.patch(row.id, { year: value })
      })
      const valuePerShareInput = numberInput(row.valuePerShare, (value) => {
        mathematicalShareValues.patch(row.id, { valuePerShare: value })
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
        },
      }
    },
  })

  const addButton = createCollectionAppendButton(
    mathematicalShareValues,
    mathematicalShareValuesTextNodes.actions.add,
    () => ({
      year: '',
      valuePerShare: '',
    })
  )

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

  return createSectionController(root, () => {})
}

type ShareSplitRowViewModel = {
  id: string
  date: string
  multiplier: string
  removeLabel: string
}

function createShareSplitsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const shareSplitTextNodes = localizedTextNodes.shareSplits
  const rowsState = createRowViewModelBinder(
    pageReadState,
    ({ osakkeetCalculation }) => osakkeetCalculation.formData.shareSplits,
    (shareSplit, _index, { texts }) => ({
      id: shareSplit.id,
      date: shareSplit.date,
      multiplier: shareSplit.multiplier,
      removeLabel: texts.common.remove,
    })
  )
  const shareSplits = createStateCollectionEditor(dataState, ['shareSplits'])
  const tbodyNode = createEditableCollectionTable<ShareSplitRowViewModel>({
    rowsState,
    createRemoveButton,
    remove: shareSplits.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(row.date, (value) => {
        shareSplits.patch(row.id, { date: value })
      })
      const multiplierInput = numberInput(row.multiplier, (value) => {
        shareSplits.patch(row.id, { multiplier: value })
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
        },
      }
    },
  })

  const addButton = createCollectionAppendButton(shareSplits, shareSplitTextNodes.actions.add, () => ({
    date: '',
    multiplier: '',
  }))

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(shareSplitTextNodes.title), span({ class: 'muted' }, counter.node)),
    p({ class: 'muted' }, shareSplitTextNodes.help),
    table(
      pageStyles.compactTable,
      thead(tr(th(commonTextNodes.date), th(shareSplitTextNodes.fields.multiplier), th({ class: 'no-print' }, ''))),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )

  return createSectionController(root, ({ osakkeetCalculation, texts }: OsakkeetPageReadModel) => {
    counter.setCount(osakkeetCalculation.formData.shareSplits.length, texts.common.rows)
  })
}

type DemergerRowViewModel = {
  id: string
  date: string
  oldCompanyRatio: string
  removeLabel: string
}

function createDemergersSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const demergerTextNodes = localizedTextNodes.demergers
  const rowsState = createRowViewModelBinder(
    pageReadState,
    ({ osakkeetCalculation }) => osakkeetCalculation.formData.demergers,
    (demerger, _index, { texts }) => ({
      id: demerger.id,
      date: demerger.date,
      oldCompanyRatio: demerger.oldCompanyRatio,
      removeLabel: texts.common.remove,
    })
  )
  const demergers = createStateCollectionEditor(dataState, ['demergers'])
  const tbodyNode = createEditableCollectionTable<DemergerRowViewModel>({
    rowsState,
    createRemoveButton,
    remove: demergers.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(row.date, (value) => {
        demergers.patch(row.id, { date: value })
      })
      const oldCompanyRatioInput = numberInput(row.oldCompanyRatio, (value) => {
        demergers.patch(row.id, { oldCompanyRatio: value })
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
        },
      }
    },
  })

  const addButton = createCollectionAppendButton(demergers, demergerTextNodes.actions.add, () => ({
    date: '',
    oldCompanyRatio: '',
  }))

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(demergerTextNodes.title), span({ class: 'muted' }, counter.node)),
    p({ class: 'muted' }, demergerTextNodes.help),
    table(
      pageStyles.compactTable,
      thead(tr(th(commonTextNodes.date), th(demergerTextNodes.fields.oldCompanyRatio), th({ class: 'no-print' }, ''))),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )

  return createSectionController(root, ({ osakkeetCalculation, texts }: OsakkeetPageReadModel) => {
    counter.setCount(osakkeetCalculation.formData.demergers.length, texts.common.rows)
  })
}

function taxSummarySection(calculation: OsakkeetCalculation, t: OsakkeetLocalization) {
  const years = calculation.taxReturns.years
  if (years.length === 0) return false
  type TaxReturnDistributionSection = NonNullable<OsakkeetCalculation['taxReturns']['years'][number]['unlisted']>

  const summarizeAllocationsBySubscription = (entries: TaxReturnDistributionSection['entries']) => {
    const rows = new Map<
      string,
      {
        subscriptionId: string
        subscriptionDate: string
        distributionCount: number
        grossTotal: Decimal
        capitalRepaymentTotal: Decimal
        dividendTotal: Decimal
      }
    >()

    entries.forEach((entry) => {
      entry.allocations.forEach((allocation) => {
        const existing = rows.get(allocation.subscriptionId)
        if (existing) {
          existing.distributionCount += 1
          existing.grossTotal = existing.grossTotal.add(allocation.gross)
          existing.capitalRepaymentTotal = existing.capitalRepaymentTotal.add(allocation.capitalRepayment)
          existing.dividendTotal = existing.dividendTotal.add(allocation.dividend)
          return
        }
        rows.set(allocation.subscriptionId, {
          subscriptionId: allocation.subscriptionId,
          subscriptionDate: allocation.subscriptionDate,
          distributionCount: 1,
          grossTotal: allocation.gross,
          capitalRepaymentTotal: allocation.capitalRepayment,
          dividendTotal: allocation.dividend,
        })
      })
    })

    return [...rows.values()]
  }

  const renderAssetsTable = (assets: OsakkeetCalculation['taxReturns']['years'][number]['assets']) => {
    if (!assets) return false
    return table(
      thead(
        tr(
          th(t.common.date),
          th(t.taxReturns.fields.sharesHeld),
          th(t.taxReturns.fields.mathematicalShareValuePerShare),
          th(t.taxReturns.fields.shareholderMathematicalValue),
          th(t.taxReturns.fields.remainingAcquisitionCost)
        )
      ),
      tbody(
        tr(
          td(assets.date),
          td(amount(assets.shareCount)),
          td(euro(assets.mathematicalShareValuePerShare)),
          td(euro(assets.shareholderMathematicalValue)),
          td(euro(assets.remainingAcquisitionCost))
        )
      )
    )
  }

  const renderTaxTable = (sectionSummary: TaxReturnDistributionSection | undefined, showAllocationDetails = false) => {
    if (!sectionSummary) return false
    const { entries, totals, mode } = sectionSummary
    const capitalRepaymentHeaderNode =
      mode === 'unlisted'
        ? withHoverInfo(t.cashDistributions.fields.capitalRepayment, t.taxReturns.fields.unlistedCapitalRepaymentHelp)
        : t.cashDistributions.fields.capitalRepayment
    const dividendHeaderNode = withHoverInfo(
      t.cashDistributions.fields.dividend,
      mode === 'unlisted' ? t.taxReturns.fields.unlistedDividendHelp : t.taxReturns.fields.listedDividendHelp
    )
    const mainColumnCount = mode === 'unlisted' ? 10 : 8
    const renderAllocationTable = (row: (typeof entries)[number]) =>
      table(
        pageStyles.compactTable,
        thead(
          tr(
            th(t.taxReturns.fields.subscriptionDate),
            th(t.taxReturns.fields.allocationShares),
            th(t.taxReturns.fields.allocationGross),
            th(t.taxReturns.fields.allocationCapitalRepayment),
            th(t.taxReturns.fields.allocationDividend),
            th(t.taxReturns.fields.allocationRemainingCostPerShareAfter)
          )
        ),
        tbody(
          row.allocations.map((allocation) =>
            tr(
              td(allocation.subscriptionDate),
              td(amount(allocation.shares)),
              td(euro(allocation.gross)),
              td(euro(allocation.capitalRepayment)),
              td(euro(allocation.dividend)),
              td(euro(allocation.remainingCostPerShareAfter))
            )
          )
        )
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
          mode === 'unlisted' && th(t.taxReturns.fields.taxFreeEarnedDividend)
        )
      ),
      tbody(
        entries.flatMap((row) => [
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
          ),
          showAllocationDetails &&
            tr(
              td(
                { colSpan: mainColumnCount },
                pageStyles.historyCell,
                div(pageStyles.denseStack, b(t.taxReturns.sections.allocationDetails), renderAllocationTable(row))
              )
            ),
        ]),
        tr(
          td(b(t.summary.totalRow)),
          td(),
          td(euro(totals.paidInCash)),
          td(euro(totals.withholdingToTaxOffice)),
          mode === 'unlisted' && td(euro(totals.capitalRepaymentTotal)),
          td(euro(totals.dividendTotal)),
          td(euro(totals.taxableCapitalIncome)),
          td(euro(totals.taxFreeCapitalIncome)),
          mode === 'unlisted' && td(euro(totals.taxableEarnedDividend)),
          mode === 'unlisted' && td(euro(totals.taxFreeEarnedDividend))
        )
      )
    )
  }

  const renderAllocationSummaryTable = (sectionSummary: TaxReturnDistributionSection | undefined) => {
    if (!sectionSummary) return false
    const rows = summarizeAllocationsBySubscription(sectionSummary.entries)
    if (rows.length === 0) return false
    return table(
      pageStyles.compactTable,
      thead(
        tr(
          th(t.taxReturns.fields.subscriptionDate),
          th(t.taxReturns.fields.allocationDistributionCount),
          th(t.taxReturns.fields.allocationGross),
          th(t.taxReturns.fields.allocationCapitalRepayment),
          th(t.taxReturns.fields.allocationDividend)
        )
      ),
      tbody(
        rows.map((row) =>
          tr(
            td(row.subscriptionDate),
            td(String(row.distributionCount)),
            td(euro(row.grossTotal)),
            td(euro(row.capitalRepaymentTotal)),
            td(euro(row.dividendTotal))
          )
        ),
        tr(
          td(b(t.summary.totalRow)),
          td(String(rows.reduce((acc, row) => acc + row.distributionCount, 0))),
          td(euro(sumDecimals(rows.map((row) => row.grossTotal)))),
          td(euro(sumDecimals(rows.map((row) => row.capitalRepaymentTotal)))),
          td(euro(sumDecimals(rows.map((row) => row.dividendTotal))))
        )
      )
    )
  }

  const renderTaxSectionWithToggle = (
    title: string | Node,
    sectionSummary: TaxReturnDistributionSection | undefined
  ) => {
    if (!sectionSummary) return false
    let showAllocationDetails = false
    const labelNode = document.createTextNode(t.taxReturns.actions.showAllocationDetails)
    const toggleButton = createActionButton(labelNode, 'secondary', () => {
      showAllocationDetails = !showAllocationDetails
      sync()
    })
    const contentRoot = div(pageStyles.denseStack)

    const sync = () => {
      labelNode.textContent = showAllocationDetails
        ? t.taxReturns.actions.hideAllocationDetails
        : t.taxReturns.actions.showAllocationDetails
      replaceChildren(
        contentRoot,
        showAllocationDetails &&
          div(
            pageStyles.denseStack,
            h4(t.taxReturns.sections.allocationSummary),
            renderAllocationSummaryTable(sectionSummary)
          ),
        renderTaxTable(sectionSummary, showAllocationDetails)
      )
    }

    sync()

    return div(
      pageStyles.denseStack,
      h3(title),
      div({ class: 'no-print' }, pageStyles.rowButtons, toggleButton),
      contentRoot
    )
  }

  const renderIpoSaleTable = (ipoSale: OsakkeetCalculation['taxReturns']['years'][number]['ipoSale']) => {
    if (!ipoSale) return false
    return table(
      thead(
        tr(
          th(t.taxReturns.fields.acquisitionDate),
          th(t.taxReturns.fields.sellDate),
          th(t.taxReturns.fields.soldShares),
          th(t.taxReturns.fields.grossSale),
          th(t.taxReturns.fields.actualDeduction),
          th(t.taxReturns.fields.hankintamenoOlettaDeduction),
          th(t.taxReturns.fields.selectedMethod),
          th(t.taxReturns.fields.selectedDeduction),
          th(t.taxReturns.fields.taxableCapitalGainWithLoss)
        )
      ),
      tbody(
        ipoSale.entries.map((row) =>
          tr(
            td(row.subscriptionDate),
            td(row.sellDate),
            td(amount(row.soldShareCount)),
            td(euro(row.grossSale)),
            td(euro(row.actualDeduction)),
            td(euro(row.hankintamenoOlettaDeduction)),
            td(
              row.selectedMethod === 'actual_costs'
                ? t.taxReturns.fields.selectedMethodActualCosts
                : t.taxReturns.fields.selectedMethodHmo
            ),
            td(euro(row.selectedDeduction)),
            td(euro(row.taxableCapitalGain))
          )
        ),
        tr(
          td(b(t.summary.totalRow)),
          td(),
          td(amount(ipoSale.soldShareCount)),
          td(euro(ipoSale.grossSale)),
          td(euro(ipoSale.actualDeductionTotal)),
          td(euro(ipoSale.hankintamenoOlettaDeductionTotal)),
          td(),
          td(euro(ipoSale.selectedDeductionTotal)),
          td(euro(ipoSale.taxableCapitalGain))
        )
      )
    )
  }

  return div(
    years.map((yearSummary) => {
      return div(
        pageStyles.denseStack,
        h3(String(yearSummary.year)),
        yearSummary.missingMathematicalValueWarningDates.length > 0 &&
          div(
            pageStyles.warningBox,
            ul(
              yearSummary.missingMathematicalValueWarningDates.map((date) =>
                li(`${date}: ${t.taxReturns.yearWarningMissingMathValue}`)
              )
            )
          ),
        yearSummary.assets &&
          div(pageStyles.denseStack, h3(t.taxReturns.sections.assets), renderAssetsTable(yearSummary.assets)),
        yearSummary.unlisted &&
          renderTaxSectionWithToggle(
            withHoverInfo(t.taxReturns.sections.unlisted, t.taxReturns.sections.unlistedHelp),
            yearSummary.unlisted
          ),
        yearSummary.listed && renderTaxSectionWithToggle(t.taxReturns.sections.listed, yearSummary.listed),
        yearSummary.ipoSale &&
          div(
            pageStyles.denseStack,
            h3(t.taxReturns.sections.ipoSale),
            renderIpoSaleTable(yearSummary.ipoSale),
            div(
              pageStyles.summaryGrid,
              infoCard(t.summary.ipoSell.cards.ipoCostsAllocated, euro(yearSummary.ipoSale.totalIpoCostAllocated)),
              infoCard(t.summary.ipoSell.cards.taxMan, euro(yearSummary.ipoSale.estimatedTax)),
              infoCard(t.summary.ipoSell.cards.netCash, euro(yearSummary.ipoSale.netCash))
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
  capitalRepaymentTotal: string
  capitalRepaymentPerShare: string
  remainingCostPerShare: string
  historyRows: SubscriptionHistoryRow[]
  historyTooltip: string
  showHistoryLabel: string
  hideHistoryLabel: string
  removeLabel: string
}

type SellRowViewModel = {
  id: string
  date: string
  shareCount: string
  sellPrice: string
  pricePerShare: string
  removeLabel: string
}

function createSellsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const sellTextNodes = localizedTextNodes.sells
  const rowsState = createRowViewModelBinder(
    pageReadState,
    ({ osakkeetCalculation }) => osakkeetCalculation.formData.sells,
    (sell, _index, { texts }) => ({
      id: sell.id,
      date: sell.date,
      shareCount: sell.shareCount,
      sellPrice: sell.sellPrice,
      pricePerShare: sell.pricePerShare || '',
      removeLabel: texts.common.remove,
    })
  )
  const sells = createStateCollectionEditor(dataState, ['sells'])
  const tbodyNode = createEditableCollectionTable<SellRowViewModel>({
    rowsState,
    createRemoveButton,
    remove: sells.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(row.date, (value) => {
        sells.patch(row.id, { date: value })
      })
      const shareCountInput = numberInput(row.shareCount, (value) => {
        sells.patch(row.id, { shareCount: value })
      })
      const sellPriceInput = numberInput(row.sellPrice, (value) => {
        sells.patch(row.id, { sellPrice: value })
      })
      const pricePerShareInput = numberInput(row.pricePerShare, (value) => {
        sells.patch(row.id, { pricePerShare: value })
      })
      return {
        node: tr(
          td(div(pageStyles.compactField, dateInput)),
          td(div(pageStyles.compactField, shareCountInput)),
          td(div(pageStyles.compactField, sellPriceInput)),
          td(div(pageStyles.compactField, pricePerShareInput)),
          td({ class: 'no-print' }, removeButton)
        ),
        set(nextRow) {
          setInputValue(dateInput, nextRow.date)
          setInputValue(shareCountInput, nextRow.shareCount)
          setInputValue(sellPriceInput, nextRow.sellPrice)
          setInputValue(pricePerShareInput, nextRow.pricePerShare)
        },
      }
    },
  })

  const addButton = createCollectionAppendButton(sells, sellTextNodes.actions.add, () => ({
    date: '',
    shareCount: '',
    sellPrice: '',
    pricePerShare: '',
  }))

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(sellTextNodes.title), span({ class: 'muted' }, counter.node)),
    p({ class: 'muted' }, sellTextNodes.help),
    table(
      pageStyles.compactTable,
      thead(
        tr(
          th(commonTextNodes.date),
          th(sellTextNodes.fields.shareCount),
          th(sellTextNodes.fields.sellPrice),
          th(sellTextNodes.fields.pricePerShare),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )

  return createSectionController(root, ({ osakkeetCalculation, texts }: OsakkeetPageReadModel) => {
    counter.setCount(osakkeetCalculation.formData.sells.length, texts.common.rows)
  })
}

function createSubscriptionRowViewModel(
  subscription: OsakkeetFormData['subscriptions'][number],
  summary: OsakkeetCalculation['subscriptions'][number] | undefined,
  texts: OsakkeetLocalization
): SubscriptionRowViewModel {
  const historyRows = createSubscriptionHistoryRows(summary, texts)
  return {
    id: subscription.id,
    date: subscription.date,
    vestingEndsOn: subscription.vestingEndsOn || '',
    amount: subscription.amount,
    pricePerShare: subscription.pricePerShare || '',
    otherTotalAcquisitionCosts: subscription.otherTotalAcquisitionCosts || '',
    totalPricePerShare: summary ? euro(summary.totalPricePerShare) : '-',
    capitalRepaymentTotal: summary ? euro(summary.capitalRepaymentTotal) : '-',
    capitalRepaymentPerShare: summary ? euro(summary.capitalRepaymentPerShare) : '-',
    remainingCostPerShare: summary ? euro(summary.remainingCostPerShare) : '-',
    historyRows,
    historyTooltip: createSubscriptionHistoryTooltip(historyRows, texts),
    showHistoryLabel: texts.subscriptions.history.show,
    hideHistoryLabel: texts.subscriptions.history.hide,
    removeLabel: texts.common.remove,
  }
}

function createSubscriptionsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const openHistorySubscriptionIds = new Set<string>()
  const counter = createSectionCounter()
  const subscriptionTextNodes = localizedTextNodes.subscriptions
  const summaryRoot = div(pageStyles.summaryGrid)
  const vestingEndsOnHeaderNode = withHoverInfo(subscriptionTextNodes.fields.vestingEndsOn, '')
  const otherTotalAcquisitionCostsHeaderNode = withHoverInfo(
    subscriptionTextNodes.fields.otherTotalAcquisitionCosts,
    ''
  )
  const totalReimbursementsHeaderNode = withHoverInfo(subscriptionTextNodes.fields.totalReimbursements, '')
  const subscriptionSummariesByIdState = pageReadState.map(({ osakkeetCalculation }) =>
    createSummaryById(osakkeetCalculation.subscriptions)
  )
  const subscriptionRowsSourceState = mergeStates(
    { pageReadModel: pageReadState, summariesById: subscriptionSummariesByIdState },
    ({ pageReadModel, summariesById }) => ({ pageReadModel, summariesById })
  )
  const rowsState = createRowViewModelBinder(
    subscriptionRowsSourceState,
    ({ pageReadModel }) => pageReadModel.osakkeetCalculation.formData.subscriptions,
    (subscription, _index, { pageReadModel, summariesById }) =>
      createSubscriptionRowViewModel(subscription, summariesById[subscription.id], pageReadModel.texts)
  )
  const subscriptions = createStateCollectionEditor(dataState, ['subscriptions'])
  const tbodyNode = createEditableCollectionTable<SubscriptionRowViewModel>({
    rowsState,
    createRemoveButton,
    remove: subscriptions.remove,
    render: ({ row, removeButton }) => {
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
      const totalPricePerShareCell = td(row.totalPricePerShare)
      const capitalRepaymentPerShareCell = td(row.capitalRepaymentPerShare)
      const remainingCostPerShareCell = td(row.remainingCostPerShare)
      const capitalRepaymentTotalCell = td(row.capitalRepaymentTotal)
      const historyButton = createActionButton(document.createTextNode(row.showHistoryLabel), 'secondary', () => {
        if (openHistorySubscriptionIds.has(currentRow.id)) {
          openHistorySubscriptionIds.delete(currentRow.id)
        } else {
          openHistorySubscriptionIds.add(currentRow.id)
        }
        syncHistoryVisibility(currentRow)
      })
      const historyContainer = div()
      const detailRow = tr(td({ colSpan: 11 }, pageStyles.historyCell, historyContainer))
      const rowNode = tr(
        td(dateInput),
        td(vestingEndsOnInput),
        td(amountInput),
        td(pricePerShareInput),
        td(otherTotalAcquisitionCostsInput),
        totalPricePerShareCell,
        capitalRepaymentPerShareCell,
        remainingCostPerShareCell,
        capitalRepaymentTotalCell,
        td({ class: 'no-print' }, historyButton),
        td({ class: 'no-print' }, removeButton)
      )
      let currentRow = row

      const renderHistoryTable = (historyRows: SubscriptionHistoryRow[]) =>
        table(
          pageStyles.historyTable,
          thead(
            tr(
              th(pageStyles.historyTableCell, subscriptionTextNodes.history.fields.date),
              th(pageStyles.historyTableCell, subscriptionTextNodes.history.fields.event),
              th(pageStyles.historyTableCell, subscriptionTextNodes.history.fields.shareCount),
              th(pageStyles.historyTableCell, subscriptionTextNodes.history.fields.shareCost),
              th(pageStyles.historyTableCell, subscriptionTextNodes.history.fields.pricePerShare),
              th(pageStyles.historyTableCell, subscriptionTextNodes.history.fields.details)
            )
          ),
          tbody(
            historyRows.length > 0
              ? historyRows.map((entry) =>
                  tr(
                    td(pageStyles.historyTableCell, entry.date),
                    td(pageStyles.historyTableCell, entry.event),
                    td(pageStyles.historyTableCell, entry.shareCount),
                    td(pageStyles.historyTableCell, entry.shareCost),
                    td(pageStyles.historyTableCell, entry.pricePerShare),
                    td(pageStyles.historyTableCell, pageStyles.historyDetailsCell, entry.details)
                  )
                )
              : [tr(td({ colSpan: 6 }, pageStyles.historyTableCell, subscriptionTextNodes.history.empty))]
          )
        )

      const syncHistoryVisibility = (nextRow: SubscriptionRowViewModel) => {
        const isHistoryOpen = openHistorySubscriptionIds.has(nextRow.id)
        historyButton.textContent = isHistoryOpen ? nextRow.hideHistoryLabel : nextRow.showHistoryLabel
        historyButton.title = nextRow.historyTooltip
        detailRow.style.display = isHistoryOpen ? '' : 'none'
        if (isHistoryOpen) {
          replaceChildren(historyContainer, renderHistoryTable(nextRow.historyRows))
        }
      }

      const fragment = document.createDocumentFragment()
      fragment.append(rowNode, detailRow)
      syncHistoryVisibility(currentRow)

      return {
        node: fragment,
        set(nextRow) {
          currentRow = nextRow
          setInputValue(dateInput, nextRow.date)
          setInputValue(vestingEndsOnInput, nextRow.vestingEndsOn)
          setInputValue(amountInput, nextRow.amount)
          setInputValue(pricePerShareInput, nextRow.pricePerShare)
          setInputValue(otherTotalAcquisitionCostsInput, nextRow.otherTotalAcquisitionCosts)
          replaceChildren(totalPricePerShareCell, nextRow.totalPricePerShare)
          replaceChildren(capitalRepaymentPerShareCell, nextRow.capitalRepaymentPerShare)
          replaceChildren(remainingCostPerShareCell, nextRow.remainingCostPerShare)
          replaceChildren(capitalRepaymentTotalCell, nextRow.capitalRepaymentTotal)
          syncHistoryVisibility(nextRow)
        },
      }
    },
  })

  const addButton = createActionButton(subscriptionTextNodes.actions.add, 'primary', () => {
    subscriptions.append(createAppendCollectionRow('subscriptions'))
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(subscriptionTextNodes.title), span({ class: 'muted' }, counter.node)),
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
          th({ class: 'no-print' }, subscriptionTextNodes.history.show),
          th({ class: 'no-print' }, '')
        )
      ),
      tbodyNode
    ),
    div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
  )
  replaceChildrenFromState(pageReadState, summaryRoot, ({ osakkeetCalculation, texts }) =>
    createSubscriptionsSummaryCards(
      infoCard,
      osakkeetCalculation.vesting.totalShares,
      osakkeetCalculation.vesting.vestedShares,
      osakkeetCalculation.vesting.unvestedShares,
      texts
    )
  )

  return createSectionController(root, ({ osakkeetCalculation, texts }: OsakkeetPageReadModel) => {
    const current = osakkeetCalculation.formData
    counter.setCount(current.subscriptions.length, texts.common.rows)
    vestingEndsOnHeaderNode.title = texts.subscriptions.fields.vestingEndsOnHelp
    otherTotalAcquisitionCostsHeaderNode.title = texts.subscriptions.fields.otherTotalAcquisitionCostsHelp
    totalReimbursementsHeaderNode.title = texts.subscriptions.fields.totalReimbursementsHelp
  })
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

function createCashDistributionRowViewModel(
  cashDistribution: OsakkeetFormData['cashDistributions'][number],
  summary: OsakkeetCalculation['cashDistributions'][number] | undefined,
  texts: OsakkeetLocalization
): CashDistributionRowViewModel {
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
      ? texts.cashDistributions.fields.capitalRepaymentSharesHelp(amount(summary.capitalRepaymentShareCount))
      : '',
    dividendTotal: summary ? euro(summary.dividendTotal) : '-',
    dividendTotalTooltip: summary
      ? texts.cashDistributions.fields.dividendSharesHelp(amount(summary.dividendShareCount))
      : '',
    shareCountMismatch: hasShareCountMismatch
      ? texts.cashDistributions.messages.shareCountMismatch(expectedShareCount, givenShareCount)
      : '',
    removeLabel: texts.common.remove,
    capitalReturnLabel: texts.cashDistributions.types.capitalReturn,
    dividendLabel: texts.cashDistributions.types.dividend,
  }
}

function createCashDistributionsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const cashDistributionTextNodes = localizedTextNodes.cashDistributions
  const withholdingHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.withholding, '')
  const cashPaidHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.cashPaid, '')
  const capitalRepaymentHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.capitalRepayment, '')
  const dividendHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.dividend, '')
  const cashDistributionSummariesByIdState = pageReadState.map(({ osakkeetCalculation }) =>
    createSummaryById(osakkeetCalculation.cashDistributions)
  )
  const cashDistributionRowsSourceState = mergeStates(
    { pageReadModel: pageReadState, summariesById: cashDistributionSummariesByIdState },
    ({ pageReadModel, summariesById }) => ({ pageReadModel, summariesById })
  )
  const rowsState = createRowViewModelBinder(
    cashDistributionRowsSourceState,
    ({ pageReadModel }) => pageReadModel.osakkeetCalculation.formData.cashDistributions,
    (cashDistribution, _index, { pageReadModel, summariesById }) =>
      createCashDistributionRowViewModel(cashDistribution, summariesById[cashDistribution.id], pageReadModel.texts)
  )
  const cashDistributions = createStateCollectionEditor(dataState, ['cashDistributions'])
  const tbodyNode = createEditableCollectionTable<CashDistributionRowViewModel>({
    rowsState,
    createRemoveButton,
    remove: cashDistributions.remove,
    render: ({ row, rowTextNodes, removeButton }) => {
      const dateInput = finnishDateInput(row.date, (value) => {
        cashDistributions.patch(row.id, { date: value })
      })
      const typeSelect = createOptionBoundSelect(
        row.type,
        [
          { label: row.capitalReturnLabel, value: 'capital_return' },
          { label: row.dividendLabel, value: 'dividend' },
        ],
        (value) => {
          cashDistributions.patch(row.id, { type: value })
        }
      )
      setStyle(typeSelect.node, pageStyles.input)
      const shareCountInput = numberInput(row.shareCount, (value) => {
        cashDistributions.patch(row.id, { shareCount: value })
      })
      const amountPerShareInput = numberInput(row.amountPerShare, (value) => {
        cashDistributions.patch(row.id, { amountPerShare: value })
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
        td(typeSelect.node),
        shareCountCell,
        td(amountPerShareInput),
        td(rowTextNodes.grossTotal),
        td(rowTextNodes.paidInCash),
        td(rowTextNodes.withholdingToTaxOffice),
        capitalRepaymentTotalCell,
        dividendTotalCell,
        td({ class: 'no-print' }, removeButton)
      )

      return {
        node: rowNode,
        set(nextRow) {
          setInputValue(dateInput, nextRow.date)
          typeSelect.setOptions([
            { label: nextRow.capitalReturnLabel, value: 'capital_return' },
            { label: nextRow.dividendLabel, value: 'dividend' },
          ])
          typeSelect.setValue(nextRow.type)
          setInputValue(shareCountInput, nextRow.shareCount)
          setInputValue(amountPerShareInput, nextRow.amountPerShare)
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
    cashDistributions.append(createAppendCollectionRow('cashDistributions'))
  })

  const root = section(
    { class: 'card' },
    div({ class: 'heading' }, h2(cashDistributionTextNodes.title), span({ class: 'muted' }, counter.node)),
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

  return createSectionController(root, ({ osakkeetCalculation, texts }: OsakkeetPageReadModel) => {
    const current = osakkeetCalculation.formData
    counter.setCount(current.cashDistributions.length, texts.common.rows)
    withholdingHeaderNode.title = texts.cashDistributions.fields.withholdingHelp
    cashPaidHeaderNode.title = texts.cashDistributions.fields.cashPaidHelp
    capitalRepaymentHeaderNode.title = texts.cashDistributions.fields.capitalRepaymentHelp
    dividendHeaderNode.title = texts.cashDistributions.fields.dividendHelp
  })
}

function createSellOverviewCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  const sharePercent = createSharePercent(osakkeetCalculation.vesting.totalShares)
  return [
    infoCard(texts.summary.ipoSell.cards.sellableShares, sharePercent(osakkeetCalculation.vesting.vestedShares)),
    infoCard(texts.summary.ipoSell.cards.unvestedShares, sharePercent(osakkeetCalculation.vesting.unvestedShares)),
    infoCard(texts.summary.ipoSell.cards.sharesLeft, amount(osakkeetCalculation.sell.remainingUnsoldShares)),
  ]
}

function createSellAllocationTable(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  return table(
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
        td(b(euro(osakkeetCalculation.sell.selectedHmoDeductionTotal))),
        td(euro(osakkeetCalculation.sell.taxableGainTotal))
      ),
    ])
  )
}

function createSellExplanationCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  return [
    infoCard(
      texts.summary.ipoSell.explanations.ipoPriceTotal,
      euro(osakkeetCalculation.sell.grossTotal),
      texts.summary.ipoSell.explanations.ipoPriceTotalHelp(euro(osakkeetCalculation.sell.grossTotal))
    ),
    infoCard(
      texts.summary.ipoSell.explanations.ipoCostsAllocated,
      euro(osakkeetCalculation.sell.totalIpoCostAllocated),
      texts.summary.ipoSell.explanations.ipoCostsAllocatedHelp(euro(osakkeetCalculation.sell.totalIpoCostAllocated))
    ),
    infoCard(
      texts.summary.ipoSell.explanations.netCash,
      euro(osakkeetCalculation.sell.cashAfterIpoCosts),
      texts.summary.ipoSell.explanations.netCashHelp(
        euro(osakkeetCalculation.sell.grossTotal),
        euro(osakkeetCalculation.sell.totalIpoCostAllocated),
        euro(osakkeetCalculation.sell.cashAfterIpoCosts)
      )
    ),
  ]
}

function createCapitalGainCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  return [
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
        euro(osakkeetCalculation.sell.selectedHmoDeductionTotal)
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
    ),
  ]
}

function createCashReserveCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  const keepAfterTaxesPercentage = osakkeetCalculation.sell.grossTotal.gt(0)
    ? ` (${percentage(osakkeetCalculation.sell.netAfterTaxAndIpoCost.div(osakkeetCalculation.sell.grossTotal).mul(100))})`
    : ''
  return [
    infoCard(
      texts.summary.ipoSell.cashReserve.keepAfterTaxes,
      `${euro(osakkeetCalculation.sell.netAfterTaxAndIpoCost)}${keepAfterTaxesPercentage}`,
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
    ),
  ]
}

function createSaleResultComparisonCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  const netResultPercent = osakkeetCalculation.sell.soldShareAcquisitionCostTotal.gt(0)
    ? percentage(
        osakkeetCalculation.sell.netResultAgainstSubscriptionCost
          .div(osakkeetCalculation.sell.soldShareAcquisitionCostTotal)
          .mul(100)
      )
    : '0.00 %'
  return [
    infoCard(
      texts.summary.ipoSell.saleResultComparison.cardTitle,
      texts.summary.ipoSell.saleResultComparison.value(
        euro(osakkeetCalculation.sell.soldShareOriginalCostTotal),
        euro(osakkeetCalculation.sell.soldShareAcquisitionCostTotal),
        euro(osakkeetCalculation.sell.netResultAgainstSubscriptionCost),
        netResultPercent
      ),
      texts.summary.ipoSell.saleResultComparison.help(
        euro(osakkeetCalculation.sell.soldShareOriginalCostTotal),
        euro(osakkeetCalculation.sell.soldShareAcquisitionCostTotal),
        euro(osakkeetCalculation.sell.netAfterTaxAndIpoCost),
        euro(osakkeetCalculation.sell.netResultAgainstSubscriptionCost),
        netResultPercent
      )
    ),
  ]
}

function createIpoCostEffectCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  return [
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
    ),
  ]
}

function createAnnualAdjustmentCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization) {
  const zeroMoney = osakkeetCalculation.sell.grossTotal.mul(0)
  const annualKeepAfterTaxesPercentage = osakkeetCalculation.sell.grossTotal.gt(0)
    ? ` (${percentage(osakkeetCalculation.sell.netAfterAnnualTaxAndIpoCost.div(osakkeetCalculation.sell.grossTotal).mul(100))})`
    : ''
  return {
    taxEffect: infoCard(
      texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapital,
      osakkeetCalculation.sell.taxReductionFromOtherLosses.gt(0)
        ? euro(osakkeetCalculation.sell.taxReductionFromOtherLosses)
        : osakkeetCalculation.sell.annualTaxChange.gt(0)
          ? `+${euro(osakkeetCalculation.sell.annualTaxChange)}`
          : euro(zeroMoney),
      texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapitalHelp(
        euro(osakkeetCalculation.sell.otherAnnualCapitalGainsOrLosses),
        euro(osakkeetCalculation.sell.taxReductionFromOtherLosses),
        euro(Decimal.max(osakkeetCalculation.sell.annualTaxChange, zeroMoney))
      )
    ),
    reserve: infoCard(
      texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxes,
      euro(osakkeetCalculation.sell.annualEstimatedTax),
      texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxesHelp(
        euro(osakkeetCalculation.sell.annualEstimatedTax)
      )
    ),
    keep: infoCard(
      texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxes,
      `${euro(osakkeetCalculation.sell.netAfterAnnualTaxAndIpoCost)}${annualKeepAfterTaxesPercentage}`,
      texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxesHelp(
        euro(osakkeetCalculation.sell.cashAfterIpoCosts),
        euro(osakkeetCalculation.sell.annualEstimatedTax),
        euro(osakkeetCalculation.sell.netAfterAnnualTaxAndIpoCost)
      )
    ),
  }
}

function createIpoSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes
) {
  const formBinder = createFormBinder(dataState)
  const ipoTextNodes = localizedTextNodes.ipo
  const summaryCardTextNodes = localizedTextNodes.summary.cards
  const valueNodes = createComputedTextState(pageReadState, ({ osakkeetCalculation }) => ({
    currentTotalValue: euro(osakkeetCalculation.ipo.currentTotalValue),
    subscribedShares: amount(osakkeetCalculation.ipo.totalSubscribedShares),
    ipoSharePrice: euro(osakkeetCalculation.ipo.ipoPricePerShare),
    increasePercent: percentage(osakkeetCalculation.ipo.increasePercentage),
    increaseMultiplier: multiplier(osakkeetCalculation.ipo.increaseMultiplier),
    ipoCostPerSecondaryShare: euro(osakkeetCalculation.ipo.ipoCostPerShare),
    secondarySharesTotal: amount(osakkeetCalculation.ipo.estimatedSecondaryShareCount),
  })).textNodes

  const currentShareValueInput = numberInput('')
  const totalShareCountInput = numberInput('')
  const estimatedPreIpoValueInput = numberInput('')
  const totalIpoCostInput = numberInput('')
  const secondarySellPercentInput = numberInput('')
  const ipoDateInput = finnishDateInput('')

  formBinder.bindInputs([
    { path: ['ipo', 'currentShareValue'], node: currentShareValueInput },
    { path: ['ipo', 'totalShareCount'], node: totalShareCountInput },
    { path: ['ipo', 'estimatedPreIpoValue'], node: estimatedPreIpoValueInput },
    { path: ['ipo', 'totalIpoCost'], node: totalIpoCostInput },
    { path: ['ipo', 'estimatedSecondaryShareSellPercentage'], node: secondarySellPercentInput },
    { path: ['ipo', 'ipoDate'], node: ipoDateInput },
  ])

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

  return createSectionController(root, () => {})
}

function createResultsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes
) {
  const formBinder = createFormBinder(dataState)
  const warningRoot = div()
  const ipoSellContentRoot = div(pageStyles.denseStack)
  const summaryTextNodes = localizedTextNodes.summary
  const annualAdjustmentTaxEffectRoot = div()
  const annualAdjustmentReserveRoot = div()
  const annualAdjustmentKeepRoot = div()
  const sellInput = numberInput('')
  const otherAnnualCapitalInput = numberInput('')
  const annualAdjustmentCardsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    createAnnualAdjustmentCards(osakkeetCalculation, texts)
  )
  formBinder.bindInputs([
    { path: ['sell', 'amount'], node: sellInput },
    { path: ['sell', 'otherAnnualCapitalGainsOrLosses'], node: otherAnnualCapitalInput },
  ])
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
  replaceChildrenFromState(pageReadState, warningRoot, ({ osakkeetCalculation, texts }) => [
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
      ),
  ])
  replaceChildrenFromState(pageReadState, ipoSellContentRoot, ({ osakkeetCalculation, texts }) => {
    return [
      div(pageStyles.summaryGrid, createSellOverviewCards(osakkeetCalculation, texts)),
      h3(texts.summary.allocationByLot.title),
      createSellAllocationTable(osakkeetCalculation, texts),
      h3(texts.summary.ipoSell.explanations.title),
      div(pageStyles.summaryGrid, createSellExplanationCards(osakkeetCalculation, texts)),
      h3(texts.summary.ipoSell.capitalGainAnnualTax.title),
      div(pageStyles.summaryGrid, createCapitalGainCards(osakkeetCalculation, texts)),
      h3(texts.summary.ipoSell.cashReserve.title),
      div(pageStyles.summaryGrid, createCashReserveCards(osakkeetCalculation, texts)),
      h3(texts.summary.ipoSell.saleResultComparison.title),
      div(pageStyles.summaryGrid, createSaleResultComparisonCards(osakkeetCalculation, texts)),
      h3(texts.summary.ipoSell.ipoCostEffects.title),
      div(pageStyles.summaryGrid, createIpoCostEffectCards(osakkeetCalculation, texts)),
    ]
  })
  replaceChildrenFromState(annualAdjustmentCardsState, annualAdjustmentTaxEffectRoot, (cards) => cards.taxEffect)
  replaceChildrenFromState(annualAdjustmentCardsState, annualAdjustmentReserveRoot, (cards) => cards.reserve)
  replaceChildrenFromState(annualAdjustmentCardsState, annualAdjustmentKeepRoot, (cards) => cards.keep)

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

  return createSectionController(root, () => {})
}

function createTopSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  languageSelectionState: State<Language>,
  localizedTextNodes: LocalizedTextNodes
) {
  const viewState = createState({
    value: {
      status: '',
    },
  })
  const storageTextNodes = localizedTextNodes.storage
  const introTextNodes = localizedTextNodes.intro
  const languageSwitchTextNodes = localizedTextNodes.languageSwitch
  const statusNode = createTextNodesFromState(viewState, { path: ['status'] })
  let currentTexts = pageReadState.get().texts
  const assumptionsRoot = div()
  replaceChildrenFromState(pageReadState, assumptionsRoot, ({ texts }) => assumptionsContent(texts))
  const fiButton = button(
    'FI',
    pageStyles.smallButton,
    events({
      click() {
        languageSelectionState.set('fi')
      },
    })
  )
  const enButton = button(
    'EN',
    pageStyles.smallButton,
    events({
      click() {
        languageSelectionState.set('en')
      },
    })
  )
  const lastFileSavedHashSource = createStorageSource<string>({
    storage: sessionStorage,
    key: storageKeys.lastFileSavedHash,
    serialize: (value) => value,
    deserialize: (raw) => raw,
  })
  const setStatus = (status: string) => {
    viewState.set((current) => ({ ...current, status }))
  }
  const refreshStorageButtons = () => {
    const currentSerialized = serializeOsakkeetFormData(dataState.get())
    const lastFileSavedHash = lastFileSavedHashSource.load()
    const fileNeedsSave = lastFileSavedHash !== currentSerialized
    ;[topSaveFileButton, stickySaveFileButton].forEach((saveFileButton) => {
      setButtonAttention(saveFileButton, fileNeedsSave)
      saveFileButton.title = fileNeedsSave
        ? currentTexts.storage.saveIndicators.fileNeedsSave
        : currentTexts.storage.saveIndicators.fileSaved
    })
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
            const normalized = normalizeOsakkeetFormData(parsed)
            dataState.set(normalized)
            lastFileSavedHashSource.save(serializeOsakkeetFormData(normalized))
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
        const blob = new Blob([JSON.stringify(normalizeOsakkeetFormData(dataState.get()), null, 2)], {
          type: 'application/json',
        })
        const serialized = serializeOsakkeetFormData(dataState.get())
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'osakkeet-input-state.json'
        link.click()
        URL.revokeObjectURL(url)
        lastFileSavedHashSource.save(serialized)
        setStatus(currentTexts.storage.status.fileSaved)
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
        dataState.set(createExampleOsakkeetFormData('small2y', createId))
        setStatus(currentTexts.storage.status.exampleShown)
      },
    },
    {
      labelNode: storageTextNodes.actions.showMediumExample,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createExampleOsakkeetFormData('medium8y', createId))
        setStatus(currentTexts.storage.status.exampleShown)
      },
    },
    {
      labelNode: storageTextNodes.actions.showLargeExample,
      variant: 'secondary' as const,
      action: () => {
        dataState.set(createExampleOsakkeetFormData('large16y', createId))
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
    topSaveFileButton,
    topLoadFileButton,
    smallExampleButton,
    mediumExampleButton,
    largeExampleButton,
    clearExampleButton,
    copyShareUrlButton,
  ] = buttonConfigs.map(({ labelNode, variant, action }) => createActionButton(labelNode, variant, action))
  const stickySaveFileButton = createActionButton(storageTextNodes.actions.saveFile, 'secondary', () => {
    const blob = new Blob([JSON.stringify(normalizeOsakkeetFormData(dataState.get()), null, 2)], {
      type: 'application/json',
    })
    const serialized = serializeOsakkeetFormData(dataState.get())
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'osakkeet-input-state.json'
    link.click()
    URL.revokeObjectURL(url)
    lastFileSavedHashSource.save(serialized)
    setStatus(currentTexts.storage.status.fileSaved)
    refreshStorageButtons()
  })
  const stickyLoadFileButton = createActionButton(storageTextNodes.actions.loadFile, 'secondary', () => {
    fileInput.click()
  })
  dataState.onValueChange(() => {
    refreshStorageButtons()
  })
  refreshStorageButtons()
  const stickyWarningListRoot = ul(pageStyles.stickyWarningList)
  replaceChildrenFromState(pageReadState, stickyWarningListRoot, ({ texts }) =>
    texts.intro.warnings.map((warning) => li(warning))
  )
  const root = div(
    pageStyles.stack,
    div(
      { class: 'osakkeet-sticky-warning no-print' },
      div(
        { class: 'osakkeet-sticky-warning__inner' },
        pageStyles.stickyWarningBox,
        div(
          pageStyles.stickyWarningHeader,
          h3(pageStyles.stickyWarningTitle, introTextNodes.warningsTitle),
          div(
            pageStyles.stickyWarningActions,
            stickySaveFileButton,
            stickyLoadFileButton,
            clearExampleButton,
            copyShareUrlButton
          )
        ),
        stickyWarningListRoot
      )
    ),
    section(
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
      assumptionsRoot,
      fileInput,
      div({ class: 'heading' }, h3(storageTextNodes.title), span({ class: 'muted' }, statusNode)),
      div(
        pageStyles.denseStack,
        div(
          pageStyles.denseStack,
          p(
            { class: 'muted' },
            pageStyles.compactParagraph,
            b(storageTextNodes.table.autoSaveTitle, ': '),
            storageTextNodes.table.autoSaveDescription
          )
        ),
        div(
          pageStyles.denseStack,
          p(
            { class: 'muted' },
            pageStyles.compactParagraph,
            b(storageTextNodes.table.fileTitle, ': '),
            storageTextNodes.table.fileDescription
          ),
          div({ class: 'no-print' }, pageStyles.topAlignedRowButtons, topSaveFileButton, topLoadFileButton)
        ),
        div(
          pageStyles.denseStack,
          h4(storageTextNodes.table.exampleTitle),
          div(
            { class: 'no-print' },
            pageStyles.topAlignedRowButtons,
            smallExampleButton,
            mediumExampleButton,
            largeExampleButton
          )
        )
      )
    )
  )

  return createSectionController(root, ({ languageSelection, texts }: OsakkeetPageReadModel) => {
    currentTexts = texts
    setButtonVariant(fiButton, languageSelection === 'fi')
    setButtonVariant(enButton, languageSelection === 'en')
    refreshStorageButtons()
  })
}

function createTaxSummarySection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes
) {
  const taxReturnsTextNodes = localizedTextNodes.taxReturns
  const mathematicalShareValuesEditor = createMathematicalShareValuesEditor(
    dataState,
    pageReadState,
    localizedTextNodes
  )
  const resultsRoot = div(pageStyles.denseStack)
  replaceChildrenFromState(pageReadState, resultsRoot, ({ osakkeetCalculation, texts }) =>
    taxSummarySection(osakkeetCalculation, texts)
  )
  const root = section(
    { class: 'card' },
    h2(taxReturnsTextNodes.title),
    mathematicalShareValuesEditor.root,
    resultsRoot
  )

  return createSectionController(root, () => {})
}

type OsakkeetPageReadModel = {
  formData: OsakkeetFormData
  languageSelection: Language
  texts: OsakkeetLocalization
  osakkeetCalculation: OsakkeetCalculation
}

export function osakkeetIpoCalculatorPage() {
  const dataStateHandle = createStorageBackedState<OsakkeetFormData>({
    value: tryLoadInitialData(),
    storage: sessionStorage,
    key: storageKeys.windowFormData,
    serialize: serializeOsakkeetFormData,
    deserialize: (raw) => normalizeOsakkeetFormData(JSON.parse(raw) as Partial<OsakkeetFormData>),
    hydrate: false,
  })
  const languageSelectionStateHandle = createStorageBackedState<Language>({
    value: tryLoadLanguage(),
    storage: localStorage,
    key: storageKeys.language,
    serialize: (languageSelection) => languageSelection,
    deserialize: (raw) => (raw === 'en' ? 'en' : 'fi'),
    hydrate: false,
  })
  const dataState = dataStateHandle.state
  const languageSelectionState = languageSelectionStateHandle.state
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

  const topSection = createTopSection(dataState, pageReadState, languageSelectionState, localizedTextNodes)
  const subscriptionsSection = createSubscriptionsSection(
    dataState,
    pageReadState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const sellsSection = createSellsSection(
    dataState,
    pageReadState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const cashDistributionsSection = createCashDistributionsSection(
    dataState,
    pageReadState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const demergersSection = createDemergersSection(
    dataState,
    pageReadState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const shareSplitsSection = createShareSplitsSection(
    dataState,
    pageReadState,
    localizedTextNodes,
    createTextNodesFromState(localizationTexts, { path: ['common'] })
  )
  const taxSummarySectionController = createTaxSummarySection(dataState, pageReadState, localizedTextNodes)
  const ipoSection = createIpoSection(dataState, pageReadState, localizedTextNodes)
  const resultsSection = createResultsSection(dataState, pageReadState, localizedTextNodes)
  const root = div(pageStyles.stack)
  const applyPageReadModel = (pageReadModel: OsakkeetPageReadModel) => {
    topSection.set(pageReadModel)
    subscriptionsSection.set(pageReadModel)
    sellsSection.set(pageReadModel)
    cashDistributionsSection.set(pageReadModel)
    demergersSection.set(pageReadModel)
    shareSplitsSection.set(pageReadModel)
    taxSummarySectionController.set(pageReadModel)
    ipoSection.set(pageReadModel)
    resultsSection.set(pageReadModel)
  }

  pageReadState.onValueChange(applyPageReadModel)

  const initialPageReadModel = pageReadState.get()
  applyPageReadModel(initialPageReadModel)
  replaceChildren(
    root,
    topSection.root,
    subscriptionsSection.root,
    sellsSection.root,
    cashDistributionsSection.root,
    demergersSection.root,
    shareSplitsSection.root,
    taxSummarySectionController.root,
    ipoSection.root,
    resultsSection.root
  )
  return root
}
