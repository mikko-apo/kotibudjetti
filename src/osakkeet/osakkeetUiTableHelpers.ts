import { div, replaceChildren } from '../../../ki-frame/src/domBuilder'
import type { StylesObject } from '../../../ki-frame/src/domBuilderStyles'
import type { StateCollectionEditor } from './ki-frame-extensions'
import type { OsakkeetLocalization } from './osakkeetLocalizations'
import { zipRowsWithSummaries } from './osakkeetUiSummary'

export type RowActionLabels = {
  editLabel: string
  doneLabel: string
  removeLabel: string
}

export type SummaryTableRow<TRow extends { id: string }, TSummary extends { id: string }> = RowActionLabels & {
  id: string
  formRow: TRow
  summary?: TSummary
  texts: OsakkeetLocalization
}

export type EditableCellBinding<TRow> = {
  cell: HTMLTableCellElement
  editNode: Node
  readValue: (row: TRow) => string
  setEditValue: (row: TRow) => void
}

export type EditableRowManager<TRow extends { id: string; editLabel: string; doneLabel: string }> = {
  editButton: Node
  sync: (row: TRow) => void
  getCurrentRow: () => TRow
  attachDoubleClickEdit: (rowNode: HTMLTableRowElement) => void
  set: (row: TRow) => void
}

function displayReadOnlyValue(value: string) {
  return value || '-'
}

function appendAndEditCollectionRow<TItem extends { id: string }>(
  editor: StateCollectionEditor<TItem>,
  editingIds: Set<string>,
  createEmptyItem: () => Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>
) {
  editingIds.clear()
  const row = editor.append(createEmptyItem())
  editingIds.add(row.id)
  editor.patch(row.id, {})
}

export function createCollectionAppendEditButton<TItem extends { id: string }>(
  editor: StateCollectionEditor<TItem>,
  editingIds: Set<string>,
  labelNode: Text,
  createEmptyItem: () => Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>,
  createActionButton: (labelNode: Text, variant: 'primary' | 'secondary', onClick: () => void) => Node
) {
  return createActionButton(labelNode, 'primary', () => {
    appendAndEditCollectionRow(editor, editingIds, createEmptyItem)
  })
}

function syncEditableCellBindings<TRow>(bindings: EditableCellBinding<TRow>[], row: TRow, editing: boolean) {
  bindings.forEach(({ cell, editNode, readValue }) => {
    if (editing) {
      if (cell.firstChild !== editNode) {
        replaceChildren(cell, editNode)
      }
      return
    }
    replaceChildren(cell, displayReadOnlyValue(readValue(row)))
  })
}

function updateInactiveEditableCellBindingInputs<TRow>(
  bindings: EditableCellBinding<TRow>[],
  row: TRow,
  editing: boolean
) {
  const activeElement = document.activeElement
  bindings.forEach(({ editNode, setEditValue }) => {
    if (
      editing &&
      activeElement instanceof Node &&
      (editNode === activeElement || ('contains' in editNode && editNode.contains(activeElement)))
    ) {
      return
    }
    setEditValue(row)
  })
}

export function createRowActionButtons(editButton: Node, removeButton: Node, rowButtonsStyle: StylesObject) {
  return div(rowButtonsStyle, editButton, removeButton)
}

function enableDoubleClickEdit<TRow extends { id: string }>(
  rowNode: HTMLTableRowElement,
  editingIds: Set<string>,
  getCurrentRow: () => TRow,
  sync: (row: TRow) => void
) {
  rowNode.addEventListener('dblclick', () => {
    const row = getCurrentRow()
    if (editingIds.has(row.id)) return
    editingIds.add(row.id)
    sync(row)
  })
}

export function toggleSetMembership<T>(set: Set<T>, value: T) {
  if (set.has(value)) {
    set.delete(value)
  } else {
    set.add(value)
  }
}

function createRowEditController<TRow extends { id: string; editLabel: string; doneLabel: string }>(
  initialRow: TRow,
  editingIds: Set<string>,
  onToggle: (row: TRow) => void,
  createActionButton: (labelNode: Text, variant: 'primary' | 'secondary', onClick: () => void) => HTMLButtonElement
) {
  let currentRow = initialRow
  const labelNode = document.createTextNode('')
  const button = createActionButton(labelNode, 'secondary', () => {
    if (editingIds.has(currentRow.id)) {
      editingIds.delete(currentRow.id)
    } else {
      editingIds.add(currentRow.id)
    }
    sync(currentRow)
  })

  const isEditing = () => editingIds.has(currentRow.id)
  const sync = (nextRow: TRow) => {
    currentRow = nextRow
    labelNode.textContent = isEditing() ? nextRow.doneLabel : nextRow.editLabel
    onToggle(nextRow)
  }

  return {
    button,
    isEditing,
    sync,
  }
}

export function createEditableRowManager<TRow extends { id: string; editLabel: string; doneLabel: string }>(
  row: TRow,
  editingIds: Set<string>,
  bindings: EditableCellBinding<TRow>[],
  createActionButton: (labelNode: Text, variant: 'primary' | 'secondary', onClick: () => void) => HTMLButtonElement,
  onSet?: (row: TRow) => void
): EditableRowManager<TRow> {
  const editController = createRowEditController(row, editingIds, (nextRow) => {
    syncEditableCellBindings(bindings, nextRow, editController.isEditing())
  }, createActionButton)
  let currentRow = row

  return {
    editButton: editController.button,
    sync(rowToSync: TRow) {
      editController.sync(rowToSync)
    },
    getCurrentRow() {
      return currentRow
    },
    attachDoubleClickEdit(rowNode: HTMLTableRowElement) {
      enableDoubleClickEdit(rowNode, editingIds, () => currentRow, editController.sync)
    },
    set(nextRow: TRow) {
      currentRow = nextRow
      updateInactiveEditableCellBindingInputs(bindings, nextRow, editController.isEditing())
      onSet?.(nextRow)
      editController.sync(nextRow)
    },
  }
}

function createRowActionLabels(texts: OsakkeetLocalization): RowActionLabels {
  return {
    editLabel: texts.common.edit,
    doneLabel: texts.common.done,
    removeLabel: texts.common.remove,
  }
}

export function withRowActionLabels<TRow extends { id: string }>(rows: readonly TRow[], texts: OsakkeetLocalization) {
  const labels = createRowActionLabels(texts)
  return rows.map((row) => ({
    ...row,
    ...labels,
  }))
}

export function withSummaryRows<TRow extends { id: string }, TSummary extends { id: string }>(
  rows: readonly TRow[],
  summaries: readonly TSummary[],
  texts: OsakkeetLocalization
): Array<SummaryTableRow<TRow, TSummary>> {
  const labels = createRowActionLabels(texts)
  return zipRowsWithSummaries(rows, summaries).map(({ row, summary }) => ({
    id: row.id,
    formRow: row,
    summary,
    texts,
    ...labels,
  }))
}
