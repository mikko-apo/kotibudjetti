import Decimal from 'decimal.js'
import { b, div, h3, li, p, table, tbody, td, th, thead, tr, ul } from '../../../ki-frame/src/domBuilder'
import { replaceChildren } from '../../../ki-frame/src/domBuilder'
import type { StylesObject } from '../../../ki-frame/src/domBuilderStyles'
import { amount, createSharePercent, euro, percentage } from './osakkeetFormat'
import type { OsakkeetLocalization } from './osakkeetLocalizations'
import type { OsakkeetCalculation } from './osakkeetUiCalculator'
import { sumDecimals } from './osakkeetUtils'

type TaxReturnDistributionSection = NonNullable<OsakkeetCalculation['taxReturns']['years'][number]['unlisted']>

type SummarySectionStyles = {
  compactParagraph: StylesObject
  compactTable: StylesObject
  denseStack: StylesObject
  historyCell: StylesObject
  rowButtons: StylesObject
  summaryGrid: StylesObject
  warningBox: StylesObject
}

type SummarySectionRenderers = {
  createActionButton: (labelNode: Text, variant: 'primary' | 'secondary', onClick: () => void) => Node
  infoCard: (title: string, value: string, help?: string) => Node
  withHoverInfo: (content: string | Text | Node, tooltip: string) => Node
}

