import { type State } from '../../../ki-frame/src'
import { div, h2, h3, p, replaceChildren, section, span, table, tbody, td, th, thead, tr } from '../../../ki-frame/src/domBuilder'
import { setStyle } from '../../../ki-frame/src/domBuilderStyles'
import { amount, euro } from './osakkeetFormat'
import { createAppendCollectionRow } from './osakkeetFormData'
import {
  createEditableCollectionTable,
  createOptionBoundSelect,
  createSectionController,
  createSectionCounter,
  createStateCollectionEditor,
  replaceChildrenFromState,
  type TextNodesFromValue,
} from './ki-frame-extensions'
import type { OsakkeetLocalization, Language } from './osakkeetLocalizations'
import type { OsakkeetCalculation } from './osakkeetUiCalculator'
import type { OsakkeetFormData } from './osakkeetTypes'
import {
  createCollectionAppendEditButton,
  createEditableRowManager,
  createRowActionButtons,
  toggleSetMembership,
  withRowActionLabels,
  withSummaryRows,
  type EditableCellBinding,
} from './osakkeetUiTableHelpers'
import { sortRowsByDate } from './osakkeetUtils'
import {
  createActionButton,
  createRemoveButton,
  finnishDateInput,
  hoverValue,
  infoCard,
  numberInput,
  setInputValue,
  withHoverInfo,
} from './osakkeetUiUtils'
import {
  createSubscriptionHistoryTooltip,
  createSubscriptionHistoryRows,
  createSubscriptionsSummaryCards,
  type SubscriptionHistoryRow,
} from './osakkeetUiSummary'
import { pageStyles } from './osakkeetUiStyles'

type LocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization>
type CommonLocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization['common']>
type OsakkeetPageReadModel = {
  formData: OsakkeetFormData
  languageSelection: Language
  texts: OsakkeetLocalization
  osakkeetCalculation: OsakkeetCalculation
}

