import { mergeStates, type State } from '../../../ki-frame/src'
import { b, div, h2, replaceChildren, section, span } from '../../../ki-frame/src/domBuilder'
import { calculateOsakkeet, type OsakkeetCalculation } from './osakkeetUiCalculator'
import type { OsakkeetFormData } from './osakkeetTypes'
import {
  createSectionController,
  createStorageSource,
  createStorageBackedState,
  createTextNodesFromState,
  replaceChildrenFromState,
  type TextNodesFromValue,
} from './ki-frame-extensions'
import { amount, euro } from './osakkeetFormat'
import { normalizeOsakkeetFormData } from './osakkeetFormData'
import { getOsakkeetLocalization, type Language, type OsakkeetLocalization } from './osakkeetLocalizations'
import {
  createCompanyDataPayload,
  deserializeOsakkeetFormData,
  deserializeShareableOsakkeetUrlData,
  decodeUrlState,
  isUrlCompressionSupported,
  serializeOsakkeetFormData,
  shareUrlQueryKey,
  storageKeys,
} from './osakkeetPersistence'
import { sumDecimals } from './osakkeetUtils'
import {
  createDemergersSection,
  createCashDistributionsSection,
  createSellsSection,
  createShareSplitsSection,
  createSubscriptionsSection,
} from './osakkeetUiDataSections'
import { createIpoSection, createResultsSection } from './osakkeetUiOutcomeSections'
import { createTaxSummarySection, createTopSection } from './osakkeetUiPageSections'
import { createActionButton } from './osakkeetUiUtils'
import { pageStyles } from './osakkeetUiStyles'
import { createId, createOsakkeetFormData, tryLoadLanguage } from './osakkeetUiBootstrap'

function currentModificationTimestamp() {
  return new Date().toISOString()
}

function createCompanyDataSignature(data: OsakkeetFormData) {
  return JSON.stringify(createCompanyDataPayload(normalizeOsakkeetFormData(data, createId)))
}

function createUserDataSignature(data: OsakkeetFormData) {
  const sanitized = normalizeOsakkeetFormData(data, createId)
  return JSON.stringify({
    subscriptions: sanitized.subscriptions,
    sells: sanitized.sells,
    ipoSell: sanitized.ipoSell,
  })
}

function syncLastModifiedTimestamps(dataState: State<OsakkeetFormData>) {
  let previousCompanySignature = ''
  let previousUserSignature = ''

  const initialize = (current: OsakkeetFormData) => {
    previousCompanySignature = createCompanyDataSignature(current)
    previousUserSignature = createUserDataSignature(current)
    if (current.lastModifiedCompanyData && current.lastModifiedUserData) return
    const timestamp = currentModificationTimestamp()
    dataState.set({
      ...current,
      lastModifiedCompanyData: current.lastModifiedCompanyData || timestamp,
      lastModifiedUserData: current.lastModifiedUserData || timestamp,
    })
  }

  initialize(dataState.get())

  dataState.onValueChange(
    (current) => {
      const nextCompanySignature = createCompanyDataSignature(current)
      const nextUserSignature = createUserDataSignature(current)
      const companyChanged = nextCompanySignature !== previousCompanySignature
      const userChanged = nextUserSignature !== previousUserSignature
      if (!companyChanged && !userChanged) return

      previousCompanySignature = nextCompanySignature
      previousUserSignature = nextUserSignature
      const timestamp = currentModificationTimestamp()
      dataState.set({
        ...current,
        ...(companyChanged ? { lastModifiedCompanyData: timestamp } : {}),
        ...(userChanged ? { lastModifiedUserData: timestamp } : {}),
      })
    },
    { noInit: true }
  )
}

function tryLoadWindowSavedData(): OsakkeetFormData | undefined {
  return createStorageSource<OsakkeetFormData>({
    storage: sessionStorage,
    key: storageKeys.windowFormData,
    serialize: (value) => serializeOsakkeetFormData(value, createId),
    deserialize: (raw) => deserializeOsakkeetFormData(raw, createId),
  }).load()
}

async function tryLoadSharedUrlData(): Promise<OsakkeetFormData | undefined> {
  const encoded = new URL(window.location.href).searchParams.get(shareUrlQueryKey)
  if (!encoded) return undefined
  const parsed = await decodeUrlState(encoded)
  return deserializeShareableOsakkeetUrlData(parsed, createId)
}