function renderAssetsTable(
  assets: OsakkeetCalculation['taxReturns']['years'][number]['assets'],
  t: OsakkeetLocalization
) {
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

function renderDistributionSharesCell(
  row: TaxReturnDistributionSection['entries'][number],
  styles: SummarySectionStyles,
  t: OsakkeetLocalization
) {
  if (row.type !== 'capital_return') {
    return amount(row.sharesHeld)
  }
  if (row.dividendShareCount.lte(0)) {
    return amount(row.capitalRepaymentShareCount)
  }
  return div(
    styles.denseStack,
    p(styles.compactParagraph, b(`${t.taxReturns.fields.distributionSharesTotal}: `), amount(row.sharesHeld)),
    p(
      styles.compactParagraph,
      b(`${t.taxReturns.fields.distributionSharesCapitalRepayment}: `),
      amount(row.capitalRepaymentShareCount)
    ),
    p(
      styles.compactParagraph,
      b(`${t.taxReturns.fields.distributionSharesDividend}: `),
      amount(row.dividendShareCount)
    )
  )
}

function renderAllocationTable(
  row: TaxReturnDistributionSection['entries'][number],
  styles: SummarySectionStyles,
  t: OsakkeetLocalization
) {
  return table(
    styles.compactTable,
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
}

function renderTaxTable(
  sectionSummary: TaxReturnDistributionSection | undefined,
  showAllocationDetails: boolean,
  styles: SummarySectionStyles,
  renderers: SummarySectionRenderers,
  t: OsakkeetLocalization
) {
  if (!sectionSummary) return false
  const { entries, totals, mode } = sectionSummary
  const capitalRepaymentHeaderNode =
    mode === 'unlisted'
      ? renderers.withHoverInfo(t.cashDistributions.fields.capitalRepayment, t.taxReturns.fields.unlistedCapitalRepaymentHelp)
      : t.cashDistributions.fields.capitalRepayment
  const dividendHeaderNode = renderers.withHoverInfo(
    t.cashDistributions.fields.dividend,
    mode === 'unlisted' ? t.taxReturns.fields.unlistedDividendHelp : t.taxReturns.fields.listedDividendHelp
  )
  const mainColumnCount = mode === 'unlisted' ? 11 : 9

  return table(
    thead(
      tr(
        th(t.common.date),
        th(t.common.type),
        th(t.taxReturns.fields.distributionShares),
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
          td(renderDistributionSharesCell(row, styles, t)),
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
          row.type === 'capital_return' &&
          tr(
            td(
              { colSpan: mainColumnCount },
              styles.historyCell,
              div(styles.denseStack, b(t.taxReturns.sections.allocationDetails), renderAllocationTable(row, styles, t))
            )
          ),
      ]),
      tr(
        td(b(t.summary.totalRow)),
        td(),
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

function renderTaxSectionWithToggle(
  title: string | Node,
  sectionSummary: TaxReturnDistributionSection | undefined,
  styles: SummarySectionStyles,
  renderers: SummarySectionRenderers,
  t: OsakkeetLocalization
) {
  if (!sectionSummary) return false
  let showAllocationDetails = false
  const labelNode = document.createTextNode(t.taxReturns.actions.showAllocationDetails)
  const toggleButton = renderers.createActionButton(labelNode, 'secondary', () => {
    showAllocationDetails = !showAllocationDetails
    sync()
  })
  const contentRoot = div(styles.denseStack)

  const sync = () => {
    labelNode.textContent = showAllocationDetails
      ? t.taxReturns.actions.hideAllocationDetails
      : t.taxReturns.actions.showAllocationDetails
    replaceChildren(contentRoot, renderTaxTable(sectionSummary, showAllocationDetails, styles, renderers, t))
  }

  sync()

  return div(
    styles.denseStack,
    h3(title),
    div({ class: 'no-print' }, styles.rowButtons, toggleButton),
    contentRoot
  )
}

function renderIpoSaleTable(ipoSale: OsakkeetCalculation['taxReturns']['years'][number]['ipoSale'], t: OsakkeetLocalization) {
  if (!ipoSale) return false
  const { summary } = ipoSale
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
      summary.usedLots.map((row) =>
        tr(
          td(row.lotDate),
          td(ipoSale.sellDate),
          td(amount(row.soldAmount)),
          td(euro(row.gross)),
          td(euro(row.actualDeduction)),
          td(euro(row.hankintamenoOlettaDeduction)),
          td(
            row.selectedMethod === 'actual_costs'
              ? t.taxReturns.fields.selectedMethodActualCosts
              : t.taxReturns.fields.selectedMethodHmo
          ),
          td(euro(row.selectedDeduction)),
          td(euro(row.taxableGain))
        )
      ),
      tr(
        td(b(t.summary.totalRow)),
        td(),
        td(amount(sumDecimals(summary.usedLots.map((row) => row.soldAmount)))),
        td(euro(summary.grossTotal)),
        td(euro(sumDecimals(summary.usedLots.map((row) => row.actualDeduction)))),
        td(euro(sumDecimals(summary.usedLots.map((row) => row.hankintamenoOlettaDeduction)))),
        td(),
        td(euro(summary.selectedDeductionTotal)),
        td(euro(summary.taxableGainTotal))
      )
    )
  )
}

export function createTaxSummaryContent(
  calculation: OsakkeetCalculation,
  t: OsakkeetLocalization,
  styles: SummarySectionStyles,
  renderers: SummarySectionRenderers
) {
  const years = calculation.taxReturns.years
  if (years.length === 0) return false

  return div(
    years.map((yearSummary) =>
      div(
        styles.denseStack,
        h3(String(yearSummary.year)),
        yearSummary.missingMathematicalValueWarningDates.length > 0 &&
          div(
            styles.warningBox,
            ul(
              yearSummary.missingMathematicalValueWarningDates.map((date) =>
                li(`${date}: ${t.taxReturns.yearWarningMissingMathValue}`)
              )
            )
          ),
        yearSummary.assets && div(styles.denseStack, h3(t.taxReturns.sections.assets), renderAssetsTable(yearSummary.assets, t)),
        yearSummary.unlisted &&
          renderTaxSectionWithToggle(
            renderers.withHoverInfo(t.taxReturns.sections.unlisted, t.taxReturns.sections.unlistedHelp),
            yearSummary.unlisted,
            styles,
            renderers,
            t
          ),
        yearSummary.listed &&
          renderTaxSectionWithToggle(t.taxReturns.sections.listed, yearSummary.listed, styles, renderers, t),
        yearSummary.ipoSale &&
          div(
            styles.denseStack,
            h3(t.taxReturns.sections.ipoSale),
            renderIpoSaleTable(yearSummary.ipoSale, t),
            div(
              styles.summaryGrid,
              renderers.infoCard(t.summary.ipoSell.cards.ipoCostsAllocated, euro(yearSummary.ipoSale.summary.totalAllocatedSellCost)),
              renderers.infoCard(t.summary.ipoSell.cards.taxMan, euro(yearSummary.ipoSale.summary.estimatedTax)),
              renderers.infoCard(t.summary.ipoSell.cards.netCash, euro(yearSummary.ipoSale.summary.netAfterTaxAndSellCost))
            )
          )
      )
    )
  )
}

export function createSellOverviewCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, infoCard: SummarySectionRenderers['infoCard']) {
  const sharePercent = createSharePercent(osakkeetCalculation.vesting.totalShares)
  const ipoDate = osakkeetCalculation.formData.ipo.ipoDate
  return [
    infoCard(
      ipoDate ? texts.summary.ipoSell.cards.sellableSharesAtDate(ipoDate) : texts.summary.ipoSell.cards.sellableShares,
      sharePercent(osakkeetCalculation.vesting.vestedShares)
    ),
    infoCard(
      ipoDate ? texts.summary.ipoSell.cards.unvestedSharesAtDate(ipoDate) : texts.summary.ipoSell.cards.unvestedShares,
      sharePercent(osakkeetCalculation.vesting.unvestedShares)
    ),
    infoCard(texts.summary.ipoSell.cards.sharesLeft, amount(osakkeetCalculation.ipoSell.remainingUnsoldShares)),
  ]
}

export function createSellAllocationTable(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, withHoverInfo: SummarySectionRenderers['withHoverInfo']) {
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
      osakkeetCalculation.ipoSell.usedLots.map((lot) =>
        tr(
          td(lot.lotDate || '-'),
          td(`${amount(lot.soldAmount)} / ${amount(lot.totalLotShares)}`),
          td(euro(lot.gross)),
          td(
            withHoverInfo(
              euro(lot.actualDeduction),
              texts.summary.ipoSell.tooltips.actualCosts(
                euro(lot.realCostBasis),
                euro(lot.allocatedSellCost),
                euro(lot.actualDeduction)
              )
            )
          ),
          td(
            withHoverInfo(
              euro(lot.hankintamenoOlettaDeduction),
              texts.summary.ipoSell.tooltips.hmo(
                euro(lot.gross),
                percentage(lot.hankintamenoOlettaRate.mul(100)),
                euro(lot.hankintamenoOlettaDeduction)
              )
            )
          ),
          td(lot.taxableGain.gte(0) ? euro(lot.taxableGain) : `${lot.taxableGain.toFixed(2)} €`)
        )
      ),
      tr(
        td(b(texts.summary.totalRow)),
        td(),
        td(euro(osakkeetCalculation.ipoSell.grossTotal)),
        td(b(euro(osakkeetCalculation.ipoSell.selectedActualDeductionTotal))),
        td(b(euro(osakkeetCalculation.ipoSell.selectedHmoDeductionTotal))),
        td(euro(osakkeetCalculation.ipoSell.taxableGainTotal))
      ),
    ])
  )
}

