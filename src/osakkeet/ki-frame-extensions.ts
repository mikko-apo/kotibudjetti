import { createController, createState, type State } from '../../../ki-frame/src'
import { replaceChildren, text } from '../../../ki-frame/src/domBuilder'
import { getByPath } from '../../../ki-frame/src/util/getByPath'
import { copyAndSet } from '../../../ki-frame/src/util/setByPath'

type PathSegment = string | number
type Path = string | PathSegment[]
type TuplePath = readonly PathSegment[]
type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
type Key = string | number

type KeyOf<T> = Extract<keyof T, PathSegment>

type ValueAtTuplePath<T, TP extends readonly PathSegment[]> = TP extends []
  ? T
  : TP extends readonly [infer H, ...infer R]
    ? H extends keyof T
      ? ValueAtTuplePath<T[H], Extract<R, readonly PathSegment[]>>
      : H extends number
        ? T extends readonly (infer Item)[]
          ? ValueAtTuplePath<Item, Extract<R, readonly PathSegment[]>>
          : never
        : never
    : never

type PathToValue<T, Target> = [T] extends [Target]
  ? []
  : T extends readonly (infer Item)[]
    ? [number, ...PathToValue<Item, Target>]
    : T extends object
      ? {
          [K in KeyOf<T>]: [T[K]] extends [Target]
            ? [K]
            : PathToValue<T[K], Target> extends never
              ? never
              : [K, ...PathToValue<T[K], Target>]
        }[KeyOf<T>]
      : never

export type CollectionPath<TState> = PathToValue<TState, readonly { id: string }[] | { id: string }[]>

export type StatePath<TState> = TState extends readonly (infer Item)[]
  ? [number] | [number, ...StatePath<Item>]
  : TState extends object
    ? {
        [K in KeyOf<TState>]: [K] | (StatePath<TState[K]> extends never ? [K] : [K, ...StatePath<TState[K]>])
      }[KeyOf<TState>]
    : never

type CollectionItemAtPath<TState, TPath extends TuplePath> =
  ValueAtTuplePath<TState, TPath> extends readonly (infer Item)[] ? (Item extends { id: string } ? Item : never) : never

type StatePathValue<TState, TPath extends TuplePath> = ValueAtTuplePath<TState, TPath>

type DestroyHandle = {
  destroy(): void
}

type DefaultNodeValue<TNode extends FormElement> = TNode extends HTMLInputElement
  ? TNode['type'] extends 'checkbox'
    ? boolean
    : string
  : string

type BasicTextValue = string | number | boolean | bigint | null | undefined

type BindInputOptions<TNode extends FormElement, TValue> = {
  event?: keyof HTMLElementEventMap
  read?: (node: TNode) => TValue
  write?: (node: TNode, value: TValue | undefined) => void
  validate?: (value: TValue, node: TNode, ev: Event) => boolean
}

type CreateTextNodesFromStateBaseOptions = {
  noInit?: boolean
}

type CreateTextNodesFromStatePathOptions<
  TState,
  TPath extends TuplePath,
> = CreateTextNodesFromStateBaseOptions & {
  path: TPath & StatePath<TState>
}

export type TextNodesFromValue<T> = T extends (...args: never[]) => unknown
  ? never
  : T extends BasicTextValue
    ? Text
    : T extends readonly (infer Item)[]
      ? TextNodesFromValue<Item>[]
      : T extends object
        ? {
            [K in keyof T as TextNodesFromValue<T[K]> extends never ? never : K]: TextNodesFromValue<T[K]>
          }
        : never

type MapStateToDomChildrenRow<TState, TItem> = {
  node: Node
  set?: (item: TItem, index: number, stateValue: TState) => void
  destroy?: () => void
}

type MapStateToDomChildrenRender<TState, TItem> = (
  item: TItem,
  index: number,
  stateValue: TState
) => MapStateToDomChildrenRow<TState, TItem>

type MapStateToDomChildrenKey<TState, TItem, TKey extends Key = Key> = (
  item: TItem,
  index: number,
  stateValue: TState
) => TKey

type MapStateToDomChildrenBaseOptions = {
  noInit?: boolean
}

type CollectionStateItem<TCollection extends readonly unknown[]> = TCollection[number]

type KeyOption<TState, TItem> = TItem extends { id: Key }
  ? { key?: MapStateToDomChildrenKey<TState, TItem> }
  : { key: MapStateToDomChildrenKey<TState, TItem> }