async function tryLoadInitialData(texts: OsakkeetLocalization) {
  const sharedUrlData = new URL(window.location.href).searchParams.get(shareUrlQueryKey)
  if (sharedUrlData) {
    try {
      const sharedData = await tryLoadSharedUrlData()
      if (sharedData) {
        return {
          data: sharedData,
          initialStatus: '',
        }
      }
    } catch {
      return {
        data: tryLoadWindowSavedData() || createOsakkeetFormData(true),
        initialStatus: isUrlCompressionSupported()
          ? texts.storage.errors.shareUrlLoadFailed
          : texts.storage.errors.shareUrlUnavailable,
      }
    }
  }

  return {
    data: tryLoadWindowSavedData() || createOsakkeetFormData(true),
    initialStatus: '',
  }
}

function createMainSectionGroup(
  key: keyof OsakkeetLocalization['mainSections']['groups'],
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  sections: OsakkeetSectionController[],
  initiallyOpen = false
) {
  let isOpen = initiallyOpen
  const metricsRoot = div({ class: 'osakkeet-main-section-metrics' }, pageStyles.mainSectionMetrics)
  const contentRoot = div(
    { class: `osakkeet-main-section-content osakkeet-main-section-content--${key}` },
    pageStyles.mainSectionContent,
    ...sections.map((sectionController) => sectionController.root)
  )
  const buttonLabelNode = document.createTextNode('')
  const toggleButton = createActionButton(pageStyles.smallButton, buttonLabelNode, 'secondary', () => {
    isOpen = !isOpen
    sync(pageReadState.get().texts)
  })

  const sync = (texts: OsakkeetLocalization) => {
    buttonLabelNode.textContent = isOpen ? texts.mainSections.actions.close : texts.mainSections.actions.open
    contentRoot.style.display = isOpen ? '' : 'none'
  }

  sync(pageReadState.get().texts)

  const root = section(
    { class: `osakkeet-main-section osakkeet-main-section--${key}` },
    pageStyles.mainSection,
    div(
      pageStyles.mainSectionHeader,
      div(pageStyles.mainSectionHeaderText, h2(localizedTextNodes.mainSections.groups[key].title), metricsRoot),
      div({ class: 'no-print' }, pageStyles.rightAlignedActions, toggleButton)
    ),
    contentRoot
  )

  replaceChildrenFromState(pageReadState, metricsRoot, ({ osakkeetCalculation, texts }) =>
    createMainSectionStats(key, osakkeetCalculation, texts).map((stat) => mainSectionMetric(stat.label, stat.value))
  )

  return createSectionController(root, ({ texts }: OsakkeetPageReadModel) => {
    sync(texts)
  })
}

type LocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization>
type OsakkeetSectionController = {
  root: Node
  set(value: OsakkeetPageReadModel): void
}

type MainSectionStat = {
  label: string
  value: string
}

function mainSectionMetric(label: string, value: string) {
  return div(
    { class: 'osakkeet-main-section-metric' },
    pageStyles.mainSectionMetric,
    span(pageStyles.mainSectionMetricLabel, label),
    b(value)
  )
}

function createMainSectionStats(
  key: keyof OsakkeetLocalization['mainSections']['groups'],
  osakkeetCalculation: OsakkeetCalculation,
  texts: OsakkeetLocalization
): MainSectionStat[] {
  if (key === 'subscriptionsAndSales') {
    return [
      {
        label: texts.subscriptions.title,
        value: `${amount(osakkeetCalculation.currentVesting.totalShares)} ${texts.mainSections.units.shares}`,
      },
      {
        label: texts.sells.title,
        value: `${osakkeetCalculation.formData.sells.length} ${texts.common.rows}`,
      },
    ]
  }

  if (key === 'distributionsAndCorporateActions') {
    const capitalReturns = osakkeetCalculation.cashDistributions.filter(
      (distribution) => distribution.type === 'capital_return'
    )
    const dividends = osakkeetCalculation.cashDistributions.filter((distribution) => distribution.type === 'dividend')
    return [
      {
        label: texts.cashDistributions.types.capitalReturn,
        value: `${capitalReturns.length} ${texts.common.rows}, ${euro(sumDecimals(capitalReturns.map((distribution) => distribution.amountPerShare)))} ${texts.mainSections.units.perShare}`,
      },
      {
        label: texts.cashDistributions.types.dividend,
        value: `${dividends.length} ${texts.common.rows}, ${euro(sumDecimals(dividends.map((distribution) => distribution.amountPerShare)))} ${texts.mainSections.units.perShare}`,
      },
      {
        label: texts.demergers.title,
        value: `${osakkeetCalculation.formData.demergers.length} ${texts.common.rows}`,
      },
      {
        label: texts.shareSplits.title,
        value: `${osakkeetCalculation.formData.shareSplits.length} ${texts.common.rows}`,
      },
    ]
  }

  if (key === 'taxReturns') {
    return [
      {
        label: texts.taxReturns.title,
        value: `${osakkeetCalculation.taxReturns.years.length} ${texts.mainSections.units.taxYears}`,
      },
    ]
  }

  return [
    {
      label: texts.ipo.title,
      value: euro(osakkeetCalculation.ipo.ipoPricePerShare),
    },
    {
      label: texts.summary.ipoSell.title,
      value: `${amount(osakkeetCalculation.ipoSell.amount)} ${texts.mainSections.units.shares}`,
    },
  ]
}

