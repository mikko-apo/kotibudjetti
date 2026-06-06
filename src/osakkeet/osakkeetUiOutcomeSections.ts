import { type State } from '../../../ki-frame/src'
import { b, div, h2, h3, label, li, section, span, ul } from '../../../ki-frame/src/domBuilder'
import { amount, euro, multiplier, percentage } from './osakkeetFormat'
import {
  createComputedTextState,
  createFormBinder,
  createSectionController,
  replaceChildrenFromState,
  type TextNodesFromValue,
} from './ki-frame-extensions'
import type { Language, OsakkeetLocalization } from './osakkeetLocalizations'
import type { OsakkeetCalculation } from './osakkeetUiCalculator'
import type { OsakkeetFormData } from './osakkeetTypes'
import {
  createAnnualAdjustmentCards,
  createCapitalGainCards,
  createCashReserveCards,
  createIpoCostEffectCards,
  createSaleResultComparisonCards,
  createSellAllocationTable,
  createSellExplanationCards,
  createSellOverviewCards,
} from './osakkeetUiSummarySections'
import { pageStyles } from './osakkeetUiStyles'
import { infoCard, numberInput, withHoverInfo } from './osakkeetUiUtils'

type LocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization>
type OsakkeetPageReadModel = {
  formData: OsakkeetFormData
  languageSelection: Language
  texts: OsakkeetLocalization
  osakkeetCalculation: OsakkeetCalculation
}

export function createIpoSection(
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

  const currentShareValueInput = numberInput(pageStyles.input, '')
  const totalShareCountInput = numberInput(pageStyles.input, '')
  const estimatedPreIpoValueInput = numberInput(pageStyles.input, '')
  const totalIpoCostInput = numberInput(pageStyles.input, '')
  const secondarySellPercentInput = numberInput(pageStyles.input, '')
  formBinder.bindInputs([
    { path: ['ipo', 'currentShareValue'], node: currentShareValueInput },
    { path: ['ipo', 'totalShareCount'], node: totalShareCountInput },
    { path: ['ipo', 'estimatedPreIpoValue'], node: estimatedPreIpoValueInput },
    { path: ['ipo', 'totalIpoCost'], node: totalIpoCostInput },
    { path: ['ipo', 'estimatedSecondaryShareSellPercentage'], node: secondarySellPercentInput },
  ])

  const root = section(
    { class: 'card' },
    h2(ipoTextNodes.title),
    h3(ipoTextNodes.sections.currentCompany),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(ipoTextNodes.fields.currentShareValue), currentShareValueInput),
      div(pageStyles.field, label(ipoTextNodes.fields.totalShareCount), totalShareCountInput),
      div(pageStyles.field, label(ipoTextNodes.fields.currentTotalValue), b(valueNodes.currentTotalValue)),
      div(pageStyles.field, label(summaryCardTextNodes.subscribedShares), b(valueNodes.subscribedShares))
    ),
    h3(ipoTextNodes.sections.sharePriceEstimate),
    div(
      pageStyles.gridTwo,
      div(pageStyles.field, label(ipoTextNodes.fields.estimatedPreIpoValue), estimatedPreIpoValueInput),
      div(pageStyles.field, label(ipoTextNodes.fields.ipoSharePrice), b(valueNodes.ipoSharePrice)),
      div(pageStyles.field, label(ipoTextNodes.fields.increasePercent), b(valueNodes.increasePercent)),
      div(pageStyles.field, label(ipoTextNodes.fields.increaseMultiplier), b(valueNodes.increaseMultiplier))
    ),
    h3(ipoTextNodes.sections.ipoCostEstimate),
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
    )
  )

  return createSectionController(root, () => {})
}