type MapStateToDomChildrenCollectionOptions<TCollection extends readonly unknown[]> =
  MapStateToDomChildrenBaseOptions & {
    items?: never
    render: MapStateToDomChildrenRender<TCollection, CollectionStateItem<TCollection>>
  } & KeyOption<TCollection, CollectionStateItem<TCollection>>

type MapStateToDomChildrenExplicitBaseOptions<
  TState,
  TCollection extends readonly unknown[],
> = MapStateToDomChildrenBaseOptions & {
  items: (value: TState) => TCollection
  render: MapStateToDomChildrenRender<TState, CollectionStateItem<TCollection>>
}

type MapStateToDomChildrenExplicitIdOptions<
  TState,
  TCollection extends readonly { id: Key }[],
> = MapStateToDomChildrenExplicitBaseOptions<TState, TCollection> & {
  key?: MapStateToDomChildrenKey<TState, CollectionStateItem<TCollection>>
}

type MapStateToDomChildrenExplicitKeyedOptions<
  TState,
  TCollection extends readonly unknown[],
> = MapStateToDomChildrenExplicitBaseOptions<TState, TCollection> & {
  key: MapStateToDomChildrenKey<TState, CollectionStateItem<TCollection>>
}

type PersistStateOptions<TValue> = {
  storage: Storage
  key: string
  serialize?: (value: TValue) => string
  deserialize?: (raw: string) => TValue
  hydrate?: boolean
  saveOnChange?: boolean
  saveInitial?: boolean
  onError?: (error: unknown) => void
}

type PersistedStateHandle<TValue> = DestroyHandle & {
  load(): TValue | undefined
  save(nextValue?: TValue): void
  remove(): void
}

type StorageSourceOptions<TValue> = {
  storage: Storage
  key: string
  serialize?: (value: TValue) => string
  deserialize?: (raw: string) => TValue
  onError?: (error: unknown) => void
}

type StorageSource<TValue> = {
  getRaw(): string | null
  hasValue(): boolean
  load(): TValue | undefined
  save(value: TValue): void
  remove(): void
}

export type StateCollectionEditor<TItem extends { id: string }> = {
  get(): TItem[]
  set(items: TItem[]): void
  append(item: Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>): TItem
  insert(index: number, item: Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>): TItem
  patch(id: string, patch: Partial<TItem>): void
  replace(id: string, item: TItem): void
  remove(id: string): void
  move(id: string, toIndex: number): void
  clear(): void
}

type StateCollectionEditorKey<TState, TItem extends { id: string }> = (
  item: Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>,
  index: number,
  stateValue: TState
) => string

type StateCollectionEditorOptions<TState, TItem extends { id: string }> = {
  key?: StateCollectionEditorKey<TState, TItem>
  normalize?: (item: Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>, index: number, stateValue: TState) => TItem
}

type StateSelector<TState, TValue> = (value: TState) => TValue

type ReplaceChildrenFromStateOptions = {
  noInit?: boolean
}

type EditableCollectionTableRenderResult<TRow> = {
  node: Node
  set?: (item: TRow) => void
  destroy?: () => void
}

type EditableCollectionTableContext<TRow extends { id: string; removeLabel: string }> = {
  row: TRow
  rowState: State<{ row: TRow }>
  rowTextNodes: TextNodesFromValue<TRow> & DestroyHandle
  removeButton: Node
}

type EditableCollectionTableOptions<TRow extends { id: string; removeLabel: string }> = {
  rowsState: State<TRow[]>
  createRemoveButton: (labelNode: Text, remove: () => void) => Node
  remove: (id: string) => void
  render: (
    context: EditableCollectionTableContext<TRow>
  ) => EditableCollectionTableRenderResult<TRow>
}

type SectionCounter = DestroyHandle & {
  node: Text
  set(text: string): void
  setCount(count: number, label: string): void
}

type ComputedTextState<TValue> = DestroyHandle & {
  state: State<TValue>
  textNodes: TextNodesFromValue<TValue> & DestroyHandle
}

type OptionBoundSelectOption<Value extends string> = {
  label: string
  value: Value
}

type OptionBoundSelect<Value extends string> = {
  node: HTMLSelectElement
  setValue(value: Value): void
  setOptions(options: OptionBoundSelectOption<Value>[]): void
}

type StorageBackedStateOptions<TValue> = PersistStateOptions<TValue> & {
  value: TValue
}