export function createSellsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const sellTextNodes = localizedTextNodes.sells
  const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    withRowActionLabels(sortRowsByDate(osakkeetCalculation.formData.sells), texts)
  )
  const sells = createStateCollectionEditor(dataState, ['sells'])
  const editingRowIds = new Set<string>()
  const tbodyNode = createEditableCollectionTable({
    rowsState,
    createRemoveButton: (labelNode, remove) => createRemoveButton(pageStyles.smallButton, labelNode, remove),
    remove: sells.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(pageStyles.input, row.date, (value) => {
        sells.patch(row.id, { date: value })
      })
      const shareCountInput = numberInput(pageStyles.input, row.shareCount, (value) => {
        sells.patch(row.id, { shareCount: value })
      })
      const sellPriceInput = numberInput(pageStyles.input, row.sellPrice, (value) => {
        sells.patch(row.id, { sellPrice: value })
      })
      const pricePerShareInput = numberInput(pageStyles.input, row.pricePerShare || '', (value) => {
        sells.patch(row.id, { pricePerShare: value })
      })
      const dateCell = td()
      const shareCountCell = td()
      const sellPriceCell = td()
      const pricePerShareCell = td()
      const bindings: Array<EditableCellBinding<typeof row>> = [
        {
          cell: dateCell,
          editNode: div(pageStyles.compactField, dateInput),
          readValue: (nextRow) => nextRow.date,
          setEditValue: (nextRow) => setInputValue(dateInput, nextRow.date),
        },
        {
          cell: shareCountCell,
          editNode: div(pageStyles.compactField, shareCountInput),
          readValue: (nextRow) => nextRow.shareCount,
          setEditValue: (nextRow) => setInputValue(shareCountInput, nextRow.shareCount),
        },
        {
          cell: sellPriceCell,
          editNode: div(pageStyles.compactField, sellPriceInput),
          readValue: (nextRow) => nextRow.sellPrice,
          setEditValue: (nextRow) => setInputValue(sellPriceInput, nextRow.sellPrice),
        },
        {
          cell: pricePerShareCell,
          editNode: div(pageStyles.compactField, pricePerShareInput),
          readValue: (nextRow) => nextRow.pricePerShare || '',
          setEditValue: (nextRow) => setInputValue(pricePerShareInput, nextRow.pricePerShare || ''),
        },
      ]
      const editableRow = createEditableRowManager(row, editingRowIds, bindings, (labelNode, variant, onClick) =>
        createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
      )
      editableRow.sync(row)
      const rowNode = tr(
        dateCell,
        shareCountCell,
        sellPriceCell,
        pricePerShareCell,
        td(
          { class: 'no-print' },
          createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
        )
      )
      editableRow.attachDoubleClickEdit(rowNode)
      return {
        node: rowNode,
        set: editableRow.set,
      }
    },
  })

  const addButton = createCollectionAppendEditButton(
    sells,
    editingRowIds,
    sellTextNodes.actions.add,
    () => ({
      date: '',
      shareCount: '',
      sellPrice: '',
      pricePerShare: '',
    }),
    (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
  )

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

export function createSubscriptionsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const openHistorySubscriptionIds = new Set<string>()
  const counter = createSectionCounter()
  const subscriptionTextNodes = localizedTextNodes.subscriptions
  const summaryRoot = div(pageStyles.summaryGrid)
  const vestingEndsOnHeaderNode = withHoverInfo(
    pageStyles.hoverInfo,
    pageStyles.hoverInfoIcon,
    subscriptionTextNodes.fields.vestingEndsOn,
    ''
  )
  const otherTotalAcquisitionCostsHeaderNode = withHoverInfo(
    pageStyles.hoverInfo,
    pageStyles.hoverInfoIcon,
    subscriptionTextNodes.fields.otherTotalAcquisitionCosts,
    ''
  )
  const totalReimbursementsHeaderNode = withHoverInfo(
    pageStyles.hoverInfo,
    pageStyles.hoverInfoIcon,
    subscriptionTextNodes.fields.totalReimbursements,
    ''
  )
  const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    withSummaryRows(
      sortRowsByDate(osakkeetCalculation.formData.subscriptions),
      osakkeetCalculation.subscriptions,
      texts
    )
  )
  const subscriptions = createStateCollectionEditor(dataState, ['subscriptions'])
  const editingRowIds = new Set<string>()
  const tbodyNode = createEditableCollectionTable({
    rowsState,
    createRemoveButton: (labelNode, remove) => createRemoveButton(pageStyles.smallButton, labelNode, remove),
    remove: subscriptions.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(pageStyles.input, row.formRow.date, (value) => {
        subscriptions.patch(row.id, { date: value })
      })
      const vestingEndsOnInput = finnishDateInput(pageStyles.input, row.formRow.vestingEndsOn || '', (value) => {
        subscriptions.patch(row.id, { vestingEndsOn: value })
      })
      const amountInput = numberInput(pageStyles.input, row.formRow.amount, (value) => {
        subscriptions.patch(row.id, { amount: value })
      })
      const pricePerShareInput = numberInput(pageStyles.input, row.formRow.pricePerShare || '', (value) => {
        subscriptions.patch(row.id, { pricePerShare: value })
      })
      const otherTotalAcquisitionCostsInput = numberInput(
        pageStyles.input,
        row.formRow.otherTotalAcquisitionCosts || '',
        (value) => {
          subscriptions.patch(row.id, { otherTotalAcquisitionCosts: value })
        }
      )
      const dateCell = td()
      const vestingEndsOnCell = td()
      const amountCell = td()
      const pricePerShareCell = td()
      const otherTotalAcquisitionCostsCell = td()
      const totalPricePerShareCell = td()
      const capitalRepaymentPerShareCell = td()
      const remainingCostPerShareCell = td()
      const capitalRepaymentTotalCell = td()
      const toggleHistory = (subscriptionId: string) => {
        toggleSetMembership(openHistorySubscriptionIds, subscriptionId)
      }
      const bindings: Array<EditableCellBinding<typeof row>> = [
        {
          cell: dateCell,
          editNode: dateInput,
          readValue: (nextRow) => nextRow.formRow.date,
          setEditValue: (nextRow) => setInputValue(dateInput, nextRow.formRow.date),
        },
        {
          cell: vestingEndsOnCell,
          editNode: vestingEndsOnInput,
          readValue: (nextRow) => nextRow.formRow.vestingEndsOn || '',
          setEditValue: (nextRow) => setInputValue(vestingEndsOnInput, nextRow.formRow.vestingEndsOn || ''),
        },
        {
          cell: amountCell,
          editNode: amountInput,
          readValue: (nextRow) => nextRow.formRow.amount,
          setEditValue: (nextRow) => setInputValue(amountInput, nextRow.formRow.amount),
        },
        {
          cell: pricePerShareCell,
          editNode: pricePerShareInput,
          readValue: (nextRow) => nextRow.formRow.pricePerShare || '',
          setEditValue: (nextRow) => setInputValue(pricePerShareInput, nextRow.formRow.pricePerShare || ''),
        },
        {
          cell: otherTotalAcquisitionCostsCell,
          editNode: otherTotalAcquisitionCostsInput,
          readValue: (nextRow) => nextRow.formRow.otherTotalAcquisitionCosts || '',
          setEditValue: (nextRow) =>
            setInputValue(otherTotalAcquisitionCostsInput, nextRow.formRow.otherTotalAcquisitionCosts || ''),
        },
      ]
      const historyContainer = div()
      const detailRow = tr(td({ colSpan: 11 }, pageStyles.historyCell, historyContainer))
      const syncSummaryCells = (nextRow: typeof row) => {
        replaceChildren(
          totalPricePerShareCell,
          nextRow.summary
            ? euro(
                nextRow.summary.shareCount.gt(0)
                  ? nextRow.summary.baseShareAcquisitionCost.div(nextRow.summary.shareCount)
                  : nextRow.summary.baseShareAcquisitionCost.mul(0)
              )
            : '-'
        )
        replaceChildren(capitalRepaymentTotalCell, nextRow.summary ? euro(nextRow.summary.capitalRepaymentTotal) : '-')
        replaceChildren(
          capitalRepaymentPerShareCell,
          nextRow.summary
            ? euro(
                nextRow.summary.shareCount.gt(0)
                  ? nextRow.summary.capitalRepaymentTotal.div(nextRow.summary.shareCount)
                  : nextRow.summary.capitalRepaymentTotal.mul(0)
              )
            : '-'
        )
        replaceChildren(
          remainingCostPerShareCell,
          nextRow.summary
            ? euro(
                nextRow.summary.shareCount.gt(0)
                  ? nextRow.summary.shareAcquisitionCost.div(nextRow.summary.shareCount)
                  : nextRow.summary.shareAcquisitionCost.mul(0)
              )
            : '-'
        )
      }
      const editableRow = createEditableRowManager(
        row,
        editingRowIds,
        bindings,
        (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick),
        (nextRow) => {
          syncSummaryCells(nextRow)
        }
      )
      const historyButton = createActionButton(
        pageStyles.smallButton,
        document.createTextNode(row.texts.subscriptions.history.show),
        'secondary',
        () => {
          toggleHistory(editableRow.getCurrentRow().id)
          syncHistoryVisibility(editableRow.getCurrentRow())
        }
      )
      const rowNode = tr(
        dateCell,
        vestingEndsOnCell,
        amountCell,
        pricePerShareCell,
        otherTotalAcquisitionCostsCell,
        totalPricePerShareCell,
        capitalRepaymentPerShareCell,
        remainingCostPerShareCell,
        capitalRepaymentTotalCell,
        td({ class: 'no-print' }, historyButton),
        td(
          { class: 'no-print' },
          createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
        )
      )
      editableRow.sync(row)
      rowNode.addEventListener('dblclick', () => {
        toggleHistory(editableRow.getCurrentRow().id)
        syncHistoryVisibility(editableRow.getCurrentRow())
      })

      const renderHistoryTable = (historyRows: SubscriptionHistoryRow[], texts: OsakkeetLocalization) =>
        table(
          pageStyles.historyTable,
          thead(
            tr(
              th(pageStyles.historyTableCell, texts.subscriptions.history.fields.date),
              th(pageStyles.historyTableCell, texts.subscriptions.history.fields.event),
              th(pageStyles.historyTableCell, texts.subscriptions.history.fields.shareCount),
              th(pageStyles.historyTableCell, texts.subscriptions.history.fields.shareCost),
              th(pageStyles.historyTableCell, texts.subscriptions.history.fields.pricePerShare),
              th(pageStyles.historyTableCell, texts.subscriptions.history.fields.details)
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
              : [tr(td({ colSpan: 6 }, pageStyles.historyTableCell, texts.subscriptions.history.empty))]
          )
        )

      const syncHistoryVisibility = (nextRow: typeof row) => {
        const historyRows = createSubscriptionHistoryRows(nextRow.summary, nextRow.texts)
        const historyTooltip = createSubscriptionHistoryTooltip(historyRows, nextRow.texts)
        const isHistoryOpen = openHistorySubscriptionIds.has(nextRow.id)
        historyButton.textContent = isHistoryOpen
          ? nextRow.texts.subscriptions.history.hide
          : nextRow.texts.subscriptions.history.show
        historyButton.title = historyTooltip
        detailRow.style.display = isHistoryOpen ? '' : 'none'
        if (isHistoryOpen) {
          replaceChildren(historyContainer, renderHistoryTable(historyRows, nextRow.texts))
        }
      }

      const fragment = document.createDocumentFragment()
      fragment.append(rowNode, detailRow)
      syncSummaryCells(row)
      syncHistoryVisibility(row)

      return {
        node: fragment,
        set(nextRow) {
          editableRow.set(nextRow)
          syncHistoryVisibility(nextRow)
        },
      }
    },
  })

  const addButton = createCollectionAppendEditButton(
    subscriptions,
    editingRowIds,
    subscriptionTextNodes.actions.add,
    () => createAppendCollectionRow('subscriptions'),
    (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
  )

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
      (title, value, help) => infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help),
      osakkeetCalculation.currentVesting.totalShares,
      osakkeetCalculation.currentVesting.vestedShares,
      osakkeetCalculation.currentVesting.unvestedShares,
      new Date(),
      texts
    )
  )

  return createSectionController(root, ({ osakkeetCalculation, texts }: OsakkeetPageReadModel) => {
    const current = osakkeetCalculation.formData
    counter.setCount(current.subscriptions.length, texts.common.rows)
    ;(vestingEndsOnHeaderNode as HTMLElement).title = texts.subscriptions.fields.vestingEndsOnHelp
    ;(otherTotalAcquisitionCostsHeaderNode as HTMLElement).title = texts.subscriptions.fields.otherTotalAcquisitionCostsHelp
    ;(totalReimbursementsHeaderNode as HTMLElement).title = texts.subscriptions.fields.totalReimbursementsHelp
  })
}