export function createResultsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes
) {
  const formBinder = createFormBinder(dataState)
  const warningRoot = div()
  const summaryTextNodes = localizedTextNodes.summary
  const annualAdjustmentTaxEffectRoot = div()
  const annualAdjustmentReserveRoot = div()
  const annualAdjustmentKeepRoot = div()
  const sellInput = numberInput(pageStyles.input, '')
  const sellPricePerShareInput = numberInput(pageStyles.input, '')
  const sellCostPerShareInput = numberInput(pageStyles.input, '')
  const otherAnnualCapitalInput = numberInput(pageStyles.input, '')
  const ipoSellInputHelpNodes = createComputedTextState(pageReadState, ({ osakkeetCalculation, texts }) => ({
    sharesToSellShareOfSellable: texts.summary.ipoSell.fields.sharesToSellShareOfSellable(
      osakkeetCalculation.vesting.vestedShares.gt(0)
        ? percentage(osakkeetCalculation.ipoSell.amount.div(osakkeetCalculation.vesting.vestedShares).mul(100))
        : '0.00 %'
    ),
  })).textNodes
  const ipoSellOverviewRoot = div()
  const ipoSellDetailsRoot = div(pageStyles.denseStack)
  const annualAdjustmentSectionRoot = div()
  const annualAdjustmentCardsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    createAnnualAdjustmentCards(osakkeetCalculation, texts, (title, value, help) =>
      infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help)
    )
  )
  formBinder.bindInputs([
    { path: ['ipoSell', 'amount'], node: sellInput },
    { path: ['ipoSell', 'pricePerShare'], node: sellPricePerShareInput },
    { path: ['ipoSell', 'costPerShare'], node: sellCostPerShareInput },
    { path: ['ipoSell', 'otherAnnualCapitalGainsOrLosses'], node: otherAnnualCapitalInput },
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
  annualAdjustmentSectionRoot.append(annualAdjustmentRoot)
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
  replaceChildrenFromState(pageReadState, ipoSellOverviewRoot, ({ osakkeetCalculation, texts }) => [
    div(
      pageStyles.summaryGrid,
      createSellOverviewCards(osakkeetCalculation, texts, (title, value, help) =>
        infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help)
      )
    ),
  ])
  replaceChildrenFromState(pageReadState, ipoSellDetailsRoot, ({ osakkeetCalculation, texts }) => {
    const hasUsableIpoSellCalculation = osakkeetCalculation.ipoSell.usedLots.length > 0
    return [
      hasUsableIpoSellCalculation && h3(texts.summary.allocationByLot.title),
      hasUsableIpoSellCalculation &&
        createSellAllocationTable(osakkeetCalculation, texts, (content, tooltip) =>
          withHoverInfo(pageStyles.hoverInfo, pageStyles.hoverInfoIcon, content, tooltip)
        ),
      hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.explanations.title),
      hasUsableIpoSellCalculation &&
        div(
          pageStyles.summaryGrid,
          createSellExplanationCards(osakkeetCalculation, texts, (title, value, help) =>
            infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help)
          )
        ),
      hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.capitalGainAnnualTax.title),
      hasUsableIpoSellCalculation &&
        div(
          pageStyles.summaryGrid,
          createCapitalGainCards(osakkeetCalculation, texts, (title, value, help) =>
            infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help)
          )
        ),
      hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.cashReserve.title),
      hasUsableIpoSellCalculation &&
        div(
          pageStyles.summaryGrid,
          createCashReserveCards(osakkeetCalculation, texts, (title, value, help) =>
            infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help)
          )
        ),
      hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.saleResultComparison.title),
      hasUsableIpoSellCalculation &&
        div(
          pageStyles.summaryGrid,
          createSaleResultComparisonCards(osakkeetCalculation, texts, (title, value, help) =>
            infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help)
          )
        ),
      hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.ipoCostEffects.title),
      hasUsableIpoSellCalculation &&
        div(
          pageStyles.summaryGrid,
          createIpoCostEffectCards(osakkeetCalculation, texts, (title, value, help) =>
            infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help)
          )
        ),
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
      ipoSellOverviewRoot,
      div(
        pageStyles.gridTwo,
        div(
          pageStyles.compactField,
          div(
            pageStyles.field,
            label(summaryTextNodes.ipoSell.fields.sharesToSell),
            sellInput,
            span({ class: 'muted' }, ipoSellInputHelpNodes.sharesToSellShareOfSellable)
          )
        ),
        div(
          pageStyles.compactField,
          div(pageStyles.field, label(summaryTextNodes.ipoSell.fields.ipoPricePerShare), sellPricePerShareInput)
        ),
        div(
          pageStyles.compactField,
          div(pageStyles.field, label(summaryTextNodes.ipoSell.fields.ipoCostPerShare), sellCostPerShareInput)
        )
      ),
      warningRoot,
      ipoSellDetailsRoot,
      annualAdjustmentSectionRoot
    )
  )

  return createSectionController(root, ({ osakkeetCalculation }: OsakkeetPageReadModel) => {
    annualAdjustmentRoot.style.display = osakkeetCalculation.ipoSell.usedLots.length > 0 ? '' : 'none'
  })
}