export function createSellExplanationCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, infoCard: SummarySectionRenderers['infoCard']) {
  return [
    infoCard(
      texts.summary.ipoSell.explanations.ipoPriceTotal,
      euro(osakkeetCalculation.ipoSell.grossTotal),
      texts.summary.ipoSell.explanations.ipoPriceTotalHelp(euro(osakkeetCalculation.ipoSell.grossTotal))
    ),
    infoCard(
      texts.summary.ipoSell.explanations.ipoCostsAllocated,
      euro(osakkeetCalculation.ipoSell.totalAllocatedSellCost),
      texts.summary.ipoSell.explanations.ipoCostsAllocatedHelp(euro(osakkeetCalculation.ipoSell.totalAllocatedSellCost))
    ),
    infoCard(
      texts.summary.ipoSell.explanations.netCash,
      euro(osakkeetCalculation.ipoSell.cashAfterSellCosts),
      texts.summary.ipoSell.explanations.netCashHelp(
        euro(osakkeetCalculation.ipoSell.grossTotal),
        euro(osakkeetCalculation.ipoSell.totalAllocatedSellCost),
        euro(osakkeetCalculation.ipoSell.cashAfterSellCosts)
      )
    ),
  ]
}

export function createCapitalGainCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, infoCard: SummarySectionRenderers['infoCard']) {
  return [
    infoCard(
      texts.summary.ipoSell.capitalGainAnnualTax.driversTitle,
      texts.summary.ipoSell.capitalGainAnnualTax.driversValue,
      texts.summary.ipoSell.capitalGainAnnualTax.driversHelp
    ),
    infoCard(
      texts.summary.ipoSell.explanations.selectedDeductions,
      euro(osakkeetCalculation.ipoSell.selectedDeductionTotal),
      texts.summary.ipoSell.explanations.selectedDeductionsHelp(
        euro(osakkeetCalculation.ipoSell.selectedActualDeductionTotal),
        euro(osakkeetCalculation.ipoSell.selectedHmoDeductionTotal)
      )
    ),
    infoCard(
      texts.summary.ipoSell.explanations.capitalGain,
      euro(osakkeetCalculation.ipoSell.taxableGainTotal),
      texts.summary.ipoSell.explanations.capitalGainHelp(
        euro(osakkeetCalculation.ipoSell.grossTotal),
        euro(osakkeetCalculation.ipoSell.selectedDeductionTotal)
      )
    ),
    infoCard(
      texts.summary.ipoSell.explanations.taxOnCapitalGain,
      euro(osakkeetCalculation.ipoSell.estimatedTax),
      texts.summary.ipoSell.explanations.taxOnCapitalGainHelp(
        euro(osakkeetCalculation.ipoSell.taxableGainTotal),
        euro(osakkeetCalculation.ipoSell.taxableGainAtLowRate),
        euro(osakkeetCalculation.ipoSell.taxableGainAtHighRate),
        euro(osakkeetCalculation.ipoSell.estimatedTax)
      )
    ),
  ]
}