export function createCashDistributionsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const cashDistributionTextNodes = localizedTextNodes.cashDistributions
  const withholdingHeaderNode = withHoverInfo(pageStyles.hoverInfo, pageStyles.hoverInfoIcon, cashDistributionTextNodes.fields.withholding, '')
  const cashPaidHeaderNode = withHoverInfo(pageStyles.hoverInfo, pageStyles.hoverInfoIcon, cashDistributionTextNodes.fields.cashPaid, '')
  const capitalRepaymentHeaderNode = withHoverInfo(
    pageStyles.hoverInfo,
    pageStyles.hoverInfoIcon,
    cashDistributionTextNodes.fields.capitalRepayment,
    ''
  )
  const dividendHeaderNode = withHoverInfo(pageStyles.hoverInfo, pageStyles.hoverInfoIcon, cashDistributionTextNodes.fields.dividend, '')
  const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    withSummaryRows(
      sortRowsByDate(osakkeetCalculation.formData.cashDistributions),
      osakkeetCalculation.cashDistributions,
      texts
    )
  )
  const cashDistributions = createStateCollectionEditor(dataState, ['cashDistributions'])
  const editingRowIds = new Set<string>()
  const tbodyNode = createEditableCollectionTable({
    rowsState,
    createRemoveButton: (labelNode, remove) => createRemoveButton(pageStyles.smallButton, labelNode, remove),
    remove: cashDistributions.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(pageStyles.input, row.formRow.date, (value) => {
        cashDistributions.patch(row.id, { date: value })
      })
      const typeSelect = createOptionBoundSelect(
        row.formRow.type,
        [
          { label: row.texts.cashDistributions.types.capitalReturn, value: 'capital_return' },
          { label: row.texts.cashDistributions.types.dividend, value: 'dividend' },
        ],
        (value) => {
          cashDistributions.patch(row.id, { type: value })
        }
      )
      setStyle(typeSelect.node, pageStyles.input)
      const amountPerShareInput = numberInput(pageStyles.input, row.formRow.amountPerShare, (value) => {
        cashDistributions.patch(row.id, { amountPerShare: value })
      })
      const dateCell = td()
      const typeCell = td()
      const shareCountCell = td()
      const amountPerShareCell = td()
      const grossTotalCell = td()
      const paidInCashCell = td()
      const withholdingToTaxOfficeCell = td()
      const capitalRepaymentTotalCell = td()
      const dividendTotalCell = td()
      const bindings: Array<EditableCellBinding<typeof row>> = [
        {
          cell: dateCell,
          editNode: dateInput,
          readValue: (nextRow) => nextRow.formRow.date,
          setEditValue: (nextRow) => setInputValue(dateInput, nextRow.formRow.date),
        },
        {
          cell: typeCell,
          editNode: typeSelect.node,
          readValue: (nextRow) =>
            nextRow.formRow.type === 'capital_return'
              ? nextRow.texts.cashDistributions.types.capitalReturn
              : nextRow.texts.cashDistributions.types.dividend,
          setEditValue: (nextRow) => {
            typeSelect.setOptions([
              { label: nextRow.texts.cashDistributions.types.capitalReturn, value: 'capital_return' },
              { label: nextRow.texts.cashDistributions.types.dividend, value: 'dividend' },
            ])
            typeSelect.setValue(nextRow.formRow.type)
          },
        },
        {
          cell: amountPerShareCell,
          editNode: amountPerShareInput,
          readValue: (nextRow) => nextRow.formRow.amountPerShare,
          setEditValue: (nextRow) => setInputValue(amountPerShareInput, nextRow.formRow.amountPerShare),
        },
      ]
      const syncSummaryCells = (nextRow: typeof row) => {
        replaceChildren(shareCountCell, nextRow.summary ? amount(nextRow.summary.sharesHeld) : '-')
        replaceChildren(grossTotalCell, nextRow.summary ? euro(nextRow.summary.grossTotal) : '-')
        replaceChildren(paidInCashCell, nextRow.summary ? euro(nextRow.summary.paidInCash) : '-')
        replaceChildren(
          withholdingToTaxOfficeCell,
          nextRow.summary ? euro(nextRow.summary.withholdingToTaxOffice) : '-'
        )
        replaceChildren(
          capitalRepaymentTotalCell,
          nextRow.summary
            ? hoverValue(
                pageStyles.hoverInfo,
                pageStyles.hoverInfoIcon,
                euro(nextRow.summary.capitalRepaymentTotal),
                nextRow.texts.cashDistributions.fields.capitalRepaymentSharesHelp(
                  amount(nextRow.summary.capitalRepaymentShareCount)
                )
              )
            : '-'
        )
        replaceChildren(
          dividendTotalCell,
          nextRow.summary
            ? hoverValue(
                pageStyles.hoverInfo,
                pageStyles.hoverInfoIcon,
                euro(nextRow.summary.dividendTotal),
                nextRow.texts.cashDistributions.fields.dividendSharesHelp(amount(nextRow.summary.dividendShareCount))
              )
            : '-'
        )
      }
      const editableRow = createEditableRowManager(
        row,
        editingRowIds,
        bindings,
        (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick),
        (nextRow) => {
          syncSummaryCells(nextRow)
        }
      )
      editableRow.sync(row)
      const rowNode = tr(
        dateCell,
        typeCell,
        shareCountCell,
        amountPerShareCell,
        grossTotalCell,
        paidInCashCell,
        withholdingToTaxOfficeCell,
        capitalRepaymentTotalCell,
        dividendTotalCell,
        td(
          { class: 'no-print' },
          createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
        )
      )
      editableRow.attachDoubleClickEdit(rowNode)

      syncSummaryCells(row)

      return {
        node: rowNode,
        set: editableRow.set,
      }
    },
  })

  const addButton = createCollectionAppendEditButton(
    cashDistributions,
    editingRowIds,
    cashDistributionTextNodes.actions.add,
    () => createAppendCollectionRow('cashDistributions'),
    (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
  )

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
    ;(withholdingHeaderNode as HTMLElement).title = texts.cashDistributions.fields.withholdingHelp
    ;(cashPaidHeaderNode as HTMLElement).title = texts.cashDistributions.fields.cashPaidHelp
    ;(capitalRepaymentHeaderNode as HTMLElement).title = texts.cashDistributions.fields.capitalRepaymentHelp
    ;(dividendHeaderNode as HTMLElement).title = texts.cashDistributions.fields.dividendHelp
  })
}