type StorageBackedState<TValue> = PersistedStateHandle<TValue> &
  DestroyHandle & {
    state: State<TValue>
  }

type SectionController<TValue, TRoot extends Node = Node> = {
  root: TRoot
  set(value: TValue): void
}

function isCheckboxInput(node: FormElement): node is HTMLInputElement {
  return node.nodeName === 'INPUT' && 'type' in node && node.type === 'checkbox'
}

function readDefaultNodeValue<TNode extends FormElement>(node: TNode): DefaultNodeValue<TNode> {
  if (isCheckboxInput(node)) {
    return node.checked as DefaultNodeValue<TNode>
  }
  return node.value as DefaultNodeValue<TNode>
}

function writeDefaultNodeValue<TNode extends FormElement, TValue>(node: TNode, value: TValue | undefined) {
  if (isCheckboxInput(node)) {
    node.checked = Boolean(value)
    return
  }
  node.value = value == null ? '' : String(value)
}

function isBasicTextValue(value: unknown): value is BasicTextValue {
  return (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  )
}

function formatBasicTextValue(value: BasicTextValue) {
  return value == null ? '' : String(value)
}

function isTextNode(value: unknown): value is Text {
  return !!value && typeof value === 'object' && 'nodeType' in value && (value as Node).nodeType === 3
}

function toRuntimePath(path: TuplePath) {
  return path as unknown as Path
}

function getStateValueAtPath<TState, TValue>(stateValue: TState, path: TuplePath): TValue {
  return getByPath(stateValue, toRuntimePath(path)) as TValue
}

function getStateValueAtOptionalPath<TState, TValue>(stateValue: TState, path?: TuplePath): TValue {
  if (!path) {
    return stateValue as unknown as TValue
  }
  return getStateValueAtPath<TState, TValue>(stateValue, path)
}

function setStateValueAtPath<TState, TValue>(state: State<TState>, path: TuplePath, value: TValue) {
  state.set((current) => copyAndSet<TState>(current, toRuntimePath(path), value))
}

function withDestroy<T extends object>(value: T, destroy: () => void): T & DestroyHandle {
  return Object.assign(value, { destroy })
}

function createTextNodesTree(value: unknown, noInit: boolean): unknown {
  if (typeof value === 'function') return undefined
  if (isBasicTextValue(value)) {
    return text(noInit ? '' : formatBasicTextValue(value))
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => createTextNodesTree(item, noInit))
      .filter((item): item is Exclude<typeof item, undefined> => item !== undefined)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, nestedValue]) => [key, createTextNodesTree(nestedValue, noInit)] as const)
      .filter((entry): entry is readonly [string, Exclude<(typeof entry)[1], undefined>] => entry[1] !== undefined)
    return Object.fromEntries(entries)
  }
  return undefined
}

function syncTextNodesTree(nodes: unknown, value: unknown) {
  if (isTextNode(nodes)) {
    const nextValue = isBasicTextValue(value) ? formatBasicTextValue(value) : ''
    if (nodes.textContent !== nextValue) {
      nodes.textContent = nextValue
    }
    return
  }
  if (Array.isArray(nodes)) {
    const values = Array.isArray(value) ? value : []
    nodes.forEach((childNode, index) => {
      syncTextNodesTree(childNode, values[index])
    })
    return
  }
  if (nodes && typeof nodes === 'object') {
    const values = value && typeof value === 'object' ? value : {}
    Object.entries(nodes).forEach(([key, childNode]) => {
      syncTextNodesTree(childNode, (values as Record<string, unknown>)[key])
    })
  }
}

// Creates live text nodes that mirror primitive values from state or a selected state path.
export function createTextNodesFromState<TState>(
  state: State<TState>,
  options?: CreateTextNodesFromStateBaseOptions
): TextNodesFromValue<TState> & DestroyHandle
export function createTextNodesFromState<
  TState extends object,
  const TPath extends TuplePath,
  TValue = StatePathValue<TState, TPath>,
