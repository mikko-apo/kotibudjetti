import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest'
import { createState } from '../../../ki-frame/src'
import { div, input, text } from '../../../ki-frame/src/domBuilder'
import { setJsdomDoc } from '../../../ki-frame/src/tests/testUtil'
import {
  type CollectionPath,
  createTextNodesFromState,
  createStateCollectionEditor,
  mapStateToDomChildren,
  mapStatePathToInput,
  persistState,
  type StatePath,
} from './ki-frame-extensions'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.has(key) ? this.values.get(key)! : null
  }

  key(index: number) {
    return [...this.values.keys()][index] || null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function fireInput(node: HTMLInputElement, type: string = 'input') {
  const EventCtor = node.ownerDocument.defaultView!.Event
  node.dispatchEvent(new EventCtor(type, { bubbles: true }))
}

function assertCreateStateCollectionEditorPathTypes() {
  type Row = {
    id: string
    label: string
  }

  type NestedState = {
    section: {
      groups: Array<{
        rows: Row[]
      }>
    }
  }

  const state = createState<NestedState>({
    value: {
      section: {
        groups: [{ rows: [] }],
      },
    },
  })

  const rows = createStateCollectionEditor(state, ['section', 'groups', 0, 'rows'] as const)
  rows.append({ label: 'Nested row' })

  const validPath: CollectionPath<NestedState> = ['section', 'groups', 0, 'rows']
  expectTypeOf(validPath).toEqualTypeOf<['section', 'groups', number, 'rows']>()

  // @ts-expect-error createStateCollectionEditor path must resolve to an array of { id: string } items
  createStateCollectionEditor(state, ['section', 'groups'] as const)
}

function assertMapStatePathToInputPathTypes() {
  type FormState = {
    ipo: {
      currentShareValue: string
      totalShareCount: string
    }
    sell: {
      amount: string
    }
  }

  const state = createState<FormState>({
    value: {
      ipo: {
        currentShareValue: '',
        totalShareCount: '',
      },
      sell: {
        amount: '',
      },
    },
  })
  const node = input()

  const validPath: StatePath<FormState> = ['ipo', 'currentShareValue']
  expectTypeOf(validPath).toEqualTypeOf<['ipo', 'currentShareValue']>()

  mapStatePathToInput(state, ['ipo', 'currentShareValue'], node)

  // @ts-expect-error path must resolve against the nested state shape
  mapStatePathToInput(state, ['ipo', 'currentShareValue2'], node)
}

function assertCreateTextNodesFromStateTyping() {
  type LocalizationState = {
    texts: {
      title: string
      count: number
      nested: {
        subtitle: string
      }
      format: (value: string) => string
    }
  }

  const state = createState<LocalizationState>({
    value: {
      texts: {
        title: 'Title',
        count: 2,
        nested: {
          subtitle: 'Subtitle',
        },
        format: (value) => value,
      },
    },
  })

  const nodes = createTextNodesFromState(state, { path: ['texts'] })
  expectTypeOf(nodes.title).toEqualTypeOf<Text>()
  expectTypeOf(nodes.count).toEqualTypeOf<Text>()
  expectTypeOf(nodes.nested.subtitle).toEqualTypeOf<Text>()

  // @ts-expect-error function-valued fields are filtered out
  void nodes.format
}

function assertMapStateToDomChildrenCollectionTyping() {
  const state = createState({
    value: [
      { id: 'a', label: 'A', amount: 1 },
      { id: 'b', label: 'B', amount: 2 },
    ],
  })
  const root = div()

  mapStateToDomChildren(state, root, {
    render: (item) => {
      expectTypeOf(item).toEqualTypeOf<{ id: string; label: string; amount: number }>()
      return { node: div() }
    },
  })

  mapStateToDomChildren(createState({ value: { items: state.get() } }), root, {
    items: (value) => value.items,
    render: (item) => {
      expectTypeOf(item).toEqualTypeOf<{ id: string; label: string; amount: number }>()
      return { node: div() }
    },
  })
}

describe('ki-frame extensions', () => {
  beforeEach(() => {
    setJsdomDoc()
  })

  it('createStateCollectionEditor path typing compiles for nested collection paths', () => {
    assertCreateStateCollectionEditorPathTypes()
  })

  it('mapStatePathToInput path typing compiles for nested state paths', () => {
    assertMapStatePathToInputPathTypes()
  })

  it('createTextNodesFromState typing compiles for text-like subtrees', () => {
    assertCreateTextNodesFromStateTyping()
  })

  it('mapStateToDomChildren infers render item type from collection state', () => {
    assertMapStateToDomChildrenCollectionTyping()
  })

  it('mapStatePathToInput synchronizes form element values in both directions', () => {
    const state = createState({ value: { name: 'Ada' } })
    const node = input()
    const binding = mapStatePathToInput(state, ['name'], node)

    expect(node.value).toBe('Ada')

    state.set({ name: 'Linus' })
    expect(node.value).toBe('Linus')

    node.value = 'Grace'
    fireInput(node)
    expect(state.get().name).toBe('Grace')

    binding.destroy()
  })

  it('createTextNodesFromState mirrors primitive leaves and skips functions', () => {
    const state = createState({
      value: {
        texts: {
          title: 'Title',
          count: 2,
          nested: {
            subtitle: 'Subtitle',
          },
          format(value: string) {
            return value.toUpperCase()
          },
        },
      },
    })

    const nodes = createTextNodesFromState(state, { path: ['texts'] })

    expect(nodes.title.textContent).toBe('Title')
    expect(nodes.count.textContent).toBe('2')
    expect(nodes.nested.subtitle.textContent).toBe('Subtitle')
    expect('format' in nodes).toBe(false)

    state.set({
      texts: {
        title: 'Updated',
        count: 3,
        nested: {
          subtitle: 'Changed',
        },
        format(value: string) {
          return value.toLowerCase()
        },
      },
    })

    expect(nodes.title.textContent).toBe('Updated')
    expect(nodes.count.textContent).toBe('3')
    expect(nodes.nested.subtitle.textContent).toBe('Changed')

    nodes.destroy()
  })

  it('createTextNodesFromState supports noInit', () => {
    const state = createState({
      value: {
        texts: {
          title: 'Title',
        },
      },
    })

    const nodes = createTextNodesFromState(state, { path: ['texts'], noInit: true })

    expect(nodes.title.textContent).toBe('')

    state.set({
      texts: {
        title: 'Updated',
      },
    })

    expect(nodes.title.textContent).toBe('Updated')

    nodes.destroy()
  })

  it('createTextNodesFromState supports whole-state roots without a path', () => {
    const state = createState({
      value: {
        title: 'Title',
        nested: {
          subtitle: 'Subtitle',
        },
      },
    })

    const nodes = createTextNodesFromState(state)

    expect(nodes.title.textContent).toBe('Title')
    expect(nodes.nested.subtitle.textContent).toBe('Subtitle')

    state.set({
      title: 'Updated',
      nested: {
        subtitle: 'Changed',
      },
    })

    expect(nodes.title.textContent).toBe('Updated')
    expect(nodes.nested.subtitle.textContent).toBe('Changed')

    nodes.destroy()
  })

  it('mapStateToDomChildren keeps keyed rows stable while reordering and removing items', () => {
    const state = createState({
      value: {
        items: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
      },
    })
    const root = div()

    const handle = mapStateToDomChildren(state, root, {
      items: (value) => value.items,
      key: (item, index, stateValue) => {
        void index
        void stateValue.items.length
        return item.id
      },
      render: (item) => {
        const label = text(item.label)
        const node = div(label)
        return {
          node,
          set(nextItem) {
            label.textContent = nextItem.label
          },
        }
      },
    })

    const firstANode = root.childNodes[0]
    const firstBNode = root.childNodes[1]

    state.set({
      items: [
        { id: 'b', label: 'Bee' },
        { id: 'a', label: 'Aye' },
        { id: 'c', label: 'See' },
      ],
    })

    expect(root.childNodes).toHaveLength(3)
    expect(root.childNodes[0]).toBe(firstBNode)
    expect(root.childNodes[1]).toBe(firstANode)
    expect((root.childNodes[0] as HTMLElement).textContent).toBe('Bee')
    expect((root.childNodes[1] as HTMLElement).textContent).toBe('Aye')
    expect((root.childNodes[2] as HTMLElement).textContent).toBe('See')

    state.set({
      items: [{ id: 'c', label: 'Sea' }],
    })

    expect(root.childNodes).toHaveLength(1)
    expect((root.childNodes[0] as HTMLElement).textContent).toBe('Sea')

    handle.destroy()
  })

  it('mapStateToDomChildren defaults items and key for collection states with id', () => {
    const state = createState({
      value: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
    })
    const root = div()

    const handle = mapStateToDomChildren(state, root, {
      render: (item) => {
        const label = text(item.label)
        const node = div(label)
        return {
          node,
          set(nextItem) {
            label.textContent = nextItem.label
          },
        }
      },
    })

    const firstANode = root.childNodes[0]
    const firstBNode = root.childNodes[1]

    state.set([
      { id: 'b', label: 'Bee' },
      { id: 'a', label: 'Aye' },
      { id: 'c', label: 'See' },
    ])

    expect(root.childNodes).toHaveLength(3)
    expect(root.childNodes[0]).toBe(firstBNode)
    expect(root.childNodes[1]).toBe(firstANode)
    expect((root.childNodes[0] as HTMLElement).textContent).toBe('Bee')
    expect((root.childNodes[1] as HTMLElement).textContent).toBe('Aye')
    expect((root.childNodes[2] as HTMLElement).textContent).toBe('See')

    handle.destroy()
  })

  it('mapStateToDomChildren accepts render shorthand for id collections', () => {
    const state = createState({
      value: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
    })
    const root = div()

    const handle = mapStateToDomChildren(state, root, (item) => {
      const label = text(item.label)
      const node = div(label)
      return {
        node,
        set(nextItem) {
          label.textContent = nextItem.label
        },
      }
    })

    expect((root.childNodes[0] as HTMLElement).textContent).toBe('A')
    expect((root.childNodes[1] as HTMLElement).textContent).toBe('B')

    state.set([
      { id: 'b', label: 'Bee' },
      { id: 'a', label: 'Aye' },
    ])

    expect((root.childNodes[0] as HTMLElement).textContent).toBe('Bee')
    expect((root.childNodes[1] as HTMLElement).textContent).toBe('Aye')

    handle.destroy()
  })

  it('mapStateToDomChildren supports noInit option', () => {
    const state = createState({
      value: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
    })
    const root = div()

    const handle = mapStateToDomChildren(state, root, {
      noInit: true,
      render: (item) => {
        const label = text(item.label)
        return {
          node: div(label),
          set(nextItem) {
            label.textContent = nextItem.label
          },
        }
      },
    })

    expect(root.childNodes).toHaveLength(0)

    state.set([
      { id: 'a', label: 'Aye' },
      { id: 'b', label: 'Bee' },
      { id: 'c', label: 'See' },
    ])

    expect(root.childNodes).toHaveLength(3)
    expect((root.childNodes[0] as HTMLElement).textContent).toBe('Aye')
    expect((root.childNodes[1] as HTMLElement).textContent).toBe('Bee')
    expect((root.childNodes[2] as HTMLElement).textContent).toBe('See')

    handle.destroy()
  })

  it('createStateCollectionEditor manages array state by id', () => {
    type Item = {
      id: string
      label: string
    }
    type StateShape = {
      items: Item[]
    }

    const state = createState<StateShape>({ value: { items: [] } })
    let nextId = 1
    const collection = createStateCollectionEditor(state, ['items'] as const, () => `id-${nextId++}`)

    const first = collection.append({ label: 'First' })
    collection.insert(0, { id: 'fixed', label: 'Zero' })
    collection.patch(first.id, { label: 'First patched' })
    collection.move(first.id, 0)

    expect(state.get().items.map((item) => `${item.id}:${item.label}`)).toEqual([
      `${first.id}:First patched`,
      'fixed:Zero',
    ])

    collection.remove('fixed')

    const sameCollection = createStateCollectionEditor(state, ['items'] as const)
    expect(sameCollection.get()).toEqual([{ id: first.id, label: 'First patched' }])
    sameCollection.clear()
    expect(state.get().items).toEqual([])
  })

  it('createStateCollectionEditor passes item index and state to key', () => {
    type Item = {
      id: string
      label: string
    }
    type StateShape = {
      prefix: string
      items: Item[]
    }

    const state = createState<StateShape>({ value: { prefix: 'row', items: [] } })
    const collection = createStateCollectionEditor(
      state,
      ['items'] as const,
      (item, index, stateValue) => `${stateValue.prefix}-${index}-${item.label.toLowerCase()}`
    )

    const first = collection.append({ label: 'First' })
    const second = collection.insert(0, { label: 'Zero' })

    expect(first.id).toBe('row-0-first')
    expect(second.id).toBe('row-0-zero')
    expect(state.get().items.map((item) => item.id)).toEqual(['row-0-zero', 'row-0-first'])
  })

  it('persistState hydrates, saves, loads, and removes state', () => {
    const storage = new MemoryStorage()
    storage.setItem('counter', JSON.stringify({ count: 5 }))

    const state = createState({ value: { count: 0 } })
    const persisted = persistState(state, {
      storage,
      key: 'counter',
    })

    expect(state.get()).toEqual({ count: 5 })

    state.set({ count: 6 })
    expect(storage.getItem('counter')).toBe(JSON.stringify({ count: 6 }))

    storage.setItem('counter', JSON.stringify({ count: 8 }))
    expect(persisted.load()).toEqual({ count: 8 })
    expect(state.get()).toEqual({ count: 8 })

    persisted.remove()
    expect(storage.getItem('counter')).toBeNull()

    persisted.destroy()
  })
})