export function createCashReserveCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, infoCard: SummarySectionRenderers['infoCard']) {
  const keepAfterTaxesPercentage = osakkeetCalculation.ipoSell.grossTotal.gt(0)
    ? ` (${percentage(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost.div(osakkeetCalculation.ipoSell.grossTotal).mul(100))})`
    : ''
  return [
    infoCard(
      texts.summary.ipoSell.cashReserve.keepAfterTaxes,
      `${euro(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost)}${keepAfterTaxesPercentage}`,
      texts.summary.ipoSell.cashReserve.keepAfterTaxesHelp(
        euro(osakkeetCalculation.ipoSell.cashAfterSellCosts),
        euro(osakkeetCalculation.ipoSell.estimatedTax),
        euro(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost)
      )
    ),
    infoCard(
      texts.summary.ipoSell.cashReserve.reserveForTaxes,
      euro(osakkeetCalculation.ipoSell.estimatedTax),
      texts.summary.ipoSell.cashReserve.reserveForTaxesHelp(euro(osakkeetCalculation.ipoSell.estimatedTax))
    ),
    infoCard(
      texts.summary.ipoSell.cashReserve.taxPaymentStatus,
      texts.summary.ipoSell.cashReserve.taxPaymentManual,
      texts.summary.ipoSell.cashReserve.taxPaymentStatusHelp
    ),
  ]
}