>(
  state: State<TState>,
  options: CreateTextNodesFromStatePathOptions<TState, TPath>
): TextNodesFromValue<TValue> & DestroyHandle
export function createTextNodesFromState<TState>(
  state: State<TState>,
  options: CreateTextNodesFromStateBaseOptions & { path?: TuplePath } = {}
): TextNodesFromValue<TState> & DestroyHandle {
  const initialValue = getStateValueAtOptionalPath(state.get(), options.path)
  const nodes = createTextNodesTree(initialValue, options.noInit === true)

  if (nodes === undefined) {
    throw new Error(
      Array.isArray(options.path)
        ? `createTextNodesFromState path "${String(options.path)}" does not resolve to supported text values`
        : 'createTextNodesFromState state does not resolve to supported text values'
    )
  }

  const unsub = state.onValueChange(
    (nextState) => {
      const nextValue = getStateValueAtOptionalPath(nextState, options.path)
      syncTextNodesTree(nodes, nextValue)
    },
    { noInit: true }
  )

  return withDestroy(nodes as object, unsub) as TextNodesFromValue<TState> & DestroyHandle
}

// Binds one form element to a single state path and keeps updates flowing both ways.
export function mapStatePathToInput<
  TState extends object,
  const TPath extends TuplePath,
  TNode extends FormElement,
  TValue = StatePathValue<TState, TPath>,
>(
  state: State<TState>,
  path: TPath & StatePath<TState>,
  node: TNode,
  options: BindInputOptions<TNode, TValue> = {}
): DestroyHandle {
  const eventType = options.event || 'input'
  const read = options.read || ((currentNode: TNode) => readDefaultNodeValue(currentNode) as TValue)
  const write =
    options.write || ((currentNode: TNode, value: TValue | undefined) => writeDefaultNodeValue(currentNode, value))

  const writeStateToNode = (stateValue: TState) => {
    write(node, getStateValueAtPath<TState, TValue | undefined>(stateValue, path))
  }

  writeStateToNode(state.get())

  const controller = createController({ name: 'bind-input' })
  controller.addDomEvent(`bind:${String(path)}`, node, eventType, (ev) => {
    const nextValue = read(node)
    if (options.validate && !options.validate(nextValue, node, ev)) return
    setStateValueAtPath(state, path, nextValue)
  })
  const unsub = state.onValueChange(
    (nextState) => {
      writeStateToNode(nextState)
    },
    { noInit: true }
  )
  controller.onDestroy(unsub)
  return controller
}

function mapStatePathsToInputs<TState extends object>(
  state: State<TState>,
  bindings: Array<{
    path: readonly PathSegment[]
    node: FormElement
    options?: BindInputOptions<FormElement, unknown>
  }>
): DestroyHandle {
  const handles = bindings.map(({ path, node, options }) => {
    const eventType = options?.event || 'input'
    const read = options?.read || ((currentNode: FormElement) => readDefaultNodeValue(currentNode))
    const write =
      options?.write ||
      ((currentNode: FormElement, value: unknown) => writeDefaultNodeValue(currentNode, value))

    const writeStateToNode = (stateValue: TState) => {
      write(node, getStateValueAtPath<TState, unknown>(stateValue, path))
    }

    writeStateToNode(state.get())

    const controller = createController({ name: 'bind-inputs' })
    controller.addDomEvent(`bind:${String(path)}`, node, eventType, (ev) => {
      const nextValue = read(node)
      if (options?.validate && !options.validate(nextValue, node, ev)) return
      setStateValueAtPath(state, path, nextValue)
    })
    const unsub = state.onValueChange(
      (nextState) => {
        writeStateToNode(nextState)
      },
      { noInit: true }
    )
    controller.onDestroy(unsub)
    return controller
  })
  return withDestroy({}, () => {
    handles.forEach((handle) => handle.destroy())
  })
}