type OsakkeetPageReadModel = {
  formData: OsakkeetFormData
  languageSelection: Language
  texts: OsakkeetLocalization
  osakkeetCalculation: OsakkeetCalculation
}

function renderOsakkeetIpoCalculatorPage(
  initialData: OsakkeetFormData,
  initialLanguageSelection: Language,
  initialStatus = ''
) {
  const dataStateHandle = createStorageBackedState<OsakkeetFormData>({
    value: initialData,
    storage: sessionStorage,
    key: storageKeys.windowFormData,
    serialize: (value) => serializeOsakkeetFormData(value, createId),
    deserialize: (raw) => deserializeOsakkeetFormData(raw, createId),
    hydrate: false,
  })
  const languageSelectionStateHandle = createStorageBackedState<Language>({
    value: initialLanguageSelection,
    storage: localStorage,
    key: storageKeys.language,
    serialize: (languageSelection) => languageSelection,
    deserialize: (raw) => (raw === 'en' ? 'en' : 'fi'),
    hydrate: false,
  })
  const dataState = dataStateHandle.state
  const languageSelectionState = languageSelectionStateHandle.state
  syncLastModifiedTimestamps(dataState)
  const localizationTexts = languageSelectionState.map((languageSelection) =>
    getOsakkeetLocalization(languageSelection)
  )
  const localizedTextNodes = createTextNodesFromState(localizationTexts)
  const commonTextNodes = createTextNodesFromState(localizationTexts, { path: ['common'] })
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

  const topSection = createTopSection(
    dataState,
    pageReadState,
    languageSelectionState,
    localizedTextNodes,
    initialStatus
  )
  const subscriptionsSection = createSubscriptionsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes)
  const sellsSection = createSellsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes)
  const cashDistributionsSection = createCashDistributionsSection(
    dataState,
    pageReadState,
    localizedTextNodes,
    commonTextNodes
  )
  const demergersSection = createDemergersSection(dataState, pageReadState, localizedTextNodes, commonTextNodes)
  const shareSplitsSection = createShareSplitsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes)
  const taxSummarySectionController = createTaxSummarySection(dataState, pageReadState, localizedTextNodes)
  const ipoSection = createIpoSection(dataState, pageReadState, localizedTextNodes)
  const resultsSection = createResultsSection(dataState, pageReadState, localizedTextNodes)
  const subscriptionsAndSalesSection = createMainSectionGroup(
    'subscriptionsAndSales',
    pageReadState,
    localizedTextNodes,
    [subscriptionsSection, sellsSection]
  )
  const distributionsAndCorporateActionsSection = createMainSectionGroup(
    'distributionsAndCorporateActions',
    pageReadState,
    localizedTextNodes,
    [cashDistributionsSection, demergersSection, shareSplitsSection]
  )
  const taxReturnsSection = createMainSectionGroup('taxReturns', pageReadState, localizedTextNodes, [
    taxSummarySectionController,
  ])
  const ipoCalculatorSection = createMainSectionGroup('ipoCalculator', pageReadState, localizedTextNodes, [
    ipoSection,
    resultsSection,
  ])
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
    subscriptionsAndSalesSection.set(pageReadModel)
    distributionsAndCorporateActionsSection.set(pageReadModel)
    taxReturnsSection.set(pageReadModel)
    ipoCalculatorSection.set(pageReadModel)
  }

  pageReadState.onValueChange(applyPageReadModel)

  const initialPageReadModel = pageReadState.get()
  applyPageReadModel(initialPageReadModel)
  replaceChildren(
    root,
    topSection.root,
    subscriptionsAndSalesSection.root,
    distributionsAndCorporateActionsSection.root,
    taxReturnsSection.root,
    ipoCalculatorSection.root
  )
  return root
}

export async function osakkeetIpoCalculatorPage() {
  const initialLanguageSelection = tryLoadLanguage()
  const initialTexts = getOsakkeetLocalization(initialLanguageSelection)
  const { data, initialStatus } = await tryLoadInitialData(initialTexts)
  return renderOsakkeetIpoCalculatorPage(data, initialLanguageSelection, initialStatus)
}
