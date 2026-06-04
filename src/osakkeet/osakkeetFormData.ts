import type { OsakkeetFormData } from './osakkeetTypes'
import { sortRowsByDate } from './osakkeetUtils'

export type FormCollectionKey =
  | 'subscriptions'
  | 'sells'
  | 'cashDistributions'
  | 'shareSplits'
  | 'demergers'
  | 'mathematicalShareValues'

type CreateId = (prefix: string) => string
type FormCollectionRow<K extends FormCollectionKey> = OsakkeetFormData[K][number]
type FormCollectionSchema<K extends FormCollectionKey> = {
  prefix: string
  create: () => Omit<FormCollectionRow<K>, 'id'>
  normalize: (row: Partial<FormCollectionRow<K>>, createId: CreateId) => FormCollectionRow<K>
}

const formCollectionSchemas = {
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
    normalize: (row, createId) =>
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
    normalize: (row, createId) =>
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
    normalize: (row, createId) =>
      ({
        id: row.id || createId('sell'),
        date: row.date || '',
        shareCount: row.shareCount || '',
        sellPrice: row.sellPrice || '',
        pricePerShare: row.pricePerShare || '',
      }) satisfies OsakkeetFormData['sells'][number],
  },
  shareSplits: {
    prefix: 'split',
    create: () =>
      ({
        date: '',
        multiplier: '',
      }) satisfies Omit<OsakkeetFormData['shareSplits'][number], 'id'>,
    normalize: (row, createId) =>
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
    normalize: (row, createId) =>
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
    normalize: (row, createId) =>
      ({
        id: row.id || createId('math'),
        year: row.year || '',
        valuePerShare: row.valuePerShare || '',
      }) satisfies OsakkeetFormData['mathematicalShareValues'][number],
  },
} satisfies { [K in FormCollectionKey]: FormCollectionSchema<K> }

function normalizeCollectionRows<K extends FormCollectionKey>(
  key: K,
  rows: Array<Partial<FormCollectionRow<K>>> | undefined,
  createId: CreateId
): FormCollectionRow<K>[] {
  return (rows || []).map((row) => formCollectionSchemas[key].normalize(row, createId))
}

export function normalizeLegacyIpoSell(data: Partial<OsakkeetFormData>) {
  const legacyIpoSell = (data as Partial<OsakkeetFormData> & { sell?: OsakkeetFormData['ipoSell'] }).sell
  return {
    ...data,
    ipoSell: data.ipoSell ?? legacyIpoSell,
  } satisfies Partial<OsakkeetFormData>
}

export function createBlankOsakkeetFormData(): OsakkeetFormData {
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
    ipoSell: {
      amount: '',
      otherAnnualCapitalGainsOrLosses: '',
    },
    lastModifiedCompanyData: '',
    lastModifiedUserData: '',
  }
}

export function normalizeOsakkeetFormData(data: Partial<OsakkeetFormData>, createId: CreateId): OsakkeetFormData {
  const normalized = normalizeLegacyIpoSell(data)
  const blank = createBlankOsakkeetFormData()
  const ipo = normalized.ipo ?? blank.ipo
  const ipoSell = normalized.ipoSell ?? blank.ipoSell
  return {
    subscriptions: sortRowsByDate(normalizeCollectionRows('subscriptions', normalized.subscriptions, createId)),
    sells: sortRowsByDate(normalizeCollectionRows('sells', normalized.sells, createId)),
    cashDistributions: sortRowsByDate(
      normalizeCollectionRows('cashDistributions', normalized.cashDistributions, createId)
    ),
    shareSplits: sortRowsByDate(normalizeCollectionRows('shareSplits', normalized.shareSplits, createId)),
    demergers: sortRowsByDate(normalizeCollectionRows('demergers', normalized.demergers, createId)),
    mathematicalShareValues: normalizeCollectionRows(
      'mathematicalShareValues',
      normalized.mathematicalShareValues,
      createId
    ),
    ipo: {
      ...blank.ipo,
      ipoDate: ipo.ipoDate || '',
      totalShareCount: ipo.totalShareCount || '',
      totalIpoCost: ipo.totalIpoCost || '',
      currentShareValue: ipo.currentShareValue || '',
      estimatedPreIpoValue: ipo.estimatedPreIpoValue || '',
      estimatedSecondaryShareSellPercentage: ipo.estimatedSecondaryShareSellPercentage || '',
    },
    ipoSell: {
      ...blank.ipoSell,
      ...ipoSell,
      amount: ipoSell.amount || '',
      otherAnnualCapitalGainsOrLosses: ipoSell.otherAnnualCapitalGainsOrLosses || '',
    },
    lastModifiedCompanyData: normalized.lastModifiedCompanyData || '',
    lastModifiedUserData: normalized.lastModifiedUserData || '',
  }
}

export function createEmptyCollectionRow<K extends FormCollectionKey>(
  key: K,
  createId: CreateId
): FormCollectionRow<K> {
  return formCollectionSchemas[key].normalize(formCollectionSchemas[key].create(), createId)
}

export function createAppendCollectionRow<K extends FormCollectionKey>(key: K): Omit<FormCollectionRow<K>, 'id'> {
  return formCollectionSchemas[key].create() as unknown as Omit<FormCollectionRow<K>, 'id'>
}