// Renders and keeps a DOM child list in sync with items selected from state.
export function mapStateToDomChildren<TCollection extends readonly unknown[]>(
  state: State<TCollection>,
  root: Node & ParentNode,
  options: MapStateToDomChildrenCollectionOptions<TCollection>
): DestroyHandle
export function mapStateToDomChildren<TCollection extends readonly { id: Key }[]>(
  state: State<TCollection>,
  root: Node & ParentNode,
  render: MapStateToDomChildrenRender<TCollection, TCollection[number]>
): DestroyHandle
export function mapStateToDomChildren<TState, TCollection extends readonly { id: Key }[]>(
  state: State<TState>,
  root: Node & ParentNode,
  options: MapStateToDomChildrenExplicitIdOptions<TState, TCollection>
): DestroyHandle
export function mapStateToDomChildren<TState, TCollection extends readonly unknown[]>(
  state: State<TState>,
  root: Node & ParentNode,
  options: MapStateToDomChildrenExplicitKeyedOptions<TState, TCollection>
): DestroyHandle
export function mapStateToDomChildren(
  state: State<unknown>,
  root: Node & ParentNode,
  optionsOrRender:
    | {
        items?: ((value: unknown) => readonly unknown[]) | undefined
        key?: MapStateToDomChildrenKey<unknown, unknown> | undefined
        noInit?: boolean | undefined
        render: MapStateToDomChildrenRender<unknown, unknown>
      }
    | MapStateToDomChildrenRender<unknown, unknown>
): DestroyHandle {
  const options = typeof optionsOrRender === 'function' ? { render: optionsOrRender } : optionsOrRender
  const rows = new Map<Key, MapStateToDomChildrenRow<unknown, unknown>>()
  const itemsSelector = options.items || ((value: unknown) => value as readonly unknown[])
  const keySelector = options.key || ((item: unknown) => (item as { id: Key }).id)

  const destroyRow = (row: MapStateToDomChildrenRow<unknown, unknown>) => {
    row.destroy?.()
    if (row.node.parentNode === root) {
      root.removeChild(row.node)
    }
  }

  const sync = (stateValue: unknown) => {
    const items = itemsSelector(stateValue)
    const nextKeys = new Set<Key>()

    items.forEach((item, index) => {
      const key = keySelector(item, index, stateValue)
      nextKeys.add(key)
      let row = rows.get(key)
      if (!row) {
        const createdRow = options.render(item, index, stateValue)
        rows.set(key, createdRow)
        row = createdRow
      }
      row.set?.(item, index, stateValue)
      const existingNode = root.childNodes[index] || null
      if (existingNode !== row.node) {
        root.insertBefore(row.node, existingNode)
      }
    })

    for (const [key, row] of Array.from(rows.entries())) {
      if (nextKeys.has(key)) continue
      destroyRow(row)
      rows.delete(key)
    }
  }

  if (!options.noInit) {
    sync(state.get())
  }
  const unsub = state.onValueChange(sync, { noInit: true })
  const destroy = () => {
    unsub()
    for (const row of rows.values()) {
      destroyRow(row)
    }
    rows.clear()
  }
  return withDestroy({}, destroy)
}

// Builds a tbody that renders editable collection rows with per-row state and cleanup.
export function createEditableCollectionTable<TRow extends { id: string; removeLabel: string }>(
  options: EditableCollectionTableOptions<TRow>
) {
  const tbodyNode = document.createElement('tbody')
  const binding = mapStateToDomChildren(options.rowsState, tbodyNode, (row: TRow) => {
      const rowState = createState({ value: { row } })
      const rowTextNodes = createTextNodesFromSelector(rowState, ({ row: currentRow }) => currentRow)
      const removeButton = options.createRemoveButton(rowTextNodes.removeLabel, () => {
        options.remove(row.id)
      })
      const rendered = options.render({
        row,
        rowState,
        rowTextNodes,
        removeButton,
      })

      return {
        node: rendered.node,
        set(nextRow: TRow) {
          rendered.set?.(nextRow)
          rowState.set({ row: nextRow })
        },
        destroy() {
          rendered.destroy?.()
          rowTextNodes.destroy()
          rowState.destroy?.()
        },
      }
    })
  return withDestroy(tbodyNode, () => {
    binding.destroy()
  })
}

function normalizeArray<TItem>(value: unknown) {
  return Array.isArray(value) ? ([...value] as TItem[]) : []
}

function clampIndex(index: number, length: number) {
  if (index < 0) return 0
  if (index > length) return length
  return index
}

// Returns collection operations for an array of id-based rows stored at a state path.
export function createStateCollectionEditor<
  TState extends object,
  const TPath extends TuplePath,
  TItem extends { id: string } = CollectionItemAtPath<TState, TPath>,