export function createMathematicalShareValuesEditor(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes
) {
  const mathematicalShareValuesTextNodes = localizedTextNodes.mathematicalShareValues
  const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    withRowActionLabels(osakkeetCalculation.formData.mathematicalShareValues, texts)
  )
  const mathematicalShareValues = createStateCollectionEditor(dataState, ['mathematicalShareValues'])
  const editingRowIds = new Set<string>()
  const tbodyNode = createEditableCollectionTable<{
    id: string
    year: string
    valuePerShare: string
    editLabel: string
    doneLabel: string
    removeLabel: string
  }>({
    rowsState,
    createRemoveButton: (labelNode, remove) => createRemoveButton(pageStyles.smallButton, labelNode, remove),
    remove: mathematicalShareValues.remove,
    render: ({ row, removeButton }) => {
      const yearInput = numberInput(pageStyles.input, row.year, (value) => {
        mathematicalShareValues.patch(row.id, { year: value })
      })
      const valuePerShareInput = numberInput(pageStyles.input, row.valuePerShare, (value) => {
        mathematicalShareValues.patch(row.id, { valuePerShare: value })
      })
      const yearCell = td()
      const valuePerShareCell = td()
      const bindings: Array<EditableCellBinding<typeof row>> = [
        {
          cell: yearCell,
          editNode: div(pageStyles.compactField, yearInput),
          readValue: (nextRow) => nextRow.year,
          setEditValue: (nextRow) => setInputValue(yearInput, nextRow.year),
        },
        {
          cell: valuePerShareCell,
          editNode: div(pageStyles.compactField, valuePerShareInput),
          readValue: (nextRow) => nextRow.valuePerShare,
          setEditValue: (nextRow) => setInputValue(valuePerShareInput, nextRow.valuePerShare),
        },
      ]
      const editableRow = createEditableRowManager(row, editingRowIds, bindings, (labelNode, variant, onClick) =>
        createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
      )
      editableRow.sync(row)
      const rowNode = tr(
        yearCell,
        valuePerShareCell,
        td(
          { class: 'no-print' },
          createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
        )
      )
      editableRow.attachDoubleClickEdit(rowNode)
      return {
        node: rowNode,
        set: editableRow.set,
      }
    },
  })

  const addButton = createCollectionAppendEditButton(
    mathematicalShareValues,
    editingRowIds,
    mathematicalShareValuesTextNodes.actions.add,
    () => createAppendCollectionRow('mathematicalShareValues'),
    (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
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

export function createShareSplitsSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const shareSplitTextNodes = localizedTextNodes.shareSplits
  const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    withRowActionLabels(sortRowsByDate(osakkeetCalculation.formData.shareSplits), texts)
  )
  const shareSplits = createStateCollectionEditor(dataState, ['shareSplits'])
  const editingRowIds = new Set<string>()
  const tbodyNode = createEditableCollectionTable({
    rowsState,
    createRemoveButton: (labelNode, remove) => createRemoveButton(pageStyles.smallButton, labelNode, remove),
    remove: shareSplits.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(pageStyles.input, row.date, (value) => {
        shareSplits.patch(row.id, { date: value })
      })
      const multiplierInput = numberInput(pageStyles.input, row.multiplier, (value) => {
        shareSplits.patch(row.id, { multiplier: value })
      })
      const dateCell = td()
      const multiplierCell = td()
      const bindings: Array<EditableCellBinding<typeof row>> = [
        {
          cell: dateCell,
          editNode: div(pageStyles.compactField, dateInput),
          readValue: (nextRow) => nextRow.date,
          setEditValue: (nextRow) => setInputValue(dateInput, nextRow.date),
        },
        {
          cell: multiplierCell,
          editNode: div(pageStyles.compactField, multiplierInput),
          readValue: (nextRow) => nextRow.multiplier,
          setEditValue: (nextRow) => setInputValue(multiplierInput, nextRow.multiplier),
        },
      ]
      const editableRow = createEditableRowManager(row, editingRowIds, bindings, (labelNode, variant, onClick) =>
        createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
      )
      editableRow.sync(row)
      const rowNode = tr(
        dateCell,
        multiplierCell,
        td(
          { class: 'no-print' },
          createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
        )
      )
      editableRow.attachDoubleClickEdit(rowNode)
      return {
        node: rowNode,
        set: editableRow.set,
      }
    },
  })

  const addButton = createCollectionAppendEditButton(
    shareSplits,
    editingRowIds,
    shareSplitTextNodes.actions.add,
    () => createAppendCollectionRow('shareSplits'),
    (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
  )

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

export function createDemergersSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes,
  commonTextNodes: CommonLocalizedTextNodes
) {
  const counter = createSectionCounter()
  const demergerTextNodes = localizedTextNodes.demergers
  const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
    withRowActionLabels(sortRowsByDate(osakkeetCalculation.formData.demergers), texts)
  )
  const demergers = createStateCollectionEditor(dataState, ['demergers'])
  const editingRowIds = new Set<string>()
  const tbodyNode = createEditableCollectionTable({
    rowsState,
    createRemoveButton: (labelNode, remove) => createRemoveButton(pageStyles.smallButton, labelNode, remove),
    remove: demergers.remove,
    render: ({ row, removeButton }) => {
      const dateInput = finnishDateInput(pageStyles.input, row.date, (value) => {
        demergers.patch(row.id, { date: value })
      })
      const oldCompanyRatioInput = numberInput(pageStyles.input, row.oldCompanyRatio, (value) => {
        demergers.patch(row.id, { oldCompanyRatio: value })
      })
      const dateCell = td()
      const oldCompanyRatioCell = td()
      const bindings: Array<EditableCellBinding<typeof row>> = [
        {
          cell: dateCell,
          editNode: div(pageStyles.compactField, dateInput),
          readValue: (nextRow) => nextRow.date,
          setEditValue: (nextRow) => setInputValue(dateInput, nextRow.date),
        },
        {
          cell: oldCompanyRatioCell,
          editNode: div(pageStyles.compactField, oldCompanyRatioInput),
          readValue: (nextRow) => nextRow.oldCompanyRatio,
          setEditValue: (nextRow) => setInputValue(oldCompanyRatioInput, nextRow.oldCompanyRatio),
        },
      ]
      const editableRow = createEditableRowManager(row, editingRowIds, bindings, (labelNode, variant, onClick) =>
        createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
      )
      editableRow.sync(row)
      const rowNode = tr(
        dateCell,
        oldCompanyRatioCell,
        td(
          { class: 'no-print' },
          createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
        )
      )
      editableRow.attachDoubleClickEdit(rowNode)
      return {
        node: rowNode,
        set: editableRow.set,
      }
    },
  })

  const addButton = createCollectionAppendEditButton(
    demergers,
    editingRowIds,
    demergerTextNodes.actions.add,
    () => createAppendCollectionRow('demergers'),
    (labelNode, variant, onClick) => createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
  )

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