export function createSaleResultComparisonCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, infoCard: SummarySectionRenderers['infoCard']) {
  const netResultPercent = osakkeetCalculation.ipoSell.soldShareAcquisitionCostTotal.gt(0)
    ? percentage(
        osakkeetCalculation.ipoSell.netResultAgainstAcquisitionCost
          .div(osakkeetCalculation.ipoSell.soldShareAcquisitionCostTotal)
          .mul(100)
      )
    : '0.00 %'
  return [
    infoCard(
      texts.summary.ipoSell.saleResultComparison.cardTitle,
      texts.summary.ipoSell.saleResultComparison.value(
        euro(osakkeetCalculation.ipoSell.soldShareOriginalCostTotal),
        euro(osakkeetCalculation.ipoSell.soldShareAcquisitionCostTotal),
        euro(osakkeetCalculation.ipoSell.netResultAgainstAcquisitionCost),
        netResultPercent
      ),
      texts.summary.ipoSell.saleResultComparison.help(
        euro(osakkeetCalculation.ipoSell.soldShareOriginalCostTotal),
        euro(osakkeetCalculation.ipoSell.soldShareAcquisitionCostTotal),
        euro(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost),
        euro(osakkeetCalculation.ipoSell.netResultAgainstAcquisitionCost),
        netResultPercent
      )
    ),
  ]
}

export function createIpoCostEffectCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, infoCard: SummarySectionRenderers['infoCard']) {
  return [
    infoCard(
      texts.summary.ipoSell.explanations.deductibleIpoCosts,
      euro(osakkeetCalculation.ipoSell.taxSavedFromDeductibleSellCosts),
      texts.summary.ipoSell.explanations.deductibleIpoCostsHelp(
        euro(osakkeetCalculation.ipoSell.sellCostDeductedViaActual),
        euro(osakkeetCalculation.ipoSell.taxSavedFromDeductibleSellCosts)
      )
    ),
    infoCard(
      texts.summary.ipoSell.explanations.hmoIpoCosts,
      euro(osakkeetCalculation.ipoSell.sellCostPaidWithoutActualDeduction),
      texts.summary.ipoSell.explanations.hmoIpoCostsHelp()
    ),
  ]
}

export function createAnnualAdjustmentCards(osakkeetCalculation: OsakkeetCalculation, texts: OsakkeetLocalization, infoCard: SummarySectionRenderers['infoCard']) {
  const zeroMoney = osakkeetCalculation.ipoSell.grossTotal.mul(0)
  const annualKeepAfterTaxesPercentage = osakkeetCalculation.ipoSell.grossTotal.gt(0)
    ? ` (${percentage(osakkeetCalculation.ipoSell.netAfterAnnualTaxAndSellCost.div(osakkeetCalculation.ipoSell.grossTotal).mul(100))})`
    : ''
  return {
    taxEffect: infoCard(
      texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapital,
      osakkeetCalculation.ipoSell.taxReductionFromOtherLosses.gt(0)
        ? euro(osakkeetCalculation.ipoSell.taxReductionFromOtherLosses)
        : osakkeetCalculation.ipoSell.annualTaxChange.gt(0)
          ? `+${euro(osakkeetCalculation.ipoSell.annualTaxChange)}`
          : euro(zeroMoney),
      texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapitalHelp(
        euro(osakkeetCalculation.ipoSell.otherAnnualCapitalGainsOrLosses),
        euro(osakkeetCalculation.ipoSell.taxReductionFromOtherLosses),
        euro(Decimal.max(osakkeetCalculation.ipoSell.annualTaxChange, zeroMoney))
      )
    ),
    reserve: infoCard(
      texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxes,
      euro(osakkeetCalculation.ipoSell.annualEstimatedTax),
      texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxesHelp(
        euro(osakkeetCalculation.ipoSell.annualEstimatedTax)
      )
    ),
    keep: infoCard(
      texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxes,
      `${euro(osakkeetCalculation.ipoSell.netAfterAnnualTaxAndSellCost)}${annualKeepAfterTaxesPercentage}`,
      texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxesHelp(
        euro(osakkeetCalculation.ipoSell.cashAfterSellCosts),
        euro(osakkeetCalculation.ipoSell.annualEstimatedTax),
        euro(osakkeetCalculation.ipoSell.netAfterAnnualTaxAndSellCost)
      )
    ),
  }
}