>(
  state: State<TState>,
  path: TPath & CollectionPath<TState>,
  optionsOrKey: StateCollectionEditorOptions<TState, TItem> | StateCollectionEditorKey<TState, TItem> = {}
): StateCollectionEditor<TItem> {
  const options = typeof optionsOrKey === 'function' ? { key: optionsOrKey } : optionsOrKey
  const key =
    options.key ||
    ((item: Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>, index: number, stateValue: TState) => {
      void item
      void index
      void stateValue
      return `row-${Math.random().toString(36).slice(2, 10)}`
    })
  const normalize =
    options.normalize ||
    ((item: Omit<TItem, 'id'> & Partial<Pick<TItem, 'id'>>, index: number, stateValue: TState) =>
      ({ ...item, id: item.id || key(item, index, stateValue) }) as TItem)

  const readItems = () => normalizeArray<TItem>(getStateValueAtPath(state.get(), path))

  const writeItems = (items: TItem[]) => {
    setStateValueAtPath(state, path, items)
  }

  return {
    get() {
      return readItems()
    },
    set(items) {
      writeItems([...items])
    },
    append(item) {
      const currentState = state.get()
      const items = readItems()
      const nextItem = normalize(item, items.length, currentState)
      writeItems([...items, nextItem])
      return nextItem
    },
    insert(index, item) {
      const currentState = state.get()
      const items = readItems()
      const nextItems = [...items]
      const insertAt = clampIndex(index, nextItems.length)
      const nextItem = normalize(item, insertAt, currentState)
      nextItems.splice(insertAt, 0, nextItem)
      writeItems(nextItems)
      return nextItem
    },
    patch(id, patch) {
      writeItems(readItems().map((item) => (item.id === id ? { ...item, ...patch } : item)))
    },
    replace(id, item) {
      writeItems(readItems().map((currentItem) => (currentItem.id === id ? item : currentItem)))
    },
    remove(id) {
      writeItems(readItems().filter((item) => item.id !== id))
    },
    move(id, toIndex) {
      const items = readItems()
      const fromIndex = items.findIndex((item) => item.id === id)
      if (fromIndex === -1) return
      const nextItems = [...items]
      const [movedItem] = nextItems.splice(fromIndex, 1)
      nextItems.splice(clampIndex(toIndex, nextItems.length), 0, movedItem)
      writeItems(nextItems)
    },
    clear() {
      writeItems([])
    },
  }
}

function createViewModelState<TState, TValue>(state: State<TState>, selector: StateSelector<TState, TValue>): State<TValue> {
  const initialValue = selector(state.get())
  const viewModelState = createState<TValue>({ value: initialValue })
  const unsub = state.onValueChange(
    (nextState) => {
      viewModelState.set(selector(nextState))
    },
    { noInit: true }
  )
  viewModelState.onDestroy(unsub)
  return viewModelState
}

// Derives a row-by-row view model state from source state and row mapping logic.
export function createRowViewModelBinder<TState, TRow, TViewModel>(
  state: State<TState>,
  selectRows: (stateValue: TState) => readonly TRow[],
  mapRow: (row: TRow, index: number, stateValue: TState) => TViewModel
) {
  return createViewModelState(state, (stateValue) => selectRows(stateValue).map((row, index) => mapRow(row, index, stateValue)))
}

function safeStorageGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function runStorage<T>(run: () => T, onError?: (error: unknown) => void, fallback?: T) {
  try {
    return run()
  } catch (error) {
    onError?.(error)
    return fallback as T
  }
}

function safeStorageSet(storage: Storage, key: string, value: string) {
  storage.setItem(key, value)
}

function safeStorageRemove(storage: Storage, key: string) {
  storage.removeItem(key)
}

// Wraps a Storage key with typed load, save, remove, and existence helpers.
export function createStorageSource<TValue>(options: StorageSourceOptions<TValue>): StorageSource<TValue> {
  const serialize = options.serialize || ((value: TValue) => JSON.stringify(value))
  const deserialize = options.deserialize || ((raw: string) => JSON.parse(raw) as TValue)

  return {
    getRaw() {
      return safeStorageGet(options.storage, options.key)
    },
    hasValue() {
      return safeStorageGet(options.storage, options.key) != null
    },
    load() {
      const raw = safeStorageGet(options.storage, options.key)
      if (raw == null) return undefined
      return runStorage(() => deserialize(raw), options.onError, undefined)
    },
    save(value) {
      runStorage(() => safeStorageSet(options.storage, options.key, serialize(value)), options.onError)
    },
    remove() {
      runStorage(() => safeStorageRemove(options.storage, options.key), options.onError)
    },
  }
}

// Creates state with optional hydration and persistence backed by a Storage entry.
export function createStorageBackedState<TValue>(options: StorageBackedStateOptions<TValue>): StorageBackedState<TValue> {
  const state = createState<TValue>({ value: options.value })
  const persisted = persistState(state, options)
  return Object.assign(
    {
      state,
    },
    persisted,
    {
      destroy() {
        persisted.destroy()
        state.destroy?.()
      },
    }
  )
}

