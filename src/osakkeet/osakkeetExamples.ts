import type { OsakkeetFormData } from './osakkeetTypes'

export type ExamplePreset = 'small2y' | 'medium8y' | 'large16y'

type ExamplePresetConfig = Omit<
  OsakkeetFormData,
  'subscriptions' | 'sells' | 'cashDistributions' | 'shareSplits' | 'demergers' | 'mathematicalShareValues'
> & {
  subscriptions: Array<Omit<OsakkeetFormData['subscriptions'][number], 'id'>>
  sells: Array<Omit<OsakkeetFormData['sells'][number], 'id'>>
  cashDistributions: Array<Omit<OsakkeetFormData['cashDistributions'][number], 'id'>>
  shareSplits: Array<Omit<OsakkeetFormData['shareSplits'][number], 'id'>>
  demergers: Array<Omit<OsakkeetFormData['demergers'][number], 'id'>>
  mathematicalShareValues: Array<Omit<OsakkeetFormData['mathematicalShareValues'][number], 'id'>>
}

export const DEFAULT_EXAMPLE_PRESET: ExamplePreset = 'medium8y'

const examplePresetConfigs: Record<ExamplePreset, ExamplePresetConfig> = {
  small2y: {
    subscriptions: [
      {
        date: '15.04.2024',
        vestingEndsOn: '',
        amount: '1200',
        pricePerShare: '2.80',
        otherTotalAcquisitionCosts: '25',
      },
      {
        date: '15.02.2025',
        vestingEndsOn: '31.12.2026',
        amount: '800',
        pricePerShare: '3.20',
        otherTotalAcquisitionCosts: '20',
      },
    ],
    sells: [],
    cashDistributions: [{ type: 'capital_return', date: '30.06.2025', amountPerShare: '0.18', shareCount: '' }],
    shareSplits: [],
    demergers: [],
    mathematicalShareValues: [
      { year: '2025', valuePerShare: '7.50' },
      { year: '2026', valuePerShare: '10.20' },
    ],
    ipo: {
      ipoDate: '15.09.2026',
      totalShareCount: '850000',
      totalIpoCost: '95000',
      currentShareValue: '10.20',
      estimatedPreIpoValue: '9000000',
      estimatedSecondaryShareSellPercentage: '3',
    },
    sell: { amount: '900', otherAnnualCapitalGainsOrLosses: '' },
  },
  medium8y: {
    subscriptions: [
      {
        date: '20.05.2018',
        vestingEndsOn: '',
        amount: '12000',
        pricePerShare: '0.85',
        otherTotalAcquisitionCosts: '120',
      },
      {
        date: '10.02.2021',
        vestingEndsOn: '',
        amount: '12000',
        pricePerShare: '8.50',
        otherTotalAcquisitionCosts: '300',
      },
    ],
    sells: [],
    cashDistributions: [
      { type: 'capital_return', date: '28.06.2022', amountPerShare: '0.12', shareCount: '' },
      { type: 'capital_return', date: '30.06.2023', amountPerShare: '0.16', shareCount: '' },
      { type: 'capital_return', date: '28.06.2024', amountPerShare: '0.22', shareCount: '' },
      { type: 'capital_return', date: '30.06.2025', amountPerShare: '0.28', shareCount: '' },
    ],
    shareSplits: [{ date: '02.01.2026', multiplier: '2' }],
    demergers: [],
    mathematicalShareValues: [
      { year: '2022', valuePerShare: '18.00' },
      { year: '2023', valuePerShare: '21.50' },
      { year: '2024', valuePerShare: '27.00' },
      { year: '2025', valuePerShare: '33.00' },
      { year: '2026', valuePerShare: '41.00' },
    ],
    ipo: {
      ipoDate: '15.09.2026',
      totalShareCount: '1960000',
      totalIpoCost: '320000',
      currentShareValue: '20.50',
      estimatedPreIpoValue: '40000000',
      estimatedSecondaryShareSellPercentage: '10',
    },
    sell: { amount: '18000', otherAnnualCapitalGainsOrLosses: '-12000' },
  },
  large16y: {
    subscriptions: [
      {
        date: '15.03.2010',
        vestingEndsOn: '',
        amount: '85000',
        pricePerShare: '0.18',
        otherTotalAcquisitionCosts: '550',
      },
      {
        date: '01.06.2021',
        vestingEndsOn: '',
        amount: '20000',
        pricePerShare: '18.00',
        otherTotalAcquisitionCosts: '800',
      },
    ],
    sells: [],
    cashDistributions: [
      { type: 'capital_return', date: '31.03.2022', amountPerShare: '0.10', shareCount: '' },
      { type: 'capital_return', date: '30.06.2023', amountPerShare: '0.14', shareCount: '' },
      { type: 'capital_return', date: '28.06.2024', amountPerShare: '0.18', shareCount: '' },
      { type: 'capital_return', date: '30.06.2025', amountPerShare: '0.24', shareCount: '' },
      { type: 'capital_return', date: '30.06.2026', amountPerShare: '0.28', shareCount: '' },
      { type: 'dividend', date: '30.09.2026', amountPerShare: '0.42', shareCount: '' },
    ],
    shareSplits: [],
    demergers: [{ date: '02.01.2024', oldCompanyRatio: '0.68' }],
    mathematicalShareValues: [
      { year: '2022', valuePerShare: '24.00' },
      { year: '2023', valuePerShare: '31.00' },
      { year: '2024', valuePerShare: '39.50' },
      { year: '2025', valuePerShare: '49.00' },
      { year: '2026', valuePerShare: '63.00' },
    ],
    ipo: {
      ipoDate: '15.09.2026',
      totalShareCount: '1050000',
      totalIpoCost: '720000',
      currentShareValue: '63.00',
      estimatedPreIpoValue: '66000000',
      estimatedSecondaryShareSellPercentage: '12',
    },
    sell: { amount: '90000', otherAnnualCapitalGainsOrLosses: '25000' },
  },
}

type CreateId = (prefix: string) => string

export function createExampleOsakkeetFormData(preset: ExamplePreset, createId: CreateId): OsakkeetFormData {
  const config = examplePresetConfigs[preset]
  return {
    subscriptions: config.subscriptions.map((row) => ({ id: createId('sub'), ...row })),
    sells: config.sells.map((row) => ({ id: createId('sell'), ...row })),
    cashDistributions: config.cashDistributions.map((row) => ({ id: createId('distribution'), ...row })),
    shareSplits: config.shareSplits.map((row) => ({ id: createId('split'), ...row })),
    demergers: config.demergers.map((row) => ({ id: createId('demerger'), ...row })),
    mathematicalShareValues: config.mathematicalShareValues.map((row) => ({ id: createId('math'), ...row })),
    ipo: { ...config.ipo },
    sell: { ...config.sell },
  }
}
