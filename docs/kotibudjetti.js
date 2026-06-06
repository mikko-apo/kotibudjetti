'use strict'
;(() => {
  // ../ki-frame/src/util/objectIdCounter.ts
  var runningId = 0
  function getId() {
    return runningId++
  }
  function createId(id) {
    return `${id}-${getId()}`
  }

  // ../ki-frame/src/channel.ts
  var Channel = class {
    constructor(name) {
      this.subs = /* @__PURE__ */ new Set()
      this.idTxt = (txt) => `${this.id}: ${txt}`
      this.id = createId(name)
    }
    subscribe(fn) {
      this.subs.add(fn)
      return () => {
        this.unsubscribe(fn)
      }
    }
    subscribeFn() {
      return (fn) => this.subscribe(fn)
    }
    // subscribe once: handler auto-unsubscribe after first invocation
    once(fn) {
      const unsub = () => this.unsubscribe(wrapper)
      const wrapper = (...args) => {
        unsub()
        fn(...args)
      }
      this.subs.add(wrapper)
      return unsub
    }
    unsubscribe(fn) {
      this.subs.delete(fn)
    }
    // synchronous publish — invokes handlers and doesn't wait for Promises
    publish(...args) {
      for (const fn of Array.from(this.subs)) {
        try {
          fn(...args)
        } catch (err) {
          console.error(this.idTxt(`Error in channel.publish() for '${this.id}':`), err)
        }
      }
    }
    // asynchronous publish — waits for all subscribers; rejects if any rejects
    async publishAsync(...args) {
      const promises = Array.from(this.subs).map(async (fn) => fn(...args))
      const settled = await Promise.allSettled(promises)
      const rejections = settled.filter((s2) => s2.status === 'rejected')
      if (rejections.length) {
        const err = new Error(`${rejections.length} subscriber(s) failed`)
        err.details = rejections.map((r) => r.reason)
        throw err
      }
    }
    destroy() {
      this.subs.clear()
    }
  }

  // ../ki-frame/src/form.ts
  var FormsInput = class {
    constructor(node, key, map2, validate) {
      this.node = node
      this.key = key
      this.map = map2
      this.validate = validate
    }
  }
  function collectFormsInputs(root) {
    const out = []
    function visit2(node, pathParts) {
      if (node == null) return
      if (node instanceof FormsInput) {
        const path = pathParts.map((p2) => String(p2)).join('.')
        out.push([path, node])
        return
      }
      if (Array.isArray(node)) {
        for (let i2 = 0; i2 < node.length; i2++) {
          visit2(node[i2], [...pathParts, i2])
        }
        return
      }
      if (typeof node === 'object') {
        for (const key of Object.keys(node)) {
          visit2(node[key], [...pathParts, key])
        }
        return
      }
    }
    visit2(root, [])
    return out
  }
  function readRaw(node) {
    var _a2
    const anyNode = node
    if ('value' in anyNode && typeof anyNode.value === 'string') return anyNode.value
    return String((_a2 = node.textContent) != null ? _a2 : '')
  }

  // ../ki-frame/src/promiseDestroy.ts
  var PromiseDestroy = class _PromiseDestroy {
    constructor(promise, destroy = () => {}) {
      this.promise = promise
      this.destroy = destroy
    }
    /**
     * Promise.then implementation. Can be used to map the response to another value
     *
     * - Delegates to the internal `response` promise.
     * - Returns a NEW FetchReturn whose `response` is the mapped promise.
     * - If no handlers are provided, returns `this` (typed via cast).
     */
    then(onfulfilled, onrejected) {
      if (!onfulfilled && !onrejected) {
        return this.promise
      }
      return this.promise.then(onfulfilled, onrejected)
    }
    catch(onrejected) {
      if (!onrejected) {
        return this
      }
      return this.promise.catch(onrejected)
    }
    finally(onfinally) {
      return this.promise.finally(onfinally)
    }
    get [Symbol.toStringTag]() {
      return _PromiseDestroy.name
    }
    /**
     * Optional: explicit toString which mirrors Object.prototype.toString
     */
    toString() {
      return Object.prototype.toString.call(this)
    }
  }
  var _a
  var TimeoutDestroyable = class {
    constructor(fn, timeout) {
      this.fn = fn
      this.timeout = timeout
      this.at = Date.now() + ((_a = this.timeout) != null ? _a : 0)
      this.id = setTimeout(this.fn, this.timeout)
    }
    destroy() {
      clearTimeout(this.id)
    }
  }
  var FetchDestroyable = class extends PromiseDestroy {
    constructor(url, timeoutMs, promise, destroy) {
      super(promise, destroy)
      this.url = url
      this.timeoutMs = timeoutMs
      this.promise = promise
      this.destroy = destroy
    }
  }

  // ../ki-frame/src/util/getByPath.ts
  function getByPath(obj, path) {
    if (obj == null) return void 0
    let segments
    if (Array.isArray(path)) {
      segments = path.map((p2) => (typeof p2 === 'string' && /^\d+$/.test(p2) ? Number(p2) : p2))
    } else if (typeof path === 'string') {
      if (path === '') return obj
      segments = path.split('.').map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg))
    } else {
      return void 0
    }
    let cur = obj
    for (const seg of segments) {
      if (cur == null) return void 0
      cur = cur[seg]
    }
    return cur
  }

  // ../ki-frame/src/util/setByPath.ts
  function setByPath(obj, path, value) {
    if (typeof path === 'string') {
      path = path.split('.').map((seg) => {
        return /^[0-9]+$/.test(seg) ? Number(seg) : seg
      })
    }
    if (path.length === 0) return
    let cur = obj
    for (let i2 = 0; i2 < path.length - 1; i2++) {
      const key = path[i2]
      if (cur[key] == null) {
        const nextKey = path[i2 + 1]
        cur[key] = typeof nextKey === 'number' ? [] : {}
      }
      cur = cur[key]
    }
    const lastKey = path[path.length - 1]
    cur[lastKey] = value
  }
  function copyAndSet(obj, path, value) {
    const segments = Array.isArray(path)
      ? path.map((p2) => (typeof p2 === 'string' && /^\d+$/.test(p2) ? Number(p2) : p2))
      : path === ''
        ? []
        : path.split('.').map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg))
    if (segments.length === 0) return value
    const parents = []
    let cur = obj
    parents.push(cur)
    for (const seg of segments) {
      cur = cur !== null && typeof cur === 'object' ? cur[seg] : void 0
      parents.push(cur)
    }
    let newChild = value
    for (let i2 = segments.length - 1; i2 >= 0; i2--) {
      const key = segments[i2]
      const origParent = parents[i2]
      let newParent
      if (Array.isArray(origParent)) {
        newParent = origParent.slice()
      } else if (origParent !== null && typeof origParent === 'object') {
        newParent = { ...origParent }
      } else {
        newParent = typeof key === 'number' ? [] : {}
      }
      if (Array.isArray(newParent) && typeof key === 'number') {
        if (key >= newParent.length) {
          newParent.length = key + 1
        }
      }
      newParent[key] = newChild
      newChild = newParent
    }
    return newChild
  }

  // ../ki-frame/src/util/strongOrWeakSet.ts
  var StrongOrWeakSet = class {
    constructor(mode) {
      this.coerce = mode
    }
    *all() {
      if (this.items) {
        for (const i2 of this.items) {
          if (i2 instanceof WeakRef) {
            const deref = i2.deref()
            if (deref === void 0) {
              this.items.delete(i2)
            } else {
              yield deref
            }
          } else {
            yield i2
          }
        }
      }
    }
    add(item, itemMode = this.coerce) {
      const weakRef = new WeakRef(item)
      const unsub = () => {
        const deref = weakRef.deref()
        if (deref) {
          this.delete(deref)
        }
      }
      for (const i2 of this.all()) {
        if (i2 === item) {
          return unsub
        }
      }
      const newItem = itemMode === 'weak' ? weakRef : item
      if (!this.items) {
        this.items = /* @__PURE__ */ new Set()
      }
      this.items.add(newItem)
      return unsub
    }
    delete(item) {
      if (this.items) {
        for (const i2 of this.items) {
          if (i2 instanceof WeakRef) {
            const deref = i2.deref()
            if (deref === void 0 || deref === item) {
              this.items.delete(i2)
            }
          } else {
            if (i2 === item) {
              this.items.delete(i2)
            }
          }
        }
        if (this.items.size === 0) {
          this.destroy()
        }
      }
    }
    destroy() {
      if (this.items) {
        this.items.clear()
        this.items = void 0
      }
    }
  }
  var DestroyableSet = class extends StrongOrWeakSet {
    destroy() {
      for (const destroyable of this.all()) {
        try {
          destroyable.destroy()
        } catch (err) {
          console.error(`Error in destroying item`, err)
        }
      }
      super.destroy()
    }
  }

  // ../ki-frame/src/util/typeUtils.ts
  function isDefined(item) {
    return item !== void 0 && item !== null
  }

  // ../ki-frame/src/util/standardSchemaUtil.ts
  function schemaValidate(schema, obj, processValue, onValidateFailure) {
    const checkResult = (result) => {
      if (result.issues) {
        onValidateFailure == null ? void 0 : onValidateFailure(result)
      } else {
        processValue(result.value)
      }
    }
    const maybePromise = schema['~standard'].validate(obj)
    if (maybePromise instanceof Promise) {
      maybePromise.then(checkResult)
    } else {
      checkResult(maybePromise)
    }
  }

  // ../ki-frame/src/state.ts
  function shallowEqual(a2, b2) {
    return a2 === b2
  }
  var Context = class {
    constructor(controllers = new DestroyableSet('weak')) {
      this.controllers = controllers
    }
    createController(options) {
      const controller = new Controller(options)
      this.controllers.add(controller)
      return controller
    }
    createState(params) {
      const state = new State(params)
      this.controllers.add(state)
      return state
    }
    createForm(t, initValuesOrLinkedState, options) {
      const form2 = new FormState(t, initValuesOrLinkedState, options)
      form2.parent = this
      this.controllers.add(form2)
      return form2
    }
    destroy() {
      var _a2
      ;(_a2 = this.parent) == null ? void 0 : _a2.controllers.delete(this)
      this.controllers.destroy()
    }
  }
  var Controller = class extends Context {
    constructor({ name = 'controller', weakRef = false, parent } = {}) {
      super()
      this._destroyed = false
      this.registeredSources = new DestroyableSet()
      this.onDestroyListeners = new DestroyableSet()
      this.linkedStates = /* @__PURE__ */ new Set()
      this.eventSources = []
      this.id = getId()
      this.parent = parent
      this.options = { name, weakRef }
    }
    getOutputChannel() {
      if (!isDefined(this.outputChannel)) {
        this.outputChannel = new Channel(`${this.stateId}-onChange`)
      }
      return this.outputChannel
    }
    get stateId() {
      return `${this.options.name}-${this.id}`
    }
    get destroyed() {
      return this._destroyed
    }
    idTxt(txt) {
      return `${this.stateId}: ${txt}`
    }
    describe() {
      return {
        name: this.stateId,
      }
    }
    updateUi() {
      if (this.outputChannel) {
        this.outputChannel.publish({ type: 'updateUi' })
      }
    }
    subscribe(cb) {
      if (this.destroyed) throw new Error(this.idTxt('Cannot subscribe to destroyed state'))
      return this.getOutputChannel().subscribe(cb)
    }
    addLinkedState(controller, options) {
      const value = { controller, ...(options || {}) }
      this.linkedStates.add(value)
      return () => this.linkedStates.delete(value)
    }
    onDestroy(target) {
      if (typeof target === 'function') {
        if (this.destroyed) {
          target()
          return () => {}
        }
        const info = {
          type: 'function',
          destroy: target,
        }
        return this.onDestroyListeners.add(info)
      } else {
        if (this.destroyed) {
          target.destroy()
          return () => {}
        }
        return this.onDestroyListeners.add(target)
      }
    }
    /** Notify onDestroy() subscribers and call .destroy() for all attached states.
     * For an attached state also removes the state from parent.
     * Safe to call multiple times.
     **/
    destroy() {
      var _a2, _b
      super.destroy()
      if (this.destroyed) return
      this._destroyed = true
      for (const linkedState of Array.from(this.linkedStates)) {
        if (
          !isDefined((_a2 = linkedState == null ? void 0 : linkedState.events) == null ? void 0 : _a2.destroy) ||
          linkedState.events.destroy
        ) {
          linkedState.controller.destroy()
        }
      }
      this.linkedStates.clear()
      this.registeredSources.destroy()
      this.onDestroyListeners.destroy()
      for (const es of this.eventSources) {
        if (es.weakRefUnsub) {
          const unsub = es.weakRefUnsub.deref()
          if (unsub) unsub()
          es.weakRefUnsub = void 0
        }
        if (es.unsub) {
          es.unsub()
        }
        es.source = void 0
      }
      ;(_b = this.outputChannel) == null ? void 0 : _b.destroy()
      this.eventSources.length = 0
    }
    addDomEvent(name, node, type, listener, options) {
      node.addEventListener(type, listener, options)
      const unsub = () => node.removeEventListener(type, listener, options)
      if (this.options.weakRef) {
        this.eventSources.push({
          name: `${name}: <${node.nodeName}>.${type} -> ${this.stateId}`,
          type: 'dom',
          source: new WeakRef(node),
          weakRefUnsub: new WeakRef(unsub),
        })
      } else {
        this.eventSources.push({
          name: `${name}: <${node.nodeName}>.${type} -> ${this.stateId}`,
          type: 'dom',
          source: new WeakRef(node),
          unsub,
        })
      }
      return unsub
    }
    timeout(fn, at = 0) {
      const unregisterDestroyableAndCallItsDestroy = this.registeredSources.add(
        new TimeoutDestroyable(() => {
          unregisterDestroyableAndCallItsDestroy()
          fn()
        }, at)
      )
      return unregisterDestroyableAndCallItsDestroy
    }
    fetch(url, fetchOptions) {
      const { timeoutMs, map: map2, assertOk = true, ...fetchInit } = fetchOptions != null ? fetchOptions : {}
      const createAbortController = (destroy) => {
        const abortController2 = new AbortController()
        const destroyAbortController2 = () => {
          timeoutUnsub()
          abortController2.abort()
          destroy()
        }
        const timeoutUnsub = this.timeout(destroyAbortController2, timeoutMs)
        return [abortController2, destroyAbortController2]
      }
      const [abortController, destroyAbortController] = isDefined(timeoutMs)
        ? createAbortController(() => unregisterDestroyableAndCallItsDestroy())
        : []
      const response = fetch(url, {
        ...fetchInit,
        signal: abortController == null ? void 0 : abortController.signal,
      })
      const maybeOkResponse = assertOk
        ? response.then((response2) => {
            if ((typeof assertOk === 'function' && assertOk(response2) === false) || !response2.ok) {
              throw { errorResponse: response2 }
            }
            return response2
          })
        : response
      const unregisterDestroyableAndCallItsDestroy = this.registeredSources.add(
        new FetchDestroyable(url, timeoutMs, maybeOkResponse, () => {
          unregisterDestroyableAndCallItsDestroy()
          destroyAbortController == null ? void 0 : destroyAbortController()
        })
      )
      maybeOkResponse.finally(unregisterDestroyableAndCallItsDestroy)
      if (map2) {
        const mappedPromise = (async () => {
          return map2(maybeOkResponse)
        })()
        return new PromiseDestroy(mappedPromise, unregisterDestroyableAndCallItsDestroy)
      }
      return new PromiseDestroy(maybeOkResponse, unregisterDestroyableAndCallItsDestroy)
    }
  }
  function getMergedStateValue(states) {
    const value = {}
    for (const key of Object.keys(states)) {
      value[key] = states[key].get()
    }
    return value
  }
  var _State = class _State extends Controller {
    constructor({ name = 'state', weakRef = false, value, parent, schema, onValidateFailure } = {}) {
      super({ name, weakRef, parent })
      this.value = value
      this.schema = schema
      this.onValidateFailure = onValidateFailure
    }
    get() {
      if (this.destroyed) throw new Error(this.idTxt('State destroyed. Cannot get value'))
      return this.value
    }
    getOnChange() {
      if (!isDefined(this.onChange)) {
        this.onChange = new Channel(`${this.stateId}-onChange`)
      }
      return this.onChange
    }
    set(valueOrInputOrFn, onValidateFailure) {
      if (this.destroyed) throw new Error(this.idTxt('State destroyed. Cannot set() value'))
      const old = this.value
      const value = typeof valueOrInputOrFn === 'function' ? valueOrInputOrFn(this.value) : valueOrInputOrFn
      if (value === _State.Never) return
      if (!shallowEqual(old, value)) {
        const setAndPublish = () => {
          this.value = value
          this.getOnChange().publish(this.value, old ? old : value)
        }
        if (this.schema) {
          schemaValidate(this.schema, value, setAndPublish, (failure) => {
            var _a2
            ;(_a2 = this.onValidateFailure) == null ? void 0 : _a2.call(this, failure)
            onValidateFailure == null ? void 0 : onValidateFailure(failure)
          })
        } else {
          setAndPublish()
        }
      }
    }
    update(partialValueOrInputOrFn, onValidateFailure) {
      if (this.destroyed) throw new Error(this.idTxt('State destroyed. Cannot update() value'))
      if (this.value === void 0) throw new Error(this.idTxt('State is undefined. Can not update() value'))
      if (typeof this.value !== 'object') throw new Error(this.idTxt('State is not an object. Can not update() value'))
      const updateObject =
        typeof partialValueOrInputOrFn === 'function' ? partialValueOrInputOrFn(this.value) : partialValueOrInputOrFn
      if (updateObject === _State.Never) return
      this.set({ ...this.value, ...updateObject }, onValidateFailure)
    }
    onValueChange(cb, params) {
      if (this.destroyed) throw new Error(this.idTxt('Cannot subscribe to destroyed state'))
      const unsub = this.getOnChange().subscribe(cb)
      if (isDefined(this.value) && !(params == null ? void 0 : params.noInit)) {
        cb(this.value, this.value)
      }
      return unsub
    }
    destroy() {
      var _a2
      super.destroy()
      ;(_a2 = this.onChange) == null ? void 0 : _a2.destroy()
    }
    map(map2, params = {}) {
      const state = new _State({ ...params })
      this.onValueChange((obj) => {
        state.set((cur) => map2(obj, cur))
      })
      return state
    }
    reducer(reducer) {
      return (action) => this.set((value) => reducer(action, value))
    }
  }
  _State.Never = /* @__PURE__ */ Symbol('State.Never')
  var State = _State
  function mergeStates(states, mapper) {
    const calculateValue = (cur) => {
      const mergedValue = getMergedStateValue(states)
      if (!mapper) return mergedValue
      return mapper(mergedValue, cur)
    }
    const initialValue = calculateValue()
    const mergedState = initialValue === State.Never ? new State() : new State({ value: initialValue })
    const unsubs = Object.keys(states).map((key) =>
      states[key].onValueChange(
        () => {
          mergedState.set((cur) => calculateValue(cur))
        },
        { noInit: true }
      )
    )
    mergedState.onDestroy(() => {
      for (const unsub of unsubs) {
        unsub()
      }
    })
    return mergedState
  }
  var FormState = class extends State {
    constructor(t, initValuesOrLinkedState, options) {
      const { validate } = options || {}
      const inputs2 = collectFormsInputs(t)
      if (initValuesOrLinkedState instanceof State) {
        const initState = initValuesOrLinkedState.get()
        const init = {}
        inputs2.forEach(([path]) => setByPath(init, path, getByPath(initState, path)))
        super(init)
        this.configureInputs(this, inputs2)
        this.onValueChange((newState) => {
          if (validate && !validate(newState)) {
            return
          }
          initValuesOrLinkedState.update(newState)
        })
      } else {
        super(initValuesOrLinkedState)
        if (validate) {
          const validInputValuesState = this.createState({ value: initValuesOrLinkedState })
          validInputValuesState.options.name = 'valid input values'
          validInputValuesState.onValueChange((newState) => {
            if (!validate(newState)) {
              return
            }
            this.set(newState)
          })
          this.configureInputs(validInputValuesState, inputs2)
        } else {
          this.configureInputs(this, inputs2)
        }
      }
    }
    configureInputs(inputState, inputs2) {
      for (const [path, input2] of inputs2) {
        const state = inputState.get()
        const value = getByPath(state, path)
        if (input2.node instanceof HTMLInputElement) {
          input2.node.value = value
        }
        inputState.addDomEvent(path, input2.node, input2.key, (ev) => {
          const value2 = input2.map ? input2.map(readRaw(input2.node)) : readRaw(input2.node)
          if (input2.validate && !input2.validate(value2, input2.node, ev)) {
            return
          }
          const newState = copyAndSet(inputState.get(), path, value2)
          inputState.set(newState)
        })
      }
    }
    onsubmit(root, listener, options) {
      return this.addDomEvent(
        'submit',
        root,
        'submit',
        (ev) => {
          ev.preventDefault()
          listener(ev)
        },
        options
      )
    }
  }

  // ../ki-frame/src/index.ts
  var defaultContext = new Context()
  var createController = defaultContext.createController.bind(defaultContext)
  var createState = defaultContext.createState.bind(defaultContext)
  var createForm = defaultContext.createForm.bind(defaultContext)

  // ../ki-frame/src/domBuilderEvents.ts
  var EventHandlerObject = class {
    constructor(events2) {
      this.events = events2
    }
  }
  function events(events2) {
    return new EventHandlerObject(
      events2 instanceof EventHandlerObject || 'events' in events2 ? events2.events : events2
    )
  }
  function setEvents(node, arg) {
    const ev = arg instanceof EventHandlerObject ? arg : events(arg)
    Object.entries(ev.events).forEach(([key, fn]) => {
      node.addEventListener(key, (event) => {
        fn == null ? void 0 : fn({ node, event })
      })
    })
  }

  // ../ki-frame/src/domBuilderStyles.ts
  function setClass(element, argValue) {
    const classList = element.classList
    const visit2 = (argValue2) => {
      if (Array.isArray(argValue2)) {
        argValue2.forEach((arg) => visit2(arg))
      } else {
        classList.add(...argValue2.split(' '))
      }
    }
    visit2(argValue)
  }
  function styles(...inputs2) {
    const flat = {}
    for (const input2 of Array.from(inputs2).flat()) {
      if (input2 instanceof StylesObject) {
        Object.assign(flat, input2.styles)
      } else {
        Object.assign(flat, input2)
      }
    }
    return new StylesObject(flat)
  }
  var StylesObject = class {
    constructor(styles2) {
      this.styles = styles2
    }
  }
  var UNIT_PX_PROPS = /* @__PURE__ */ new Set([
    // common layout/size props
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'margin',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'gap',
    'rowGap',
    'columnGap',
    'fontSize',
    'borderWidth',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderRadius',
    'outlineWidth',
    'letterSpacing',
    'lineHeight',
  ])
  function convertPrimitiveValue(prop, val) {
    if (val === null || val === void 0) return ''
    if (typeof val === 'number') {
      if (prop.startsWith('--')) return String(val)
      if (UNIT_PX_PROPS.has(prop)) return `${val}px`
      return String(val)
    }
    return String(val)
  }
  function convertArrayValue(prop, arr) {
    const flat = []
    for (const v of arr) {
      if (Array.isArray(v)) {
        for (const vv of v) flat.push(vv)
      } else {
        flat.push(v)
      }
    }
    const parts = flat.map((p2) => convertPrimitiveValue(prop, p2))
    return parts.join(', ')
  }
  function setStyle(el, ...inputs2) {
    for (const style2 of inputs2) {
      for (const key in style2) {
        if (!Object.prototype.hasOwnProperty.call(style2, key)) continue
        const raw = style2[key]
        if (isDefined(raw)) {
          if (key.startsWith('--')) {
            if (Array.isArray(raw)) {
              const val = convertArrayValue(key, raw)
              el.style.setProperty(key, val)
            } else {
              const val = convertPrimitiveValue(key, raw)
              el.style.setProperty(key, val)
            }
            continue
          }
          let finalValue
          if (Array.isArray(raw)) {
            finalValue = convertArrayValue(key, raw)
          } else {
            finalValue = convertPrimitiveValue(key, raw)
          }
          el.style[key] = finalValue
        }
      }
    }
  }

  // ../ki-frame/src/types.ts
  var WrappedNode = class {
    constructor(node) {
      this.node = node
    }
  }

  // ../ki-frame/src/domBuilder.ts
  function visit(element, fragment, ...args) {
    args.forEach((arg) => {
      if (arg === false || arg === void 0) {
      } else if (Array.isArray(arg)) {
        visit(element, fragment, ...arg)
      } else if (isAppendableNode(arg)) {
        fragment.appendChild(arg)
      } else if (arg instanceof WrappedNode) {
        fragment.appendChild(arg.node)
      } else if (arg instanceof StylesObject) {
        setStyle(element, arg.styles)
      } else if (arg instanceof EventHandlerObject) {
        setEvents(element, arg)
      } else if (typeof arg === 'string' || typeof arg === 'number') {
        fragment.appendChild(getDocument().createTextNode(String(arg)))
      } else if (typeof arg === 'object') {
        Object.entries(arg).forEach(([key, argValue]) => {
          if (key === 'class') {
            setClass(element, argValue)
          } else if (key === 'styles') {
            setStyle(element, argValue)
          } else if (key === 'events') {
            setEvents(element, argValue)
          } else if (key.startsWith('on') && typeof argValue === 'function') {
            const event = key.substring(2).toLowerCase()
            element.addEventListener(event, argValue)
          } else {
            element.setAttribute(key, argValue)
          }
        })
      }
    })
  }
  function appendOrReplace(replace, elementOrWrapped, ...args) {
    const element = elementOrWrapped instanceof WrappedNode ? elementOrWrapped.node : elementOrWrapped
    const fragment = getDocument().createDocumentFragment()
    visit(element, fragment, ...args)
    if (replace) {
      element.replaceChildren(fragment)
    } else {
      element.appendChild(fragment)
    }
  }
  function appendChildren(element, ...args) {
    appendOrReplace(false, element, ...args)
  }
  function replaceChildren(element, ...args) {
    appendOrReplace(true, element, ...args)
  }
  var doc = typeof document !== 'undefined' ? document : void 0
  var isAppendableNode = (e) => {
    return typeof document !== 'undefined' && !![HTMLElement, Text].find((value) => e instanceof value)
  }
  function getDocument() {
    if (doc) {
      return doc
    }
    throw new Error('document is undefined')
  }
  function createElement(tagName, ...args) {
    const element = getDocument().createElement(tagName)
    appendChildren(element, ...args)
    return element
  }
  var createElementFn =
    (tagName) =>
    (...args) =>
      createElement(tagName, ...args)
  var a = createElementFn('a')
  var abbr = createElementFn('abbr')
  var address = createElementFn('address')
  var area = createElementFn('area')
  var article = createElementFn('article')
  var aside = createElementFn('aside')
  var audio = createElementFn('audio')
  var b = createElementFn('b')
  var base = createElementFn('base')
  var bdi = createElementFn('bdi')
  var bdo = createElementFn('bdo')
  var blockquote = createElementFn('blockquote')
  var body = createElementFn('body')
  var br = createElementFn('br')
  var button = createElementFn('button')
  var canvas = createElementFn('canvas')
  var caption = createElementFn('caption')
  var cite = createElementFn('cite')
  var code = createElementFn('code')
  var col = createElementFn('col')
  var colgroup = createElementFn('colgroup')
  var data = createElementFn('data')
  var datalist = createElementFn('datalist')
  var dd = createElementFn('dd')
  var del = createElementFn('del')
  var details = createElementFn('details')
  var dfn = createElementFn('dfn')
  var dialog = createElementFn('dialog')
  var div = createElementFn('div')
  var dl = createElementFn('dl')
  var dt = createElementFn('dt')
  var em = createElementFn('em')
  var embed = createElementFn('embed')
  var fieldset = createElementFn('fieldset')
  var figcaption = createElementFn('figcaption')
  var figure = createElementFn('figure')
  var footer = createElementFn('footer')
  var form = createElementFn('form')
  var h1 = createElementFn('h1')
  var h2 = createElementFn('h2')
  var h3 = createElementFn('h3')
  var h4 = createElementFn('h4')
  var h5 = createElementFn('h5')
  var h6 = createElementFn('h6')
  var head = createElementFn('head')
  var header = createElementFn('header')
  var hgroup = createElementFn('hgroup')
  var hr = createElementFn('hr')
  var html = createElementFn('html')
  var i = createElementFn('i')
  var iframe = createElementFn('iframe')
  var img = createElementFn('img')
  var input = createElementFn('input')
  var ins = createElementFn('ins')
  var kbd = createElementFn('kbd')
  var label = createElementFn('label')
  var legend = createElementFn('legend')
  var li = createElementFn('li')
  var link = createElementFn('link')
  var main = createElementFn('main')
  var map = createElementFn('map')
  var mark = createElementFn('mark')
  var menu = createElementFn('menu')
  var meta = createElementFn('meta')
  var meter = createElementFn('meter')
  var nav = createElementFn('nav')
  var noscript = createElementFn('noscript')
  var object = createElementFn('object')
  var ol = createElementFn('ol')
  var optgroup = createElementFn('optgroup')
  var option = createElementFn('option')
  var output = createElementFn('output')
  var p = createElementFn('p')
  var picture = createElementFn('picture')
  var pre = createElementFn('pre')
  var progress = createElementFn('progress')
  var q = createElementFn('q')
  var rp = createElementFn('rp')
  var rt = createElementFn('rt')
  var ruby = createElementFn('ruby')
  var s = createElementFn('s')
  var samp = createElementFn('samp')
  var script = createElementFn('script')
  var search = createElementFn('search')
  var section = createElementFn('section')
  var select = createElementFn('select')
  var slot = createElementFn('slot')
  var small = createElementFn('small')
  var source = createElementFn('source')
  var span = createElementFn('span')
  var strong = createElementFn('strong')
  var style = createElementFn('style')
  var sub = createElementFn('sub')
  var summary = createElementFn('summary')
  var sup = createElementFn('sup')
  var table = createElementFn('table')
  var tbody = createElementFn('tbody')
  var td = createElementFn('td')
  var template = createElementFn('template')
  var textarea = createElementFn('textarea')
  var tfoot = createElementFn('tfoot')
  var th = createElementFn('th')
  var thead = createElementFn('thead')
  var time = createElementFn('time')
  var title = createElementFn('title')
  var tr = createElementFn('tr')
  var track = createElementFn('track')
  var u = createElementFn('u')
  var ul = createElementFn('ul')
  var varE = createElementFn('var')
  var video = createElementFn('video')
  var wbr = createElementFn('wbr')
  var text = (arg = '') => getDocument().createTextNode(String(arg))
  var createInputFn =
    (type) =>
    (...args) =>
      createElement('input', { type }, ...args)
  var inputs = {
    button: createInputFn('button'),
    checkbox: createInputFn('checkbox'),
    color: createInputFn('color'),
    date: createInputFn('date'),
    datetimeLocal: createInputFn('datetime-local'),
    email: createInputFn('email'),
    hidden: createInputFn('hidden'),
    image: createInputFn('image'),
    month: createInputFn('month'),
    number: createInputFn('number'),
    password: createInputFn('password'),
    radio: createInputFn('radio'),
    range: createInputFn('range'),
    reset: createInputFn('reset'),
    search: createInputFn('search'),
    submit: createInputFn('submit'),
    tel: createInputFn('tel'),
    text: createInputFn('text'),
    time: createInputFn('time'),
    url: createInputFn('url'),
    week: createInputFn('week'),
  }
  function setElementToId(targetId, element) {
    const targetElement = getDocument().getElementById(targetId)
    if (targetElement) {
      targetElement.replaceChildren(element)
    } else {
      console.error(`Target element with ID "${targetId}" not found!`)
    }
  }

  // node_modules/decimal.js/decimal.mjs
  var EXP_LIMIT = 9e15
  var MAX_DIGITS = 1e9
  var NUMERALS = '0123456789abcdef'
  var LN10 =
    '2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058'
  var PI =
    '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789'
  var DEFAULTS = {
    // These values must be integers within the stated ranges (inclusive).
    // Most of these values can be changed at run-time using the `Decimal.config` method.
    // The maximum number of significant digits of the result of a calculation or base conversion.
    // E.g. `Decimal.config({ precision: 20 });`
    precision: 20,
    // 1 to MAX_DIGITS
    // The rounding mode used when rounding to `precision`.
    //
    // ROUND_UP         0 Away from zero.
    // ROUND_DOWN       1 Towards zero.
    // ROUND_CEIL       2 Towards +Infinity.
    // ROUND_FLOOR      3 Towards -Infinity.
    // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
    // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
    // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
    // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
    // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
    //
    // E.g.
    // `Decimal.rounding = 4;`
    // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
    rounding: 4,
    // 0 to 8
    // The modulo mode used when calculating the modulus: a mod n.
    // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
    // The remainder (r) is calculated as: r = a - n * q.
    //
    // UP         0 The remainder is positive if the dividend is negative, else is negative.
    // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
    // FLOOR      3 The remainder has the same sign as the divisor (Python %).
    // HALF_EVEN  6 The IEEE 754 remainder function.
    // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
    //
    // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
    // division (9) are commonly used for the modulus operation. The other rounding modes can also
    // be used, but they may not give useful results.
    modulo: 1,
    // 0 to 9
    // The exponent value at and beneath which `toString` returns exponential notation.
    // JavaScript numbers: -7
    toExpNeg: -7,
    // 0 to -EXP_LIMIT
    // The exponent value at and above which `toString` returns exponential notation.
    // JavaScript numbers: 21
    toExpPos: 21,
    // 0 to EXP_LIMIT
    // The minimum exponent value, beneath which underflow to zero occurs.
    // JavaScript numbers: -324  (5e-324)
    minE: -EXP_LIMIT,
    // -1 to -EXP_LIMIT
    // The maximum exponent value, above which overflow to Infinity occurs.
    // JavaScript numbers: 308  (1.7976931348623157e+308)
    maxE: EXP_LIMIT,
    // 1 to EXP_LIMIT
    // Whether to use cryptographically-secure random number generation, if available.
    crypto: false,
    // true/false
  }
  var inexact
  var quadrant
  var external = true
  var decimalError = '[DecimalError] '
  var invalidArgument = decimalError + 'Invalid argument: '
  var precisionLimitExceeded = decimalError + 'Precision limit exceeded'
  var cryptoUnavailable = decimalError + 'crypto unavailable'
  var tag = '[object Decimal]'
  var mathfloor = Math.floor
  var mathpow = Math.pow
  var isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i
  var isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i
  var isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i
  var isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i
  var BASE = 1e7
  var LOG_BASE = 7
  var MAX_SAFE_INTEGER = 9007199254740991
  var LN10_PRECISION = LN10.length - 1
  var PI_PRECISION = PI.length - 1
  var P = { toStringTag: tag }
  P.absoluteValue = P.abs = function () {
    var x = new this.constructor(this)
    if (x.s < 0) x.s = 1
    return finalise(x)
  }
  P.ceil = function () {
    return finalise(new this.constructor(this), this.e + 1, 2)
  }
  P.clampedTo = P.clamp = function (min2, max2) {
    var k,
      x = this,
      Ctor = x.constructor
    min2 = new Ctor(min2)
    max2 = new Ctor(max2)
    if (!min2.s || !max2.s) return new Ctor(NaN)
    if (min2.gt(max2)) throw Error(invalidArgument + max2)
    k = x.cmp(min2)
    return k < 0 ? min2 : x.cmp(max2) > 0 ? max2 : new Ctor(x)
  }
  P.comparedTo = P.cmp = function (y) {
    var i2,
      j,
      xdL,
      ydL,
      x = this,
      xd = x.d,
      yd = (y = new x.constructor(y)).d,
      xs = x.s,
      ys = y.s
    if (!xd || !yd) {
      return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ (xs < 0) ? 1 : -1
    }
    if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0
    if (xs !== ys) return xs
    if (x.e !== y.e) return (x.e > y.e) ^ (xs < 0) ? 1 : -1
    xdL = xd.length
    ydL = yd.length
    for (i2 = 0, j = xdL < ydL ? xdL : ydL; i2 < j; ++i2) {
      if (xd[i2] !== yd[i2]) return (xd[i2] > yd[i2]) ^ (xs < 0) ? 1 : -1
    }
    return xdL === ydL ? 0 : (xdL > ydL) ^ (xs < 0) ? 1 : -1
  }
  P.cosine = P.cos = function () {
    var pr,
      rm,
      x = this,
      Ctor = x.constructor
    if (!x.d) return new Ctor(NaN)
    if (!x.d[0]) return new Ctor(1)
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE
    Ctor.rounding = 1
    x = cosine(Ctor, toLessThanHalfPi(Ctor, x))
    Ctor.precision = pr
    Ctor.rounding = rm
    return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true)
  }
  P.cubeRoot = P.cbrt = function () {
    var e,
      m,
      n,
      r,
      rep,
      s2,
      sd,
      t,
      t3,
      t3plusx,
      x = this,
      Ctor = x.constructor
    if (!x.isFinite() || x.isZero()) return new Ctor(x)
    external = false
    s2 = x.s * mathpow(x.s * x, 1 / 3)
    if (!s2 || Math.abs(s2) == 1 / 0) {
      n = digitsToString(x.d)
      e = x.e
      if ((s2 = (e - n.length + 1) % 3)) n += s2 == 1 || s2 == -2 ? '0' : '00'
      s2 = mathpow(n, 1 / 3)
      e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2))
      if (s2 == 1 / 0) {
        n = '5e' + e
      } else {
        n = s2.toExponential()
        n = n.slice(0, n.indexOf('e') + 1) + e
      }
      r = new Ctor(n)
      r.s = x.s
    } else {
      r = new Ctor(s2.toString())
    }
    sd = (e = Ctor.precision) + 3
    for (;;) {
      t = r
      t3 = t.times(t).times(t)
      t3plusx = t3.plus(x)
      r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1)
      if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
        n = n.slice(sd - 3, sd + 1)
        if (n == '9999' || (!rep && n == '4999')) {
          if (!rep) {
            finalise(t, e + 1, 0)
            if (t.times(t).times(t).eq(x)) {
              r = t
              break
            }
          }
          sd += 4
          rep = 1
        } else {
          if (!+n || (!+n.slice(1) && n.charAt(0) == '5')) {
            finalise(r, e + 1, 1)
            m = !r.times(r).times(r).eq(x)
          }
          break
        }
      }
    }
    external = true
    return finalise(r, e, Ctor.rounding, m)
  }
  P.decimalPlaces = P.dp = function () {
    var w,
      d = this.d,
      n = NaN
    if (d) {
      w = d.length - 1
      n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE
      w = d[w]
      if (w) for (; w % 10 == 0; w /= 10) n--
      if (n < 0) n = 0
    }
    return n
  }
  P.dividedBy = P.div = function (y) {
    return divide(this, new this.constructor(y))
  }
  P.dividedToIntegerBy = P.divToInt = function (y) {
    var x = this,
      Ctor = x.constructor
    return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding)
  }
  P.equals = P.eq = function (y) {
    return this.cmp(y) === 0
  }
  P.floor = function () {
    return finalise(new this.constructor(this), this.e + 1, 3)
  }
  P.greaterThan = P.gt = function (y) {
    return this.cmp(y) > 0
  }
  P.greaterThanOrEqualTo = P.gte = function (y) {
    var k = this.cmp(y)
    return k == 1 || k === 0
  }
  P.hyperbolicCosine = P.cosh = function () {
    var k,
      n,
      pr,
      rm,
      len,
      x = this,
      Ctor = x.constructor,
      one = new Ctor(1)
    if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN)
    if (x.isZero()) return one
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4
    Ctor.rounding = 1
    len = x.d.length
    if (len < 32) {
      k = Math.ceil(len / 3)
      n = (1 / tinyPow(4, k)).toString()
    } else {
      k = 16
      n = '2.3283064365386962890625e-10'
    }
    x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true)
    var cosh2_x,
      i2 = k,
      d8 = new Ctor(8)
    for (; i2--; ) {
      cosh2_x = x.times(x)
      x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))))
    }
    return finalise(x, (Ctor.precision = pr), (Ctor.rounding = rm), true)
  }
  P.hyperbolicSine = P.sinh = function () {
    var k,
      pr,
      rm,
      len,
      x = this,
      Ctor = x.constructor
    if (!x.isFinite() || x.isZero()) return new Ctor(x)
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4
    Ctor.rounding = 1
    len = x.d.length
    if (len < 3) {
      x = taylorSeries(Ctor, 2, x, x, true)
    } else {
      k = 1.4 * Math.sqrt(len)
      k = k > 16 ? 16 : k | 0
      x = x.times(1 / tinyPow(5, k))
      x = taylorSeries(Ctor, 2, x, x, true)
      var sinh2_x,
        d5 = new Ctor(5),
        d16 = new Ctor(16),
        d20 = new Ctor(20)
      for (; k--; ) {
        sinh2_x = x.times(x)
        x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))))
      }
    }
    Ctor.precision = pr
    Ctor.rounding = rm
    return finalise(x, pr, rm, true)
  }
  P.hyperbolicTangent = P.tanh = function () {
    var pr,
      rm,
      x = this,
      Ctor = x.constructor
    if (!x.isFinite()) return new Ctor(x.s)
    if (x.isZero()) return new Ctor(x)
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + 7
    Ctor.rounding = 1
    return divide(x.sinh(), x.cosh(), (Ctor.precision = pr), (Ctor.rounding = rm))
  }
  P.inverseCosine = P.acos = function () {
    var x = this,
      Ctor = x.constructor,
      k = x.abs().cmp(1),
      pr = Ctor.precision,
      rm = Ctor.rounding
    if (k !== -1) {
      return k === 0 ? (x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0)) : new Ctor(NaN)
    }
    if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5)
    Ctor.precision = pr + 6
    Ctor.rounding = 1
    x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan()
    Ctor.precision = pr
    Ctor.rounding = rm
    return x.times(2)
  }
  P.inverseHyperbolicCosine = P.acosh = function () {
    var pr,
      rm,
      x = this,
      Ctor = x.constructor
    if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN)
    if (!x.isFinite()) return new Ctor(x)
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4
    Ctor.rounding = 1
    external = false
    x = x.times(x).minus(1).sqrt().plus(x)
    external = true
    Ctor.precision = pr
    Ctor.rounding = rm
    return x.ln()
  }
  P.inverseHyperbolicSine = P.asinh = function () {
    var pr,
      rm,
      x = this,
      Ctor = x.constructor
    if (!x.isFinite() || x.isZero()) return new Ctor(x)
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6
    Ctor.rounding = 1
    external = false
    x = x.times(x).plus(1).sqrt().plus(x)
    external = true
    Ctor.precision = pr
    Ctor.rounding = rm
    return x.ln()
  }
  P.inverseHyperbolicTangent = P.atanh = function () {
    var pr,
      rm,
      wpr,
      xsd,
      x = this,
      Ctor = x.constructor
    if (!x.isFinite()) return new Ctor(NaN)
    if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN)
    pr = Ctor.precision
    rm = Ctor.rounding
    xsd = x.sd()
    if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true)
    Ctor.precision = wpr = xsd - x.e
    x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1)
    Ctor.precision = pr + 4
    Ctor.rounding = 1
    x = x.ln()
    Ctor.precision = pr
    Ctor.rounding = rm
    return x.times(0.5)
  }
  P.inverseSine = P.asin = function () {
    var halfPi,
      k,
      pr,
      rm,
      x = this,
      Ctor = x.constructor
    if (x.isZero()) return new Ctor(x)
    k = x.abs().cmp(1)
    pr = Ctor.precision
    rm = Ctor.rounding
    if (k !== -1) {
      if (k === 0) {
        halfPi = getPi(Ctor, pr + 4, rm).times(0.5)
        halfPi.s = x.s
        return halfPi
      }
      return new Ctor(NaN)
    }
    Ctor.precision = pr + 6
    Ctor.rounding = 1
    x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan()
    Ctor.precision = pr
    Ctor.rounding = rm
    return x.times(2)
  }
  P.inverseTangent = P.atan = function () {
    var i2,
      j,
      k,
      n,
      px,
      t,
      r,
      wpr,
      x2,
      x = this,
      Ctor = x.constructor,
      pr = Ctor.precision,
      rm = Ctor.rounding
    if (!x.isFinite()) {
      if (!x.s) return new Ctor(NaN)
      if (pr + 4 <= PI_PRECISION) {
        r = getPi(Ctor, pr + 4, rm).times(0.5)
        r.s = x.s
        return r
      }
    } else if (x.isZero()) {
      return new Ctor(x)
    } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
      r = getPi(Ctor, pr + 4, rm).times(0.25)
      r.s = x.s
      return r
    }
    Ctor.precision = wpr = pr + 10
    Ctor.rounding = 1
    k = Math.min(28, (wpr / LOG_BASE + 2) | 0)
    for (i2 = k; i2; --i2) x = x.div(x.times(x).plus(1).sqrt().plus(1))
    external = false
    j = Math.ceil(wpr / LOG_BASE)
    n = 1
    x2 = x.times(x)
    r = new Ctor(x)
    px = x
    for (; i2 !== -1; ) {
      px = px.times(x2)
      t = r.minus(px.div((n += 2)))
      px = px.times(x2)
      r = t.plus(px.div((n += 2)))
      if (r.d[j] !== void 0) for (i2 = j; r.d[i2] === t.d[i2] && i2--; );
    }
    if (k) r = r.times(2 << (k - 1))
    external = true
    return finalise(r, (Ctor.precision = pr), (Ctor.rounding = rm), true)
  }
  P.isFinite = function () {
    return !!this.d
  }
  P.isInteger = P.isInt = function () {
    return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2
  }
  P.isNaN = function () {
    return !this.s
  }
  P.isNegative = P.isNeg = function () {
    return this.s < 0
  }
  P.isPositive = P.isPos = function () {
    return this.s > 0
  }
  P.isZero = function () {
    return !!this.d && this.d[0] === 0
  }
  P.lessThan = P.lt = function (y) {
    return this.cmp(y) < 0
  }
  P.lessThanOrEqualTo = P.lte = function (y) {
    return this.cmp(y) < 1
  }
  P.logarithm = P.log = function (base2) {
    var isBase10,
      d,
      denominator,
      k,
      inf,
      num,
      sd,
      r,
      arg = this,
      Ctor = arg.constructor,
      pr = Ctor.precision,
      rm = Ctor.rounding,
      guard = 5
    if (base2 == null) {
      base2 = new Ctor(10)
      isBase10 = true
    } else {
      base2 = new Ctor(base2)
      d = base2.d
      if (base2.s < 0 || !d || !d[0] || base2.eq(1)) return new Ctor(NaN)
      isBase10 = base2.eq(10)
    }
    d = arg.d
    if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
      return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0)
    }
    if (isBase10) {
      if (d.length > 1) {
        inf = true
      } else {
        for (k = d[0]; k % 10 === 0; ) k /= 10
        inf = k !== 1
      }
    }
    external = false
    sd = pr + guard
    num = naturalLogarithm(arg, sd)
    denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base2, sd)
    r = divide(num, denominator, sd, 1)
    if (checkRoundingDigits(r.d, (k = pr), rm)) {
      do {
        sd += 10
        num = naturalLogarithm(arg, sd)
        denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base2, sd)
        r = divide(num, denominator, sd, 1)
        if (!inf) {
          if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
            r = finalise(r, pr + 1, 0)
          }
          break
        }
      } while (checkRoundingDigits(r.d, (k += 10), rm))
    }
    external = true
    return finalise(r, pr, rm)
  }
  P.minus = P.sub = function (y) {
    var d,
      e,
      i2,
      j,
      k,
      len,
      pr,
      rm,
      xd,
      xe,
      xLTy,
      yd,
      x = this,
      Ctor = x.constructor
    y = new Ctor(y)
    if (!x.d || !y.d) {
      if (!x.s || !y.s) y = new Ctor(NaN)
      else if (x.d) y.s = -y.s
      else y = new Ctor(y.d || x.s !== y.s ? x : NaN)
      return y
    }
    if (x.s != y.s) {
      y.s = -y.s
      return x.plus(y)
    }
    xd = x.d
    yd = y.d
    pr = Ctor.precision
    rm = Ctor.rounding
    if (!xd[0] || !yd[0]) {
      if (yd[0]) y.s = -y.s
      else if (xd[0]) y = new Ctor(x)
      else return new Ctor(rm === 3 ? -0 : 0)
      return external ? finalise(y, pr, rm) : y
    }
    e = mathfloor(y.e / LOG_BASE)
    xe = mathfloor(x.e / LOG_BASE)
    xd = xd.slice()
    k = xe - e
    if (k) {
      xLTy = k < 0
      if (xLTy) {
        d = xd
        k = -k
        len = yd.length
      } else {
        d = yd
        e = xe
        len = xd.length
      }
      i2 = Math.max(Math.ceil(pr / LOG_BASE), len) + 2
      if (k > i2) {
        k = i2
        d.length = 1
      }
      d.reverse()
      for (i2 = k; i2--; ) d.push(0)
      d.reverse()
    } else {
      i2 = xd.length
      len = yd.length
      xLTy = i2 < len
      if (xLTy) len = i2
      for (i2 = 0; i2 < len; i2++) {
        if (xd[i2] != yd[i2]) {
          xLTy = xd[i2] < yd[i2]
          break
        }
      }
      k = 0
    }
    if (xLTy) {
      d = xd
      xd = yd
      yd = d
      y.s = -y.s
    }
    len = xd.length
    for (i2 = yd.length - len; i2 > 0; --i2) xd[len++] = 0
    for (i2 = yd.length; i2 > k; ) {
      if (xd[--i2] < yd[i2]) {
        for (j = i2; j && xd[--j] === 0; ) xd[j] = BASE - 1
        --xd[j]
        xd[i2] += BASE
      }
      xd[i2] -= yd[i2]
    }
    for (; xd[--len] === 0; ) xd.pop()
    for (; xd[0] === 0; xd.shift()) --e
    if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0)
    y.d = xd
    y.e = getBase10Exponent(xd, e)
    return external ? finalise(y, pr, rm) : y
  }
  P.modulo = P.mod = function (y) {
    var q2,
      x = this,
      Ctor = x.constructor
    y = new Ctor(y)
    if (!x.d || !y.s || (y.d && !y.d[0])) return new Ctor(NaN)
    if (!y.d || (x.d && !x.d[0])) {
      return finalise(new Ctor(x), Ctor.precision, Ctor.rounding)
    }
    external = false
    if (Ctor.modulo == 9) {
      q2 = divide(x, y.abs(), 0, 3, 1)
      q2.s *= y.s
    } else {
      q2 = divide(x, y, 0, Ctor.modulo, 1)
    }
    q2 = q2.times(y)
    external = true
    return x.minus(q2)
  }
  P.naturalExponential = P.exp = function () {
    return naturalExponential(this)
  }
  P.naturalLogarithm = P.ln = function () {
    return naturalLogarithm(this)
  }
  P.negated = P.neg = function () {
    var x = new this.constructor(this)
    x.s = -x.s
    return finalise(x)
  }
  P.plus = P.add = function (y) {
    var carry,
      d,
      e,
      i2,
      k,
      len,
      pr,
      rm,
      xd,
      yd,
      x = this,
      Ctor = x.constructor
    y = new Ctor(y)
    if (!x.d || !y.d) {
      if (!x.s || !y.s) y = new Ctor(NaN)
      else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN)
      return y
    }
    if (x.s != y.s) {
      y.s = -y.s
      return x.minus(y)
    }
    xd = x.d
    yd = y.d
    pr = Ctor.precision
    rm = Ctor.rounding
    if (!xd[0] || !yd[0]) {
      if (!yd[0]) y = new Ctor(x)
      return external ? finalise(y, pr, rm) : y
    }
    k = mathfloor(x.e / LOG_BASE)
    e = mathfloor(y.e / LOG_BASE)
    xd = xd.slice()
    i2 = k - e
    if (i2) {
      if (i2 < 0) {
        d = xd
        i2 = -i2
        len = yd.length
      } else {
        d = yd
        e = k
        len = xd.length
      }
      k = Math.ceil(pr / LOG_BASE)
      len = k > len ? k + 1 : len + 1
      if (i2 > len) {
        i2 = len
        d.length = 1
      }
      d.reverse()
      for (; i2--; ) d.push(0)
      d.reverse()
    }
    len = xd.length
    i2 = yd.length
    if (len - i2 < 0) {
      i2 = len
      d = yd
      yd = xd
      xd = d
    }
    for (carry = 0; i2; ) {
      carry = ((xd[--i2] = xd[i2] + yd[i2] + carry) / BASE) | 0
      xd[i2] %= BASE
    }
    if (carry) {
      xd.unshift(carry)
      ++e
    }
    for (len = xd.length; xd[--len] == 0; ) xd.pop()
    y.d = xd
    y.e = getBase10Exponent(xd, e)
    return external ? finalise(y, pr, rm) : y
  }
  P.precision = P.sd = function (z) {
    var k,
      x = this
    if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z)
    if (x.d) {
      k = getPrecision(x.d)
      if (z && x.e + 1 > k) k = x.e + 1
    } else {
      k = NaN
    }
    return k
  }
  P.round = function () {
    var x = this,
      Ctor = x.constructor
    return finalise(new Ctor(x), x.e + 1, Ctor.rounding)
  }
  P.sine = P.sin = function () {
    var pr,
      rm,
      x = this,
      Ctor = x.constructor
    if (!x.isFinite()) return new Ctor(NaN)
    if (x.isZero()) return new Ctor(x)
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE
    Ctor.rounding = 1
    x = sine(Ctor, toLessThanHalfPi(Ctor, x))
    Ctor.precision = pr
    Ctor.rounding = rm
    return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true)
  }
  P.squareRoot = P.sqrt = function () {
    var m,
      n,
      sd,
      r,
      rep,
      t,
      x = this,
      d = x.d,
      e = x.e,
      s2 = x.s,
      Ctor = x.constructor
    if (s2 !== 1 || !d || !d[0]) {
      return new Ctor(!s2 || (s2 < 0 && (!d || d[0])) ? NaN : d ? x : 1 / 0)
    }
    external = false
    s2 = Math.sqrt(+x)
    if (s2 == 0 || s2 == 1 / 0) {
      n = digitsToString(d)
      if ((n.length + e) % 2 == 0) n += '0'
      s2 = Math.sqrt(n)
      e = mathfloor((e + 1) / 2) - (e < 0 || e % 2)
      if (s2 == 1 / 0) {
        n = '5e' + e
      } else {
        n = s2.toExponential()
        n = n.slice(0, n.indexOf('e') + 1) + e
      }
      r = new Ctor(n)
    } else {
      r = new Ctor(s2.toString())
    }
    sd = (e = Ctor.precision) + 3
    for (;;) {
      t = r
      r = t.plus(divide(x, t, sd + 2, 1)).times(0.5)
      if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
        n = n.slice(sd - 3, sd + 1)
        if (n == '9999' || (!rep && n == '4999')) {
          if (!rep) {
            finalise(t, e + 1, 0)
            if (t.times(t).eq(x)) {
              r = t
              break
            }
          }
          sd += 4
          rep = 1
        } else {
          if (!+n || (!+n.slice(1) && n.charAt(0) == '5')) {
            finalise(r, e + 1, 1)
            m = !r.times(r).eq(x)
          }
          break
        }
      }
    }
    external = true
    return finalise(r, e, Ctor.rounding, m)
  }
  P.tangent = P.tan = function () {
    var pr,
      rm,
      x = this,
      Ctor = x.constructor
    if (!x.isFinite()) return new Ctor(NaN)
    if (x.isZero()) return new Ctor(x)
    pr = Ctor.precision
    rm = Ctor.rounding
    Ctor.precision = pr + 10
    Ctor.rounding = 1
    x = x.sin()
    x.s = 1
    x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0)
    Ctor.precision = pr
    Ctor.rounding = rm
    return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true)
  }
  P.times = P.mul = function (y) {
    var carry,
      e,
      i2,
      k,
      r,
      rL,
      t,
      xdL,
      ydL,
      x = this,
      Ctor = x.constructor,
      xd = x.d,
      yd = (y = new Ctor(y)).d
    y.s *= x.s
    if (!xd || !xd[0] || !yd || !yd[0]) {
      return new Ctor(!y.s || (xd && !xd[0] && !yd) || (yd && !yd[0] && !xd) ? NaN : !xd || !yd ? y.s / 0 : y.s * 0)
    }
    e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE)
    xdL = xd.length
    ydL = yd.length
    if (xdL < ydL) {
      r = xd
      xd = yd
      yd = r
      rL = xdL
      xdL = ydL
      ydL = rL
    }
    r = []
    rL = xdL + ydL
    for (i2 = rL; i2--; ) r.push(0)
    for (i2 = ydL; --i2 >= 0; ) {
      carry = 0
      for (k = xdL + i2; k > i2; ) {
        t = r[k] + yd[i2] * xd[k - i2 - 1] + carry
        r[k--] = (t % BASE) | 0
        carry = (t / BASE) | 0
      }
      r[k] = ((r[k] + carry) % BASE) | 0
    }
    for (; !r[--rL]; ) r.pop()
    if (carry) ++e
    else r.shift()
    y.d = r
    y.e = getBase10Exponent(r, e)
    return external ? finalise(y, Ctor.precision, Ctor.rounding) : y
  }
  P.toBinary = function (sd, rm) {
    return toStringBinary(this, 2, sd, rm)
  }
  P.toDecimalPlaces = P.toDP = function (dp, rm) {
    var x = this,
      Ctor = x.constructor
    x = new Ctor(x)
    if (dp === void 0) return x
    checkInt32(dp, 0, MAX_DIGITS)
    if (rm === void 0) rm = Ctor.rounding
    else checkInt32(rm, 0, 8)
    return finalise(x, dp + x.e + 1, rm)
  }
  P.toExponential = function (dp, rm) {
    var str,
      x = this,
      Ctor = x.constructor
    if (dp === void 0) {
      str = finiteToString(x, true)
    } else {
      checkInt32(dp, 0, MAX_DIGITS)
      if (rm === void 0) rm = Ctor.rounding
      else checkInt32(rm, 0, 8)
      x = finalise(new Ctor(x), dp + 1, rm)
      str = finiteToString(x, true, dp + 1)
    }
    return x.isNeg() && !x.isZero() ? '-' + str : str
  }
  P.toFixed = function (dp, rm) {
    var str,
      y,
      x = this,
      Ctor = x.constructor
    if (dp === void 0) {
      str = finiteToString(x)
    } else {
      checkInt32(dp, 0, MAX_DIGITS)
      if (rm === void 0) rm = Ctor.rounding
      else checkInt32(rm, 0, 8)
      y = finalise(new Ctor(x), dp + x.e + 1, rm)
      str = finiteToString(y, false, dp + y.e + 1)
    }
    return x.isNeg() && !x.isZero() ? '-' + str : str
  }
  P.toFraction = function (maxD) {
    var d,
      d0,
      d1,
      d2,
      e,
      k,
      n,
      n0,
      n1,
      pr,
      q2,
      r,
      x = this,
      xd = x.d,
      Ctor = x.constructor
    if (!xd) return new Ctor(x)
    n1 = d0 = new Ctor(1)
    d1 = n0 = new Ctor(0)
    d = new Ctor(d1)
    e = d.e = getPrecision(xd) - x.e - 1
    k = e % LOG_BASE
    d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k)
    if (maxD == null) {
      maxD = e > 0 ? d : n1
    } else {
      n = new Ctor(maxD)
      if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n)
      maxD = n.gt(d) ? (e > 0 ? d : n1) : n
    }
    external = false
    n = new Ctor(digitsToString(xd))
    pr = Ctor.precision
    Ctor.precision = e = xd.length * LOG_BASE * 2
    for (;;) {
      q2 = divide(n, d, 0, 1, 1)
      d2 = d0.plus(q2.times(d1))
      if (d2.cmp(maxD) == 1) break
      d0 = d1
      d1 = d2
      d2 = n1
      n1 = n0.plus(q2.times(d2))
      n0 = d2
      d2 = d
      d = n.minus(q2.times(d2))
      n = d2
    }
    d2 = divide(maxD.minus(d0), d1, 0, 1, 1)
    n0 = n0.plus(d2.times(n1))
    d0 = d0.plus(d2.times(d1))
    n0.s = n1.s = x.s
    r =
      divide(n1, d1, e, 1)
        .minus(x)
        .abs()
        .cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1
        ? [n1, d1]
        : [n0, d0]
    Ctor.precision = pr
    external = true
    return r
  }
  P.toHexadecimal = P.toHex = function (sd, rm) {
    return toStringBinary(this, 16, sd, rm)
  }
  P.toNearest = function (y, rm) {
    var x = this,
      Ctor = x.constructor
    x = new Ctor(x)
    if (y == null) {
      if (!x.d) return x
      y = new Ctor(1)
      rm = Ctor.rounding
    } else {
      y = new Ctor(y)
      if (rm === void 0) {
        rm = Ctor.rounding
      } else {
        checkInt32(rm, 0, 8)
      }
      if (!x.d) return y.s ? x : y
      if (!y.d) {
        if (y.s) y.s = x.s
        return y
      }
    }
    if (y.d[0]) {
      external = false
      x = divide(x, y, 0, rm, 1).times(y)
      external = true
      finalise(x)
    } else {
      y.s = x.s
      x = y
    }
    return x
  }
  P.toNumber = function () {
    return +this
  }
  P.toOctal = function (sd, rm) {
    return toStringBinary(this, 8, sd, rm)
  }
  P.toPower = P.pow = function (y) {
    var e,
      k,
      pr,
      r,
      rm,
      s2,
      x = this,
      Ctor = x.constructor,
      yn = +(y = new Ctor(y))
    if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn))
    x = new Ctor(x)
    if (x.eq(1)) return x
    pr = Ctor.precision
    rm = Ctor.rounding
    if (y.eq(1)) return finalise(x, pr, rm)
    e = mathfloor(y.e / LOG_BASE)
    if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
      r = intPow(Ctor, x, k, pr)
      return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm)
    }
    s2 = x.s
    if (s2 < 0) {
      if (e < y.d.length - 1) return new Ctor(NaN)
      if ((y.d[e] & 1) == 0) s2 = 1
      if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
        x.s = s2
        return x
      }
    }
    k = mathpow(+x, yn)
    e =
      k == 0 || !isFinite(k)
        ? mathfloor(yn * (Math.log('0.' + digitsToString(x.d)) / Math.LN10 + x.e + 1))
        : new Ctor(k + '').e
    if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s2 / 0 : 0)
    external = false
    Ctor.rounding = x.s = 1
    k = Math.min(12, (e + '').length)
    r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr)
    if (r.d) {
      r = finalise(r, pr + 5, 1)
      if (checkRoundingDigits(r.d, pr, rm)) {
        e = pr + 10
        r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1)
        if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
          r = finalise(r, pr + 1, 0)
        }
      }
    }
    r.s = s2
    external = true
    Ctor.rounding = rm
    return finalise(r, pr, rm)
  }
  P.toPrecision = function (sd, rm) {
    var str,
      x = this,
      Ctor = x.constructor
    if (sd === void 0) {
      str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos)
    } else {
      checkInt32(sd, 1, MAX_DIGITS)
      if (rm === void 0) rm = Ctor.rounding
      else checkInt32(rm, 0, 8)
      x = finalise(new Ctor(x), sd, rm)
      str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd)
    }
    return x.isNeg() && !x.isZero() ? '-' + str : str
  }
  P.toSignificantDigits = P.toSD = function (sd, rm) {
    var x = this,
      Ctor = x.constructor
    if (sd === void 0) {
      sd = Ctor.precision
      rm = Ctor.rounding
    } else {
      checkInt32(sd, 1, MAX_DIGITS)
      if (rm === void 0) rm = Ctor.rounding
      else checkInt32(rm, 0, 8)
    }
    return finalise(new Ctor(x), sd, rm)
  }
  P.toString = function () {
    var x = this,
      Ctor = x.constructor,
      str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos)
    return x.isNeg() && !x.isZero() ? '-' + str : str
  }
  P.truncated = P.trunc = function () {
    return finalise(new this.constructor(this), this.e + 1, 1)
  }
  P.valueOf = P.toJSON = function () {
    var x = this,
      Ctor = x.constructor,
      str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos)
    return x.isNeg() ? '-' + str : str
  }
  function digitsToString(d) {
    var i2,
      k,
      ws,
      indexOfLastWord = d.length - 1,
      str = '',
      w = d[0]
    if (indexOfLastWord > 0) {
      str += w
      for (i2 = 1; i2 < indexOfLastWord; i2++) {
        ws = d[i2] + ''
        k = LOG_BASE - ws.length
        if (k) str += getZeroString(k)
        str += ws
      }
      w = d[i2]
      ws = w + ''
      k = LOG_BASE - ws.length
      if (k) str += getZeroString(k)
    } else if (w === 0) {
      return '0'
    }
    for (; w % 10 === 0; ) w /= 10
    return str + w
  }
  function checkInt32(i2, min2, max2) {
    if (i2 !== ~~i2 || i2 < min2 || i2 > max2) {
      throw Error(invalidArgument + i2)
    }
  }
  function checkRoundingDigits(d, i2, rm, repeating) {
    var di, k, r, rd
    for (k = d[0]; k >= 10; k /= 10) --i2
    if (--i2 < 0) {
      i2 += LOG_BASE
      di = 0
    } else {
      di = Math.ceil((i2 + 1) / LOG_BASE)
      i2 %= LOG_BASE
    }
    k = mathpow(10, LOG_BASE - i2)
    rd = (d[di] % k) | 0
    if (repeating == null) {
      if (i2 < 3) {
        if (i2 == 0) rd = (rd / 100) | 0
        else if (i2 == 1) rd = (rd / 10) | 0
        r = (rm < 4 && rd == 99999) || (rm > 3 && rd == 49999) || rd == 5e4 || rd == 0
      } else {
        r =
          (((rm < 4 && rd + 1 == k) || (rm > 3 && rd + 1 == k / 2)) &&
            ((d[di + 1] / k / 100) | 0) == mathpow(10, i2 - 2) - 1) ||
          ((rd == k / 2 || rd == 0) && ((d[di + 1] / k / 100) | 0) == 0)
      }
    } else {
      if (i2 < 4) {
        if (i2 == 0) rd = (rd / 1e3) | 0
        else if (i2 == 1) rd = (rd / 100) | 0
        else if (i2 == 2) rd = (rd / 10) | 0
        r = ((repeating || rm < 4) && rd == 9999) || (!repeating && rm > 3 && rd == 4999)
      } else {
        r =
          (((repeating || rm < 4) && rd + 1 == k) || (!repeating && rm > 3 && rd + 1 == k / 2)) &&
          ((d[di + 1] / k / 1e3) | 0) == mathpow(10, i2 - 3) - 1
      }
    }
    return r
  }
  function convertBase(str, baseIn, baseOut) {
    var j,
      arr = [0],
      arrL,
      i2 = 0,
      strL = str.length
    for (; i2 < strL; ) {
      for (arrL = arr.length; arrL--; ) arr[arrL] *= baseIn
      arr[0] += NUMERALS.indexOf(str.charAt(i2++))
      for (j = 0; j < arr.length; j++) {
        if (arr[j] > baseOut - 1) {
          if (arr[j + 1] === void 0) arr[j + 1] = 0
          arr[j + 1] += (arr[j] / baseOut) | 0
          arr[j] %= baseOut
        }
      }
    }
    return arr.reverse()
  }
  function cosine(Ctor, x) {
    var k, len, y
    if (x.isZero()) return x
    len = x.d.length
    if (len < 32) {
      k = Math.ceil(len / 3)
      y = (1 / tinyPow(4, k)).toString()
    } else {
      k = 16
      y = '2.3283064365386962890625e-10'
    }
    Ctor.precision += k
    x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1))
    for (var i2 = k; i2--; ) {
      var cos2x = x.times(x)
      x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1)
    }
    Ctor.precision -= k
    return x
  }
  var divide = /* @__PURE__ */ (function () {
    function multiplyInteger(x, k, base2) {
      var temp,
        carry = 0,
        i2 = x.length
      for (x = x.slice(); i2--; ) {
        temp = x[i2] * k + carry
        x[i2] = (temp % base2) | 0
        carry = (temp / base2) | 0
      }
      if (carry) x.unshift(carry)
      return x
    }
    function compare(a2, b2, aL, bL) {
      var i2, r
      if (aL != bL) {
        r = aL > bL ? 1 : -1
      } else {
        for (i2 = r = 0; i2 < aL; i2++) {
          if (a2[i2] != b2[i2]) {
            r = a2[i2] > b2[i2] ? 1 : -1
            break
          }
        }
      }
      return r
    }
    function subtract(a2, b2, aL, base2) {
      var i2 = 0
      for (; aL--; ) {
        a2[aL] -= i2
        i2 = a2[aL] < b2[aL] ? 1 : 0
        a2[aL] = i2 * base2 + a2[aL] - b2[aL]
      }
      for (; !a2[0] && a2.length > 1; ) a2.shift()
    }
    return function (x, y, pr, rm, dp, base2) {
      var cmp,
        e,
        i2,
        k,
        logBase,
        more,
        prod,
        prodL,
        q2,
        qd,
        rem,
        remL,
        rem0,
        sd,
        t,
        xi,
        xL,
        yd0,
        yL,
        yz,
        Ctor = x.constructor,
        sign2 = x.s == y.s ? 1 : -1,
        xd = x.d,
        yd = y.d
      if (!xd || !xd[0] || !yd || !yd[0]) {
        return new Ctor(
          // Return NaN if either NaN, or both Infinity or 0.
          !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd)
            ? NaN
            : // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
              (xd && xd[0] == 0) || !yd
              ? sign2 * 0
              : sign2 / 0
        )
      }
      if (base2) {
        logBase = 1
        e = x.e - y.e
      } else {
        base2 = BASE
        logBase = LOG_BASE
        e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase)
      }
      yL = yd.length
      xL = xd.length
      q2 = new Ctor(sign2)
      qd = q2.d = []
      for (i2 = 0; yd[i2] == (xd[i2] || 0); i2++);
      if (yd[i2] > (xd[i2] || 0)) e--
      if (pr == null) {
        sd = pr = Ctor.precision
        rm = Ctor.rounding
      } else if (dp) {
        sd = pr + (x.e - y.e) + 1
      } else {
        sd = pr
      }
      if (sd < 0) {
        qd.push(1)
        more = true
      } else {
        sd = (sd / logBase + 2) | 0
        i2 = 0
        if (yL == 1) {
          k = 0
          yd = yd[0]
          sd++
          for (; (i2 < xL || k) && sd--; i2++) {
            t = k * base2 + (xd[i2] || 0)
            qd[i2] = (t / yd) | 0
            k = (t % yd) | 0
          }
          more = k || i2 < xL
        } else {
          k = (base2 / (yd[0] + 1)) | 0
          if (k > 1) {
            yd = multiplyInteger(yd, k, base2)
            xd = multiplyInteger(xd, k, base2)
            yL = yd.length
            xL = xd.length
          }
          xi = yL
          rem = xd.slice(0, yL)
          remL = rem.length
          for (; remL < yL; ) rem[remL++] = 0
          yz = yd.slice()
          yz.unshift(0)
          yd0 = yd[0]
          if (yd[1] >= base2 / 2) ++yd0
          do {
            k = 0
            cmp = compare(yd, rem, yL, remL)
            if (cmp < 0) {
              rem0 = rem[0]
              if (yL != remL) rem0 = rem0 * base2 + (rem[1] || 0)
              k = (rem0 / yd0) | 0
              if (k > 1) {
                if (k >= base2) k = base2 - 1
                prod = multiplyInteger(yd, k, base2)
                prodL = prod.length
                remL = rem.length
                cmp = compare(prod, rem, prodL, remL)
                if (cmp == 1) {
                  k--
                  subtract(prod, yL < prodL ? yz : yd, prodL, base2)
                }
              } else {
                if (k == 0) cmp = k = 1
                prod = yd.slice()
              }
              prodL = prod.length
              if (prodL < remL) prod.unshift(0)
              subtract(rem, prod, remL, base2)
              if (cmp == -1) {
                remL = rem.length
                cmp = compare(yd, rem, yL, remL)
                if (cmp < 1) {
                  k++
                  subtract(rem, yL < remL ? yz : yd, remL, base2)
                }
              }
              remL = rem.length
            } else if (cmp === 0) {
              k++
              rem = [0]
            }
            qd[i2++] = k
            if (cmp && rem[0]) {
              rem[remL++] = xd[xi] || 0
            } else {
              rem = [xd[xi]]
              remL = 1
            }
          } while ((xi++ < xL || rem[0] !== void 0) && sd--)
          more = rem[0] !== void 0
        }
        if (!qd[0]) qd.shift()
      }
      if (logBase == 1) {
        q2.e = e
        inexact = more
      } else {
        for (i2 = 1, k = qd[0]; k >= 10; k /= 10) i2++
        q2.e = i2 + e * logBase - 1
        finalise(q2, dp ? pr + q2.e + 1 : pr, rm, more)
      }
      return q2
    }
  })()
  function finalise(x, sd, rm, isTruncated) {
    var digits,
      i2,
      j,
      k,
      rd,
      roundUp,
      w,
      xd,
      xdi,
      Ctor = x.constructor
    out: if (sd != null) {
      xd = x.d
      if (!xd) return x
      for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++
      i2 = sd - digits
      if (i2 < 0) {
        i2 += LOG_BASE
        j = sd
        w = xd[(xdi = 0)]
        rd = ((w / mathpow(10, digits - j - 1)) % 10) | 0
      } else {
        xdi = Math.ceil((i2 + 1) / LOG_BASE)
        k = xd.length
        if (xdi >= k) {
          if (isTruncated) {
            for (; k++ <= xdi; ) xd.push(0)
            w = rd = 0
            digits = 1
            i2 %= LOG_BASE
            j = i2 - LOG_BASE + 1
          } else {
            break out
          }
        } else {
          w = k = xd[xdi]
          for (digits = 1; k >= 10; k /= 10) digits++
          i2 %= LOG_BASE
          j = i2 - LOG_BASE + digits
          rd = j < 0 ? 0 : ((w / mathpow(10, digits - j - 1)) % 10) | 0
        }
      }
      isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1))
      roundUp =
        rm < 4
          ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
          : rd > 5 ||
            (rd == 5 &&
              (rm == 4 ||
                isTruncated ||
                (rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
                  ((i2 > 0 ? (j > 0 ? w / mathpow(10, digits - j) : 0) : xd[xdi - 1]) % 10) & 1) ||
                rm == (x.s < 0 ? 8 : 7)))
      if (sd < 1 || !xd[0]) {
        xd.length = 0
        if (roundUp) {
          sd -= x.e + 1
          xd[0] = mathpow(10, (LOG_BASE - (sd % LOG_BASE)) % LOG_BASE)
          x.e = -sd || 0
        } else {
          xd[0] = x.e = 0
        }
        return x
      }
      if (i2 == 0) {
        xd.length = xdi
        k = 1
        xdi--
      } else {
        xd.length = xdi + 1
        k = mathpow(10, LOG_BASE - i2)
        xd[xdi] = j > 0 ? (((w / mathpow(10, digits - j)) % mathpow(10, j)) | 0) * k : 0
      }
      if (roundUp) {
        for (;;) {
          if (xdi == 0) {
            for (i2 = 1, j = xd[0]; j >= 10; j /= 10) i2++
            j = xd[0] += k
            for (k = 1; j >= 10; j /= 10) k++
            if (i2 != k) {
              x.e++
              if (xd[0] == BASE) xd[0] = 1
            }
            break
          } else {
            xd[xdi] += k
            if (xd[xdi] != BASE) break
            xd[xdi--] = 0
            k = 1
          }
        }
      }
      for (i2 = xd.length; xd[--i2] === 0; ) xd.pop()
    }
    if (external) {
      if (x.e > Ctor.maxE) {
        x.d = null
        x.e = NaN
      } else if (x.e < Ctor.minE) {
        x.e = 0
        x.d = [0]
      }
    }
    return x
  }
  function finiteToString(x, isExp, sd) {
    if (!x.isFinite()) return nonFiniteToString(x)
    var k,
      e = x.e,
      str = digitsToString(x.d),
      len = str.length
    if (isExp) {
      if (sd && (k = sd - len) > 0) {
        str = str.charAt(0) + '.' + str.slice(1) + getZeroString(k)
      } else if (len > 1) {
        str = str.charAt(0) + '.' + str.slice(1)
      }
      str = str + (x.e < 0 ? 'e' : 'e+') + x.e
    } else if (e < 0) {
      str = '0.' + getZeroString(-e - 1) + str
      if (sd && (k = sd - len) > 0) str += getZeroString(k)
    } else if (e >= len) {
      str += getZeroString(e + 1 - len)
      if (sd && (k = sd - e - 1) > 0) str = str + '.' + getZeroString(k)
    } else {
      if ((k = e + 1) < len) str = str.slice(0, k) + '.' + str.slice(k)
      if (sd && (k = sd - len) > 0) {
        if (e + 1 === len) str += '.'
        str += getZeroString(k)
      }
    }
    return str
  }
  function getBase10Exponent(digits, e) {
    var w = digits[0]
    for (e *= LOG_BASE; w >= 10; w /= 10) e++
    return e
  }
  function getLn10(Ctor, sd, pr) {
    if (sd > LN10_PRECISION) {
      external = true
      if (pr) Ctor.precision = pr
      throw Error(precisionLimitExceeded)
    }
    return finalise(new Ctor(LN10), sd, 1, true)
  }
  function getPi(Ctor, sd, rm) {
    if (sd > PI_PRECISION) throw Error(precisionLimitExceeded)
    return finalise(new Ctor(PI), sd, rm, true)
  }
  function getPrecision(digits) {
    var w = digits.length - 1,
      len = w * LOG_BASE + 1
    w = digits[w]
    if (w) {
      for (; w % 10 == 0; w /= 10) len--
      for (w = digits[0]; w >= 10; w /= 10) len++
    }
    return len
  }
  function getZeroString(k) {
    var zs = ''
    for (; k--; ) zs += '0'
    return zs
  }
  function intPow(Ctor, x, n, pr) {
    var isTruncated,
      r = new Ctor(1),
      k = Math.ceil(pr / LOG_BASE + 4)
    external = false
    for (;;) {
      if (n % 2) {
        r = r.times(x)
        if (truncate(r.d, k)) isTruncated = true
      }
      n = mathfloor(n / 2)
      if (n === 0) {
        n = r.d.length - 1
        if (isTruncated && r.d[n] === 0) ++r.d[n]
        break
      }
      x = x.times(x)
      truncate(x.d, k)
    }
    external = true
    return r
  }
  function isOdd(n) {
    return n.d[n.d.length - 1] & 1
  }
  function maxOrMin(Ctor, args, n) {
    var k,
      y,
      x = new Ctor(args[0]),
      i2 = 0
    for (; ++i2 < args.length; ) {
      y = new Ctor(args[i2])
      if (!y.s) {
        x = y
        break
      }
      k = x.cmp(y)
      if (k === n || (k === 0 && x.s === n)) {
        x = y
      }
    }
    return x
  }
  function naturalExponential(x, sd) {
    var denominator,
      guard,
      j,
      pow2,
      sum2,
      t,
      wpr,
      rep = 0,
      i2 = 0,
      k = 0,
      Ctor = x.constructor,
      rm = Ctor.rounding,
      pr = Ctor.precision
    if (!x.d || !x.d[0] || x.e > 17) {
      return new Ctor(x.d ? (!x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0) : x.s ? (x.s < 0 ? 0 : x) : 0 / 0)
    }
    if (sd == null) {
      external = false
      wpr = pr
    } else {
      wpr = sd
    }
    t = new Ctor(0.03125)
    while (x.e > -2) {
      x = x.times(t)
      k += 5
    }
    guard = ((Math.log(mathpow(2, k)) / Math.LN10) * 2 + 5) | 0
    wpr += guard
    denominator = pow2 = sum2 = new Ctor(1)
    Ctor.precision = wpr
    for (;;) {
      pow2 = finalise(pow2.times(x), wpr, 1)
      denominator = denominator.times(++i2)
      t = sum2.plus(divide(pow2, denominator, wpr, 1))
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        j = k
        while (j--) sum2 = finalise(sum2.times(sum2), wpr, 1)
        if (sd == null) {
          if (rep < 3 && checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += 10
            denominator = pow2 = t = new Ctor(1)
            i2 = 0
            rep++
          } else {
            return finalise(sum2, (Ctor.precision = pr), rm, (external = true))
          }
        } else {
          Ctor.precision = pr
          return sum2
        }
      }
      sum2 = t
    }
  }
  function naturalLogarithm(y, sd) {
    var c,
      c0,
      denominator,
      e,
      numerator,
      rep,
      sum2,
      t,
      wpr,
      x1,
      x2,
      n = 1,
      guard = 10,
      x = y,
      xd = x.d,
      Ctor = x.constructor,
      rm = Ctor.rounding,
      pr = Ctor.precision
    if (x.s < 0 || !xd || !xd[0] || (!x.e && xd[0] == 1 && xd.length == 1)) {
      return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x)
    }
    if (sd == null) {
      external = false
      wpr = pr
    } else {
      wpr = sd
    }
    Ctor.precision = wpr += guard
    c = digitsToString(xd)
    c0 = c.charAt(0)
    if (Math.abs((e = x.e)) < 15e14) {
      while ((c0 < 7 && c0 != 1) || (c0 == 1 && c.charAt(1) > 3)) {
        x = x.times(y)
        c = digitsToString(x.d)
        c0 = c.charAt(0)
        n++
      }
      e = x.e
      if (c0 > 1) {
        x = new Ctor('0.' + c)
        e++
      } else {
        x = new Ctor(c0 + '.' + c.slice(1))
      }
    } else {
      t = getLn10(Ctor, wpr + 2, pr).times(e + '')
      x = naturalLogarithm(new Ctor(c0 + '.' + c.slice(1)), wpr - guard).plus(t)
      Ctor.precision = pr
      return sd == null ? finalise(x, pr, rm, (external = true)) : x
    }
    x1 = x
    sum2 = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1)
    x2 = finalise(x.times(x), wpr, 1)
    denominator = 3
    for (;;) {
      numerator = finalise(numerator.times(x2), wpr, 1)
      t = sum2.plus(divide(numerator, new Ctor(denominator), wpr, 1))
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        sum2 = sum2.times(2)
        if (e !== 0) sum2 = sum2.plus(getLn10(Ctor, wpr + 2, pr).times(e + ''))
        sum2 = divide(sum2, new Ctor(n), wpr, 1)
        if (sd == null) {
          if (checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += guard
            t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1)
            x2 = finalise(x.times(x), wpr, 1)
            denominator = rep = 1
          } else {
            return finalise(sum2, (Ctor.precision = pr), rm, (external = true))
          }
        } else {
          Ctor.precision = pr
          return sum2
        }
      }
      sum2 = t
      denominator += 2
    }
  }
  function nonFiniteToString(x) {
    return String((x.s * x.s) / 0)
  }
  function parseDecimal(x, str) {
    var e, i2, len
    if ((e = str.indexOf('.')) > -1) str = str.replace('.', '')
    if ((i2 = str.search(/e/i)) > 0) {
      if (e < 0) e = i2
      e += +str.slice(i2 + 1)
      str = str.substring(0, i2)
    } else if (e < 0) {
      e = str.length
    }
    for (i2 = 0; str.charCodeAt(i2) === 48; i2++);
    for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
    str = str.slice(i2, len)
    if (str) {
      len -= i2
      x.e = e = e - i2 - 1
      x.d = []
      i2 = (e + 1) % LOG_BASE
      if (e < 0) i2 += LOG_BASE
      if (i2 < len) {
        if (i2) x.d.push(+str.slice(0, i2))
        for (len -= LOG_BASE; i2 < len; ) x.d.push(+str.slice(i2, (i2 += LOG_BASE)))
        str = str.slice(i2)
        i2 = LOG_BASE - str.length
      } else {
        i2 -= len
      }
      for (; i2--; ) str += '0'
      x.d.push(+str)
      if (external) {
        if (x.e > x.constructor.maxE) {
          x.d = null
          x.e = NaN
        } else if (x.e < x.constructor.minE) {
          x.e = 0
          x.d = [0]
        }
      }
    } else {
      x.e = 0
      x.d = [0]
    }
    return x
  }
  function parseOther(x, str) {
    var base2, Ctor, divisor, i2, isFloat, len, p2, xd, xe
    if (str.indexOf('_') > -1) {
      str = str.replace(/(\d)_(?=\d)/g, '$1')
      if (isDecimal.test(str)) return parseDecimal(x, str)
    } else if (str === 'Infinity' || str === 'NaN') {
      if (!+str) x.s = NaN
      x.e = NaN
      x.d = null
      return x
    }
    if (isHex.test(str)) {
      base2 = 16
      str = str.toLowerCase()
    } else if (isBinary.test(str)) {
      base2 = 2
    } else if (isOctal.test(str)) {
      base2 = 8
    } else {
      throw Error(invalidArgument + str)
    }
    i2 = str.search(/p/i)
    if (i2 > 0) {
      p2 = +str.slice(i2 + 1)
      str = str.substring(2, i2)
    } else {
      str = str.slice(2)
    }
    i2 = str.indexOf('.')
    isFloat = i2 >= 0
    Ctor = x.constructor
    if (isFloat) {
      str = str.replace('.', '')
      len = str.length
      i2 = len - i2
      divisor = intPow(Ctor, new Ctor(base2), i2, i2 * 2)
    }
    xd = convertBase(str, base2, BASE)
    xe = xd.length - 1
    for (i2 = xe; xd[i2] === 0; --i2) xd.pop()
    if (i2 < 0) return new Ctor(x.s * 0)
    x.e = getBase10Exponent(xd, xe)
    x.d = xd
    external = false
    if (isFloat) x = divide(x, divisor, len * 4)
    if (p2) x = x.times(Math.abs(p2) < 54 ? mathpow(2, p2) : Decimal.pow(2, p2))
    external = true
    return x
  }
  function sine(Ctor, x) {
    var k,
      len = x.d.length
    if (len < 3) {
      return x.isZero() ? x : taylorSeries(Ctor, 2, x, x)
    }
    k = 1.4 * Math.sqrt(len)
    k = k > 16 ? 16 : k | 0
    x = x.times(1 / tinyPow(5, k))
    x = taylorSeries(Ctor, 2, x, x)
    var sin2_x,
      d5 = new Ctor(5),
      d16 = new Ctor(16),
      d20 = new Ctor(20)
    for (; k--; ) {
      sin2_x = x.times(x)
      x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))))
    }
    return x
  }
  function taylorSeries(Ctor, n, x, y, isHyperbolic) {
    var j,
      t,
      u2,
      x2,
      i2 = 1,
      pr = Ctor.precision,
      k = Math.ceil(pr / LOG_BASE)
    external = false
    x2 = x.times(x)
    u2 = new Ctor(y)
    for (;;) {
      t = divide(u2.times(x2), new Ctor(n++ * n++), pr, 1)
      u2 = isHyperbolic ? y.plus(t) : y.minus(t)
      y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1)
      t = u2.plus(y)
      if (t.d[k] !== void 0) {
        for (j = k; t.d[j] === u2.d[j] && j--; );
        if (j == -1) break
      }
      j = u2
      u2 = y
      y = t
      t = j
      i2++
    }
    external = true
    t.d.length = k + 1
    return t
  }
  function tinyPow(b2, e) {
    var n = b2
    while (--e) n *= b2
    return n
  }
  function toLessThanHalfPi(Ctor, x) {
    var t,
      isNeg = x.s < 0,
      pi = getPi(Ctor, Ctor.precision, 1),
      halfPi = pi.times(0.5)
    x = x.abs()
    if (x.lte(halfPi)) {
      quadrant = isNeg ? 4 : 1
      return x
    }
    t = x.divToInt(pi)
    if (t.isZero()) {
      quadrant = isNeg ? 3 : 2
    } else {
      x = x.minus(t.times(pi))
      if (x.lte(halfPi)) {
        quadrant = isOdd(t) ? (isNeg ? 2 : 3) : isNeg ? 4 : 1
        return x
      }
      quadrant = isOdd(t) ? (isNeg ? 1 : 4) : isNeg ? 3 : 2
    }
    return x.minus(pi).abs()
  }
  function toStringBinary(x, baseOut, sd, rm) {
    var base2,
      e,
      i2,
      k,
      len,
      roundUp,
      str,
      xd,
      y,
      Ctor = x.constructor,
      isExp = sd !== void 0
    if (isExp) {
      checkInt32(sd, 1, MAX_DIGITS)
      if (rm === void 0) rm = Ctor.rounding
      else checkInt32(rm, 0, 8)
    } else {
      sd = Ctor.precision
      rm = Ctor.rounding
    }
    if (!x.isFinite()) {
      str = nonFiniteToString(x)
    } else {
      str = finiteToString(x)
      i2 = str.indexOf('.')
      if (isExp) {
        base2 = 2
        if (baseOut == 16) {
          sd = sd * 4 - 3
        } else if (baseOut == 8) {
          sd = sd * 3 - 2
        }
      } else {
        base2 = baseOut
      }
      if (i2 >= 0) {
        str = str.replace('.', '')
        y = new Ctor(1)
        y.e = str.length - i2
        y.d = convertBase(finiteToString(y), 10, base2)
        y.e = y.d.length
      }
      xd = convertBase(str, 10, base2)
      e = len = xd.length
      for (; xd[--len] == 0; ) xd.pop()
      if (!xd[0]) {
        str = isExp ? '0p+0' : '0'
      } else {
        if (i2 < 0) {
          e--
        } else {
          x = new Ctor(x)
          x.d = xd
          x.e = e
          x = divide(x, y, sd, rm, 0, base2)
          xd = x.d
          e = x.e
          roundUp = inexact
        }
        i2 = xd[sd]
        k = base2 / 2
        roundUp = roundUp || xd[sd + 1] !== void 0
        roundUp =
          rm < 4
            ? (i2 !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2))
            : i2 > k || (i2 === k && (rm === 4 || roundUp || (rm === 6 && xd[sd - 1] & 1) || rm === (x.s < 0 ? 8 : 7)))
        xd.length = sd
        if (roundUp) {
          for (; ++xd[--sd] > base2 - 1; ) {
            xd[sd] = 0
            if (!sd) {
              ++e
              xd.unshift(1)
            }
          }
        }
        for (len = xd.length; !xd[len - 1]; --len);
        for (i2 = 0, str = ''; i2 < len; i2++) str += NUMERALS.charAt(xd[i2])
        if (isExp) {
          if (len > 1) {
            if (baseOut == 16 || baseOut == 8) {
              i2 = baseOut == 16 ? 4 : 3
              for (--len; len % i2; len++) str += '0'
              xd = convertBase(str, base2, baseOut)
              for (len = xd.length; !xd[len - 1]; --len);
              for (i2 = 1, str = '1.'; i2 < len; i2++) str += NUMERALS.charAt(xd[i2])
            } else {
              str = str.charAt(0) + '.' + str.slice(1)
            }
          }
          str = str + (e < 0 ? 'p' : 'p+') + e
        } else if (e < 0) {
          for (; ++e; ) str = '0' + str
          str = '0.' + str
        } else {
          if (++e > len) for (e -= len; e--; ) str += '0'
          else if (e < len) str = str.slice(0, e) + '.' + str.slice(e)
        }
      }
      str = (baseOut == 16 ? '0x' : baseOut == 2 ? '0b' : baseOut == 8 ? '0o' : '') + str
    }
    return x.s < 0 ? '-' + str : str
  }
  function truncate(arr, len) {
    if (arr.length > len) {
      arr.length = len
      return true
    }
  }
  function abs(x) {
    return new this(x).abs()
  }
  function acos(x) {
    return new this(x).acos()
  }
  function acosh(x) {
    return new this(x).acosh()
  }
  function add(x, y) {
    return new this(x).plus(y)
  }
  function asin(x) {
    return new this(x).asin()
  }
  function asinh(x) {
    return new this(x).asinh()
  }
  function atan(x) {
    return new this(x).atan()
  }
  function atanh(x) {
    return new this(x).atanh()
  }
  function atan2(y, x) {
    y = new this(y)
    x = new this(x)
    var r,
      pr = this.precision,
      rm = this.rounding,
      wpr = pr + 4
    if (!y.s || !x.s) {
      r = new this(NaN)
    } else if (!y.d && !x.d) {
      r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75)
      r.s = y.s
    } else if (!x.d || y.isZero()) {
      r = x.s < 0 ? getPi(this, pr, rm) : new this(0)
      r.s = y.s
    } else if (!y.d || x.isZero()) {
      r = getPi(this, wpr, 1).times(0.5)
      r.s = y.s
    } else if (x.s < 0) {
      this.precision = wpr
      this.rounding = 1
      r = this.atan(divide(y, x, wpr, 1))
      x = getPi(this, wpr, 1)
      this.precision = pr
      this.rounding = rm
      r = y.s < 0 ? r.minus(x) : r.plus(x)
    } else {
      r = this.atan(divide(y, x, wpr, 1))
    }
    return r
  }
  function cbrt(x) {
    return new this(x).cbrt()
  }
  function ceil(x) {
    return finalise((x = new this(x)), x.e + 1, 2)
  }
  function clamp(x, min2, max2) {
    return new this(x).clamp(min2, max2)
  }
  function config(obj) {
    if (!obj || typeof obj !== 'object') throw Error(decimalError + 'Object expected')
    var i2,
      p2,
      v,
      useDefaults = obj.defaults === true,
      ps = [
        'precision',
        1,
        MAX_DIGITS,
        'rounding',
        0,
        8,
        'toExpNeg',
        -EXP_LIMIT,
        0,
        'toExpPos',
        0,
        EXP_LIMIT,
        'maxE',
        0,
        EXP_LIMIT,
        'minE',
        -EXP_LIMIT,
        0,
        'modulo',
        0,
        9,
      ]
    for (i2 = 0; i2 < ps.length; i2 += 3) {
      if (((p2 = ps[i2]), useDefaults)) this[p2] = DEFAULTS[p2]
      if ((v = obj[p2]) !== void 0) {
        if (mathfloor(v) === v && v >= ps[i2 + 1] && v <= ps[i2 + 2]) this[p2] = v
        else throw Error(invalidArgument + p2 + ': ' + v)
      }
    }
    if (((p2 = 'crypto'), useDefaults)) this[p2] = DEFAULTS[p2]
    if ((v = obj[p2]) !== void 0) {
      if (v === true || v === false || v === 0 || v === 1) {
        if (v) {
          if (typeof crypto != 'undefined' && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
            this[p2] = true
          } else {
            throw Error(cryptoUnavailable)
          }
        } else {
          this[p2] = false
        }
      } else {
        throw Error(invalidArgument + p2 + ': ' + v)
      }
    }
    return this
  }
  function cos(x) {
    return new this(x).cos()
  }
  function cosh(x) {
    return new this(x).cosh()
  }
  function clone(obj) {
    var i2, p2, ps
    function Decimal2(v) {
      var e,
        i3,
        t,
        x = this
      if (!(x instanceof Decimal2)) return new Decimal2(v)
      x.constructor = Decimal2
      if (isDecimalInstance(v)) {
        x.s = v.s
        if (external) {
          if (!v.d || v.e > Decimal2.maxE) {
            x.e = NaN
            x.d = null
          } else if (v.e < Decimal2.minE) {
            x.e = 0
            x.d = [0]
          } else {
            x.e = v.e
            x.d = v.d.slice()
          }
        } else {
          x.e = v.e
          x.d = v.d ? v.d.slice() : v.d
        }
        return
      }
      t = typeof v
      if (t === 'number') {
        if (v === 0) {
          x.s = 1 / v < 0 ? -1 : 1
          x.e = 0
          x.d = [0]
          return
        }
        if (v < 0) {
          v = -v
          x.s = -1
        } else {
          x.s = 1
        }
        if (v === ~~v && v < 1e7) {
          for (e = 0, i3 = v; i3 >= 10; i3 /= 10) e++
          if (external) {
            if (e > Decimal2.maxE) {
              x.e = NaN
              x.d = null
            } else if (e < Decimal2.minE) {
              x.e = 0
              x.d = [0]
            } else {
              x.e = e
              x.d = [v]
            }
          } else {
            x.e = e
            x.d = [v]
          }
          return
        }
        if (v * 0 !== 0) {
          if (!v) x.s = NaN
          x.e = NaN
          x.d = null
          return
        }
        return parseDecimal(x, v.toString())
      }
      if (t === 'string') {
        if ((i3 = v.charCodeAt(0)) === 45) {
          v = v.slice(1)
          x.s = -1
        } else {
          if (i3 === 43) v = v.slice(1)
          x.s = 1
        }
        return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v)
      }
      if (t === 'bigint') {
        if (v < 0) {
          v = -v
          x.s = -1
        } else {
          x.s = 1
        }
        return parseDecimal(x, v.toString())
      }
      throw Error(invalidArgument + v)
    }
    Decimal2.prototype = P
    Decimal2.ROUND_UP = 0
    Decimal2.ROUND_DOWN = 1
    Decimal2.ROUND_CEIL = 2
    Decimal2.ROUND_FLOOR = 3
    Decimal2.ROUND_HALF_UP = 4
    Decimal2.ROUND_HALF_DOWN = 5
    Decimal2.ROUND_HALF_EVEN = 6
    Decimal2.ROUND_HALF_CEIL = 7
    Decimal2.ROUND_HALF_FLOOR = 8
    Decimal2.EUCLID = 9
    Decimal2.config = Decimal2.set = config
    Decimal2.clone = clone
    Decimal2.isDecimal = isDecimalInstance
    Decimal2.abs = abs
    Decimal2.acos = acos
    Decimal2.acosh = acosh
    Decimal2.add = add
    Decimal2.asin = asin
    Decimal2.asinh = asinh
    Decimal2.atan = atan
    Decimal2.atanh = atanh
    Decimal2.atan2 = atan2
    Decimal2.cbrt = cbrt
    Decimal2.ceil = ceil
    Decimal2.clamp = clamp
    Decimal2.cos = cos
    Decimal2.cosh = cosh
    Decimal2.div = div2
    Decimal2.exp = exp
    Decimal2.floor = floor
    Decimal2.hypot = hypot
    Decimal2.ln = ln
    Decimal2.log = log
    Decimal2.log10 = log10
    Decimal2.log2 = log2
    Decimal2.max = max
    Decimal2.min = min
    Decimal2.mod = mod
    Decimal2.mul = mul
    Decimal2.pow = pow
    Decimal2.random = random
    Decimal2.round = round
    Decimal2.sign = sign
    Decimal2.sin = sin
    Decimal2.sinh = sinh
    Decimal2.sqrt = sqrt
    Decimal2.sub = sub2
    Decimal2.sum = sum
    Decimal2.tan = tan
    Decimal2.tanh = tanh
    Decimal2.trunc = trunc
    if (obj === void 0) obj = {}
    if (obj) {
      if (obj.defaults !== true) {
        ps = ['precision', 'rounding', 'toExpNeg', 'toExpPos', 'maxE', 'minE', 'modulo', 'crypto']
        for (i2 = 0; i2 < ps.length; ) if (!obj.hasOwnProperty((p2 = ps[i2++]))) obj[p2] = this[p2]
      }
    }
    Decimal2.config(obj)
    return Decimal2
  }
  function div2(x, y) {
    return new this(x).div(y)
  }
  function exp(x) {
    return new this(x).exp()
  }
  function floor(x) {
    return finalise((x = new this(x)), x.e + 1, 3)
  }
  function hypot() {
    var i2,
      n,
      t = new this(0)
    external = false
    for (i2 = 0; i2 < arguments.length; ) {
      n = new this(arguments[i2++])
      if (!n.d) {
        if (n.s) {
          external = true
          return new this(1 / 0)
        }
        t = n
      } else if (t.d) {
        t = t.plus(n.times(n))
      }
    }
    external = true
    return t.sqrt()
  }
  function isDecimalInstance(obj) {
    return obj instanceof Decimal || (obj && obj.toStringTag === tag) || false
  }
  function ln(x) {
    return new this(x).ln()
  }
  function log(x, y) {
    return new this(x).log(y)
  }
  function log2(x) {
    return new this(x).log(2)
  }
  function log10(x) {
    return new this(x).log(10)
  }
  function max() {
    return maxOrMin(this, arguments, -1)
  }
  function min() {
    return maxOrMin(this, arguments, 1)
  }
  function mod(x, y) {
    return new this(x).mod(y)
  }
  function mul(x, y) {
    return new this(x).mul(y)
  }
  function pow(x, y) {
    return new this(x).pow(y)
  }
  function random(sd) {
    var d,
      e,
      k,
      n,
      i2 = 0,
      r = new this(1),
      rd = []
    if (sd === void 0) sd = this.precision
    else checkInt32(sd, 1, MAX_DIGITS)
    k = Math.ceil(sd / LOG_BASE)
    if (!this.crypto) {
      for (; i2 < k; ) rd[i2++] = (Math.random() * 1e7) | 0
    } else if (crypto.getRandomValues) {
      d = crypto.getRandomValues(new Uint32Array(k))
      for (; i2 < k; ) {
        n = d[i2]
        if (n >= 429e7) {
          d[i2] = crypto.getRandomValues(new Uint32Array(1))[0]
        } else {
          rd[i2++] = n % 1e7
        }
      }
    } else if (crypto.randomBytes) {
      d = crypto.randomBytes((k *= 4))
      for (; i2 < k; ) {
        n = d[i2] + (d[i2 + 1] << 8) + (d[i2 + 2] << 16) + ((d[i2 + 3] & 127) << 24)
        if (n >= 214e7) {
          crypto.randomBytes(4).copy(d, i2)
        } else {
          rd.push(n % 1e7)
          i2 += 4
        }
      }
      i2 = k / 4
    } else {
      throw Error(cryptoUnavailable)
    }
    k = rd[--i2]
    sd %= LOG_BASE
    if (k && sd) {
      n = mathpow(10, LOG_BASE - sd)
      rd[i2] = ((k / n) | 0) * n
    }
    for (; rd[i2] === 0; i2--) rd.pop()
    if (i2 < 0) {
      e = 0
      rd = [0]
    } else {
      e = -1
      for (; rd[0] === 0; e -= LOG_BASE) rd.shift()
      for (k = 1, n = rd[0]; n >= 10; n /= 10) k++
      if (k < LOG_BASE) e -= LOG_BASE - k
    }
    r.e = e
    r.d = rd
    return r
  }
  function round(x) {
    return finalise((x = new this(x)), x.e + 1, this.rounding)
  }
  function sign(x) {
    x = new this(x)
    return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN
  }
  function sin(x) {
    return new this(x).sin()
  }
  function sinh(x) {
    return new this(x).sinh()
  }
  function sqrt(x) {
    return new this(x).sqrt()
  }
  function sub2(x, y) {
    return new this(x).sub(y)
  }
  function sum() {
    var i2 = 0,
      args = arguments,
      x = new this(args[i2])
    external = false
    for (; x.s && ++i2 < args.length; ) x = x.plus(args[i2])
    external = true
    return finalise(x, this.precision, this.rounding)
  }
  function tan(x) {
    return new this(x).tan()
  }
  function tanh(x) {
    return new this(x).tanh()
  }
  function trunc(x) {
    return finalise((x = new this(x)), x.e + 1, 1)
  }
  P[/* @__PURE__ */ Symbol.for('nodejs.util.inspect.custom')] = P.toString
  P[Symbol.toStringTag] = 'Decimal'
  var Decimal = (P.constructor = clone(DEFAULTS))
  LN10 = new Decimal(LN10)
  PI = new Decimal(PI)
  var decimal_default = Decimal

  // ../ki-frame/src/stringFormatter.ts
  var defaultFormatters = {
    s: (v, spec) => {
      let s2 = String(v != null ? v : '')
      if (spec.precision !== void 0) s2 = s2.slice(0, spec.precision)
      return pad(s2, spec.width)
    },
    d: (v, spec) => {
      const n = Number(v)
      const s2 = Number.isFinite(n) ? String(Math.trunc(n)) : 'NaN'
      return pad(s2, spec.width)
    },
    f: (v, spec) => {
      const n = Number(v)
      if (!Number.isFinite(n)) return pad(String(n), spec.width)
      const prec = spec.precision !== void 0 ? spec.precision : 6
      const s2 = n.toFixed(prec)
      return pad(s2, spec.width)
    },
    j: (v) => {
      try {
        return JSON.stringify(v)
      } catch {
        return String(v)
      }
    },
  }
  function pad(s2, width) {
    if (width === void 0 || width <= s2.length) return s2
    return ' '.repeat(width - s2.length) + s2
  }
  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v)
  }
  function createFormatter(customFormatters = {}) {
    const registry = /* @__PURE__ */ new Map()
    const addMap = (map2) => {
      for (const k of Object.keys(map2)) {
        if (!/^[A-Za-z]+$/.test(k)) {
          throw new Error(`format key must be letters only: "${k}"`)
        }
        registry.set(k, map2[k])
      }
    }
    addMap(defaultFormatters)
    addMap(customFormatters)
    function sprintf(format, ...args) {
      let argIndex = 0
      let previousWasNamedArg = false
      const tokenRE =
        /%(\(([^)]+)\))?(?:(\d+)(?=(?:\.[0-9]+)?[A-Za-z][A-Za-z0-9]*))?(?:\.([0-9]+))?([A-Za-z][A-Za-z0-9]*)/g
      const result = format.replace(tokenRE, (match, _paren, name, widthStr, precStr, type) => {
        const spec = {
          key: name,
          width: widthStr ? parseInt(widthStr, 10) : void 0,
          precision: precStr ? parseInt(precStr, 10) : void 0,
          raw: match,
          type,
        }
        let value
        if (name) {
          value = args[0] !== void 0 && isPlainObject(args[argIndex]) ? args[argIndex][name] : void 0
          previousWasNamedArg = true
        } else {
          if (previousWasNamedArg) {
            argIndex++
            previousWasNamedArg = false
          }
          value = args[argIndex++]
        }
        const handler = registry.get(type)
        if (!handler) {
          return match
        }
        try {
          return String(handler(value, spec))
        } catch {
          return pad(String(value != null ? value : ''), spec.width)
        }
      })
      return result
    }
    return sprintf
  }

  // src/kaukolampo/formatting.ts
  var printPower = (n) => n.toFixed(3)
  var printMoney = (n) => n.toFixed(2)

  // src/kaukolampo/range.ts
  function range(from, to) {
    return Array.from({ length: to - from + 1 }, (_, i2) => from + i2)
  }

  // src/kaukolampo/util.ts
  function toDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day))
  }
  async function shortHexHash(input2, length) {
    const encoder = new TextEncoder()
    const data2 = encoder.encode(input2)
    const buffer = await crypto.subtle.digest('SHA-256', data2)
    const full = Array.from(new Uint8Array(buffer))
      .map((b2) => b2.toString(16).padStart(2, '0'))
      .join('')
    if (length === void 0) {
      return full
    }
    if (length < 0 || length > full.length) {
      throw new Error(`Length must be between 0 and ${full.length}`)
    }
    return full.slice(0, length)
  }

  // src/kaukolampo/viivastyskorko.ts
  var HARD_CODED_PERIODS = [
    {
      from: '2024-01-01',
      invalidOn: '2024-07-01',
      personAnnualRate: 0.115,
      companyAnnualRate: 0.125,
    },
    {
      from: '2024-07-01',
      invalidOn: '2025-01-01',
      personAnnualRate: 0.115,
      // 11.5%
      companyAnnualRate: 0.125,
      // 12.5%
    },
    {
      from: '2025-01-01',
      invalidOn: '2025-07-01',
      personAnnualRate: 0.105,
      // 10.5%
      companyAnnualRate: 0.115,
      // 11.5%
    },
    {
      from: '2025-07-01',
      invalidOn: '2026-01-01',
      personAnnualRate: 0.095,
      // 9.5%
      companyAnnualRate: 0.105,
      // 10.5%
    },
    {
      from: '2026-01-01',
      invalidOn: '2026-07-01',
      personAnnualRate: 0.095,
      // 9.5%
      companyAnnualRate: 0.105,
      // 10.5%
    },
  ]
  var MS_PER_DAY = 24 * 60 * 60 * 1e3
  function toDateISO(s2) {
    return /* @__PURE__ */ new Date(s2 + 'T00:00:00Z')
  }
  function daysBetweenInclusiveExclusive(start, end) {
    return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)
  }
  function calculateViivastyskorkoMultiplier(startDate, endDate, company, periods = HARD_CODED_PERIODS) {
    let multiplier2 = decimal_default(1)
    if (endDate <= startDate) return { multiplier: multiplier2, company, segments: [] }
    const segments = []
    for (const p2 of periods) {
      const periodStart = toDateISO(p2.from)
      const periodEnd = toDateISO(p2.invalidOn)
      const segStart = startDate > periodStart ? startDate : periodStart
      const segEnd = endDate < periodEnd ? endDate : periodEnd
      if (segEnd <= segStart) continue
      const days = daysBetweenInclusiveExclusive(segStart, segEnd)
      const annual = decimal_default(company ? p2.companyAnnualRate : p2.personAnnualRate)
      const daily = decimal_default(annual).div(365)
      const segmentInterest = daily.mul(days).plus(1)
      multiplier2 = multiplier2.mul(segmentInterest)
      segments.push({ start: segStart, end: segEnd, annual, days, multiplier: segmentInterest })
    }
    return { multiplier: multiplier2, company, segments }
  }

  // src/kaukolampo/kaukolampoBilling.ts
  var ymToIndex = (ym) => ym.year * 12 + (ym.month - 1)
  var indexToYm = (idx) => {
    const year = Math.floor(idx / 12)
    const month = (idx % 12) + 1
    return { year, month }
  }
  function resolveMonthlyPricingLookup(contract, from, to) {
    const result = {}
    const sortedPricesDesc = [...contract.monthlyPricing].sort((a2, b2) => ymToIndex(b2) - ymToIndex(a2))
    for (let c = ymToIndex(from); c <= ymToIndex(to); c++) {
      const firstLower = sortedPricesDesc.find((value) => ymToIndex(value) <= c && value.price)
      if (firstLower && isDefined(firstLower.price)) {
        const { monthlyFee, powerPricePerMW } = firstLower.price
        result[c] = {
          monthlyFee: decimal_default(monthlyFee),
          powerPrice: decimal_default(powerPricePerMW),
        }
      } else {
        throw new Error(`${indexToYm(c)} is not in the range of contract prices for ${contract.id}`)
      }
    }
    return result
  }
  var months = range(1, 12)
  function calculateValues(years, monthlyPricing, powerUsage) {
    const totalsByYear = {}
    const monthBillInfos = {}
    years.forEach((year, index) => {
      const yearTotal = {
        usedPower: decimal_default(0),
        monthCount: 0,
        billedTotals: {
          usedPowerPrice: decimal_default(0),
          monthlyFees: decimal_default(0),
          total: decimal_default(0),
        },
        calculatedTotals: {
          comparedToPreviousYear: true,
          usedPowerPrice: decimal_default(0),
          monthlyFees: decimal_default(0),
          total: decimal_default(0),
          avgMonthlyFee: decimal_default(0),
          avgPowerPrice: decimal_default(0),
          excessBilling: decimal_default(0),
        },
      }
      months.forEach((month) => {
        const index2 = ymToIndex({ year, month })
        const usedPower = powerUsage[index2]
        if (usedPower) {
          const price = monthlyPricing[index2]
          const usedPowerPrice = usedPower.mul(price.powerPrice)
          const prevPrice = monthlyPricing[index2 - 1] || price
          const total = usedPowerPrice.add(price.monthlyFee)
          monthBillInfos[index2] = {
            index: index2,
            ...price,
            usedPower,
            usedPowerPrice,
            mWPriceDelta: price.powerPrice.sub(prevPrice.powerPrice).toNumber(),
            monthlyFeeDelta: price.monthlyFee.sub(prevPrice.monthlyFee).toNumber(),
            total,
          }
          yearTotal.usedPower = yearTotal.usedPower.add(usedPower)
          const billedTotals = yearTotal.billedTotals
          billedTotals.monthlyFees = billedTotals.monthlyFees.add(price.monthlyFee)
          billedTotals.usedPowerPrice = billedTotals.usedPowerPrice.add(usedPowerPrice)
          billedTotals.total = billedTotals.total.add(total)
          yearTotal.monthCount = yearTotal.monthCount + 1
        }
      })
      yearTotal.calculatedTotals = {
        ...yearTotal.billedTotals,
        comparedToPreviousYear: false,
        avgPowerPrice: yearTotal.billedTotals.usedPowerPrice.div(yearTotal.usedPower),
        avgMonthlyFee: yearTotal.billedTotals.monthlyFees.div(yearTotal.monthCount),
        excessBilling: decimal_default(0),
      }
      if (index > 0) {
        const prevYear = year - 1
        const prevTotals = totalsByYear[prevYear].calculatedTotals
        const prevMonthlyFees = prevTotals.avgMonthlyFee.mul(yearTotal.monthCount)
        const prevUsedPowerPrice = yearTotal.usedPower.mul(prevTotals.avgPowerPrice)
        const totalsBasedOnLastYearLevel = {
          monthlyFees: prevMonthlyFees,
          usedPowerPrice: prevUsedPowerPrice,
          total: prevMonthlyFees.add(prevUsedPowerPrice),
        }
        yearTotal.totalsBasedOnLastYearLevel = totalsBasedOnLastYearLevel
        const billedTotal = yearTotal.billedTotals.total
        const priceIncreaseEuros = billedTotal.minus(totalsBasedOnLastYearLevel.total)
        const priceIncreasePercents = billedTotal.div(totalsBasedOnLastYearLevel.total).minus(1).mul(100)
        const priceIncreaseTooMuch = priceIncreaseEuros.toNumber() > 150 && priceIncreasePercents.toNumber() > 15
        if (priceIncreaseTooMuch) {
          const total = totalsBasedOnLastYearLevel.total.add(150)
          const adjustmentMultiplier = total.div(totalsBasedOnLastYearLevel.total)
          const avgMonthlyFee = prevTotals.avgMonthlyFee.mul(adjustmentMultiplier)
          const avgPowerPrice = prevTotals.avgPowerPrice.mul(adjustmentMultiplier)
          yearTotal.calculatedTotals = {
            usedPowerPrice: avgPowerPrice.mul(yearTotal.usedPower),
            monthlyFees: avgMonthlyFee.mul(yearTotal.monthCount),
            total,
            avgMonthlyFee,
            avgPowerPrice,
            adjustmentMultiplier,
            excessBilling: billedTotal.minus(total),
            comparedToPreviousYear: true,
            priceIncreaseTooMuch,
            priceIncreasePercents,
            priceIncreaseEuros,
          }
        } else {
          yearTotal.calculatedTotals.comparedToPreviousYear = true
          yearTotal.calculatedTotals.priceIncreasePercents = priceIncreasePercents
          yearTotal.calculatedTotals.priceIncreaseEuros = priceIncreaseEuros
        }
      }
      totalsByYear[year] = yearTotal
    })
    const excessYears = years.filter((y) => totalsByYear[y].calculatedTotals.excessBilling.toNumber() > 0)
    const paybackInterestYears = calculatePaybackInterest(excessYears, monthBillInfos, totalsByYear)
    return { totalsByYear, monthBillInfos, excessYears, paybackInterestYears, years }
  }
  function decimalMin(a2, b2) {
    if (a2.toNumber() <= b2.toNumber()) {
      return a2
    }
    return b2
  }
  function calculatePaybackInterest(excessYears, originalBills, totalsByYear) {
    return excessYears.map((year) => {
      let billedTotal = decimal_default(0)
      const fromAveragePricesTotals = {
        total: decimal_default(0),
        excess: decimal_default(0),
        interest: decimal_default(0),
      }
      const comparingToPreviousYearAnd150BufferTotals = {
        total: decimal_default(0),
        excess: decimal_default(0),
        interest: decimal_default(0),
      }
      const yearTotal = totalsByYear[year].calculatedTotals
      const prevTotal = totalsByYear[year - 1].calculatedTotals
      function calculateInterestMultiplier(month) {
        const startDate = toDate(year, month, 1)
        const viivastyskorkoMultiplier = calculateViivastyskorkoMultiplier(startDate, /* @__PURE__ */ new Date(), true)
        return viivastyskorkoMultiplier.multiplier
      }
      function calculateExcessFromAveragePrices(originalBill, originalTotal, month) {
        const usedPowerPrice = originalBill.usedPower.mul(yearTotal.avgPowerPrice)
        const calculatedTotal = usedPowerPrice.plus(yearTotal.avgMonthlyFee)
        const excess = originalTotal.minus(calculatedTotal)
        const interest = excess.mul(decimal_default(calculateInterestMultiplier(month)).minus(1))
        fromAveragePricesTotals.total = fromAveragePricesTotals.total.add(calculatedTotal)
        fromAveragePricesTotals.excess = fromAveragePricesTotals.excess.add(excess)
        fromAveragePricesTotals.interest = fromAveragePricesTotals.interest.add(interest)
        return {
          monthlyFee: yearTotal.avgMonthlyFee,
          powerPrice: yearTotal.avgPowerPrice,
          usedPowerPrice,
          total: calculatedTotal,
          excess,
          interest,
        }
      }
      let leftFrom150 = decimal_default(150)
      const months2 = range(1, 12).map((month) => {
        const index = ymToIndex({ year, month })
        const originalBill = originalBills[index]
        if (!originalBill) return void 0
        const originalTotal = originalBill.total
        billedTotal = billedTotal.add(originalTotal)
        const usedPowerPrice = originalBill.usedPower.mul(prevTotal.avgPowerPrice)
        const totalWithLastYearLevel = usedPowerPrice.add(prevTotal.avgMonthlyFee)
        let total = billedTotal
        let excess = decimal_default(0)
        let interest = decimal_default(0)
        const delta = originalTotal.minus(totalWithLastYearLevel)
        if (delta.toNumber() > 0) {
          if (leftFrom150.toNumber() > 0) {
            const useBuffer = decimalMin(leftFrom150, delta)
            leftFrom150 = leftFrom150.minus(useBuffer)
            total = totalWithLastYearLevel.plus(useBuffer)
            excess = originalTotal.minus(total)
          } else {
            total = totalWithLastYearLevel
            excess = delta
          }
          if (excess.toNumber() > 0) {
            interest = excess.mul(decimal_default(calculateInterestMultiplier(month)).minus(1))
          }
        }
        const excessComparingToPreviousYearAnd150Buffer = {
          monthlyFee: prevTotal.avgMonthlyFee,
          powerPrice: prevTotal.avgPowerPrice,
          usedPowerPrice,
          totalWithLastYearLevel,
          total,
          excess,
          interest,
          leftFrom150,
        }
        comparingToPreviousYearAnd150BufferTotals.total = comparingToPreviousYearAnd150BufferTotals.total.add(total)
        comparingToPreviousYearAnd150BufferTotals.excess = comparingToPreviousYearAnd150BufferTotals.excess.add(excess)
        comparingToPreviousYearAnd150BufferTotals.interest =
          comparingToPreviousYearAnd150BufferTotals.interest.add(interest)
        return {
          month,
          originalBill,
          excessFromAveragePrices: calculateExcessFromAveragePrices(originalBill, originalTotal, month),
          excessComparingToPreviousYearAnd150Buffer,
        }
      })
      return {
        year,
        months: months2.filter(isDefined),
        billedTotal,
        fromAveragePricesTotals,
        comparingToPreviousYearAnd150BufferTotals,
      }
    })
  }

  // src/kaukolampo/powerUsageString.ts
  function parseUnderscoreSeparatedYmNumbers(input2) {
    if (typeof input2 !== 'string') throw new TypeError('input must be a string')
    const tokens = input2
      .split('_')
      .map((t) => t.trim())
      .filter(Boolean)
    if (tokens.length === 0) {
      throw new Error('input must contain at least a year-month anchor')
    }
    const ymRegex = /^(\d{4})-(\d{1,2})$/
    const first = tokens[0]
    const ymMatch = first.match(ymRegex)
    if (!ymMatch) {
      throw new Error(`first token must be year-month in form YYYY-M: got "${first}"`)
    }
    const year = Number(ymMatch[1])
    const month = Number(ymMatch[2])
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(`invalid year-month anchor: "${first}"`)
    }
    const from = { year, month }
    let idx = ymToIndex(from)
    const numbers = {}
    const numberTokens = tokens.slice(1)
    if (numberTokens.length === 0) {
      return { from, to: from, numbers }
    }
    for (const t of numberTokens) {
      const v = decimal_default(t)
      if (!v.isFinite()) {
        throw new Error(`expected numeric token but got "${t}"`)
      }
      numbers[idx] = v
      idx += 1
    }
    const to = indexToYm(idx - 1)
    return { from, to, numbers }
  }
  function formatAsUnderscoreSeparated(input2) {
    const { from, to, numbers } = input2
    const fromIdx = ymToIndex(from)
    const toIdx = ymToIndex(to)
    if (toIdx < fromIdx) {
      throw new Error('to must be >= from')
    }
    const parts = []
    parts.push(`${from.year}-${from.month}`)
    for (let idx = fromIdx; idx <= toIdx; idx++) {
      const value = numbers[idx]
      if (value === void 0) {
        throw new Error(`Missing number for ${JSON.stringify(indexToYm(idx))}`)
      }
      parts.push(String(value))
    }
    return parts.join('_')
  }

  // src/kaukolampo/prices/tuusulanjarvenLampo.ts
  var tuusulanjarvenLampo = {
    id: 'tula-pepi',
    companyName: 'Tuusulanj\xE4rven L\xE4mp\xF6',
    contractTypeName: 'Perusl\xE4mp\xF6 Pientalo',
    monthlyPricing: [
      {
        year: 2022,
        month: 1,
        price: {
          monthlyFee: 35.3,
          powerPricePerMW: 68.57,
        },
      },
      {
        year: 2023,
        month: 6,
        price: {
          monthlyFee: 40.25,
          powerPricePerMW: 78.17,
        },
      },
      {
        year: 2024,
        month: 1,
        price: {
          monthlyFee: 45.88,
          powerPricePerMW: 89.12,
        },
      },
      {
        year: 2024,
        month: 9,
        price: {
          monthlyFee: 46.44,
          powerPricePerMW: 90.2,
        },
      },
      {
        year: 2025,
        month: 1,
        price: {
          monthlyFee: 59.55,
          powerPricePerMW: 90.2,
        },
      },
      {
        year: 2025,
        month: 7,
        price: {
          monthlyFee: 59.55,
          powerPricePerMW: 86.04,
        },
      },
    ],
  }

  // src/kaukolampo/kaukolampoUi.ts
  var showIncrease = (inc) => styles({ backgroundColor: !inc || inc === 0 ? '' : inc > 0 ? 'lightpink' : 'lightgreen' })
  var uiStyles = {
    pageBreakAfter: { class: 'pagebreak' },
    noPrint: { class: 'no-print' },
    borderLeft: styles({ borderLeft: '2px solid #6b7280' }),
    numberTableRight: styles({ width: 'auto', textAlign: 'right', verticalAlign: 'top' }),
    numberTableLeft: styles({ width: 'auto', verticalAlign: 'top' }),
    bold: styles({ fontWeight: 'bold' }),
  }
  var formatter = createFormatter({
    P: (v, s2) => decimal_default(v).toFixed(s2.precision || 3),
    M: printMoney,
  })
  function BillItemTDs(index) {
    const usedPowerText = text()
    const usedPowerTextDiv = div(usedPowerText)
    const usedPowerInput = index && inputs.text({ name: index.toString(), hidden: true }, styles({ width: '7ch' }))
    const usedPower = td(uiStyles.borderLeft, usedPowerTextDiv, usedPowerInput)
    const mwPrice = td()
    const powerPrice = td()
    const monthlyFee = td()
    const total = td(uiStyles.bold)
    const setText = (info) => {
      if (usedPowerInput)
        if (info == null ? void 0 : info.usedPower) {
          usedPowerText.textContent = printPower(info.usedPower)
          usedPowerInput.value = printPower(info.usedPower)
        } else {
          usedPowerText.textContent = ''
          usedPowerInput.value = ''
        }
      replaceChildren(
        mwPrice,
        (info == null ? void 0 : info.powerPrice) ? printMoney(info == null ? void 0 : info.powerPrice) : '',
        showIncrease(info == null ? void 0 : info.mWPriceDelta)
      )
      replaceChildren(powerPrice, (info == null ? void 0 : info.usedPowerPrice) ? printMoney(info.usedPowerPrice) : '')
      replaceChildren(
        monthlyFee,
        (info == null ? void 0 : info.monthlyFee) ? printMoney(info.monthlyFee) : '',
        showIncrease(info == null ? void 0 : info.monthlyFeeDelta)
      )
      replaceChildren(total, (info == null ? void 0 : info.total) ? printMoney(info.total) : '')
    }
    return {
      billTDList: [usedPower, mwPrice, powerPrice, monthlyFee, total],
      setText,
      usedPowerText,
      usedPowerTextDiv,
      usedPowerInput,
    }
  }
  function priceChangeComparedToFirstYear(state) {
    const priceChangeComparedToFirstYear2 = div()
    state.onValueChange(({ totalsByYear, years }) => {
      const [firstYear] = years
      const firstData = totalsByYear[firstYear].calculatedTotals
      replaceChildren(
        priceChangeComparedToFirstYear2,
        table(
          uiStyles.numberTableRight,
          thead(
            tr(
              th('Vuosi'),
              th('Laskutuskuukausia'),
              th('Kulutus'),
              th('Toteutunut laskutus'),
              th(`Laskutus edellisen vuoden tasolla`, uiStyles.borderLeft),
              th('Korotus \u20AC'),
              th('Korotus %'),
              th('Ylilaskutus \u20AC'),
              th(`Laskutus vuoden ${years[0]} tasolla`, uiStyles.borderLeft),
              th('Korotus \u20AC'),
              th('Korotus %')
            ),
            years.map((y) => {
              const currentYear = totalsByYear[y]
              const usedPower = currentYear.usedPower
              const totalOnFirstYearLevel = usedPower
                .mul(firstData.avgPowerPrice)
                .add(firstData.avgMonthlyFee.mul(currentYear.monthCount))
              return tr(
                td(y),
                td(currentYear.monthCount),
                td(printPower(usedPower), ' MW'),
                td(printMoney(currentYear.billedTotals.total), ' \u20AC'),
                td(
                  currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.totalsBasedOnLastYearLevel.total),
                  ' \u20AC',
                  uiStyles.borderLeft
                ),
                td(
                  currentYear.totalsBasedOnLastYearLevel &&
                    printMoney(currentYear.billedTotals.total.minus(currentYear.totalsBasedOnLastYearLevel.total)),
                  ' \u20AC'
                ),
                td(
                  currentYear.totalsBasedOnLastYearLevel &&
                    printPower(
                      currentYear.billedTotals.total.div(currentYear.totalsBasedOnLastYearLevel.total).minus(1).mul(100)
                    )
                ),
                td(
                  currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.calculatedTotals.excessBilling),
                  ' \u20AC'
                ),
                td(printMoney(totalOnFirstYearLevel), ' \u20AC', uiStyles.borderLeft),
                td(printMoney(currentYear.billedTotals.total.minus(totalOnFirstYearLevel)), ' \u20AC'),
                td(printPower(currentYear.billedTotals.total.div(totalOnFirstYearLevel).minus(1).mul(100)))
              )
            })
          )
        )
      )
    })
    return priceChangeComparedToFirstYear2
  }
  function priceChangesByMonth(state) {
    const priceChangeTBody = tbody()
    state.onValueChange(({ years, monthBillInfos }) => {
      const allBills = years.flatMap((year) => months.map((month) => monthBillInfos[ymToIndex({ year, month })]))
      const billsWithChanges = allBills.filter((bill) => bill && (bill.monthlyFeeDelta != 0 || bill.mWPriceDelta != 0))
      const rows = billsWithChanges.map((bill) => {
        const prevBill = monthBillInfos[bill.index - 1]
        const yearMonth = indexToYm(bill.index)
        return tr(
          td(`${yearMonth.year}.${yearMonth.month}`),
          td(
            `${printMoney(prevBill.powerPrice)}\u20AC/MW -> ${printMoney(bill.powerPrice)}\u20AC/MW`,
            `, muutos ${printMoney(bill.powerPrice.div(prevBill.powerPrice).minus(1).mul(100))}%`
          ),
          td(
            `${printMoney(prevBill.monthlyFee)}\u20AC/kk -> ${printMoney(bill.monthlyFee)}\u20AC/kk`,
            `, muutos ${printMoney(bill.monthlyFee.div(prevBill.monthlyFee).minus(1).mul(100))}%`
          )
        )
      })
      replaceChildren(priceChangeTBody, rows)
    })
    return table(uiStyles.numberTableRight, priceChangeTBody)
  }
  function billSummary(years, calculatedValuesState, powerUsageState) {
    const usedPowerEditable = createState({ value: false })
    const billRows = months.map((month) =>
      tr(
        td(month),
        years.map((year) => {
          const index = ymToIndex({ year, month })
          const { billTDList, setText, usedPowerInput, usedPowerText, usedPowerTextDiv } = BillItemTDs(index)
          calculatedValuesState.onValueChange(({ monthBillInfos }) => {
            setText(monthBillInfos[index])
          })
          if (usedPowerInput) {
            usedPowerEditable.onValueChange((showInput) => {
              usedPowerInput.hidden = !showInput
              usedPowerTextDiv.hidden = showInput
            })
            setEvents(
              usedPowerInput,
              events({
                change({ node }) {
                  const value = node.value
                  const newUsedPower = ['0', ''].includes(value.trimEnd().trimStart()) ? void 0 : decimal_default(value)
                  usedPowerText.textContent = newUsedPower ? value : ''
                  powerUsageState.set((cur) => {
                    const numbers = { ...cur.numbers }
                    if (newUsedPower) {
                      numbers[index] = decimal_default(value)
                    } else {
                      delete numbers[index]
                    }
                    return {
                      ...cur,
                      numbers,
                    }
                  })
                },
              })
            )
          }
          return billTDList
        })
      )
    )
    const totalRow = tr(
      uiStyles.bold,
      td('Yhteens\xE4', uiStyles.bold),
      years.map((y) => {
        const { billTDList, setText } = BillItemTDs()
        calculatedValuesState.onValueChange(({ totalsByYear }) => {
          const {
            billedTotals: { monthlyFees, usedPowerPrice, total },
            usedPower,
          } = totalsByYear[y]
          setText({
            usedPower,
            usedPowerPrice,
            monthlyFee: monthlyFees,
            total,
          })
        })
        return billTDList
      })
    )
    const powerUsageHashInfo = text()
    const powerUsageAsLink = a('Kulutusarvot linkkin\xE4', uiStyles.noPrint)
    powerUsageState.onValueChange((powerUsage) => {
      const data2 = formatAsUnderscoreSeparated(powerUsage)
      const url = new URL(window.location.href)
      url.search = ''
      url.searchParams.set('p', data2)
      appendChildren(powerUsageAsLink, { href: url.toString() })
      shortHexHash(data2, 12).then((s2) => (powerUsageHashInfo.textContent = `Kulutusarvojen tarkisteluku: ${s2}`))
    })
    return div(
      table(
        uiStyles.numberTableRight,
        thead(
          tr(
            th({ rowSpan: 2 }),
            years.map((y) => th(y, { colSpan: 5 }, uiStyles.borderLeft))
          ),
          tr(
            years.map(() => [
              th('Kulutus', uiStyles.borderLeft),
              th('\u20AC/MWh'),
              th('Energia \u20AC'),
              th('$/kk'),
              th('Lasku \u20AC'),
            ])
          )
        ),
        tbody(billRows, totalRow)
      ),
      div(
        powerUsageHashInfo,
        powerUsageAsLink,
        button(
          'Muokkaa kulutusarvoja',
          { class: 'blueButton' },
          uiStyles.noPrint,
          events({
            click() {
              usedPowerEditable.set((cur) => !cur)
            },
          })
        ),
        button(
          'Tyhjenn\xE4',
          events({
            click() {
              powerUsageState.set((old) => {
                return { ...(old || {}), numbers: {} }
              })
              usedPowerEditable.set(true)
            },
          })
        ),
        button(
          'Tallenna',
          events({
            click() {
              const input2 = powerUsageState.get()
              if (input2) {
                localStorage.setItem('kaukolampo', formatAsUnderscoreSeparated(input2))
              }
            },
          })
        ),
        button(
          'Lataa',
          events({
            click() {
              const savedData = localStorage.getItem('kaukolampo')
              if (savedData) {
                powerUsageState.set(parseUnderscoreSeparatedYmNumbers(savedData))
              }
            },
          })
        )
      )
    )
  }
  function compareYearPriceIncrease(yearTotal, prevTotal, y, prevYear) {
    var _a2
    const calculatedTotals = yearTotal.calculatedTotals
    const { priceIncreaseTooMuch } = calculatedTotals
    const princeIncreaseInfo =
      priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel
        ? [
            li('Korotus ylitt\xE4\xE4 15% ja 150e. Kuluttajariitalautakunnan suosituksen mukainen korotus olisi 150e'),
            ul(
              li(
                formatter(
                  `150\u20AC korotus edellisen vuoden tasolla laskettuun summaan: %M + 150 = `,
                  yearTotal.totalsBasedOnLastYearLevel.total
                ),
                b(printMoney(calculatedTotals.total))
              ),
              li(
                formatter(`Liika laskutus: %M - %M  = `, yearTotal.billedTotals.total, calculatedTotals.total),
                b(printMoney(calculatedTotals.excessBilling))
              )
            ),
          ]
        : [li('Korotus ei ylit\xE4 150e ja 15%')]
    const prevAvgMwPrice = prevTotal == null ? void 0 : prevTotal.calculatedTotals.avgPowerPrice
    const explainAdjustment = () =>
      prevTotal && priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel && calculatedTotals.adjustmentMultiplier
        ? p(
            ul(
              li(
                'Liian laskutuksen takia seuraavan vuoden laskutuksessa k\xE4ytet\xE4\xE4n t\xE4m\xE4n vuoden tasona viimevuoden tasoa * korjauskerroin'
              ),
              calculatedTotals.adjustmentMultiplier &&
                li(
                  formatter(
                    `Korjauskerroin: %M / %M = %P`,
                    calculatedTotals.total,
                    yearTotal.totalsBasedOnLastYearLevel.total,
                    calculatedTotals.adjustmentMultiplier
                  )
                ),
              li(
                formatter(`Energian hinta: %M * %P} = `, prevAvgMwPrice, calculatedTotals.adjustmentMultiplier),
                b(printMoney(calculatedTotals.avgPowerPrice))
              ),
              li(
                formatter(
                  `Kuukausi: %M * %P = `,
                  prevTotal.calculatedTotals.avgMonthlyFee,
                  calculatedTotals.adjustmentMultiplier
                ),
                b(printMoney(calculatedTotals.avgMonthlyFee))
              )
            )
          )
        : p(
            ul(
              li('Taso saadaan laskemalla keskiarvot'),
              li(
                formatter(`Energian hinta: %M / %P = `, yearTotal.billedTotals.usedPowerPrice, yearTotal.usedPower),
                b(printMoney(yearTotal.calculatedTotals.avgPowerPrice))
              ),
              li(
                formatter(`Kuukausi: %M / %d = `, yearTotal.billedTotals.monthlyFees, yearTotal.monthCount),
                b(printMoney(yearTotal.calculatedTotals.avgMonthlyFee))
              )
            )
          )
    const prevAvgMonthlyFee = prevTotal == null ? void 0 : prevTotal.calculatedTotals.avgMonthlyFee
    const totalWithPrevYearLevel =
      ((_a2 = yearTotal.totalsBasedOnLastYearLevel) == null ? void 0 : _a2.total) || decimal_default(0)
    return div(
      h3(prevTotal ? `${y}, vertailu toteutuneella ja ${y - 1} tasolla` : `${y} tason laskeminen`),
      table(
        uiStyles.numberTableLeft,
        thead(
          tr(
            th(''),
            th('kulutus'),
            th('\u20AC/MWh'),
            th('$/kk'),
            th('Lasku vuositasolla'),
            priceIncreaseTooMuch && th(uiStyles.bold, 'Liika laskutus')
          )
        ),
        tbody(
          tr(
            td(`${y} toteunut lasku`),
            td(printPower(yearTotal.usedPower)),
            td(),
            td(),
            td(printMoney(yearTotal.billedTotals.total)),
            priceIncreaseTooMuch && td()
          ),
          prevTotal &&
            tr(
              td(
                `edellisen vuoden taso ja lasku vuoden ${y} kulutuksella`,
                ul(
                  li(
                    `Vuoden ${y} energiakulutus ${printPower(yearTotal.usedPower)} vuoden ${y - 1} kuukausimaksulla ja energian hinnalla: `,
                    br(),
                    formatter(
                      `%P * %M + %d * %M = `,
                      yearTotal.usedPower,
                      prevAvgMwPrice,
                      yearTotal.monthCount,
                      prevAvgMonthlyFee
                    ),
                    b(printMoney(totalWithPrevYearLevel))
                  )
                )
              ),
              td(printPower(yearTotal.usedPower)),
              td(printMoney(prevAvgMwPrice)),
              td(printMoney(prevAvgMonthlyFee)),
              td(printMoney(totalWithPrevYearLevel)),
              priceIncreaseTooMuch && td()
            ),
          prevTotal &&
            tr(
              td(
                `Korotuksen arvionti vuodelle ${y}`,
                ul(
                  li(
                    formatter(
                      `${y} yhteens\xE4 %M, ${prevYear} tasolla %M`,
                      yearTotal.billedTotals.total,
                      totalWithPrevYearLevel
                    )
                  ),
                  li(
                    formatter(
                      `Korotus %M euroa %P prosenttia`,
                      calculatedTotals.priceIncreaseEuros || decimal_default(0),
                      calculatedTotals.priceIncreasePercents || decimal_default(0)
                    )
                  ),
                  princeIncreaseInfo
                )
              ),
              td(),
              td(),
              td(),
              td(priceIncreaseTooMuch && printMoney(calculatedTotals.total)),
              priceIncreaseTooMuch && td(uiStyles.bold, printMoney(calculatedTotals.excessBilling))
            ),
          tr(
            td(
              `t\xE4m\xE4n vuoden (${y}) tason laskeminen seuraavan vuoden (${y + 1}) korotuksen arviointia varten`,
              explainAdjustment()
            ),
            td(),
            td(printMoney(calculatedTotals.avgPowerPrice)),
            td(printMoney(calculatedTotals.avgMonthlyFee)),
            td(),
            priceIncreaseTooMuch && td()
          )
        )
      )
    )
  }
  function excessBillingPaybackInterestTable(paybackInterestYears) {
    return paybackInterestYears.map((info) =>
      div(
        h3(info.year),
        table(
          uiStyles.numberTableRight,
          thead(
            tr(
              th('Pohjatiedot', { colSpan: 3 }),
              th('Ylilaskutus jos verrataan +150 tasoon vuoden yli', { colSpan: 3 }, uiStyles.borderLeft),
              th('Ylilaskutus jos 150\u20AC annetaan kerty\xE4 vuoden alussa', { colSpan: 3 }, uiStyles.borderLeft)
            ),
            tr(
              th('vuosi.kk'),
              th('Kulutus'),
              th('Alkuper\xE4inen lasku'),
              // keskiarvoon verrattu
              th('Korjattu lasku', uiStyles.borderLeft),
              th('Ylilaskutus'),
              th('Viiv\xE4styskorko'),
              // viime vuoden taso ja 150e puskuri
              th('Lasku aiemman vuoden tasolla', uiStyles.borderLeft),
              th('Korjattu lasku'),
              th('150 eurosta j\xE4ljell\xE4'),
              th('Ylilaskutus'),
              th('Viiv\xE4styskorko')
            )
          ),
          tbody(
            info.months.map((m) => {
              return tr(
                td(m.month),
                td(printPower(m.originalBill.usedPower)),
                td(printMoney(m.originalBill.total)),
                // keskiarvoon verrattu
                td(printMoney(m.excessFromAveragePrices.total), uiStyles.borderLeft),
                td(printMoney(m.excessFromAveragePrices.excess)),
                td(printMoney(m.excessFromAveragePrices.interest)),
                // viime vuoden taso ja 150e puskuri
                td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.totalWithLastYearLevel), uiStyles.borderLeft),
                td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.total)),
                td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.leftFrom150)),
                td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.excess)),
                td(printMoney(m.excessComparingToPreviousYearAnd150Buffer.interest))
              )
            })
          ),
          tr(
            uiStyles.bold,
            td('Yhteens\xE4'),
            td(),
            td(),
            td(printMoney(info.fromAveragePricesTotals.total), uiStyles.borderLeft),
            td(printMoney(info.fromAveragePricesTotals.excess)),
            td(printMoney(info.fromAveragePricesTotals.interest)),
            td(uiStyles.borderLeft),
            td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.total)),
            td(),
            td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.excess)),
            td(printMoney(info.comparingToPreviousYearAnd150BufferTotals.interest))
          )
        )
      )
    )
  }
  var usage =
    '2022-4_1.945_1.33_0.941_0.897_0.876_1.336_1.758_3.038_3.922_3.597_2.869_2.766_1.683_1.21_1.11_0.973_0.904_0.876_2.278_3.017_3.717_4.456_3.313_2.798_2.096_0.926_0.701_0.73_0.683_0.66_1.721_2.438_3.238_3.357_3.177_2.656_1.558_1.196_0.851_0.789_0.778_0.841_2.2_2.485_2.899'
  function getPUrlParameter() {
    const url = new URL(window.location.href)
    return url.searchParams.get('p')
  }
  function summaryList(excessYears, totalsByYear, paybackInterestYears) {
    const paybackInterestTotal = paybackInterestYears.reduce(
      (acc, y) => acc.add(y.fromAveragePricesTotals.interest),
      decimal_default(0)
    )
    return ul(
      excessYears.map((y) => li(`${y}: ${printMoney(totalsByYear[y].calculatedTotals.excessBilling)}\u20AC`)),
      li(`Viiv\xE4styskorko: ${printMoney(paybackInterestTotal)}\u20AC`),
      li(
        `Yhteens\xE4: ${printMoney(excessYears.reduce((acc, y) => acc.add(totalsByYear[y].calculatedTotals.excessBilling), paybackInterestTotal))}\u20AC`
      )
    )
  }
  function priceIncreaseByYear(state) {
    const priceIncreases = div()
    state.onValueChange(({ totalsByYear, years }) => {
      replaceChildren(
        priceIncreases,
        years.map((y) => {
          const yearTotal = totalsByYear[y]
          const prevYear = y - 1
          const prevTotal = totalsByYear[prevYear]
          return compareYearPriceIncrease(yearTotal, prevTotal, y, prevYear)
        })
      )
    })
    return priceIncreases
  }
  function summaryOfExcessBillingAndInterest(calculatedValuesState) {
    const summary2 = div()
    calculatedValuesState.onValueChange(({ excessYears, totalsByYear, paybackInterestYears }) => {
      replaceChildren(summary2, summaryList(excessYears, totalsByYear, paybackInterestYears))
    })
    return summary2
  }
  function analysisOfPaybackInterest(calculatedValuesState) {
    const paybackInterest = div()
    calculatedValuesState.onValueChange(({ excessYears, paybackInterestYears }) => {
      replaceChildren(
        paybackInterest,
        excessYears.length > 0 &&
          div(
            p(
              'Viiv\xE4styskorko laskettuna korjattujen kuukausien laskujen maksup\xE4iv\xE4st\xE4. Korjattuina kuukausina rahaa on ker\xE4tty perusteettomasti'
            ),
            excessBillingPaybackInterestTable(paybackInterestYears)
          )
      )
    })
    return paybackInterest
  }
  function kaukolampoExcessPricingCalculator() {
    const contract = tuusulanjarvenLampo
    const from = { year: 2022, month: 1 }
    const to = { year: 2025, month: 12 }
    const years = range(from.year, to.year)
    const address2 = 'Rykmentintie 12 A'
    const monthlyPricing = resolveMonthlyPricingLookup(contract, from, to)
    const pFromBrowserUrl = getPUrlParameter()
    const powerUsage = parseUnderscoreSeparatedYmNumbers(pFromBrowserUrl || usage)
    const powerUsageState = createState({ value: powerUsage })
    const calculatedValuesState = powerUsageState.map((powerUsage2) =>
      calculateValues(years, monthlyPricing, powerUsage2.numbers)
    )
    return div(
      div(
        h2('Liiallinen laskutus ja viiv\xE4styskorko'),
        summaryOfExcessBillingAndInterest(calculatedValuesState),
        h2(`${address2} laskut ${years[0]}-${years[years.length - 1]}`),
        billSummary(years, calculatedValuesState, powerUsageState),
        h3('Hinnanmuutokset edelliseen kuukauteen verrattuna'),
        priceChangesByMonth(calculatedValuesState),
        h3(`Hinnanmuutokset vuositasolla`),
        priceChangeComparedToFirstYear(calculatedValuesState),
        uiStyles.pageBreakAfter
      ),
      div(h2('Korotusten arviointi vuositasolla'), priceIncreaseByYear(calculatedValuesState), uiStyles.pageBreakAfter),
      div(h2('Kuukausikohtaisen viiv\xE4styskoron laskeminen'), analysisOfPaybackInterest(calculatedValuesState))
    )
  }

  // src/osakkeet/osakkeetUtils.ts
  function parseSupportedDate(trimmed) {
    const finnishDateMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed)
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
    if (finnishDateMatch) {
      const [, day, month, year] = finnishDateMatch
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    }
    if (isoDateMatch) {
      return /* @__PURE__ */ new Date(`${trimmed}T00:00:00Z`)
    }
    return void 0
  }
  function parseSupportedTimestampOrDate(trimmed) {
    const parsedDate = parseSupportedDate(trimmed)
    if (parsedDate) return parsedDate
    const isoTimestampMatch = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(trimmed)
    if (!isoTimestampMatch) return void 0
    const parsedTimestamp = new Date(trimmed)
    return Number.isNaN(parsedTimestamp.getTime()) ? void 0 : parsedTimestamp
  }
  function compareDateStrings(a2, b2) {
    const dateA = parseSupportedTimestampOrDate(a2.trim())
    const dateB = parseSupportedTimestampOrDate(b2.trim())
    if (dateA && dateB) {
      return dateA.getTime() - dateB.getTime()
    }
    if (dateA) return -1
    if (dateB) return 1
    return a2.localeCompare(b2)
  }
  function sortRowsByDate(rows) {
    return [...rows].sort((a2, b2) => compareDateStrings(a2.date, b2.date))
  }
  function sumDecimals(values) {
    return values.reduce((acc, value) => acc.add(value), new decimal_default(0))
  }
  function addYears(date, years) {
    const next = new Date(date.getTime())
    next.setUTCFullYear(next.getUTCFullYear() + years)
    return next
  }
  function isWithinYearsInclusive(start, end, years = 10) {
    if (!start || !end) return false
    return end.getTime() <= addYears(start, years).getTime()
  }
  function isAtLeastYears(start, end, years = 10) {
    if (!start || !end) return false
    return end.getTime() >= addYears(start, years).getTime()
  }

  // src/osakkeet/osakkeetSellCalculator.ts
  var zero = new decimal_default(0)
  function createEmptySellSummary(params) {
    const { amount: amount2, otherAnnualCapitalGainsOrLosses, remainingUnsoldShares } = params
    return {
      amount: amount2,
      otherAnnualCapitalGainsOrLosses,
      usedLots: [],
      grossTotal: zero,
      cashAfterSellCosts: zero,
      taxFreeAcquisitionRecoveryAfterSellCosts: zero,
      soldShareOriginalCostTotal: zero,
      soldShareAcquisitionCostTotal: zero,
      selectedActualDeductionTotal: zero,
      selectedHmo20DeductionTotal: zero,
      selectedHmo40DeductionTotal: zero,
      selectedHmoDeductionTotal: zero,
      selectedDeductionTotal: zero,
      totalAllocatedSellCost: zero,
      sellCostDeductedViaActual: zero,
      sellCostPaidWithoutActualDeduction: zero,
      taxSavedFromDeductibleSellCosts: zero,
      taxableGainTotal: zero,
      taxableGainAtLowRate: zero,
      taxableGainAtHighRate: zero,
      estimatedTax: zero,
      annualNetCapitalGain: zero,
      annualTaxableGainAtLowRate: zero,
      annualTaxableGainAtHighRate: zero,
      annualEstimatedTax: zero,
      annualTaxChange: zero,
      taxReductionFromOtherLosses: zero,
      netAfterTaxAndSellCost: zero,
      netAfterAnnualTaxAndSellCost: zero,
      netResultAgainstAcquisitionCost: zero,
      remainingUnsoldShares,
    }
  }
  function estimateCapitalTax(taxableGain, rules) {
    if (taxableGain.lte(0)) return zero
    const threshold = new decimal_default(rules.capitalIncomeTax.threshold)
    const lowPart = decimal_default.min(taxableGain, threshold)
    const highPart = decimal_default.max(taxableGain.minus(threshold), zero)
    return lowPart.mul(rules.capitalIncomeTax.lowRate).add(highPart.mul(rules.capitalIncomeTax.highRate))
  }
  function calculateSellSummary(params) {
    const {
      sellableLots,
      totalTrackedShares,
      sellShareCalculator,
      sellId,
      sellAmount,
      otherAnnualCapitalGainsOrLosses,
      sellDate,
      sellPricePerShare,
      sellCostPerShare,
      sellRules,
    } = params
    const usedLots = sellableLots.flatMap((lot) => {
      const sellAllocations = (sellShareCalculator.sellsForThisSubscriptionLotsBySubscriptionId[lot.id] || []).filter(
        (allocation) => allocation.sellId === sellId
      )
      return sellAllocations.map((allocation) => {
        const soldAmount = allocation.soldShareCount
        const gross = soldAmount.mul(sellPricePerShare)
        const originalCostBasis = allocation.soldBaseShareAcquisitionCost
        const realCostBasis = allocation.soldShareAcquisitionCost
        const allocatedSellCost = soldAmount.mul(sellCostPerShare)
        const actualDeduction = realCostBasis.add(allocatedSellCost)
        const hankintamenoOlettaRate = isAtLeastYears(
          lot.dateValue,
          sellDate,
          sellRules.hankintamenoOlettama.ownershipYearsThreshold
        )
          ? new decimal_default(sellRules.hankintamenoOlettama.longOwnershipRate)
          : new decimal_default(sellRules.hankintamenoOlettama.shortOwnershipRate)
        const hankintamenoOlettaDeduction = gross.mul(hankintamenoOlettaRate)
        const useActualCosts = actualDeduction.gte(hankintamenoOlettaDeduction)
        const selectedDeduction = useActualCosts ? actualDeduction : hankintamenoOlettaDeduction
        const taxableGain = gross.minus(selectedDeduction)
        return {
          lotId: lot.id,
          lotDate: lot.date,
          totalLotShares: lot.shareCount,
          soldAmount,
          gross,
          originalCostBasis,
          realCostBasis,
          allocatedSellCost,
          actualDeduction,
          hankintamenoOlettaRate,
          hankintamenoOlettaDeduction,
          selectedMethod: useActualCosts ? 'actual_costs' : 'hmo',
          selectedDeduction,
          taxableGain,
          taxFreeGainPart: zero,
          taxedGainPart: decimal_default.max(taxableGain, zero),
        }
      })
    })
    const taxableGainTotal = sumDecimals(usedLots.map((lot) => lot.taxableGain))
    const capitalIncomeThreshold = new decimal_default(sellRules.capitalIncomeTax.threshold)
    const taxableGainAtLowRate = decimal_default.max(
      decimal_default.min(taxableGainTotal, capitalIncomeThreshold),
      zero
    )
    const taxableGainAtHighRate = decimal_default.max(taxableGainTotal.minus(capitalIncomeThreshold), zero)
    const estimatedTax = estimateCapitalTax(taxableGainTotal, sellRules)
    const annualNetCapitalGain = decimal_default.max(taxableGainTotal.add(otherAnnualCapitalGainsOrLosses), zero)
    const annualEstimatedTax = estimateCapitalTax(annualNetCapitalGain, sellRules)
    const annualTaxableGainAtLowRate = decimal_default.max(
      decimal_default.min(annualNetCapitalGain, capitalIncomeThreshold),
      zero
    )
    const annualTaxableGainAtHighRate = decimal_default.max(annualNetCapitalGain.minus(capitalIncomeThreshold), zero)
    const annualTaxChange = annualEstimatedTax.minus(estimatedTax)
    const taxReductionFromOtherLosses = decimal_default.max(estimatedTax.minus(annualEstimatedTax), zero)
    const grossTotal = sumDecimals(usedLots.map((lot) => lot.gross))
    const selectedActualDeductionTotal = sumDecimals(
      usedLots.filter((lot) => lot.selectedMethod === 'actual_costs').map((lot) => lot.actualDeduction)
    )
    const shortOwnershipRate = new decimal_default(sellRules.hankintamenoOlettama.shortOwnershipRate)
    const longOwnershipRate = new decimal_default(sellRules.hankintamenoOlettama.longOwnershipRate)
    const selectedHmo20DeductionTotal = sumDecimals(
      usedLots
        .filter((lot) => lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(shortOwnershipRate))
        .map((lot) => lot.hankintamenoOlettaDeduction)
    )
    const selectedHmo40DeductionTotal = sumDecimals(
      usedLots
        .filter((lot) => lot.selectedMethod === 'hmo' && lot.hankintamenoOlettaRate.eq(longOwnershipRate))
        .map((lot) => lot.hankintamenoOlettaDeduction)
    )
    const selectedHmoDeductionTotal = selectedHmo20DeductionTotal.add(selectedHmo40DeductionTotal)
    const selectedDeductionTotal = sumDecimals(usedLots.map((lot) => lot.selectedDeduction))
    const soldSharesTotal = sumDecimals(usedLots.map((lot) => lot.soldAmount))
    const totalAllocatedSellCost = sumDecimals(usedLots.map((lot) => lot.allocatedSellCost))
    const cashAfterSellCosts = grossTotal.minus(totalAllocatedSellCost)
    const taxFreeAcquisitionRecoveryAfterSellCosts = decimal_default.max(
      selectedDeductionTotal.minus(totalAllocatedSellCost),
      zero
    )
    const soldShareOriginalCostTotal = sumDecimals(usedLots.map((lot) => lot.originalCostBasis))
    const soldShareAcquisitionCostTotal = sumDecimals(usedLots.map((lot) => lot.realCostBasis))
    const sellCostDeductedViaActual = sumDecimals(
      usedLots.filter((lot) => lot.selectedMethod === 'actual_costs').map((lot) => lot.allocatedSellCost)
    )
    const sellCostPaidWithoutActualDeduction = sumDecimals(
      usedLots.filter((lot) => lot.selectedMethod === 'hmo').map((lot) => lot.allocatedSellCost)
    )
    const taxSavedFromDeductibleSellCosts = estimateCapitalTax(
      taxableGainTotal.add(sellCostDeductedViaActual),
      sellRules
    ).minus(estimatedTax)
    const netAfterTaxAndSellCost = grossTotal.minus(totalAllocatedSellCost).minus(estimatedTax)
    const netAfterAnnualTaxAndSellCost = grossTotal.minus(totalAllocatedSellCost).minus(annualEstimatedTax)
    const netResultAgainstAcquisitionCost = netAfterTaxAndSellCost.minus(soldShareAcquisitionCostTotal)
    return {
      amount: sellAmount,
      otherAnnualCapitalGainsOrLosses,
      usedLots,
      grossTotal,
      cashAfterSellCosts,
      taxFreeAcquisitionRecoveryAfterSellCosts,
      soldShareOriginalCostTotal,
      soldShareAcquisitionCostTotal,
      selectedActualDeductionTotal,
      selectedHmo20DeductionTotal,
      selectedHmo40DeductionTotal,
      selectedHmoDeductionTotal,
      selectedDeductionTotal,
      totalAllocatedSellCost,
      sellCostDeductedViaActual,
      sellCostPaidWithoutActualDeduction,
      taxSavedFromDeductibleSellCosts,
      taxableGainTotal,
      taxableGainAtLowRate,
      taxableGainAtHighRate,
      estimatedTax,
      annualNetCapitalGain,
      annualTaxableGainAtLowRate,
      annualTaxableGainAtHighRate,
      annualEstimatedTax,
      annualTaxChange,
      taxReductionFromOtherLosses,
      netAfterTaxAndSellCost,
      netAfterAnnualTaxAndSellCost,
      netResultAgainstAcquisitionCost,
      remainingUnsoldShares: decimal_default.max(totalTrackedShares.minus(soldSharesTotal), zero),
    }
  }

  // src/osakkeet/osakkeetIpoCalculator.ts
  var zero2 = new decimal_default(0)
  function buildIpoSummaryFromInputs(
    ipoInput,
    ipoSellInput,
    ipoDate,
    totalSubscribedShares,
    totalSubscribedCost,
    warnings,
    localization
  ) {
    const totalShareCountInput = ipoInput.totalShareCountInput
    const totalShareCount = totalShareCountInput.gt(0) ? totalShareCountInput : totalSubscribedShares
    const totalIpoCost = ipoInput.totalIpoCost
    const currentShareValue = ipoInput.currentShareValue
    const currentTotalValue = currentShareValue.mul(totalShareCount)
    const estimatedPreIpoValue = ipoInput.estimatedPreIpoValue
    const estimatedSecondaryShareSellPercentage = ipoInput.estimatedSecondaryShareSellPercentage
    const ipoSellAmount = ipoSellInput.amount
    const otherAnnualCapitalGainsOrLosses = ipoSellInput.otherAnnualCapitalGainsOrLosses
    if (totalShareCountInput.gt(0) && totalShareCountInput.lt(totalSubscribedShares)) {
      warnings.push(localization.calculator.warnings.totalShareCountBelowSubscriptions)
    }
    const estimatedSecondaryShareCount = totalShareCount.mul(estimatedSecondaryShareSellPercentage).div(100)
    const ipoPricePerShare = totalShareCount.gt(0) ? estimatedPreIpoValue.div(totalShareCount) : zero2
    const currentValuePerShare = totalShareCount.gt(0) ? currentTotalValue.div(totalShareCount) : zero2
    const increaseMultiplier = currentValuePerShare.gt(0) ? ipoPricePerShare.div(currentValuePerShare) : zero2
    const increasePercentage = currentValuePerShare.gt(0)
      ? ipoPricePerShare.div(currentValuePerShare).minus(1).mul(100)
      : zero2
    const ipoCostPerShare = estimatedSecondaryShareCount.gt(0)
      ? totalIpoCost.div(estimatedSecondaryShareCount)
      : totalShareCount.gt(0)
        ? totalIpoCost.div(totalShareCount)
        : zero2
    if (estimatedSecondaryShareCount.eq(0) && totalIpoCost.gt(0)) {
      warnings.push(localization.calculator.warnings.secondarySellPercentZero)
    }
    return {
      ipoDate,
      ipoSellAmount,
      otherAnnualCapitalGainsOrLosses,
      ipo: {
        ipoDate,
        totalShareCount,
        totalSubscribedShares,
        totalSubscribedCost,
        totalIpoCost,
        currentShareValue,
        currentTotalValue,
        estimatedPreIpoValue,
        estimatedSecondaryShareSellPercentage,
        estimatedSecondaryShareCount,
        ipoPricePerShare,
        currentValuePerShare,
        increasePercentage,
        increaseMultiplier,
        ipoCostPerShare,
      },
    }
  }
  function calculateVestingSummary(lots, ipoDate) {
    const ipoEligibleLots = lots.filter(
      (lot) => !lot.dateValue || !ipoDate || lot.dateValue.getTime() <= ipoDate.getTime()
    )
    const sellableLots = ipoEligibleLots.filter(
      (lot) =>
        lot.shareCount.gt(0) &&
        (!lot.vestingEndsOnValue || !!(ipoDate && ipoDate.getTime() >= lot.vestingEndsOnValue.getTime()))
    )
    const lockedLots = ipoEligibleLots.filter(
      (lot) =>
        lot.shareCount.gt(0) &&
        !!lot.vestingEndsOnValue &&
        (!ipoDate || ipoDate.getTime() < lot.vestingEndsOnValue.getTime())
    )
    return {
      sellableLots,
      lockedLots,
      totalShares: sumDecimals(ipoEligibleLots.map((lot) => lot.shareCount)),
      vestedShares: sumDecimals(sellableLots.map((lot) => lot.shareCount)),
      unvestedShares: sumDecimals(lockedLots.map((lot) => lot.shareCount)),
    }
  }
  function calculateIpoSellSummary(
    sellableLots,
    sellShareCalculator,
    ipoSellAmount,
    ipoSellPricePerShare,
    ipoSellCostPerShare,
    otherAnnualCapitalGainsOrLosses,
    vestingSummary,
    ipoSummary,
    sellRules,
    errors,
    warnings,
    localization
  ) {
    if (ipoSellAmount.gt(0) && !ipoSummary.ipoDate && vestingSummary.lockedLots.length > 0) {
      warnings.push(localization.calculator.warnings.vestingBlockedWithoutIpoDate)
    }
    if (ipoSellAmount.gt(vestingSummary.vestedShares)) {
      errors.push(localization.calculator.errors.ipoSellAmountExceedsSellable(vestingSummary.vestedShares.toString()))
    }
    if (ipoSummary.estimatedSecondaryShareCount.gt(0) && ipoSellAmount.gt(ipoSummary.estimatedSecondaryShareCount)) {
      warnings.push(localization.calculator.warnings.ipoSellAmountExceedsEstimatedSecondary)
    }
    if (ipoSellAmount.gt(0) && ipoSellPricePerShare.lte(0)) {
      errors.push(localization.calculator.errors.ipoSellPricePerShareRequired)
      return createEmptySellSummary({
        amount: ipoSellAmount,
        otherAnnualCapitalGainsOrLosses,
        remainingUnsoldShares: ipoSummary.totalSubscribedShares,
      })
    }
    return calculateSellSummary({
      sellableLots,
      totalTrackedShares: ipoSummary.totalSubscribedShares,
      sellShareCalculator,
      sellId: 'ipo-sell',
      sellAmount: ipoSellAmount,
      otherAnnualCapitalGainsOrLosses,
      sellDate: ipoSummary.ipoDate,
      sellPricePerShare: ipoSellPricePerShare,
      sellCostPerShare: ipoSellCostPerShare,
      sellRules,
    })
  }

  // src/osakkeet/osakkeetParsedData.ts
  var zero3 = new decimal_default(0)
  function toDayKey(date) {
    return date.toISOString().slice(0, 10)
  }
  function parseEventTimestamp(date) {
    const parsed = parseSupportedTimestampOrDate(date.trim())
    if (!parsed || Number.isNaN(parsed.getTime())) return void 0
    const trimmed = date.trim()
    const isDateOnly = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(trimmed) || /^(\d{4})-(\d{2})-(\d{2})$/.test(trimmed)
    const isMidnightUtc =
      parsed.getUTCHours() === 0 &&
      parsed.getUTCMinutes() === 0 &&
      parsed.getUTCSeconds() === 0 &&
      parsed.getUTCMilliseconds() === 0
    return {
      date: trimmed,
      timestampMs: parsed.getTime(),
      calendarDayKey: toDayKey(parsed),
      dayKey: isDateOnly || isMidnightUtc ? toDayKey(parsed) : void 0,
    }
  }
  function hasParsedTimestamp(event) {
    return !!event.parsedTimestamp
  }
  function parseDecimalInput(value, field, errors, validation, options = {}) {
    const normalized = value.trim()
    if (normalized === '') return zero3
    try {
      const parsed = new decimal_default(normalized)
      if (!options.allowNegative && parsed.isNegative()) {
        errors.push(validation.negative(field))
      }
      if (options.validate && !options.validate(parsed)) {
        errors.push(validation.invalidNumber(field))
      }
      return parsed
    } catch {
      errors.push(validation.invalidNumber(field))
      return zero3
    }
  }
  function parseOptionalDateInput(value, field, errors, validation) {
    const trimmed = value.trim()
    if (!trimmed) return void 0
    const date = parseSupportedDate(trimmed)
    if (!date || Number.isNaN(date.getTime())) {
      errors.push(validation.invalidDate(field))
      return void 0
    }
    return date
  }
  function parseSubscriptionAcquisitionCost(input2, errors, validation, fieldLabels) {
    const shareCount = parseDecimalInput(input2.amount, fieldLabels.amount, errors, validation, {
      validate: (value) => value.gt(0),
    })
    const pricePerShare = parseDecimalInput(input2.pricePerShare || '', fieldLabels.pricePerShare, errors, validation)
    const otherTotalAcquisitionCosts = parseDecimalInput(
      input2.otherTotalAcquisitionCosts || '',
      fieldLabels.otherTotalAcquisitionCosts,
      errors,
      validation
    )
    const fallbackTotalPrice = parseDecimalInput(input2.totalPrice || '', fieldLabels.totalPrice, errors, validation)
    const totalPrice = shareCount.mul(pricePerShare).add(otherTotalAcquisitionCosts)
    const effectiveTotalPrice =
      totalPrice.gt(0) || input2.pricePerShare || input2.otherTotalAcquisitionCosts ? totalPrice : fallbackTotalPrice
    return {
      shareCount,
      shareAcquisitionCost: effectiveTotalPrice,
      originalSharePrice: pricePerShare,
      originalOtherTotalAcquisitionCosts: otherTotalAcquisitionCosts,
    }
  }
  function parseOsakkeetCalculatorInputs(form2, localization) {
    const errors = []
    const validation = localization.calculator.validation
    const sellFieldLabel = (id, field) => `Osakkeiden myynti ${id} ${field}`
    const company = {
      listingStatus: form2.company.listingStatus === 'listed' ? 'listed' : 'unlisted',
      becameListedDateText: form2.company.becameListedDate,
      becameListedDate: parseOptionalDateInput(
        form2.company.becameListedDate,
        localization.calculator.fields.becameListedDate,
        errors,
        validation
      ),
    }
    const subscriptions = form2.subscriptions.map((input2) => {
      const fieldLabel = input2.date || input2.id
      return {
        kind: 'subscription',
        id: input2.id,
        date: input2.date,
        parsedTimestamp: parseEventTimestamp(input2.date),
        dateValue: parseOptionalDateInput(
          input2.date,
          localization.calculator.fields.subscriptionDate(input2.id),
          errors,
          validation
        ),
        vestingEndsOn: input2.vestingEndsOn || '',
        vestingEndsOnValue: parseOptionalDateInput(
          input2.vestingEndsOn || '',
          localization.calculator.fields.subscriptionVestingEndsOn(input2.id),
          errors,
          validation
        ),
        ...parseSubscriptionAcquisitionCost(input2, errors, validation, {
          amount: localization.calculator.fields.subscriptionAmount(fieldLabel),
          pricePerShare: localization.calculator.fields.subscriptionPricePerShare(fieldLabel),
          otherTotalAcquisitionCosts: localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(fieldLabel),
          totalPrice: localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(fieldLabel),
        }),
      }
    })
    const sells = form2.sells.map((input2) => {
      const parsedTimestamp = parseEventTimestamp(input2.date)
      const shareCount = parseDecimalInput(
        input2.shareCount,
        sellFieldLabel(input2.id, 'm\xE4\xE4r\xE4'),
        errors,
        validation,
        {
          validate: (value) => value.gt(0),
        }
      )
      const pricePerShareInput = parseDecimalInput(
        input2.pricePerShare || '',
        sellFieldLabel(input2.id, 'hinta/osake'),
        input2.pricePerShare ? errors : [],
        validation,
        { validate: (value) => value.gt(0) }
      )
      const sellPriceInput = parseDecimalInput(
        input2.sellPrice || '',
        sellFieldLabel(input2.id, 'myyntihinta'),
        input2.sellPrice ? errors : [],
        validation,
        { validate: (value) => value.gt(0) }
      )
      const hasSellPrice = (input2.sellPrice || '').trim() !== ''
      const hasPricePerShare = (input2.pricePerShare || '').trim() !== ''
      if (!parsedTimestamp) {
        errors.push(validation.invalidDate(sellFieldLabel(input2.id, 'p\xE4iv\xE4')))
      }
      if (!hasSellPrice && !hasPricePerShare) {
        errors.push(validation.invalidNumber(sellFieldLabel(input2.id, 'hinta/osake tai myyntihinta')))
      }
      const sellPrice = hasSellPrice ? sellPriceInput : hasPricePerShare ? shareCount.mul(pricePerShareInput) : zero3
      const pricePerShare = shareCount.gt(0) ? sellPrice.div(shareCount) : pricePerShareInput
      const otherTotalSellCosts = parseDecimalInput(
        input2.otherTotalSellCosts || '',
        sellFieldLabel(input2.id, 'muut kulut'),
        input2.otherTotalSellCosts ? errors : [],
        validation,
        { validate: (value) => value.gte(0) }
      )
      return {
        kind: 'sell',
        id: input2.id,
        date: input2.date,
        parsedTimestamp,
        shareCount,
        sellPrice,
        pricePerShare,
        otherTotalSellCosts,
      }
    })
    const shareSplits = form2.shareSplits.map((input2) => {
      const parsedTimestamp = parseEventTimestamp(input2.date)
      if (!parsedTimestamp) {
        errors.push(validation.invalidDate(localization.calculator.fields.shareSplitDate(input2.id)))
      }
      return {
        kind: 'shareCountChange',
        id: input2.id,
        date: input2.date,
        parsedTimestamp,
        shareCountMultiplier: parseDecimalInput(
          input2.multiplier,
          localization.calculator.fields.shareSplitMultiplier(input2.id),
          errors,
          validation,
          { validate: (value) => value.gt(0) }
        ),
      }
    })
    const demergers = form2.demergers.map((input2) => {
      const parsedTimestamp = parseEventTimestamp(input2.date)
      if (!parsedTimestamp) {
        errors.push(validation.invalidDate(localization.calculator.fields.demergerDate(input2.id)))
      }
      return {
        kind: 'acquisitionCostChange',
        id: input2.id,
        date: input2.date,
        parsedTimestamp,
        shareAcquisitionCostMultiplier: parseDecimalInput(
          input2.oldCompanyRatio,
          localization.calculator.fields.demergerOldCompanyRatio(input2.id),
          errors,
          validation,
          { validate: (value) => value.gt(0) && value.lte(1) }
        ),
      }
    })
    const cashDistributions = form2.cashDistributions.map((row) => ({
      kind: 'capitalRepaymentOrDividend',
      id: row.id,
      date: row.date,
      parsedTimestamp: parseEventTimestamp(row.date),
      dateValue: parseOptionalDateInput(
        row.date,
        localization.calculator.fields.cashDistributionDate(row.id),
        errors,
        validation
      ),
      type: row.type,
      amountPerShare: parseDecimalInput(
        row.amountPerShare,
        localization.calculator.fields.cashDistributionAmountPerShare(row.id),
        errors,
        validation
      ),
    }))
    const mathematicalShareValuesByYear = /* @__PURE__ */ new Map()
    form2.mathematicalShareValues.forEach((row) => {
      const year = parseDecimalInput(
        row.year,
        localization.calculator.fields.mathematicalShareValueYear(row.id),
        errors,
        validation
      )
      const valuePerShare = parseDecimalInput(
        row.valuePerShare,
        localization.calculator.fields.mathematicalShareValuePerShare(row.id),
        errors,
        validation
      )
      if (year.gt(0)) mathematicalShareValuesByYear.set(year.toNumber(), valuePerShare)
    })
    const parsed = {
      company,
      subscriptions,
      sells,
      shareSplits,
      demergers,
      cashDistributions,
      mathematicalShareValuesByYear,
    }
    return { parsed, errors }
  }
  function parseOsakkeetIpoCalculatorInputs(form2, localization) {
    const errors = []
    const validation = localization.calculator.validation
    return {
      parsed: {
        ipo: {
          totalShareCountInput: parseDecimalInput(
            form2.ipo.totalShareCount,
            localization.calculator.fields.totalShareCount,
            errors,
            validation
          ),
          totalIpoCost: parseDecimalInput(
            form2.ipo.totalIpoCost,
            localization.calculator.fields.totalIpoCost,
            errors,
            validation
          ),
          currentShareValue: parseDecimalInput(
            form2.ipo.currentShareValue,
            localization.calculator.fields.currentShareValue,
            errors,
            validation
          ),
          estimatedPreIpoValue: parseDecimalInput(
            form2.ipo.estimatedPreIpoValue,
            localization.calculator.fields.estimatedPreIpoValue,
            errors,
            validation
          ),
          estimatedSecondaryShareSellPercentage: parseDecimalInput(
            form2.ipo.estimatedSecondaryShareSellPercentage,
            localization.calculator.fields.estimatedSecondaryShareSellPercentage,
            errors,
            validation
          ),
        },
        ipoSell: {
          amount: parseDecimalInput(
            form2.ipoSell.amount,
            localization.calculator.fields.ipoSellAmount,
            errors,
            validation
          ),
          pricePerShare: parseDecimalInput(
            form2.ipoSell.pricePerShare || '',
            localization.calculator.fields.ipoSellPricePerShare,
            form2.ipoSell.pricePerShare ? errors : [],
            validation
          ),
          costPerShare: parseDecimalInput(
            form2.ipoSell.costPerShare || '',
            localization.calculator.fields.ipoSellCostPerShare,
            form2.ipoSell.costPerShare ? errors : [],
            validation
          ),
          otherAnnualCapitalGainsOrLosses: parseDecimalInput(
            form2.ipoSell.otherAnnualCapitalGainsOrLosses || '',
            localization.calculator.fields.otherAnnualCapitalGainsOrLosses,
            errors,
            validation,
            { allowNegative: true }
          ),
        },
      },
      errors,
    }
  }

  // src/osakkeet/shareCalculator.ts
  var zero4 = new decimal_default(0)
  var CAPITAL_REPAYMENT_ELIGIBILITY_YEARS = 10
  function getTimestampConflictDescription(event) {
    return `${event.kind}:${event.id}:${event.date}`
  }
  function getDayConflictFamily(event) {
    switch (event.kind) {
      case 'subscription':
        return 'subscription'
      case 'sell':
        return 'sell'
      case 'capitalRepaymentOrDividend':
        return 'distribution'
      case 'shareCountChange':
      case 'acquisitionCostChange':
        return 'structure'
    }
  }
  function canShareDayWithoutTime(a2, b2) {
    return getDayConflictFamily(a2) === getDayConflictFamily(b2)
  }
  function collectTimestampConflicts(events2, errors) {
    const parsedEvents = events2.filter(hasParsedTimestamp)
    const reportedPairs = /* @__PURE__ */ new Set()
    const reportConflict = (a2, b2) => {
      const descriptionA = getTimestampConflictDescription(a2)
      const descriptionB = getTimestampConflictDescription(b2)
      const pairKey = [descriptionA, descriptionB].sort().join('|')
      if (reportedPairs.has(pairKey)) return
      reportedPairs.add(pairKey)
      errors.push({
        kind: 'timestamp_conflict',
        message: `Timestamp conflict between ${descriptionA} and ${descriptionB}.`,
      })
    }
    const eventsByCalendarDay = /* @__PURE__ */ new Map()
    parsedEvents.forEach((event) => {
      const existing = eventsByCalendarDay.get(event.parsedTimestamp.calendarDayKey) || []
      eventsByCalendarDay.set(event.parsedTimestamp.calendarDayKey, [...existing, event])
    })
    eventsByCalendarDay.forEach((dayEvents) => {
      const sortedEvents = [...dayEvents].sort((a2, b2) => eventTimestampMs(a2) - eventTimestampMs(b2))
      for (let index = 0; index < sortedEvents.length; index += 1) {
        for (let nextIndex = index + 1; nextIndex < sortedEvents.length; nextIndex += 1) {
          const left = sortedEvents[index]
          const right = sortedEvents[nextIndex]
          const leftDayPrecision = !!left.parsedTimestamp.dayKey
          const rightDayPrecision = !!right.parsedTimestamp.dayKey
          const sameExactTimestamp = left.parsedTimestamp.timestampMs === right.parsedTimestamp.timestampMs
          if (!leftDayPrecision && !rightDayPrecision && !sameExactTimestamp) {
            continue
          }
          if (leftDayPrecision && rightDayPrecision && canShareDayWithoutTime(left, right)) {
            continue
          }
          if (sameExactTimestamp || leftDayPrecision || rightDayPrecision) {
            reportConflict(left, right)
          }
        }
      }
    })
  }
  function eventTimestampMs(event) {
    var _a2, _b
    return (_b = (_a2 = event.parsedTimestamp) == null ? void 0 : _a2.timestampMs) != null
      ? _b
      : Number.POSITIVE_INFINITY
  }
  function sortEvents(events2) {
    return [...events2].sort((a2, b2) => eventTimestampMs(a2) - eventTimestampMs(b2))
  }
  function createInitialState(subscription) {
    var _a2, _b
    return {
      id: subscription.id,
      timestampMs:
        (_b = (_a2 = subscription.parsedTimestamp) == null ? void 0 : _a2.timestampMs) != null
          ? _b
          : Number.NEGATIVE_INFINITY,
      date: subscription.date,
      shareCount: subscription.shareCount,
      shareAcquisitionCost: subscription.shareAcquisitionCost,
      baseShareAcquisitionCost: subscription.shareAcquisitionCost,
    }
  }
  function addYears2(date, years) {
    const next = new Date(date.getTime())
    next.setUTCFullYear(next.getUTCFullYear() + years)
    return next
  }
  function isCapitalRepaymentWithinAgeLimit(lot, event) {
    var _a2, _b
    if (event.type !== 'capital_return') return false
    const lotDate = new Date(lot.timestampMs)
    const eventDate = new Date(
      (_b = (_a2 = event.parsedTimestamp) == null ? void 0 : _a2.timestampMs) != null ? _b : Number.NaN
    )
    if (Number.isNaN(lotDate.getTime()) || Number.isNaN(eventDate.getTime())) return false
    return eventDate.getTime() <= addYears2(lotDate, CAPITAL_REPAYMENT_ELIGIBILITY_YEARS).getTime()
  }
  function getOrCreateLogBucket(logsBySubscriptionId, subscriptionId) {
    const existing = logsBySubscriptionId.get(subscriptionId)
    if (existing) return existing
    const next = []
    logsBySubscriptionId.set(subscriptionId, next)
    return next
  }
  function recordLogEntry(internalState, subscriptionId, entry) {
    getOrCreateLogBucket(internalState.logsBySubscriptionId, subscriptionId).push(entry)
    if (entry.kind === 'sellForThisSubscription') {
      const existing = internalState.sellsForThisSubscriptionLotsBySubscriptionId[subscriptionId] || []
      internalState.sellsForThisSubscriptionLotsBySubscriptionId[subscriptionId] = [...existing, entry]
    }
  }
  function processEvents(events2, errors, options = {}) {
    const internalState = {
      logsBySubscriptionId: /* @__PURE__ */ new Map(),
      sellsForThisSubscriptionLotsBySubscriptionId: {},
    }
    const lotOrder = []
    const lotsById = /* @__PURE__ */ new Map()
    for (const event of sortEvents(events2)) {
      if (event.kind === 'subscription') {
        if (!event.parsedTimestamp) continue
        const lot = createInitialState(event)
        lotsById.set(event.id, lot)
        lotOrder.push(event.id)
        recordLogEntry(internalState, event.id, {
          kind: 'subscription',
          id: event.id,
          date: event.date,
          shareCount: lot.shareCount,
          shareAcquisitionCost: lot.shareAcquisitionCost,
          originalSharePrice: event.originalSharePrice,
          remainingAfter: {
            shareCount: lot.shareCount,
            shareAcquisitionCost: lot.shareAcquisitionCost,
          },
        })
        continue
      }
      if (!event.parsedTimestamp) continue
      const currentEventTimestampMs = event.parsedTimestamp.timestampMs
      if (event.kind === 'shareCountChange') {
        for (const subscriptionId of lotOrder) {
          const lot = lotsById.get(subscriptionId)
          if (!lot || lot.timestampMs > currentEventTimestampMs) continue
          const beforeShareCount = lot.shareCount
          const nextShareCount = lot.shareCount.mul(event.shareCountMultiplier)
          if (nextShareCount.eq(beforeShareCount)) continue
          lot.shareCount = nextShareCount
          recordLogEntry(internalState, subscriptionId, {
            kind: 'companyShareCountChange',
            id: subscriptionId,
            changeId: event.id,
            date: event.date,
            type: 'share_split',
            shareCountMultiplier: event.shareCountMultiplier,
            remainingAfter: {
              shareCount: lot.shareCount,
              shareAcquisitionCost: lot.shareAcquisitionCost,
            },
          })
        }
        continue
      }
      if (event.kind === 'acquisitionCostChange') {
        for (const subscriptionId of lotOrder) {
          const lot = lotsById.get(subscriptionId)
          if (!lot || lot.timestampMs > currentEventTimestampMs) continue
          const beforeShareAcquisitionCost = lot.shareAcquisitionCost
          const beforeBaseShareAcquisitionCost = lot.baseShareAcquisitionCost
          const nextShareAcquisitionCost = lot.shareAcquisitionCost.mul(event.shareAcquisitionCostMultiplier)
          const nextBaseShareAcquisitionCost = lot.baseShareAcquisitionCost.mul(event.shareAcquisitionCostMultiplier)
          if (
            nextShareAcquisitionCost.eq(beforeShareAcquisitionCost) &&
            nextBaseShareAcquisitionCost.eq(beforeBaseShareAcquisitionCost)
          ) {
            continue
          }
          lot.shareAcquisitionCost = nextShareAcquisitionCost
          lot.baseShareAcquisitionCost = nextBaseShareAcquisitionCost
          recordLogEntry(internalState, subscriptionId, {
            kind: 'companyAcquisitionCostChange',
            id: subscriptionId,
            changeId: event.id,
            date: event.date,
            type: 'demerger',
            shareAcquisitionCostMultiplier: event.shareAcquisitionCostMultiplier,
            remainingAfter: {
              shareCount: lot.shareCount,
              shareAcquisitionCost: lot.shareAcquisitionCost,
            },
          })
        }
        continue
      }
      if (event.kind === 'capitalRepaymentOrDividend') {
        if (event.type !== 'capital_return') continue
        for (const subscriptionId of lotOrder) {
          const lot = lotsById.get(subscriptionId)
          if (!lot || lot.timestampMs > currentEventTimestampMs) continue
          const beforeShareCount = lot.shareCount
          if (beforeShareCount.lte(0)) continue
          const isPastCutoff =
            options.capitalReturnCutoffTimestampMs != null &&
            !Number.isNaN(options.capitalReturnCutoffTimestampMs) &&
            currentEventTimestampMs >= options.capitalReturnCutoffTimestampMs
          const isEligibleByAge = isCapitalRepaymentWithinAgeLimit(lot, event)
          const remainingPerShare = lot.shareCount.gt(0) ? lot.shareAcquisitionCost.div(lot.shareCount) : zero4
          const capitalRepaymentPerShare =
            !isPastCutoff && isEligibleByAge && lot.shareAcquisitionCost.gt(0)
              ? decimal_default.min(event.amountPerShare, remainingPerShare)
              : zero4
          const appliedShareAcquisitionCost = capitalRepaymentPerShare.mul(beforeShareCount)
          const grossTotal = event.amountPerShare.mul(beforeShareCount)
          const directedToDividendTotal = decimal_default.max(grossTotal.minus(appliedShareAcquisitionCost), zero4)
          const dividendReason = isPastCutoff
            ? 'listed_dividend'
            : !isEligibleByAge
              ? 'too_old'
              : directedToDividendTotal.gt(0)
                ? lot.shareAcquisitionCost.lte(0)
                  ? 'no_remaining_cost'
                  : 'remaining_cost_limit'
                : void 0
          if (appliedShareAcquisitionCost.gt(0)) {
            lot.shareAcquisitionCost = decimal_default.max(
              lot.shareAcquisitionCost.minus(appliedShareAcquisitionCost),
              zero4
            )
          }
          recordLogEntry(internalState, subscriptionId, {
            kind: 'capitalRepayment',
            id: subscriptionId,
            capitalRepaymentId: event.id,
            date: event.date,
            amountPerShare: event.amountPerShare,
            shareCountAtEvent: beforeShareCount,
            appliedShareAcquisitionCost,
            directedToDividendTotal,
            dividendReason,
            remainingAfter: {
              shareCount: lot.shareCount,
              shareAcquisitionCost: lot.shareAcquisitionCost,
            },
          })
        }
        continue
      }
      if (event.kind === 'sell') {
        let remainingToSell = event.shareCount
        for (const subscriptionId of lotOrder) {
          if (remainingToSell.lte(0)) break
          const lot = lotsById.get(subscriptionId)
          if (!lot || lot.timestampMs > currentEventTimestampMs || lot.shareCount.lte(0)) continue
          const soldShareCount = decimal_default.min(lot.shareCount, remainingToSell)
          if (soldShareCount.lte(0)) continue
          const beforeShareCount = lot.shareCount
          const beforeShareAcquisitionCost = lot.shareAcquisitionCost
          const beforeBaseShareAcquisitionCost = lot.baseShareAcquisitionCost
          const soldShareAcquisitionCost = beforeShareCount.gt(0)
            ? beforeShareAcquisitionCost.mul(soldShareCount).div(beforeShareCount)
            : zero4
          const soldBaseShareAcquisitionCost = beforeShareCount.gt(0)
            ? beforeBaseShareAcquisitionCost.mul(soldShareCount).div(beforeShareCount)
            : zero4
          lot.shareCount = decimal_default.max(lot.shareCount.minus(soldShareCount), zero4)
          lot.shareAcquisitionCost = decimal_default.max(
            lot.shareAcquisitionCost.minus(soldShareAcquisitionCost),
            zero4
          )
          lot.baseShareAcquisitionCost = decimal_default.max(
            lot.baseShareAcquisitionCost.minus(soldBaseShareAcquisitionCost),
            zero4
          )
          recordLogEntry(internalState, subscriptionId, {
            kind: 'sellForThisSubscription',
            id: subscriptionId,
            sellId: event.id,
            date: event.date,
            soldShareCount,
            soldShareAcquisitionCost,
            soldBaseShareAcquisitionCost,
            sellPrice: event.shareCount.gt(0) ? event.sellPrice.mul(soldShareCount).div(event.shareCount) : zero4,
            pricePerShare: event.pricePerShare,
            remainingAfter: {
              shareCount: lot.shareCount,
              shareAcquisitionCost: lot.shareAcquisitionCost,
            },
          })
          remainingToSell = remainingToSell.minus(soldShareCount)
        }
        if (remainingToSell.gt(0)) {
          errors.push({
            kind: 'sell_exceeds_available',
            message: `Sell ${event.id} exceeds available shares by ${remainingToSell.toString()}.`,
          })
        }
      }
    }
    return internalState
  }
  function compareLogEntryTimestamp(a2, b2) {
    var _a2, _b
    const parsedA = parseEventTimestamp(a2.date)
    const parsedB = parseEventTimestamp(b2.date)
    return (
      ((_a2 = parsedA == null ? void 0 : parsedA.timestampMs) != null ? _a2 : 0) -
      ((_b = parsedB == null ? void 0 : parsedB.timestampMs) != null ? _b : 0)
    )
  }
  function resolveStateFromLogEntries(log3, timestampMs, inclusive, includeLog = true) {
    let state = {
      shareCount: zero4,
      shareAcquisitionCost: zero4,
      baseShareAcquisitionCost: zero4,
    }
    const filtered = []
    for (const entry of [...log3].sort(compareLogEntryTimestamp)) {
      const parsed = parseEventTimestamp(entry.date)
      if (!parsed) continue
      const include = inclusive ? parsed.timestampMs <= timestampMs : parsed.timestampMs < timestampMs
      if (!include) continue
      if (includeLog) filtered.push(entry)
      if (entry.kind === 'subscription') {
        state = {
          shareCount: entry.remainingAfter.shareCount,
          shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
          baseShareAcquisitionCost: entry.shareAcquisitionCost,
        }
        continue
      }
      if (entry.kind === 'companyAcquisitionCostChange') {
        const multiplier2 = entry.shareAcquisitionCostMultiplier
        state = {
          shareCount: entry.remainingAfter.shareCount,
          shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
          baseShareAcquisitionCost: state.baseShareAcquisitionCost.mul(multiplier2),
        }
        continue
      }
      if (entry.kind === 'sellForThisSubscription') {
        state = {
          shareCount: entry.remainingAfter.shareCount,
          shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
          baseShareAcquisitionCost: decimal_default.max(
            state.baseShareAcquisitionCost.minus(entry.soldBaseShareAcquisitionCost),
            zero4
          ),
        }
        continue
      }
      state = {
        shareCount: entry.remainingAfter.shareCount,
        shareAcquisitionCost: entry.remainingAfter.shareAcquisitionCost,
        baseShareAcquisitionCost: state.baseShareAcquisitionCost,
      }
    }
    return {
      remaining: {
        shareCount: state.shareCount,
        shareAcquisitionCost: state.shareAcquisitionCost,
      },
      state,
      log: filtered,
    }
  }
  function createShareCalculator(inputs2, options = {}) {
    var _a2, _b
    const errors = []
    const capitalReturnCutoffTimestampMs =
      typeof options.capitalReturnCutoffDateExclusive === 'string'
        ? (_a2 = parseSupportedTimestampOrDate(options.capitalReturnCutoffDateExclusive.trim())) == null
          ? void 0
          : _a2.getTime()
        : (_b = options.capitalReturnCutoffDateExclusive) == null
          ? void 0
          : _b.getTime()
    const parsedEvents = [
      ...inputs2.subscriptions,
      ...inputs2.sells,
      ...inputs2.shareSplits,
      ...inputs2.demergers,
      ...inputs2.cashDistributions,
    ].filter(hasParsedTimestamp)
    collectTimestampConflicts(parsedEvents, errors)
    const internalState = processEvents(parsedEvents, errors, { capitalReturnCutoffTimestampMs })
    const shareCalculator = {
      sellsForThisSubscriptionLotsBySubscriptionId: internalState.sellsForThisSubscriptionLotsBySubscriptionId,
      subscriptionIds: inputs2.subscriptions.map((subscription) => subscription.id),
      getRemainingCountAndAcquisitionCost(shareSubscriptionId, timestamp) {
        const normalized = typeof timestamp === 'string' ? parseSupportedTimestampOrDate(timestamp.trim()) : timestamp
        const timestampMs = normalized == null ? void 0 : normalized.getTime()
        if (!normalized || Number.isNaN(timestampMs)) {
          return {
            remaining: { shareCount: zero4, shareAcquisitionCost: zero4 },
            log: [],
          }
        }
        const log3 = internalState.logsBySubscriptionId.get(shareSubscriptionId) || []
        const resolved = resolveStateFromLogEntries(log3, timestampMs, true)
        return { remaining: resolved.remaining, log: resolved.log }
      },
    }
    return { shareCalculator, errors }
  }

  // src/osakkeet/osakkeetUiCalculator.ts
  var zero5 = new decimal_default(0)
  var OSAKKEET_TAX_RULES_2016 = {
    year: 2016,
    capitalIncomeTax: {
      threshold: 3e4,
      lowRate: 0.3,
      highRate: 0.34,
    },
    capitalRepayment: {
      eligibilityYears: 10,
    },
    hankintamenoOlettama: {
      ownershipYearsThreshold: 10,
      shortOwnershipRate: 0.2,
      longOwnershipRate: 0.4,
    },
    unlistedDividend: {
      mathematicalValueYieldRate: 0.08,
      annualCapitalDividendThreshold: 15e4,
      lowCapitalDividendTaxableRate: 0.25,
      highCapitalDividendTaxableRate: 0.85,
      lowCapitalDividendTaxFreeRate: 0.75,
      highCapitalDividendTaxFreeRate: 0.15,
      earnedDividendTaxableRate: 0.75,
      earnedDividendTaxFreeRate: 0.25,
      withholdingThreshold: 15e4,
      lowWithholdingRate: 0.075,
      highWithholdingRate: 0.28,
    },
    listedDividend: {
      taxableCapitalIncomeRate: 0.85,
      taxFreeCapitalIncomeRate: 0.15,
      withholdingRate: 0.255,
    },
  }
  var YEARLY_TAX_RULES = [OSAKKEET_TAX_RULES_2016]
  function yearlyTaxCalculator(year) {
    if (year < OSAKKEET_TAX_RULES_2016.year) {
      throw new Error(`yearlyTaxCalculator supports years ${OSAKKEET_TAX_RULES_2016.year} and after, got ${year}`)
    }
    let activeRules = YEARLY_TAX_RULES[0]
    for (const rules of YEARLY_TAX_RULES) {
      if (rules.year > year) break
      activeRules = rules
    }
    return activeRules
  }
  var OSAKKEET_TAX_RULES_2026 = yearlyTaxCalculator(2026)
  function createLot(input2) {
    return {
      ...input2,
      originalShareCount: input2.shareCount,
      originalShareAcquisitionCost: input2.shareAcquisitionCost,
      baseShareAcquisitionCost: input2.shareAcquisitionCost,
      capitalRepaymentTotal: zero5,
      cashDistributionGrossTotal: zero5,
      capitalRepaymentBreakdown: [],
      capitalRepaymentHoverEntries: [],
      shareCalculatorLog: [],
      acquisitionCostAdjustments: [],
    }
  }
  function resolveYearlyTaxRules(year, fallbackRules, useYearlyRules) {
    if (!useYearlyRules || year == null || year < OSAKKEET_TAX_RULES_2016.year) {
      return fallbackRules
    }
    return yearlyTaxCalculator(year)
  }
  function collectUnsupportedYearWarnings(
    cashDistributions,
    ipoDate,
    ipoSellAmount,
    warnings,
    localization,
    useYearlyRules
  ) {
    if (!useYearlyRules) return
    const unsupportedYears = /* @__PURE__ */ new Set()
    cashDistributions.forEach((entry) => {
      var _a2
      const year = (_a2 = entry.dateValue) == null ? void 0 : _a2.getUTCFullYear()
      if (year != null && year < OSAKKEET_TAX_RULES_2016.year) {
        unsupportedYears.add(year)
      }
    })
    const ipoYear = ipoDate == null ? void 0 : ipoDate.getUTCFullYear()
    if (ipoYear != null && ipoYear < OSAKKEET_TAX_RULES_2016.year && ipoSellAmount.gt(0)) {
      unsupportedYears.add(ipoYear)
    }
    ;[...unsupportedYears]
      .sort((a2, b2) => a2 - b2)
      .forEach((year) => warnings.push(localization.calculator.warnings.unsupportedYearRange(year)))
  }
  function mapShareCalculatorErrors(shareCalculatorErrors, errors) {
    shareCalculatorErrors.forEach((error) => {
      if (!errors.includes(error.message)) {
        errors.push(error.message)
      }
    })
  }
  function getLatestLotStateOrZero(shareCalculator, subscriptionId) {
    const result = shareCalculator.getRemainingCountAndAcquisitionCost(
      subscriptionId,
      /* @__PURE__ */ new Date('9999-12-31T23:59:59.999Z')
    )
    const subscriptionEntry = result.log.find((entry) => entry.kind === 'subscription')
    const baseShareAcquisitionCost = result.log
      .filter(
        (entry) =>
          entry.kind === 'subscription' ||
          entry.kind === 'companyAcquisitionCostChange' ||
          entry.kind === 'sellForThisSubscription'
      )
      .reduce(
        (acc, entry) => {
          if (entry.kind === 'subscription') return entry.shareAcquisitionCost
          if (entry.kind === 'companyAcquisitionCostChange') return acc.mul(entry.shareAcquisitionCostMultiplier)
          if (entry.kind === 'sellForThisSubscription')
            return decimal_default.max(acc.minus(entry.soldBaseShareAcquisitionCost), zero5)
          return acc
        },
        (subscriptionEntry == null ? void 0 : subscriptionEntry.kind) === 'subscription'
          ? subscriptionEntry.shareAcquisitionCost
          : zero5
      )
    return {
      shareCount: result.remaining.shareCount,
      shareAcquisitionCost: result.remaining.shareAcquisitionCost,
      baseShareAcquisitionCost,
    }
  }
  function getLotStateAtOrZero(shareCalculator, subscriptionId, timestamp, inclusive = true) {
    const effectiveTimestamp = inclusive ? timestamp : new Date(timestamp.getTime() - 1)
    const result = shareCalculator.getRemainingCountAndAcquisitionCost(subscriptionId, effectiveTimestamp)
    const subscriptionEntry = result.log.find((entry) => entry.kind === 'subscription')
    const baseShareAcquisitionCost = result.log
      .filter(
        (entry) =>
          entry.kind === 'subscription' ||
          entry.kind === 'companyAcquisitionCostChange' ||
          entry.kind === 'sellForThisSubscription'
      )
      .reduce(
        (acc, entry) => {
          if (entry.kind === 'subscription') return entry.shareAcquisitionCost
          if (entry.kind === 'companyAcquisitionCostChange') return acc.mul(entry.shareAcquisitionCostMultiplier)
          if (entry.kind === 'sellForThisSubscription')
            return decimal_default.max(acc.minus(entry.soldBaseShareAcquisitionCost), zero5)
          return acc
        },
        (subscriptionEntry == null ? void 0 : subscriptionEntry.kind) === 'subscription'
          ? subscriptionEntry.shareAcquisitionCost
          : zero5
      )
    return {
      shareCount: result.remaining.shareCount,
      shareAcquisitionCost: result.remaining.shareAcquisitionCost,
      baseShareAcquisitionCost,
    }
  }
  function deriveWorkingLot(lot, shareCalculator, options = {}) {
    const {
      atDate,
      inclusive = true,
      includeShareCalculatorLog = false,
      includeAcquisitionCostAdjustments = false,
      resetCapitalRepaymentTracking = false,
    } = options
    const state = atDate
      ? getLotStateAtOrZero(shareCalculator, lot.id, atDate, inclusive)
      : getLatestLotStateOrZero(shareCalculator, lot.id)
    return {
      ...lot,
      ...state,
      ...(resetCapitalRepaymentTracking ? { capitalRepaymentTotal: zero5 } : {}),
      ...(includeShareCalculatorLog ? { shareCalculatorLog: buildShareCalculatorLog(lot.id, shareCalculator) } : {}),
      ...(includeAcquisitionCostAdjustments
        ? { acquisitionCostAdjustments: buildAcquisitionCostAdjustments(lot, shareCalculator) }
        : {}),
    }
  }
  function buildAcquisitionCostAdjustments(lot, shareCalculator) {
    const adjustments = []
    let baseShareAcquisitionCost = lot.originalShareAcquisitionCost
    const log3 = shareCalculator.getRemainingCountAndAcquisitionCost(
      lot.id,
      /* @__PURE__ */ new Date('9999-12-31T23:59:59.999Z')
    ).log
    for (const entry of log3) {
      if (entry.kind === 'companyShareCountChange') {
        const beforeShares = entry.remainingAfter.shareCount.div(entry.shareCountMultiplier)
        adjustments.push({
          kind: 'split',
          date: entry.date,
          beforeShares,
          afterShares: entry.remainingAfter.shareCount,
          multiplier: entry.shareCountMultiplier,
        })
        continue
      }
      if (entry.kind === 'companyAcquisitionCostChange') {
        const beforeTotalPrice = baseShareAcquisitionCost
        baseShareAcquisitionCost = baseShareAcquisitionCost.mul(entry.shareAcquisitionCostMultiplier)
        adjustments.push({
          kind: 'demerger',
          date: entry.date,
          beforeTotalPrice,
          afterTotalPrice: baseShareAcquisitionCost,
          oldCompanyRatio: entry.shareAcquisitionCostMultiplier,
        })
      }
    }
    return adjustments
  }
  function buildShareCalculatorLog(subscriptionId, shareCalculator) {
    return shareCalculator.getRemainingCountAndAcquisitionCost(
      subscriptionId,
      /* @__PURE__ */ new Date('9999-12-31T23:59:59.999Z')
    ).log
  }
  function buildFinalLotsFromShareCalculator(baseLots, shareCalculator) {
    return baseLots.map((lot) =>
      deriveWorkingLot(lot, shareCalculator, {
        includeShareCalculatorLog: true,
        includeAcquisitionCostAdjustments: true,
        resetCapitalRepaymentTracking: true,
      })
    )
  }
  function applyCashDistributions(
    lots,
    cashDistributions,
    shareCalculator,
    ipoDate,
    mathematicalShareValuesByYear,
    rules,
    warnings,
    localization,
    useYearlyRules
  ) {
    const capitalDividendUsedByYear = /* @__PURE__ */ new Map()
    const grossDividendUsedByYear = /* @__PURE__ */ new Map()
    const summaries = []
    const lotsById = new Map(lots.map((lot) => [lot.id, lot]))
    for (const entry of [...cashDistributions].sort((a2, b2) => compareDateStrings(a2.date, b2.date))) {
      const cashDistributionDate = entry.dateValue
      const amountPerShare = entry.amountPerShare
      const eligibleLots = lots.filter(
        (lot) => !lot.dateValue || !cashDistributionDate || lot.dateValue.getTime() <= cashDistributionDate.getTime()
      )
      const lotStates = eligibleLots.map((lot) => ({
        lot,
        before: cashDistributionDate
          ? getLotStateAtOrZero(shareCalculator, lot.id, cashDistributionDate, false)
          : getLatestLotStateOrZero(shareCalculator, lot.id),
        after: cashDistributionDate
          ? getLotStateAtOrZero(shareCalculator, lot.id, cashDistributionDate, true)
          : getLatestLotStateOrZero(shareCalculator, lot.id),
      }))
      const sharesHeld = sumDecimals(lotStates.map(({ before }) => before.shareCount))
      const expectedTotal = amountPerShare.mul(sharesHeld)
      const grossTotal = expectedTotal
      const effectivePerShare = sharesHeld.gt(0) ? grossTotal.div(sharesHeld) : zero5
      const isAfterIpoDate = !!(ipoDate && cashDistributionDate && cashDistributionDate.getTime() >= ipoDate.getTime())
      const effectiveType = isAfterIpoDate ? 'dividend' : entry.type
      const year = cashDistributionDate == null ? void 0 : cashDistributionDate.getUTCFullYear()
      const distributionRules = resolveYearlyTaxRules(year, rules, useYearlyRules)
      if (sharesHeld.eq(0) && grossTotal.gt(0)) {
        warnings.push(localization.calculator.warnings.noSharesHeldForDistribution(entry.date))
      }
      const allocations = lotStates.map(({ lot, before, after }) => {
        const shares = before.shareCount
        const gross = effectivePerShare.mul(shares)
        const capitalRepayment = decimal_default.max(
          before.shareAcquisitionCost.minus(after.shareAcquisitionCost),
          zero5
        )
        const dividend = decimal_default.max(gross.minus(capitalRepayment), zero5)
        const eligibleCapitalRepayment =
          effectiveType === 'capital_return' &&
          isWithinYearsInclusive(
            lot.dateValue,
            cashDistributionDate,
            distributionRules.capitalRepayment.eligibilityYears
          ) &&
          capitalRepayment.gt(0)
        const targetLot = lotsById.get(lot.id)
        if (targetLot) {
          targetLot.cashDistributionGrossTotal = targetLot.cashDistributionGrossTotal.add(gross)
          targetLot.capitalRepaymentTotal = targetLot.capitalRepaymentTotal.add(capitalRepayment)
        }
        if (capitalRepayment.gt(0)) {
          targetLot == null
            ? void 0
            : targetLot.capitalRepaymentBreakdown.push({
                distributionDate: entry.date,
                shares,
                capitalRepaymentPerShare: shares.gt(0) ? capitalRepayment.div(shares) : zero5,
                capitalRepaymentTotal: capitalRepayment,
              })
        }
        if (entry.type === 'capital_return' && targetLot && shares.gt(0)) {
          const appliedCapitalRepaymentPerShare = shares.gt(0) ? capitalRepayment.div(shares) : zero5
          const directedToDividendPerShare = shares.gt(0) ? dividend.div(shares) : zero5
          const dividendReason =
            effectiveType !== 'capital_return'
              ? 'listed_dividend'
              : !isWithinYearsInclusive(
                    lot.dateValue,
                    cashDistributionDate,
                    distributionRules.capitalRepayment.eligibilityYears
                  )
                ? 'too_old'
                : dividend.gt(0)
                  ? before.shareAcquisitionCost.lte(0)
                    ? 'no_remaining_cost'
                    : 'remaining_cost_limit'
                  : void 0
          targetLot.capitalRepaymentHoverEntries.push({
            distributionDate: entry.date,
            shares,
            inputAmountPerShare: amountPerShare,
            appliedCapitalRepaymentPerShare,
            appliedCapitalRepaymentTotal: capitalRepayment,
            directedToDividendPerShare,
            directedToDividendTotal: dividend,
            dividendReason,
          })
        }
        return {
          subscriptionId: lot.id,
          subscriptionDate: lot.date,
          shares,
          gross,
          capitalRepayment,
          dividend,
          remainingCostPerShareAfter: after.shareCount.gt(0) ? after.shareAcquisitionCost.div(after.shareCount) : zero5,
          eligibleCapitalRepayment,
        }
      })
      const capitalRepaymentTotal = sumDecimals(allocations.map((allocation) => allocation.capitalRepayment))
      const dividendTotal = sumDecimals(allocations.map((allocation) => allocation.dividend))
      const mathematicalShareValuePerShare = year ? mathematicalShareValuesByYear.get(year) || zero5 : zero5
      const shareholderMathematicalValue = mathematicalShareValuePerShare.mul(sharesHeld)
      const eightPercentYieldLimit = shareholderMathematicalValue.mul(
        distributionRules.unlistedDividend.mathematicalValueYieldRate
      )
      const capitalDividendGross = shareholderMathematicalValue.gt(0)
        ? decimal_default.min(dividendTotal, eightPercentYieldLimit)
        : zero5
      const earnedDividendGross = shareholderMathematicalValue.gt(0)
        ? decimal_default.max(dividendTotal.minus(capitalDividendGross), zero5)
        : zero5
      const usedCapitalDividend = year ? capitalDividendUsedByYear.get(year) || zero5 : zero5
      const lowerCapitalDividendRoom = decimal_default.max(
        new decimal_default(distributionRules.unlistedDividend.annualCapitalDividendThreshold).minus(
          usedCapitalDividend
        ),
        zero5
      )
      const lowCapitalPart = decimal_default.min(capitalDividendGross, lowerCapitalDividendRoom)
      const highCapitalPart = decimal_default.max(capitalDividendGross.minus(lowCapitalPart), zero5)
      const taxableCapitalIncome = isAfterIpoDate
        ? dividendTotal.mul(distributionRules.listedDividend.taxableCapitalIncomeRate)
        : lowCapitalPart
            .mul(distributionRules.unlistedDividend.lowCapitalDividendTaxableRate)
            .add(highCapitalPart.mul(distributionRules.unlistedDividend.highCapitalDividendTaxableRate))
      const taxFreeCapitalIncomePortion = isAfterIpoDate
        ? dividendTotal.mul(distributionRules.listedDividend.taxFreeCapitalIncomeRate)
        : lowCapitalPart
            .mul(distributionRules.unlistedDividend.lowCapitalDividendTaxFreeRate)
            .add(highCapitalPart.mul(distributionRules.unlistedDividend.highCapitalDividendTaxFreeRate))
      const taxableEarnedDividend = isAfterIpoDate
        ? zero5
        : earnedDividendGross.mul(distributionRules.unlistedDividend.earnedDividendTaxableRate)
      const taxFreeEarnedDividend = isAfterIpoDate
        ? zero5
        : earnedDividendGross.mul(distributionRules.unlistedDividend.earnedDividendTaxFreeRate)
      const usedGrossDividend = year ? grossDividendUsedByYear.get(year) || zero5 : zero5
      const lowerGrossDividendRoom = decimal_default.max(
        new decimal_default(distributionRules.unlistedDividend.withholdingThreshold).minus(usedGrossDividend),
        zero5
      )
      const lowWithholdingPart = decimal_default.min(dividendTotal, lowerGrossDividendRoom)
      const highWithholdingPart = decimal_default.max(dividendTotal.minus(lowWithholdingPart), zero5)
      const withholdingToTaxOffice = isAfterIpoDate
        ? dividendTotal.mul(distributionRules.listedDividend.withholdingRate)
        : lowWithholdingPart
            .mul(distributionRules.unlistedDividend.lowWithholdingRate)
            .add(highWithholdingPart.mul(distributionRules.unlistedDividend.highWithholdingRate))
      const paidInCash = grossTotal.minus(withholdingToTaxOffice)
      if (year && !isAfterIpoDate) {
        capitalDividendUsedByYear.set(year, usedCapitalDividend.add(capitalDividendGross))
        grossDividendUsedByYear.set(year, usedGrossDividend.add(dividendTotal))
      }
      const capitalRepaymentShareCount = sumDecimals(
        allocations.filter((allocation) => allocation.capitalRepayment.gt(0)).map((allocation) => allocation.shares)
      )
      const dividendShareCount = sumDecimals(
        allocations.filter((allocation) => allocation.dividend.gt(0)).map((allocation) => allocation.shares)
      )
      summaries.push({
        id: entry.id,
        date: entry.date,
        type: effectiveType,
        amountPerShare,
        sharesHeld,
        capitalRepaymentShareCount,
        dividendShareCount,
        mathematicalShareValuePerShare,
        shareholderMathematicalValue,
        eightPercentYieldLimit,
        expectedTotal,
        grossTotal,
        paidInCash,
        capitalRepaymentTotal,
        dividendTotal,
        withholdingToTaxOffice,
        taxableCapitalIncome,
        taxFreeCapitalIncomePortion,
        taxableEarnedDividend,
        taxFreeEarnedDividend,
        treatedAsListedDividend: isAfterIpoDate,
        allocations,
      })
    }
    return summaries
  }
  function createTaxReturnTotals(entries) {
    return {
      paidInCash: sumDecimals(entries.map((row) => row.paidInCash)),
      withholdingToTaxOffice: sumDecimals(entries.map((row) => row.withholdingToTaxOffice)),
      capitalRepaymentTotal: sumDecimals(entries.map((row) => row.capitalRepaymentTotal)),
      dividendTotal: sumDecimals(entries.map((row) => row.dividendTotal)),
      taxableCapitalIncome: sumDecimals(entries.map((row) => row.taxableCapitalIncome)),
      taxFreeCapitalIncome: sumDecimals(entries.map((row) => row.taxFreeCapitalIncomePortion)),
      taxableEarnedDividend: sumDecimals(entries.map((row) => row.taxableEarnedDividend)),
      taxFreeEarnedDividend: sumDecimals(entries.map((row) => row.taxFreeEarnedDividend)),
    }
  }
  function createYearEndTimestamp(year) {
    return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
  }
  function buildTaxReturnAssetSummary(year, mathematicalShareValuePerShare, subscriptionIds, shareCalculator) {
    const yearEndTimestamp = createYearEndTimestamp(year)
    const shareCount = sumDecimals(
      subscriptionIds.map(
        (subscriptionId) =>
          shareCalculator.getRemainingCountAndAcquisitionCost(subscriptionId, yearEndTimestamp).remaining.shareCount
      )
    )
    const remainingAcquisitionCost = sumDecimals(
      subscriptionIds.map(
        (subscriptionId) =>
          shareCalculator.getRemainingCountAndAcquisitionCost(subscriptionId, yearEndTimestamp).remaining
            .shareAcquisitionCost
      )
    )
    if (shareCount.lte(0) && remainingAcquisitionCost.lte(0) && mathematicalShareValuePerShare.lte(0)) {
      return void 0
    }
    return {
      date: `31.12.${year}`,
      shareCount,
      mathematicalShareValuePerShare,
      shareholderMathematicalValue: mathematicalShareValuePerShare.mul(shareCount),
      remainingAcquisitionCost,
    }
  }
  function buildTaxReturnYearSummaries(
    cashDistributions,
    sales,
    ipoDate,
    mathematicalShareValuesByYear,
    shareCalculator
  ) {
    const yearSet = /* @__PURE__ */ new Set()
    cashDistributions.forEach((cashDistribution) => {
      var _a2
      const date = (_a2 = cashDistribution.date.match(/(\d{4})$/)) == null ? void 0 : _a2[1]
      if (date) yearSet.add(Number(date))
    })
    const ipoYear = ipoDate == null ? void 0 : ipoDate.getUTCFullYear()
    for (const year of mathematicalShareValuesByYear.keys()) {
      if (ipoYear != null && year >= ipoYear) continue
      yearSet.add(year)
    }
    sales.forEach((sale) => yearSet.add(sale.year))
    const years = [...yearSet].sort((a2, b2) => a2 - b2)
    return years.map((year) => {
      const yearEntries = cashDistributions.filter((cashDistribution) => cashDistribution.date.endsWith(String(year)))
      const unlistedEntries = yearEntries.filter((row) => !row.treatedAsListedDividend)
      const listedEntries = yearEntries.filter((row) => row.treatedAsListedDividend)
      const missingMathematicalValueWarningDates = unlistedEntries
        .filter((row) => row.dividendTotal.gt(0) && row.shareholderMathematicalValue.eq(0))
        .map((row) => row.date)
      const assets =
        ipoYear == null || year < ipoYear
          ? buildTaxReturnAssetSummary(
              year,
              mathematicalShareValuesByYear.get(year) || zero5,
              shareCalculator.subscriptionIds,
              shareCalculator
            )
          : void 0
      return {
        year,
        missingMathematicalValueWarningDates,
        assets,
        unlisted:
          unlistedEntries.length > 0
            ? {
                mode: 'unlisted',
                entries: unlistedEntries,
                totals: createTaxReturnTotals(unlistedEntries),
              }
            : void 0,
        listed:
          listedEntries.length > 0
            ? {
                mode: 'listed',
                entries: listedEntries,
                totals: createTaxReturnTotals(listedEntries),
              }
            : void 0,
        sales: sales.filter((sale) => sale.year === year),
      }
    })
  }
  function buildTaxReturnSaleSummaries(
    sells,
    baseLots,
    shareCalculator,
    ipoDate,
    ipoSell,
    effectiveRules,
    useYearlyRules
  ) {
    const historicalSales = sells.flatMap((sell) => {
      if (!sell.parsedTimestamp) return []
      const sellDate = new Date(sell.parsedTimestamp.timestampMs)
      const sellableLots = baseLots
        .map((lot) => deriveWorkingLot(lot, shareCalculator, { atDate: sellDate, inclusive: false }))
        .filter((lot) => lot.shareCount.gt(0))
      const totalTrackedShares = sumDecimals(sellableLots.map((lot) => lot.shareCount))
      const sellRules = resolveYearlyTaxRules(sellDate.getUTCFullYear(), effectiveRules, useYearlyRules)
      const summary2 = calculateSellSummary({
        sellableLots,
        totalTrackedShares,
        sellShareCalculator: shareCalculator,
        sellId: sell.id,
        sellAmount: sell.shareCount,
        otherAnnualCapitalGainsOrLosses: zero5,
        sellDate,
        sellPricePerShare: sell.pricePerShare,
        sellCostPerShare: sell.shareCount.gt(0) ? sell.otherTotalSellCosts.div(sell.shareCount) : zero5,
        sellRules,
      })
      return summary2.grossTotal.gt(0)
        ? [
            {
              year: sellDate.getUTCFullYear(),
              sellDate: sell.date,
              summary: summary2,
            },
          ]
        : []
    })
    if (!ipoDate || !ipoSell.grossTotal.gt(0)) {
      return historicalSales
    }
    return [
      ...historicalSales,
      {
        year: ipoDate.getUTCFullYear(),
        sellDate: ipoDate.toISOString().slice(0, 10),
        summary: ipoSell,
      },
    ]
  }
  function calculateOsakkeet(form2, localization, rules) {
    var _a2
    const effectiveRules = rules || OSAKKEET_TAX_RULES_2026
    const useYearlyRules = rules == null
    const { parsed, errors } = parseOsakkeetCalculatorInputs(form2, localization)
    const { parsed: parsedIpo, errors: ipoErrors } = parseOsakkeetIpoCalculatorInputs(form2, localization)
    errors.push(...ipoErrors)
    const warnings = []
    const sortedSubscriptions = [...parsed.subscriptions].sort((a2, b2) => compareDateStrings(a2.date, b2.date))
    const sortedSells = [...parsed.sells].sort((a2, b2) => compareDateStrings(a2.date, b2.date))
    const baseLots = sortedSubscriptions.map((subscription) => createLot(subscription))
    const totalSubscribedCost = sumDecimals(baseLots.map((lot) => lot.baseShareAcquisitionCost))
    const { mathematicalShareValuesByYear } = parsed
    const ipoDate = parsed.company.becameListedDate
    const { shareCalculator: baseShareCalculator, errors: baseShareCalculatorErrors } = createShareCalculator(
      {
        subscriptions: sortedSubscriptions,
        sells: sortedSells,
        shareSplits: parsed.shareSplits,
        demergers: parsed.demergers,
        cashDistributions: parsed.cashDistributions,
      },
      { capitalReturnCutoffDateExclusive: ipoDate }
    )
    mapShareCalculatorErrors(baseShareCalculatorErrors, errors)
    const ipoLots = baseLots.map((lot) =>
      deriveWorkingLot(lot, baseShareCalculator, { atDate: ipoDate, inclusive: true })
    )
    const totalSubscribedShares = sumDecimals(ipoLots.map((lot) => lot.shareCount))
    const { ipoSellAmount, otherAnnualCapitalGainsOrLosses, ipo } = buildIpoSummaryFromInputs(
      parsedIpo.ipo,
      parsedIpo.ipoSell,
      ipoDate,
      totalSubscribedShares,
      totalSubscribedCost,
      warnings,
      localization
    )
    collectUnsupportedYearWarnings(
      parsed.cashDistributions,
      ipoDate,
      ipoSellAmount,
      warnings,
      localization,
      useYearlyRules
    )
    const vesting = calculateVestingSummary(ipoLots, ipoDate)
    const lots = buildFinalLotsFromShareCalculator(baseLots, baseShareCalculator)
    const currentVesting = calculateVestingSummary(lots, /* @__PURE__ */ new Date())
    const cashDistributions = applyCashDistributions(
      lots,
      parsed.cashDistributions,
      baseShareCalculator,
      ipoDate,
      mathematicalShareValuesByYear,
      effectiveRules,
      warnings,
      localization,
      useYearlyRules
    )
    const sellableLotIds = new Set(vesting.sellableLots.map((lot) => lot.id))
    const ipoRelevantSells = ipoDate
      ? sortedSells.filter((sell) => compareDateStrings(sell.date, parsed.company.becameListedDateText) <= 0)
      : sortedSells
    const { shareCalculator: sellShareCalculator, errors: sellShareCalculatorErrors } = createShareCalculator(
      {
        subscriptions: sortedSubscriptions.filter((subscription) => sellableLotIds.has(subscription.id)),
        sells:
          ipoDate && ipoSellAmount.gt(0)
            ? [
                ...ipoRelevantSells,
                {
                  kind: 'sell',
                  id: 'ipo-sell',
                  date: parsed.company.becameListedDateText,
                  parsedTimestamp: parseEventTimestamp(parsed.company.becameListedDateText),
                  shareCount: ipoSellAmount,
                  sellPrice: ipoSellAmount.mul(ipo.ipoPricePerShare),
                  pricePerShare: ipo.ipoPricePerShare,
                  otherTotalSellCosts: zero5,
                },
              ]
            : ipoRelevantSells,
        shareSplits: parsed.shareSplits,
        demergers: parsed.demergers,
        cashDistributions: parsed.cashDistributions,
      },
      { capitalReturnCutoffDateExclusive: ipoDate }
    )
    mapShareCalculatorErrors(sellShareCalculatorErrors, errors)
    const sellRules = resolveYearlyTaxRules(
      (_a2 = ipo.ipoDate) == null ? void 0 : _a2.getUTCFullYear(),
      effectiveRules,
      useYearlyRules
    )
    const ipoSell = calculateIpoSellSummary(
      vesting.sellableLots,
      sellShareCalculator,
      ipoSellAmount,
      parsedIpo.ipoSell.pricePerShare,
      parsedIpo.ipoSell.costPerShare,
      otherAnnualCapitalGainsOrLosses,
      vesting,
      ipo,
      sellRules,
      errors,
      warnings,
      localization
    )
    const taxReturnSales = buildTaxReturnSaleSummaries(
      sortedSells,
      baseLots,
      baseShareCalculator,
      ipoDate,
      ipoSell,
      effectiveRules,
      useYearlyRules
    )
    return {
      formData: form2,
      warnings,
      errors,
      subscriptions: lots,
      cashDistributions,
      vesting,
      currentVesting,
      ipo,
      ipoSell,
      taxReturns: {
        years: buildTaxReturnYearSummaries(
          cashDistributions,
          taxReturnSales,
          ipoDate,
          mathematicalShareValuesByYear,
          baseShareCalculator
        ),
      },
    }
  }

  // src/osakkeet/ki-frame-extensions.ts
  function isCheckboxInput(node) {
    return node.nodeName === 'INPUT' && 'type' in node && node.type === 'checkbox'
  }
  function readDefaultNodeValue(node) {
    if (isCheckboxInput(node)) {
      return node.checked
    }
    return node.value
  }
  function writeDefaultNodeValue(node, value) {
    if (isCheckboxInput(node)) {
      node.checked = Boolean(value)
      return
    }
    node.value = value == null ? '' : String(value)
  }
  function isBasicTextValue(value) {
    return (
      value == null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    )
  }
  function formatBasicTextValue(value) {
    return value == null ? '' : String(value)
  }
  function isTextNode(value) {
    return !!value && typeof value === 'object' && 'nodeType' in value && value.nodeType === 3
  }
  function toRuntimePath(path) {
    return path
  }
  function getStateValueAtPath(stateValue, path) {
    return getByPath(stateValue, toRuntimePath(path))
  }
  function getStateValueAtOptionalPath(stateValue, path) {
    if (!path) {
      return stateValue
    }
    return getStateValueAtPath(stateValue, path)
  }
  function setStateValueAtPath(state, path, value) {
    state.set((current) => copyAndSet(current, toRuntimePath(path), value))
  }
  function withDestroy(value, destroy) {
    return Object.assign(value, { destroy })
  }
  function createTextNodesTree(value, noInit) {
    if (typeof value === 'function') return void 0
    if (isBasicTextValue(value)) {
      return text(noInit ? '' : formatBasicTextValue(value))
    }
    if (Array.isArray(value)) {
      return value.map((item) => createTextNodesTree(item, noInit)).filter((item) => item !== void 0)
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([key, nestedValue]) => [key, createTextNodesTree(nestedValue, noInit)])
        .filter((entry) => entry[1] !== void 0)
      return Object.fromEntries(entries)
    }
    return void 0
  }
  function syncTextNodesTree(nodes, value) {
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
        syncTextNodesTree(childNode, values[key])
      })
    }
  }
  function createTextNodesFromState(state, options = {}) {
    const initialValue = getStateValueAtOptionalPath(state.get(), options.path)
    const nodes = createTextNodesTree(initialValue, options.noInit === true)
    if (nodes === void 0) {
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
    return withDestroy(nodes, unsub)
  }
  function mapStatePathToInput(state, path, node, options = {}) {
    const eventType = options.event || 'input'
    const read = options.read || ((currentNode) => readDefaultNodeValue(currentNode))
    const write = options.write || ((currentNode, value) => writeDefaultNodeValue(currentNode, value))
    const writeStateToNode = (stateValue) => {
      write(node, getStateValueAtPath(stateValue, path))
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
  function mapStatePathsToInputs(state, bindings) {
    const handles = bindings.map(({ path, node, options }) => {
      const eventType = (options == null ? void 0 : options.event) || 'input'
      const read = (options == null ? void 0 : options.read) || ((currentNode) => readDefaultNodeValue(currentNode))
      const write =
        (options == null ? void 0 : options.write) ||
        ((currentNode, value) => writeDefaultNodeValue(currentNode, value))
      const writeStateToNode = (stateValue) => {
        write(node, getStateValueAtPath(stateValue, path))
      }
      writeStateToNode(state.get())
      const controller = createController({ name: 'bind-inputs' })
      controller.addDomEvent(`bind:${String(path)}`, node, eventType, (ev) => {
        const nextValue = read(node)
        if ((options == null ? void 0 : options.validate) && !options.validate(nextValue, node, ev)) return
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
  function mapStateToDomChildren(state, root, optionsOrRender) {
    const options = typeof optionsOrRender === 'function' ? { render: optionsOrRender } : optionsOrRender
    const rows = /* @__PURE__ */ new Map()
    const itemsSelector = options.items || ((value) => value)
    const keySelector = options.key || ((item) => item.id)
    const mountRowNodes = (row, before) => {
      if (row.node.nodeType === 11) {
        row.mountedNodes = Array.from(row.node.childNodes)
        root.insertBefore(row.node, before)
        return
      }
      root.insertBefore(row.node, before)
      row.mountedNodes = [row.node]
    }
    const placeRowBefore = (row, before) => {
      if (row.mountedNodes.length === 0) {
        mountRowNodes(row, before)
        return
      }
      if (row.mountedNodes[0] === before) return
      row.mountedNodes.forEach((node) => {
        root.insertBefore(node, before)
      })
    }
    const destroyRow = (row) => {
      var _a2
      ;(_a2 = row.destroy) == null ? void 0 : _a2.call(row)
      row.mountedNodes.forEach((node) => {
        if (node.parentNode === root) {
          root.removeChild(node)
        }
      })
      row.mountedNodes = []
    }
    const rowContainsNode = (row, target) => {
      if (!target) return false
      return row.mountedNodes.some(
        (node) =>
          node === target || ('contains' in node && typeof node.contains === 'function' && node.contains(target))
      )
    }
    const sync = (stateValue) => {
      var _a2, _b
      const items = itemsSelector(stateValue)
      const nextKeys = /* @__PURE__ */ new Set()
      const orderedRows = []
      items.forEach((item, index) => {
        var _a3
        const key = keySelector(item, index, stateValue)
        nextKeys.add(key)
        let row = rows.get(key)
        if (!row) {
          const createdRow = {
            ...options.render(item, index, stateValue),
            mountedNodes: [],
          }
          rows.set(key, createdRow)
          row = createdRow
        }
        ;(_a3 = row.set) == null ? void 0 : _a3.call(row, item, index, stateValue)
        orderedRows.push({ key, row })
      })
      const activeElement =
        typeof document !== 'undefined' && document.activeElement instanceof Node ? document.activeElement : null
      const pinnedRowIndex =
        activeElement == null ? -1 : orderedRows.findIndex(({ row }) => rowContainsNode(row, activeElement))
      if (pinnedRowIndex === -1) {
        let insertionPoint = root.firstChild
        orderedRows.forEach(({ row }) => {
          var _a3
          placeRowBefore(row, insertionPoint)
          insertionPoint =
            ((_a3 = row.mountedNodes[row.mountedNodes.length - 1]) == null ? void 0 : _a3.nextSibling) || null
        })
      } else {
        const pinnedRow = (_a2 = orderedRows[pinnedRowIndex]) == null ? void 0 : _a2.row
        const pinnedFirstNode = (pinnedRow == null ? void 0 : pinnedRow.mountedNodes[0]) || null
        orderedRows.slice(0, pinnedRowIndex).forEach(({ row }) => {
          placeRowBefore(row, pinnedFirstNode)
        })
        let insertionPoint =
          ((_b = pinnedRow == null ? void 0 : pinnedRow.mountedNodes[pinnedRow.mountedNodes.length - 1]) == null
            ? void 0
            : _b.nextSibling) || null
        orderedRows.slice(pinnedRowIndex + 1).forEach(({ row }) => {
          var _a3
          placeRowBefore(row, insertionPoint)
          insertionPoint =
            ((_a3 = row.mountedNodes[row.mountedNodes.length - 1]) == null ? void 0 : _a3.nextSibling) || null
        })
      }
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
  function createEditableCollectionTable(options) {
    const tbodyNode = document.createElement('tbody')
    const binding = mapStateToDomChildren(options.rowsState, tbodyNode, (row) => {
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
        set(nextRow) {
          var _a2
          ;(_a2 = rendered.set) == null ? void 0 : _a2.call(rendered, nextRow)
          rowState.set({ row: nextRow })
        },
        destroy() {
          var _a2, _b
          ;(_a2 = rendered.destroy) == null ? void 0 : _a2.call(rendered)
          rowTextNodes.destroy()
          ;(_b = rowState.destroy) == null ? void 0 : _b.call(rowState)
        },
      }
    })
    return withDestroy(tbodyNode, () => {
      binding.destroy()
    })
  }
  function normalizeArray(value) {
    return Array.isArray(value) ? [...value] : []
  }
  function clampIndex(index, length) {
    if (index < 0) return 0
    if (index > length) return length
    return index
  }
  function createStateCollectionEditor(state, path, optionsOrKey = {}) {
    const options = typeof optionsOrKey === 'function' ? { key: optionsOrKey } : optionsOrKey
    const key =
      options.key ||
      ((item, index, stateValue) => {
        void item
        void index
        void stateValue
        return `row-${Math.random().toString(36).slice(2, 10)}`
      })
    const normalize =
      options.normalize || ((item, index, stateValue) => ({ ...item, id: item.id || key(item, index, stateValue) }))
    const readItems = () => normalizeArray(getStateValueAtPath(state.get(), path))
    const writeItems = (items) => {
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
  function createViewModelState(state, selector) {
    const initialValue = selector(state.get())
    const viewModelState = createState({ value: initialValue })
    const unsub = state.onValueChange(
      (nextState) => {
        viewModelState.set(selector(nextState))
      },
      { noInit: true }
    )
    viewModelState.onDestroy(unsub)
    return viewModelState
  }
  function safeStorageGet(storage, key) {
    try {
      return storage.getItem(key)
    } catch {
      return null
    }
  }
  function runStorage(run, onError, fallback) {
    try {
      return run()
    } catch (error) {
      onError == null ? void 0 : onError(error)
      return fallback
    }
  }
  function safeStorageSet(storage, key, value) {
    storage.setItem(key, value)
  }
  function safeStorageRemove(storage, key) {
    storage.removeItem(key)
  }
  function createStorageSource(options) {
    const serialize = options.serialize || ((value) => JSON.stringify(value))
    const deserialize = options.deserialize || ((raw) => JSON.parse(raw))
    return {
      getRaw() {
        return safeStorageGet(options.storage, options.key)
      },
      hasValue() {
        return safeStorageGet(options.storage, options.key) != null
      },
      load() {
        const raw = safeStorageGet(options.storage, options.key)
        if (raw == null) return void 0
        return runStorage(() => deserialize(raw), options.onError, void 0)
      },
      save(value) {
        runStorage(() => safeStorageSet(options.storage, options.key, serialize(value)), options.onError)
      },
      remove() {
        runStorage(() => safeStorageRemove(options.storage, options.key), options.onError)
      },
    }
  }
  function createStorageBackedState(options) {
    const state = createState({ value: options.value })
    const persisted = persistState(state, options)
    return Object.assign(
      {
        state,
      },
      persisted,
      {
        destroy() {
          var _a2
          persisted.destroy()
          ;(_a2 = state.destroy) == null ? void 0 : _a2.call(state)
        },
      }
    )
  }
  function createSectionController(root, set) {
    return { root, set }
  }
  function createTextNodesFromSelector(state, selector, options) {
    const viewModelState = createViewModelState(state, selector)
    const nodes = createTextNodesFromState(viewModelState, options)
    const destroyTextNodes = nodes.destroy.bind(nodes)
    return withDestroy(nodes, () => {
      destroyTextNodes()
      viewModelState.destroy()
    })
  }
  function createComputedTextState(state, selector, options) {
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
  function createSectionCounter(initialText = '') {
    const state = createState({ value: { text: initialText } })
    const textNodes = createTextNodesFromState(state, { path: ['text'] })
    return withDestroy(
      {
        node: textNodes,
        set(text2) {
          state.set({ text: text2 })
        },
        setCount(count, label2) {
          state.set({ text: `${count} ${label2}` })
        },
      },
      () => {
        var _a2
        textNodes.destroy()
        ;(_a2 = state.destroy) == null ? void 0 : _a2.call(state)
      }
    )
  }
  function syncOptionBoundSelect(node, nextValue, nextOptions) {
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
  function createOptionBoundSelect(value, options, onChange = () => {}) {
    const node = document.createElement('select')
    node.addEventListener('change', () => {
      onChange(node.value)
    })
    syncOptionBoundSelect(node, value, options)
    return {
      node,
      setValue(nextValue) {
        node.value = nextValue
      },
      setOptions(nextOptions) {
        syncOptionBoundSelect(node, node.value, nextOptions)
      },
    }
  }
  function toNodeArray(value) {
    if (Array.isArray(value)) {
      return value.filter((item) => item !== false && item != null)
    }
    if (value === false || value == null) return []
    return [value]
  }
  function replaceChildrenFromState(state, root, selectorOrRender, renderOrOptions, maybeOptions) {
    const hasSelector = typeof renderOrOptions === 'function'
    const selector = hasSelector ? selectorOrRender : (value) => value
    const render = hasSelector ? renderOrOptions : selectorOrRender
    const options = hasSelector ? maybeOptions : renderOrOptions
    const sync = (stateValue) => {
      replaceChildren(root, toNodeArray(render(selector(stateValue))))
    }
    if (!(options == null ? void 0 : options.noInit)) {
      sync(state.get())
    }
    const unsub = state.onValueChange(sync, { noInit: true })
    return withDestroy({}, unsub)
  }
  function createFormBinder(state) {
    return {
      // Binds one input node to a single state path.
      bindInput(path, node, options = {}) {
        return mapStatePathToInput(state, path, node, options)
      },
      // Binds multiple input nodes to their state paths in one call.
      bindInputs(bindings) {
        return mapStatePathsToInputs(state, bindings)
      },
      // Returns collection editing helpers for an id-based row array at a state path.
      collection(path, optionsOrKey = {}) {
        return createStateCollectionEditor(state, path, optionsOrKey)
      },
      // Creates live text nodes for the whole state value.
      textNodes(options) {
        return createTextNodesFromState(state, options)
      },
      // Creates live text nodes for one selected state path.
      textNodesAtPath(options) {
        return createTextNodesFromState(state, options)
      },
      // Creates live text nodes from a derived value selected from state.
      textNodesFrom(selector, options) {
        return createTextNodesFromSelector(state, selector, options)
      },
      // Re-renders a root node's children from state changes.
      children(root, render, options) {
        return replaceChildrenFromState(state, root, render, options)
      },
      // Creates derived state that stays synced with the source state.
      viewModel(selector) {
        return createViewModelState(state, selector)
      },
    }
  }
  function persistState(state, options) {
    const serialize = options.serialize || ((value) => JSON.stringify(value))
    const deserialize = options.deserialize || ((raw) => JSON.parse(raw))
    const hydrate = options.hydrate !== false
    const saveOnChange = options.saveOnChange !== false
    const saveInitial = options.saveInitial === true
    const load = () => {
      var _a2
      const raw = safeStorageGet(options.storage, options.key)
      if (raw == null) return void 0
      try {
        const loaded = deserialize(raw)
        state.set(loaded)
        return loaded
      } catch (error) {
        ;(_a2 = options.onError) == null ? void 0 : _a2.call(options, error)
        return void 0
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

  // src/osakkeet/osakkeetFormat.ts
  function euro(value) {
    return `${value.toFixed(2)}\xA0\u20AC`
  }
  function amount(value) {
    return value.toFixed(2)
  }
  function percentage(value) {
    return `${value.toFixed(2)} %`
  }
  function multiplier(value) {
    return `${value.toFixed(2)}x`
  }
  function formatLastModifiedTimestamp(value, languageSelection, fallback) {
    if (!value) return fallback
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return new Intl.DateTimeFormat(languageSelection === 'fi' ? 'fi-FI' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(parsed)
  }
  function formatDateLabel(date) {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    return `${day}.${month}.${year}`
  }
  function createSharePercentFormatter(totalShares) {
    return (value) =>
      totalShares.gt(0)
        ? `${amount(value)} (${percentage(value.div(totalShares).mul(100))})`
        : `${amount(value)} (0.00 %)`
  }
  var createSharePercent = createSharePercentFormatter

  // src/osakkeet/osakkeetFormData.ts
  var formCollectionSchemas = {
    subscriptions: {
      prefix: 'sub',
      create: () => ({
        date: '',
        vestingEndsOn: '',
        amount: '',
        pricePerShare: '',
        otherTotalAcquisitionCosts: '',
      }),
      normalize: (row, createId3) => ({
        id: row.id || createId3('sub'),
        date: row.date || '',
        vestingEndsOn: row.vestingEndsOn || '',
        amount: row.amount || '',
        pricePerShare: row.pricePerShare || '',
        otherTotalAcquisitionCosts: row.otherTotalAcquisitionCosts || '',
      }),
    },
    cashDistributions: {
      prefix: 'distribution',
      create: () => ({
        type: 'capital_return',
        date: '',
        amountPerShare: '',
        shareCount: '',
      }),
      normalize: (row, createId3) => ({
        id: row.id || createId3('distribution'),
        date: row.date || '',
        type: row.type || 'capital_return',
        amountPerShare: row.amountPerShare || '',
        shareCount: row.shareCount || '',
      }),
    },
    sells: {
      prefix: 'sell',
      create: () => ({
        date: '',
        shareCount: '',
        sellPrice: '',
        pricePerShare: '',
        otherTotalSellCosts: '',
      }),
      normalize: (row, createId3) => ({
        id: row.id || createId3('sell'),
        date: row.date || '',
        shareCount: row.shareCount || '',
        sellPrice: row.sellPrice || '',
        pricePerShare: row.pricePerShare || '',
        otherTotalSellCosts: row.otherTotalSellCosts || '',
      }),
    },
    shareSplits: {
      prefix: 'split',
      create: () => ({
        date: '',
        multiplier: '',
      }),
      normalize: (row, createId3) => ({
        id: row.id || createId3('split'),
        date: row.date || '',
        multiplier: row.multiplier || '',
      }),
    },
    demergers: {
      prefix: 'demerger',
      create: () => ({
        date: '',
        oldCompanyRatio: '',
      }),
      normalize: (row, createId3) => ({
        id: row.id || createId3('demerger'),
        date: row.date || '',
        oldCompanyRatio: row.oldCompanyRatio || '',
      }),
    },
    mathematicalShareValues: {
      prefix: 'math',
      create: () => ({
        year: '',
        valuePerShare: '',
      }),
      normalize: (row, createId3) => ({
        id: row.id || createId3('math'),
        year: row.year || '',
        valuePerShare: row.valuePerShare || '',
      }),
    },
  }
  function normalizeCollectionRows(key, rows, createId3) {
    return (rows || []).map((row) => formCollectionSchemas[key].normalize(row, createId3))
  }
  function normalizeLegacyIpoSell(data2) {
    var _a2, _b, _c, _d
    const legacyIpoSell = data2.sell
    const legacyIpoDate = (_a2 = data2.ipo) == null ? void 0 : _a2.ipoDate
    return {
      ...data2,
      company: {
        listingStatus: ((_b = data2.company) == null ? void 0 : _b.listingStatus) || 'unlisted',
        becameListedDate: ((_c = data2.company) == null ? void 0 : _c.becameListedDate) || legacyIpoDate || '',
      },
      ipoSell: (_d = data2.ipoSell) != null ? _d : legacyIpoSell,
    }
  }
  function createBlankOsakkeetFormData() {
    return {
      company: {
        listingStatus: 'unlisted',
        becameListedDate: '',
      },
      subscriptions: [],
      sells: [],
      cashDistributions: [],
      shareSplits: [],
      demergers: [],
      mathematicalShareValues: [],
      ipo: {
        totalShareCount: '',
        totalIpoCost: '',
        currentShareValue: '',
        estimatedPreIpoValue: '',
        estimatedSecondaryShareSellPercentage: '',
      },
      ipoSell: {
        amount: '',
        pricePerShare: '',
        costPerShare: '',
        otherAnnualCapitalGainsOrLosses: '',
      },
      lastModifiedCompanyData: '',
      lastModifiedUserData: '',
    }
  }
  function normalizeOsakkeetFormData(data2, createId3) {
    var _a2, _b, _c
    const normalized = normalizeLegacyIpoSell(data2)
    const blank = createBlankOsakkeetFormData()
    const company = (_a2 = normalized.company) != null ? _a2 : blank.company
    const ipo = (_b = normalized.ipo) != null ? _b : blank.ipo
    const ipoSell = (_c = normalized.ipoSell) != null ? _c : blank.ipoSell
    return {
      company: {
        listingStatus: company.listingStatus === 'listed' ? 'listed' : 'unlisted',
        becameListedDate: company.becameListedDate || '',
      },
      subscriptions: sortRowsByDate(normalizeCollectionRows('subscriptions', normalized.subscriptions, createId3)),
      sells: sortRowsByDate(normalizeCollectionRows('sells', normalized.sells, createId3)),
      cashDistributions: sortRowsByDate(
        normalizeCollectionRows('cashDistributions', normalized.cashDistributions, createId3)
      ),
      shareSplits: sortRowsByDate(normalizeCollectionRows('shareSplits', normalized.shareSplits, createId3)),
      demergers: sortRowsByDate(normalizeCollectionRows('demergers', normalized.demergers, createId3)),
      mathematicalShareValues: normalizeCollectionRows(
        'mathematicalShareValues',
        normalized.mathematicalShareValues,
        createId3
      ),
      ipo: {
        ...blank.ipo,
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
        pricePerShare: ipoSell.pricePerShare || '',
        costPerShare: ipoSell.costPerShare || '',
        otherAnnualCapitalGainsOrLosses: ipoSell.otherAnnualCapitalGainsOrLosses || '',
      },
      lastModifiedCompanyData: normalized.lastModifiedCompanyData || '',
      lastModifiedUserData: normalized.lastModifiedUserData || '',
    }
  }
  function createEmptyCollectionRow(key, createId3) {
    return formCollectionSchemas[key].normalize(formCollectionSchemas[key].create(), createId3)
  }
  function createAppendCollectionRow(key) {
    return formCollectionSchemas[key].create()
  }

  // src/osakkeet/osakkeetLocalizations.ts
  var FI = {
    languageSwitch: {
      label: 'Kieli',
    },
    intro: {
      title: 'IPO-laskuri osakkeille',
      description:
        'Laskee p\xE4\xE4omanpalautusten kohdistuksen, hankintamenon j\xE4ljell\xE4 olevan m\xE4\xE4r\xE4n sek\xE4 IPO-myynnin verollisen ja nettom\xE4\xE4r\xE4isen lopputuloksen.',
      unlistedDescription:
        'T\xE4m\xE4 laskuri on tarkoitettu ennen listautumista olevalle listaamattomalle yhti\xF6lle. IPO-p\xE4iv\xE4st\xE4 eteenp\xE4in varojenjako k\xE4sitell\xE4\xE4n t\xE4ss\xE4 n\xE4kym\xE4ss\xE4 osinkona.',
      warningsTitle: 'Varoitukset',
      warnings: [
        'Laskuria ei ole viel\xE4 testattu kattavasti ihmisten toimesta.',
        'Todellisiin rahallisiin p\xE4\xE4t\xF6ksiin kannattaa k\xE4ytt\xE4\xE4 ammattilaispalvelua. T\xE4m\xE4 ei ole sellainen.',
      ],
      securityTitle: 'Tietoturva ja vastuunvapautus',
      securityText:
        'T\xE4m\xE4 sovellus on avointa l\xE4hdekoodia ja vapaasti k\xE4ytett\xE4viss\xE4, mutta kehitt\xE4j\xE4 ei ota mink\xE4\xE4nlaista siit\xE4, ett\xE4 sovellus olisi turvallinen, virheet\xF6n tai ilmainen k\xE4ytt\xE4\xE4.',
      securityAdditionalText:
        'T\xE4m\xE4 sovellus toimii vain selaimessa. Se ei l\xE4het\xE4 tietojasi minnek\xE4\xE4n.',
      securityNote: 'Huom: URL-osoitteissa v\xE4litetyt tiedot voivat n\xE4ky\xE4 muille.',
      securityIssues:
        'Jos havaitset virheit\xE4 tai keksit parannusehdotuksia, koosta yksinkertainen testitapaus ja lis\xE4\xE4 havainto osoitteeseen https://github.com/mikko-apo/kotibudjetti/issues',
    },
    common: {
      rows: 'rivi\xE4',
      date: 'P\xE4iv\xE4',
      amount: 'M\xE4\xE4r\xE4',
      type: 'Tyyppi',
      total: 'Yhteens\xE4',
      edit: 'Muokkaa',
      done: 'Valmis',
      remove: 'Poista',
    },
    company: {
      title: 'Yrityksen tiedot',
      help: 'Valitse onko yhti\xF6 t\xE4ll\xE4 hetkell\xE4 listaamaton vai listattu. Valinnainen listautumisp\xE4iv\xE4 toimii t\xE4ss\xE4 laskurissa IPO-p\xE4iv\xE4n\xE4 varojenjaon ja IPO-myynnin rajap\xE4iv\xE4n\xE4.',
      fields: {
        listingStatus: 'Yhti\xF6n tila',
        becameListedDate: 'Listautumisp\xE4iv\xE4',
      },
      options: {
        unlisted: 'Listaamaton',
        listed: 'Listattu',
      },
    },
    assumptions: {
      title: 'Laskennan oletukset',
      items: [
        'Myynti kohdistetaan merkint\xE4eriin FIFO-j\xE4rjestyksess\xE4.',
        'Ennen IPO-p\xE4iv\xE4\xE4 tehdyt SVOP-varojenjaot k\xE4sitell\xE4\xE4n p\xE4\xE4omanpalautuksena vain silt\xE4 osin kuin sama osakas saa takaisin omaa enint\xE4\xE4n 10 vuotta vanhaa sijoitustaan.',
        'IPO-p\xE4iv\xE4n\xE4 tai sen j\xE4lkeen tehdyt varojenjaot k\xE4sitell\xE4\xE4n t\xE4ss\xE4 laskurissa kokonaan osinkona.',
        'Listaamattoman yhti\xF6n osingon verolajit lasketaan sy\xF6tetyn osakkeiden matemaattisen arvon perusteella.',
        'Hankintameno-olettama vertaillaan jokaiselle k\xE4ytetylle merkint\xE4er\xE4lle erikseen.',
        'Vuositason vero-, osinko- ja p\xE4\xE4omanpalautuslaskenta on tuettu vuosille 2016 ja sit\xE4 uudemmille verovuosille.',
        'P\xE4\xE4omatulovero arvioidaan vain t\xE4m\xE4n myynnin perusteella vuoden 2026 30 % / 34 % verokannoilla.',
      ],
      sourcesLabel: 'L\xE4hteet: ',
    },
    mainSections: {
      actions: {
        open: 'Avaa osio',
        close: 'Sulje osio',
      },
      units: {
        shares: 'osaketta',
        taxYears: 'verovuotta',
        perShare: '/ osake',
      },
      groups: {
        subscriptionsAndSales: {
          title: '2. Osakemerkinn\xE4t ja myynnit',
          summary: 'Sis\xE4lt\xE4\xE4: Osakemerkinn\xE4t, Osakkeiden myynnit.',
        },
        distributionsAndCorporateActions: {
          title: '1. Yrityksen tiedot: Varojenjako, jakautuminen ja splitit',
          summary:
            'Sis\xE4lt\xE4\xE4: Yrityksen tila ja listautumisp\xE4iv\xE4, Osingot ja p\xE4\xE4omanpalautukset, Yrityksen jakautuminen hankintamenon mukaan, Osakesplitit.',
        },
        taxReturns: {
          title: '3. Veroilmoitukset',
          summary: 'Sis\xE4lt\xE4\xE4: Veroilmoitukset.',
        },
        ipoCalculator: {
          title: '4. IPO-laskuri',
          summary: 'Sis\xE4lt\xE4\xE4: IPO-tiedot ja arvionti, IPO-myynnin tiedot.',
        },
      },
    },
    subscriptions: {
      title: 'Osakemerkinn\xE4t',
      help: 'Sy\xF6t\xE4 kaikki merkint\xE4er\xE4t omassa hankintaj\xE4rjestyksess\xE4. Myynniss\xE4 k\xE4ytet\xE4\xE4n FIFO-periaatetta, ja IPO-p\xE4iv\xE4n j\xE4lkeen p\xE4\xE4ttyv\xE4 ansaintajakso est\xE4\xE4 merkint\xE4er\xE4n myynnin.',
      fields: {
        purchaseDate: 'Ostop\xE4iv\xE4',
        originalShareCount: 'Osakkeita alunperin',
        remainingShareCountCurrentDate: (date) => `Osakkeita j\xE4ljell\xE4 (${date})`,
        vestingEndsOn: 'Ansaintajakso p\xE4\xE4ttyy',
        vestingEndsOnHelp:
          'T\xE4ss\xE4 laskurissa ansaintajakso vaikuttaa kahteen asiaan. 1) Jos ansaintajakso p\xE4\xE4ttyy vasta IPO-p\xE4iv\xE4n j\xE4lkeen, merkint\xE4er\xE4\xE4 ei lasketa myyt\xE4v\xE4ksi IPO:ssa. 2) Jos ty\xF6suhde tai muu j\xE4rjestelyn ehto p\xE4\xE4ttyy ennen ansaintajakson loppua, yhti\xF6ll\xE4 tai muilla osakkailla voi k\xE4yt\xE4nn\xF6ss\xE4 olla oikeus ostaa tai lunastaa osakkeet takaisin. Oikeudellisesti ansaintajakso ei yksin aiheuta t\xE4t\xE4: osake on l\xE4ht\xF6kohtaisesti vapaasti luovutettava, jollei yhti\xF6j\xE4rjestyksess\xE4 ole sallittua lunastus- tai suostumuslauseketta tai jollei takaisinostosta ole sovittu erikseen osakassopimuksessa, merkint\xE4ehdoissa tai ty\xF6suhdepohjaisessa j\xE4rjestelyss\xE4. Yhti\xF6n omien osakkeiden hankinta tai lunastus edellytt\xE4\xE4 lis\xE4ksi osakeyhti\xF6lain 15 luvun mukaista menettely\xE4 ja jakokelpoisia varoja.',
        pricePerShare: 'Alkuper\xE4inen hinta / osake',
        otherTotalAcquisitionCosts: 'Muut hankintamenot yhteens\xE4',
        otherTotalAcquisitionCostsHelp:
          'Sy\xF6t\xE4 t\xE4h\xE4n esimerkiksi varainsiirtovero, merkint\xE4\xE4n liittyv\xE4t palkkiot ja muut hankinnasta aiheutuneet kulut. \xC4l\xE4 sy\xF6t\xE4 t\xE4h\xE4n tulonhankkimisvelan korkoja, vaan ilmoita ne vuosiverotuksessa kohdassa p\xE4\xE4omatuloista teht\xE4v\xE4t v\xE4hennykset.',
        totalPricePerShare: 'Kokonaishankintameno / osake',
        totalPricePerShareTooltipBase: (shares, pricePerShare, otherCosts, total) =>
          `Alku: (${shares} osaketta x ${pricePerShare}) + ${otherCosts} = ${total}`,
        totalPricePerShareTooltipDemerger: (date, before, ratio, after) =>
          `${date}: jakautuminen ${before} x ${ratio} = ${after}`,
        totalPricePerShareTooltipSplit: (date, beforeShares, multiplier2, afterShares) =>
          `${date}: split ${beforeShares} osaketta x ${multiplier2} = ${afterShares} osaketta`,
        totalPricePerShareTooltipResult: (total, shares, perShare) =>
          `Lopuksi: ${total} / ${shares} osaketta = ${perShare}`,
        capitalRepaymentPerShareTooltipReasonTooOld: 'merkinn\xE4st\xE4 on yli 10 vuotta',
        capitalRepaymentPerShareTooltipReasonNoRemainingCost: 'j\xE4ljell\xE4 oleva hankintameno on 0',
        capitalRepaymentPerShareTooltipReasonRemainingCostLimit:
          'j\xE4ljell\xE4 oleva hankintameno ei riitt\xE4nyt koko p\xE4\xE4omanpalautukseen',
        capitalRepaymentPerShareTooltipReasonListedDividend:
          'jako on IPO-p\xE4iv\xE4n\xE4 tai sen j\xE4lkeen ja k\xE4sitell\xE4\xE4n osinkona',
        remainingCostPerShare: 'J\xE4ljell\xE4 oleva hankintameno / osake',
        remainingCostPerShareTooltipBase: (totalPrice) => `L\xE4ht\xF6: hankintameno yhteens\xE4 ${totalPrice}.`,
        remainingCostPerShareTooltipCapitalRepayment: (date, amountPerShare, shares, total) =>
          `${date}: p\xE4\xE4omanpalautus ${amountPerShare} / osake x ${shares} osaketta = ${total}`,
        remainingCostPerShareTooltipResult: (totalPrice, capitalRepayments, remainingTotal, shares, perShare) =>
          `Lopuksi: ${totalPrice} - ${capitalRepayments} = ${remainingTotal}. ${remainingTotal} / ${shares} osaketta = ${perShare}.`,
      },
      summary: {
        totalShares: 'Osakkeita yhteens\xE4',
        vestedShares: 'Ansaintajakson p\xE4\xE4tt\xE4neet osakkeet',
        unvestedShares: 'Ansaintajakson piiriss\xE4 olevat osakkeet',
        vestedSharesAtDate: (date) => `Ansaintajakson p\xE4\xE4tt\xE4neet osakkeet (${date})`,
        unvestedSharesAtDate: (date) => `Ansaintajakson piiriss\xE4 olevat osakkeet (${date})`,
      },
      history: {
        show: 'Tapahtumat',
        hide: 'Sulje tapahtumat',
        empty: 'Ei tapahtumia',
        fields: {
          date: 'P\xE4iv\xE4',
          event: 'Tapahtuma',
          shareCount: 'Osakkeita',
          shareCost: 'Hankintameno',
          pricePerShare: 'Hankintameno / osake',
          details: 'Vaikutus',
        },
        events: {
          subscription: 'Merkint\xE4',
          split: 'Split',
          demerger: 'Yrityksen jakautuminen',
          sell: 'Myynti',
          capitalRepayment: 'P\xE4\xE4omanpalautus',
        },
        details: {
          subscription: (shares, totalPrice, pricePerShare) =>
            `${shares} osaketta, hankintameno yhteens\xE4 ${totalPrice}, ${pricePerShare} / osake`,
          split: (beforeShares, multiplier2, afterShares) =>
            `${beforeShares} osaketta x ${multiplier2} = ${afterShares} osaketta`,
          demerger: (beforeTotalPrice, ratio, afterTotalPrice) => `${beforeTotalPrice} x ${ratio} = ${afterTotalPrice}`,
          sell: (soldShares, sellPrice, pricePerShare) =>
            `Myyty ${soldShares} osaketta, myyntihinta yhteens\xE4 ${sellPrice} (${pricePerShare} / osake). Osakkeiden m\xE4\xE4r\xE4 pieneni, hankintameno / osake pysyi samana.`,
          capitalRepaymentAppliedOnly: (inputPerShare, shares, appliedPerShare, appliedTotal) =>
            `P\xE4\xE4omanpalautus ${appliedPerShare} / osake * ${shares} osaketta = ${appliedTotal}.`,
          capitalRepaymentAppliedAndDividend: (
            inputPerShare,
            shares,
            appliedPerShare,
            appliedTotal,
            dividendPerShare,
            dividendTotal,
            reason
          ) =>
            `P\xE4\xE4omanpalautus ${inputPerShare} / osake. ${reason}. P\xE4\xE4omanpalautuksena ${appliedPerShare} / osake = ${appliedTotal}. Osinkona ${dividendPerShare} / osake = ${dividendTotal}.`,
          capitalRepaymentDividendOnly: (inputPerShare, shares, dividendPerShare, dividendTotal, reason) =>
            `P\xE4\xE4omanpalautus ${inputPerShare} / osake x ${shares} osaketta. Osinkona ${dividendPerShare} / osake = ${dividendTotal} (${reason}).`,
        },
      },
      actions: {
        add: 'Lis\xE4\xE4 merkint\xE4',
      },
    },
    cashDistributions: {
      title: 'Osingot ja p\xE4\xE4omanpalautukset',
      help: 'Yhteens\xE4 ja maksettu k\xE4teisen\xE4 lasketaan automaattisesti osakekohtaisen m\xE4\xE4r\xE4n, omistuksen ja ennakonpid\xE4tyksen perusteella.',
      fields: {
        shareCount: 'Osakkeita yhteens\xE4',
        amountPerShare: '\u20AC/osake',
        withholding: 'Ennakko verottajalle',
        withholdingHelp:
          'T\xE4m\xE4 on laskurin arvioima ennakonpid\xE4tys, jonka yhti\xF6 pid\xE4tt\xE4\xE4 varojenjaosta verottajalle ennen maksua. IPO-p\xE4iv\xE4n\xE4 tai sen j\xE4lkeen laskuri k\xE4sittelee varojenjaon listatun yhti\xF6n osinkona. Ennen IPO:ta ennakonpid\xE4tys lasketaan vain siit\xE4 osasta, joka verotetaan osinkona eik\xE4 p\xE4\xE4omanpalautuksena.',
        cashPaid: 'Maksettu k\xE4teisen\xE4',
        cashPaidHelp:
          'T\xE4m\xE4 on osakkaalle maksettava nettok\xE4teinen varojenjaosta sen j\xE4lkeen, kun ennakko verottajalle on v\xE4hennetty. Laskurissa summa lasketaan kaavalla yhteens\xE4 minus ennakko verottajalle.',
        capitalRepayment: 'P\xE4\xE4omanpalautus',
        capitalRepaymentHelp:
          'T\xE4t\xE4 arvoa k\xE4ytet\xE4\xE4n vuositason verolaskennassa erottamaan se osa varojenjaosta, joka k\xE4sitell\xE4\xE4n p\xE4\xE4omanpalautuksena eik\xE4 osinkona.',
        capitalRepaymentSharesHelp: (shares) =>
          `T\xE4m\xE4n rivin p\xE4\xE4omanpalautus lasketaan ${shares} osakkeelle.`,
        dividend: 'Osinko',
        dividendHelp:
          'T\xE4t\xE4 arvoa k\xE4ytet\xE4\xE4n vuositason verolaskennassa osingon veronalaisen ja verovapaan osuuden sek\xE4 ennakonpid\xE4tyksen laskentaan.',
        dividendSharesHelp: (shares) => `T\xE4m\xE4n rivin osinko lasketaan ${shares} osakkeelle.`,
      },
      actions: {
        add: 'Lis\xE4\xE4 varojenjako',
      },
      types: {
        capitalReturn: 'P\xE4\xE4omanpalautus',
        dividend: 'Osinko',
      },
      messages: {
        shareCountMismatch: (expected, given) =>
          `Osakem\xE4\xE4r\xE4 ei t\xE4sm\xE4\xE4 merkint\xF6ihin t\xE4ll\xE4 p\xE4iv\xE4ll\xE4. Odotettu ${expected}, annettu ${given}.`,
      },
    },
    sells: {
      title: 'Osakkeiden myynnit',
      help: 'Sy\xF6t\xE4 toteutuneet myynnit aikaj\xE4rjestyksess\xE4. Myynti v\xE4hent\xE4\xE4 my\xF6hempien p\xE4ivien j\xE4ljell\xE4 olevia osakkeita ja hankintamenoa FIFO-periaatteella.',
      fields: {
        shareCount: 'Myytyj\xE4 osakkeita',
        pricePerShare: 'Myyntihinta / osake',
        otherTotalSellCosts: 'Muut kulut',
      },
      actions: {
        add: 'Lis\xE4\xE4 myynti',
      },
    },
    shareSplits: {
      title: 'Osakesplitit',
      help: 'Sy\xF6t\xE4 splitin p\xE4iv\xE4 ja kerroin. Kerroin 2 tarkoittaa, ett\xE4 yksi vanha osake muuttuu kahdeksi. Kerroin 0,5 tarkoittaa, ett\xE4 kaksi vanhaa osaketta yhdistyy yhdeksi.',
      fields: {
        multiplier: 'Osakkeita / vanha osake',
        exampleEffect: 'Esimerkki',
        exampleEffectValue: (multiplier2) => `100 osaketta -> ${multiplier2} osaketta`,
      },
      actions: {
        add: 'Lis\xE4\xE4 split',
      },
    },
    demergers: {
      title: 'Yrityksen jakautuminen hankintamenon mukaan',
      help: 'Sy\xF6t\xE4 jakautumisen p\xE4iv\xE4 ja se desimaaliosuus, joka j\xE4\xE4 t\xE4m\xE4n laskurin seuraaman vanhan yhti\xF6n hankintamenoksi. Esimerkiksi 0,72 tarkoittaa, ett\xE4 72 % hankintamenosta j\xE4\xE4 vanhalle yhti\xF6lle ja loput siirtyv\xE4t uudelle yhti\xF6lle. K\xE4yt\xE4 yhti\xF6n tai verotusohjeen ilmoittamaa jakosuhdetta: se perustuu yleens\xE4 nettovarallisuuksien suhteeseen, mutta jos se poikkeaa olennaisesti osakkeiden k\xE4ypien arvojen suhteesta, k\xE4ytet\xE4\xE4n k\xE4ypien arvojen suhdetta.',
      fields: {
        oldCompanyRatio: 'Vanhan yhti\xF6n osuus hankintamenosta',
        exampleEffect: 'Esimerkki',
        exampleEffectValue: (ratio, oldCompany, newCompany) =>
          `10,00 \u20AC -> vanha yhti\xF6 ${oldCompany}, uusi yhti\xF6 ${newCompany}`,
      },
      actions: {
        add: 'Lis\xE4\xE4 jakautuminen',
      },
    },
    ipo: {
      title: 'IPO-tiedot ja arvionti',
      sections: {
        currentCompany: 'Listaamattoman yrityksen nykyiset tiedot',
        sharePriceEstimate: 'Osakkeen hinnan arviointi yrityksen hinnan perusteella',
        ipoCostEstimate: 'Ipo-kulu per osake arviointi',
      },
      fields: {
        totalShareCount: 'Osakkeiden kokonaism\xE4\xE4r\xE4',
        totalIpoCost: 'IPO-kulut yhteens\xE4',
        currentShareValue: 'Nykyinen osakkeen arvo',
        currentTotalValue: 'Nykyinen kokonaisarvo',
        estimatedPreIpoValue: 'Arvioitu pre-IPO-arvo',
        ipoSharePrice: 'IPO-hinta / osake',
        increasePercent: 'Nousu %',
        increaseMultiplier: 'Kerroin',
        secondarySellPercent: 'Arvioitu secondary-myynti %',
      },
      help: {
        secondary: 'K\xE4ytet\xE4\xE4n IPO-kulun allokointiin per myyty osake.',
      },
    },
    mathematicalShareValues: {
      title: 'Matemaattinen arvo / osake tunnetuille vuosille',
      fields: {
        year: 'Vuosi',
        valuePerShare: 'Arvo / osake',
      },
      actions: {
        add: 'Lis\xE4\xE4 vuosi',
      },
    },
    summary: {
      title: 'Yhteenveto',
      cards: {
        subscribedShares: 'Merkittyj\xE4 osakkeita ja omistusosuus',
        subscribedCost: 'Merkint\xF6jen hankintameno',
        ipoPricePerShare: 'IPO-hinta / osake',
        currentValuePerShare: 'Nykyarvo / osake',
        ipoCostPerSecondaryShare: 'IPO-kulu / secondary-osake',
        secondarySharesTotal: 'Secondary-osakkeita yhteens\xE4',
      },
      allocationByLot: {
        title: 'Myynnin kohdistus merkint\xE4erille',
        fields: {
          distribution: 'Varojenjako',
          shares: 'Osakkeita',
          remainingPerShare: 'J\xE4ljell\xE4 / osake',
        },
      },
      ipoSell: {
        title: 'IPO-myynnin tiedot',
        fields: {
          sharesToSell: 'Myyt\xE4vien osakkeiden m\xE4\xE4r\xE4',
          sharesToSellShareOfSellable: (share) => `${share} myyt\xE4viss\xE4 IPOssa`,
          ipoPricePerShare: 'IPO-hinta / osake',
          ipoCostPerShare: 'Ipo-kulu per osake',
          ipoPriceTotal: 'IPO-hinta yhteens\xE4',
          actualCosts: 'Todelliset kulut',
          hmo: 'Hankintameno-olettama',
          capitalGain: 'Luovutusvoitto',
        },
        summaryTitle: 'IPOn yhteenveto',
        cards: {
          grossSale: 'Myynti brutto',
          netCash: 'K\xE4teen',
          taxMan: 'Verottajalle',
          ipoCostsAllocated: 'Kohdistetut IPO-kulut',
          taxableCapitalGain: 'Verotettava luovutusvoitto',
          sharesLeft: 'Osakkeita j\xE4ljelle',
          sellableShares: 'Myyt\xE4viss\xE4 IPOssa',
          unvestedShares: 'Ei myyt\xE4viss\xE4 IPOssa',
          sellableSharesAtDate: (date) => `Myyt\xE4viss\xE4 IPOssa (${date})`,
          unvestedSharesAtDate: (date) => `Ei myyt\xE4viss\xE4 IPOssa (${date})`,
        },
        explanations: {
          title: 'Osakkeiden myyntihinta ja kulut',
          ipoPriceTotal: 'IPO-hinta yhteens\xE4',
          ipoCostsAllocated: 'Kohdistetut IPO-kulut',
          netCash: 'K\xE4teen ennen veroja',
          capitalGain: 'Luovutusvoitto IPOsta',
          selectedDeductions: 'Luovutusvoittoa pienent\xE4v\xE4t v\xE4hennykset',
          taxOnCapitalGain: 'Veroihin varattava: arvioitu p\xE4\xE4omatulovero luovutusvoitosta',
          deductibleIpoCosts: 'Todellisten kulujen IPO-kulujen vaikutus verotuksessa',
          hmoIpoCosts: 'Hallintameno-olettamuksen kanssa IPO-kuluja ei huomioida',
          ipoPriceTotalHelp: (gross) => `IPO-hinta yhteens\xE4 on kaikkien myytyjen osakkeiden bruttohinta ${gross}.`,
          ipoCostsAllocatedHelp: (ipoCosts) =>
            `Kohdistetut IPO-kulut ${ipoCosts} v\xE4hennet\xE4\xE4n osakkeiden myyntihinnasta. Ne voivat olla v\xE4litt\xE4j\xE4n kuluja yms. Niiden osakkeiden osalta joiden kohdalla k\xE4ytet\xE4\xE4n todellisia kuluja, kohdistetut IPO-kulut lis\xE4t\xE4\xE4n osakekohtaisesti todellisiin kuluihin t\xE4ss\xE4 laskurissa.`,
          netCashHelp: (gross, ipoCosts, net) =>
            `K\xE4teen ennen vuotuista verotusta = IPO-hinta yhteens\xE4 ${gross} - kohdistetut IPO-kulut ${ipoCosts} = ${net}.`,
          capitalGainHelp: (gross, acquisitionCosts) =>
            `Luovutusvoitto lasketaan v\xE4hent\xE4m\xE4ll\xE4 "IPO-hinta yhteens\xE4" summasta "Luovutusvoittoa pienent\xE4v\xE4t v\xE4hennykset": ${gross} - ${acquisitionCosts}.`,
          selectedDeductionsHelp: (actual, hmo) => `Todelliset kulut ${actual} + hankintameno-olettama ${hmo}.`,
          taxOnCapitalGainHelp: (capitalGain, lowPart, highPart, tax) =>
            `Luovutusvoitto ${capitalGain} on t\xE4ss\xE4 laskurissa verotettavaa p\xE4\xE4omatuloa. Vuoden 2026 arvioitu p\xE4\xE4omatulovero on 30 % ensimm\xE4isest\xE4 30 000 eurosta (${lowPart}) ja 34 % sen ylitt\xE4v\xE4st\xE4 osasta (${highPart}). Veroihin varattava arvioitu p\xE4\xE4omatulovero on yhteens\xE4 ${tax}.`,
          deductibleIpoCostsHelp: (ipoCosts, taxSaved) =>
            `Todellisiin kuluihin sis\xE4ltyy IPO-kuluja ${ipoCosts}, mik\xE4 pienent\xE4\xE4 arvioitua veroa ${taxSaved}.`,
          hmoIpoCostsHelp: () => 'HMO-eriss\xE4 IPO-kuluja ei voi merkit\xE4 v\xE4hennyksiksi.',
        },
        capitalGainAnnualTax: {
          title: 'Luovutusvoiton laskeminen ja verottaminen vuositasolla',
          driversTitle: 'Voitot ja tappiot osakemyynneiss\xE4 vuositasolla',
          driversValue: '',
          driversHelp:
            'Vuosittaisessa verotuksessa kaikki luovutusvoitot ja luovutustappiot lasketaan lopuksi yhteen ja kertyneen "Luovutusvoiton" m\xE4\xE4r\xE4 m\xE4\xE4ritt\xE4\xE4 "Luovutusvoiton veron" m\xE4\xE4r\xE4n. Seuraavaksi lasketaan kuinka paljon "Luovutusvoiton veroa" muodostuu jos t\xE4m\xE4 on ainoa osakekauppa mit\xE4 teet.',
        },
        cashReserve: {
          title: 'Tilille j\xE4\xE4v\xE4 raha ja veroihin varattava osuus',
          otherAnnualCapitalGainsOrLosses: 'Muut luovutusvoitot tai tappiot',
          otherAnnualCapitalGainsOrLossesHelp:
            'Sy\xF6t\xE4 kentt\xE4\xE4n muut mahdolliset luovutusvoitot ja tappiot ja niiden yhteisarvo',
          annualAdjustmentTitle: 'Muiden luovutusvoittojen tai -tappioiden vaikutus vuositasolla',
          annualAdjustedKeepAfterTaxes: 'Tilille voi j\xE4tt\xE4\xE4 vuositasolla',
          annualAdjustedReserveForTaxes: 'Veroihin varattava vuositasolla',
          keepAfterTaxes: 'Tilille voi j\xE4tt\xE4\xE4',
          remainingShares: 'Myym\xE4tt\xE4 j\xE4\xE4v\xE4t osakkeet',
          remainingSharesTotalLine: (shares, value) => `Yhteens\xE4: ${shares} osaketta, arvo ${value}`,
          remainingSharesVestedLine: (shares, value) => `Myyt\xE4viss\xE4 nyt: ${shares} osaketta, arvo ${value}`,
          remainingSharesUnvestedLine: (shares, ipoValue, originalAcquisitionCost) =>
            `Ansaintajakson piiriss\xE4: ${shares} osaketta, arvo IPO-hinnalla ${ipoValue}, alkuper\xE4inen hankintameno ${originalAcquisitionCost}`,
          reserveForTaxes: 'Veroihin varattava',
          taxEffectFromOtherAnnualCapital:
            'Muiden luovutusvoittojen tai -tappioiden vaikutus veron m\xE4\xE4r\xE4\xE4n',
          taxPaymentStatus: 'Perit\xE4\xE4nk\xF6 vero automaattisesti?',
          taxPaymentManual: 'Ei yleens\xE4 automaattisesti',
          keepAfterTaxesHelp: (cash, tax, kept) =>
            `Tilille j\xE4\xE4v\xE4 summa = k\xE4teen ${cash} - veroihin varattava osuus ${tax} = ${kept}.`,
          remainingSharesHelp: (shareValue, totalValue) =>
            `Arvo ${totalValue} on laskettu IPO-hinnalla ${shareValue} / osake.`,
          reserveForTaxesHelp: (tax) =>
            `Arvioitu vero ${tax} kannattaa varata erikseen, jotta vuotuinen verotus ei aiheuta yll\xE4tt\xE4v\xE4\xE4 maksua.`,
          taxEffectFromOtherAnnualCapitalHelp: (other, reduction, increase) =>
            `Sy\xF6tetty muutos ${other}. Negatiivinen arvo pienent\xE4\xE4 veroarviota ${reduction}. Positiivinen arvo kasvattaa veroarviota ${increase}. Tappiolla olevien osakkeiden myynti voi pienent\xE4\xE4 veroa, mutta v\xE4lit\xF6nt\xE4 takaisinostoa ei kannata tehd\xE4 pelk\xE4st\xE4\xE4n verotussyyst\xE4 ilman ammattilaisen arviota.`,
          annualAdjustedKeepAfterTaxesHelp: (cash, tax, kept) =>
            `Vuositasolla tilille j\xE4\xE4v\xE4 summa = k\xE4teen ${cash} - vuositasolla veroihin varattava osuus ${tax} = ${kept}.`,
          annualAdjustedReserveForTaxesHelp: (tax) =>
            `Kun muut luovutusvoitot tai luovutustappiot huomioidaan, vuositasolla varattava vero on ${tax}.`,
          taxPaymentStatusHelp:
            'Verohallinnon ohjeen mukaan osakkeiden myyntivoiton verosta pit\xE4\xE4 yleens\xE4 huolehtia itse ennakkoverona tai lis\xE4ennakkona. Osingosta ennakonpid\xE4tys tehd\xE4\xE4n erikseen, mutta myyntivoitosta ei yleens\xE4 pid\xE4tet\xE4 veroa automaattisesti.',
        },
        saleResultComparison: {
          title: 'Merkint\xE4kulut ja nettotulos',
          cardTitle: 'Myytyjen osakkeiden hankintameno ja nettotulos',
          value: (original, gain, percent) =>
            `Alkuper\xE4inen hankintameno ${original}, nettotulos ${gain} (${percent}).`,
          help: (original, kept, gain, percent) =>
            `Myynniss\xE4 k\xE4ytettyjen merkint\xE4erien alkuper\xE4inen hankintameno on ${original}. Tilille voi j\xE4tt\xE4\xE4 ${kept}, joten nettotulos k\xE4ytettyihin merkint\xE4eriin n\xE4hden on ${gain} (${percent}).`,
        },
        ipoCostEffects: {
          title: 'IPO-kulujen vaikutus',
        },
        tooltips: {
          actualCosts: (realCostBasis, allocatedIpoCost, total) =>
            `Todelliset kulut = j\xE4\xE4nn\xF6shankintameno ${realCostBasis} + kohdistettu IPO-kulu ${allocatedIpoCost} = ${total}.`,
          hmo: (gross, rate, deduction) =>
            `Hankintameno-olettama = IPO-hinta yhteens\xE4 ${gross} x ${rate} = ${deduction}.`,
        },
      },
      totalRow: 'Yhteens\xE4',
    },
    taxReturns: {
      title: 'Yhteenveto veroilmoituksista',
      yearWarningMissingMathValue: 'Osinkoverotuksen jakoa ei voitu laskea ilman vuoden matemaattista arvoa / osake.',
      sections: {
        assets: 'Omaisuus',
        unlisted: 'Listaamaton yhti\xF6',
        unlistedHelp:
          'T\xE4ss\xE4 osiossa n\xE4kyv\xE4t ennen IPO-p\xE4iv\xE4\xE4 saadut varojenjaot, jotka t\xE4m\xE4n laskurin mukaan kuuluvat muun kuin julkisesti noteeratun yhti\xF6n tietoihin. Tarkista, ett\xE4 tiedot n\xE4kyv\xE4t esit\xE4ytetyll\xE4 veroilmoituksella. Jos tietoja puuttuu tai ne ovat v\xE4\xE4rin, korjaa ne OmaVerossa.',
        listed: 'Listattu yhti\xF6',
        allocationSummary: 'Merkint\xE4eritt\xE4in yhteenveto',
        allocationDetails: 'Varojenjako merkint\xE4eritt\xE4in',
        ipoSale: 'Luovutusvoitot ja -tappiot',
      },
      actions: {
        showAllocationDetails: 'N\xE4yt\xE4 p\xE4\xE4omapalautukset merkint\xE4eritt\xE4in',
        hideAllocationDetails: 'Piilota p\xE4\xE4omapalautukset merkint\xE4eritt\xE4in',
      },
      fields: {
        sharesHeld: 'Osakkeita vuoden lopussa',
        distributionShares: 'Osakkeita',
        distributionSharesTotal: 'Yhteens\xE4',
        distributionSharesCapitalRepayment: 'P\xE4\xE4omanpalautus',
        distributionSharesDividend: 'Osinko',
        mathematicalShareValuePerShare: 'Matemaattinen arvo / osake',
        shareholderMathematicalValue: 'Osakkaan matemaattinen arvo',
        remainingAcquisitionCost: 'J\xE4ljell\xE4 oleva hankintameno',
        taxableCapitalIncome: 'Veronalaista p\xE4\xE4omatuloa',
        taxFreeCapitalIncome: 'Verotonta p\xE4\xE4omatuloa',
        taxableEarnedDividend: 'Veronalaista ansiotulo-osinkoa',
        taxFreeEarnedDividend: 'Verotonta ansiotulo-osinkoa',
        ipoSaleAllocation: 'IPO-myynnin tiedot',
        acquisitionDate: 'Hankintap\xE4iv\xE4',
        sellDate: 'Myyntip\xE4iv\xE4',
        soldShares: 'Myytyj\xE4 osakkeita',
        grossSale: 'Myyntihinta yhteens\xE4',
        actualDeduction: 'Todelliset kulut',
        hankintamenoOlettaDeduction: 'Hankintameno-olettama',
        selectedMethod: 'Valittu v\xE4hennys',
        selectedDeduction: 'V\xE4hennys yhteens\xE4',
        taxableCapitalGainWithLoss: 'Luovutusvoitto tai -tappio',
        selectedMethodActualCosts: 'Todelliset kulut',
        selectedMethodHmo: 'Hankintameno-olettama',
        subscriptionDate: 'Merkint\xE4p\xE4iv\xE4',
        allocationDistributionCount: 'Varojenjakoja',
        allocationShares: 'Osakkeita',
        allocationGross: 'Varojenjako yhteens\xE4',
        allocationCapitalRepayment: 'P\xE4\xE4omanpalautus',
        allocationDividend: 'Osinko',
        allocationRemainingCostPerShareAfter: 'J\xE4ljell\xE4 / osake j\xE4lkeen',
        unlistedCapitalRepaymentHelp:
          'T\xE4m\xE4 osa on luovutuksena verotettavaa p\xE4\xE4omanpalautusta, ei osinkoa. Tarkista, ett\xE4 se n\xE4kyy esit\xE4ytetyll\xE4 veroilmoituksella p\xE4\xE4omanpalautuksena. Jos tieto puuttuu, ilmoita tai korjaa se OmaVerossa arvopaperien luovutuksena.',
        unlistedDividendHelp:
          'T\xE4m\xE4 osa ilmoitetaan muun kuin julkisesti noteeratun yhti\xF6n osinkona. Tarkista esit\xE4ytetty veroilmoitus. Jos tieto puuttuu, lis\xE4\xE4 OmaVerossa uusi osinkotulo ja valitse listaamaton yhti\xF6.',
        listedDividendHelp:
          'T\xE4m\xE4 osa ilmoitetaan listatun yhti\xF6n osinkona. Tarkista esit\xE4ytetty veroilmoitus. Jos tieto puuttuu, lis\xE4\xE4 OmaVerossa uusi osinkotulo ja valitse listattu yhti\xF6.',
      },
    },
    storage: {
      title: 'Tallennus',
      actions: {
        saveToBrowserStorage: 'Tallenna selaimeen pysyv\xE4sti',
        loadFromBrowserStorage: 'Lataa selaimesta',
        removeFromBrowserStorage: 'Poista selaimesta',
        copyShareUrl: 'Kopioi yrityksen tiedot URL:iin',
        saveFile: 'Tallenna tiedosto',
        saveCompanyFile: 'Tallenna yrityksen tiedot tiedostoon',
        loadFile: 'Lataa tiedosto',
        showSmallExample: 'Pienomistaja, 2v',
        showMediumExample: 'Medium, 8v',
        showLargeExample: 'Large, 16v',
        clearExample: 'Tyhjenn\xE4',
      },
      table: {
        rowTitle: 'Toiminto',
        descriptionTitle: 'Kuvaus',
        actionsTitle: 'Painikkeet',
        autoSaveTitle: 'Automaattinen tallennus',
        autoSaveDescription:
          'Sovellus tallentaa sy\xF6tteet automaattisesti selainikkunan omaan tallennustilaan, joten sivun p\xE4ivitys s\xE4ilytt\xE4\xE4 tiedot. Jos selainikkuna suljetaan, n\xE4m\xE4 tiedot katoavat.',
        fileTitle: 'Tallenna tiedosto tietokoneelle',
        fileDescription: 'Voit ladata sy\xF6tetyt tiedot tietokoneellesi JSON tiedostona.',
        browserTitle: 'Tallenna tiedot selaimeen',
        browserDescription:
          'Voit tallentaa tiedot selaimen muistiin. Tieto tulee automaattisesti k\xE4ytt\xF6\xF6n jos sivu ladataan uuteen selainikkunaan.',
        clearTitle: 'Tyhjenn\xE4 luvut',
        clearDescription:
          'Voit tyhjent\xE4\xE4 sy\xF6tetyt lukemat, mutta se ei poista selaimeen talletettua tietoa tai ladattuja tiedostoja.',
        shareUrlTitle: 'Kopioi yrityksen tiedot urliin',
        exampleTitle: 'N\xE4yt\xE4 esimerkki-tilanne',
        exampleDescription: 'Voit tutkia milt\xE4 sovellus n\xE4ytt\xE4\xE4 esimerkkidatalla.',
      },
      copyShareUrlHelp: 'T\xE4ll\xE4 voi jakaa yhti\xF6n tiedot ja varojenjaot toisille.',
      copyShareUrlNote: 'Huom: URL-osoitteissa v\xE4litetyt tiedot voivat n\xE4ky\xE4 muille.',
      timestamps: {
        companyData: 'Yrityksen tiedot p\xE4ivitetty',
        userData: 'K\xE4ytt\xE4j\xE4n tiedot p\xE4ivitetty',
        unavailable: '-',
      },
      status: {
        saved: 'Tallennettu automaattisesti',
        browserSaved: 'Tallennettu selaimeen pysyv\xE4sti',
        browserLoaded: 'Ladattu selaimen pysyv\xE4st\xE4 tallennuksesta',
        browserRemoved: 'Selaimen pysyv\xE4 tallennus poistettu',
        shareUrlCopied: 'URL kopioitu',
        loaded: 'Ladattu',
        exampleShown: 'Esimerkki n\xE4ytetty',
        exampleCleared: 'Esimerkkidata poistettu',
        fileSaved: 'Tiedosto tallennettu',
      },
      errors: {
        invalidFile: 'Virheellinen tiedosto',
        fileReadFailed: 'Tiedoston luku ep\xE4onnistui',
        clipboardFailed: 'Kopiointi ep\xE4onnistui',
        shareUrlUnavailable: 'URL-jako ei ole tuettu t\xE4ss\xE4 selaimessa.',
        shareUrlLoadFailed: 'Jaetun URL:n avaus ep\xE4onnistui.',
      },
      confirmations: {
        clearExample: 'Tyhjennet\xE4\xE4nk\xF6 kaikki nykyiset tiedot?',
      },
      saveIndicators: {
        browserNeedsSave:
          'Sy\xF6tteit\xE4 on muutettu eik\xE4 niit\xE4 ole tallennettu selaimen pysyv\xE4\xE4n tallennukseen.',
        browserSaved: 'Selaimen pysyv\xE4 tallennus on ajan tasalla.',
        browserLoadUnavailable: 'Selaimen pysyv\xE4ss\xE4 tallennuksessa ei ole tietoja ladattavaksi.',
        fileNeedsSave: 'Sy\xF6tteit\xE4 on muutettu eik\xE4 niit\xE4 ole tallennettu tiedostoon t\xE4ss\xE4 ikkunassa.',
        fileSaved: 'Tiedostotallennus on ajan tasalla t\xE4ss\xE4 ikkunassa.',
      },
    },
    messages: {
      errorsTitle: 'Sy\xF6tteiss\xE4 on korjattavaa',
      warningsTitle: 'Huomiot',
    },
    sources: {
      dividends: 'Verohallinto: Osingot listaamattomasta yhti\xF6st\xE4',
      listedDividends: 'Verohallinto: Osingot listatusta yhti\xF6st\xE4',
      demergerAcquisitionCost: 'Verohallinto: Arvopaperien luovutusten verotus - jakautuminen',
      demergers: 'Verohallinto: Yritysj\xE4rjestelyt ja verotus - jakautuminen',
      reporting: 'Verohallinto: Esit\xE4ytetty veroilmoitus - n\xE4in ilmoitat OmaVerossa tai paperilla',
      form9a: 'Verohallinto: 9A t\xE4ytt\xF6ohje',
      sales: 'Verohallinto: Osakkeiden myynti',
    },
    calculator: {
      validation: {
        negative: (field) => `${field} ei voi olla negatiivinen.`,
        invalidNumber: (field) => `${field} ei ole kelvollinen numero.`,
        invalidDate: (field) => `${field} ei ole kelvollinen pvm.`,
      },
      fields: {
        subscriptionAmount: (label2) => `Merkint\xE4 ${label2} m\xE4\xE4r\xE4`,
        subscriptionPricePerShare: (label2) => `Merkint\xE4 ${label2} hinta/osake`,
        subscriptionOtherTotalAcquisitionCosts: (label2) => `Merkint\xE4 ${label2} muut hankintamenot`,
        subscriptionDate: (id) => `Merkint\xE4 ${id} p\xE4iv\xE4`,
        subscriptionVestingEndsOn: (id) => `Merkint\xE4 ${id} ansaintajakso p\xE4\xE4ttyy`,
        mathematicalShareValueYear: (id) => `Matemaattinen arvo vuosi ${id}`,
        mathematicalShareValuePerShare: (id) => `Matemaattinen arvo/osake ${id}`,
        becameListedDate: 'Listautumisp\xE4iv\xE4',
        totalShareCount: 'Osakkeiden kokonaism\xE4\xE4r\xE4',
        totalIpoCost: 'IPO-kulut yhteens\xE4',
        currentShareValue: 'Nykyinen osakkeen arvo',
        estimatedPreIpoValue: 'Arvioitu pre-IPO-arvo',
        estimatedSecondaryShareSellPercentage: 'Arvioitu secondary-myyntiprosentti',
        ipoSellAmount: 'Myyt\xE4vien osakkeiden m\xE4\xE4r\xE4',
        ipoSellPricePerShare: 'IPO-myynnin hinta / osake',
        ipoSellCostPerShare: 'IPO-myynnin kulu / osake',
        otherAnnualCapitalGainsOrLosses: 'Muut luovutusvoitot tai tappiot',
        cashDistributionDate: (id) => `Varojenjako ${id} p\xE4iv\xE4`,
        cashDistributionAmountPerShare: (id) => `Varojenjako ${id} \u20AC/osake`,
        shareSplitDate: (id) => `Split ${id} p\xE4iv\xE4`,
        shareSplitMultiplier: (id) => `Split ${id} kerroin`,
        demergerDate: (id) => `Jakautuminen ${id} p\xE4iv\xE4`,
        demergerOldCompanyRatio: (id) => `Jakautuminen ${id} vanhan yhti\xF6n osuus`,
      },
      warnings: {
        totalShareCountBelowSubscriptions:
          'Osakkeiden kokonaism\xE4\xE4r\xE4 on pienempi kuin sy\xF6tettyjen merkint\xF6jen yhteism\xE4\xE4r\xE4.',
        secondarySellPercentZero:
          'Secondary-myyntiprosentti on 0, joten IPO-kulu/osake on jaettu koko osakem\xE4\xE4r\xE4lle.',
        noSharesHeldForDistribution: (date) => `Varojenjaolle ${date} ei l\xF6ytynyt omistettuja osakkeita.`,
        unsupportedYearRange: (year) =>
          `Vuositason vero-, osinko- ja p\xE4\xE4omanpalautuslaskenta on tuettu verovuosille 2016 ja sit\xE4 uudemmille. Sy\xF6tteiss\xE4 on vuosi ${year}.`,
        ipoSellAmountExceedsEstimatedSecondary:
          'Myyntim\xE4\xE4r\xE4 ylitt\xE4\xE4 arvioidun secondary-myyntim\xE4\xE4r\xE4n koko yhti\xF6n tasolla.',
        vestingBlockedWithoutIpoDate:
          'Listautumisp\xE4iv\xE4 puuttuu, joten ansaintajakson rajoittamia merkint\xE4eri\xE4 ei voitu ottaa mukaan myyntiin.',
      },
      errors: {
        ipoSellPricePerShareRequired:
          'IPO-hinta / osake pit\xE4\xE4 sy\xF6tt\xE4\xE4 ennen kuin IPO-myynnin arvot voidaan laskea.',
        ipoSellAmountExceedsSellable: (shares) =>
          `Myyt\xE4vien osakkeiden m\xE4\xE4r\xE4 ylitt\xE4\xE4 listautumisp\xE4iv\xE4n\xE4 myyt\xE4viss\xE4 olevien osakkeiden m\xE4\xE4r\xE4n (${shares}).`,
      },
    },
  }
  var EN = {
    languageSwitch: {
      label: 'Language',
    },
    intro: {
      title: 'IPO calculator for shares',
      description:
        'Calculates how capital repayments are allocated, how acquisition cost remains, and what the IPO sale produces before and after tax.',
      unlistedDescription:
        'This calculator is intended for an unlisted company before listing. From the IPO date onward, distributions are treated as dividends in this view.',
      warningsTitle: 'Warnings',
      warnings: [
        'This calculator has not yet been thoroughly tested by humans.',
        'For real monetary advice, use a professional service. This is not one.',
      ],
      securityTitle: 'Security and disclaimer',
      securityText:
        'This application is open source and free to use, but the developer takes no responsibility of any kind for whether the application is secure, error-free, or free to use.',
      securityAdditionalText: 'This application works only in browser. It does not send your data anywhere.',
      securityNote: 'Note: Any data passed in URLs might be visible to others.',
      securityIssues:
        'If you notice bugs or have improvement ideas, create a simple test case and add the finding at https://github.com/mikko-apo/kotibudjetti/issues',
    },
    common: {
      rows: 'rows',
      date: 'Date',
      amount: 'Amount',
      type: 'Type',
      total: 'Total',
      edit: 'Edit',
      done: 'Done',
      remove: 'Remove',
    },
    company: {
      title: 'Company details',
      help: 'Choose whether the company is currently unlisted or listed. The optional became-listed date acts as the IPO date cutoff in this calculator for distributions and the IPO sale.',
      fields: {
        listingStatus: 'Company status',
        becameListedDate: 'Became listed date',
      },
      options: {
        unlisted: 'Unlisted',
        listed: 'Listed',
      },
    },
    assumptions: {
      title: 'Calculation assumptions',
      items: [
        'Sales are allocated to subscription lots using FIFO.',
        'Before the IPO date, distributions from invested unrestricted equity are treated as capital repayment only to the extent the same shareholder gets back their own investment made within the last 10 years.',
        'On and after the IPO date, distributions are treated as dividends in this calculator.',
        'Tax categories for dividends from an unlisted company are calculated using the entered mathematical value per share for each year.',
        'The deemed acquisition cost is compared separately for each subscription lot used in the sale.',
        'Year-level tax, dividend, and capital-repayment calculations are supported for tax years 2016 and later.',
        'Capital income tax is estimated only for this sale using the 2026 30% / 34% rates.',
      ],
      sourcesLabel: 'Sources: ',
    },
    mainSections: {
      actions: {
        open: 'Open section',
        close: 'Close section',
      },
      units: {
        shares: 'shares',
        taxYears: 'tax years',
        perShare: '/ share',
      },
      groups: {
        subscriptionsAndSales: {
          title: '2. Share subscriptions and sales',
          summary: 'Includes: Share subscriptions, Share sales.',
        },
        distributionsAndCorporateActions: {
          title: '1. Company details: distributions, demergers, and splits',
          summary:
            'Includes: Company status and became-listed date, Dividends and capital repayments, Company demerger by acquisition-cost allocation, Share splits.',
        },
        taxReturns: {
          title: '3. Tax returns',
          summary: 'Includes: Tax returns.',
        },
        ipoCalculator: {
          title: '4. IPO calculator',
          summary: 'Includes: IPO details and estimation, IPO sell details.',
        },
      },
    },
    subscriptions: {
      title: 'Share subscriptions',
      help: 'Enter all subscription lots in acquisition order. FIFO is used for sales, and a vesting period ending after the IPO date blocks that lot from being sold.',
      fields: {
        purchaseDate: 'Purchase date',
        originalShareCount: 'Shares originally',
        remainingShareCountCurrentDate: (date) => `Shares remaining (${date})`,
        vestingEndsOn: 'Vesting ends',
        vestingEndsOnHelp:
          'In this calculator, the vesting period affects two things. 1) If vesting ends only after the IPO date, that lot is not treated as sellable in the IPO. 2) If employment or another plan condition ends before vesting is complete, the company or other shareholders may in practice have a right to buy back or redeem the shares. Legally, vesting alone does not create that result: shares are freely transferable by default unless the articles contain a permitted redemption or consent clause, or unless a separate buyback obligation has been agreed in a shareholders agreement, subscription terms, or an employment-based arrangement. In addition, a company buyback or redemption of its own shares must follow Chapter 15 of the Finnish Companies Act and requires distributable funds.',
        pricePerShare: 'Original price / share',
        otherTotalAcquisitionCosts: 'Other acquisition costs total',
        otherTotalAcquisitionCostsHelp:
          'Enter items such as transfer tax, subscription-related fees, and other acquisition costs. Do not include interest on income-producing debt here; report that in annual taxation under deductions from capital income.',
        totalPricePerShare: 'Total acquisition cost / share',
        totalPricePerShareTooltipBase: (shares, pricePerShare, otherCosts, total) =>
          `Start: (${shares} shares x ${pricePerShare}) + ${otherCosts} = ${total}`,
        totalPricePerShareTooltipDemerger: (date, before, ratio, after) =>
          `${date}: demerger ${before} x ${ratio} = ${after}`,
        totalPricePerShareTooltipSplit: (date, beforeShares, multiplier2, afterShares) =>
          `${date}: split ${beforeShares} shares x ${multiplier2} = ${afterShares} shares`,
        totalPricePerShareTooltipResult: (total, shares, perShare) =>
          `Final: ${total} / ${shares} shares = ${perShare}`,
        capitalRepaymentPerShareTooltipReasonTooOld: 'more than 10 years since subscription',
        capitalRepaymentPerShareTooltipReasonNoRemainingCost: 'remaining acquisition cost is 0',
        capitalRepaymentPerShareTooltipReasonRemainingCostLimit:
          'remaining acquisition cost did not cover the full capital repayment',
        capitalRepaymentPerShareTooltipReasonListedDividend:
          'distribution is on or after the IPO date and is treated as dividend',
        remainingCostPerShare: 'Remaining acquisition cost / share',
        remainingCostPerShareTooltipBase: (totalPrice) => `Start: acquisition cost total ${totalPrice}.`,
        remainingCostPerShareTooltipCapitalRepayment: (date, amountPerShare, shares, total) =>
          `${date}: capital repayment ${amountPerShare} / share x ${shares} shares = ${total}`,
        remainingCostPerShareTooltipResult: (totalPrice, capitalRepayments, remainingTotal, shares, perShare) =>
          `Final: ${totalPrice} - ${capitalRepayments} = ${remainingTotal}. ${remainingTotal} / ${shares} shares = ${perShare}.`,
      },
      summary: {
        totalShares: 'Total shares',
        vestedShares: 'Vested shares',
        unvestedShares: 'Unvested shares',
        vestedSharesAtDate: (date) => `Vested shares (${date})`,
        unvestedSharesAtDate: (date) => `Unvested shares (${date})`,
      },
      history: {
        show: 'Events',
        hide: 'Close events',
        empty: 'No events',
        fields: {
          date: 'Date',
          event: 'Event',
          shareCount: 'Shares',
          shareCost: 'Acquisition cost',
          pricePerShare: 'Acquisition cost / share',
          details: 'Effect',
        },
        events: {
          subscription: 'Subscription',
          split: 'Split',
          demerger: 'Demerger',
          sell: 'Sale',
          capitalRepayment: 'Capital repayment',
        },
        details: {
          subscription: (shares, totalPrice, pricePerShare) =>
            `${shares} shares, acquisition cost total ${totalPrice}, ${pricePerShare} / share`,
          split: (beforeShares, multiplier2, afterShares) =>
            `${beforeShares} shares x ${multiplier2} = ${afterShares} shares`,
          demerger: (beforeTotalPrice, ratio, afterTotalPrice) => `${beforeTotalPrice} x ${ratio} = ${afterTotalPrice}`,
          sell: (soldShares, sellPrice, pricePerShare) =>
            `Sold ${soldShares} shares, sale price total ${sellPrice} (${pricePerShare} / share). Share count decreased, acquisition cost / share stayed the same.`,
          capitalRepaymentAppliedOnly: (inputPerShare, shares, appliedPerShare, appliedTotal) =>
            `Capital repayment ${appliedPerShare} / share * ${shares} shares = ${appliedTotal}.`,
          capitalRepaymentAppliedAndDividend: (
            inputPerShare,
            shares,
            appliedPerShare,
            appliedTotal,
            dividendPerShare,
            dividendTotal,
            reason
          ) =>
            `Capital repayment ${inputPerShare} / share. ${reason}. Capital repayment portion ${appliedPerShare} / share = ${appliedTotal}. Dividend portion ${dividendPerShare} / share = ${dividendTotal}.`,
          capitalRepaymentDividendOnly: (inputPerShare, shares, dividendPerShare, dividendTotal, reason) =>
            `Capital repayment ${inputPerShare} / share x ${shares} shares. Dividend ${dividendPerShare} / share = ${dividendTotal} (${reason}).`,
        },
      },
      actions: {
        add: 'Add subscription',
      },
    },
    cashDistributions: {
      title: 'Dividends and capital repayments',
      help: 'Total amount and cash paid are calculated automatically from the per-share amount, holdings, and withholding.',
      fields: {
        shareCount: 'Total shares',
        amountPerShare: 'EUR / share',
        withholding: 'To tax office in advance',
        withholdingHelp:
          'This is the calculator\u2019s estimate of withholding that the company remits to the tax authority before payment. On and after the IPO date, the calculator treats the distribution as a listed-company dividend. Before the IPO, withholding is calculated only on the part that is taxed as dividend, not as capital repayment.',
        cashPaid: 'Paid in cash',
        cashPaidHelp:
          'This is the net cash paid to the shareholder after the withholding amount has been deducted. In the calculator, the value is total amount minus withholding to the tax authority.',
        capitalRepayment: 'Capital repayment',
        capitalRepaymentHelp:
          'This value is used in the annual tax calculation to separate the part of the distribution that is treated as capital repayment rather than dividend.',
        capitalRepaymentSharesHelp: (shares) =>
          `The capital repayment on this row is calculated using ${shares} shares.`,
        dividend: 'Dividend',
        dividendHelp:
          'This value is used in the annual tax calculation to determine the taxable and tax-free dividend portions and the withholding amount.',
        dividendSharesHelp: (shares) => `The dividend on this row is calculated using ${shares} shares.`,
      },
      actions: {
        add: 'Add distribution',
      },
      types: {
        capitalReturn: 'Capital repayment',
        dividend: 'Dividend',
      },
      messages: {
        shareCountMismatch: (expected, given) =>
          `Share count does not match subscriptions on this date. Expected ${expected}, given ${given}.`,
      },
    },
    sells: {
      title: 'Share sales',
      help: 'Enter completed sales in chronological order. A sale reduces remaining shares and acquisition cost on later dates using FIFO.',
      fields: {
        shareCount: 'Shares sold',
        pricePerShare: 'Sale price / share',
        otherTotalSellCosts: 'Other costs',
      },
      actions: {
        add: 'Add sale',
      },
    },
    shareSplits: {
      title: 'Share splits',
      help: 'Enter the split date and multiplier. A multiplier of 2 means one old share becomes two. A multiplier of 0.5 means two old shares are combined into one.',
      fields: {
        multiplier: 'Shares / old share',
        exampleEffect: 'Example',
        exampleEffectValue: (multiplier2) => `100 shares -> ${multiplier2} shares`,
      },
      actions: {
        add: 'Add split',
      },
    },
    demergers: {
      title: 'Company demerger by acquisition-cost allocation',
      help: 'Enter the demerger date and the decimal portion of acquisition cost that remains with the old company tracked in this calculator. For example, 0.72 means 72% of the acquisition cost remains with the old company and the rest moves to the new company. Use the allocation ratio given by the company or tax guidance: it is usually based on the net-asset ratio, but if that differs materially from the share fair-value ratio, the fair-value ratio is used.',
      fields: {
        oldCompanyRatio: 'Old company share of acquisition cost',
        exampleEffect: 'Example',
        exampleEffectValue: (ratio, oldCompany, newCompany) =>
          `10.00 EUR -> old company ${oldCompany}, new company ${newCompany}`,
      },
      actions: {
        add: 'Add demerger',
      },
    },
    ipo: {
      title: 'IPO details and estimation',
      sections: {
        currentCompany: 'Current details of the unlisted company',
        sharePriceEstimate: 'Share price estimate based on company value',
        ipoCostEstimate: 'IPO cost per share estimate',
      },
      fields: {
        totalShareCount: 'Total share count',
        totalIpoCost: 'Total IPO costs',
        currentShareValue: 'Current share value',
        currentTotalValue: 'Current total value',
        estimatedPreIpoValue: 'Estimated pre-IPO value',
        ipoSharePrice: 'IPO share price',
        increasePercent: 'Increase %',
        increaseMultiplier: 'Multiplier',
        secondarySellPercent: 'Estimated secondary sell %',
      },
      help: {
        secondary: 'Used to allocate IPO cost per sold share.',
      },
    },
    mathematicalShareValues: {
      title: 'Mathematical value / share for known years',
      fields: {
        year: 'Year',
        valuePerShare: 'Value / share',
      },
      actions: {
        add: 'Add year',
      },
    },
    summary: {
      title: 'Summary',
      cards: {
        subscribedShares: 'Subscribed shares and ownership share',
        subscribedCost: 'Subscription acquisition cost',
        ipoPricePerShare: 'IPO price / share',
        currentValuePerShare: 'Current value / share',
        ipoCostPerSecondaryShare: 'IPO cost / secondary share',
        secondarySharesTotal: 'Secondary shares total',
      },
      allocationByLot: {
        title: 'Sale allocation by subscription lot',
        fields: {
          distribution: 'Distribution',
          shares: 'Shares',
          remainingPerShare: 'Remaining / share',
        },
      },
      ipoSell: {
        title: 'IPO sell details',
        fields: {
          sharesToSell: 'Number of shares to sell',
          sharesToSellShareOfSellable: (share) => `${share} sellable at IPO`,
          ipoPricePerShare: 'IPO price / share',
          ipoCostPerShare: 'IPO cost / share',
          ipoPriceTotal: 'Total IPO price',
          actualCosts: 'Actual costs',
          hmo: 'Deemed acquisition cost',
          capitalGain: 'Capital gain',
        },
        summaryTitle: 'IPO summary',
        cards: {
          grossSale: 'Gross sale',
          netCash: 'In cash',
          taxMan: 'To tax man',
          ipoCostsAllocated: 'Allocated IPO costs',
          taxableCapitalGain: 'Taxable capital gain',
          sharesLeft: 'Shares remaining',
          sellableShares: 'Sellable at IPO',
          unvestedShares: 'Not sellable at IPO',
          sellableSharesAtDate: (date) => `Sellable at IPO (${date})`,
          unvestedSharesAtDate: (date) => `Not sellable at IPO (${date})`,
        },
        explanations: {
          title: 'Share sale price and costs',
          ipoPriceTotal: 'Total IPO price',
          ipoCostsAllocated: 'Allocated IPO costs',
          netCash: 'Cash before taxes',
          capitalGain: 'Capital gain from IPO',
          selectedDeductions: 'Deductions reducing capital gain',
          taxOnCapitalGain: 'Reserve for taxes: estimated capital income tax on capital gain',
          deductibleIpoCosts: 'IPO costs inside actual costs',
          hmoIpoCosts: 'IPO costs in HMO lots',
          ipoPriceTotalHelp: (gross) => `Total IPO price is the gross price of all sold shares: ${gross}.`,
          ipoCostsAllocatedHelp: (ipoCosts) =>
            `Allocated IPO costs ${ipoCosts} are deducted from the share sale price. They may include broker fees and similar costs. For the shares where this calculator uses actual costs, the allocated IPO costs are added to the per-share actual costs.`,
          netCashHelp: (gross, ipoCosts, net) =>
            `Cash before annual taxation = total IPO price ${gross} - allocated IPO costs ${ipoCosts} = ${net}.`,
          capitalGainHelp: (gross, acquisitionCosts) =>
            `Capital gain is calculated by subtracting "Deductions reducing capital gain" from "Total IPO price": ${gross} - ${acquisitionCosts}.`,
          selectedDeductionsHelp: (actual, hmo) => `Actual costs ${actual} + deemed acquisition cost ${hmo}.`,
          taxOnCapitalGainHelp: (capitalGain, lowPart, highPart, tax) =>
            `In this calculator, capital gain ${capitalGain} is taxable capital income. Estimated 2026 capital income tax is 30% on the first 30,000 euros (${lowPart}) and 34% on the part above that (${highPart}). The estimated capital income tax to reserve is ${tax}.`,
          deductibleIpoCostsHelp: (ipoCosts, taxSaved) =>
            `Actual-cost lots include IPO costs ${ipoCosts}, reducing estimated tax by ${taxSaved}.`,
          hmoIpoCostsHelp: () => 'In HMO lots, IPO costs cannot be marked as deductions.',
        },
        capitalGainAnnualTax: {
          title: 'Capital gain calculation and annual taxation',
          driversTitle: 'Wins and losses from share sales over the tax year',
          driversValue: '',
          driversHelp:
            'In annual taxation, all capital gains and capital losses are added together at the end, and the resulting amount of "Capital gain" determines the amount of "Capital gain tax". Next, this calculator estimates how much "Capital gain tax" is created if this is the only share sale you make.',
        },
        cashReserve: {
          title: 'Cash you can keep and amount to reserve for taxes',
          otherAnnualCapitalGainsOrLosses: 'Other capital gains or losses',
          otherAnnualCapitalGainsOrLossesHelp:
            'Enter any other possible capital gains and losses and their combined amount in this field',
          annualAdjustmentTitle: 'Effect of other capital gains or losses over the tax year',
          annualAdjustedKeepAfterTaxes: 'Can stay in your account over the tax year',
          annualAdjustedReserveForTaxes: 'Reserve for taxes over the tax year',
          keepAfterTaxes: 'Can stay in your account',
          remainingShares: 'Unsold shares',
          remainingSharesTotalLine: (shares, value) => `Total: ${shares} shares, value ${value}`,
          remainingSharesVestedLine: (shares, value) => `Vested now: ${shares} shares, value ${value}`,
          remainingSharesUnvestedLine: (shares, ipoValue, originalAcquisitionCost) =>
            `Unvested now: ${shares} shares, value at IPO price ${ipoValue}, original acquisition cost ${originalAcquisitionCost}`,
          reserveForTaxes: 'Reserve for taxes',
          taxEffectFromOtherAnnualCapital: 'Effect of other annual capital gains or losses on tax amount',
          taxPaymentStatus: 'Is tax withheld automatically?',
          taxPaymentManual: 'Usually not automatically',
          keepAfterTaxesHelp: (cash, tax, kept) =>
            `Amount left in your account = cash ${cash} - amount reserved for taxes ${tax} = ${kept}.`,
          remainingSharesHelp: (shareValue, totalValue) =>
            `Value ${totalValue} is calculated using the IPO price ${shareValue} / share.`,
          reserveForTaxesHelp: (tax) =>
            `It is prudent to reserve the estimated tax ${tax} separately so annual taxation does not create an unexpected payment.`,
          taxEffectFromOtherAnnualCapitalHelp: (other, reduction, increase) =>
            `Entered change ${other}. A negative value reduces the tax estimate by ${reduction}. A positive value increases the tax estimate by ${increase}. Selling shares that are down can reduce tax, but an immediate buyback should not be done solely for tax reasons without professional advice.`,
          annualAdjustedKeepAfterTaxesHelp: (cash, tax, kept) =>
            `Over the tax year, the amount left in your account = cash ${cash} - tax amount to reserve over the tax year ${tax} = ${kept}.`,
          annualAdjustedReserveForTaxesHelp: (tax) =>
            `After other capital gains or losses are included, the tax amount to reserve over the tax year is ${tax}.`,
          taxPaymentStatusHelp:
            'According to the Finnish Tax Administration, you usually need to take care of tax on share-sale gains yourself as prepayment or additional prepayment. Dividend withholding is handled separately, but share-sale gain tax is usually not withheld automatically.',
        },
        saleResultComparison: {
          title: 'Subscription cost and net result',
          cardTitle: 'Acquisition cost of sold shares and net result',
          value: (original, gain, percent) => `Original acquisition cost ${original}, net result ${gain} (${percent}).`,
          help: (original, kept, gain, percent) =>
            `The original acquisition cost of the subscription lots used in the sale is ${original}. You can keep ${kept}, so the net result against the sold subscription lots is ${gain} (${percent}).`,
        },
        ipoCostEffects: {
          title: 'Effect of IPO costs',
        },
        tooltips: {
          actualCosts: (realCostBasis, allocatedIpoCost, total) =>
            `Actual costs = remaining acquisition cost ${realCostBasis} + allocated IPO cost ${allocatedIpoCost} = ${total}.`,
          hmo: (gross, rate, deduction) =>
            `Deemed acquisition cost = total IPO price ${gross} x ${rate} = ${deduction}.`,
        },
      },
      totalRow: 'Total',
    },
    taxReturns: {
      title: 'Tax return summary',
      yearWarningMissingMathValue:
        'Dividend tax split could not be calculated without the year-specific mathematical value / share.',
      sections: {
        assets: 'Assets',
        unlisted: 'Unlisted company',
        unlistedHelp:
          'This section shows pre-IPO distributions that, in this calculator, belong under non-listed company reporting. Check that the data appears on your pre-completed tax return. If information is missing or incorrect, correct it in MyTax.',
        listed: 'Listed company',
        allocationSummary: 'Summary by subscription lot',
        allocationDetails: 'Distribution by subscription lot',
        ipoSale: 'Capital gains and losses',
      },
      actions: {
        showAllocationDetails: 'Show capital repayments by subscription lot',
        hideAllocationDetails: 'Hide capital repayments by subscription lot',
      },
      fields: {
        sharesHeld: 'Shares at year end',
        distributionShares: 'Shares',
        distributionSharesTotal: 'Total',
        distributionSharesCapitalRepayment: 'Capital repayment',
        distributionSharesDividend: 'Dividend',
        mathematicalShareValuePerShare: 'Mathematical value / share',
        shareholderMathematicalValue: 'Shareholder mathematical value',
        remainingAcquisitionCost: 'Remaining acquisition cost',
        taxableCapitalIncome: 'Taxable capital income',
        taxFreeCapitalIncome: 'Tax-free capital income',
        taxableEarnedDividend: 'Taxable earned-income dividend',
        taxFreeEarnedDividend: 'Tax-free earned-income dividend',
        ipoSaleAllocation: 'IPO sale details',
        acquisitionDate: 'Acquisition date',
        sellDate: 'Sale date',
        soldShares: 'Shares sold',
        grossSale: 'Gross sale',
        actualDeduction: 'Actual costs',
        hankintamenoOlettaDeduction: 'Deemed acquisition cost',
        selectedMethod: 'Selected deduction',
        selectedDeduction: 'Deduction total',
        taxableCapitalGainWithLoss: 'Capital gain or loss',
        selectedMethodActualCosts: 'Actual costs',
        selectedMethodHmo: 'Deemed acquisition cost',
        subscriptionDate: 'Subscription date',
        allocationDistributionCount: 'Distributions',
        allocationShares: 'Shares',
        allocationGross: 'Distribution total',
        allocationCapitalRepayment: 'Capital repayment',
        allocationDividend: 'Dividend',
        allocationRemainingCostPerShareAfter: 'Remaining / share after',
        unlistedCapitalRepaymentHelp:
          'This part is a capital repayment taxed as a transfer, not as dividend. Check that it appears on the pre-completed tax return as capital repayment. If it is missing, report or correct it in MyTax as a securities transfer.',
        unlistedDividendHelp:
          'This part is reported as dividend from a non-listed company. Check the pre-completed tax return. If it is missing, add a new dividend entry in MyTax and choose non-listed company.',
        listedDividendHelp:
          'This part is reported as dividend from a listed company. Check the pre-completed tax return. If it is missing, add a new dividend entry in MyTax and choose listed company.',
      },
    },
    storage: {
      title: 'Storage',
      actions: {
        saveToBrowserStorage: 'Save to browser persistently',
        loadFromBrowserStorage: 'Load from browser',
        removeFromBrowserStorage: 'Remove from browser',
        copyShareUrl: 'Copy company details to URL',
        saveFile: 'Save file',
        saveCompanyFile: 'Save company details to file',
        loadFile: 'Load file',
        showSmallExample: 'Small holder, 2y',
        showMediumExample: 'Medium, 8y',
        showLargeExample: 'Large, 16y',
        clearExample: 'Clear',
      },
      table: {
        rowTitle: 'Action',
        descriptionTitle: 'Description',
        actionsTitle: 'Buttons',
        autoSaveTitle: 'Auto-save',
        autoSaveDescription:
          'The application saves inputs automatically to window-level storage, so refreshing the page keeps the data available. If the browser window is closed, this data is lost.',
        fileTitle: 'Save file to computer',
        fileDescription: 'You can download the entered data to your computer as a JSON file.',
        browserTitle: 'Save file to browser',
        browserDescription:
          'You can save the data to browser storage. The data becomes automatically available if the page is loaded in a new browser window.',
        clearTitle: 'Clear values',
        clearDescription:
          'You can clear the entered values, but this does not remove data saved to the browser or downloaded files.',
        shareUrlTitle: 'Copy company details to URL',
        exampleTitle: 'Show example case',
        exampleDescription: 'You can inspect how the application looks with example data.',
      },
      copyShareUrlHelp: 'Use this to share company information and distributions with others.',
      copyShareUrlNote: 'Note: Any data passed in URLs might be visible to others.',
      timestamps: {
        companyData: 'Company data updated',
        userData: 'User data updated',
        unavailable: '-',
      },
      status: {
        saved: 'Saved automatically',
        browserSaved: 'Saved to persistent browser storage',
        browserLoaded: 'Loaded from persistent browser storage',
        browserRemoved: 'Persistent browser storage removed',
        shareUrlCopied: 'URL copied',
        loaded: 'Loaded',
        exampleShown: 'Example shown',
        exampleCleared: 'Example data cleared',
        fileSaved: 'File saved',
      },
      errors: {
        invalidFile: 'Invalid file',
        fileReadFailed: 'File read failed',
        clipboardFailed: 'Copy failed',
        shareUrlUnavailable: 'URL sharing is not supported in this browser.',
        shareUrlLoadFailed: 'Opening the shared URL failed.',
      },
      confirmations: {
        clearExample: 'Clear all current data?',
      },
      saveIndicators: {
        browserNeedsSave: 'Inputs have changed and are not saved to persistent browser storage.',
        browserSaved: 'Persistent browser storage is up to date.',
        browserLoadUnavailable: 'There is no persistent browser data available to load.',
        fileNeedsSave: 'Inputs have changed and are not saved to a file in this window.',
        fileSaved: 'File save is up to date in this window.',
      },
    },
    messages: {
      errorsTitle: 'There are issues in the inputs',
      warningsTitle: 'Warnings',
    },
    sources: {
      dividends: 'Tax Admin: Dividends from an unlisted company',
      listedDividends: 'Tax Admin: Dividends from a listed company',
      demergerAcquisitionCost: 'Tax Admin: Taxation of securities transfers - demerger',
      demergers: 'Tax Admin: Corporate reorganisations and taxation - demerger',
      reporting: 'Tax Admin: Pre-completed tax return - how to report in MyTax or on paper',
      form9a: 'Tax Admin: Form 9A instructions',
      sales: 'Tax Admin: Sale of shares',
    },
    calculator: {
      validation: {
        negative: (field) => `${field} cannot be negative.`,
        invalidNumber: (field) => `${field} is not a valid number.`,
        invalidDate: (field) => `${field} is not a valid date.`,
      },
      fields: {
        subscriptionAmount: (label2) => `Subscription ${label2} amount`,
        subscriptionPricePerShare: (label2) => `Subscription ${label2} price/share`,
        subscriptionOtherTotalAcquisitionCosts: (label2) => `Subscription ${label2} other acquisition costs`,
        subscriptionDate: (id) => `Subscription ${id} date`,
        subscriptionVestingEndsOn: (id) => `Subscription ${id} vesting ends`,
        mathematicalShareValueYear: (id) => `Mathematical value year ${id}`,
        mathematicalShareValuePerShare: (id) => `Mathematical value/share ${id}`,
        becameListedDate: 'Became listed date',
        totalShareCount: 'Total share count',
        totalIpoCost: 'Total IPO costs',
        currentShareValue: 'Current share value',
        estimatedPreIpoValue: 'Estimated pre-IPO value',
        estimatedSecondaryShareSellPercentage: 'Estimated secondary sell percentage',
        ipoSellAmount: 'Number of shares to sell',
        ipoSellPricePerShare: 'IPO sell price / share',
        ipoSellCostPerShare: 'IPO sell cost / share',
        otherAnnualCapitalGainsOrLosses: 'Other capital gains or losses',
        cashDistributionDate: (id) => `Distribution ${id} date`,
        cashDistributionAmountPerShare: (id) => `Distribution ${id} EUR/share`,
        shareSplitDate: (id) => `Split ${id} date`,
        shareSplitMultiplier: (id) => `Split ${id} multiplier`,
        demergerDate: (id) => `Demerger ${id} date`,
        demergerOldCompanyRatio: (id) => `Demerger ${id} old-company ratio`,
      },
      warnings: {
        totalShareCountBelowSubscriptions: 'Total share count is lower than the total amount of entered subscriptions.',
        secondarySellPercentZero:
          'Secondary sell percentage is 0, so IPO cost/share has been divided across the full share count.',
        noSharesHeldForDistribution: (date) => `No held shares were found for the distribution on ${date}.`,
        unsupportedYearRange: (year) =>
          `Year-level tax, dividend, and capital-repayment calculations are supported for tax years 2016 and later. The input contains year ${year}.`,
        ipoSellAmountExceedsEstimatedSecondary:
          'Sell amount exceeds the estimated secondary sell amount at whole-company level.',
        vestingBlockedWithoutIpoDate:
          'The became-listed date is missing, so vesting-restricted subscription lots were excluded from the sale.',
      },
      errors: {
        ipoSellPricePerShareRequired: 'IPO price / share must be entered before the IPO sell values can be calculated.',
        ipoSellAmountExceedsSellable: (shares) =>
          `The number of shares to sell exceeds the shares sellable on the became-listed date (${shares}).`,
      },
    },
  }
  function getOsakkeetLocalization(language) {
    return language === 'en' ? EN : FI
  }

  // src/osakkeet/osakkeetPersistence.ts
  var storageKeys = {
    language: 'osakkeet-language',
    windowFormData: 'osakkeet-ipo-laskuri-window',
    lastFileSavedHash: 'osakkeet-ipo-laskuri-last-file-hash',
  }
  var shareUrlQueryKey = 'osakkeet'
  function isCreateId(value) {
    return typeof value === 'function'
  }
  function requireCreateId(createId3) {
    if (!isCreateId(createId3)) {
      throw new Error('A createId function is required for deserializing osakkeet form data.')
    }
    return createId3
  }
  function createCompanyDataPayload(data2) {
    return {
      company: data2.company,
      cashDistributions: data2.cashDistributions.map((cashDistribution) => ({
        id: cashDistribution.id,
        date: cashDistribution.date,
        type: cashDistribution.type,
        amountPerShare: cashDistribution.amountPerShare,
      })),
      shareSplits: data2.shareSplits,
      demergers: data2.demergers,
      mathematicalShareValues: data2.mathematicalShareValues,
      ipo: data2.ipo,
    }
  }
  function createShareableOsakkeetUrlData(data2) {
    return {
      ...createCompanyDataPayload(data2),
      lastModifiedCompanyData: data2.lastModifiedCompanyData || '',
      lastModifiedUserData: data2.lastModifiedUserData || '',
    }
  }
  function fromShareableOsakkeetUrlData(data2, createId3) {
    const emptyForm = createBlankOsakkeetFormData()
    return normalizeOsakkeetFormData(
      {
        ...emptyForm,
        company: {
          ...emptyForm.company,
          ...(data2.company || {}),
        },
        cashDistributions: data2.cashDistributions || [],
        shareSplits: data2.shareSplits || [],
        demergers: data2.demergers || [],
        mathematicalShareValues: data2.mathematicalShareValues || [],
        ipo: {
          ...emptyForm.ipo,
          ...(data2.ipo || {}),
        },
        subscriptions: emptyForm.subscriptions,
        sells: emptyForm.sells,
        ipoSell: emptyForm.ipoSell,
        lastModifiedCompanyData: data2.lastModifiedCompanyData || '',
        lastModifiedUserData: data2.lastModifiedUserData || '',
      },
      createId3
    )
  }
  function fromSavedOsakkeetFileData(data2, createId3) {
    return normalizeOsakkeetFormData(
      normalizeLegacyIpoSell({
        ...data2,
        ipoSell: data2['ipo-sell'],
      }),
      createId3
    )
  }
  function createSavedOsakkeetFileData(data2) {
    const { ipoSell, ...rest } = data2
    return {
      ...rest,
      'ipo-sell': ipoSell,
    }
  }
  function isUrlCompressionSupported() {
    return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
  }
  function requireUrlCompressionSupport() {
    if (!isUrlCompressionSupported()) {
      throw new Error('URL compression is not supported in this browser.')
    }
  }
  async function compressUrlBytes(bytes) {
    requireUrlCompressionSupport()
    const sourceBuffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(sourceBuffer).set(bytes)
    const sourceStream = new Response(sourceBuffer).body
    if (!sourceStream) throw new Error('Compression source stream is unavailable.')
    const compressedStream = sourceStream.pipeThrough(new CompressionStream('gzip'))
    return new Uint8Array(await new Response(compressedStream).arrayBuffer())
  }
  async function decompressUrlBytes(bytes) {
    requireUrlCompressionSupport()
    const sourceBuffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(sourceBuffer).set(bytes)
    const sourceStream = new Response(sourceBuffer).body
    if (!sourceStream) throw new Error('Decompression source stream is unavailable.')
    const decompressedStream = sourceStream.pipeThrough(new DecompressionStream('gzip'))
    return new Uint8Array(await new Response(decompressedStream).arrayBuffer())
  }
  function encodeBase64Url(bytes) {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
  function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const paddingLength = (4 - (normalized.length % 4)) % 4
    const padded = normalized.padEnd(normalized.length + paddingLength, '=')
    const binary = atob(padded)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  }
  async function encodeUrlState(value) {
    const json = JSON.stringify(value)
    const bytes = new TextEncoder().encode(json)
    return encodeBase64Url(await compressUrlBytes(bytes))
  }
  async function decodeUrlState(value) {
    const bytes = decodeBase64Url(value)
    const decompressed = await decompressUrlBytes(bytes)
    return JSON.parse(new TextDecoder().decode(decompressed))
  }
  function serializeOsakkeetFormData(data2, createId3) {
    return JSON.stringify(normalizeOsakkeetFormData(data2, createId3))
  }
  function deserializeOsakkeetFormData(raw, createId3) {
    return normalizeOsakkeetFormData(JSON.parse(raw), createId3)
  }
  async function buildShareUrl(data2, createId3) {
    const url = new URL(window.location.href)
    url.searchParams.set(
      shareUrlQueryKey,
      await encodeUrlState(createShareableOsakkeetUrlData(normalizeOsakkeetFormData(data2, createId3)))
    )
    return url.toString()
  }
  function deserializeShareableOsakkeetUrlData(data2, createId3) {
    return fromShareableOsakkeetUrlData(data2, requireCreateId(createId3))
  }
  function deserializeSavedOsakkeetFileData(data2, createId3) {
    return fromSavedOsakkeetFileData(data2, requireCreateId(createId3))
  }

  // src/osakkeet/osakkeetUiSummary.ts
  function capitalRepaymentDividendReasonText(reason, texts) {
    if (reason === 'too_old') return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonTooOld
    if (reason === 'no_remaining_cost')
      return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonNoRemainingCost
    if (reason === 'remaining_cost_limit') {
      return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonRemainingCostLimit
    }
    return texts.subscriptions.fields.capitalRepaymentPerShareTooltipReasonListedDividend
  }
  function zipRowsWithSummaries(rows, summaries) {
    const summariesById = new Map(summaries.map((summary2) => [summary2.id, summary2]))
    return rows.map((row) => ({
      row,
      summary: summariesById.get(row.id),
    }))
  }
  function createSubscriptionHistoryRows(summary2, texts) {
    if (!summary2) return []
    return summary2.shareCalculatorLog.map((entry) => {
      const pricePerShare = entry.remainingAfter.shareCount.gt(0)
        ? euro(entry.remainingAfter.shareAcquisitionCost.div(entry.remainingAfter.shareCount))
        : euro(0)
      if (entry.kind === 'subscription') {
        return {
          date: entry.date,
          event: texts.subscriptions.history.events.subscription,
          shareCount: amount(entry.remainingAfter.shareCount),
          shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
          pricePerShare,
          details: texts.subscriptions.history.details.subscription(
            amount(entry.shareCount),
            euro(entry.shareAcquisitionCost),
            entry.shareCount.gt(0) ? euro(entry.shareAcquisitionCost.div(entry.shareCount)) : euro(0)
          ),
        }
      }
      if (entry.kind === 'companyShareCountChange') {
        return {
          date: entry.date,
          event: texts.subscriptions.history.events.split,
          shareCount: amount(entry.remainingAfter.shareCount),
          shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
          pricePerShare,
          details: texts.subscriptions.history.details.split(
            entry.shareCountMultiplier.gt(0)
              ? amount(entry.remainingAfter.shareCount.div(entry.shareCountMultiplier))
              : amount(0),
            multiplier(entry.shareCountMultiplier),
            amount(entry.remainingAfter.shareCount)
          ),
        }
      }
      if (entry.kind === 'companyAcquisitionCostChange') {
        return {
          date: entry.date,
          event: texts.subscriptions.history.events.demerger,
          shareCount: amount(entry.remainingAfter.shareCount),
          shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
          pricePerShare,
          details: texts.subscriptions.history.details.demerger(
            entry.shareAcquisitionCostMultiplier.gt(0)
              ? euro(entry.remainingAfter.shareAcquisitionCost.div(entry.shareAcquisitionCostMultiplier))
              : euro(0),
            amount(entry.shareAcquisitionCostMultiplier),
            euro(entry.remainingAfter.shareAcquisitionCost)
          ),
        }
      }
      if (entry.kind === 'sellForThisSubscription') {
        return {
          date: entry.date,
          event: texts.subscriptions.history.events.sell,
          shareCount: amount(entry.remainingAfter.shareCount),
          shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
          pricePerShare,
          details: texts.subscriptions.history.details.sell(
            amount(entry.soldShareCount),
            euro(entry.sellPrice),
            euro(entry.pricePerShare)
          ),
        }
      }
      const appliedPerShare = entry.shareCountAtEvent.gt(0)
        ? entry.appliedShareAcquisitionCost.div(entry.shareCountAtEvent)
        : entry.amountPerShare.mul(0)
      const dividendPerShare = entry.shareCountAtEvent.gt(0)
        ? entry.directedToDividendTotal.div(entry.shareCountAtEvent)
        : entry.amountPerShare.mul(0)
      return {
        date: entry.date,
        event: texts.subscriptions.history.events.capitalRepayment,
        shareCount: amount(entry.remainingAfter.shareCount),
        shareCost: euro(entry.remainingAfter.shareAcquisitionCost),
        pricePerShare,
        details:
          entry.appliedShareAcquisitionCost.gt(0) && entry.directedToDividendTotal.gt(0)
            ? texts.subscriptions.history.details.capitalRepaymentAppliedAndDividend(
                euro(entry.amountPerShare),
                amount(entry.shareCountAtEvent),
                euro(appliedPerShare),
                euro(entry.appliedShareAcquisitionCost),
                euro(dividendPerShare),
                euro(entry.directedToDividendTotal),
                capitalRepaymentDividendReasonText(entry.dividendReason || 'remaining_cost_limit', texts)
              )
            : entry.appliedShareAcquisitionCost.gt(0)
              ? texts.subscriptions.history.details.capitalRepaymentAppliedOnly(
                  euro(entry.amountPerShare),
                  amount(entry.shareCountAtEvent),
                  euro(appliedPerShare),
                  euro(entry.appliedShareAcquisitionCost)
                )
              : texts.subscriptions.history.details.capitalRepaymentDividendOnly(
                  euro(entry.amountPerShare),
                  amount(entry.shareCountAtEvent),
                  euro(dividendPerShare),
                  euro(entry.directedToDividendTotal),
                  capitalRepaymentDividendReasonText(entry.dividendReason || 'listed_dividend', texts)
                ),
      }
    })
  }
  function createSubscriptionHistoryTooltip(historyRows, texts) {
    if (historyRows.length === 0) return texts.subscriptions.history.empty
    const header2 = [
      texts.subscriptions.history.fields.date,
      texts.subscriptions.history.fields.event,
      texts.subscriptions.history.fields.shareCount,
      texts.subscriptions.history.fields.shareCost,
      texts.subscriptions.history.fields.pricePerShare,
      texts.subscriptions.history.fields.details,
    ].join(' | ')
    const rows = historyRows.map((entry) =>
      [entry.date, entry.event, entry.shareCount, entry.shareCost, entry.pricePerShare, entry.details].join(' | ')
    )
    return [header2, ...rows].join('\n')
  }
  function createSubscriptionsSummaryCards(infoCard2, totalShares, vestedShares, unvestedShares, currentDate, texts) {
    const sharePercent = createSharePercentFormatter(totalShares)
    const referenceDate = formatDateLabel(currentDate)
    return [
      infoCard2(texts.subscriptions.summary.totalShares, amount(totalShares)),
      infoCard2(texts.subscriptions.summary.vestedSharesAtDate(referenceDate), sharePercent(vestedShares)),
      infoCard2(texts.subscriptions.summary.unvestedSharesAtDate(referenceDate), sharePercent(unvestedShares)),
    ]
  }

  // src/osakkeet/osakkeetUiTableHelpers.ts
  function displayReadOnlyValue(value) {
    return value || '-'
  }
  function appendAndEditCollectionRow(editor, editingIds, createEmptyItem) {
    editingIds.clear()
    const row = editor.append(createEmptyItem())
    editingIds.add(row.id)
    editor.patch(row.id, {})
  }
  function createCollectionAppendEditButton(editor, editingIds, labelNode, createEmptyItem, createActionButton2) {
    return createActionButton2(labelNode, 'primary', () => {
      appendAndEditCollectionRow(editor, editingIds, createEmptyItem)
    })
  }
  function syncEditableCellBindings(bindings, row, editing) {
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
  function updateInactiveEditableCellBindingInputs(bindings, row, editing) {
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
  function createRowActionButtons(editButton, removeButton, rowButtonsStyle) {
    return div(rowButtonsStyle, editButton, removeButton)
  }
  function enableDoubleClickEdit(rowNode, editingIds, getCurrentRow, sync) {
    rowNode.addEventListener('dblclick', () => {
      const row = getCurrentRow()
      if (editingIds.has(row.id)) return
      editingIds.add(row.id)
      sync(row)
    })
  }
  function toggleSetMembership(set, value) {
    if (set.has(value)) {
      set.delete(value)
    } else {
      set.add(value)
    }
  }
  function createRowEditController(initialRow, editingIds, onToggle, createActionButton2) {
    let currentRow = initialRow
    const labelNode = document.createTextNode('')
    const button2 = createActionButton2(labelNode, 'secondary', () => {
      if (editingIds.has(currentRow.id)) {
        editingIds.delete(currentRow.id)
      } else {
        editingIds.add(currentRow.id)
      }
      sync(currentRow)
    })
    const isEditing = () => editingIds.has(currentRow.id)
    const sync = (nextRow) => {
      currentRow = nextRow
      labelNode.textContent = isEditing() ? nextRow.doneLabel : nextRow.editLabel
      onToggle(nextRow)
    }
    return {
      button: button2,
      isEditing,
      sync,
    }
  }
  function createEditableRowManager(row, editingIds, bindings, createActionButton2, onSet) {
    const editController = createRowEditController(
      row,
      editingIds,
      (nextRow) => {
        syncEditableCellBindings(bindings, nextRow, editController.isEditing())
      },
      createActionButton2
    )
    let currentRow = row
    return {
      editButton: editController.button,
      sync(rowToSync) {
        editController.sync(rowToSync)
      },
      getCurrentRow() {
        return currentRow
      },
      attachDoubleClickEdit(rowNode) {
        enableDoubleClickEdit(rowNode, editingIds, () => currentRow, editController.sync)
      },
      set(nextRow) {
        currentRow = nextRow
        updateInactiveEditableCellBindingInputs(bindings, nextRow, editController.isEditing())
        onSet == null ? void 0 : onSet(nextRow)
        editController.sync(nextRow)
      },
    }
  }
  function createRowActionLabels(texts) {
    return {
      editLabel: texts.common.edit,
      doneLabel: texts.common.done,
      removeLabel: texts.common.remove,
    }
  }
  function withRowActionLabels(rows, texts) {
    const labels = createRowActionLabels(texts)
    return rows.map((row) => ({
      ...row,
      ...labels,
    }))
  }
  function withSummaryRows(rows, summaries, texts) {
    const labels = createRowActionLabels(texts)
    return zipRowsWithSummaries(rows, summaries).map(({ row, summary: summary2 }) => ({
      id: row.id,
      formRow: row,
      summary: summary2,
      texts,
      ...labels,
    }))
  }

  // src/osakkeet/osakkeetUiUtils.ts
  function numberInput(inputStyle, value, onInput = () => {}, numeric = true) {
    return inputs.text(
      {
        value,
        ...(numeric ? { inputMode: 'decimal' } : {}),
      },
      inputStyle,
      events({
        input({ node }) {
          onInput(node.value)
        },
      })
    )
  }
  function finnishDateInput(inputStyle, value, onInput = () => {}) {
    return inputs.text(
      {
        value,
        placeholder: 'pp.kk.vvvv',
        inputMode: 'numeric',
      },
      inputStyle,
      events({
        input({ node }) {
          onInput(node.value)
        },
      })
    )
  }
  function infoCard(summaryItemStyle, mutedTextStyle, title2, value, help) {
    return div(
      summaryItemStyle,
      span({ class: 'muted' }, mutedTextStyle, title2),
      ...(value ? [b(value)] : []),
      help && span({ class: 'muted' }, mutedTextStyle, help)
    )
  }
  function withHoverInfo(hoverInfoStyle, hoverInfoIconStyle, content, tooltip) {
    return span({ title: tooltip }, hoverInfoStyle, content, span(hoverInfoIconStyle, 'i'))
  }
  function hoverValue(hoverInfoStyle, hoverInfoIconStyle, value, tooltip, emphasized = false) {
    const node = withHoverInfo(hoverInfoStyle, hoverInfoIconStyle, value, tooltip)
    return emphasized ? b(node) : node
  }
  function setInputValue(node, value) {
    if (node.value !== value) {
      node.value = value
    }
  }
  function applyButtonStyle(node, style2, className = '') {
    node.removeAttribute('style')
    node.className = className
    setStyle(node, style2.styles)
  }
  function setButtonVariant(node, smallButtonStyle, primary) {
    if (primary) {
      node.removeAttribute('style')
      node.className = 'blueButton'
      return
    }
    applyButtonStyle(node, smallButtonStyle)
  }
  function setButtonAttention(node, smallButtonStyle, attentionButtonStyle, disabledButtonStyle, needsAttention) {
    if (node.disabled) {
      applyButtonStyle(node, disabledButtonStyle)
      return
    }
    if (needsAttention) {
      applyButtonStyle(node, attentionButtonStyle)
      return
    }
    applyButtonStyle(node, smallButtonStyle)
  }
  function createRemoveButton(smallButtonStyle, labelNode, remove) {
    return button(
      labelNode,
      smallButtonStyle,
      events({
        click() {
          remove()
        },
      })
    )
  }
  function createActionButton(smallButtonStyle, labelNode, variant, onClick) {
    return button(
      labelNode,
      variant === 'primary' ? { class: 'blueButton' } : smallButtonStyle,
      events({
        click() {
          onClick()
        },
      })
    )
  }

  // src/osakkeet/osakkeetUiStyles.ts
  var pageStyles = {
    stack: styles({ display: 'flex', flexDirection: 'column', gap: '22px' }),
    denseStack: styles({ display: 'flex', flexDirection: 'column', gap: '10px' }),
    gridTwo: styles({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }),
    mainSection: styles({ display: 'flex', flexDirection: 'column', gap: '14px' }),
    mainSectionHeader: styles({
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      padding: '14px 16px',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: '8px',
      backgroundColor: 'rgba(15, 23, 42, 0.02)',
    }),
    mainSectionHeaderText: styles({ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 360px' }),
    mainSectionSummary: styles({ margin: '0', color: 'rgb(75, 85, 99)' }),
    mainSectionMetrics: styles({ display: 'flex', gap: '8px', flexWrap: 'wrap' }),
    mainSectionMetric: styles({
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '8px',
      backgroundColor: '#fff',
      border: '1px solid rgba(15, 23, 42, 0.08)',
    }),
    mainSectionMetricLabel: styles({ color: 'rgb(75, 85, 99)', fontSize: '12px' }),
    mainSectionContent: styles({ display: 'flex', flexDirection: 'column', gap: '22px' }),
    field: styles({ display: 'flex', flexDirection: 'column', gap: '6px' }),
    compactField: styles({ width: '140px' }),
    mediumCompactField: styles({ width: '220px' }),
    compactTable: styles({ width: 'auto', maxWidth: 'fit-content', tableLayout: 'auto' }),
    rowButtons: styles({ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }),
    rowActionButtons: styles({ display: 'inline-flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }),
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
    storageCellTop: styles({
      verticalAlign: 'top',
      padding: '10px 12px',
      borderTop: '1px solid rgba(15, 23, 42, 0.08)',
    }),
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
    highlightedColumn: styles({
      backgroundColor: 'rgba(187, 247, 208, 0.45)',
    }),
    highlightedHeaderColumn: styles({
      backgroundColor: 'rgba(187, 247, 208, 0.45)',
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

  // src/osakkeet/osakkeetUiDataSections.ts
  function createCompanySection(dataState, pageReadState, localizedTextNodes) {
    const formBinder = createFormBinder(dataState)
    const companyTextNodes = localizedTextNodes.company
    const mathematicalShareValuesEditor = createMathematicalShareValuesEditor(
      dataState,
      pageReadState,
      localizedTextNodes
    )
    const listingStatusSelect = createOptionBoundSelect(dataState.get().company.listingStatus, [], (listingStatus) => {
      dataState.set((current) => ({
        ...current,
        company: {
          ...current.company,
          listingStatus,
        },
      }))
    })
    setStyle(listingStatusSelect.node, pageStyles.input)
    const becameListedDateInput = finnishDateInput(pageStyles.input, '')
    formBinder.bindInputs([{ path: ['company', 'becameListedDate'], node: becameListedDateInput }])
    const root = section(
      { class: 'card' },
      h2(companyTextNodes.title),
      p({ class: 'muted' }, companyTextNodes.help),
      div(
        pageStyles.gridTwo,
        div(
          pageStyles.field,
          label(companyTextNodes.fields.listingStatus),
          div(pageStyles.mediumCompactField, listingStatusSelect.node)
        ),
        div(
          pageStyles.field,
          label(companyTextNodes.fields.becameListedDate),
          div(pageStyles.mediumCompactField, becameListedDateInput)
        )
      ),
      mathematicalShareValuesEditor.root
    )
    return createSectionController(root, ({ formData, texts }) => {
      listingStatusSelect.setOptions([
        { value: 'unlisted', label: texts.company.options.unlisted },
        { value: 'listed', label: texts.company.options.listed },
      ])
      listingStatusSelect.setValue(formData.company.listingStatus === 'listed' ? 'listed' : 'unlisted')
    })
  }
  function createSellsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes) {
    const counter = createSectionCounter()
    const sellTextNodes = localizedTextNodes.sells
    const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
      withRowActionLabels(sortRowsByDate(osakkeetCalculation.formData.sells), texts)
    )
    const sells = createStateCollectionEditor(dataState, ['sells'])
    const editingRowIds = /* @__PURE__ */ new Set()
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
        const pricePerShareInput = numberInput(pageStyles.input, row.pricePerShare || '', (value) => {
          sells.patch(row.id, { pricePerShare: value })
        })
        const otherTotalSellCostsInput = numberInput(pageStyles.input, row.otherTotalSellCosts || '', (value) => {
          sells.patch(row.id, { otherTotalSellCosts: value })
        })
        const dateCell = td()
        const shareCountCell = td()
        const pricePerShareCell = td()
        const otherTotalSellCostsCell = td()
        const bindings = [
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
            cell: pricePerShareCell,
            editNode: div(pageStyles.compactField, pricePerShareInput),
            readValue: (nextRow) => nextRow.pricePerShare || '',
            setEditValue: (nextRow) => setInputValue(pricePerShareInput, nextRow.pricePerShare || ''),
          },
          {
            cell: otherTotalSellCostsCell,
            editNode: div(pageStyles.compactField, otherTotalSellCostsInput),
            readValue: (nextRow) => nextRow.otherTotalSellCosts || '',
            setEditValue: (nextRow) => setInputValue(otherTotalSellCostsInput, nextRow.otherTotalSellCosts || ''),
          },
        ]
        const editableRow = createEditableRowManager(row, editingRowIds, bindings, (labelNode, variant, onClick) =>
          createActionButton(pageStyles.smallButton, labelNode, variant, onClick)
        )
        editableRow.sync(row)
        const rowNode = tr(
          dateCell,
          shareCountCell,
          pricePerShareCell,
          otherTotalSellCostsCell,
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
        pricePerShare: '',
        otherTotalSellCosts: '',
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
            th(sellTextNodes.fields.pricePerShare),
            th(sellTextNodes.fields.otherTotalSellCosts),
            th({ class: 'no-print' }, '')
          )
        ),
        tbodyNode
      ),
      div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
    )
    return createSectionController(root, ({ osakkeetCalculation, texts }) => {
      counter.setCount(osakkeetCalculation.formData.sells.length, texts.common.rows)
    })
  }
  function createSubscriptionsSection(dataState, pageReadState, localizedTextNodes) {
    const openHistorySubscriptionIds = /* @__PURE__ */ new Set()
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
    const remainingShareCountHeaderNode = th(pageStyles.highlightedHeaderColumn)
    replaceChildrenFromState(pageReadState, remainingShareCountHeaderNode, ({ texts }) => [
      b(texts.subscriptions.fields.remainingShareCountCurrentDate(formatDateLabel(/* @__PURE__ */ new Date()))),
    ])
    const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
      withSummaryRows(
        sortRowsByDate(osakkeetCalculation.formData.subscriptions),
        osakkeetCalculation.subscriptions,
        texts
      )
    )
    const subscriptions = createStateCollectionEditor(dataState, ['subscriptions'])
    const editingRowIds = /* @__PURE__ */ new Set()
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
        const dateCell = td(pageStyles.highlightedColumn)
        const vestingEndsOnCell = td()
        const amountCell = td()
        const remainingShareCountCell = td(pageStyles.highlightedColumn)
        const pricePerShareCell = td()
        const otherTotalAcquisitionCostsCell = td()
        const totalPricePerShareCell = td()
        const remainingCostPerShareCell = td(pageStyles.highlightedColumn)
        const toggleHistory = (subscriptionId) => {
          toggleSetMembership(openHistorySubscriptionIds, subscriptionId)
        }
        const bindings = [
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
        const detailRow = tr(td({ colSpan: 10 }, pageStyles.historyCell, historyContainer))
        const syncSummaryCells = (nextRow) => {
          replaceChildren(remainingShareCountCell, nextRow.summary ? amount(nextRow.summary.shareCount) : '-')
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
          td({ class: 'no-print' }, historyButton),
          dateCell,
          vestingEndsOnCell,
          amountCell,
          remainingShareCountCell,
          pricePerShareCell,
          otherTotalAcquisitionCostsCell,
          totalPricePerShareCell,
          remainingCostPerShareCell,
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
        const renderHistoryTable = (historyRows, texts) =>
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
        const syncHistoryVisibility = (nextRow) => {
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
            th({ class: 'no-print' }, ''),
            th(pageStyles.highlightedHeaderColumn, b(subscriptionTextNodes.fields.purchaseDate)),
            th(vestingEndsOnHeaderNode),
            th(subscriptionTextNodes.fields.originalShareCount),
            remainingShareCountHeaderNode,
            th(subscriptionTextNodes.fields.pricePerShare),
            th(otherTotalAcquisitionCostsHeaderNode),
            th(subscriptionTextNodes.fields.totalPricePerShare),
            th(pageStyles.highlightedHeaderColumn, b(subscriptionTextNodes.fields.remainingCostPerShare)),
            th({ class: 'no-print' }, '')
          )
        ),
        tbodyNode
      ),
      div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
    )
    replaceChildrenFromState(pageReadState, summaryRoot, ({ osakkeetCalculation, texts }) =>
      createSubscriptionsSummaryCards(
        (title2, value, help) => infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help),
        osakkeetCalculation.currentVesting.totalShares,
        osakkeetCalculation.currentVesting.vestedShares,
        osakkeetCalculation.currentVesting.unvestedShares,
        /* @__PURE__ */ new Date(),
        texts
      )
    )
    return createSectionController(root, ({ osakkeetCalculation, texts }) => {
      const current = osakkeetCalculation.formData
      counter.setCount(current.subscriptions.length, texts.common.rows)
      vestingEndsOnHeaderNode.title = texts.subscriptions.fields.vestingEndsOnHelp
      otherTotalAcquisitionCostsHeaderNode.title = texts.subscriptions.fields.otherTotalAcquisitionCostsHelp
    })
  }
  function createCashDistributionsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes) {
    const counter = createSectionCounter()
    const cashDistributionTextNodes = localizedTextNodes.cashDistributions
    const withholdingHeaderNode = withHoverInfo(
      pageStyles.hoverInfo,
      pageStyles.hoverInfoIcon,
      cashDistributionTextNodes.fields.withholding,
      ''
    )
    const cashPaidHeaderNode = withHoverInfo(
      pageStyles.hoverInfo,
      pageStyles.hoverInfoIcon,
      cashDistributionTextNodes.fields.cashPaid,
      ''
    )
    const capitalRepaymentHeaderNode = withHoverInfo(
      pageStyles.hoverInfo,
      pageStyles.hoverInfoIcon,
      cashDistributionTextNodes.fields.capitalRepayment,
      ''
    )
    const dividendHeaderNode = withHoverInfo(
      pageStyles.hoverInfo,
      pageStyles.hoverInfoIcon,
      cashDistributionTextNodes.fields.dividend,
      ''
    )
    const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
      withSummaryRows(
        sortRowsByDate(osakkeetCalculation.formData.cashDistributions),
        osakkeetCalculation.cashDistributions,
        texts
      )
    )
    const cashDistributions = createStateCollectionEditor(dataState, ['cashDistributions'])
    const editingRowIds = /* @__PURE__ */ new Set()
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
        const bindings = [
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
        const syncSummaryCells = (nextRow) => {
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
    return createSectionController(root, ({ osakkeetCalculation, texts }) => {
      const current = osakkeetCalculation.formData
      counter.setCount(current.cashDistributions.length, texts.common.rows)
      withholdingHeaderNode.title = texts.cashDistributions.fields.withholdingHelp
      cashPaidHeaderNode.title = texts.cashDistributions.fields.cashPaidHelp
      capitalRepaymentHeaderNode.title = texts.cashDistributions.fields.capitalRepaymentHelp
      dividendHeaderNode.title = texts.cashDistributions.fields.dividendHelp
    })
  }
  function createMathematicalShareValuesEditor(dataState, pageReadState, localizedTextNodes) {
    const mathematicalShareValuesTextNodes = localizedTextNodes.mathematicalShareValues
    const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
      withRowActionLabels(osakkeetCalculation.formData.mathematicalShareValues, texts)
    )
    const mathematicalShareValues = createStateCollectionEditor(dataState, ['mathematicalShareValues'])
    const editingRowIds = /* @__PURE__ */ new Set()
    const tbodyNode = createEditableCollectionTable({
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
        const bindings = [
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
  function createShareSplitsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes) {
    const counter = createSectionCounter()
    const shareSplitTextNodes = localizedTextNodes.shareSplits
    const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
      withRowActionLabels(sortRowsByDate(osakkeetCalculation.formData.shareSplits), texts).map((row) => ({
        ...row,
        exampleEffectText: Number.isFinite(Number(row.multiplier.trim()))
          ? texts.shareSplits.fields.exampleEffectValue((100 * Number(row.multiplier.trim())).toFixed(2))
          : '-',
      }))
    )
    const shareSplits = createStateCollectionEditor(dataState, ['shareSplits'])
    const editingRowIds = /* @__PURE__ */ new Set()
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
        const explanationCell = td()
        const bindings = [
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
        const syncExplanation = (nextRow) => {
          replaceChildren(explanationCell, nextRow.exampleEffectText)
        }
        syncExplanation(row)
        editableRow.sync(row)
        const rowNode = tr(
          dateCell,
          multiplierCell,
          explanationCell,
          td(
            { class: 'no-print' },
            createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
          )
        )
        editableRow.attachDoubleClickEdit(rowNode)
        return {
          node: rowNode,
          set(nextRow) {
            editableRow.set(nextRow)
            syncExplanation(nextRow)
          },
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
        thead(
          tr(
            th(commonTextNodes.date),
            th(shareSplitTextNodes.fields.multiplier),
            th(shareSplitTextNodes.fields.exampleEffect),
            th({ class: 'no-print' }, '')
          )
        ),
        tbodyNode
      ),
      div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
    )
    return createSectionController(root, ({ osakkeetCalculation, texts }) => {
      counter.setCount(osakkeetCalculation.formData.shareSplits.length, texts.common.rows)
    })
  }
  function createDemergersSection(dataState, pageReadState, localizedTextNodes, commonTextNodes) {
    const counter = createSectionCounter()
    const demergerTextNodes = localizedTextNodes.demergers
    const rowsState = pageReadState.map(({ osakkeetCalculation, texts }) =>
      withRowActionLabels(sortRowsByDate(osakkeetCalculation.formData.demergers), texts).map((row) => {
        const ratioValue = Number(row.oldCompanyRatio.trim())
        return {
          ...row,
          exampleEffectText: Number.isFinite(ratioValue)
            ? texts.demergers.fields.exampleEffectValue(
                row.oldCompanyRatio.trim(),
                euro(10 * ratioValue),
                euro(10 * (1 - ratioValue))
              )
            : '-',
        }
      })
    )
    const demergers = createStateCollectionEditor(dataState, ['demergers'])
    const editingRowIds = /* @__PURE__ */ new Set()
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
        const explanationCell = td()
        const bindings = [
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
        const syncExplanation = (nextRow) => {
          replaceChildren(explanationCell, nextRow.exampleEffectText)
        }
        syncExplanation(row)
        editableRow.sync(row)
        const rowNode = tr(
          dateCell,
          oldCompanyRatioCell,
          explanationCell,
          td(
            { class: 'no-print' },
            createRowActionButtons(editableRow.editButton, removeButton, pageStyles.rowActionButtons)
          )
        )
        editableRow.attachDoubleClickEdit(rowNode)
        return {
          node: rowNode,
          set(nextRow) {
            editableRow.set(nextRow)
            syncExplanation(nextRow)
          },
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
        thead(
          tr(
            th(commonTextNodes.date),
            th(demergerTextNodes.fields.oldCompanyRatio),
            th(demergerTextNodes.fields.exampleEffect),
            th({ class: 'no-print' }, '')
          )
        ),
        tbodyNode
      ),
      div({ class: 'no-print' }, pageStyles.rowButtons, addButton)
    )
    return createSectionController(root, ({ osakkeetCalculation, texts }) => {
      counter.setCount(osakkeetCalculation.formData.demergers.length, texts.common.rows)
    })
  }

  // src/osakkeet/osakkeetUiSummarySections.ts
  function buildRemainingShareBreakdown(osakkeetCalculation) {
    const soldAmountByLotId = /* @__PURE__ */ new Map()
    for (const lot of osakkeetCalculation.ipoSell.usedLots) {
      soldAmountByLotId.set(lot.lotId, (soldAmountByLotId.get(lot.lotId) || new decimal_default(0)).add(lot.soldAmount))
    }
    const now = /* @__PURE__ */ new Date()
    const zero6 = osakkeetCalculation.ipo.currentShareValue.mul(0)
    let totalShares = zero6
    let vestedShares = zero6
    let unvestedShares = zero6
    let unvestedOriginalAcquisitionCost = zero6
    for (const lot of osakkeetCalculation.subscriptions) {
      const remainingShares = decimal_default.max(lot.shareCount.minus(soldAmountByLotId.get(lot.id) || zero6), zero6)
      if (remainingShares.lte(0)) continue
      totalShares = totalShares.add(remainingShares)
      const isVestedAtCurrentDate = !lot.vestingEndsOnValue || now.getTime() >= lot.vestingEndsOnValue.getTime()
      if (isVestedAtCurrentDate) {
        vestedShares = vestedShares.add(remainingShares)
      } else {
        unvestedShares = unvestedShares.add(remainingShares)
        unvestedOriginalAcquisitionCost = unvestedOriginalAcquisitionCost.add(lot.originalShareAcquisitionCost)
      }
    }
    const currentShareValue = osakkeetCalculation.ipo.currentShareValue
    return {
      totalShares,
      totalValue: totalShares.mul(currentShareValue),
      vestedShares,
      vestedValue: vestedShares.mul(currentShareValue),
      unvestedShares,
      unvestedValue: unvestedShares.mul(currentShareValue),
      unvestedOriginalAcquisitionCost,
    }
  }
  function renderAssetsTable(assets, t) {
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
  function renderDistributionSharesCell(row, styles2, t) {
    if (row.type !== 'capital_return') {
      return amount(row.sharesHeld)
    }
    if (row.dividendShareCount.lte(0)) {
      return amount(row.capitalRepaymentShareCount)
    }
    return div(
      styles2.denseStack,
      p(styles2.compactParagraph, b(`${t.taxReturns.fields.distributionSharesTotal}: `), amount(row.sharesHeld)),
      p(
        styles2.compactParagraph,
        b(`${t.taxReturns.fields.distributionSharesCapitalRepayment}: `),
        amount(row.capitalRepaymentShareCount)
      ),
      p(
        styles2.compactParagraph,
        b(`${t.taxReturns.fields.distributionSharesDividend}: `),
        amount(row.dividendShareCount)
      )
    )
  }
  function renderAllocationTable(row, styles2, t) {
    return table(
      styles2.compactTable,
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
  function renderDistributionTypeLabel(row, t) {
    if (row.type === 'dividend') {
      return t.cashDistributions.types.dividend
    }
    if (row.dividendTotal.gt(0)) {
      return `${t.cashDistributions.types.capitalReturn} / ${t.cashDistributions.types.dividend}`
    }
    return t.cashDistributions.types.capitalReturn
  }
  function renderTaxTable(sectionSummary, showAllocationDetails, styles2, renderers, t) {
    if (!sectionSummary) return false
    const { entries, totals, mode } = sectionSummary
    const capitalRepaymentHeaderNode =
      mode === 'unlisted'
        ? renderers.withHoverInfo(
            t.cashDistributions.fields.capitalRepayment,
            t.taxReturns.fields.unlistedCapitalRepaymentHelp
          )
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
            td(renderDistributionTypeLabel(row, t)),
            td(renderDistributionSharesCell(row, styles2, t)),
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
                styles2.historyCell,
                div(
                  styles2.denseStack,
                  b(t.taxReturns.sections.allocationDetails),
                  renderAllocationTable(row, styles2, t)
                )
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
  function renderTaxSectionWithToggle(title2, sectionSummary, styles2, renderers, t) {
    if (!sectionSummary) return false
    let showAllocationDetails = false
    const labelNode = document.createTextNode(t.taxReturns.actions.showAllocationDetails)
    const toggleButton = renderers.createActionButton(labelNode, 'secondary', () => {
      showAllocationDetails = !showAllocationDetails
      sync()
    })
    const contentRoot = div(styles2.denseStack)
    const sync = () => {
      labelNode.textContent = showAllocationDetails
        ? t.taxReturns.actions.hideAllocationDetails
        : t.taxReturns.actions.showAllocationDetails
      replaceChildren(contentRoot, renderTaxTable(sectionSummary, showAllocationDetails, styles2, renderers, t))
    }
    sync()
    return div(
      styles2.denseStack,
      h3(title2),
      div({ class: 'no-print' }, styles2.rowButtons, toggleButton),
      contentRoot
    )
  }
  function renderSalesTable(sales, t) {
    if (sales.length === 0) return false
    const saleRows = sales.flatMap((sale) =>
      sale.summary.usedLots.map((row) => ({
        ...row,
        sellDate: sale.sellDate,
      }))
    )
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
        saleRows.map((row) =>
          tr(
            td(row.lotDate),
            td(row.sellDate),
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
          td(amount(sumDecimals(saleRows.map((row) => row.soldAmount)))),
          td(euro(sumDecimals(sales.map((sale) => sale.summary.grossTotal)))),
          td(euro(sumDecimals(saleRows.map((row) => row.actualDeduction)))),
          td(euro(sumDecimals(saleRows.map((row) => row.hankintamenoOlettaDeduction)))),
          td(),
          td(euro(sumDecimals(sales.map((sale) => sale.summary.selectedDeductionTotal)))),
          td(euro(sumDecimals(sales.map((sale) => sale.summary.taxableGainTotal))))
        )
      )
    )
  }
  function createTaxSummaryContent(calculation, t, styles2, renderers) {
    const years = calculation.taxReturns.years
    if (years.length === 0) return false
    return div(
      years.map((yearSummary) =>
        div(
          styles2.denseStack,
          h3(String(yearSummary.year)),
          yearSummary.missingMathematicalValueWarningDates.length > 0 &&
            div(
              styles2.warningBox,
              ul(
                yearSummary.missingMathematicalValueWarningDates.map((date) =>
                  li(`${date}: ${t.taxReturns.yearWarningMissingMathValue}`)
                )
              )
            ),
          yearSummary.assets &&
            div(styles2.denseStack, h3(t.taxReturns.sections.assets), renderAssetsTable(yearSummary.assets, t)),
          yearSummary.unlisted &&
            renderTaxSectionWithToggle(
              renderers.withHoverInfo(t.taxReturns.sections.unlisted, t.taxReturns.sections.unlistedHelp),
              yearSummary.unlisted,
              styles2,
              renderers,
              t
            ),
          yearSummary.listed &&
            renderTaxSectionWithToggle(t.taxReturns.sections.listed, yearSummary.listed, styles2, renderers, t),
          yearSummary.sales &&
            yearSummary.sales.length > 0 &&
            div(styles2.denseStack, h3(t.taxReturns.sections.ipoSale), renderSalesTable(yearSummary.sales, t))
        )
      )
    )
  }
  function createSellOverviewCards(osakkeetCalculation, texts, infoCard2) {
    const sharePercent = createSharePercent(osakkeetCalculation.vesting.totalShares)
    const ipoDate = osakkeetCalculation.formData.company.becameListedDate
    return [
      infoCard2(
        ipoDate
          ? texts.summary.ipoSell.cards.sellableSharesAtDate(ipoDate)
          : texts.summary.ipoSell.cards.sellableShares,
        sharePercent(osakkeetCalculation.vesting.vestedShares)
      ),
      infoCard2(
        ipoDate
          ? texts.summary.ipoSell.cards.unvestedSharesAtDate(ipoDate)
          : texts.summary.ipoSell.cards.unvestedShares,
        sharePercent(osakkeetCalculation.vesting.unvestedShares)
      ),
      infoCard2(texts.summary.ipoSell.cards.sharesLeft, amount(osakkeetCalculation.ipoSell.remainingUnsoldShares)),
    ]
  }
  function createSellAllocationTable(osakkeetCalculation, texts, withHoverInfo2) {
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
              withHoverInfo2(
                euro(lot.actualDeduction),
                texts.summary.ipoSell.tooltips.actualCosts(
                  euro(lot.realCostBasis),
                  euro(lot.allocatedSellCost),
                  euro(lot.actualDeduction)
                )
              )
            ),
            td(
              withHoverInfo2(
                euro(lot.hankintamenoOlettaDeduction),
                texts.summary.ipoSell.tooltips.hmo(
                  euro(lot.gross),
                  percentage(lot.hankintamenoOlettaRate.mul(100)),
                  euro(lot.hankintamenoOlettaDeduction)
                )
              )
            ),
            td(lot.taxableGain.gte(0) ? euro(lot.taxableGain) : `${lot.taxableGain.toFixed(2)} \u20AC`)
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
  function createSellExplanationCards(osakkeetCalculation, texts, infoCard2) {
    return [
      infoCard2(
        texts.summary.ipoSell.explanations.ipoPriceTotal,
        euro(osakkeetCalculation.ipoSell.grossTotal),
        texts.summary.ipoSell.explanations.ipoPriceTotalHelp(euro(osakkeetCalculation.ipoSell.grossTotal))
      ),
      infoCard2(
        texts.summary.ipoSell.explanations.ipoCostsAllocated,
        euro(osakkeetCalculation.ipoSell.totalAllocatedSellCost),
        texts.summary.ipoSell.explanations.ipoCostsAllocatedHelp(
          euro(osakkeetCalculation.ipoSell.totalAllocatedSellCost)
        )
      ),
      infoCard2(
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
  function createCapitalGainCards(osakkeetCalculation, texts, infoCard2) {
    return [
      infoCard2(
        texts.summary.ipoSell.capitalGainAnnualTax.driversTitle,
        texts.summary.ipoSell.capitalGainAnnualTax.driversValue,
        texts.summary.ipoSell.capitalGainAnnualTax.driversHelp
      ),
      infoCard2(
        texts.summary.ipoSell.explanations.selectedDeductions,
        euro(osakkeetCalculation.ipoSell.selectedDeductionTotal),
        texts.summary.ipoSell.explanations.selectedDeductionsHelp(
          euro(osakkeetCalculation.ipoSell.selectedActualDeductionTotal),
          euro(osakkeetCalculation.ipoSell.selectedHmoDeductionTotal)
        )
      ),
      infoCard2(
        texts.summary.ipoSell.explanations.capitalGain,
        euro(osakkeetCalculation.ipoSell.taxableGainTotal),
        texts.summary.ipoSell.explanations.capitalGainHelp(
          euro(osakkeetCalculation.ipoSell.grossTotal),
          euro(osakkeetCalculation.ipoSell.selectedDeductionTotal)
        )
      ),
      infoCard2(
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
  function createCashReserveCards(osakkeetCalculation, texts, infoCard2) {
    const remainingShares = buildRemainingShareBreakdown(osakkeetCalculation)
    const ipoSharePrice = osakkeetCalculation.ipoSell.amount.gt(0)
      ? osakkeetCalculation.ipoSell.grossTotal.div(osakkeetCalculation.ipoSell.amount)
      : osakkeetCalculation.ipo.currentShareValue.mul(0)
    const remainingSharesCardValue = [
      texts.summary.ipoSell.cashReserve.remainingSharesTotalLine(
        amount(remainingShares.totalShares),
        euro(remainingShares.totalShares.mul(ipoSharePrice))
      ),
      texts.summary.ipoSell.cashReserve.remainingSharesVestedLine(
        amount(remainingShares.vestedShares),
        euro(remainingShares.vestedShares.mul(ipoSharePrice))
      ),
      texts.summary.ipoSell.cashReserve.remainingSharesUnvestedLine(
        amount(remainingShares.unvestedShares),
        euro(remainingShares.unvestedShares.mul(ipoSharePrice)),
        euro(remainingShares.unvestedOriginalAcquisitionCost)
      ),
    ].join('\n')
    const keepAfterTaxesPercentage = osakkeetCalculation.ipoSell.grossTotal.gt(0)
      ? ` (${percentage(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost.div(osakkeetCalculation.ipoSell.grossTotal).mul(100))})`
      : ''
    return [
      infoCard2(
        texts.summary.ipoSell.cashReserve.keepAfterTaxes,
        `${euro(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost)}${keepAfterTaxesPercentage}`,
        texts.summary.ipoSell.cashReserve.keepAfterTaxesHelp(
          euro(osakkeetCalculation.ipoSell.cashAfterSellCosts),
          euro(osakkeetCalculation.ipoSell.estimatedTax),
          euro(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost)
        )
      ),
      infoCard2(
        texts.summary.ipoSell.cashReserve.reserveForTaxes,
        euro(osakkeetCalculation.ipoSell.estimatedTax),
        texts.summary.ipoSell.cashReserve.reserveForTaxesHelp(euro(osakkeetCalculation.ipoSell.estimatedTax))
      ),
      infoCard2(
        texts.summary.ipoSell.cashReserve.taxPaymentStatus,
        texts.summary.ipoSell.cashReserve.taxPaymentManual,
        texts.summary.ipoSell.cashReserve.taxPaymentStatusHelp
      ),
      infoCard2(
        texts.summary.ipoSell.cashReserve.remainingShares,
        remainingSharesCardValue,
        texts.summary.ipoSell.cashReserve.remainingSharesHelp(
          euro(ipoSharePrice),
          euro(remainingShares.totalShares.mul(ipoSharePrice))
        )
      ),
    ]
  }
  function createSaleResultComparisonCards(osakkeetCalculation, texts, infoCard2) {
    const netResultAgainstOriginalAcquisitionCost = osakkeetCalculation.ipoSell.netAfterTaxAndSellCost.minus(
      osakkeetCalculation.ipoSell.soldShareOriginalCostTotal
    )
    const netResultPercent = osakkeetCalculation.ipoSell.soldShareOriginalCostTotal.gt(0)
      ? percentage(
          netResultAgainstOriginalAcquisitionCost.div(osakkeetCalculation.ipoSell.soldShareOriginalCostTotal).mul(100)
        )
      : '0.00 %'
    return [
      infoCard2(
        texts.summary.ipoSell.saleResultComparison.cardTitle,
        texts.summary.ipoSell.saleResultComparison.value(
          euro(osakkeetCalculation.ipoSell.soldShareOriginalCostTotal),
          euro(netResultAgainstOriginalAcquisitionCost),
          netResultPercent
        ),
        texts.summary.ipoSell.saleResultComparison.help(
          euro(osakkeetCalculation.ipoSell.soldShareOriginalCostTotal),
          euro(osakkeetCalculation.ipoSell.netAfterTaxAndSellCost),
          euro(netResultAgainstOriginalAcquisitionCost),
          netResultPercent
        )
      ),
    ]
  }
  function createIpoCostEffectCards(osakkeetCalculation, texts, infoCard2) {
    return [
      infoCard2(
        texts.summary.ipoSell.explanations.deductibleIpoCosts,
        euro(osakkeetCalculation.ipoSell.taxSavedFromDeductibleSellCosts),
        texts.summary.ipoSell.explanations.deductibleIpoCostsHelp(
          euro(osakkeetCalculation.ipoSell.sellCostDeductedViaActual),
          euro(osakkeetCalculation.ipoSell.taxSavedFromDeductibleSellCosts)
        )
      ),
      infoCard2(
        texts.summary.ipoSell.explanations.hmoIpoCosts,
        euro(osakkeetCalculation.ipoSell.sellCostPaidWithoutActualDeduction),
        texts.summary.ipoSell.explanations.hmoIpoCostsHelp()
      ),
    ]
  }
  function createAnnualAdjustmentCards(osakkeetCalculation, texts, infoCard2) {
    const zeroMoney = osakkeetCalculation.ipoSell.grossTotal.mul(0)
    const annualKeepAfterTaxesPercentage = osakkeetCalculation.ipoSell.grossTotal.gt(0)
      ? ` (${percentage(osakkeetCalculation.ipoSell.netAfterAnnualTaxAndSellCost.div(osakkeetCalculation.ipoSell.grossTotal).mul(100))})`
      : ''
    return {
      taxEffect: infoCard2(
        texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapital,
        osakkeetCalculation.ipoSell.taxReductionFromOtherLosses.gt(0)
          ? euro(osakkeetCalculation.ipoSell.taxReductionFromOtherLosses.mul(-1))
          : osakkeetCalculation.ipoSell.annualTaxChange.gt(0)
            ? `+${euro(osakkeetCalculation.ipoSell.annualTaxChange)}`
            : euro(zeroMoney),
        texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapitalHelp(
          euro(osakkeetCalculation.ipoSell.otherAnnualCapitalGainsOrLosses),
          euro(osakkeetCalculation.ipoSell.taxReductionFromOtherLosses),
          euro(decimal_default.max(osakkeetCalculation.ipoSell.annualTaxChange, zeroMoney))
        )
      ),
      reserve: infoCard2(
        texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxes,
        euro(osakkeetCalculation.ipoSell.annualEstimatedTax),
        texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxesHelp(
          euro(osakkeetCalculation.ipoSell.annualEstimatedTax)
        )
      ),
      keep: infoCard2(
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

  // src/osakkeet/osakkeetUiOutcomeSections.ts
  function createIpoSection(dataState, pageReadState, localizedTextNodes) {
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
  function createResultsSection(dataState, pageReadState, localizedTextNodes) {
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
      createAnnualAdjustmentCards(osakkeetCalculation, texts, (title2, value, help) =>
        infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help)
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
        createSellOverviewCards(osakkeetCalculation, texts, (title2, value, help) =>
          infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help)
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
            createSellExplanationCards(osakkeetCalculation, texts, (title2, value, help) =>
              infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help)
            )
          ),
        hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.capitalGainAnnualTax.title),
        hasUsableIpoSellCalculation &&
          div(
            pageStyles.summaryGrid,
            createCapitalGainCards(osakkeetCalculation, texts, (title2, value, help) =>
              infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help)
            )
          ),
        hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.cashReserve.title),
        hasUsableIpoSellCalculation &&
          div(
            pageStyles.summaryGrid,
            createCashReserveCards(osakkeetCalculation, texts, (title2, value, help) =>
              infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help)
            )
          ),
        hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.saleResultComparison.title),
        hasUsableIpoSellCalculation &&
          div(
            pageStyles.summaryGrid,
            createSaleResultComparisonCards(osakkeetCalculation, texts, (title2, value, help) =>
              infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help)
            )
          ),
        hasUsableIpoSellCalculation && h3(texts.summary.ipoSell.ipoCostEffects.title),
        hasUsableIpoSellCalculation &&
          div(
            pageStyles.summaryGrid,
            createIpoCostEffectCards(osakkeetCalculation, texts, (title2, value, help) =>
              infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help)
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
    return createSectionController(root, ({ osakkeetCalculation }) => {
      annualAdjustmentRoot.style.display = osakkeetCalculation.ipoSell.usedLots.length > 0 ? '' : 'none'
    })
  }

  // src/osakkeet/browserUtils.ts
  function downloadJsonFile(fileName, value) {
    const blob = new Blob([JSON.stringify(value, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link2 = document.createElement('a')
    link2.href = url
    link2.download = fileName
    link2.click()
    URL.revokeObjectURL(url)
  }
  async function copyTextToClipboard(value) {
    var _a2
    if ((_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
    const textarea2 = document.createElement('textarea')
    textarea2.value = value
    textarea2.setAttribute('readonly', 'true')
    textarea2.style.position = 'absolute'
    textarea2.style.left = '-9999px'
    document.body.appendChild(textarea2)
    textarea2.select()
    textarea2.setSelectionRange(0, textarea2.value.length)
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea2)
    return copied
  }

  // src/osakkeet/osakkeetUiAssumptions.ts
  var sourceLinkDefinitions = [
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
  function linkToSource(textValue, href) {
    return a(textValue, { href, target: '_blank', rel: 'noreferrer' })
  }
  function assumptionsContent(t) {
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
        ...sourceLinkDefinitions.flatMap((source2, index) => [
          ...(index > 0 ? [', '] : []),
          linkToSource(t.sources[source2.key], source2.href),
        ])
      )
    )
  }

  // src/osakkeet/osakkeetExamples.ts
  var DEFAULT_EXAMPLE_PRESET = 'medium8y'
  var examplePresetConfigs = {
    small2y: {
      company: {
        listingStatus: 'unlisted',
        becameListedDate: '15.09.2026',
      },
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
        totalShareCount: '850000',
        totalIpoCost: '95000',
        currentShareValue: '10.20',
        estimatedPreIpoValue: '9000000',
        estimatedSecondaryShareSellPercentage: '3',
      },
      ipoSell: {
        amount: '900',
        pricePerShare: '10.58823529411764705882352941',
        costPerShare: '3.725490196078431372549019608',
        otherAnnualCapitalGainsOrLosses: '',
      },
    },
    medium8y: {
      company: {
        listingStatus: 'unlisted',
        becameListedDate: '15.09.2026',
      },
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
        totalShareCount: '1960000',
        totalIpoCost: '320000',
        currentShareValue: '20.50',
        estimatedPreIpoValue: '40000000',
        estimatedSecondaryShareSellPercentage: '10',
      },
      ipoSell: {
        amount: '18000',
        pricePerShare: '20.40816326530612244897959184',
        costPerShare: '1.632653061224489795918367347',
        otherAnnualCapitalGainsOrLosses: '-12000',
      },
    },
    large16y: {
      company: {
        listingStatus: 'unlisted',
        becameListedDate: '15.09.2026',
      },
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
        totalShareCount: '1050000',
        totalIpoCost: '720000',
        currentShareValue: '63.00',
        estimatedPreIpoValue: '66000000',
        estimatedSecondaryShareSellPercentage: '12',
      },
      ipoSell: {
        amount: '90000',
        pricePerShare: '62.85714285714285714285714286',
        costPerShare: '5.714285714285714285714285714',
        otherAnnualCapitalGainsOrLosses: '25000',
      },
    },
  }
  function createExampleOsakkeetFormData(preset, createId3) {
    const config2 = examplePresetConfigs[preset]
    return {
      company: { ...config2.company },
      subscriptions: config2.subscriptions.map((row) => ({ id: createId3('sub'), ...row })),
      sells: config2.sells.map((row) => ({ id: createId3('sell'), ...row })),
      cashDistributions: config2.cashDistributions.map((row) => ({ id: createId3('distribution'), ...row })),
      shareSplits: config2.shareSplits.map((row) => ({ id: createId3('split'), ...row })),
      demergers: config2.demergers.map((row) => ({ id: createId3('demerger'), ...row })),
      mathematicalShareValues: config2.mathematicalShareValues.map((row) => ({ id: createId3('math'), ...row })),
      ipo: { ...config2.ipo },
      ipoSell: { ...config2.ipoSell },
    }
  }

  // src/osakkeet/osakkeetUiBootstrap.ts
  function createId2(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
  }
  function createOsakkeetFormData(demo) {
    if (demo) {
      return createExampleOsakkeetFormData(DEFAULT_EXAMPLE_PRESET, createId2)
    }
    return {
      ...createBlankOsakkeetFormData(),
      subscriptions: [createEmptyCollectionRow('subscriptions', createId2)],
      sells: [],
      cashDistributions: [createEmptyCollectionRow('cashDistributions', createId2)],
    }
  }
  function tryLoadLanguage() {
    return localStorage.getItem(storageKeys.language) === 'en' ? 'en' : 'fi'
  }

  // src/osakkeet/osakkeetUiPageSections.ts
  function createTopSection(dataState, pageReadState, languageSelectionState, localizedTextNodes, initialStatus = '') {
    const viewState = createState({
      value: {
        status: initialStatus,
      },
    })
    const storageTextNodes = localizedTextNodes.storage
    const introTextNodes = localizedTextNodes.intro
    const languageSwitchTextNodes = localizedTextNodes.languageSwitch
    const statusNode = createTextNodesFromState(viewState, { path: ['status'] })
    let currentTexts = pageReadState.get().texts
    const assumptionsRoot = div()
    const timestampsRoot = div(pageStyles.denseStack)
    replaceChildrenFromState(pageReadState, assumptionsRoot, ({ texts }) => assumptionsContent(texts))
    replaceChildrenFromState(pageReadState, timestampsRoot, ({ formData, texts, languageSelection }) => [
      p(
        { class: 'muted' },
        pageStyles.compactParagraph,
        b(`${texts.storage.timestamps.companyData}: `),
        formatLastModifiedTimestamp(
          formData.lastModifiedCompanyData,
          languageSelection,
          texts.storage.timestamps.unavailable
        )
      ),
      p(
        { class: 'muted' },
        pageStyles.compactParagraph,
        b(`${texts.storage.timestamps.userData}: `),
        formatLastModifiedTimestamp(
          formData.lastModifiedUserData,
          languageSelection,
          texts.storage.timestamps.unavailable
        )
      ),
    ])
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
    const lastFileSavedHashSource = createStorageSource({
      storage: sessionStorage,
      key: storageKeys.lastFileSavedHash,
      serialize: (value) => value,
      deserialize: (raw) => raw,
    })
    const setStatus = (status) => {
      viewState.set((current) => ({ ...current, status }))
    }
    const loadFile = () => {
      fileInput.click()
    }
    const saveFullFile = () => {
      const normalized = normalizeOsakkeetFormData(dataState.get(), createId2)
      downloadJsonFile('osakkeet-input-state.json', createSavedOsakkeetFileData(normalized))
      const serialized = serializeOsakkeetFormData(normalized, createId2)
      lastFileSavedHashSource.save(serialized)
      setStatus(currentTexts.storage.status.fileSaved)
      refreshStorageButtons()
    }
    const saveCompanyFile = () => {
      downloadJsonFile(
        'osakkeet-company-state.json',
        createShareableOsakkeetUrlData(normalizeOsakkeetFormData(dataState.get(), createId2))
      )
      setStatus(currentTexts.storage.status.fileSaved)
    }
    const showExample = (preset) => {
      dataState.set(createExampleOsakkeetFormData(preset, createId2))
      setStatus(currentTexts.storage.status.exampleShown)
    }
    const copyCurrentShareUrl = () => {
      void (async () => {
        try {
          const copied = await copyTextToClipboard(await buildShareUrl(dataState.get(), createId2))
          setStatus(copied ? currentTexts.storage.status.shareUrlCopied : currentTexts.storage.errors.clipboardFailed)
        } catch {
          setStatus(currentTexts.storage.errors.shareUrlUnavailable)
        }
      })()
    }
    const createExampleButtonConfig = (labelNode, preset) => ({
      labelNode,
      variant: 'secondary',
      action: () => {
        showExample(preset)
      },
    })
    const refreshStorageButtons = () => {
      const currentSerialized = serializeOsakkeetFormData(dataState.get(), createId2)
      const lastFileSavedHash = lastFileSavedHashSource.load()
      const fileNeedsSave = lastFileSavedHash !== currentSerialized
      ;[topSaveFileButton, stickySaveFileButton].forEach((saveFileButton) => {
        setButtonAttention(
          saveFileButton,
          pageStyles.smallButton,
          pageStyles.attentionButton,
          pageStyles.disabledButton,
          fileNeedsSave
        )
        saveFileButton.title = fileNeedsSave
          ? currentTexts.storage.saveIndicators.fileNeedsSave
          : currentTexts.storage.saveIndicators.fileSaved
      })
    }
    const fileInput = input(
      { type: 'file', accept: 'application/json,.json', hidden: true },
      events({
        change({ node }) {
          var _a2
          const inputNode = node
          const file = (_a2 = inputNode.files) == null ? void 0 : _a2[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const parsed = JSON.parse(String(reader.result || '{}'))
              const normalized = deserializeSavedOsakkeetFileData(parsed, createId2)
              dataState.set(normalized)
              lastFileSavedHashSource.save(serializeOsakkeetFormData(normalized, createId2))
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
        variant: 'secondary',
        action: saveFullFile,
      },
      {
        labelNode: storageTextNodes.actions.saveCompanyFile,
        variant: 'secondary',
        action: saveCompanyFile,
      },
      {
        labelNode: storageTextNodes.actions.loadFile,
        variant: 'secondary',
        action: loadFile,
      },
      createExampleButtonConfig(storageTextNodes.actions.showSmallExample, 'small2y'),
      createExampleButtonConfig(storageTextNodes.actions.showMediumExample, 'medium8y'),
      createExampleButtonConfig(storageTextNodes.actions.showLargeExample, 'large16y'),
      {
        labelNode: storageTextNodes.actions.clearExample,
        variant: 'secondary',
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
        variant: 'secondary',
        action: copyCurrentShareUrl,
      },
    ]
    const [
      topSaveFileButton,
      topSaveCompanyFileButton,
      topLoadFileButton,
      smallExampleButton,
      mediumExampleButton,
      largeExampleButton,
      clearExampleButton,
      copyShareUrlButton,
    ] = buttonConfigs.map(({ labelNode, variant, action }) =>
      createActionButton(pageStyles.smallButton, labelNode, variant, action)
    )
    const stickySaveFileButton = createActionButton(
      pageStyles.smallButton,
      storageTextNodes.actions.saveFile,
      'secondary',
      saveFullFile
    )
    const stickyLoadFileButton = createActionButton(
      pageStyles.smallButton,
      storageTextNodes.actions.loadFile,
      'secondary',
      loadFile
    )
    dataState.onValueChange(() => {
      refreshStorageButtons()
    })
    refreshStorageButtons()
    const stickyWarningListRoot = ul(pageStyles.stickyWarningList)
    replaceChildrenFromState(pageReadState, stickyWarningListRoot, ({ texts }) =>
      texts.intro.warnings.map((warning) => li(warning))
    )
    const root = div(
      pageStyles.denseStack,
      div(
        { class: 'osakkeet-sticky-warning no-print' },
        div(
          { class: 'osakkeet-sticky-warning__inner' },
          pageStyles.stickyWarningBox,
          div(
            pageStyles.stickyWarningHeader,
            h3(pageStyles.stickyWarningTitle, introTextNodes.warningsTitle),
            div(pageStyles.stickyWarningActions, stickySaveFileButton, stickyLoadFileButton, clearExampleButton)
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
          timestampsRoot,
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
            div(
              { class: 'no-print' },
              pageStyles.topAlignedRowButtons,
              topSaveCompanyFileButton,
              copyShareUrlButton,
              topLoadFileButton
            )
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
    return createSectionController(root, ({ languageSelection, texts }) => {
      currentTexts = texts
      setButtonVariant(fiButton, pageStyles.smallButton, languageSelection === 'fi')
      setButtonVariant(enButton, pageStyles.smallButton, languageSelection === 'en')
      refreshStorageButtons()
    })
  }
  function createTaxSummarySection(pageReadState, localizedTextNodes) {
    const taxReturnsTextNodes = localizedTextNodes.taxReturns
    const resultsRoot = div(pageStyles.denseStack)
    replaceChildrenFromState(pageReadState, resultsRoot, ({ osakkeetCalculation, texts }) =>
      createTaxSummaryContent(osakkeetCalculation, texts, pageStyles, {
        createActionButton: (labelNode, variant, onClick) =>
          createActionButton(pageStyles.smallButton, labelNode, variant, onClick),
        infoCard: (title2, value, help) =>
          infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title2, value, help),
        withHoverInfo: (content, tooltip) =>
          withHoverInfo(pageStyles.hoverInfo, pageStyles.hoverInfoIcon, content, tooltip),
      })
    )
    const root = section({ class: 'card' }, h2(taxReturnsTextNodes.title), resultsRoot)
    return createSectionController(root, () => {})
  }

  // src/osakkeet/osakkeetUi.ts
  function currentModificationTimestamp() {
    return /* @__PURE__ */ new Date().toISOString()
  }
  function isIpoCalculatorVisible(formData) {
    if (formData.company.listingStatus !== 'unlisted') return false
    const becameListedDate = parseSupportedDate(formData.company.becameListedDate.trim())
    if (!becameListedDate || Number.isNaN(becameListedDate.getTime())) return true
    const now = /* @__PURE__ */ new Date()
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    return becameListedDate.getTime() >= todayUtc.getTime()
  }
  function createCompanyDataSignature(data2) {
    return JSON.stringify(createCompanyDataPayload(normalizeOsakkeetFormData(data2, createId2)))
  }
  function createUserDataSignature(data2) {
    const sanitized = normalizeOsakkeetFormData(data2, createId2)
    return JSON.stringify({
      subscriptions: sanitized.subscriptions,
      sells: sanitized.sells,
      ipoSell: sanitized.ipoSell,
    })
  }
  function syncLastModifiedTimestamps(dataState) {
    let previousCompanySignature = ''
    let previousUserSignature = ''
    const initialize = (current) => {
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
  function tryLoadWindowSavedData() {
    return createStorageSource({
      storage: sessionStorage,
      key: storageKeys.windowFormData,
      serialize: (value) => serializeOsakkeetFormData(value, createId2),
      deserialize: (raw) => deserializeOsakkeetFormData(raw, createId2),
    }).load()
  }
  async function tryLoadSharedUrlData() {
    const encoded = new URL(window.location.href).searchParams.get(shareUrlQueryKey)
    if (!encoded) return void 0
    const parsed = await decodeUrlState(encoded)
    return deserializeShareableOsakkeetUrlData(parsed, createId2)
  }
  async function tryLoadInitialData(texts) {
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
  function createMainSectionGroup(key, pageReadState, localizedTextNodes, sections, initiallyOpen = false) {
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
    const sync = (texts) => {
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
    return createSectionController(root, ({ texts }) => {
      sync(texts)
    })
  }
  function mainSectionMetric(label2, value) {
    return div(
      { class: 'osakkeet-main-section-metric' },
      pageStyles.mainSectionMetric,
      span(pageStyles.mainSectionMetricLabel, label2),
      b(value)
    )
  }
  function createMainSectionStats(key, osakkeetCalculation, texts) {
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
  function renderOsakkeetIpoCalculatorPage(initialData, initialLanguageSelection, initialStatus = '') {
    const dataStateHandle = createStorageBackedState({
      value: initialData,
      storage: sessionStorage,
      key: storageKeys.windowFormData,
      serialize: (value) => serializeOsakkeetFormData(value, createId2),
      deserialize: (raw) => deserializeOsakkeetFormData(raw, createId2),
      hydrate: false,
    })
    const languageSelectionStateHandle = createStorageBackedState({
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
    const companySection = createCompanySection(dataState, pageReadState, localizedTextNodes)
    const subscriptionsSection = createSubscriptionsSection(dataState, pageReadState, localizedTextNodes)
    const sellsSection = createSellsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes)
    const cashDistributionsSection = createCashDistributionsSection(
      dataState,
      pageReadState,
      localizedTextNodes,
      commonTextNodes
    )
    const demergersSection = createDemergersSection(dataState, pageReadState, localizedTextNodes, commonTextNodes)
    const shareSplitsSection = createShareSplitsSection(dataState, pageReadState, localizedTextNodes, commonTextNodes)
    const taxSummarySectionController = createTaxSummarySection(pageReadState, localizedTextNodes)
    const ipoSection = createIpoSection(dataState, pageReadState, localizedTextNodes)
    const resultsSection = createResultsSection(dataState, pageReadState, localizedTextNodes)
    const distributionsAndCorporateActionsSection = createMainSectionGroup(
      'distributionsAndCorporateActions',
      pageReadState,
      localizedTextNodes,
      [companySection, cashDistributionsSection, demergersSection, shareSplitsSection]
    )
    const subscriptionsAndSalesSection = createMainSectionGroup(
      'subscriptionsAndSales',
      pageReadState,
      localizedTextNodes,
      [subscriptionsSection, sellsSection]
    )
    const taxReturnsSection = createMainSectionGroup('taxReturns', pageReadState, localizedTextNodes, [
      taxSummarySectionController,
    ])
    const ipoCalculatorSection = createMainSectionGroup('ipoCalculator', pageReadState, localizedTextNodes, [
      ipoSection,
      resultsSection,
    ])
    const root = div(pageStyles.stack)
    const applyPageReadModel = (pageReadModel) => {
      topSection.set(pageReadModel)
      companySection.set(pageReadModel)
      subscriptionsSection.set(pageReadModel)
      sellsSection.set(pageReadModel)
      cashDistributionsSection.set(pageReadModel)
      demergersSection.set(pageReadModel)
      shareSplitsSection.set(pageReadModel)
      taxSummarySectionController.set(pageReadModel)
      ipoSection.set(pageReadModel)
      resultsSection.set(pageReadModel)
      distributionsAndCorporateActionsSection.set(pageReadModel)
      subscriptionsAndSalesSection.set(pageReadModel)
      taxReturnsSection.set(pageReadModel)
      ipoCalculatorSection.set(pageReadModel)
      ipoCalculatorSection.root.style.display = isIpoCalculatorVisible(pageReadModel.formData) ? '' : 'none'
    }
    pageReadState.onValueChange(applyPageReadModel)
    const initialPageReadModel = pageReadState.get()
    applyPageReadModel(initialPageReadModel)
    replaceChildren(
      root,
      topSection.root,
      distributionsAndCorporateActionsSection.root,
      subscriptionsAndSalesSection.root,
      taxReturnsSection.root,
      ipoCalculatorSection.root
    )
    return root
  }
  async function osakkeetIpoCalculatorPage() {
    const initialLanguageSelection = tryLoadLanguage()
    const initialTexts = getOsakkeetLocalization(initialLanguageSelection)
    const { data: data2, initialStatus } = await tryLoadInitialData(initialTexts)
    return renderOsakkeetIpoCalculatorPage(data2, initialLanguageSelection, initialStatus)
  }

  // src/kotibudjetti.ts
  console.log('kotibudjetti v0.0.1')
  function getRoute() {
    return window.location.hash === '#kaukolampo' ? 'kaukolampo' : 'osakkeet'
  }
  function setRoute(route) {
    window.location.hash = route === 'kaukolampo' ? '#kaukolampo' : '#osakkeet'
  }
  function navButton(label2, route, routeState) {
    return button(
      label2,
      routeState.get() === route && {
        class: 'active',
      },
      events({
        click() {
          setRoute(route)
        },
      })
    )
  }
  function sidebarNavigation(routeState) {
    return div(
      div({ class: 'brand' }, h1('Kotibudjetti'), p('Laskurit')),
      p({ class: 'muted' }, 'Beta'),
      div(
        { class: 'nav' },
        navButton('Osakkeet', 'osakkeet', routeState),
        navButton('Kaukol\xE4mp\xF6', 'kaukolampo', routeState)
      )
    )
  }
  function ensureBottomNav(routeState) {
    const existingBottomNav = document.querySelector('.bottom-nav')
    if (existingBottomNav instanceof HTMLElement) return existingBottomNav
    const bottomNav = div({ class: 'bottom-nav no-print' })
    document.body.appendChild(bottomNav)
    replaceChildren(
      bottomNav,
      navButton('Osakkeet', 'osakkeet', routeState),
      navButton('Kaukol\xE4mp\xF6', 'kaukolampo', routeState)
    )
    return bottomNav
  }
  function mountApp() {
    const routeState = createState({ value: getRoute() })
    const sidebar = document.querySelector('.sidebar')
    const bottomNav = ensureBottomNav(routeState)
    let renderVersion = 0
    window.addEventListener('hashchange', () => {
      routeState.set(getRoute())
    })
    routeState.onValueChange((route) => {
      const currentRenderVersion = ++renderVersion
      if (sidebar instanceof HTMLElement) {
        replaceChildren(sidebar, sidebarNavigation(routeState))
      }
      replaceChildren(
        bottomNav,
        navButton('Osakkeet', 'osakkeet', routeState),
        navButton('Kaukol\xE4mp\xF6', 'kaukolampo', routeState)
      )
      if (route === 'kaukolampo') {
        setElementToId('app', kaukolampoExcessPricingCalculator())
        return
      }
      void osakkeetIpoCalculatorPage().then((page) => {
        if (currentRenderVersion !== renderVersion) return
        setElementToId('app', page)
      })
    })
  }
  mountApp()
})()
/*! Bundled license information:

decimal.js/decimal.mjs:
  (*!
   *  decimal.js v10.6.0
   *  An arbitrary-precision Decimal type for JavaScript.
   *  https://github.com/MikeMcl/decimal.js
   *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
   *  MIT Licence
   *)
*/