// Pairs a section root node with its update function for consistent section wiring.
export function createSectionController<TValue, TRoot extends Node = Node>(
  root: TRoot,
  set: (value: TValue) => void
): SectionController<TValue, TRoot> {
  return { root, set }
}

function createTextNodesFromSelector<TState, TValue>(
  state: State<TState>,
  selector: StateSelector<TState, TValue>,
  options?: CreateTextNodesFromStateBaseOptions
): TextNodesFromValue<TValue> & DestroyHandle {
  const viewModelState = createViewModelState(state, selector)
  const nodes = createTextNodesFromState(viewModelState, options)
  const destroyTextNodes = nodes.destroy.bind(nodes)
  return withDestroy(nodes as object, () => {
    destroyTextNodes()
    viewModelState.destroy()
  }) as TextNodesFromValue<TValue> & DestroyHandle
}

// Creates derived state plus matching text nodes for formatted or projected values.
export function createComputedTextState<TState, TValue>(
  state: State<TState>,
  selector: StateSelector<TState, TValue>,
  options?: CreateTextNodesFromStateBaseOptions
): ComputedTextState<TValue> {
  const computedState = createViewModelState(state, selector)
  const textNodes = createTextNodesFromState(computedState, options)
  return withDestroy(
    {
      state: computedState,
      textNodes,
    },
    () => {
      textNodes.destroy()
      computedState.destroy()
    }
  )
}

// Creates a small text controller for section counts and other simple labels.
export function createSectionCounter(initialText = ''): SectionCounter {
  const state = createState({ value: { text: initialText } })
  const textNodes = createTextNodesFromState(state, { path: ['text'] })
  return withDestroy(
    {
      node: textNodes,
      set(text: string) {
        state.set({ text })
      },
      setCount(count: number, label: string) {
        state.set({ text: `${count} ${label}` })
      },
    },
    () => {
      textNodes.destroy()
      state.destroy?.()
    }
  )
}

function syncOptionBoundSelect<Value extends string>(
  node: HTMLSelectElement,
  nextValue: Value,
  nextOptions: OptionBoundSelectOption<Value>[]
) {
  node.replaceChildren(
    ...nextOptions.map((optionValue) => {
      const optionNode = document.createElement('option')
      optionNode.value = optionValue.value
      optionNode.textContent = optionValue.label
      return optionNode
    })
  )
  node.value = nextValue
}

// Creates a select element whose options and selected value can be updated together.
export function createOptionBoundSelect<Value extends string>(
  value: Value,
  options: OptionBoundSelectOption<Value>[],
  onChange: (value: Value) => void = () => {}
): OptionBoundSelect<Value> {
  const node = document.createElement('select')
  node.addEventListener('change', () => {
    onChange(node.value as Value)
  })
  syncOptionBoundSelect(node, value, options)
  return {
    node,
    setValue(nextValue) {
      node.value = nextValue
    },
    setOptions(nextOptions) {
      syncOptionBoundSelect(node, node.value as Value, nextOptions)
    },
  }
}

function toNodeArray(value: Node | string | false | null | undefined | Array<Node | string | false | null | undefined>) {
  if (Array.isArray(value)) {
    return value.filter((item): item is Node | string => item !== false && item != null)
  }
  if (value === false || value == null) return []
  return [value]
}

// Replaces a root node's children from state changes with optional projection before rendering.
export function replaceChildrenFromState<TState, TValue = TState>(
  state: State<TState>,
  root: Node & ParentNode,
  selectorOrRender: StateSelector<TState, TValue> | ((value: TState) => Node | string | false | null | undefined | Array<Node | string | false | null | undefined>),
  renderOrOptions?:
    | ((value: TValue) => Node | string | false | null | undefined | Array<Node | string | false | null | undefined>)
    | ReplaceChildrenFromStateOptions,
  maybeOptions?: ReplaceChildrenFromStateOptions
): DestroyHandle {
  const hasSelector = typeof renderOrOptions === 'function'
  const selector = (hasSelector ? selectorOrRender : ((value: TState) => value as unknown as TValue)) as StateSelector<TState, TValue>
  const render = (hasSelector ? renderOrOptions : selectorOrRender) as (
    value: TValue
  ) => Node | string | false | null | undefined | Array<Node | string | false | null | undefined>
  const options = (hasSelector ? maybeOptions : renderOrOptions) as ReplaceChildrenFromStateOptions | undefined

  const sync = (stateValue: TState) => {
    replaceChildren(root as HTMLElement, toNodeArray(render(selector(stateValue))))
  }

  if (!options?.noInit) {
    sync(state.get())
  }
  const unsub = state.onValueChange(sync, { noInit: true })
  return withDestroy({}, unsub)
}

// Collects the common state-to-DOM binding helpers behind one form-focused API.
export function createFormBinder<TState extends object>(state: State<TState>) {
  return {
    // Binds one input node to a single state path.
    bindInput<const TPath extends TuplePath, TNode extends FormElement, TValue = StatePathValue<TState, TPath>>(
      path: TPath & StatePath<TState>,
      node: TNode,
      options: BindInputOptions<TNode, TValue> = {}
    ) {
      return mapStatePathToInput(state, path, node, options)
    },
    // Binds multiple input nodes to their state paths in one call.
    bindInputs(
      bindings: Array<{
        path: readonly PathSegment[]
        node: FormElement
        options?: BindInputOptions<FormElement, unknown>
      }>
    ) {
      return mapStatePathsToInputs(state, bindings)
    },
    // Returns collection editing helpers for an id-based row array at a state path.
    collection<const TPath extends TuplePath, TItem extends { id: string } = CollectionItemAtPath<TState, TPath>>(
      path: TPath & CollectionPath<TState>,
      optionsOrKey: StateCollectionEditorOptions<TState, TItem> | StateCollectionEditorKey<TState, TItem> = {}
    ) {
      return createStateCollectionEditor(state, path, optionsOrKey)
    },
    // Creates live text nodes for the whole state value.
    textNodes(options?: CreateTextNodesFromStateBaseOptions) {
      return createTextNodesFromState(state, options)
    },
    // Creates live text nodes for one selected state path.
    textNodesAtPath<const TPath extends TuplePath, TValue = StatePathValue<TState, TPath>>(
      options: CreateTextNodesFromStatePathOptions<TState, TPath>
    ) {
      return createTextNodesFromState<TState, TPath, TValue>(state, options)
    },
    // Creates live text nodes from a derived value selected from state.
    textNodesFrom<TValue>(selector: StateSelector<TState, TValue>, options?: CreateTextNodesFromStateBaseOptions) {
      return createTextNodesFromSelector(state, selector, options)
    },
    // Re-renders a root node's children from state changes.
    children(
      root: Node & ParentNode,
      render: (value: TState) => Node | string | false | null | undefined | Array<Node | string | false | null | undefined>,
      options?: ReplaceChildrenFromStateOptions
    ) {
      return replaceChildrenFromState(state, root, render, options)
    },
    // Creates derived state that stays synced with the source state.
    viewModel<TValue>(selector: StateSelector<TState, TValue>) {
      return createViewModelState(state, selector)
    },
  }
}

// Hydrates and persists a state value through Storage with configurable serialization hooks.
export function persistState<TValue>(
  state: State<TValue>,
  options: PersistStateOptions<TValue>
): PersistedStateHandle<TValue> {
  const serialize = options.serialize || ((value: TValue) => JSON.stringify(value))
  const deserialize = options.deserialize || ((raw: string) => JSON.parse(raw) as TValue)
  const hydrate = options.hydrate !== false
  const saveOnChange = options.saveOnChange !== false
  const saveInitial = options.saveInitial === true

  const load = () => {
    const raw = safeStorageGet(options.storage, options.key)
    if (raw == null) return undefined
    try {
      const loaded = deserialize(raw)
      state.set(loaded)
      return loaded
    } catch (error) {
      options.onError?.(error)
      return undefined
    }
  }

  const save = (nextValue = state.get()) => {
    runStorage(() => safeStorageSet(options.storage, options.key, serialize(nextValue)), options.onError)
  }

  const remove = () => {
    runStorage(() => safeStorageRemove(options.storage, options.key), options.onError)
  }

  if (hydrate) {
    load()
  }

  const unsub = saveOnChange
    ? state.onValueChange(
        (nextValue) => {
          save(nextValue)
        },
        { noInit: !saveInitial }
      )
    : () => {}

  return withDestroy(
    {
      load,
      save,
      remove,
    },
    unsub
  )
}
