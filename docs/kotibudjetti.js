"use strict";
(() => {
  // ../ki-frame/src/util/objectIdCounter.ts
  var runningId = 0;
  function getId() {
    return runningId++;
  }
  function createId(id) {
    return `${id}-${getId()}`;
  }

  // ../ki-frame/src/channel.ts
  var Channel = class {
    constructor(name) {
      this.subs = /* @__PURE__ */ new Set();
      this.idTxt = (txt) => `${this.id}: ${txt}`;
      this.id = createId(name);
    }
    subscribe(fn) {
      this.subs.add(fn);
      return () => {
        this.unsubscribe(fn);
      };
    }
    subscribeFn() {
      return (fn) => this.subscribe(fn);
    }
    // subscribe once: handler auto-unsubscribe after first invocation
    once(fn) {
      const unsub = () => this.unsubscribe(wrapper);
      const wrapper = (...args) => {
        unsub();
        fn(...args);
      };
      this.subs.add(wrapper);
      return unsub;
    }
    unsubscribe(fn) {
      this.subs.delete(fn);
    }
    // synchronous publish — invokes handlers and doesn't wait for Promises
    publish(...args) {
      for (const fn of Array.from(this.subs)) {
        try {
          fn(...args);
        } catch (err) {
          console.error(this.idTxt(`Error in channel.publish() for '${this.id}':`), err);
        }
      }
    }
    // asynchronous publish — waits for all subscribers; rejects if any rejects
    async publishAsync(...args) {
      const promises = Array.from(this.subs).map(async (fn) => fn(...args));
      const settled = await Promise.allSettled(promises);
      const rejections = settled.filter((s2) => s2.status === "rejected");
      if (rejections.length) {
        const err = new Error(`${rejections.length} subscriber(s) failed`);
        err.details = rejections.map((r) => r.reason);
        throw err;
      }
    }
    destroy() {
      this.subs.clear();
    }
  };

  // ../ki-frame/src/form.ts
  var FormsInput = class {
    constructor(node, key, map2, validate) {
      this.node = node;
      this.key = key;
      this.map = map2;
      this.validate = validate;
    }
  };
  function collectFormsInputs(root) {
    const out = [];
    function visit2(node, pathParts) {
      if (node == null) return;
      if (node instanceof FormsInput) {
        const path = pathParts.map((p2) => String(p2)).join(".");
        out.push([path, node]);
        return;
      }
      if (Array.isArray(node)) {
        for (let i2 = 0; i2 < node.length; i2++) {
          visit2(node[i2], [...pathParts, i2]);
        }
        return;
      }
      if (typeof node === "object") {
        for (const key of Object.keys(node)) {
          visit2(node[key], [...pathParts, key]);
        }
        return;
      }
    }
    visit2(root, []);
    return out;
  }
  function readRaw(node) {
    var _a2;
    const anyNode = node;
    if ("value" in anyNode && typeof anyNode.value === "string") return anyNode.value;
    return String((_a2 = node.textContent) != null ? _a2 : "");
  }

  // ../ki-frame/src/promiseDestroy.ts
  var PromiseDestroy = class _PromiseDestroy {
    constructor(promise, destroy = () => {
    }) {
      this.promise = promise;
      this.destroy = destroy;
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
        return this.promise;
      }
      return this.promise.then(onfulfilled, onrejected);
    }
    catch(onrejected) {
      if (!onrejected) {
        return this;
      }
      return this.promise.catch(onrejected);
    }
    finally(onfinally) {
      return this.promise.finally(onfinally);
    }
    get [Symbol.toStringTag]() {
      return _PromiseDestroy.name;
    }
    /**
     * Optional: explicit toString which mirrors Object.prototype.toString
     */
    toString() {
      return Object.prototype.toString.call(this);
    }
  };
  var _a;
  var TimeoutDestroyable = class {
    constructor(fn, timeout) {
      this.fn = fn;
      this.timeout = timeout;
      this.at = Date.now() + ((_a = this.timeout) != null ? _a : 0);
      this.id = setTimeout(this.fn, this.timeout);
    }
    destroy() {
      clearTimeout(this.id);
    }
  };
  var FetchDestroyable = class extends PromiseDestroy {
    constructor(url, timeoutMs, promise, destroy) {
      super(promise, destroy);
      this.url = url;
      this.timeoutMs = timeoutMs;
      this.promise = promise;
      this.destroy = destroy;
    }
  };

  // ../ki-frame/src/util/getByPath.ts
  function getByPath(obj, path) {
    if (obj == null) return void 0;
    let segments;
    if (Array.isArray(path)) {
      segments = path.map((p2) => typeof p2 === "string" && /^\d+$/.test(p2) ? Number(p2) : p2);
    } else if (typeof path === "string") {
      if (path === "") return obj;
      segments = path.split(".").map((seg) => /^\d+$/.test(seg) ? Number(seg) : seg);
    } else {
      return void 0;
    }
    let cur = obj;
    for (const seg of segments) {
      if (cur == null) return void 0;
      cur = cur[seg];
    }
    return cur;
  }

  // ../ki-frame/src/util/setByPath.ts
  function setByPath(obj, path, value) {
    if (typeof path === "string") {
      path = path.split(".").map((seg) => {
        return /^[0-9]+$/.test(seg) ? Number(seg) : seg;
      });
    }
    if (path.length === 0) return;
    let cur = obj;
    for (let i2 = 0; i2 < path.length - 1; i2++) {
      const key = path[i2];
      if (cur[key] == null) {
        const nextKey = path[i2 + 1];
        cur[key] = typeof nextKey === "number" ? [] : {};
      }
      cur = cur[key];
    }
    const lastKey = path[path.length - 1];
    cur[lastKey] = value;
  }
  function copyAndSet(obj, path, value) {
    const segments = Array.isArray(path) ? path.map((p2) => typeof p2 === "string" && /^\d+$/.test(p2) ? Number(p2) : p2) : path === "" ? [] : path.split(".").map((seg) => /^\d+$/.test(seg) ? Number(seg) : seg);
    if (segments.length === 0) return value;
    const parents = [];
    let cur = obj;
    parents.push(cur);
    for (const seg of segments) {
      cur = cur !== null && typeof cur === "object" ? cur[seg] : void 0;
      parents.push(cur);
    }
    let newChild = value;
    for (let i2 = segments.length - 1; i2 >= 0; i2--) {
      const key = segments[i2];
      const origParent = parents[i2];
      let newParent;
      if (Array.isArray(origParent)) {
        newParent = origParent.slice();
      } else if (origParent !== null && typeof origParent === "object") {
        newParent = { ...origParent };
      } else {
        newParent = typeof key === "number" ? [] : {};
      }
      if (Array.isArray(newParent) && typeof key === "number") {
        if (key >= newParent.length) {
          newParent.length = key + 1;
        }
      }
      newParent[key] = newChild;
      newChild = newParent;
    }
    return newChild;
  }

  // ../ki-frame/src/util/strongOrWeakSet.ts
  var StrongOrWeakSet = class {
    constructor(mode) {
      this.coerce = mode;
    }
    *all() {
      if (this.items) {
        for (const i2 of this.items) {
          if (i2 instanceof WeakRef) {
            const deref = i2.deref();
            if (deref === void 0) {
              this.items.delete(i2);
            } else {
              yield deref;
            }
          } else {
            yield i2;
          }
        }
      }
    }
    add(item, itemMode = this.coerce) {
      const weakRef = new WeakRef(item);
      const unsub = () => {
        const deref = weakRef.deref();
        if (deref) {
          this.delete(deref);
        }
      };
      for (const i2 of this.all()) {
        if (i2 === item) {
          return unsub;
        }
      }
      const newItem = itemMode === "weak" ? weakRef : item;
      if (!this.items) {
        this.items = /* @__PURE__ */ new Set();
      }
      this.items.add(newItem);
      return unsub;
    }
    delete(item) {
      if (this.items) {
        for (const i2 of this.items) {
          if (i2 instanceof WeakRef) {
            const deref = i2.deref();
            if (deref === void 0 || deref === item) {
              this.items.delete(i2);
            }
          } else {
            if (i2 === item) {
              this.items.delete(i2);
            }
          }
        }
        if (this.items.size === 0) {
          this.destroy();
        }
      }
    }
    destroy() {
      if (this.items) {
        this.items.clear();
        this.items = void 0;
      }
    }
  };
  var DestroyableSet = class extends StrongOrWeakSet {
    destroy() {
      for (const destroyable of this.all()) {
        try {
          destroyable.destroy();
        } catch (err) {
          console.error(`Error in destroying item`, err);
        }
      }
      super.destroy();
    }
  };

  // ../ki-frame/src/util/typeUtils.ts
  function isDefined(item) {
    return item !== void 0 && item !== null;
  }

  // ../ki-frame/src/util/standardSchemaUtil.ts
  function schemaValidate(schema, obj, processValue, onValidateFailure) {
    const checkResult = (result) => {
      if (result.issues) {
        onValidateFailure == null ? void 0 : onValidateFailure(result);
      } else {
        processValue(result.value);
      }
    };
    const maybePromise = schema["~standard"].validate(obj);
    if (maybePromise instanceof Promise) {
      maybePromise.then(checkResult);
    } else {
      checkResult(maybePromise);
    }
  }

  // ../ki-frame/src/state.ts
  function shallowEqual(a2, b2) {
    return a2 === b2;
  }
  var Context = class {
    constructor(controllers = new DestroyableSet("weak")) {
      this.controllers = controllers;
    }
    createController(options) {
      const controller = new Controller(options);
      this.controllers.add(controller);
      return controller;
    }
    createState(params) {
      const state = new State(params);
      this.controllers.add(state);
      return state;
    }
    createForm(t, initValuesOrLinkedState, options) {
      const form2 = new FormState(t, initValuesOrLinkedState, options);
      form2.parent = this;
      this.controllers.add(form2);
      return form2;
    }
    destroy() {
      var _a2;
      (_a2 = this.parent) == null ? void 0 : _a2.controllers.delete(this);
      this.controllers.destroy();
    }
  };
  var Controller = class extends Context {
    constructor({ name = "controller", weakRef = false, parent } = {}) {
      super();
      this._destroyed = false;
      this.registeredSources = new DestroyableSet();
      this.onDestroyListeners = new DestroyableSet();
      this.linkedStates = /* @__PURE__ */ new Set();
      this.eventSources = [];
      this.id = getId();
      this.parent = parent;
      this.options = { name, weakRef };
    }
    getOutputChannel() {
      if (!isDefined(this.outputChannel)) {
        this.outputChannel = new Channel(`${this.stateId}-onChange`);
      }
      return this.outputChannel;
    }
    get stateId() {
      return `${this.options.name}-${this.id}`;
    }
    get destroyed() {
      return this._destroyed;
    }
    idTxt(txt) {
      return `${this.stateId}: ${txt}`;
    }
    describe() {
      return {
        name: this.stateId
      };
    }
    updateUi() {
      if (this.outputChannel) {
        this.outputChannel.publish({ type: "updateUi" });
      }
    }
    subscribe(cb) {
      if (this.destroyed) throw new Error(this.idTxt("Cannot subscribe to destroyed state"));
      return this.getOutputChannel().subscribe(cb);
    }
    addLinkedState(controller, options) {
      const value = { controller, ...options || {} };
      this.linkedStates.add(value);
      return () => this.linkedStates.delete(value);
    }
    onDestroy(target) {
      if (typeof target === "function") {
        if (this.destroyed) {
          target();
          return () => {
          };
        }
        const info = {
          type: "function",
          destroy: target
        };
        return this.onDestroyListeners.add(info);
      } else {
        if (this.destroyed) {
          target.destroy();
          return () => {
          };
        }
        return this.onDestroyListeners.add(target);
      }
    }
    /** Notify onDestroy() subscribers and call .destroy() for all attached states.
     * For an attached state also removes the state from parent.
     * Safe to call multiple times.
     **/
    destroy() {
      var _a2, _b;
      super.destroy();
      if (this.destroyed) return;
      this._destroyed = true;
      for (const linkedState of Array.from(this.linkedStates)) {
        if (!isDefined((_a2 = linkedState == null ? void 0 : linkedState.events) == null ? void 0 : _a2.destroy) || linkedState.events.destroy) {
          linkedState.controller.destroy();
        }
      }
      this.linkedStates.clear();
      this.registeredSources.destroy();
      this.onDestroyListeners.destroy();
      for (const es of this.eventSources) {
        if (es.weakRefUnsub) {
          const unsub = es.weakRefUnsub.deref();
          if (unsub) unsub();
          es.weakRefUnsub = void 0;
        }
        if (es.unsub) {
          es.unsub();
        }
        es.source = void 0;
      }
      (_b = this.outputChannel) == null ? void 0 : _b.destroy();
      this.eventSources.length = 0;
    }
    addDomEvent(name, node, type, listener, options) {
      node.addEventListener(type, listener, options);
      const unsub = () => node.removeEventListener(type, listener, options);
      if (this.options.weakRef) {
        this.eventSources.push({
          name: `${name}: <${node.nodeName}>.${type} -> ${this.stateId}`,
          type: "dom",
          source: new WeakRef(node),
          weakRefUnsub: new WeakRef(unsub)
        });
      } else {
        this.eventSources.push({
          name: `${name}: <${node.nodeName}>.${type} -> ${this.stateId}`,
          type: "dom",
          source: new WeakRef(node),
          unsub
        });
      }
      return unsub;
    }
    timeout(fn, at = 0) {
      const unregisterDestroyableAndCallItsDestroy = this.registeredSources.add(
        new TimeoutDestroyable(() => {
          unregisterDestroyableAndCallItsDestroy();
          fn();
        }, at)
      );
      return unregisterDestroyableAndCallItsDestroy;
    }
    fetch(url, fetchOptions) {
      const { timeoutMs, map: map2, assertOk = true, ...fetchInit } = fetchOptions != null ? fetchOptions : {};
      const createAbortController = (destroy) => {
        const abortController2 = new AbortController();
        const destroyAbortController2 = () => {
          timeoutUnsub();
          abortController2.abort();
          destroy();
        };
        const timeoutUnsub = this.timeout(destroyAbortController2, timeoutMs);
        return [abortController2, destroyAbortController2];
      };
      const [abortController, destroyAbortController] = isDefined(timeoutMs) ? createAbortController(() => unregisterDestroyableAndCallItsDestroy()) : [];
      const response = fetch(url, {
        ...fetchInit,
        signal: abortController == null ? void 0 : abortController.signal
      });
      const maybeOkResponse = assertOk ? response.then((response2) => {
        if (typeof assertOk === "function" && assertOk(response2) === false || !response2.ok) {
          throw { errorResponse: response2 };
        }
        return response2;
      }) : response;
      const unregisterDestroyableAndCallItsDestroy = this.registeredSources.add(
        new FetchDestroyable(url, timeoutMs, maybeOkResponse, () => {
          unregisterDestroyableAndCallItsDestroy();
          destroyAbortController == null ? void 0 : destroyAbortController();
        })
      );
      maybeOkResponse.finally(unregisterDestroyableAndCallItsDestroy);
      if (map2) {
        const mappedPromise = (async () => {
          return map2(maybeOkResponse);
        })();
        return new PromiseDestroy(mappedPromise, unregisterDestroyableAndCallItsDestroy);
      }
      return new PromiseDestroy(maybeOkResponse, unregisterDestroyableAndCallItsDestroy);
    }
  };
  function getMergedStateValue(states) {
    const value = {};
    for (const key of Object.keys(states)) {
      value[key] = states[key].get();
    }
    return value;
  }
  var _State = class _State extends Controller {
    constructor({ name = "state", weakRef = false, value, parent, schema, onValidateFailure } = {}) {
      super({ name, weakRef, parent });
      this.value = value;
      this.schema = schema;
      this.onValidateFailure = onValidateFailure;
    }
    get() {
      if (this.destroyed) throw new Error(this.idTxt("State destroyed. Cannot get value"));
      return this.value;
    }
    getOnChange() {
      if (!isDefined(this.onChange)) {
        this.onChange = new Channel(`${this.stateId}-onChange`);
      }
      return this.onChange;
    }
    set(valueOrInputOrFn, onValidateFailure) {
      if (this.destroyed) throw new Error(this.idTxt("State destroyed. Cannot set() value"));
      const old = this.value;
      const value = typeof valueOrInputOrFn === "function" ? valueOrInputOrFn(this.value) : valueOrInputOrFn;
      if (value === _State.Never) return;
      if (!shallowEqual(old, value)) {
        const setAndPublish = () => {
          this.value = value;
          this.getOnChange().publish(this.value, old ? old : value);
        };
        if (this.schema) {
          schemaValidate(this.schema, value, setAndPublish, (failure) => {
            var _a2;
            (_a2 = this.onValidateFailure) == null ? void 0 : _a2.call(this, failure);
            onValidateFailure == null ? void 0 : onValidateFailure(failure);
          });
        } else {
          setAndPublish();
        }
      }
    }
    update(partialValueOrInputOrFn, onValidateFailure) {
      if (this.destroyed) throw new Error(this.idTxt("State destroyed. Cannot update() value"));
      if (this.value === void 0) throw new Error(this.idTxt("State is undefined. Can not update() value"));
      if (typeof this.value !== "object") throw new Error(this.idTxt("State is not an object. Can not update() value"));
      const updateObject = typeof partialValueOrInputOrFn === "function" ? partialValueOrInputOrFn(this.value) : partialValueOrInputOrFn;
      if (updateObject === _State.Never) return;
      this.set({ ...this.value, ...updateObject }, onValidateFailure);
    }
    onValueChange(cb, params) {
      if (this.destroyed) throw new Error(this.idTxt("Cannot subscribe to destroyed state"));
      const unsub = this.getOnChange().subscribe(cb);
      if (isDefined(this.value) && !(params == null ? void 0 : params.noInit)) {
        cb(this.value, this.value);
      }
      return unsub;
    }
    destroy() {
      var _a2;
      super.destroy();
      (_a2 = this.onChange) == null ? void 0 : _a2.destroy();
    }
    map(map2, params = {}) {
      const state = new _State({ ...params });
      this.onValueChange((obj) => {
        state.set((cur) => map2(obj, cur));
      });
      return state;
    }
    reducer(reducer) {
      return (action) => this.set((value) => reducer(action, value));
    }
  };
  _State.Never = /* @__PURE__ */ Symbol("State.Never");
  var State = _State;
  function mergeStates(states, mapper) {
    const calculateValue = (cur) => {
      const mergedValue = getMergedStateValue(states);
      if (!mapper) return mergedValue;
      return mapper(mergedValue, cur);
    };
    const initialValue = calculateValue();
    const mergedState = initialValue === State.Never ? new State() : new State({ value: initialValue });
    const unsubs = Object.keys(states).map(
      (key) => states[key].onValueChange(
        () => {
          mergedState.set((cur) => calculateValue(cur));
        },
        { noInit: true }
      )
    );
    mergedState.onDestroy(() => {
      for (const unsub of unsubs) {
        unsub();
      }
    });
    return mergedState;
  }
  var FormState = class extends State {
    constructor(t, initValuesOrLinkedState, options) {
      const { validate } = options || {};
      const inputs2 = collectFormsInputs(t);
      if (initValuesOrLinkedState instanceof State) {
        const initState = initValuesOrLinkedState.get();
        const init = {};
        inputs2.forEach(([path]) => setByPath(init, path, getByPath(initState, path)));
        super(init);
        this.configureInputs(this, inputs2);
        this.onValueChange((newState) => {
          if (validate && !validate(newState)) {
            return;
          }
          initValuesOrLinkedState.update(newState);
        });
      } else {
        super(initValuesOrLinkedState);
        if (validate) {
          const validInputValuesState = this.createState({ value: initValuesOrLinkedState });
          validInputValuesState.options.name = "valid input values";
          validInputValuesState.onValueChange((newState) => {
            if (!validate(newState)) {
              return;
            }
            this.set(newState);
          });
          this.configureInputs(validInputValuesState, inputs2);
        } else {
          this.configureInputs(this, inputs2);
        }
      }
    }
    configureInputs(inputState, inputs2) {
      for (const [path, input2] of inputs2) {
        const state = inputState.get();
        const value = getByPath(state, path);
        if (input2.node instanceof HTMLInputElement) {
          input2.node.value = value;
        }
        inputState.addDomEvent(path, input2.node, input2.key, (ev) => {
          const value2 = input2.map ? input2.map(readRaw(input2.node)) : readRaw(input2.node);
          if (input2.validate && !input2.validate(value2, input2.node, ev)) {
            return;
          }
          const newState = copyAndSet(inputState.get(), path, value2);
          inputState.set(newState);
        });
      }
    }
    onsubmit(root, listener, options) {
      return this.addDomEvent(
        "submit",
        root,
        "submit",
        (ev) => {
          ev.preventDefault();
          listener(ev);
        },
        options
      );
    }
  };

  // ../ki-frame/src/index.ts
  var defaultContext = new Context();
  var createController = defaultContext.createController.bind(defaultContext);
  var createState = defaultContext.createState.bind(defaultContext);
  var createForm = defaultContext.createForm.bind(defaultContext);

  // ../ki-frame/src/domBuilderEvents.ts
  var EventHandlerObject = class {
    constructor(events2) {
      this.events = events2;
    }
  };
  function events(events2) {
    return new EventHandlerObject(events2 instanceof EventHandlerObject || "events" in events2 ? events2.events : events2);
  }
  function setEvents(node, arg) {
    const ev = arg instanceof EventHandlerObject ? arg : events(arg);
    Object.entries(ev.events).forEach(([key, fn]) => {
      node.addEventListener(key, (event) => {
        fn == null ? void 0 : fn({ node, event });
      });
    });
  }

  // ../ki-frame/src/domBuilderStyles.ts
  function setClass(element, argValue) {
    const classList = element.classList;
    const visit2 = (argValue2) => {
      if (Array.isArray(argValue2)) {
        argValue2.forEach((arg) => visit2(arg));
      } else {
        classList.add(...argValue2.split(" "));
      }
    };
    visit2(argValue);
  }
  function styles(...inputs2) {
    const flat = {};
    for (const input2 of Array.from(inputs2).flat()) {
      if (input2 instanceof StylesObject) {
        Object.assign(flat, input2.styles);
      } else {
        Object.assign(flat, input2);
      }
    }
    return new StylesObject(flat);
  }
  var StylesObject = class {
    constructor(styles2) {
      this.styles = styles2;
    }
  };
  var UNIT_PX_PROPS = /* @__PURE__ */ new Set([
    // common layout/size props
    "width",
    "height",
    "top",
    "left",
    "right",
    "bottom",
    "minWidth",
    "minHeight",
    "maxWidth",
    "maxHeight",
    "margin",
    "marginTop",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "padding",
    "paddingTop",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "gap",
    "rowGap",
    "columnGap",
    "fontSize",
    "borderWidth",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderRadius",
    "outlineWidth",
    "letterSpacing",
    "lineHeight"
  ]);
  function convertPrimitiveValue(prop, val) {
    if (val === null || val === void 0) return "";
    if (typeof val === "number") {
      if (prop.startsWith("--")) return String(val);
      if (UNIT_PX_PROPS.has(prop)) return `${val}px`;
      return String(val);
    }
    return String(val);
  }
  function convertArrayValue(prop, arr) {
    const flat = [];
    for (const v of arr) {
      if (Array.isArray(v)) {
        for (const vv of v) flat.push(vv);
      } else {
        flat.push(v);
      }
    }
    const parts = flat.map((p2) => convertPrimitiveValue(prop, p2));
    return parts.join(", ");
  }
  function setStyle(el, ...inputs2) {
    for (const style2 of inputs2) {
      for (const key in style2) {
        if (!Object.prototype.hasOwnProperty.call(style2, key)) continue;
        const raw = style2[key];
        if (isDefined(raw)) {
          if (key.startsWith("--")) {
            if (Array.isArray(raw)) {
              const val = convertArrayValue(key, raw);
              el.style.setProperty(key, val);
            } else {
              const val = convertPrimitiveValue(key, raw);
              el.style.setProperty(key, val);
            }
            continue;
          }
          let finalValue;
          if (Array.isArray(raw)) {
            finalValue = convertArrayValue(key, raw);
          } else {
            finalValue = convertPrimitiveValue(key, raw);
          }
          ;
          el.style[key] = finalValue;
        }
      }
    }
  }

  // ../ki-frame/src/types.ts
  var WrappedNode = class {
    constructor(node) {
      this.node = node;
    }
  };

  // ../ki-frame/src/domBuilder.ts
  function visit(element, fragment, ...args) {
    args.forEach((arg) => {
      if (arg === false || arg === void 0) {
      } else if (Array.isArray(arg)) {
        visit(element, fragment, ...arg);
      } else if (isAppendableNode(arg)) {
        fragment.appendChild(arg);
      } else if (arg instanceof WrappedNode) {
        fragment.appendChild(arg.node);
      } else if (arg instanceof StylesObject) {
        setStyle(element, arg.styles);
      } else if (arg instanceof EventHandlerObject) {
        setEvents(element, arg);
      } else if (typeof arg === "string" || typeof arg === "number") {
        fragment.appendChild(getDocument().createTextNode(String(arg)));
      } else if (typeof arg === "object") {
        Object.entries(arg).forEach(([key, argValue]) => {
          if (key === "class") {
            setClass(element, argValue);
          } else if (key === "styles") {
            setStyle(element, argValue);
          } else if (key === "events") {
            setEvents(element, argValue);
          } else if (key.startsWith("on") && typeof argValue === "function") {
            const event = key.substring(2).toLowerCase();
            element.addEventListener(event, argValue);
          } else {
            element.setAttribute(key, argValue);
          }
        });
      }
    });
  }
  function appendOrReplace(replace, elementOrWrapped, ...args) {
    const element = elementOrWrapped instanceof WrappedNode ? elementOrWrapped.node : elementOrWrapped;
    const fragment = getDocument().createDocumentFragment();
    visit(element, fragment, ...args);
    if (replace) {
      element.replaceChildren(fragment);
    } else {
      element.appendChild(fragment);
    }
  }
  function appendChildren(element, ...args) {
    appendOrReplace(false, element, ...args);
  }
  function replaceChildren(element, ...args) {
    appendOrReplace(true, element, ...args);
  }
  var doc = typeof document !== "undefined" ? document : void 0;
  var isAppendableNode = (e) => {
    return typeof document !== "undefined" && !![HTMLElement, Text].find((value) => e instanceof value);
  };
  function getDocument() {
    if (doc) {
      return doc;
    }
    throw new Error("document is undefined");
  }
  function createElement(tagName, ...args) {
    const element = getDocument().createElement(tagName);
    appendChildren(element, ...args);
    return element;
  }
  var createElementFn = (tagName) => (...args) => createElement(tagName, ...args);
  var a = createElementFn("a");
  var abbr = createElementFn("abbr");
  var address = createElementFn("address");
  var area = createElementFn("area");
  var article = createElementFn("article");
  var aside = createElementFn("aside");
  var audio = createElementFn("audio");
  var b = createElementFn("b");
  var base = createElementFn("base");
  var bdi = createElementFn("bdi");
  var bdo = createElementFn("bdo");
  var blockquote = createElementFn("blockquote");
  var body = createElementFn("body");
  var br = createElementFn("br");
  var button = createElementFn("button");
  var canvas = createElementFn("canvas");
  var caption = createElementFn("caption");
  var cite = createElementFn("cite");
  var code = createElementFn("code");
  var col = createElementFn("col");
  var colgroup = createElementFn("colgroup");
  var data = createElementFn("data");
  var datalist = createElementFn("datalist");
  var dd = createElementFn("dd");
  var del = createElementFn("del");
  var details = createElementFn("details");
  var dfn = createElementFn("dfn");
  var dialog = createElementFn("dialog");
  var div = createElementFn("div");
  var dl = createElementFn("dl");
  var dt = createElementFn("dt");
  var em = createElementFn("em");
  var embed = createElementFn("embed");
  var fieldset = createElementFn("fieldset");
  var figcaption = createElementFn("figcaption");
  var figure = createElementFn("figure");
  var footer = createElementFn("footer");
  var form = createElementFn("form");
  var h1 = createElementFn("h1");
  var h2 = createElementFn("h2");
  var h3 = createElementFn("h3");
  var h4 = createElementFn("h4");
  var h5 = createElementFn("h5");
  var h6 = createElementFn("h6");
  var head = createElementFn("head");
  var header = createElementFn("header");
  var hgroup = createElementFn("hgroup");
  var hr = createElementFn("hr");
  var html = createElementFn("html");
  var i = createElementFn("i");
  var iframe = createElementFn("iframe");
  var img = createElementFn("img");
  var input = createElementFn("input");
  var ins = createElementFn("ins");
  var kbd = createElementFn("kbd");
  var label = createElementFn("label");
  var legend = createElementFn("legend");
  var li = createElementFn("li");
  var link = createElementFn("link");
  var main = createElementFn("main");
  var map = createElementFn("map");
  var mark = createElementFn("mark");
  var menu = createElementFn("menu");
  var meta = createElementFn("meta");
  var meter = createElementFn("meter");
  var nav = createElementFn("nav");
  var noscript = createElementFn("noscript");
  var object = createElementFn("object");
  var ol = createElementFn("ol");
  var optgroup = createElementFn("optgroup");
  var option = createElementFn("option");
  var output = createElementFn("output");
  var p = createElementFn("p");
  var picture = createElementFn("picture");
  var pre = createElementFn("pre");
  var progress = createElementFn("progress");
  var q = createElementFn("q");
  var rp = createElementFn("rp");
  var rt = createElementFn("rt");
  var ruby = createElementFn("ruby");
  var s = createElementFn("s");
  var samp = createElementFn("samp");
  var script = createElementFn("script");
  var search = createElementFn("search");
  var section = createElementFn("section");
  var select = createElementFn("select");
  var slot = createElementFn("slot");
  var small = createElementFn("small");
  var source = createElementFn("source");
  var span = createElementFn("span");
  var strong = createElementFn("strong");
  var style = createElementFn("style");
  var sub = createElementFn("sub");
  var summary = createElementFn("summary");
  var sup = createElementFn("sup");
  var table = createElementFn("table");
  var tbody = createElementFn("tbody");
  var td = createElementFn("td");
  var template = createElementFn("template");
  var textarea = createElementFn("textarea");
  var tfoot = createElementFn("tfoot");
  var th = createElementFn("th");
  var thead = createElementFn("thead");
  var time = createElementFn("time");
  var title = createElementFn("title");
  var tr = createElementFn("tr");
  var track = createElementFn("track");
  var u = createElementFn("u");
  var ul = createElementFn("ul");
  var varE = createElementFn("var");
  var video = createElementFn("video");
  var wbr = createElementFn("wbr");
  var text = (arg = "") => getDocument().createTextNode(String(arg));
  var createInputFn = (type) => (...args) => createElement("input", { type }, ...args);
  var inputs = {
    button: createInputFn("button"),
    checkbox: createInputFn("checkbox"),
    color: createInputFn("color"),
    date: createInputFn("date"),
    datetimeLocal: createInputFn("datetime-local"),
    email: createInputFn("email"),
    hidden: createInputFn("hidden"),
    image: createInputFn("image"),
    month: createInputFn("month"),
    number: createInputFn("number"),
    password: createInputFn("password"),
    radio: createInputFn("radio"),
    range: createInputFn("range"),
    reset: createInputFn("reset"),
    search: createInputFn("search"),
    submit: createInputFn("submit"),
    tel: createInputFn("tel"),
    text: createInputFn("text"),
    time: createInputFn("time"),
    url: createInputFn("url"),
    week: createInputFn("week")
  };
  function setElementToId(targetId, element) {
    const targetElement = getDocument().getElementById(targetId);
    if (targetElement) {
      targetElement.replaceChildren(element);
    } else {
      console.error(`Target element with ID "${targetId}" not found!`);
    }
  }

  // node_modules/decimal.js/decimal.mjs
  var EXP_LIMIT = 9e15;
  var MAX_DIGITS = 1e9;
  var NUMERALS = "0123456789abcdef";
  var LN10 = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058";
  var PI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789";
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
    crypto: false
    // true/false
  };
  var inexact;
  var quadrant;
  var external = true;
  var decimalError = "[DecimalError] ";
  var invalidArgument = decimalError + "Invalid argument: ";
  var precisionLimitExceeded = decimalError + "Precision limit exceeded";
  var cryptoUnavailable = decimalError + "crypto unavailable";
  var tag = "[object Decimal]";
  var mathfloor = Math.floor;
  var mathpow = Math.pow;
  var isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
  var isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i;
  var isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;
  var isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
  var BASE = 1e7;
  var LOG_BASE = 7;
  var MAX_SAFE_INTEGER = 9007199254740991;
  var LN10_PRECISION = LN10.length - 1;
  var PI_PRECISION = PI.length - 1;
  var P = { toStringTag: tag };
  P.absoluteValue = P.abs = function() {
    var x = new this.constructor(this);
    if (x.s < 0) x.s = 1;
    return finalise(x);
  };
  P.ceil = function() {
    return finalise(new this.constructor(this), this.e + 1, 2);
  };
  P.clampedTo = P.clamp = function(min2, max2) {
    var k, x = this, Ctor = x.constructor;
    min2 = new Ctor(min2);
    max2 = new Ctor(max2);
    if (!min2.s || !max2.s) return new Ctor(NaN);
    if (min2.gt(max2)) throw Error(invalidArgument + max2);
    k = x.cmp(min2);
    return k < 0 ? min2 : x.cmp(max2) > 0 ? max2 : new Ctor(x);
  };
  P.comparedTo = P.cmp = function(y) {
    var i2, j, xdL, ydL, x = this, xd = x.d, yd = (y = new x.constructor(y)).d, xs = x.s, ys = y.s;
    if (!xd || !yd) {
      return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
    }
    if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;
    if (xs !== ys) return xs;
    if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;
    xdL = xd.length;
    ydL = yd.length;
    for (i2 = 0, j = xdL < ydL ? xdL : ydL; i2 < j; ++i2) {
      if (xd[i2] !== yd[i2]) return xd[i2] > yd[i2] ^ xs < 0 ? 1 : -1;
    }
    return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
  };
  P.cosine = P.cos = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.d) return new Ctor(NaN);
    if (!x.d[0]) return new Ctor(1);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
    Ctor.rounding = 1;
    x = cosine(Ctor, toLessThanHalfPi(Ctor, x));
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
  };
  P.cubeRoot = P.cbrt = function() {
    var e, m, n, r, rep, s2, sd, t, t3, t3plusx, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    external = false;
    s2 = x.s * mathpow(x.s * x, 1 / 3);
    if (!s2 || Math.abs(s2) == 1 / 0) {
      n = digitsToString(x.d);
      e = x.e;
      if (s2 = (e - n.length + 1) % 3) n += s2 == 1 || s2 == -2 ? "0" : "00";
      s2 = mathpow(n, 1 / 3);
      e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));
      if (s2 == 1 / 0) {
        n = "5e" + e;
      } else {
        n = s2.toExponential();
        n = n.slice(0, n.indexOf("e") + 1) + e;
      }
      r = new Ctor(n);
      r.s = x.s;
    } else {
      r = new Ctor(s2.toString());
    }
    sd = (e = Ctor.precision) + 3;
    for (; ; ) {
      t = r;
      t3 = t.times(t).times(t);
      t3plusx = t3.plus(x);
      r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);
      if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
        n = n.slice(sd - 3, sd + 1);
        if (n == "9999" || !rep && n == "4999") {
          if (!rep) {
            finalise(t, e + 1, 0);
            if (t.times(t).times(t).eq(x)) {
              r = t;
              break;
            }
          }
          sd += 4;
          rep = 1;
        } else {
          if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
            finalise(r, e + 1, 1);
            m = !r.times(r).times(r).eq(x);
          }
          break;
        }
      }
    }
    external = true;
    return finalise(r, e, Ctor.rounding, m);
  };
  P.decimalPlaces = P.dp = function() {
    var w, d = this.d, n = NaN;
    if (d) {
      w = d.length - 1;
      n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;
      w = d[w];
      if (w) for (; w % 10 == 0; w /= 10) n--;
      if (n < 0) n = 0;
    }
    return n;
  };
  P.dividedBy = P.div = function(y) {
    return divide(this, new this.constructor(y));
  };
  P.dividedToIntegerBy = P.divToInt = function(y) {
    var x = this, Ctor = x.constructor;
    return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
  };
  P.equals = P.eq = function(y) {
    return this.cmp(y) === 0;
  };
  P.floor = function() {
    return finalise(new this.constructor(this), this.e + 1, 3);
  };
  P.greaterThan = P.gt = function(y) {
    return this.cmp(y) > 0;
  };
  P.greaterThanOrEqualTo = P.gte = function(y) {
    var k = this.cmp(y);
    return k == 1 || k === 0;
  };
  P.hyperbolicCosine = P.cosh = function() {
    var k, n, pr, rm, len, x = this, Ctor = x.constructor, one = new Ctor(1);
    if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
    if (x.isZero()) return one;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
    Ctor.rounding = 1;
    len = x.d.length;
    if (len < 32) {
      k = Math.ceil(len / 3);
      n = (1 / tinyPow(4, k)).toString();
    } else {
      k = 16;
      n = "2.3283064365386962890625e-10";
    }
    x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);
    var cosh2_x, i2 = k, d8 = new Ctor(8);
    for (; i2--; ) {
      cosh2_x = x.times(x);
      x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
    }
    return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
  };
  P.hyperbolicSine = P.sinh = function() {
    var k, pr, rm, len, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
    Ctor.rounding = 1;
    len = x.d.length;
    if (len < 3) {
      x = taylorSeries(Ctor, 2, x, x, true);
    } else {
      k = 1.4 * Math.sqrt(len);
      k = k > 16 ? 16 : k | 0;
      x = x.times(1 / tinyPow(5, k));
      x = taylorSeries(Ctor, 2, x, x, true);
      var sinh2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
      for (; k--; ) {
        sinh2_x = x.times(x);
        x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
      }
    }
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(x, pr, rm, true);
  };
  P.hyperbolicTangent = P.tanh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(x.s);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 7;
    Ctor.rounding = 1;
    return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
  };
  P.inverseCosine = P.acos = function() {
    var x = this, Ctor = x.constructor, k = x.abs().cmp(1), pr = Ctor.precision, rm = Ctor.rounding;
    if (k !== -1) {
      return k === 0 ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0) : new Ctor(NaN);
    }
    if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);
    Ctor.precision = pr + 6;
    Ctor.rounding = 1;
    x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(2);
  };
  P.inverseHyperbolicCosine = P.acosh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
    if (!x.isFinite()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
    Ctor.rounding = 1;
    external = false;
    x = x.times(x).minus(1).sqrt().plus(x);
    external = true;
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.ln();
  };
  P.inverseHyperbolicSine = P.asinh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
    Ctor.rounding = 1;
    external = false;
    x = x.times(x).plus(1).sqrt().plus(x);
    external = true;
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.ln();
  };
  P.inverseHyperbolicTangent = P.atanh = function() {
    var pr, rm, wpr, xsd, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    xsd = x.sd();
    if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);
    Ctor.precision = wpr = xsd - x.e;
    x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);
    Ctor.precision = pr + 4;
    Ctor.rounding = 1;
    x = x.ln();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(0.5);
  };
  P.inverseSine = P.asin = function() {
    var halfPi, k, pr, rm, x = this, Ctor = x.constructor;
    if (x.isZero()) return new Ctor(x);
    k = x.abs().cmp(1);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (k !== -1) {
      if (k === 0) {
        halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
        halfPi.s = x.s;
        return halfPi;
      }
      return new Ctor(NaN);
    }
    Ctor.precision = pr + 6;
    Ctor.rounding = 1;
    x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(2);
  };
  P.inverseTangent = P.atan = function() {
    var i2, j, k, n, px, t, r, wpr, x2, x = this, Ctor = x.constructor, pr = Ctor.precision, rm = Ctor.rounding;
    if (!x.isFinite()) {
      if (!x.s) return new Ctor(NaN);
      if (pr + 4 <= PI_PRECISION) {
        r = getPi(Ctor, pr + 4, rm).times(0.5);
        r.s = x.s;
        return r;
      }
    } else if (x.isZero()) {
      return new Ctor(x);
    } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
      r = getPi(Ctor, pr + 4, rm).times(0.25);
      r.s = x.s;
      return r;
    }
    Ctor.precision = wpr = pr + 10;
    Ctor.rounding = 1;
    k = Math.min(28, wpr / LOG_BASE + 2 | 0);
    for (i2 = k; i2; --i2) x = x.div(x.times(x).plus(1).sqrt().plus(1));
    external = false;
    j = Math.ceil(wpr / LOG_BASE);
    n = 1;
    x2 = x.times(x);
    r = new Ctor(x);
    px = x;
    for (; i2 !== -1; ) {
      px = px.times(x2);
      t = r.minus(px.div(n += 2));
      px = px.times(x2);
      r = t.plus(px.div(n += 2));
      if (r.d[j] !== void 0) for (i2 = j; r.d[i2] === t.d[i2] && i2--; ) ;
    }
    if (k) r = r.times(2 << k - 1);
    external = true;
    return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
  };
  P.isFinite = function() {
    return !!this.d;
  };
  P.isInteger = P.isInt = function() {
    return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
  };
  P.isNaN = function() {
    return !this.s;
  };
  P.isNegative = P.isNeg = function() {
    return this.s < 0;
  };
  P.isPositive = P.isPos = function() {
    return this.s > 0;
  };
  P.isZero = function() {
    return !!this.d && this.d[0] === 0;
  };
  P.lessThan = P.lt = function(y) {
    return this.cmp(y) < 0;
  };
  P.lessThanOrEqualTo = P.lte = function(y) {
    return this.cmp(y) < 1;
  };
  P.logarithm = P.log = function(base2) {
    var isBase10, d, denominator, k, inf, num, sd, r, arg = this, Ctor = arg.constructor, pr = Ctor.precision, rm = Ctor.rounding, guard = 5;
    if (base2 == null) {
      base2 = new Ctor(10);
      isBase10 = true;
    } else {
      base2 = new Ctor(base2);
      d = base2.d;
      if (base2.s < 0 || !d || !d[0] || base2.eq(1)) return new Ctor(NaN);
      isBase10 = base2.eq(10);
    }
    d = arg.d;
    if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
      return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
    }
    if (isBase10) {
      if (d.length > 1) {
        inf = true;
      } else {
        for (k = d[0]; k % 10 === 0; ) k /= 10;
        inf = k !== 1;
      }
    }
    external = false;
    sd = pr + guard;
    num = naturalLogarithm(arg, sd);
    denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base2, sd);
    r = divide(num, denominator, sd, 1);
    if (checkRoundingDigits(r.d, k = pr, rm)) {
      do {
        sd += 10;
        num = naturalLogarithm(arg, sd);
        denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base2, sd);
        r = divide(num, denominator, sd, 1);
        if (!inf) {
          if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
            r = finalise(r, pr + 1, 0);
          }
          break;
        }
      } while (checkRoundingDigits(r.d, k += 10, rm));
    }
    external = true;
    return finalise(r, pr, rm);
  };
  P.minus = P.sub = function(y) {
    var d, e, i2, j, k, len, pr, rm, xd, xe, xLTy, yd, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.d) {
      if (!x.s || !y.s) y = new Ctor(NaN);
      else if (x.d) y.s = -y.s;
      else y = new Ctor(y.d || x.s !== y.s ? x : NaN);
      return y;
    }
    if (x.s != y.s) {
      y.s = -y.s;
      return x.plus(y);
    }
    xd = x.d;
    yd = y.d;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (!xd[0] || !yd[0]) {
      if (yd[0]) y.s = -y.s;
      else if (xd[0]) y = new Ctor(x);
      else return new Ctor(rm === 3 ? -0 : 0);
      return external ? finalise(y, pr, rm) : y;
    }
    e = mathfloor(y.e / LOG_BASE);
    xe = mathfloor(x.e / LOG_BASE);
    xd = xd.slice();
    k = xe - e;
    if (k) {
      xLTy = k < 0;
      if (xLTy) {
        d = xd;
        k = -k;
        len = yd.length;
      } else {
        d = yd;
        e = xe;
        len = xd.length;
      }
      i2 = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;
      if (k > i2) {
        k = i2;
        d.length = 1;
      }
      d.reverse();
      for (i2 = k; i2--; ) d.push(0);
      d.reverse();
    } else {
      i2 = xd.length;
      len = yd.length;
      xLTy = i2 < len;
      if (xLTy) len = i2;
      for (i2 = 0; i2 < len; i2++) {
        if (xd[i2] != yd[i2]) {
          xLTy = xd[i2] < yd[i2];
          break;
        }
      }
      k = 0;
    }
    if (xLTy) {
      d = xd;
      xd = yd;
      yd = d;
      y.s = -y.s;
    }
    len = xd.length;
    for (i2 = yd.length - len; i2 > 0; --i2) xd[len++] = 0;
    for (i2 = yd.length; i2 > k; ) {
      if (xd[--i2] < yd[i2]) {
        for (j = i2; j && xd[--j] === 0; ) xd[j] = BASE - 1;
        --xd[j];
        xd[i2] += BASE;
      }
      xd[i2] -= yd[i2];
    }
    for (; xd[--len] === 0; ) xd.pop();
    for (; xd[0] === 0; xd.shift()) --e;
    if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);
    y.d = xd;
    y.e = getBase10Exponent(xd, e);
    return external ? finalise(y, pr, rm) : y;
  };
  P.modulo = P.mod = function(y) {
    var q2, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);
    if (!y.d || x.d && !x.d[0]) {
      return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
    }
    external = false;
    if (Ctor.modulo == 9) {
      q2 = divide(x, y.abs(), 0, 3, 1);
      q2.s *= y.s;
    } else {
      q2 = divide(x, y, 0, Ctor.modulo, 1);
    }
    q2 = q2.times(y);
    external = true;
    return x.minus(q2);
  };
  P.naturalExponential = P.exp = function() {
    return naturalExponential(this);
  };
  P.naturalLogarithm = P.ln = function() {
    return naturalLogarithm(this);
  };
  P.negated = P.neg = function() {
    var x = new this.constructor(this);
    x.s = -x.s;
    return finalise(x);
  };
  P.plus = P.add = function(y) {
    var carry, d, e, i2, k, len, pr, rm, xd, yd, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.d) {
      if (!x.s || !y.s) y = new Ctor(NaN);
      else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);
      return y;
    }
    if (x.s != y.s) {
      y.s = -y.s;
      return x.minus(y);
    }
    xd = x.d;
    yd = y.d;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (!xd[0] || !yd[0]) {
      if (!yd[0]) y = new Ctor(x);
      return external ? finalise(y, pr, rm) : y;
    }
    k = mathfloor(x.e / LOG_BASE);
    e = mathfloor(y.e / LOG_BASE);
    xd = xd.slice();
    i2 = k - e;
    if (i2) {
      if (i2 < 0) {
        d = xd;
        i2 = -i2;
        len = yd.length;
      } else {
        d = yd;
        e = k;
        len = xd.length;
      }
      k = Math.ceil(pr / LOG_BASE);
      len = k > len ? k + 1 : len + 1;
      if (i2 > len) {
        i2 = len;
        d.length = 1;
      }
      d.reverse();
      for (; i2--; ) d.push(0);
      d.reverse();
    }
    len = xd.length;
    i2 = yd.length;
    if (len - i2 < 0) {
      i2 = len;
      d = yd;
      yd = xd;
      xd = d;
    }
    for (carry = 0; i2; ) {
      carry = (xd[--i2] = xd[i2] + yd[i2] + carry) / BASE | 0;
      xd[i2] %= BASE;
    }
    if (carry) {
      xd.unshift(carry);
      ++e;
    }
    for (len = xd.length; xd[--len] == 0; ) xd.pop();
    y.d = xd;
    y.e = getBase10Exponent(xd, e);
    return external ? finalise(y, pr, rm) : y;
  };
  P.precision = P.sd = function(z) {
    var k, x = this;
    if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);
    if (x.d) {
      k = getPrecision(x.d);
      if (z && x.e + 1 > k) k = x.e + 1;
    } else {
      k = NaN;
    }
    return k;
  };
  P.round = function() {
    var x = this, Ctor = x.constructor;
    return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
  };
  P.sine = P.sin = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
    Ctor.rounding = 1;
    x = sine(Ctor, toLessThanHalfPi(Ctor, x));
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
  };
  P.squareRoot = P.sqrt = function() {
    var m, n, sd, r, rep, t, x = this, d = x.d, e = x.e, s2 = x.s, Ctor = x.constructor;
    if (s2 !== 1 || !d || !d[0]) {
      return new Ctor(!s2 || s2 < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
    }
    external = false;
    s2 = Math.sqrt(+x);
    if (s2 == 0 || s2 == 1 / 0) {
      n = digitsToString(d);
      if ((n.length + e) % 2 == 0) n += "0";
      s2 = Math.sqrt(n);
      e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);
      if (s2 == 1 / 0) {
        n = "5e" + e;
      } else {
        n = s2.toExponential();
        n = n.slice(0, n.indexOf("e") + 1) + e;
      }
      r = new Ctor(n);
    } else {
      r = new Ctor(s2.toString());
    }
    sd = (e = Ctor.precision) + 3;
    for (; ; ) {
      t = r;
      r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);
      if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
        n = n.slice(sd - 3, sd + 1);
        if (n == "9999" || !rep && n == "4999") {
          if (!rep) {
            finalise(t, e + 1, 0);
            if (t.times(t).eq(x)) {
              r = t;
              break;
            }
          }
          sd += 4;
          rep = 1;
        } else {
          if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
            finalise(r, e + 1, 1);
            m = !r.times(r).eq(x);
          }
          break;
        }
      }
    }
    external = true;
    return finalise(r, e, Ctor.rounding, m);
  };
  P.tangent = P.tan = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 10;
    Ctor.rounding = 1;
    x = x.sin();
    x.s = 1;
    x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
  };
  P.times = P.mul = function(y) {
    var carry, e, i2, k, r, rL, t, xdL, ydL, x = this, Ctor = x.constructor, xd = x.d, yd = (y = new Ctor(y)).d;
    y.s *= x.s;
    if (!xd || !xd[0] || !yd || !yd[0]) {
      return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd ? NaN : !xd || !yd ? y.s / 0 : y.s * 0);
    }
    e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
    xdL = xd.length;
    ydL = yd.length;
    if (xdL < ydL) {
      r = xd;
      xd = yd;
      yd = r;
      rL = xdL;
      xdL = ydL;
      ydL = rL;
    }
    r = [];
    rL = xdL + ydL;
    for (i2 = rL; i2--; ) r.push(0);
    for (i2 = ydL; --i2 >= 0; ) {
      carry = 0;
      for (k = xdL + i2; k > i2; ) {
        t = r[k] + yd[i2] * xd[k - i2 - 1] + carry;
        r[k--] = t % BASE | 0;
        carry = t / BASE | 0;
      }
      r[k] = (r[k] + carry) % BASE | 0;
    }
    for (; !r[--rL]; ) r.pop();
    if (carry) ++e;
    else r.shift();
    y.d = r;
    y.e = getBase10Exponent(r, e);
    return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
  };
  P.toBinary = function(sd, rm) {
    return toStringBinary(this, 2, sd, rm);
  };
  P.toDecimalPlaces = P.toDP = function(dp, rm) {
    var x = this, Ctor = x.constructor;
    x = new Ctor(x);
    if (dp === void 0) return x;
    checkInt32(dp, 0, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
    return finalise(x, dp + x.e + 1, rm);
  };
  P.toExponential = function(dp, rm) {
    var str, x = this, Ctor = x.constructor;
    if (dp === void 0) {
      str = finiteToString(x, true);
    } else {
      checkInt32(dp, 0, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
      x = finalise(new Ctor(x), dp + 1, rm);
      str = finiteToString(x, true, dp + 1);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.toFixed = function(dp, rm) {
    var str, y, x = this, Ctor = x.constructor;
    if (dp === void 0) {
      str = finiteToString(x);
    } else {
      checkInt32(dp, 0, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
      y = finalise(new Ctor(x), dp + x.e + 1, rm);
      str = finiteToString(y, false, dp + y.e + 1);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.toFraction = function(maxD) {
    var d, d0, d1, d2, e, k, n, n0, n1, pr, q2, r, x = this, xd = x.d, Ctor = x.constructor;
    if (!xd) return new Ctor(x);
    n1 = d0 = new Ctor(1);
    d1 = n0 = new Ctor(0);
    d = new Ctor(d1);
    e = d.e = getPrecision(xd) - x.e - 1;
    k = e % LOG_BASE;
    d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);
    if (maxD == null) {
      maxD = e > 0 ? d : n1;
    } else {
      n = new Ctor(maxD);
      if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
      maxD = n.gt(d) ? e > 0 ? d : n1 : n;
    }
    external = false;
    n = new Ctor(digitsToString(xd));
    pr = Ctor.precision;
    Ctor.precision = e = xd.length * LOG_BASE * 2;
    for (; ; ) {
      q2 = divide(n, d, 0, 1, 1);
      d2 = d0.plus(q2.times(d1));
      if (d2.cmp(maxD) == 1) break;
      d0 = d1;
      d1 = d2;
      d2 = n1;
      n1 = n0.plus(q2.times(d2));
      n0 = d2;
      d2 = d;
      d = n.minus(q2.times(d2));
      n = d2;
    }
    d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
    n0 = n0.plus(d2.times(n1));
    d0 = d0.plus(d2.times(d1));
    n0.s = n1.s = x.s;
    r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];
    Ctor.precision = pr;
    external = true;
    return r;
  };
  P.toHexadecimal = P.toHex = function(sd, rm) {
    return toStringBinary(this, 16, sd, rm);
  };
  P.toNearest = function(y, rm) {
    var x = this, Ctor = x.constructor;
    x = new Ctor(x);
    if (y == null) {
      if (!x.d) return x;
      y = new Ctor(1);
      rm = Ctor.rounding;
    } else {
      y = new Ctor(y);
      if (rm === void 0) {
        rm = Ctor.rounding;
      } else {
        checkInt32(rm, 0, 8);
      }
      if (!x.d) return y.s ? x : y;
      if (!y.d) {
        if (y.s) y.s = x.s;
        return y;
      }
    }
    if (y.d[0]) {
      external = false;
      x = divide(x, y, 0, rm, 1).times(y);
      external = true;
      finalise(x);
    } else {
      y.s = x.s;
      x = y;
    }
    return x;
  };
  P.toNumber = function() {
    return +this;
  };
  P.toOctal = function(sd, rm) {
    return toStringBinary(this, 8, sd, rm);
  };
  P.toPower = P.pow = function(y) {
    var e, k, pr, r, rm, s2, x = this, Ctor = x.constructor, yn = +(y = new Ctor(y));
    if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));
    x = new Ctor(x);
    if (x.eq(1)) return x;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (y.eq(1)) return finalise(x, pr, rm);
    e = mathfloor(y.e / LOG_BASE);
    if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
      r = intPow(Ctor, x, k, pr);
      return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
    }
    s2 = x.s;
    if (s2 < 0) {
      if (e < y.d.length - 1) return new Ctor(NaN);
      if ((y.d[e] & 1) == 0) s2 = 1;
      if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
        x.s = s2;
        return x;
      }
    }
    k = mathpow(+x, yn);
    e = k == 0 || !isFinite(k) ? mathfloor(yn * (Math.log("0." + digitsToString(x.d)) / Math.LN10 + x.e + 1)) : new Ctor(k + "").e;
    if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s2 / 0 : 0);
    external = false;
    Ctor.rounding = x.s = 1;
    k = Math.min(12, (e + "").length);
    r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);
    if (r.d) {
      r = finalise(r, pr + 5, 1);
      if (checkRoundingDigits(r.d, pr, rm)) {
        e = pr + 10;
        r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);
        if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
          r = finalise(r, pr + 1, 0);
        }
      }
    }
    r.s = s2;
    external = true;
    Ctor.rounding = rm;
    return finalise(r, pr, rm);
  };
  P.toPrecision = function(sd, rm) {
    var str, x = this, Ctor = x.constructor;
    if (sd === void 0) {
      str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    } else {
      checkInt32(sd, 1, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
      x = finalise(new Ctor(x), sd, rm);
      str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.toSignificantDigits = P.toSD = function(sd, rm) {
    var x = this, Ctor = x.constructor;
    if (sd === void 0) {
      sd = Ctor.precision;
      rm = Ctor.rounding;
    } else {
      checkInt32(sd, 1, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
    }
    return finalise(new Ctor(x), sd, rm);
  };
  P.toString = function() {
    var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.truncated = P.trunc = function() {
    return finalise(new this.constructor(this), this.e + 1, 1);
  };
  P.valueOf = P.toJSON = function() {
    var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    return x.isNeg() ? "-" + str : str;
  };
  function digitsToString(d) {
    var i2, k, ws, indexOfLastWord = d.length - 1, str = "", w = d[0];
    if (indexOfLastWord > 0) {
      str += w;
      for (i2 = 1; i2 < indexOfLastWord; i2++) {
        ws = d[i2] + "";
        k = LOG_BASE - ws.length;
        if (k) str += getZeroString(k);
        str += ws;
      }
      w = d[i2];
      ws = w + "";
      k = LOG_BASE - ws.length;
      if (k) str += getZeroString(k);
    } else if (w === 0) {
      return "0";
    }
    for (; w % 10 === 0; ) w /= 10;
    return str + w;
  }
  function checkInt32(i2, min2, max2) {
    if (i2 !== ~~i2 || i2 < min2 || i2 > max2) {
      throw Error(invalidArgument + i2);
    }
  }
  function checkRoundingDigits(d, i2, rm, repeating) {
    var di, k, r, rd;
    for (k = d[0]; k >= 10; k /= 10) --i2;
    if (--i2 < 0) {
      i2 += LOG_BASE;
      di = 0;
    } else {
      di = Math.ceil((i2 + 1) / LOG_BASE);
      i2 %= LOG_BASE;
    }
    k = mathpow(10, LOG_BASE - i2);
    rd = d[di] % k | 0;
    if (repeating == null) {
      if (i2 < 3) {
        if (i2 == 0) rd = rd / 100 | 0;
        else if (i2 == 1) rd = rd / 10 | 0;
        r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 5e4 || rd == 0;
      } else {
        r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 100 | 0) == mathpow(10, i2 - 2) - 1 || (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
      }
    } else {
      if (i2 < 4) {
        if (i2 == 0) rd = rd / 1e3 | 0;
        else if (i2 == 1) rd = rd / 100 | 0;
        else if (i2 == 2) rd = rd / 10 | 0;
        r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
      } else {
        r = ((repeating || rm < 4) && rd + 1 == k || !repeating && rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 1e3 | 0) == mathpow(10, i2 - 3) - 1;
      }
    }
    return r;
  }
  function convertBase(str, baseIn, baseOut) {
    var j, arr = [0], arrL, i2 = 0, strL = str.length;
    for (; i2 < strL; ) {
      for (arrL = arr.length; arrL--; ) arr[arrL] *= baseIn;
      arr[0] += NUMERALS.indexOf(str.charAt(i2++));
      for (j = 0; j < arr.length; j++) {
        if (arr[j] > baseOut - 1) {
          if (arr[j + 1] === void 0) arr[j + 1] = 0;
          arr[j + 1] += arr[j] / baseOut | 0;
          arr[j] %= baseOut;
        }
      }
    }
    return arr.reverse();
  }
  function cosine(Ctor, x) {
    var k, len, y;
    if (x.isZero()) return x;
    len = x.d.length;
    if (len < 32) {
      k = Math.ceil(len / 3);
      y = (1 / tinyPow(4, k)).toString();
    } else {
      k = 16;
      y = "2.3283064365386962890625e-10";
    }
    Ctor.precision += k;
    x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));
    for (var i2 = k; i2--; ) {
      var cos2x = x.times(x);
      x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
    }
    Ctor.precision -= k;
    return x;
  }
  var divide = /* @__PURE__ */ (function() {
    function multiplyInteger(x, k, base2) {
      var temp, carry = 0, i2 = x.length;
      for (x = x.slice(); i2--; ) {
        temp = x[i2] * k + carry;
        x[i2] = temp % base2 | 0;
        carry = temp / base2 | 0;
      }
      if (carry) x.unshift(carry);
      return x;
    }
    function compare(a2, b2, aL, bL) {
      var i2, r;
      if (aL != bL) {
        r = aL > bL ? 1 : -1;
      } else {
        for (i2 = r = 0; i2 < aL; i2++) {
          if (a2[i2] != b2[i2]) {
            r = a2[i2] > b2[i2] ? 1 : -1;
            break;
          }
        }
      }
      return r;
    }
    function subtract(a2, b2, aL, base2) {
      var i2 = 0;
      for (; aL--; ) {
        a2[aL] -= i2;
        i2 = a2[aL] < b2[aL] ? 1 : 0;
        a2[aL] = i2 * base2 + a2[aL] - b2[aL];
      }
      for (; !a2[0] && a2.length > 1; ) a2.shift();
    }
    return function(x, y, pr, rm, dp, base2) {
      var cmp, e, i2, k, logBase, more, prod, prodL, q2, qd, rem, remL, rem0, sd, t, xi, xL, yd0, yL, yz, Ctor = x.constructor, sign2 = x.s == y.s ? 1 : -1, xd = x.d, yd = y.d;
      if (!xd || !xd[0] || !yd || !yd[0]) {
        return new Ctor(
          // Return NaN if either NaN, or both Infinity or 0.
          !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN : (
            // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
            xd && xd[0] == 0 || !yd ? sign2 * 0 : sign2 / 0
          )
        );
      }
      if (base2) {
        logBase = 1;
        e = x.e - y.e;
      } else {
        base2 = BASE;
        logBase = LOG_BASE;
        e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
      }
      yL = yd.length;
      xL = xd.length;
      q2 = new Ctor(sign2);
      qd = q2.d = [];
      for (i2 = 0; yd[i2] == (xd[i2] || 0); i2++) ;
      if (yd[i2] > (xd[i2] || 0)) e--;
      if (pr == null) {
        sd = pr = Ctor.precision;
        rm = Ctor.rounding;
      } else if (dp) {
        sd = pr + (x.e - y.e) + 1;
      } else {
        sd = pr;
      }
      if (sd < 0) {
        qd.push(1);
        more = true;
      } else {
        sd = sd / logBase + 2 | 0;
        i2 = 0;
        if (yL == 1) {
          k = 0;
          yd = yd[0];
          sd++;
          for (; (i2 < xL || k) && sd--; i2++) {
            t = k * base2 + (xd[i2] || 0);
            qd[i2] = t / yd | 0;
            k = t % yd | 0;
          }
          more = k || i2 < xL;
        } else {
          k = base2 / (yd[0] + 1) | 0;
          if (k > 1) {
            yd = multiplyInteger(yd, k, base2);
            xd = multiplyInteger(xd, k, base2);
            yL = yd.length;
            xL = xd.length;
          }
          xi = yL;
          rem = xd.slice(0, yL);
          remL = rem.length;
          for (; remL < yL; ) rem[remL++] = 0;
          yz = yd.slice();
          yz.unshift(0);
          yd0 = yd[0];
          if (yd[1] >= base2 / 2) ++yd0;
          do {
            k = 0;
            cmp = compare(yd, rem, yL, remL);
            if (cmp < 0) {
              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base2 + (rem[1] || 0);
              k = rem0 / yd0 | 0;
              if (k > 1) {
                if (k >= base2) k = base2 - 1;
                prod = multiplyInteger(yd, k, base2);
                prodL = prod.length;
                remL = rem.length;
                cmp = compare(prod, rem, prodL, remL);
                if (cmp == 1) {
                  k--;
                  subtract(prod, yL < prodL ? yz : yd, prodL, base2);
                }
              } else {
                if (k == 0) cmp = k = 1;
                prod = yd.slice();
              }
              prodL = prod.length;
              if (prodL < remL) prod.unshift(0);
              subtract(rem, prod, remL, base2);
              if (cmp == -1) {
                remL = rem.length;
                cmp = compare(yd, rem, yL, remL);
                if (cmp < 1) {
                  k++;
                  subtract(rem, yL < remL ? yz : yd, remL, base2);
                }
              }
              remL = rem.length;
            } else if (cmp === 0) {
              k++;
              rem = [0];
            }
            qd[i2++] = k;
            if (cmp && rem[0]) {
              rem[remL++] = xd[xi] || 0;
            } else {
              rem = [xd[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] !== void 0) && sd--);
          more = rem[0] !== void 0;
        }
        if (!qd[0]) qd.shift();
      }
      if (logBase == 1) {
        q2.e = e;
        inexact = more;
      } else {
        for (i2 = 1, k = qd[0]; k >= 10; k /= 10) i2++;
        q2.e = i2 + e * logBase - 1;
        finalise(q2, dp ? pr + q2.e + 1 : pr, rm, more);
      }
      return q2;
    };
  })();
  function finalise(x, sd, rm, isTruncated) {
    var digits, i2, j, k, rd, roundUp, w, xd, xdi, Ctor = x.constructor;
    out: if (sd != null) {
      xd = x.d;
      if (!xd) return x;
      for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
      i2 = sd - digits;
      if (i2 < 0) {
        i2 += LOG_BASE;
        j = sd;
        w = xd[xdi = 0];
        rd = w / mathpow(10, digits - j - 1) % 10 | 0;
      } else {
        xdi = Math.ceil((i2 + 1) / LOG_BASE);
        k = xd.length;
        if (xdi >= k) {
          if (isTruncated) {
            for (; k++ <= xdi; ) xd.push(0);
            w = rd = 0;
            digits = 1;
            i2 %= LOG_BASE;
            j = i2 - LOG_BASE + 1;
          } else {
            break out;
          }
        } else {
          w = k = xd[xdi];
          for (digits = 1; k >= 10; k /= 10) digits++;
          i2 %= LOG_BASE;
          j = i2 - LOG_BASE + digits;
          rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
        }
      }
      isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));
      roundUp = rm < 4 ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
      (i2 > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
      if (sd < 1 || !xd[0]) {
        xd.length = 0;
        if (roundUp) {
          sd -= x.e + 1;
          xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
          x.e = -sd || 0;
        } else {
          xd[0] = x.e = 0;
        }
        return x;
      }
      if (i2 == 0) {
        xd.length = xdi;
        k = 1;
        xdi--;
      } else {
        xd.length = xdi + 1;
        k = mathpow(10, LOG_BASE - i2);
        xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
      }
      if (roundUp) {
        for (; ; ) {
          if (xdi == 0) {
            for (i2 = 1, j = xd[0]; j >= 10; j /= 10) i2++;
            j = xd[0] += k;
            for (k = 1; j >= 10; j /= 10) k++;
            if (i2 != k) {
              x.e++;
              if (xd[0] == BASE) xd[0] = 1;
            }
            break;
          } else {
            xd[xdi] += k;
            if (xd[xdi] != BASE) break;
            xd[xdi--] = 0;
            k = 1;
          }
        }
      }
      for (i2 = xd.length; xd[--i2] === 0; ) xd.pop();
    }
    if (external) {
      if (x.e > Ctor.maxE) {
        x.d = null;
        x.e = NaN;
      } else if (x.e < Ctor.minE) {
        x.e = 0;
        x.d = [0];
      }
    }
    return x;
  }
  function finiteToString(x, isExp, sd) {
    if (!x.isFinite()) return nonFiniteToString(x);
    var k, e = x.e, str = digitsToString(x.d), len = str.length;
    if (isExp) {
      if (sd && (k = sd - len) > 0) {
        str = str.charAt(0) + "." + str.slice(1) + getZeroString(k);
      } else if (len > 1) {
        str = str.charAt(0) + "." + str.slice(1);
      }
      str = str + (x.e < 0 ? "e" : "e+") + x.e;
    } else if (e < 0) {
      str = "0." + getZeroString(-e - 1) + str;
      if (sd && (k = sd - len) > 0) str += getZeroString(k);
    } else if (e >= len) {
      str += getZeroString(e + 1 - len);
      if (sd && (k = sd - e - 1) > 0) str = str + "." + getZeroString(k);
    } else {
      if ((k = e + 1) < len) str = str.slice(0, k) + "." + str.slice(k);
      if (sd && (k = sd - len) > 0) {
        if (e + 1 === len) str += ".";
        str += getZeroString(k);
      }
    }
    return str;
  }
  function getBase10Exponent(digits, e) {
    var w = digits[0];
    for (e *= LOG_BASE; w >= 10; w /= 10) e++;
    return e;
  }
  function getLn10(Ctor, sd, pr) {
    if (sd > LN10_PRECISION) {
      external = true;
      if (pr) Ctor.precision = pr;
      throw Error(precisionLimitExceeded);
    }
    return finalise(new Ctor(LN10), sd, 1, true);
  }
  function getPi(Ctor, sd, rm) {
    if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
    return finalise(new Ctor(PI), sd, rm, true);
  }
  function getPrecision(digits) {
    var w = digits.length - 1, len = w * LOG_BASE + 1;
    w = digits[w];
    if (w) {
      for (; w % 10 == 0; w /= 10) len--;
      for (w = digits[0]; w >= 10; w /= 10) len++;
    }
    return len;
  }
  function getZeroString(k) {
    var zs = "";
    for (; k--; ) zs += "0";
    return zs;
  }
  function intPow(Ctor, x, n, pr) {
    var isTruncated, r = new Ctor(1), k = Math.ceil(pr / LOG_BASE + 4);
    external = false;
    for (; ; ) {
      if (n % 2) {
        r = r.times(x);
        if (truncate(r.d, k)) isTruncated = true;
      }
      n = mathfloor(n / 2);
      if (n === 0) {
        n = r.d.length - 1;
        if (isTruncated && r.d[n] === 0) ++r.d[n];
        break;
      }
      x = x.times(x);
      truncate(x.d, k);
    }
    external = true;
    return r;
  }
  function isOdd(n) {
    return n.d[n.d.length - 1] & 1;
  }
  function maxOrMin(Ctor, args, n) {
    var k, y, x = new Ctor(args[0]), i2 = 0;
    for (; ++i2 < args.length; ) {
      y = new Ctor(args[i2]);
      if (!y.s) {
        x = y;
        break;
      }
      k = x.cmp(y);
      if (k === n || k === 0 && x.s === n) {
        x = y;
      }
    }
    return x;
  }
  function naturalExponential(x, sd) {
    var denominator, guard, j, pow2, sum2, t, wpr, rep = 0, i2 = 0, k = 0, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (!x.d || !x.d[0] || x.e > 17) {
      return new Ctor(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : 0 / 0);
    }
    if (sd == null) {
      external = false;
      wpr = pr;
    } else {
      wpr = sd;
    }
    t = new Ctor(0.03125);
    while (x.e > -2) {
      x = x.times(t);
      k += 5;
    }
    guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
    wpr += guard;
    denominator = pow2 = sum2 = new Ctor(1);
    Ctor.precision = wpr;
    for (; ; ) {
      pow2 = finalise(pow2.times(x), wpr, 1);
      denominator = denominator.times(++i2);
      t = sum2.plus(divide(pow2, denominator, wpr, 1));
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        j = k;
        while (j--) sum2 = finalise(sum2.times(sum2), wpr, 1);
        if (sd == null) {
          if (rep < 3 && checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += 10;
            denominator = pow2 = t = new Ctor(1);
            i2 = 0;
            rep++;
          } else {
            return finalise(sum2, Ctor.precision = pr, rm, external = true);
          }
        } else {
          Ctor.precision = pr;
          return sum2;
        }
      }
      sum2 = t;
    }
  }
  function naturalLogarithm(y, sd) {
    var c, c0, denominator, e, numerator, rep, sum2, t, wpr, x1, x2, n = 1, guard = 10, x = y, xd = x.d, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
      return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
    }
    if (sd == null) {
      external = false;
      wpr = pr;
    } else {
      wpr = sd;
    }
    Ctor.precision = wpr += guard;
    c = digitsToString(xd);
    c0 = c.charAt(0);
    if (Math.abs(e = x.e) < 15e14) {
      while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
        x = x.times(y);
        c = digitsToString(x.d);
        c0 = c.charAt(0);
        n++;
      }
      e = x.e;
      if (c0 > 1) {
        x = new Ctor("0." + c);
        e++;
      } else {
        x = new Ctor(c0 + "." + c.slice(1));
      }
    } else {
      t = getLn10(Ctor, wpr + 2, pr).times(e + "");
      x = naturalLogarithm(new Ctor(c0 + "." + c.slice(1)), wpr - guard).plus(t);
      Ctor.precision = pr;
      return sd == null ? finalise(x, pr, rm, external = true) : x;
    }
    x1 = x;
    sum2 = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
    x2 = finalise(x.times(x), wpr, 1);
    denominator = 3;
    for (; ; ) {
      numerator = finalise(numerator.times(x2), wpr, 1);
      t = sum2.plus(divide(numerator, new Ctor(denominator), wpr, 1));
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        sum2 = sum2.times(2);
        if (e !== 0) sum2 = sum2.plus(getLn10(Ctor, wpr + 2, pr).times(e + ""));
        sum2 = divide(sum2, new Ctor(n), wpr, 1);
        if (sd == null) {
          if (checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += guard;
            t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
            x2 = finalise(x.times(x), wpr, 1);
            denominator = rep = 1;
          } else {
            return finalise(sum2, Ctor.precision = pr, rm, external = true);
          }
        } else {
          Ctor.precision = pr;
          return sum2;
        }
      }
      sum2 = t;
      denominator += 2;
    }
  }
  function nonFiniteToString(x) {
    return String(x.s * x.s / 0);
  }
  function parseDecimal(x, str) {
    var e, i2, len;
    if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
    if ((i2 = str.search(/e/i)) > 0) {
      if (e < 0) e = i2;
      e += +str.slice(i2 + 1);
      str = str.substring(0, i2);
    } else if (e < 0) {
      e = str.length;
    }
    for (i2 = 0; str.charCodeAt(i2) === 48; i2++) ;
    for (len = str.length; str.charCodeAt(len - 1) === 48; --len) ;
    str = str.slice(i2, len);
    if (str) {
      len -= i2;
      x.e = e = e - i2 - 1;
      x.d = [];
      i2 = (e + 1) % LOG_BASE;
      if (e < 0) i2 += LOG_BASE;
      if (i2 < len) {
        if (i2) x.d.push(+str.slice(0, i2));
        for (len -= LOG_BASE; i2 < len; ) x.d.push(+str.slice(i2, i2 += LOG_BASE));
        str = str.slice(i2);
        i2 = LOG_BASE - str.length;
      } else {
        i2 -= len;
      }
      for (; i2--; ) str += "0";
      x.d.push(+str);
      if (external) {
        if (x.e > x.constructor.maxE) {
          x.d = null;
          x.e = NaN;
        } else if (x.e < x.constructor.minE) {
          x.e = 0;
          x.d = [0];
        }
      }
    } else {
      x.e = 0;
      x.d = [0];
    }
    return x;
  }
  function parseOther(x, str) {
    var base2, Ctor, divisor, i2, isFloat, len, p2, xd, xe;
    if (str.indexOf("_") > -1) {
      str = str.replace(/(\d)_(?=\d)/g, "$1");
      if (isDecimal.test(str)) return parseDecimal(x, str);
    } else if (str === "Infinity" || str === "NaN") {
      if (!+str) x.s = NaN;
      x.e = NaN;
      x.d = null;
      return x;
    }
    if (isHex.test(str)) {
      base2 = 16;
      str = str.toLowerCase();
    } else if (isBinary.test(str)) {
      base2 = 2;
    } else if (isOctal.test(str)) {
      base2 = 8;
    } else {
      throw Error(invalidArgument + str);
    }
    i2 = str.search(/p/i);
    if (i2 > 0) {
      p2 = +str.slice(i2 + 1);
      str = str.substring(2, i2);
    } else {
      str = str.slice(2);
    }
    i2 = str.indexOf(".");
    isFloat = i2 >= 0;
    Ctor = x.constructor;
    if (isFloat) {
      str = str.replace(".", "");
      len = str.length;
      i2 = len - i2;
      divisor = intPow(Ctor, new Ctor(base2), i2, i2 * 2);
    }
    xd = convertBase(str, base2, BASE);
    xe = xd.length - 1;
    for (i2 = xe; xd[i2] === 0; --i2) xd.pop();
    if (i2 < 0) return new Ctor(x.s * 0);
    x.e = getBase10Exponent(xd, xe);
    x.d = xd;
    external = false;
    if (isFloat) x = divide(x, divisor, len * 4);
    if (p2) x = x.times(Math.abs(p2) < 54 ? mathpow(2, p2) : Decimal.pow(2, p2));
    external = true;
    return x;
  }
  function sine(Ctor, x) {
    var k, len = x.d.length;
    if (len < 3) {
      return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
    }
    k = 1.4 * Math.sqrt(len);
    k = k > 16 ? 16 : k | 0;
    x = x.times(1 / tinyPow(5, k));
    x = taylorSeries(Ctor, 2, x, x);
    var sin2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
    for (; k--; ) {
      sin2_x = x.times(x);
      x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
    }
    return x;
  }
  function taylorSeries(Ctor, n, x, y, isHyperbolic) {
    var j, t, u2, x2, i2 = 1, pr = Ctor.precision, k = Math.ceil(pr / LOG_BASE);
    external = false;
    x2 = x.times(x);
    u2 = new Ctor(y);
    for (; ; ) {
      t = divide(u2.times(x2), new Ctor(n++ * n++), pr, 1);
      u2 = isHyperbolic ? y.plus(t) : y.minus(t);
      y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
      t = u2.plus(y);
      if (t.d[k] !== void 0) {
        for (j = k; t.d[j] === u2.d[j] && j--; ) ;
        if (j == -1) break;
      }
      j = u2;
      u2 = y;
      y = t;
      t = j;
      i2++;
    }
    external = true;
    t.d.length = k + 1;
    return t;
  }
  function tinyPow(b2, e) {
    var n = b2;
    while (--e) n *= b2;
    return n;
  }
  function toLessThanHalfPi(Ctor, x) {
    var t, isNeg = x.s < 0, pi = getPi(Ctor, Ctor.precision, 1), halfPi = pi.times(0.5);
    x = x.abs();
    if (x.lte(halfPi)) {
      quadrant = isNeg ? 4 : 1;
      return x;
    }
    t = x.divToInt(pi);
    if (t.isZero()) {
      quadrant = isNeg ? 3 : 2;
    } else {
      x = x.minus(t.times(pi));
      if (x.lte(halfPi)) {
        quadrant = isOdd(t) ? isNeg ? 2 : 3 : isNeg ? 4 : 1;
        return x;
      }
      quadrant = isOdd(t) ? isNeg ? 1 : 4 : isNeg ? 3 : 2;
    }
    return x.minus(pi).abs();
  }
  function toStringBinary(x, baseOut, sd, rm) {
    var base2, e, i2, k, len, roundUp, str, xd, y, Ctor = x.constructor, isExp = sd !== void 0;
    if (isExp) {
      checkInt32(sd, 1, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
    } else {
      sd = Ctor.precision;
      rm = Ctor.rounding;
    }
    if (!x.isFinite()) {
      str = nonFiniteToString(x);
    } else {
      str = finiteToString(x);
      i2 = str.indexOf(".");
      if (isExp) {
        base2 = 2;
        if (baseOut == 16) {
          sd = sd * 4 - 3;
        } else if (baseOut == 8) {
          sd = sd * 3 - 2;
        }
      } else {
        base2 = baseOut;
      }
      if (i2 >= 0) {
        str = str.replace(".", "");
        y = new Ctor(1);
        y.e = str.length - i2;
        y.d = convertBase(finiteToString(y), 10, base2);
        y.e = y.d.length;
      }
      xd = convertBase(str, 10, base2);
      e = len = xd.length;
      for (; xd[--len] == 0; ) xd.pop();
      if (!xd[0]) {
        str = isExp ? "0p+0" : "0";
      } else {
        if (i2 < 0) {
          e--;
        } else {
          x = new Ctor(x);
          x.d = xd;
          x.e = e;
          x = divide(x, y, sd, rm, 0, base2);
          xd = x.d;
          e = x.e;
          roundUp = inexact;
        }
        i2 = xd[sd];
        k = base2 / 2;
        roundUp = roundUp || xd[sd + 1] !== void 0;
        roundUp = rm < 4 ? (i2 !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2)) : i2 > k || i2 === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 || rm === (x.s < 0 ? 8 : 7));
        xd.length = sd;
        if (roundUp) {
          for (; ++xd[--sd] > base2 - 1; ) {
            xd[sd] = 0;
            if (!sd) {
              ++e;
              xd.unshift(1);
            }
          }
        }
        for (len = xd.length; !xd[len - 1]; --len) ;
        for (i2 = 0, str = ""; i2 < len; i2++) str += NUMERALS.charAt(xd[i2]);
        if (isExp) {
          if (len > 1) {
            if (baseOut == 16 || baseOut == 8) {
              i2 = baseOut == 16 ? 4 : 3;
              for (--len; len % i2; len++) str += "0";
              xd = convertBase(str, base2, baseOut);
              for (len = xd.length; !xd[len - 1]; --len) ;
              for (i2 = 1, str = "1."; i2 < len; i2++) str += NUMERALS.charAt(xd[i2]);
            } else {
              str = str.charAt(0) + "." + str.slice(1);
            }
          }
          str = str + (e < 0 ? "p" : "p+") + e;
        } else if (e < 0) {
          for (; ++e; ) str = "0" + str;
          str = "0." + str;
        } else {
          if (++e > len) for (e -= len; e--; ) str += "0";
          else if (e < len) str = str.slice(0, e) + "." + str.slice(e);
        }
      }
      str = (baseOut == 16 ? "0x" : baseOut == 2 ? "0b" : baseOut == 8 ? "0o" : "") + str;
    }
    return x.s < 0 ? "-" + str : str;
  }
  function truncate(arr, len) {
    if (arr.length > len) {
      arr.length = len;
      return true;
    }
  }
  function abs(x) {
    return new this(x).abs();
  }
  function acos(x) {
    return new this(x).acos();
  }
  function acosh(x) {
    return new this(x).acosh();
  }
  function add(x, y) {
    return new this(x).plus(y);
  }
  function asin(x) {
    return new this(x).asin();
  }
  function asinh(x) {
    return new this(x).asinh();
  }
  function atan(x) {
    return new this(x).atan();
  }
  function atanh(x) {
    return new this(x).atanh();
  }
  function atan2(y, x) {
    y = new this(y);
    x = new this(x);
    var r, pr = this.precision, rm = this.rounding, wpr = pr + 4;
    if (!y.s || !x.s) {
      r = new this(NaN);
    } else if (!y.d && !x.d) {
      r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
      r.s = y.s;
    } else if (!x.d || y.isZero()) {
      r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
      r.s = y.s;
    } else if (!y.d || x.isZero()) {
      r = getPi(this, wpr, 1).times(0.5);
      r.s = y.s;
    } else if (x.s < 0) {
      this.precision = wpr;
      this.rounding = 1;
      r = this.atan(divide(y, x, wpr, 1));
      x = getPi(this, wpr, 1);
      this.precision = pr;
      this.rounding = rm;
      r = y.s < 0 ? r.minus(x) : r.plus(x);
    } else {
      r = this.atan(divide(y, x, wpr, 1));
    }
    return r;
  }
  function cbrt(x) {
    return new this(x).cbrt();
  }
  function ceil(x) {
    return finalise(x = new this(x), x.e + 1, 2);
  }
  function clamp(x, min2, max2) {
    return new this(x).clamp(min2, max2);
  }
  function config(obj) {
    if (!obj || typeof obj !== "object") throw Error(decimalError + "Object expected");
    var i2, p2, v, useDefaults = obj.defaults === true, ps = [
      "precision",
      1,
      MAX_DIGITS,
      "rounding",
      0,
      8,
      "toExpNeg",
      -EXP_LIMIT,
      0,
      "toExpPos",
      0,
      EXP_LIMIT,
      "maxE",
      0,
      EXP_LIMIT,
      "minE",
      -EXP_LIMIT,
      0,
      "modulo",
      0,
      9
    ];
    for (i2 = 0; i2 < ps.length; i2 += 3) {
      if (p2 = ps[i2], useDefaults) this[p2] = DEFAULTS[p2];
      if ((v = obj[p2]) !== void 0) {
        if (mathfloor(v) === v && v >= ps[i2 + 1] && v <= ps[i2 + 2]) this[p2] = v;
        else throw Error(invalidArgument + p2 + ": " + v);
      }
    }
    if (p2 = "crypto", useDefaults) this[p2] = DEFAULTS[p2];
    if ((v = obj[p2]) !== void 0) {
      if (v === true || v === false || v === 0 || v === 1) {
        if (v) {
          if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
            this[p2] = true;
          } else {
            throw Error(cryptoUnavailable);
          }
        } else {
          this[p2] = false;
        }
      } else {
        throw Error(invalidArgument + p2 + ": " + v);
      }
    }
    return this;
  }
  function cos(x) {
    return new this(x).cos();
  }
  function cosh(x) {
    return new this(x).cosh();
  }
  function clone(obj) {
    var i2, p2, ps;
    function Decimal2(v) {
      var e, i3, t, x = this;
      if (!(x instanceof Decimal2)) return new Decimal2(v);
      x.constructor = Decimal2;
      if (isDecimalInstance(v)) {
        x.s = v.s;
        if (external) {
          if (!v.d || v.e > Decimal2.maxE) {
            x.e = NaN;
            x.d = null;
          } else if (v.e < Decimal2.minE) {
            x.e = 0;
            x.d = [0];
          } else {
            x.e = v.e;
            x.d = v.d.slice();
          }
        } else {
          x.e = v.e;
          x.d = v.d ? v.d.slice() : v.d;
        }
        return;
      }
      t = typeof v;
      if (t === "number") {
        if (v === 0) {
          x.s = 1 / v < 0 ? -1 : 1;
          x.e = 0;
          x.d = [0];
          return;
        }
        if (v < 0) {
          v = -v;
          x.s = -1;
        } else {
          x.s = 1;
        }
        if (v === ~~v && v < 1e7) {
          for (e = 0, i3 = v; i3 >= 10; i3 /= 10) e++;
          if (external) {
            if (e > Decimal2.maxE) {
              x.e = NaN;
              x.d = null;
            } else if (e < Decimal2.minE) {
              x.e = 0;
              x.d = [0];
            } else {
              x.e = e;
              x.d = [v];
            }
          } else {
            x.e = e;
            x.d = [v];
          }
          return;
        }
        if (v * 0 !== 0) {
          if (!v) x.s = NaN;
          x.e = NaN;
          x.d = null;
          return;
        }
        return parseDecimal(x, v.toString());
      }
      if (t === "string") {
        if ((i3 = v.charCodeAt(0)) === 45) {
          v = v.slice(1);
          x.s = -1;
        } else {
          if (i3 === 43) v = v.slice(1);
          x.s = 1;
        }
        return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
      }
      if (t === "bigint") {
        if (v < 0) {
          v = -v;
          x.s = -1;
        } else {
          x.s = 1;
        }
        return parseDecimal(x, v.toString());
      }
      throw Error(invalidArgument + v);
    }
    Decimal2.prototype = P;
    Decimal2.ROUND_UP = 0;
    Decimal2.ROUND_DOWN = 1;
    Decimal2.ROUND_CEIL = 2;
    Decimal2.ROUND_FLOOR = 3;
    Decimal2.ROUND_HALF_UP = 4;
    Decimal2.ROUND_HALF_DOWN = 5;
    Decimal2.ROUND_HALF_EVEN = 6;
    Decimal2.ROUND_HALF_CEIL = 7;
    Decimal2.ROUND_HALF_FLOOR = 8;
    Decimal2.EUCLID = 9;
    Decimal2.config = Decimal2.set = config;
    Decimal2.clone = clone;
    Decimal2.isDecimal = isDecimalInstance;
    Decimal2.abs = abs;
    Decimal2.acos = acos;
    Decimal2.acosh = acosh;
    Decimal2.add = add;
    Decimal2.asin = asin;
    Decimal2.asinh = asinh;
    Decimal2.atan = atan;
    Decimal2.atanh = atanh;
    Decimal2.atan2 = atan2;
    Decimal2.cbrt = cbrt;
    Decimal2.ceil = ceil;
    Decimal2.clamp = clamp;
    Decimal2.cos = cos;
    Decimal2.cosh = cosh;
    Decimal2.div = div2;
    Decimal2.exp = exp;
    Decimal2.floor = floor;
    Decimal2.hypot = hypot;
    Decimal2.ln = ln;
    Decimal2.log = log;
    Decimal2.log10 = log10;
    Decimal2.log2 = log2;
    Decimal2.max = max;
    Decimal2.min = min;
    Decimal2.mod = mod;
    Decimal2.mul = mul;
    Decimal2.pow = pow;
    Decimal2.random = random;
    Decimal2.round = round;
    Decimal2.sign = sign;
    Decimal2.sin = sin;
    Decimal2.sinh = sinh;
    Decimal2.sqrt = sqrt;
    Decimal2.sub = sub2;
    Decimal2.sum = sum;
    Decimal2.tan = tan;
    Decimal2.tanh = tanh;
    Decimal2.trunc = trunc;
    if (obj === void 0) obj = {};
    if (obj) {
      if (obj.defaults !== true) {
        ps = ["precision", "rounding", "toExpNeg", "toExpPos", "maxE", "minE", "modulo", "crypto"];
        for (i2 = 0; i2 < ps.length; ) if (!obj.hasOwnProperty(p2 = ps[i2++])) obj[p2] = this[p2];
      }
    }
    Decimal2.config(obj);
    return Decimal2;
  }
  function div2(x, y) {
    return new this(x).div(y);
  }
  function exp(x) {
    return new this(x).exp();
  }
  function floor(x) {
    return finalise(x = new this(x), x.e + 1, 3);
  }
  function hypot() {
    var i2, n, t = new this(0);
    external = false;
    for (i2 = 0; i2 < arguments.length; ) {
      n = new this(arguments[i2++]);
      if (!n.d) {
        if (n.s) {
          external = true;
          return new this(1 / 0);
        }
        t = n;
      } else if (t.d) {
        t = t.plus(n.times(n));
      }
    }
    external = true;
    return t.sqrt();
  }
  function isDecimalInstance(obj) {
    return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
  }
  function ln(x) {
    return new this(x).ln();
  }
  function log(x, y) {
    return new this(x).log(y);
  }
  function log2(x) {
    return new this(x).log(2);
  }
  function log10(x) {
    return new this(x).log(10);
  }
  function max() {
    return maxOrMin(this, arguments, -1);
  }
  function min() {
    return maxOrMin(this, arguments, 1);
  }
  function mod(x, y) {
    return new this(x).mod(y);
  }
  function mul(x, y) {
    return new this(x).mul(y);
  }
  function pow(x, y) {
    return new this(x).pow(y);
  }
  function random(sd) {
    var d, e, k, n, i2 = 0, r = new this(1), rd = [];
    if (sd === void 0) sd = this.precision;
    else checkInt32(sd, 1, MAX_DIGITS);
    k = Math.ceil(sd / LOG_BASE);
    if (!this.crypto) {
      for (; i2 < k; ) rd[i2++] = Math.random() * 1e7 | 0;
    } else if (crypto.getRandomValues) {
      d = crypto.getRandomValues(new Uint32Array(k));
      for (; i2 < k; ) {
        n = d[i2];
        if (n >= 429e7) {
          d[i2] = crypto.getRandomValues(new Uint32Array(1))[0];
        } else {
          rd[i2++] = n % 1e7;
        }
      }
    } else if (crypto.randomBytes) {
      d = crypto.randomBytes(k *= 4);
      for (; i2 < k; ) {
        n = d[i2] + (d[i2 + 1] << 8) + (d[i2 + 2] << 16) + ((d[i2 + 3] & 127) << 24);
        if (n >= 214e7) {
          crypto.randomBytes(4).copy(d, i2);
        } else {
          rd.push(n % 1e7);
          i2 += 4;
        }
      }
      i2 = k / 4;
    } else {
      throw Error(cryptoUnavailable);
    }
    k = rd[--i2];
    sd %= LOG_BASE;
    if (k && sd) {
      n = mathpow(10, LOG_BASE - sd);
      rd[i2] = (k / n | 0) * n;
    }
    for (; rd[i2] === 0; i2--) rd.pop();
    if (i2 < 0) {
      e = 0;
      rd = [0];
    } else {
      e = -1;
      for (; rd[0] === 0; e -= LOG_BASE) rd.shift();
      for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;
      if (k < LOG_BASE) e -= LOG_BASE - k;
    }
    r.e = e;
    r.d = rd;
    return r;
  }
  function round(x) {
    return finalise(x = new this(x), x.e + 1, this.rounding);
  }
  function sign(x) {
    x = new this(x);
    return x.d ? x.d[0] ? x.s : 0 * x.s : x.s || NaN;
  }
  function sin(x) {
    return new this(x).sin();
  }
  function sinh(x) {
    return new this(x).sinh();
  }
  function sqrt(x) {
    return new this(x).sqrt();
  }
  function sub2(x, y) {
    return new this(x).sub(y);
  }
  function sum() {
    var i2 = 0, args = arguments, x = new this(args[i2]);
    external = false;
    for (; x.s && ++i2 < args.length; ) x = x.plus(args[i2]);
    external = true;
    return finalise(x, this.precision, this.rounding);
  }
  function tan(x) {
    return new this(x).tan();
  }
  function tanh(x) {
    return new this(x).tanh();
  }
  function trunc(x) {
    return finalise(x = new this(x), x.e + 1, 1);
  }
  P[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")] = P.toString;
  P[Symbol.toStringTag] = "Decimal";
  var Decimal = P.constructor = clone(DEFAULTS);
  LN10 = new Decimal(LN10);
  PI = new Decimal(PI);
  var decimal_default = Decimal;

  // ../ki-frame/src/stringFormatter.ts
  var defaultFormatters = {
    s: (v, spec) => {
      let s2 = String(v != null ? v : "");
      if (spec.precision !== void 0) s2 = s2.slice(0, spec.precision);
      return pad(s2, spec.width);
    },
    d: (v, spec) => {
      const n = Number(v);
      const s2 = Number.isFinite(n) ? String(Math.trunc(n)) : "NaN";
      return pad(s2, spec.width);
    },
    f: (v, spec) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return pad(String(n), spec.width);
      const prec = spec.precision !== void 0 ? spec.precision : 6;
      const s2 = n.toFixed(prec);
      return pad(s2, spec.width);
    },
    j: (v) => {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }
  };
  function pad(s2, width) {
    if (width === void 0 || width <= s2.length) return s2;
    return " ".repeat(width - s2.length) + s2;
  }
  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  function createFormatter(customFormatters = {}) {
    const registry = /* @__PURE__ */ new Map();
    const addMap = (map2) => {
      for (const k of Object.keys(map2)) {
        if (!/^[A-Za-z]+$/.test(k)) {
          throw new Error(`format key must be letters only: "${k}"`);
        }
        registry.set(k, map2[k]);
      }
    };
    addMap(defaultFormatters);
    addMap(customFormatters);
    function sprintf(format, ...args) {
      let argIndex = 0;
      let previousWasNamedArg = false;
      const tokenRE = /%(\(([^)]+)\))?(?:(\d+)(?=(?:\.[0-9]+)?[A-Za-z][A-Za-z0-9]*))?(?:\.([0-9]+))?([A-Za-z][A-Za-z0-9]*)/g;
      const result = format.replace(tokenRE, (match, _paren, name, widthStr, precStr, type) => {
        const spec = {
          key: name,
          width: widthStr ? parseInt(widthStr, 10) : void 0,
          precision: precStr ? parseInt(precStr, 10) : void 0,
          raw: match,
          type
        };
        let value;
        if (name) {
          value = args[0] !== void 0 && isPlainObject(args[argIndex]) ? args[argIndex][name] : void 0;
          previousWasNamedArg = true;
        } else {
          if (previousWasNamedArg) {
            argIndex++;
            previousWasNamedArg = false;
          }
          value = args[argIndex++];
        }
        const handler = registry.get(type);
        if (!handler) {
          return match;
        }
        try {
          return String(handler(value, spec));
        } catch {
          return pad(String(value != null ? value : ""), spec.width);
        }
      });
      return result;
    }
    return sprintf;
  }

  // src/kaukolampo/formatting.ts
  var printPower = (n) => n.toFixed(3);
  var printMoney = (n) => n.toFixed(2);

  // src/kaukolampo/range.ts
  function range(from, to) {
    return Array.from({ length: to - from + 1 }, (_, i2) => from + i2);
  }

  // src/kaukolampo/util.ts
  function toDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day));
  }
  async function shortHexHash(input2, length) {
    const encoder = new TextEncoder();
    const data2 = encoder.encode(input2);
    const buffer = await crypto.subtle.digest("SHA-256", data2);
    const full = Array.from(new Uint8Array(buffer)).map((b2) => b2.toString(16).padStart(2, "0")).join("");
    if (length === void 0) {
      return full;
    }
    if (length < 0 || length > full.length) {
      throw new Error(`Length must be between 0 and ${full.length}`);
    }
    return full.slice(0, length);
  }

  // src/kaukolampo/viivastyskorko.ts
  var HARD_CODED_PERIODS = [
    {
      from: "2024-01-01",
      invalidOn: "2024-07-01",
      personAnnualRate: 0.115,
      companyAnnualRate: 0.125
    },
    {
      from: "2024-07-01",
      invalidOn: "2025-01-01",
      personAnnualRate: 0.115,
      // 11.5%
      companyAnnualRate: 0.125
      // 12.5%
    },
    {
      from: "2025-01-01",
      invalidOn: "2025-07-01",
      personAnnualRate: 0.105,
      // 10.5%
      companyAnnualRate: 0.115
      // 11.5%
    },
    {
      from: "2025-07-01",
      invalidOn: "2026-01-01",
      personAnnualRate: 0.095,
      // 9.5%
      companyAnnualRate: 0.105
      // 10.5%
    },
    {
      from: "2026-01-01",
      invalidOn: "2026-07-01",
      personAnnualRate: 0.095,
      // 9.5%
      companyAnnualRate: 0.105
      // 10.5%
    }
  ];
  var MS_PER_DAY = 24 * 60 * 60 * 1e3;
  function toDateISO(s2) {
    return /* @__PURE__ */ new Date(s2 + "T00:00:00Z");
  }
  function daysBetweenInclusiveExclusive(start, end) {
    return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  }
  function calculateViivastyskorkoMultiplier(startDate, endDate, company, periods = HARD_CODED_PERIODS) {
    let multiplier2 = decimal_default(1);
    if (endDate <= startDate) return { multiplier: multiplier2, company, segments: [] };
    const segments = [];
    for (const p2 of periods) {
      const periodStart = toDateISO(p2.from);
      const periodEnd = toDateISO(p2.invalidOn);
      const segStart = startDate > periodStart ? startDate : periodStart;
      const segEnd = endDate < periodEnd ? endDate : periodEnd;
      if (segEnd <= segStart) continue;
      const days = daysBetweenInclusiveExclusive(segStart, segEnd);
      const annual = decimal_default(company ? p2.companyAnnualRate : p2.personAnnualRate);
      const daily = decimal_default(annual).div(365);
      const segmentInterest = daily.mul(days).plus(1);
      multiplier2 = multiplier2.mul(segmentInterest);
      segments.push({ start: segStart, end: segEnd, annual, days, multiplier: segmentInterest });
    }
    return { multiplier: multiplier2, company, segments };
  }

  // src/kaukolampo/kaukolampoBilling.ts
  var ymToIndex = (ym) => ym.year * 12 + (ym.month - 1);
  var indexToYm = (idx) => {
    const year = Math.floor(idx / 12);
    const month = idx % 12 + 1;
    return { year, month };
  };
  function resolveMonthlyPricingLookup(contract, from, to) {
    const result = {};
    const sortedPricesDesc = [...contract.monthlyPricing].sort((a2, b2) => ymToIndex(b2) - ymToIndex(a2));
    for (let c = ymToIndex(from); c <= ymToIndex(to); c++) {
      const firstLower = sortedPricesDesc.find((value) => ymToIndex(value) <= c && value.price);
      if (firstLower && isDefined(firstLower.price)) {
        const { monthlyFee, powerPricePerMW } = firstLower.price;
        result[c] = {
          monthlyFee: decimal_default(monthlyFee),
          powerPrice: decimal_default(powerPricePerMW)
        };
      } else {
        throw new Error(`${indexToYm(c)} is not in the range of contract prices for ${contract.id}`);
      }
    }
    return result;
  }
  var months = range(1, 12);
  function calculateValues(years, monthlyPricing, powerUsage) {
    const totalsByYear = {};
    const monthBillInfos = {};
    years.forEach((year, index) => {
      const yearTotal = {
        usedPower: decimal_default(0),
        monthCount: 0,
        billedTotals: {
          usedPowerPrice: decimal_default(0),
          monthlyFees: decimal_default(0),
          total: decimal_default(0)
        },
        calculatedTotals: {
          comparedToPreviousYear: true,
          usedPowerPrice: decimal_default(0),
          monthlyFees: decimal_default(0),
          total: decimal_default(0),
          avgMonthlyFee: decimal_default(0),
          avgPowerPrice: decimal_default(0),
          excessBilling: decimal_default(0)
        }
      };
      months.forEach((month) => {
        const index2 = ymToIndex({ year, month });
        const usedPower = powerUsage[index2];
        if (usedPower) {
          const price = monthlyPricing[index2];
          const usedPowerPrice = usedPower.mul(price.powerPrice);
          const prevPrice = monthlyPricing[index2 - 1] || price;
          const total = usedPowerPrice.add(price.monthlyFee);
          monthBillInfos[index2] = {
            index: index2,
            ...price,
            usedPower,
            usedPowerPrice,
            mWPriceDelta: price.powerPrice.sub(prevPrice.powerPrice).toNumber(),
            monthlyFeeDelta: price.monthlyFee.sub(prevPrice.monthlyFee).toNumber(),
            total
          };
          yearTotal.usedPower = yearTotal.usedPower.add(usedPower);
          const billedTotals = yearTotal.billedTotals;
          billedTotals.monthlyFees = billedTotals.monthlyFees.add(price.monthlyFee);
          billedTotals.usedPowerPrice = billedTotals.usedPowerPrice.add(usedPowerPrice);
          billedTotals.total = billedTotals.total.add(total);
          yearTotal.monthCount = yearTotal.monthCount + 1;
        }
      });
      yearTotal.calculatedTotals = {
        ...yearTotal.billedTotals,
        comparedToPreviousYear: false,
        avgPowerPrice: yearTotal.billedTotals.usedPowerPrice.div(yearTotal.usedPower),
        avgMonthlyFee: yearTotal.billedTotals.monthlyFees.div(yearTotal.monthCount),
        excessBilling: decimal_default(0)
      };
      if (index > 0) {
        const prevYear = year - 1;
        const prevTotals = totalsByYear[prevYear].calculatedTotals;
        const prevMonthlyFees = prevTotals.avgMonthlyFee.mul(yearTotal.monthCount);
        const prevUsedPowerPrice = yearTotal.usedPower.mul(prevTotals.avgPowerPrice);
        const totalsBasedOnLastYearLevel = {
          monthlyFees: prevMonthlyFees,
          usedPowerPrice: prevUsedPowerPrice,
          total: prevMonthlyFees.add(prevUsedPowerPrice)
        };
        yearTotal.totalsBasedOnLastYearLevel = totalsBasedOnLastYearLevel;
        const billedTotal = yearTotal.billedTotals.total;
        const priceIncreaseEuros = billedTotal.minus(totalsBasedOnLastYearLevel.total);
        const priceIncreasePercents = billedTotal.div(totalsBasedOnLastYearLevel.total).minus(1).mul(100);
        const priceIncreaseTooMuch = priceIncreaseEuros.toNumber() > 150 && priceIncreasePercents.toNumber() > 15;
        if (priceIncreaseTooMuch) {
          const total = totalsBasedOnLastYearLevel.total.add(150);
          const adjustmentMultiplier = total.div(totalsBasedOnLastYearLevel.total);
          const avgMonthlyFee = prevTotals.avgMonthlyFee.mul(adjustmentMultiplier);
          const avgPowerPrice = prevTotals.avgPowerPrice.mul(adjustmentMultiplier);
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
            priceIncreaseEuros
          };
        } else {
          yearTotal.calculatedTotals.comparedToPreviousYear = true;
          yearTotal.calculatedTotals.priceIncreasePercents = priceIncreasePercents;
          yearTotal.calculatedTotals.priceIncreaseEuros = priceIncreaseEuros;
        }
      }
      totalsByYear[year] = yearTotal;
    });
    const excessYears = years.filter((y) => totalsByYear[y].calculatedTotals.excessBilling.toNumber() > 0);
    const paybackInterestYears = calculatePaybackInterest(excessYears, monthBillInfos, totalsByYear);
    return { totalsByYear, monthBillInfos, excessYears, paybackInterestYears, years };
  }
  function decimalMin(a2, b2) {
    if (a2.toNumber() <= b2.toNumber()) {
      return a2;
    }
    return b2;
  }
  function calculatePaybackInterest(excessYears, originalBills, totalsByYear) {
    return excessYears.map((year) => {
      let billedTotal = decimal_default(0);
      const fromAveragePricesTotals = {
        total: decimal_default(0),
        excess: decimal_default(0),
        interest: decimal_default(0)
      };
      const comparingToPreviousYearAnd150BufferTotals = {
        total: decimal_default(0),
        excess: decimal_default(0),
        interest: decimal_default(0)
      };
      const yearTotal = totalsByYear[year].calculatedTotals;
      const prevTotal = totalsByYear[year - 1].calculatedTotals;
      function calculateInterestMultiplier(month) {
        const startDate = toDate(year, month, 1);
        const viivastyskorkoMultiplier = calculateViivastyskorkoMultiplier(startDate, /* @__PURE__ */ new Date(), true);
        return viivastyskorkoMultiplier.multiplier;
      }
      function calculateExcessFromAveragePrices(originalBill, originalTotal, month) {
        const usedPowerPrice = originalBill.usedPower.mul(yearTotal.avgPowerPrice);
        const calculatedTotal = usedPowerPrice.plus(yearTotal.avgMonthlyFee);
        const excess = originalTotal.minus(calculatedTotal);
        const interest = excess.mul(decimal_default(calculateInterestMultiplier(month)).minus(1));
        fromAveragePricesTotals.total = fromAveragePricesTotals.total.add(calculatedTotal);
        fromAveragePricesTotals.excess = fromAveragePricesTotals.excess.add(excess);
        fromAveragePricesTotals.interest = fromAveragePricesTotals.interest.add(interest);
        return {
          monthlyFee: yearTotal.avgMonthlyFee,
          powerPrice: yearTotal.avgPowerPrice,
          usedPowerPrice,
          total: calculatedTotal,
          excess,
          interest
        };
      }
      let leftFrom150 = decimal_default(150);
      const months2 = range(1, 12).map((month) => {
        const index = ymToIndex({ year, month });
        const originalBill = originalBills[index];
        if (!originalBill) return void 0;
        const originalTotal = originalBill.total;
        billedTotal = billedTotal.add(originalTotal);
        const usedPowerPrice = originalBill.usedPower.mul(prevTotal.avgPowerPrice);
        const totalWithLastYearLevel = usedPowerPrice.add(prevTotal.avgMonthlyFee);
        let total = billedTotal;
        let excess = decimal_default(0);
        let interest = decimal_default(0);
        const delta = originalTotal.minus(totalWithLastYearLevel);
        if (delta.toNumber() > 0) {
          if (leftFrom150.toNumber() > 0) {
            const useBuffer = decimalMin(leftFrom150, delta);
            leftFrom150 = leftFrom150.minus(useBuffer);
            total = totalWithLastYearLevel.plus(useBuffer);
            excess = originalTotal.minus(total);
          } else {
            total = totalWithLastYearLevel;
            excess = delta;
          }
          if (excess.toNumber() > 0) {
            interest = excess.mul(decimal_default(calculateInterestMultiplier(month)).minus(1));
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
          leftFrom150
        };
        comparingToPreviousYearAnd150BufferTotals.total = comparingToPreviousYearAnd150BufferTotals.total.add(total);
        comparingToPreviousYearAnd150BufferTotals.excess = comparingToPreviousYearAnd150BufferTotals.excess.add(excess);
        comparingToPreviousYearAnd150BufferTotals.interest = comparingToPreviousYearAnd150BufferTotals.interest.add(interest);
        return {
          month,
          originalBill,
          excessFromAveragePrices: calculateExcessFromAveragePrices(originalBill, originalTotal, month),
          excessComparingToPreviousYearAnd150Buffer
        };
      });
      return {
        year,
        months: months2.filter(isDefined),
        billedTotal,
        fromAveragePricesTotals,
        comparingToPreviousYearAnd150BufferTotals
      };
    });
  }

  // src/kaukolampo/powerUsageString.ts
  function parseUnderscoreSeparatedYmNumbers(input2) {
    if (typeof input2 !== "string") throw new TypeError("input must be a string");
    const tokens = input2.split("_").map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 0) {
      throw new Error("input must contain at least a year-month anchor");
    }
    const ymRegex = /^(\d{4})-(\d{1,2})$/;
    const first = tokens[0];
    const ymMatch = first.match(ymRegex);
    if (!ymMatch) {
      throw new Error(`first token must be year-month in form YYYY-M: got "${first}"`);
    }
    const year = Number(ymMatch[1]);
    const month = Number(ymMatch[2]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(`invalid year-month anchor: "${first}"`);
    }
    const from = { year, month };
    let idx = ymToIndex(from);
    const numbers = {};
    const numberTokens = tokens.slice(1);
    if (numberTokens.length === 0) {
      return { from, to: from, numbers };
    }
    for (const t of numberTokens) {
      const v = decimal_default(t);
      if (!v.isFinite()) {
        throw new Error(`expected numeric token but got "${t}"`);
      }
      numbers[idx] = v;
      idx += 1;
    }
    const to = indexToYm(idx - 1);
    return { from, to, numbers };
  }
  function formatAsUnderscoreSeparated(input2) {
    const { from, to, numbers } = input2;
    const fromIdx = ymToIndex(from);
    const toIdx = ymToIndex(to);
    if (toIdx < fromIdx) {
      throw new Error("to must be >= from");
    }
    const parts = [];
    parts.push(`${from.year}-${from.month}`);
    for (let idx = fromIdx; idx <= toIdx; idx++) {
      const value = numbers[idx];
      if (value === void 0) {
        throw new Error(`Missing number for ${JSON.stringify(indexToYm(idx))}`);
      }
      parts.push(String(value));
    }
    return parts.join("_");
  }

  // src/kaukolampo/prices/tuusulanjarvenLampo.ts
  var tuusulanjarvenLampo = {
    id: "tula-pepi",
    companyName: "Tuusulanj\xE4rven L\xE4mp\xF6",
    contractTypeName: "Perusl\xE4mp\xF6 Pientalo",
    monthlyPricing: [
      {
        year: 2022,
        month: 1,
        price: {
          monthlyFee: 35.3,
          powerPricePerMW: 68.57
        }
      },
      {
        year: 2023,
        month: 6,
        price: {
          monthlyFee: 40.25,
          powerPricePerMW: 78.17
        }
      },
      {
        year: 2024,
        month: 1,
        price: {
          monthlyFee: 45.88,
          powerPricePerMW: 89.12
        }
      },
      {
        year: 2024,
        month: 9,
        price: {
          monthlyFee: 46.44,
          powerPricePerMW: 90.2
        }
      },
      {
        year: 2025,
        month: 1,
        price: {
          monthlyFee: 59.55,
          powerPricePerMW: 90.2
        }
      },
      {
        year: 2025,
        month: 7,
        price: {
          monthlyFee: 59.55,
          powerPricePerMW: 86.04
        }
      }
    ]
  };

  // src/kaukolampo/kaukolampoUi.ts
  var showIncrease = (inc) => styles({ backgroundColor: !inc || inc === 0 ? "" : inc > 0 ? "lightpink" : "lightgreen" });
  var uiStyles = {
    pageBreakAfter: { class: "pagebreak" },
    noPrint: { class: "no-print" },
    borderLeft: styles({ borderLeft: "2px solid #6b7280" }),
    numberTableRight: styles({ width: "auto", textAlign: "right", verticalAlign: "top" }),
    numberTableLeft: styles({ width: "auto", verticalAlign: "top" }),
    bold: styles({ fontWeight: "bold" })
  };
  var formatter = createFormatter({
    P: (v, s2) => decimal_default(v).toFixed(s2.precision || 3),
    M: printMoney
  });
  function BillItemTDs(index) {
    const usedPowerText = text();
    const usedPowerTextDiv = div(usedPowerText);
    const usedPowerInput = index && inputs.text({ name: index.toString(), hidden: true }, styles({ width: "7ch" }));
    const usedPower = td(uiStyles.borderLeft, usedPowerTextDiv, usedPowerInput);
    const mwPrice = td();
    const powerPrice = td();
    const monthlyFee = td();
    const total = td(uiStyles.bold);
    const setText = (info) => {
      if (usedPowerInput)
        if (info == null ? void 0 : info.usedPower) {
          usedPowerText.textContent = printPower(info.usedPower);
          usedPowerInput.value = printPower(info.usedPower);
        } else {
          usedPowerText.textContent = "";
          usedPowerInput.value = "";
        }
      replaceChildren(mwPrice, (info == null ? void 0 : info.powerPrice) ? printMoney(info == null ? void 0 : info.powerPrice) : "", showIncrease(info == null ? void 0 : info.mWPriceDelta));
      replaceChildren(powerPrice, (info == null ? void 0 : info.usedPowerPrice) ? printMoney(info.usedPowerPrice) : "");
      replaceChildren(
        monthlyFee,
        (info == null ? void 0 : info.monthlyFee) ? printMoney(info.monthlyFee) : "",
        showIncrease(info == null ? void 0 : info.monthlyFeeDelta)
      );
      replaceChildren(total, (info == null ? void 0 : info.total) ? printMoney(info.total) : "");
    };
    return {
      billTDList: [usedPower, mwPrice, powerPrice, monthlyFee, total],
      setText,
      usedPowerText,
      usedPowerTextDiv,
      usedPowerInput
    };
  }
  function priceChangeComparedToFirstYear(state) {
    const priceChangeComparedToFirstYear2 = div();
    state.onValueChange(({ totalsByYear, years }) => {
      const [firstYear] = years;
      const firstData = totalsByYear[firstYear].calculatedTotals;
      replaceChildren(
        priceChangeComparedToFirstYear2,
        table(
          uiStyles.numberTableRight,
          thead(
            tr(
              th("Vuosi"),
              th("Laskutuskuukausia"),
              th("Kulutus"),
              th("Toteutunut laskutus"),
              th(`Laskutus edellisen vuoden tasolla`, uiStyles.borderLeft),
              th("Korotus \u20AC"),
              th("Korotus %"),
              th("Ylilaskutus \u20AC"),
              th(`Laskutus vuoden ${years[0]} tasolla`, uiStyles.borderLeft),
              th("Korotus \u20AC"),
              th("Korotus %")
            ),
            years.map((y) => {
              const currentYear = totalsByYear[y];
              const usedPower = currentYear.usedPower;
              const totalOnFirstYearLevel = usedPower.mul(firstData.avgPowerPrice).add(firstData.avgMonthlyFee.mul(currentYear.monthCount));
              return tr(
                td(y),
                td(currentYear.monthCount),
                td(printPower(usedPower), " MW"),
                td(printMoney(currentYear.billedTotals.total), " \u20AC"),
                td(
                  currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.totalsBasedOnLastYearLevel.total),
                  " \u20AC",
                  uiStyles.borderLeft
                ),
                td(
                  currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.billedTotals.total.minus(currentYear.totalsBasedOnLastYearLevel.total)),
                  " \u20AC"
                ),
                td(
                  currentYear.totalsBasedOnLastYearLevel && printPower(
                    currentYear.billedTotals.total.div(currentYear.totalsBasedOnLastYearLevel.total).minus(1).mul(100)
                  )
                ),
                td(
                  currentYear.totalsBasedOnLastYearLevel && printMoney(currentYear.calculatedTotals.excessBilling),
                  " \u20AC"
                ),
                td(printMoney(totalOnFirstYearLevel), " \u20AC", uiStyles.borderLeft),
                td(printMoney(currentYear.billedTotals.total.minus(totalOnFirstYearLevel)), " \u20AC"),
                td(printPower(currentYear.billedTotals.total.div(totalOnFirstYearLevel).minus(1).mul(100)))
              );
            })
          )
        )
      );
    });
    return priceChangeComparedToFirstYear2;
  }
  function priceChangesByMonth(state) {
    const priceChangeTBody = tbody();
    state.onValueChange(({ years, monthBillInfos }) => {
      const allBills = years.flatMap((year) => months.map((month) => monthBillInfos[ymToIndex({ year, month })]));
      const billsWithChanges = allBills.filter((bill) => bill && (bill.monthlyFeeDelta != 0 || bill.mWPriceDelta != 0));
      const rows = billsWithChanges.map((bill) => {
        const prevBill = monthBillInfos[bill.index - 1];
        const yearMonth = indexToYm(bill.index);
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
        );
      });
      replaceChildren(priceChangeTBody, rows);
    });
    return table(uiStyles.numberTableRight, priceChangeTBody);
  }
  function billSummary(years, calculatedValuesState, powerUsageState) {
    const usedPowerEditable = createState({ value: false });
    const billRows = months.map(
      (month) => tr(
        td(month),
        years.map((year) => {
          const index = ymToIndex({ year, month });
          const { billTDList, setText, usedPowerInput, usedPowerText, usedPowerTextDiv } = BillItemTDs(index);
          calculatedValuesState.onValueChange(({ monthBillInfos }) => {
            setText(monthBillInfos[index]);
          });
          if (usedPowerInput) {
            usedPowerEditable.onValueChange((showInput) => {
              usedPowerInput.hidden = !showInput;
              usedPowerTextDiv.hidden = showInput;
            });
            setEvents(
              usedPowerInput,
              events({
                change({ node }) {
                  const value = node.value;
                  const newUsedPower = ["0", ""].includes(value.trimEnd().trimStart()) ? void 0 : decimal_default(value);
                  usedPowerText.textContent = newUsedPower ? value : "";
                  powerUsageState.set((cur) => {
                    const numbers = { ...cur.numbers };
                    if (newUsedPower) {
                      numbers[index] = decimal_default(value);
                    } else {
                      delete numbers[index];
                    }
                    return {
                      ...cur,
                      numbers
                    };
                  });
                }
              })
            );
          }
          return billTDList;
        })
      )
    );
    const totalRow = tr(
      uiStyles.bold,
      td("Yhteens\xE4", uiStyles.bold),
      years.map((y) => {
        const { billTDList, setText } = BillItemTDs();
        calculatedValuesState.onValueChange(({ totalsByYear }) => {
          const {
            billedTotals: { monthlyFees, usedPowerPrice, total },
            usedPower
          } = totalsByYear[y];
          setText({
            usedPower,
            usedPowerPrice,
            monthlyFee: monthlyFees,
            total
          });
        });
        return billTDList;
      })
    );
    const powerUsageHashInfo = text();
    const powerUsageAsLink = a("Kulutusarvot linkkin\xE4", uiStyles.noPrint);
    powerUsageState.onValueChange((powerUsage) => {
      const data2 = formatAsUnderscoreSeparated(powerUsage);
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("p", data2);
      appendChildren(powerUsageAsLink, { href: url.toString() });
      shortHexHash(data2, 12).then((s2) => powerUsageHashInfo.textContent = `Kulutusarvojen tarkisteluku: ${s2}`);
    });
    return div(
      table(
        uiStyles.numberTableRight,
        thead(
          tr(
            th({ rowSpan: 2 }),
            years.map((y) => th(y, { colSpan: 5 }, uiStyles.borderLeft))
          ),
          tr(
            years.map(() => [th("Kulutus", uiStyles.borderLeft), th("\u20AC/MWh"), th("Energia \u20AC"), th("$/kk"), th("Lasku \u20AC")])
          )
        ),
        tbody(billRows, totalRow)
      ),
      div(
        powerUsageHashInfo,
        powerUsageAsLink,
        button(
          "Muokkaa kulutusarvoja",
          { class: "blueButton" },
          uiStyles.noPrint,
          events({
            click() {
              usedPowerEditable.set((cur) => !cur);
            }
          })
        ),
        button(
          "Tyhjenn\xE4",
          events({
            click() {
              powerUsageState.set((old) => {
                return { ...old || {}, numbers: {} };
              });
              usedPowerEditable.set(true);
            }
          })
        ),
        button(
          "Tallenna",
          events({
            click() {
              const input2 = powerUsageState.get();
              if (input2) {
                localStorage.setItem("kaukolampo", formatAsUnderscoreSeparated(input2));
              }
            }
          })
        ),
        button(
          "Lataa",
          events({
            click() {
              const savedData = localStorage.getItem("kaukolampo");
              if (savedData) {
                powerUsageState.set(parseUnderscoreSeparatedYmNumbers(savedData));
              }
            }
          })
        )
      )
    );
  }
  function compareYearPriceIncrease(yearTotal, prevTotal, y, prevYear) {
    var _a2;
    const calculatedTotals = yearTotal.calculatedTotals;
    const { priceIncreaseTooMuch } = calculatedTotals;
    const princeIncreaseInfo = priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel ? [
      li("Korotus ylitt\xE4\xE4 15% ja 150e. Kuluttajariitalautakunnan suosituksen mukainen korotus olisi 150e"),
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
      )
    ] : [li("Korotus ei ylit\xE4 150e ja 15%")];
    const prevAvgMwPrice = prevTotal == null ? void 0 : prevTotal.calculatedTotals.avgPowerPrice;
    const explainAdjustment = () => prevTotal && priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel && calculatedTotals.adjustmentMultiplier ? p(
      ul(
        li(
          "Liian laskutuksen takia seuraavan vuoden laskutuksessa k\xE4ytet\xE4\xE4n t\xE4m\xE4n vuoden tasona viimevuoden tasoa * korjauskerroin"
        ),
        calculatedTotals.adjustmentMultiplier && li(
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
    ) : p(
      ul(
        li("Taso saadaan laskemalla keskiarvot"),
        li(
          formatter(`Energian hinta: %M / %P = `, yearTotal.billedTotals.usedPowerPrice, yearTotal.usedPower),
          b(printMoney(yearTotal.calculatedTotals.avgPowerPrice))
        ),
        li(
          formatter(`Kuukausi: %M / %d = `, yearTotal.billedTotals.monthlyFees, yearTotal.monthCount),
          b(printMoney(yearTotal.calculatedTotals.avgMonthlyFee))
        )
      )
    );
    const prevAvgMonthlyFee = prevTotal == null ? void 0 : prevTotal.calculatedTotals.avgMonthlyFee;
    const totalWithPrevYearLevel = ((_a2 = yearTotal.totalsBasedOnLastYearLevel) == null ? void 0 : _a2.total) || decimal_default(0);
    return div(
      h3(prevTotal ? `${y}, vertailu toteutuneella ja ${y - 1} tasolla` : `${y} tason laskeminen`),
      table(
        uiStyles.numberTableLeft,
        thead(
          tr(
            th(""),
            th("kulutus"),
            th("\u20AC/MWh"),
            th("$/kk"),
            th("Lasku vuositasolla"),
            priceIncreaseTooMuch && th(uiStyles.bold, "Liika laskutus")
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
          prevTotal && tr(
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
          prevTotal && tr(
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
    );
  }
  function excessBillingPaybackInterestTable(paybackInterestYears) {
    return paybackInterestYears.map(
      (info) => div(
        h3(info.year),
        table(
          uiStyles.numberTableRight,
          thead(
            tr(
              th("Pohjatiedot", { colSpan: 3 }),
              th("Ylilaskutus jos verrataan +150 tasoon vuoden yli", { colSpan: 3 }, uiStyles.borderLeft),
              th("Ylilaskutus jos 150\u20AC annetaan kerty\xE4 vuoden alussa", { colSpan: 3 }, uiStyles.borderLeft)
            ),
            tr(
              th("vuosi.kk"),
              th("Kulutus"),
              th("Alkuper\xE4inen lasku"),
              // keskiarvoon verrattu
              th("Korjattu lasku", uiStyles.borderLeft),
              th("Ylilaskutus"),
              th("Viiv\xE4styskorko"),
              // viime vuoden taso ja 150e puskuri
              th("Lasku aiemman vuoden tasolla", uiStyles.borderLeft),
              th("Korjattu lasku"),
              th("150 eurosta j\xE4ljell\xE4"),
              th("Ylilaskutus"),
              th("Viiv\xE4styskorko")
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
              );
            })
          ),
          tr(
            uiStyles.bold,
            td("Yhteens\xE4"),
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
    );
  }
  var usage = "2022-4_1.945_1.33_0.941_0.897_0.876_1.336_1.758_3.038_3.922_3.597_2.869_2.766_1.683_1.21_1.11_0.973_0.904_0.876_2.278_3.017_3.717_4.456_3.313_2.798_2.096_0.926_0.701_0.73_0.683_0.66_1.721_2.438_3.238_3.357_3.177_2.656_1.558_1.196_0.851_0.789_0.778_0.841_2.2_2.485_2.899";
  function getPUrlParameter() {
    const url = new URL(window.location.href);
    return url.searchParams.get("p");
  }
  function summaryList(excessYears, totalsByYear, paybackInterestYears) {
    const paybackInterestTotal = paybackInterestYears.reduce(
      (acc, y) => acc.add(y.fromAveragePricesTotals.interest),
      decimal_default(0)
    );
    return ul(
      excessYears.map((y) => li(`${y}: ${printMoney(totalsByYear[y].calculatedTotals.excessBilling)}\u20AC`)),
      li(`Viiv\xE4styskorko: ${printMoney(paybackInterestTotal)}\u20AC`),
      li(
        `Yhteens\xE4: ${printMoney(excessYears.reduce((acc, y) => acc.add(totalsByYear[y].calculatedTotals.excessBilling), paybackInterestTotal))}\u20AC`
      )
    );
  }
  function priceIncreaseByYear(state) {
    const priceIncreases = div();
    state.onValueChange(({ totalsByYear, years }) => {
      replaceChildren(
        priceIncreases,
        years.map((y) => {
          const yearTotal = totalsByYear[y];
          const prevYear = y - 1;
          const prevTotal = totalsByYear[prevYear];
          return compareYearPriceIncrease(yearTotal, prevTotal, y, prevYear);
        })
      );
    });
    return priceIncreases;
  }
  function summaryOfExcessBillingAndInterest(calculatedValuesState) {
    const summary2 = div();
    calculatedValuesState.onValueChange(({ excessYears, totalsByYear, paybackInterestYears }) => {
      replaceChildren(summary2, summaryList(excessYears, totalsByYear, paybackInterestYears));
    });
    return summary2;
  }
  function analysisOfPaybackInterest(calculatedValuesState) {
    const paybackInterest = div();
    calculatedValuesState.onValueChange(({ excessYears, paybackInterestYears }) => {
      replaceChildren(
        paybackInterest,
        excessYears.length > 0 && div(
          p(
            "Viiv\xE4styskorko laskettuna korjattujen kuukausien laskujen maksup\xE4iv\xE4st\xE4. Korjattuina kuukausina rahaa on ker\xE4tty perusteettomasti"
          ),
          excessBillingPaybackInterestTable(paybackInterestYears)
        )
      );
    });
    return paybackInterest;
  }
  function kaukolampoExcessPricingCalculator() {
    const contract = tuusulanjarvenLampo;
    const from = { year: 2022, month: 1 };
    const to = { year: 2025, month: 12 };
    const years = range(from.year, to.year);
    const address2 = "Rykmentintie 12 A";
    const monthlyPricing = resolveMonthlyPricingLookup(contract, from, to);
    const pFromBrowserUrl = getPUrlParameter();
    const powerUsage = parseUnderscoreSeparatedYmNumbers(pFromBrowserUrl || usage);
    const powerUsageState = createState({ value: powerUsage });
    const calculatedValuesState = powerUsageState.map(
      (powerUsage2) => calculateValues(years, monthlyPricing, powerUsage2.numbers)
    );
    return div(
      div(
        h2("Liiallinen laskutus ja viiv\xE4styskorko"),
        summaryOfExcessBillingAndInterest(calculatedValuesState),
        h2(`${address2} laskut ${years[0]}-${years[years.length - 1]}`),
        billSummary(years, calculatedValuesState, powerUsageState),
        h3("Hinnanmuutokset edelliseen kuukauteen verrattuna"),
        priceChangesByMonth(calculatedValuesState),
        h3(`Hinnanmuutokset vuositasolla`),
        priceChangeComparedToFirstYear(calculatedValuesState),
        uiStyles.pageBreakAfter
      ),
      div(h2("Korotusten arviointi vuositasolla"), priceIncreaseByYear(calculatedValuesState), uiStyles.pageBreakAfter),
      div(h2("Kuukausikohtaisen viiv\xE4styskoron laskeminen"), analysisOfPaybackInterest(calculatedValuesState))
    );
  }

  // src/osakkeet/osakkeetLocalizations.ts
  var FI = {
    languageSwitch: {
      label: "Kieli"
    },
    intro: {
      title: "IPO-laskuri osakkeille",
      description: "Laskee p\xE4\xE4omanpalautusten kohdistuksen, hankintamenon j\xE4ljell\xE4 olevan m\xE4\xE4r\xE4n sek\xE4 IPO-myynnin verollisen ja nettom\xE4\xE4r\xE4isen lopputuloksen.",
      unlistedDescription: "T\xE4m\xE4 laskuri on tarkoitettu ennen listautumista olevalle listaamattomalle yhti\xF6lle. IPO-p\xE4iv\xE4st\xE4 eteenp\xE4in varojenjako k\xE4sitell\xE4\xE4n t\xE4ss\xE4 n\xE4kym\xE4ss\xE4 osinkona.",
      warningsTitle: "Varoitukset",
      warnings: [
        "Laskuri ei tue yritysten sulautumisia.",
        "Laskuria ei ole viel\xE4 testattu kattavasti ihmisten toimesta.",
        "Todellisiin rahallisiin p\xE4\xE4t\xF6ksiin kannattaa k\xE4ytt\xE4\xE4 ammattilaispalvelua. T\xE4m\xE4 ei ole sellainen."
      ],
      securityTitle: "Tietoturva ja vastuunvapautus",
      securityText: "T\xE4m\xE4 sovellus on avointa l\xE4hdekoodia ja vapaasti k\xE4ytett\xE4viss\xE4, mutta kehitt\xE4j\xE4 ei ota mink\xE4\xE4nlaista siit\xE4, ett\xE4 sovellus olisi turvallinen, virheet\xF6n tai ilmainen k\xE4ytt\xE4\xE4.",
      securityAdditionalText: "T\xE4m\xE4 sovellus toimii vain selaimessa. Se ei l\xE4het\xE4 tietojasi minnek\xE4\xE4n.",
      securityNote: "Huom: URL-osoitteissa v\xE4litetyt tiedot voivat n\xE4ky\xE4 muille.",
      securityIssues: "Jos havaitset virheit\xE4 tai keksit parannusehdotuksia, koosta yksinkertainen testitapaus ja lis\xE4\xE4 havainto osoitteeseen https://github.com/mikko-apo/kotibudjetti/issues"
    },
    common: {
      rows: "rivi\xE4",
      date: "P\xE4iv\xE4",
      amount: "M\xE4\xE4r\xE4",
      type: "Tyyppi",
      total: "Yhteens\xE4",
      remove: "Poista"
    },
    assumptions: {
      title: "Laskennan oletukset",
      items: [
        "Myynti kohdistetaan merkint\xE4eriin FIFO-j\xE4rjestyksess\xE4.",
        "Ennen IPO-p\xE4iv\xE4\xE4 tehdyt SVOP-varojenjaot k\xE4sitell\xE4\xE4n p\xE4\xE4omanpalautuksena vain silt\xE4 osin kuin sama osakas saa takaisin omaa enint\xE4\xE4n 10 vuotta vanhaa sijoitustaan.",
        "IPO-p\xE4iv\xE4n\xE4 tai sen j\xE4lkeen tehdyt varojenjaot k\xE4sitell\xE4\xE4n t\xE4ss\xE4 laskurissa kokonaan osinkona.",
        "Listaamattoman yhti\xF6n osingon verolajit lasketaan sy\xF6tetyn osakkeiden matemaattisen arvon perusteella.",
        "Hankintameno-olettama vertaillaan jokaiselle k\xE4ytetylle merkint\xE4er\xE4lle erikseen.",
        "P\xE4\xE4omatulovero arvioidaan vain t\xE4m\xE4n myynnin perusteella vuoden 2026 30 % / 34 % verokannoilla."
      ],
      sourcesLabel: "L\xE4hteet: "
    },
    subscriptions: {
      title: "Osakemerkinn\xE4t",
      help: "Sy\xF6t\xE4 kaikki merkint\xE4er\xE4t omassa hankintaj\xE4rjestyksess\xE4. Myynniss\xE4 k\xE4ytet\xE4\xE4n FIFO-periaatetta, ja IPO-p\xE4iv\xE4n j\xE4lkeen p\xE4\xE4ttyv\xE4 ansaintajakso est\xE4\xE4 merkint\xE4er\xE4n myynnin.",
      fields: {
        vestingEndsOn: "Ansaintajakso p\xE4\xE4ttyy",
        vestingEndsOnHelp: "T\xE4ss\xE4 laskurissa ansaintajakso vaikuttaa kahteen asiaan. 1) Jos ansaintajakso p\xE4\xE4ttyy vasta IPO-p\xE4iv\xE4n j\xE4lkeen, merkint\xE4er\xE4\xE4 ei lasketa myyt\xE4v\xE4ksi IPO:ssa. 2) Jos ty\xF6suhde tai muu j\xE4rjestelyn ehto p\xE4\xE4ttyy ennen ansaintajakson loppua, yhti\xF6ll\xE4 tai muilla osakkailla voi k\xE4yt\xE4nn\xF6ss\xE4 olla oikeus ostaa tai lunastaa osakkeet takaisin. Oikeudellisesti ansaintajakso ei yksin aiheuta t\xE4t\xE4: osake on l\xE4ht\xF6kohtaisesti vapaasti luovutettava, jollei yhti\xF6j\xE4rjestyksess\xE4 ole sallittua lunastus- tai suostumuslauseketta tai jollei takaisinostosta ole sovittu erikseen osakassopimuksessa, merkint\xE4ehdoissa tai ty\xF6suhdepohjaisessa j\xE4rjestelyss\xE4. Yhti\xF6n omien osakkeiden hankinta tai lunastus edellytt\xE4\xE4 lis\xE4ksi osakeyhti\xF6lain 15 luvun mukaista menettely\xE4 ja jakokelpoisia varoja.",
        pricePerShare: "Alkuper\xE4inen hinta / osake",
        otherTotalAcquisitionCosts: "Muut hankintamenot yhteens\xE4",
        otherTotalAcquisitionCostsHelp: "Sy\xF6t\xE4 t\xE4h\xE4n esimerkiksi varainsiirtovero, merkint\xE4\xE4n liittyv\xE4t palkkiot ja muut hankinnasta aiheutuneet kulut. \xC4l\xE4 sy\xF6t\xE4 t\xE4h\xE4n tulonhankkimisvelan korkoja, vaan ilmoita ne vuosiverotuksessa kohdassa p\xE4\xE4omatuloista teht\xE4v\xE4t v\xE4hennykset.",
        totalPricePerShare: "Kokonaishankintameno / osake",
        totalPricePerShareTooltipBase: (shares, pricePerShare, otherCosts, total) => `Alku: (${shares} osaketta x ${pricePerShare}) + ${otherCosts} = ${total}`,
        totalPricePerShareTooltipDemerger: (date, before, ratio, after) => `${date}: jakautuminen ${before} x ${ratio} = ${after}`,
        totalPricePerShareTooltipSplit: (date, beforeShares, multiplier2, afterShares) => `${date}: split ${beforeShares} osaketta x ${multiplier2} = ${afterShares} osaketta`,
        totalPricePerShareTooltipResult: (total, shares, perShare) => `Lopuksi: ${total} / ${shares} osaketta = ${perShare}`,
        totalReimbursements: "P\xE4\xE4omanpalautukset yhteens\xE4",
        totalReimbursementsHelp: "T\xE4ss\xE4 laskurissa ennen IPO-p\xE4iv\xE4\xE4 tehty SVOP-varojenjako lasketaan p\xE4\xE4omanpalautukseksi vain silt\xE4 osin kuin se palauttaa saman osakkaan omaa enint\xE4\xE4n 10 vuotta vanhaa p\xE4\xE4omasijoitusta. P\xE4\xE4omanpalautus v\xE4hent\xE4\xE4 j\xE4ljell\xE4 olevaa todellista hankintamenoa enint\xE4\xE4n siihen m\xE4\xE4r\xE4\xE4n asti. Hankintameno-olettamaa ei k\xE4ytet\xE4 p\xE4\xE4omanpalautukseen. IPO-p\xE4iv\xE4n\xE4 tai sen j\xE4lkeen varojenjako k\xE4sitell\xE4\xE4n t\xE4ss\xE4 laskurissa osinkona.",
        totalReimbursementsTooltipIntro: "Muodostuu n\xE4ist\xE4 p\xE4\xE4omanpalautuksista:",
        totalReimbursementsTooltipLine: (date, amountPerShare, shares, total) => `${date}: ${amountPerShare} / osake x ${shares} osaketta = ${total}`,
        capitalRepaymentPerShare: "P\xE4\xE4omanpalautus / osake",
        remainingCostPerShare: "J\xE4ljell\xE4 oleva hankintameno / osake"
      },
      summary: {
        totalShares: "Osakkeita yhteens\xE4",
        vestedShares: "Ansaintajakson p\xE4\xE4tt\xE4neet osakkeet",
        unvestedShares: "Ansaintajakson piiriss\xE4 olevat osakkeet"
      },
      actions: {
        add: "Lis\xE4\xE4 merkint\xE4"
      }
    },
    cashDistributions: {
      title: "Osingot ja p\xE4\xE4omanpalautukset",
      help: "Yhteens\xE4 ja maksettu k\xE4teisen\xE4 lasketaan automaattisesti osakekohtaisen m\xE4\xE4r\xE4n, omistuksen ja ennakonpid\xE4tyksen perusteella.",
      fields: {
        shareCount: "Osakkeita yhteens\xE4",
        amountPerShare: "\u20AC/osake",
        withholding: "Ennakko verottajalle",
        withholdingHelp: "T\xE4m\xE4 on laskurin arvioima ennakonpid\xE4tys, jonka yhti\xF6 pid\xE4tt\xE4\xE4 varojenjaosta verottajalle ennen maksua. IPO-p\xE4iv\xE4n\xE4 tai sen j\xE4lkeen laskuri k\xE4sittelee varojenjaon listatun yhti\xF6n osinkona. Ennen IPO:ta ennakonpid\xE4tys lasketaan vain siit\xE4 osasta, joka verotetaan osinkona eik\xE4 p\xE4\xE4omanpalautuksena.",
        cashPaid: "Maksettu k\xE4teisen\xE4",
        cashPaidHelp: "T\xE4m\xE4 on osakkaalle maksettava nettok\xE4teinen varojenjaosta sen j\xE4lkeen, kun ennakko verottajalle on v\xE4hennetty. Laskurissa summa lasketaan kaavalla yhteens\xE4 minus ennakko verottajalle.",
        capitalRepayment: "P\xE4\xE4omanpalautus",
        capitalRepaymentHelp: "T\xE4t\xE4 arvoa k\xE4ytet\xE4\xE4n vuositason verolaskennassa erottamaan se osa varojenjaosta, joka k\xE4sitell\xE4\xE4n p\xE4\xE4omanpalautuksena eik\xE4 osinkona.",
        capitalRepaymentSharesHelp: (shares) => `T\xE4m\xE4n rivin p\xE4\xE4omanpalautus lasketaan ${shares} osakkeelle.`,
        dividend: "Osinko",
        dividendHelp: "T\xE4t\xE4 arvoa k\xE4ytet\xE4\xE4n vuositason verolaskennassa osingon veronalaisen ja verovapaan osuuden sek\xE4 ennakonpid\xE4tyksen laskentaan.",
        dividendSharesHelp: (shares) => `T\xE4m\xE4n rivin osinko lasketaan ${shares} osakkeelle.`
      },
      actions: {
        add: "Lis\xE4\xE4 varojenjako"
      },
      types: {
        capitalReturn: "P\xE4\xE4omanpalautus",
        dividend: "Osinko"
      },
      messages: {
        shareCountMismatch: (expected, given) => `Osakem\xE4\xE4r\xE4 ei t\xE4sm\xE4\xE4 merkint\xF6ihin t\xE4ll\xE4 p\xE4iv\xE4ll\xE4. Odotettu ${expected}, annettu ${given}.`
      }
    },
    shareSplits: {
      title: "Osakesplitit",
      help: "Sy\xF6t\xE4 splitin p\xE4iv\xE4 ja kerroin. Kerroin 2 tarkoittaa, ett\xE4 yksi vanha osake muuttuu kahdeksi. Kerroin 0,5 tarkoittaa, ett\xE4 kaksi vanhaa osaketta yhdistyy yhdeksi.",
      fields: {
        multiplier: "Osakkeita / vanha osake"
      },
      actions: {
        add: "Lis\xE4\xE4 split"
      }
    },
    demergers: {
      title: "Yrityksen jakautuminen hankintamenon mukaan",
      help: "Sy\xF6t\xE4 jakautumisen p\xE4iv\xE4 ja se desimaaliosuus, joka j\xE4\xE4 t\xE4m\xE4n laskurin seuraaman vanhan yhti\xF6n hankintamenoksi. Esimerkiksi 0,72 tarkoittaa, ett\xE4 72 % hankintamenosta j\xE4\xE4 vanhalle yhti\xF6lle ja loput siirtyv\xE4t uudelle yhti\xF6lle. K\xE4yt\xE4 yhti\xF6n tai verotusohjeen ilmoittamaa jakosuhdetta: se perustuu yleens\xE4 nettovarallisuuksien suhteeseen, mutta jos se poikkeaa olennaisesti osakkeiden k\xE4ypien arvojen suhteesta, k\xE4ytet\xE4\xE4n k\xE4ypien arvojen suhdetta.",
      fields: {
        oldCompanyRatio: "Vanhan yhti\xF6n osuus hankintamenosta"
      },
      actions: {
        add: "Lis\xE4\xE4 jakautuminen"
      }
    },
    ipo: {
      title: "IPO-tiedot ja yhteenveto",
      fields: {
        ipoDate: "IPO-p\xE4iv\xE4",
        totalShareCount: "Osakkeiden kokonaism\xE4\xE4r\xE4",
        totalIpoCost: "IPO-kulut yhteens\xE4",
        currentShareValue: "Nykyinen osakkeen arvo",
        currentTotalValue: "Nykyinen kokonaisarvo",
        estimatedPreIpoValue: "Arvioitu pre-IPO-arvo",
        ipoSharePrice: "IPO-hinta / osake",
        increasePercent: "Nousu %",
        increaseMultiplier: "Kerroin",
        secondarySellPercent: "Arvioitu secondary-myynti %"
      },
      help: {
        secondary: "K\xE4ytet\xE4\xE4n IPO-kulun allokointiin per myyty osake.",
        dateFormat: "Muoto pp.kk.vvvv. Samaa p\xE4iv\xE4\xE4 k\xE4ytet\xE4\xE4n 10 vuoden hankintameno-olettaman tarkistukseen."
      }
    },
    mathematicalShareValues: {
      title: "Matemaattinen arvo / osake tunnetuille vuosille",
      fields: {
        year: "Vuosi",
        valuePerShare: "Arvo / osake"
      },
      actions: {
        add: "Lis\xE4\xE4 vuosi"
      }
    },
    summary: {
      title: "Yhteenveto",
      cards: {
        subscribedShares: "Merkittyj\xE4 osakkeita ja omistusosuus",
        subscribedCost: "Merkint\xF6jen hankintameno",
        ipoPricePerShare: "IPO-hinta / osake",
        currentValuePerShare: "Nykyarvo / osake",
        ipoCostPerSecondaryShare: "IPO-kulu / secondary-osake",
        secondarySharesTotal: "Secondary-osakkeita yhteens\xE4"
      },
      allocationByLot: {
        title: "Myynnin kohdistus merkint\xE4erille",
        fields: {
          distribution: "Varojenjako",
          shares: "Osakkeita",
          remainingPerShare: "J\xE4ljell\xE4 / osake"
        }
      },
      ipoSell: {
        title: "IPO-myynnin tiedot",
        fields: {
          sharesToSell: "Myyt\xE4vien osakkeiden m\xE4\xE4r\xE4",
          ipoPriceTotal: "IPO-hinta yhteens\xE4",
          actualCosts: "Todelliset kulut",
          hmo: "Hankintameno-olettama",
          capitalGain: "Luovutusvoitto"
        },
        summaryTitle: "IPOn yhteenveto",
        cards: {
          grossSale: "Myynti brutto",
          netCash: "K\xE4teen",
          taxMan: "Verottajalle",
          ipoCostsAllocated: "Kohdistetut IPO-kulut",
          taxableCapitalGain: "Verotettava luovutusvoitto",
          sharesLeft: "Osakkeita j\xE4ljelle",
          sellableShares: "Myyt\xE4viss\xE4 IPOssa",
          unvestedShares: "Ei myyt\xE4viss\xE4 IPOssa"
        },
        explanations: {
          title: "Osakkeiden myyntihinta ja kulut",
          ipoPriceTotal: "IPO-hinta yhteens\xE4",
          ipoCostsAllocated: "Kohdistetut IPO-kulut",
          netCash: "K\xE4teen ennen veroja",
          capitalGain: "Luovutusvoitto IPOsta",
          selectedDeductions: "Luovutusvoittoa pienent\xE4v\xE4t v\xE4hennykset",
          taxOnCapitalGain: "Veroihin varattava: arvioitu p\xE4\xE4omatulovero luovutusvoitosta",
          deductibleIpoCosts: "Todellisten kulujen IPO-kulujen vaikutus verotuksessa",
          hmoIpoCosts: "Hallintameno-olettamuksen kanssa IPO-kuluja ei huomioida",
          ipoPriceTotalHelp: (gross) => `IPO-hinta yhteens\xE4 on kaikkien myytyjen osakkeiden bruttohinta ${gross}.`,
          ipoCostsAllocatedHelp: (ipoCosts) => `Kohdistetut IPO-kulut ${ipoCosts} v\xE4hennet\xE4\xE4n osakkeiden myyntihinnasta. Ne voivat olla v\xE4litt\xE4j\xE4n kuluja yms. Niiden osakkeiden osalta joiden kohdalla k\xE4ytet\xE4\xE4n todellisia kuluja, kohdistetut IPO-kulut lis\xE4t\xE4\xE4n osakekohtaisesti todellisiin kuluihin t\xE4ss\xE4 laskurissa.`,
          netCashHelp: (gross, ipoCosts, net) => `K\xE4teen ennen vuotuista verotusta = IPO-hinta yhteens\xE4 ${gross} - kohdistetut IPO-kulut ${ipoCosts} = ${net}.`,
          capitalGainHelp: (gross, acquisitionCosts) => `Luovutusvoitto lasketaan v\xE4hent\xE4m\xE4ll\xE4 "IPO-hinta yhteens\xE4" summasta "Luovutusvoittoa pienent\xE4v\xE4t v\xE4hennykset": ${gross} - ${acquisitionCosts}.`,
          selectedDeductionsHelp: (actual, hmo) => `Todelliset kulut ${actual} + hankintameno-olettama ${hmo}.`,
          taxOnCapitalGainHelp: (capitalGain, lowPart, highPart, tax) => `Luovutusvoitto ${capitalGain} on t\xE4ss\xE4 laskurissa verotettavaa p\xE4\xE4omatuloa. Vuoden 2026 arvioitu p\xE4\xE4omatulovero on 30 % ensimm\xE4isest\xE4 30 000 eurosta (${lowPart}) ja 34 % sen ylitt\xE4v\xE4st\xE4 osasta (${highPart}). Veroihin varattava arvioitu p\xE4\xE4omatulovero on yhteens\xE4 ${tax}.`,
          deductibleIpoCostsHelp: (ipoCosts, taxSaved) => `Todellisiin kuluihin sis\xE4ltyy IPO-kuluja ${ipoCosts}, mik\xE4 pienent\xE4\xE4 arvioitua veroa ${taxSaved}.`,
          hmoIpoCostsHelp: () => "HMO-eriss\xE4 IPO-kuluja ei voi merkit\xE4 v\xE4hennyksiksi."
        },
        capitalGainAnnualTax: {
          title: "Luovutusvoiton laskeminen ja verottaminen vuositasolla",
          driversTitle: "Voitot ja tappiot osakemyynneiss\xE4 vuositasolla",
          driversValue: "",
          driversHelp: 'Vuosittaisessa verotuksessa kaikki luovutusvoitot ja luovutustappiot lasketaan lopuksi yhteen ja kertyneen "Luovutusvoiton" m\xE4\xE4r\xE4 m\xE4\xE4ritt\xE4\xE4 "Luovutusvoiton veron" m\xE4\xE4r\xE4n. Seuraavaksi lasketaan kuinka paljon "Luovutusvoiton veroa" muodostuu jos t\xE4m\xE4 on ainoa osakekauppa mit\xE4 teet.'
        },
        cashReserve: {
          title: "Tilille j\xE4\xE4v\xE4 raha ja veroihin varattava osuus",
          otherAnnualCapitalGainsOrLosses: "Muut luovutusvoitot tai tappiot",
          otherAnnualCapitalGainsOrLossesHelp: "Sy\xF6t\xE4 kentt\xE4\xE4n muut mahdolliset luovutusvoitot ja tappiot",
          annualAdjustmentTitle: "Muiden luovutusvoittojen tai -tappioiden vaikutus vuositasolla",
          annualAdjustedKeepAfterTaxes: "Tilille voi j\xE4tt\xE4\xE4 vuositasolla",
          annualAdjustedReserveForTaxes: "Veroihin varattava vuositasolla",
          keepAfterTaxes: "Tilille voi j\xE4tt\xE4\xE4",
          reserveForTaxes: "Veroihin varattava",
          taxEffectFromOtherAnnualCapital: "Muiden luovutusvoittojen tai -tappioiden vaikutus veroon",
          taxPaymentStatus: "Perit\xE4\xE4nk\xF6 vero automaattisesti?",
          taxPaymentManual: "Ei yleens\xE4 automaattisesti",
          keepAfterTaxesHelp: (cash, tax, kept) => `Tilille j\xE4\xE4v\xE4 summa = k\xE4teen ${cash} - veroihin varattava osuus ${tax} = ${kept}.`,
          reserveForTaxesHelp: (tax) => `Arvioitu vero ${tax} kannattaa varata erikseen, jotta vuotuinen verotus ei aiheuta yll\xE4tt\xE4v\xE4\xE4 maksua.`,
          taxEffectFromOtherAnnualCapitalHelp: (other, reduction, increase) => `Anna t\xE4h\xE4n vuoden muiden luovutusvoittojen tai luovutustappioiden yhteisvaikutus. Sy\xF6tetty muutos ${other}. Negatiivinen arvo pienent\xE4\xE4 veroarviota ${reduction}. Positiivinen arvo kasvattaa veroarviota ${increase}. Tappiolla olevien osakkeiden myynti voi pienent\xE4\xE4 veroa, mutta v\xE4lit\xF6nt\xE4 takaisinostoa ei kannata tehd\xE4 pelk\xE4st\xE4\xE4n verotussyyst\xE4 ilman ammattilaisen arviota.`,
          annualAdjustedKeepAfterTaxesHelp: (cash, tax, kept) => `Vuositasolla tilille j\xE4\xE4v\xE4 summa = k\xE4teen ${cash} - vuositasolla veroihin varattava osuus ${tax} = ${kept}.`,
          annualAdjustedReserveForTaxesHelp: (tax) => `Kun muut luovutusvoitot tai luovutustappiot huomioidaan, vuositasolla varattava vero on ${tax}.`,
          taxPaymentStatusHelp: "Verohallinnon ohjeen mukaan osakkeiden myyntivoiton verosta pit\xE4\xE4 yleens\xE4 huolehtia itse ennakkoverona tai lis\xE4ennakkona. Osingosta ennakonpid\xE4tys tehd\xE4\xE4n erikseen, mutta myyntivoitosta ei yleens\xE4 pid\xE4tet\xE4 veroa automaattisesti."
        },
        saleResultComparison: {
          title: "Merkint\xE4kulut ja nettotulos",
          cardTitle: "Myytyjen osakkeiden hankintameno ja nettotulos",
          value: (before, after, gain, percent) => `Ennen p\xE4\xE4omanpalautuksia ${before}, j\xE4lkeen p\xE4\xE4omanpalautusten ${after}, nettotulos ${gain} (${percent}).`,
          help: (before, after, kept, gain, percent) => `Myynniss\xE4 k\xE4ytettyjen merkint\xE4erien hankintameno ennen p\xE4\xE4omanpalautuksia on ${before} ja p\xE4\xE4omanpalautusten j\xE4lkeen ${after}. Tilille voi j\xE4tt\xE4\xE4 ${kept}, joten nettotulos k\xE4ytettyihin merkint\xE4eriin n\xE4hden on ${gain} (${percent}).`
        },
        ipoCostEffects: {
          title: "IPO-kulujen vaikutus"
        },
        tooltips: {
          actualCosts: (realCostBasis, allocatedIpoCost, total) => `Todelliset kulut = j\xE4\xE4nn\xF6shankintameno ${realCostBasis} + kohdistettu IPO-kulu ${allocatedIpoCost} = ${total}.`,
          hmo: (gross, rate, deduction) => `Hankintameno-olettama = IPO-hinta yhteens\xE4 ${gross} x ${rate} = ${deduction}.`
        }
      },
      totalRow: "Yhteens\xE4"
    },
    taxReturns: {
      title: "Yhteenveto veroilmoituksista",
      yearWarningMissingMathValue: "Osinkoverotuksen jakoa ei voitu laskea ilman vuoden matemaattista arvoa / osake.",
      sections: {
        unlisted: "Listaamaton yhti\xF6",
        unlistedHelp: "T\xE4ss\xE4 osiossa n\xE4kyv\xE4t ennen IPO-p\xE4iv\xE4\xE4 saadut varojenjaot, jotka t\xE4m\xE4n laskurin mukaan kuuluvat muun kuin julkisesti noteeratun yhti\xF6n tietoihin. Tarkista, ett\xE4 tiedot n\xE4kyv\xE4t esit\xE4ytetyll\xE4 veroilmoituksella. Jos tietoja puuttuu tai ne ovat v\xE4\xE4rin, korjaa ne OmaVerossa.",
        listed: "Listattu yhti\xF6"
      },
      fields: {
        taxableCapitalIncome: "Veronalaista p\xE4\xE4omatuloa",
        taxFreeCapitalIncome: "Verotonta p\xE4\xE4omatuloa",
        taxableEarnedDividend: "Veronalaista ansiotulo-osinkoa",
        taxFreeEarnedDividend: "Verotonta ansiotulo-osinkoa",
        ipoSaleAllocation: "IPO-myynnin jako",
        unlistedCapitalRepaymentHelp: "T\xE4m\xE4 osa on luovutuksena verotettavaa p\xE4\xE4omanpalautusta, ei osinkoa. Tarkista, ett\xE4 se n\xE4kyy esit\xE4ytetyll\xE4 veroilmoituksella p\xE4\xE4omanpalautuksena. Jos tieto puuttuu, ilmoita tai korjaa se OmaVerossa arvopaperien luovutuksena.",
        unlistedDividendHelp: "T\xE4m\xE4 osa ilmoitetaan muun kuin julkisesti noteeratun yhti\xF6n osinkona. Tarkista esit\xE4ytetty veroilmoitus. Jos tieto puuttuu, lis\xE4\xE4 OmaVerossa uusi osinkotulo ja valitse listaamaton yhti\xF6.",
        listedDividendHelp: "T\xE4m\xE4 osa ilmoitetaan listatun yhti\xF6n osinkona. Tarkista esit\xE4ytetty veroilmoitus. Jos tieto puuttuu, lis\xE4\xE4 OmaVerossa uusi osinkotulo ja valitse listattu yhti\xF6."
      }
    },
    storage: {
      title: "Tallennus",
      actions: {
        saveToBrowserStorage: "Tallenna selaimeen pysyv\xE4sti",
        loadFromBrowserStorage: "Lataa selaimesta",
        removeFromBrowserStorage: "Poista selaimesta",
        copyShareUrl: "Kopioi yrityksen tiedot URL:iin",
        saveFile: "Tallenna",
        loadFile: "Lataa tiedosto",
        showSmallExample: "Pienomistaja, 2v",
        showMediumExample: "Medium, 8v",
        showLargeExample: "Large, 16v",
        clearExample: "Tyhjenn\xE4"
      },
      table: {
        rowTitle: "Toiminto",
        descriptionTitle: "Kuvaus",
        actionsTitle: "Painikkeet",
        autoSaveTitle: "Automaattinen tallennus",
        autoSaveDescription: "Sovellus tallentaa sy\xF6tteet automaattisesti selainikkunan omaan tallennustilaan, joten sivun p\xE4ivitys s\xE4ilytt\xE4\xE4 tiedot. Jos selainikkuna suljetaan, n\xE4m\xE4 tiedot katoavat.",
        fileTitle: "Tallenna tiedosto tietokoneelle",
        fileDescription: "Voit ladata sy\xF6tetyt tiedot tietokoneellesi JSON tiedostona.",
        browserTitle: "Tallenna tiedot selaimeen",
        browserDescription: "Voit tallentaa tiedot selaimen muistiin. Tieto tulee automaattisesti k\xE4ytt\xF6\xF6n jos sivu ladataan uuteen selainikkunaan.",
        clearTitle: "Tyhjenn\xE4 luvut",
        clearDescription: "Voit tyhjent\xE4\xE4 sy\xF6tetyt lukemat, mutta se ei poista selaimeen talletettua tietoa tai ladattuja tiedostoja.",
        exampleTitle: "N\xE4yt\xE4 esimerkki-tilanne",
        exampleDescription: "Voit tutkia milt\xE4 sovellus n\xE4ytt\xE4\xE4 esimerkkidatalla."
      },
      copyShareUrlHelp: "T\xE4ll\xE4 voi jakaa yhti\xF6n tiedot ja varojenjaot toisille.",
      copyShareUrlNote: "Huom: URL-osoitteissa v\xE4litetyt tiedot voivat n\xE4ky\xE4 muille.",
      status: {
        saved: "Tallennettu automaattisesti",
        browserSaved: "Tallennettu selaimeen pysyv\xE4sti",
        browserLoaded: "Ladattu selaimen pysyv\xE4st\xE4 tallennuksesta",
        browserRemoved: "Selaimen pysyv\xE4 tallennus poistettu",
        shareUrlCopied: "URL kopioitu",
        loaded: "Ladattu",
        exampleShown: "Esimerkki n\xE4ytetty",
        exampleCleared: "Esimerkkidata poistettu",
        fileSaved: "Tiedosto tallennettu"
      },
      errors: {
        invalidFile: "Virheellinen tiedosto",
        fileReadFailed: "Tiedoston luku ep\xE4onnistui",
        clipboardFailed: "Kopiointi ep\xE4onnistui"
      },
      confirmations: {
        clearExample: "Tyhjennet\xE4\xE4nk\xF6 kaikki nykyiset tiedot?"
      },
      saveIndicators: {
        browserNeedsSave: "Sy\xF6tteit\xE4 on muutettu eik\xE4 niit\xE4 ole tallennettu selaimen pysyv\xE4\xE4n tallennukseen.",
        browserSaved: "Selaimen pysyv\xE4 tallennus on ajan tasalla.",
        browserLoadUnavailable: "Selaimen pysyv\xE4ss\xE4 tallennuksessa ei ole tietoja ladattavaksi.",
        fileNeedsSave: "Sy\xF6tteit\xE4 on muutettu eik\xE4 niit\xE4 ole tallennettu tiedostoon t\xE4ss\xE4 ikkunassa.",
        fileSaved: "Tiedostotallennus on ajan tasalla t\xE4ss\xE4 ikkunassa."
      }
    },
    messages: {
      errorsTitle: "Sy\xF6tteiss\xE4 on korjattavaa",
      warningsTitle: "Huomiot"
    },
    sources: {
      dividends: "Verohallinto: Osingot listaamattomasta yhti\xF6st\xE4",
      listedDividends: "Verohallinto: Osingot listatusta yhti\xF6st\xE4",
      demergerAcquisitionCost: "Verohallinto: Arvopaperien luovutusten verotus - jakautuminen",
      demergers: "Verohallinto: Yritysj\xE4rjestelyt ja verotus - jakautuminen",
      reporting: "Verohallinto: Esit\xE4ytetty veroilmoitus - n\xE4in ilmoitat OmaVerossa tai paperilla",
      form9a: "Verohallinto: 9A t\xE4ytt\xF6ohje",
      sales: "Verohallinto: Osakkeiden myynti"
    },
    calculator: {
      validation: {
        negative: (field) => `${field} ei voi olla negatiivinen.`,
        invalidNumber: (field) => `${field} ei ole kelvollinen numero.`,
        invalidDate: (field) => `${field} ei ole kelvollinen pvm.`
      },
      fields: {
        subscriptionAmount: (label2) => `Merkint\xE4 ${label2} m\xE4\xE4r\xE4`,
        subscriptionPricePerShare: (label2) => `Merkint\xE4 ${label2} hinta/osake`,
        subscriptionOtherTotalAcquisitionCosts: (label2) => `Merkint\xE4 ${label2} muut hankintamenot`,
        subscriptionDate: (id) => `Merkint\xE4 ${id} p\xE4iv\xE4`,
        subscriptionVestingEndsOn: (id) => `Merkint\xE4 ${id} ansaintajakso p\xE4\xE4ttyy`,
        mathematicalShareValueYear: (id) => `Matemaattinen arvo vuosi ${id}`,
        mathematicalShareValuePerShare: (id) => `Matemaattinen arvo/osake ${id}`,
        ipoDate: "IPO-p\xE4iv\xE4",
        totalShareCount: "Osakkeiden kokonaism\xE4\xE4r\xE4",
        totalIpoCost: "IPO-kulut yhteens\xE4",
        currentShareValue: "Nykyinen osakkeen arvo",
        estimatedPreIpoValue: "Arvioitu pre-IPO-arvo",
        estimatedSecondaryShareSellPercentage: "Arvioitu secondary-myyntiprosentti",
        sellAmount: "Myyt\xE4vien osakkeiden m\xE4\xE4r\xE4",
        otherAnnualCapitalGainsOrLosses: "Muut luovutusvoitot tai tappiot",
        cashDistributionDate: (id) => `Varojenjako ${id} p\xE4iv\xE4`,
        cashDistributionAmountPerShare: (id) => `Varojenjako ${id} \u20AC/osake`,
        shareSplitDate: (id) => `Split ${id} p\xE4iv\xE4`,
        shareSplitMultiplier: (id) => `Split ${id} kerroin`,
        demergerDate: (id) => `Jakautuminen ${id} p\xE4iv\xE4`,
        demergerOldCompanyRatio: (id) => `Jakautuminen ${id} vanhan yhti\xF6n osuus`
      },
      warnings: {
        totalShareCountBelowSubscriptions: "Osakkeiden kokonaism\xE4\xE4r\xE4 on pienempi kuin sy\xF6tettyjen merkint\xF6jen yhteism\xE4\xE4r\xE4.",
        secondarySellPercentZero: "Secondary-myyntiprosentti on 0, joten IPO-kulu/osake on jaettu koko osakem\xE4\xE4r\xE4lle.",
        noSharesHeldForDistribution: (date) => `Varojenjaolle ${date} ei l\xF6ytynyt omistettuja osakkeita.`,
        sellAmountExceedsEstimatedSecondary: "Myyntim\xE4\xE4r\xE4 ylitt\xE4\xE4 arvioidun secondary-myyntim\xE4\xE4r\xE4n koko yhti\xF6n tasolla.",
        vestingBlockedWithoutIpoDate: "IPO-p\xE4iv\xE4 puuttuu, joten ansaintajakson rajoittamia merkint\xE4eri\xE4 ei voitu ottaa mukaan myyntiin."
      },
      errors: {
        sellAmountExceedsSellable: (shares) => `Myyt\xE4vien osakkeiden m\xE4\xE4r\xE4 ylitt\xE4\xE4 IPO-p\xE4iv\xE4n\xE4 myyt\xE4viss\xE4 olevien osakkeiden m\xE4\xE4r\xE4n (${shares}).`
      }
    }
  };
  var EN = {
    languageSwitch: {
      label: "Language"
    },
    intro: {
      title: "IPO calculator for shares",
      description: "Calculates how capital repayments are allocated, how acquisition cost remains, and what the IPO sale produces before and after tax.",
      unlistedDescription: "This calculator is intended for an unlisted company before listing. From the IPO date onward, distributions are treated as dividends in this view.",
      warningsTitle: "Warnings",
      warnings: [
        "This calculator does not support mergers.",
        "This calculator has not yet been thoroughly tested by humans.",
        "For real monetary advice, use a professional service. This is not one."
      ],
      securityTitle: "Security and disclaimer",
      securityText: "This application is open source and free to use, but the developer takes no responsibility of any kind for whether the application is secure, error-free, or free to use.",
      securityAdditionalText: "This application works only in browser. It does not send your data anywhere.",
      securityNote: "Note: Any data passed in URLs might be visible to others.",
      securityIssues: "If you notice bugs or have improvement ideas, create a simple test case and add the finding at https://github.com/mikko-apo/kotibudjetti/issues"
    },
    common: {
      rows: "rows",
      date: "Date",
      amount: "Amount",
      type: "Type",
      total: "Total",
      remove: "Remove"
    },
    assumptions: {
      title: "Calculation assumptions",
      items: [
        "Sales are allocated to subscription lots using FIFO.",
        "Before the IPO date, distributions from invested unrestricted equity are treated as capital repayment only to the extent the same shareholder gets back their own investment made within the last 10 years.",
        "On and after the IPO date, distributions are treated as dividends in this calculator.",
        "Tax categories for dividends from an unlisted company are calculated using the entered mathematical value per share for each year.",
        "The deemed acquisition cost is compared separately for each subscription lot used in the sale.",
        "Capital income tax is estimated only for this sale using the 2026 30% / 34% rates."
      ],
      sourcesLabel: "Sources: "
    },
    subscriptions: {
      title: "Share subscriptions",
      help: "Enter all subscription lots in acquisition order. FIFO is used for sales, and a vesting period ending after the IPO date blocks that lot from being sold.",
      fields: {
        vestingEndsOn: "Vesting ends",
        vestingEndsOnHelp: "In this calculator, the vesting period affects two things. 1) If vesting ends only after the IPO date, that lot is not treated as sellable in the IPO. 2) If employment or another plan condition ends before vesting is complete, the company or other shareholders may in practice have a right to buy back or redeem the shares. Legally, vesting alone does not create that result: shares are freely transferable by default unless the articles contain a permitted redemption or consent clause, or unless a separate buyback obligation has been agreed in a shareholders agreement, subscription terms, or an employment-based arrangement. In addition, a company buyback or redemption of its own shares must follow Chapter 15 of the Finnish Companies Act and requires distributable funds.",
        pricePerShare: "Original price / share",
        otherTotalAcquisitionCosts: "Other acquisition costs total",
        otherTotalAcquisitionCostsHelp: "Enter items such as transfer tax, subscription-related fees, and other acquisition costs. Do not include interest on income-producing debt here; report that in annual taxation under deductions from capital income.",
        totalPricePerShare: "Total acquisition cost / share",
        totalPricePerShareTooltipBase: (shares, pricePerShare, otherCosts, total) => `Start: (${shares} shares x ${pricePerShare}) + ${otherCosts} = ${total}`,
        totalPricePerShareTooltipDemerger: (date, before, ratio, after) => `${date}: demerger ${before} x ${ratio} = ${after}`,
        totalPricePerShareTooltipSplit: (date, beforeShares, multiplier2, afterShares) => `${date}: split ${beforeShares} shares x ${multiplier2} = ${afterShares} shares`,
        totalPricePerShareTooltipResult: (total, shares, perShare) => `Final: ${total} / ${shares} shares = ${perShare}`,
        totalReimbursements: "Capital repayments total",
        totalReimbursementsHelp: "In this calculator, a pre-IPO distribution from the invested unrestricted equity reserve is treated as capital repayment only to the extent it returns the same shareholder\u2019s own capital investment made within the previous 10 years. The capital repayment reduces the remaining actual acquisition cost only up to that amount. The deemed acquisition cost is not used for capital repayments. On the IPO date and after it, distributions are treated as dividends in this calculator.",
        totalReimbursementsTooltipIntro: "Built from these applied capital repayments:",
        totalReimbursementsTooltipLine: (date, amountPerShare, shares, total) => `${date}: ${amountPerShare} / share x ${shares} shares = ${total}`,
        capitalRepaymentPerShare: "Capital repayment / share",
        remainingCostPerShare: "Remaining acquisition cost / share"
      },
      summary: {
        totalShares: "Total shares",
        vestedShares: "Vested shares",
        unvestedShares: "Unvested shares"
      },
      actions: {
        add: "Add subscription"
      }
    },
    cashDistributions: {
      title: "Dividends and capital repayments",
      help: "Total amount and cash paid are calculated automatically from the per-share amount, holdings, and withholding.",
      fields: {
        shareCount: "Total shares",
        amountPerShare: "EUR / share",
        withholding: "To tax office in advance",
        withholdingHelp: "This is the calculator\u2019s estimate of withholding that the company remits to the tax authority before payment. On and after the IPO date, the calculator treats the distribution as a listed-company dividend. Before the IPO, withholding is calculated only on the part that is taxed as dividend, not as capital repayment.",
        cashPaid: "Paid in cash",
        cashPaidHelp: "This is the net cash paid to the shareholder after the withholding amount has been deducted. In the calculator, the value is total amount minus withholding to the tax authority.",
        capitalRepayment: "Capital repayment",
        capitalRepaymentHelp: "This value is used in the annual tax calculation to separate the part of the distribution that is treated as capital repayment rather than dividend.",
        capitalRepaymentSharesHelp: (shares) => `The capital repayment on this row is calculated using ${shares} shares.`,
        dividend: "Dividend",
        dividendHelp: "This value is used in the annual tax calculation to determine the taxable and tax-free dividend portions and the withholding amount.",
        dividendSharesHelp: (shares) => `The dividend on this row is calculated using ${shares} shares.`
      },
      actions: {
        add: "Add distribution"
      },
      types: {
        capitalReturn: "Capital repayment",
        dividend: "Dividend"
      },
      messages: {
        shareCountMismatch: (expected, given) => `Share count does not match subscriptions on this date. Expected ${expected}, given ${given}.`
      }
    },
    shareSplits: {
      title: "Share splits",
      help: "Enter the split date and multiplier. A multiplier of 2 means one old share becomes two. A multiplier of 0.5 means two old shares are combined into one.",
      fields: {
        multiplier: "Shares / old share"
      },
      actions: {
        add: "Add split"
      }
    },
    demergers: {
      title: "Company demerger by acquisition-cost allocation",
      help: "Enter the demerger date and the decimal portion of acquisition cost that remains with the old company tracked in this calculator. For example, 0.72 means 72% of the acquisition cost remains with the old company and the rest moves to the new company. Use the allocation ratio given by the company or tax guidance: it is usually based on the net-asset ratio, but if that differs materially from the share fair-value ratio, the fair-value ratio is used.",
      fields: {
        oldCompanyRatio: "Old company share of acquisition cost"
      },
      actions: {
        add: "Add demerger"
      }
    },
    ipo: {
      title: "IPO details and summary",
      fields: {
        ipoDate: "IPO date",
        totalShareCount: "Total share count",
        totalIpoCost: "Total IPO costs",
        currentShareValue: "Current share value",
        currentTotalValue: "Current total value",
        estimatedPreIpoValue: "Estimated pre-IPO value",
        ipoSharePrice: "IPO share price",
        increasePercent: "Increase %",
        increaseMultiplier: "Multiplier",
        secondarySellPercent: "Estimated secondary sell %"
      },
      help: {
        secondary: "Used to allocate IPO cost per sold share.",
        dateFormat: "Format dd.mm.yyyy. The same date is used when checking eligibility for the 10-year deemed acquisition cost."
      }
    },
    mathematicalShareValues: {
      title: "Mathematical value / share for known years",
      fields: {
        year: "Year",
        valuePerShare: "Value / share"
      },
      actions: {
        add: "Add year"
      }
    },
    summary: {
      title: "Summary",
      cards: {
        subscribedShares: "Subscribed shares and ownership share",
        subscribedCost: "Subscription acquisition cost",
        ipoPricePerShare: "IPO price / share",
        currentValuePerShare: "Current value / share",
        ipoCostPerSecondaryShare: "IPO cost / secondary share",
        secondarySharesTotal: "Secondary shares total"
      },
      allocationByLot: {
        title: "Sale allocation by subscription lot",
        fields: {
          distribution: "Distribution",
          shares: "Shares",
          remainingPerShare: "Remaining / share"
        }
      },
      ipoSell: {
        title: "IPO sell details",
        fields: {
          sharesToSell: "Number of shares to sell",
          ipoPriceTotal: "Total IPO price",
          actualCosts: "Actual costs",
          hmo: "Deemed acquisition cost",
          capitalGain: "Capital gain"
        },
        summaryTitle: "IPO summary",
        cards: {
          grossSale: "Gross sale",
          netCash: "In cash",
          taxMan: "To tax man",
          ipoCostsAllocated: "Allocated IPO costs",
          taxableCapitalGain: "Taxable capital gain",
          sharesLeft: "Shares remaining",
          sellableShares: "Sellable at IPO",
          unvestedShares: "Unvested at IPO"
        },
        explanations: {
          title: "Share sale price and costs",
          ipoPriceTotal: "Total IPO price",
          ipoCostsAllocated: "Allocated IPO costs",
          netCash: "Cash before taxes",
          capitalGain: "Capital gain from IPO",
          selectedDeductions: "Deductions reducing capital gain",
          taxOnCapitalGain: "Reserve for taxes: estimated capital income tax on capital gain",
          deductibleIpoCosts: "IPO costs inside actual costs",
          hmoIpoCosts: "IPO costs in HMO lots",
          ipoPriceTotalHelp: (gross) => `Total IPO price is the gross price of all sold shares: ${gross}.`,
          ipoCostsAllocatedHelp: (ipoCosts) => `Allocated IPO costs ${ipoCosts} are deducted from the share sale price. They may include broker fees and similar costs. For the shares where this calculator uses actual costs, the allocated IPO costs are added to the per-share actual costs.`,
          netCashHelp: (gross, ipoCosts, net) => `Cash before annual taxation = total IPO price ${gross} - allocated IPO costs ${ipoCosts} = ${net}.`,
          capitalGainHelp: (gross, acquisitionCosts) => `Capital gain is calculated by subtracting "Deductions reducing capital gain" from "Total IPO price": ${gross} - ${acquisitionCosts}.`,
          selectedDeductionsHelp: (actual, hmo) => `Actual costs ${actual} + deemed acquisition cost ${hmo}.`,
          taxOnCapitalGainHelp: (capitalGain, lowPart, highPart, tax) => `In this calculator, capital gain ${capitalGain} is taxable capital income. Estimated 2026 capital income tax is 30% on the first 30,000 euros (${lowPart}) and 34% on the part above that (${highPart}). The estimated capital income tax to reserve is ${tax}.`,
          deductibleIpoCostsHelp: (ipoCosts, taxSaved) => `Actual-cost lots include IPO costs ${ipoCosts}, reducing estimated tax by ${taxSaved}.`,
          hmoIpoCostsHelp: () => "In HMO lots, IPO costs cannot be marked as deductions."
        },
        capitalGainAnnualTax: {
          title: "Capital gain calculation and annual taxation",
          driversTitle: "Wins and losses from share sales over the tax year",
          driversValue: "",
          driversHelp: 'In annual taxation, all capital gains and capital losses are added together at the end, and the resulting amount of "Capital gain" determines the amount of "Capital gain tax". Next, this calculator estimates how much "Capital gain tax" is created if this is the only share sale you make.'
        },
        cashReserve: {
          title: "Cash you can keep and amount to reserve for taxes",
          otherAnnualCapitalGainsOrLosses: "Other capital gains or losses",
          otherAnnualCapitalGainsOrLossesHelp: "Enter any other possible capital gains and losses in this field",
          annualAdjustmentTitle: "Effect of other capital gains or losses over the tax year",
          annualAdjustedKeepAfterTaxes: "Can stay in your account over the tax year",
          annualAdjustedReserveForTaxes: "Reserve for taxes over the tax year",
          keepAfterTaxes: "Can stay in your account",
          reserveForTaxes: "Reserve for taxes",
          taxEffectFromOtherAnnualCapital: "Effect of other annual capital gains or losses on tax",
          taxPaymentStatus: "Is tax withheld automatically?",
          taxPaymentManual: "Usually not automatically",
          keepAfterTaxesHelp: (cash, tax, kept) => `Amount left in your account = cash ${cash} - amount reserved for taxes ${tax} = ${kept}.`,
          reserveForTaxesHelp: (tax) => `It is prudent to reserve the estimated tax ${tax} separately so annual taxation does not create an unexpected payment.`,
          taxEffectFromOtherAnnualCapitalHelp: (other, reduction, increase) => `Enter the combined effect of your other annual capital gains or capital losses here. Entered change ${other}. A negative value reduces the tax estimate by ${reduction}. A positive value increases the tax estimate by ${increase}. Selling shares that are down can reduce tax, but an immediate buyback should not be done solely for tax reasons without professional advice.`,
          annualAdjustedKeepAfterTaxesHelp: (cash, tax, kept) => `Over the tax year, the amount left in your account = cash ${cash} - tax amount to reserve over the tax year ${tax} = ${kept}.`,
          annualAdjustedReserveForTaxesHelp: (tax) => `After other capital gains or losses are included, the tax amount to reserve over the tax year is ${tax}.`,
          taxPaymentStatusHelp: "According to the Finnish Tax Administration, you usually need to take care of tax on share-sale gains yourself as prepayment or additional prepayment. Dividend withholding is handled separately, but share-sale gain tax is usually not withheld automatically."
        },
        saleResultComparison: {
          title: "Subscription cost and net result",
          cardTitle: "Acquisition cost of sold shares and net result",
          value: (before, after, gain, percent) => `Before reimbursements ${before}, after reimbursements ${after}, net result ${gain} (${percent}).`,
          help: (before, after, kept, gain, percent) => `The acquisition cost of the subscription lots used in the sale is ${before} before reimbursements and ${after} after reimbursements. You can keep ${kept}, so the net result against the sold subscription lots is ${gain} (${percent}).`
        },
        ipoCostEffects: {
          title: "Effect of IPO costs"
        },
        tooltips: {
          actualCosts: (realCostBasis, allocatedIpoCost, total) => `Actual costs = remaining acquisition cost ${realCostBasis} + allocated IPO cost ${allocatedIpoCost} = ${total}.`,
          hmo: (gross, rate, deduction) => `Deemed acquisition cost = total IPO price ${gross} x ${rate} = ${deduction}.`
        }
      },
      totalRow: "Total"
    },
    taxReturns: {
      title: "Tax return summary",
      yearWarningMissingMathValue: "Dividend tax split could not be calculated without the year-specific mathematical value / share.",
      sections: {
        unlisted: "Unlisted company",
        unlistedHelp: "This section shows pre-IPO distributions that, in this calculator, belong under non-listed company reporting. Check that the data appears on your pre-completed tax return. If information is missing or incorrect, correct it in MyTax.",
        listed: "Listed company"
      },
      fields: {
        taxableCapitalIncome: "Taxable capital income",
        taxFreeCapitalIncome: "Tax-free capital income",
        taxableEarnedDividend: "Taxable earned-income dividend",
        taxFreeEarnedDividend: "Tax-free earned-income dividend",
        ipoSaleAllocation: "IPO sale allocation",
        unlistedCapitalRepaymentHelp: "This part is a capital repayment taxed as a transfer, not as dividend. Check that it appears on the pre-completed tax return as capital repayment. If it is missing, report or correct it in MyTax as a securities transfer.",
        unlistedDividendHelp: "This part is reported as dividend from a non-listed company. Check the pre-completed tax return. If it is missing, add a new dividend entry in MyTax and choose non-listed company.",
        listedDividendHelp: "This part is reported as dividend from a listed company. Check the pre-completed tax return. If it is missing, add a new dividend entry in MyTax and choose listed company."
      }
    },
    storage: {
      title: "Storage",
      actions: {
        saveToBrowserStorage: "Save to browser persistently",
        loadFromBrowserStorage: "Load from browser",
        removeFromBrowserStorage: "Remove from browser",
        copyShareUrl: "Copy company details to URL",
        saveFile: "Save file",
        loadFile: "Load file",
        showSmallExample: "Small holder, 2y",
        showMediumExample: "Medium, 8y",
        showLargeExample: "Large, 16y",
        clearExample: "Clear"
      },
      table: {
        rowTitle: "Action",
        descriptionTitle: "Description",
        actionsTitle: "Buttons",
        autoSaveTitle: "Auto-save",
        autoSaveDescription: "The application saves inputs automatically to window-level storage, so refreshing the page keeps the data available. If the browser window is closed, this data is lost.",
        fileTitle: "Save file to computer",
        fileDescription: "You can download the entered data to your computer as a JSON file.",
        browserTitle: "Save file to browser",
        browserDescription: "You can save the data to browser storage. The data becomes automatically available if the page is loaded in a new browser window.",
        clearTitle: "Clear values",
        clearDescription: "You can clear the entered values, but this does not remove data saved to the browser or downloaded files.",
        exampleTitle: "Show example case",
        exampleDescription: "You can inspect how the application looks with example data."
      },
      copyShareUrlHelp: "Use this to share company information and distributions with others.",
      copyShareUrlNote: "Note: Any data passed in URLs might be visible to others.",
      status: {
        saved: "Saved automatically",
        browserSaved: "Saved to persistent browser storage",
        browserLoaded: "Loaded from persistent browser storage",
        browserRemoved: "Persistent browser storage removed",
        shareUrlCopied: "URL copied",
        loaded: "Loaded",
        exampleShown: "Example shown",
        exampleCleared: "Example data cleared",
        fileSaved: "File saved"
      },
      errors: {
        invalidFile: "Invalid file",
        fileReadFailed: "File read failed",
        clipboardFailed: "Copy failed"
      },
      confirmations: {
        clearExample: "Clear all current data?"
      },
      saveIndicators: {
        browserNeedsSave: "Inputs have changed and are not saved to persistent browser storage.",
        browserSaved: "Persistent browser storage is up to date.",
        browserLoadUnavailable: "There is no persistent browser data available to load.",
        fileNeedsSave: "Inputs have changed and are not saved to a file in this window.",
        fileSaved: "File save is up to date in this window."
      }
    },
    messages: {
      errorsTitle: "There are issues in the inputs",
      warningsTitle: "Warnings"
    },
    sources: {
      dividends: "Tax Admin: Dividends from an unlisted company",
      listedDividends: "Tax Admin: Dividends from a listed company",
      demergerAcquisitionCost: "Tax Admin: Taxation of securities transfers - demerger",
      demergers: "Tax Admin: Corporate reorganisations and taxation - demerger",
      reporting: "Tax Admin: Pre-completed tax return - how to report in MyTax or on paper",
      form9a: "Tax Admin: Form 9A instructions",
      sales: "Tax Admin: Sale of shares"
    },
    calculator: {
      validation: {
        negative: (field) => `${field} cannot be negative.`,
        invalidNumber: (field) => `${field} is not a valid number.`,
        invalidDate: (field) => `${field} is not a valid date.`
      },
      fields: {
        subscriptionAmount: (label2) => `Subscription ${label2} amount`,
        subscriptionPricePerShare: (label2) => `Subscription ${label2} price/share`,
        subscriptionOtherTotalAcquisitionCosts: (label2) => `Subscription ${label2} other acquisition costs`,
        subscriptionDate: (id) => `Subscription ${id} date`,
        subscriptionVestingEndsOn: (id) => `Subscription ${id} vesting ends`,
        mathematicalShareValueYear: (id) => `Mathematical value year ${id}`,
        mathematicalShareValuePerShare: (id) => `Mathematical value/share ${id}`,
        ipoDate: "IPO date",
        totalShareCount: "Total share count",
        totalIpoCost: "Total IPO costs",
        currentShareValue: "Current share value",
        estimatedPreIpoValue: "Estimated pre-IPO value",
        estimatedSecondaryShareSellPercentage: "Estimated secondary sell percentage",
        sellAmount: "Number of shares to sell",
        otherAnnualCapitalGainsOrLosses: "Other capital gains or losses",
        cashDistributionDate: (id) => `Distribution ${id} date`,
        cashDistributionAmountPerShare: (id) => `Distribution ${id} EUR/share`,
        shareSplitDate: (id) => `Split ${id} date`,
        shareSplitMultiplier: (id) => `Split ${id} multiplier`,
        demergerDate: (id) => `Demerger ${id} date`,
        demergerOldCompanyRatio: (id) => `Demerger ${id} old-company ratio`
      },
      warnings: {
        totalShareCountBelowSubscriptions: "Total share count is lower than the total amount of entered subscriptions.",
        secondarySellPercentZero: "Secondary sell percentage is 0, so IPO cost/share has been divided across the full share count.",
        noSharesHeldForDistribution: (date) => `No held shares were found for the distribution on ${date}.`,
        sellAmountExceedsEstimatedSecondary: "Sell amount exceeds the estimated secondary sell amount at whole-company level.",
        vestingBlockedWithoutIpoDate: "IPO date is missing, so vesting-restricted subscription lots were excluded from the sale."
      },
      errors: {
        sellAmountExceedsSellable: (shares) => `The number of shares to sell exceeds the shares sellable on the IPO date (${shares}).`
      }
    }
  };
  function getOsakkeetLocalization(language) {
    return language === "en" ? EN : FI;
  }

  // src/osakkeet/osakkeetCalculator.ts
  var zero = new decimal_default(0);
  var OSAKKEET_TAX_RULES_2026 = {
    capitalIncomeTax: {
      threshold: 3e4,
      lowRate: 0.3,
      highRate: 0.34
    },
    capitalRepayment: {
      eligibilityYears: 10
    },
    hankintamenoOlettama: {
      ownershipYearsThreshold: 10,
      shortOwnershipRate: 0.2,
      longOwnershipRate: 0.4
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
      highWithholdingRate: 0.28
    },
    listedDividend: {
      taxableCapitalIncomeRate: 0.85,
      taxFreeCapitalIncomeRate: 0.15,
      withholdingRate: 0.255
    }
  };
  function decimalOrZero(value, field, errors, localization) {
    const normalized = value.trim();
    if (normalized === "") return zero;
    try {
      const parsed = new decimal_default(normalized);
      if (parsed.isNegative()) {
        errors.push(localization.calculator.validation.negative(field));
      }
      return parsed;
    } catch {
      errors.push(localization.calculator.validation.invalidNumber(field));
      return zero;
    }
  }
  function signedDecimalOrZero(value, field, errors, localization) {
    const normalized = value.trim();
    if (normalized === "") return zero;
    try {
      return new decimal_default(normalized);
    } catch {
      errors.push(localization.calculator.validation.invalidNumber(field));
      return zero;
    }
  }
  function dateOrUndefined(value, field, errors, localization) {
    const trimmed = value.trim();
    if (!trimmed) return void 0;
    const date = parseSupportedDate(trimmed);
    if (!date || Number.isNaN(date.getTime())) {
      errors.push(localization.calculator.validation.invalidDate(field));
      return void 0;
    }
    return date;
  }
  function parseSupportedDate(trimmed) {
    const finnishDateMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (finnishDateMatch) {
      const [, day, month, year] = finnishDateMatch;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }
    if (isoDateMatch) {
      return /* @__PURE__ */ new Date(`${trimmed}T00:00:00Z`);
    }
    return void 0;
  }
  function addYears(date, years) {
    const next = new Date(date.getTime());
    next.setUTCFullYear(next.getUTCFullYear() + years);
    return next;
  }
  function isWithinYearsInclusive(start, end, years = 10) {
    if (!start || !end) return false;
    return end.getTime() <= addYears(start, years).getTime();
  }
  function isAtLeastYears(start, end, years = 10) {
    if (!start || !end) return false;
    return end.getTime() >= addYears(start, years).getTime();
  }
  function createLot(input2, errors, localization) {
    const amount2 = decimalOrZero(
      input2.amount,
      localization.calculator.fields.subscriptionAmount(input2.date || input2.id),
      errors,
      localization
    );
    const pricePerShare = decimalOrZero(
      input2.pricePerShare || "",
      localization.calculator.fields.subscriptionPricePerShare(input2.date || input2.id),
      errors,
      localization
    );
    const otherTotalAcquisitionCosts = decimalOrZero(
      input2.otherTotalAcquisitionCosts || "",
      localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(input2.date || input2.id),
      errors,
      localization
    );
    const fallbackTotalPrice = decimalOrZero(
      input2.totalPrice || "",
      localization.calculator.fields.subscriptionOtherTotalAcquisitionCosts(input2.date || input2.id),
      [],
      localization
    );
    const totalPrice = amount2.mul(pricePerShare).add(otherTotalAcquisitionCosts);
    const effectiveTotalPrice = totalPrice.gt(0) || input2.pricePerShare || input2.otherTotalAcquisitionCosts ? totalPrice : fallbackTotalPrice;
    return {
      id: input2.id,
      date: input2.date,
      dateValue: dateOrUndefined(
        input2.date,
        localization.calculator.fields.subscriptionDate(input2.id),
        errors,
        localization
      ),
      vestingEndsOn: input2.vestingEndsOn || "",
      vestingEndsOnValue: dateOrUndefined(
        input2.vestingEndsOn || "",
        localization.calculator.fields.subscriptionVestingEndsOn(input2.id),
        errors,
        localization
      ),
      amount: amount2,
      totalPrice: effectiveTotalPrice,
      remainingCostTotal: effectiveTotalPrice,
      capitalRepaymentTotal: zero,
      cashDistributionGrossTotal: zero,
      capitalRepaymentBreakdown: []
    };
  }
  function compareDateStrings(a2, b2) {
    const dateA = parseSupportedDate(a2.trim());
    const dateB = parseSupportedDate(b2.trim());
    if (dateA && dateB) {
      return dateA.getTime() - dateB.getTime();
    }
    if (dateA) return -1;
    if (dateB) return 1;
    return a2.localeCompare(b2);
  }
  function sumDecimals(values) {
    return values.reduce((acc, value) => acc.add(value), zero);
  }
  function estimateCapitalTax(taxableGain, rules) {
    if (taxableGain.lte(0)) return zero;
    const threshold = new decimal_default(rules.capitalIncomeTax.threshold);
    const lowPart = decimal_default.min(taxableGain, threshold);
    const highPart = decimal_default.max(taxableGain.minus(threshold), zero);
    return lowPart.mul(rules.capitalIncomeTax.lowRate).add(highPart.mul(rules.capitalIncomeTax.highRate));
  }
  function createMathematicalShareValuesByYear(rows, errors, localization) {
    const mathematicalShareValuesByYear = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const year = decimalOrZero(
        row.year,
        localization.calculator.fields.mathematicalShareValueYear(row.id),
        errors,
        localization
      );
      const valuePerShare = decimalOrZero(
        row.valuePerShare,
        localization.calculator.fields.mathematicalShareValuePerShare(row.id),
        errors,
        localization
      );
      if (year.gt(0)) {
        mathematicalShareValuesByYear.set(year.toNumber(), valuePerShare);
      }
    }
    return mathematicalShareValuesByYear;
  }
  function createParsedCashDistributions(rows = [], errors, localization) {
    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      dateValue: dateOrUndefined(row.date, localization.calculator.fields.cashDistributionDate(row.id), errors, localization),
      type: row.type,
      amountPerShare: decimalOrZero(
        row.amountPerShare,
        localization.calculator.fields.cashDistributionAmountPerShare(row.id),
        errors,
        localization
      )
    }));
  }
  function createParsedShareSplits(rows = [], errors, localization) {
    return rows.map((row) => {
      const multiplierField = localization.calculator.fields.shareSplitMultiplier(row.id);
      const normalizedDate = row.date.trim();
      const normalizedMultiplier = row.multiplier.trim();
      if (normalizedDate === "" && normalizedMultiplier === "") {
        return {
          id: row.id,
          date: row.date,
          dateValue: void 0,
          multiplier: zero
        };
      }
      let parsedMultiplier = zero;
      if (normalizedMultiplier === "") {
        errors.push(localization.calculator.validation.invalidNumber(multiplierField));
      } else {
        try {
          parsedMultiplier = new decimal_default(normalizedMultiplier);
          if (parsedMultiplier.lte(0)) {
            errors.push(localization.calculator.validation.invalidNumber(multiplierField));
          }
        } catch {
          errors.push(localization.calculator.validation.invalidNumber(multiplierField));
        }
      }
      return {
        id: row.id,
        date: row.date,
        dateValue: dateOrUndefined(row.date, localization.calculator.fields.shareSplitDate(row.id), errors, localization),
        multiplier: parsedMultiplier
      };
    });
  }
  function createParsedDemergers(rows = [], errors, localization) {
    return rows.map((row) => {
      const ratioField = localization.calculator.fields.demergerOldCompanyRatio(row.id);
      const normalizedDate = row.date.trim();
      const normalizedRatio = row.oldCompanyRatio.trim();
      if (normalizedDate === "" && normalizedRatio === "") {
        return {
          id: row.id,
          date: row.date,
          dateValue: void 0,
          oldCompanyRatio: zero
        };
      }
      let oldCompanyRatio = zero;
      if (normalizedRatio === "") {
        errors.push(localization.calculator.validation.invalidNumber(ratioField));
      } else {
        try {
          oldCompanyRatio = new decimal_default(normalizedRatio);
          if (oldCompanyRatio.lte(0) || oldCompanyRatio.gt(1)) {
            errors.push(localization.calculator.validation.invalidNumber(ratioField));
          }
        } catch {
          errors.push(localization.calculator.validation.invalidNumber(ratioField));
        }
      }
      return {
        id: row.id,
        date: row.date,
        dateValue: dateOrUndefined(row.date, localization.calculator.fields.demergerDate(row.id), errors, localization),
        oldCompanyRatio
      };
    });
  }
  function cloneLots(lots) {
    return lots.map((lot) => ({
      ...lot,
      capitalRepaymentBreakdown: lot.capitalRepaymentBreakdown.map((entry) => ({ ...entry }))
    }));
  }
  function applyShareSplit(lots, entry) {
    if (!entry.dateValue || entry.multiplier.lte(0)) return;
    for (const lot of lots) {
      if (lot.dateValue && lot.dateValue.getTime() > entry.dateValue.getTime()) continue;
      lot.amount = lot.amount.mul(entry.multiplier);
    }
  }
  function applyShareSplitsToLots(lots, shareSplits, upToDate) {
    for (const entry of shareSplits.filter((shareSplit) => {
      if (!upToDate) return true;
      return !!shareSplit.dateValue && shareSplit.dateValue.getTime() <= upToDate.getTime();
    }).sort((a2, b2) => compareDateStrings(a2.date, b2.date))) {
      applyShareSplit(lots, entry);
    }
  }
  function applyDemerger(lots, entry) {
    if (!entry.dateValue || entry.oldCompanyRatio.lte(0) || entry.oldCompanyRatio.gt(1)) return;
    for (const lot of lots) {
      if (lot.dateValue && lot.dateValue.getTime() > entry.dateValue.getTime()) continue;
      lot.totalPrice = lot.totalPrice.mul(entry.oldCompanyRatio);
      lot.remainingCostTotal = lot.remainingCostTotal.mul(entry.oldCompanyRatio);
    }
  }
  function parseIpoAndSellInputs(form2, ipoDate, totalSubscribedShares, totalSubscribedCost, errors, warnings, localization) {
    const totalShareCountInput = decimalOrZero(
      form2.ipo.totalShareCount,
      localization.calculator.fields.totalShareCount,
      errors,
      localization
    );
    const totalShareCount = totalShareCountInput.gt(0) ? totalShareCountInput : totalSubscribedShares;
    const totalIpoCost = decimalOrZero(
      form2.ipo.totalIpoCost,
      localization.calculator.fields.totalIpoCost,
      errors,
      localization
    );
    const currentShareValue = decimalOrZero(
      form2.ipo.currentShareValue,
      localization.calculator.fields.currentShareValue,
      errors,
      localization
    );
    const currentTotalValue = currentShareValue.mul(totalShareCount);
    const estimatedPreIpoValue = decimalOrZero(
      form2.ipo.estimatedPreIpoValue,
      localization.calculator.fields.estimatedPreIpoValue,
      errors,
      localization
    );
    const estimatedSecondaryShareSellPercentage = decimalOrZero(
      form2.ipo.estimatedSecondaryShareSellPercentage,
      localization.calculator.fields.estimatedSecondaryShareSellPercentage,
      errors,
      localization
    );
    const sellAmount = decimalOrZero(form2.sell.amount, localization.calculator.fields.sellAmount, errors, localization);
    const otherAnnualCapitalGainsOrLosses = signedDecimalOrZero(
      form2.sell.otherAnnualCapitalGainsOrLosses || "",
      localization.calculator.fields.otherAnnualCapitalGainsOrLosses,
      errors,
      localization
    );
    if (totalShareCountInput.gt(0) && totalShareCountInput.lt(totalSubscribedShares)) {
      warnings.push(localization.calculator.warnings.totalShareCountBelowSubscriptions);
    }
    const estimatedSecondaryShareCount = totalShareCount.mul(estimatedSecondaryShareSellPercentage).div(100);
    const ipoPricePerShare = totalShareCount.gt(0) ? estimatedPreIpoValue.div(totalShareCount) : zero;
    const currentValuePerShare = totalShareCount.gt(0) ? currentTotalValue.div(totalShareCount) : zero;
    const increaseMultiplier = currentValuePerShare.gt(0) ? ipoPricePerShare.div(currentValuePerShare) : zero;
    const increasePercentage = currentValuePerShare.gt(0) ? ipoPricePerShare.div(currentValuePerShare).minus(1).mul(100) : zero;
    const ipoCostPerShare = estimatedSecondaryShareCount.gt(0) ? totalIpoCost.div(estimatedSecondaryShareCount) : totalShareCount.gt(0) ? totalIpoCost.div(totalShareCount) : zero;
    if (estimatedSecondaryShareCount.eq(0) && totalIpoCost.gt(0)) {
      warnings.push(localization.calculator.warnings.secondarySellPercentZero);
    }
    return {
      ipoDate,
      sellAmount,
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
        ipoCostPerShare
      }
    };
  }
  function calculateVestingSummary(lots, ipoDate) {
    const ipoEligibleLots = lots.filter(
      (lot) => !lot.dateValue || !ipoDate || lot.dateValue.getTime() <= ipoDate.getTime()
    );
    const sellableLots = ipoEligibleLots.filter(
      (lot) => !lot.vestingEndsOnValue || !!(ipoDate && ipoDate.getTime() >= lot.vestingEndsOnValue.getTime())
    );
    const lockedLots = ipoEligibleLots.filter(
      (lot) => !!lot.vestingEndsOnValue && (!ipoDate || ipoDate.getTime() < lot.vestingEndsOnValue.getTime())
    );
    return {
      sellableLots,
      lockedLots,
      totalShares: sumDecimals(ipoEligibleLots.map((lot) => lot.amount)),
      vestedShares: sumDecimals(sellableLots.map((lot) => lot.amount)),
      unvestedShares: sumDecimals(lockedLots.map((lot) => lot.amount))
    };
  }
  function applyCashDistributions(lots, cashDistributions, shareSplits, demergers, ipoDate, mathematicalShareValuesByYear, rules, warnings, localization, options = {}) {
    const capitalDividendUsedByYear = /* @__PURE__ */ new Map();
    const grossDividendUsedByYear = /* @__PURE__ */ new Map();
    const events2 = [
      ...shareSplits.filter((entry) => {
        if (!options.stopAtIpoDate || !ipoDate) return true;
        return !!entry.dateValue && entry.dateValue.getTime() <= ipoDate.getTime();
      }).map((entry) => ({ kind: "split", date: entry.date, entry })),
      ...demergers.filter((entry) => {
        if (!options.stopAtIpoDate || !ipoDate) return true;
        return !!entry.dateValue && entry.dateValue.getTime() <= ipoDate.getTime();
      }).map((entry) => ({ kind: "demerger", date: entry.date, entry })),
      ...cashDistributions.filter((entry) => {
        if (!options.stopAtIpoDate || !ipoDate) return true;
        return !!entry.dateValue && entry.dateValue.getTime() < ipoDate.getTime();
      }).map((entry) => ({ kind: "distribution", date: entry.date, entry }))
    ].sort((a2, b2) => {
      const dateComparison = compareDateStrings(a2.date, b2.date);
      if (dateComparison !== 0) return dateComparison;
      if (a2.kind === b2.kind) return 0;
      if (a2.kind === "distribution") return 1;
      if (b2.kind === "distribution") return -1;
      return 0;
    });
    const summaries = [];
    for (const event of events2) {
      if (event.kind === "split") {
        applyShareSplit(lots, event.entry);
        continue;
      }
      if (event.kind === "demerger") {
        applyDemerger(lots, event.entry);
        continue;
      }
      const entry = event.entry;
      const cashDistributionDate = entry.dateValue;
      const amountPerShare = entry.amountPerShare;
      const eligibleLots = lots.filter(
        (lot) => !lot.dateValue || !cashDistributionDate || lot.dateValue.getTime() <= cashDistributionDate.getTime()
      );
      const sharesHeld = sumDecimals(eligibleLots.map((lot) => lot.amount));
      const expectedTotal = amountPerShare.mul(sharesHeld);
      const grossTotal = expectedTotal;
      const effectivePerShare = sharesHeld.gt(0) ? grossTotal.div(sharesHeld) : zero;
      const isAfterIpoDate = !!(ipoDate && cashDistributionDate && cashDistributionDate.getTime() >= ipoDate.getTime());
      const effectiveType = isAfterIpoDate ? "dividend" : entry.type;
      const isDividend = effectiveType === "dividend";
      if (sharesHeld.eq(0) && grossTotal.gt(0)) {
        warnings.push(localization.calculator.warnings.noSharesHeldForDistribution(entry.date));
      }
      const allocations = eligibleLots.map((lot) => {
        const gross = effectivePerShare.mul(lot.amount);
        const eligibleCapitalRepayment = !isDividend && isWithinYearsInclusive(lot.dateValue, cashDistributionDate, rules.capitalRepayment.eligibilityYears) && lot.remainingCostTotal.gt(0);
        const remainingCostPerShare = lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero;
        const capitalRepaymentPerShare = eligibleCapitalRepayment ? decimal_default.min(effectivePerShare, remainingCostPerShare) : zero;
        const capitalRepayment = capitalRepaymentPerShare.mul(lot.amount);
        const dividend = decimal_default.max(gross.minus(capitalRepayment), zero);
        lot.remainingCostTotal = decimal_default.max(lot.remainingCostTotal.minus(capitalRepayment), zero);
        lot.capitalRepaymentTotal = lot.capitalRepaymentTotal.add(capitalRepayment);
        lot.cashDistributionGrossTotal = lot.cashDistributionGrossTotal.add(gross);
        if (capitalRepayment.gt(0)) {
          lot.capitalRepaymentBreakdown.push({
            distributionDate: entry.date,
            shares: lot.amount,
            capitalRepaymentPerShare,
            capitalRepaymentTotal: capitalRepayment
          });
        }
        return {
          subscriptionId: lot.id,
          subscriptionDate: lot.date,
          shares: lot.amount,
          gross,
          capitalRepayment,
          dividend,
          remainingCostPerShareAfter: lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero,
          eligibleCapitalRepayment
        };
      });
      const capitalRepaymentTotal = sumDecimals(allocations.map((allocation) => allocation.capitalRepayment));
      const dividendTotal = sumDecimals(allocations.map((allocation) => allocation.dividend));
      const year = cashDistributionDate == null ? void 0 : cashDistributionDate.getUTCFullYear();
      const mathematicalShareValuePerShare = year ? mathematicalShareValuesByYear.get(year) || zero : zero;
      const shareholderMathematicalValue = mathematicalShareValuePerShare.mul(sharesHeld);
      const eightPercentYieldLimit = shareholderMathematicalValue.mul(rules.unlistedDividend.mathematicalValueYieldRate);
      const capitalDividendGross = shareholderMathematicalValue.gt(0) ? decimal_default.min(dividendTotal, eightPercentYieldLimit) : zero;
      const earnedDividendGross = shareholderMathematicalValue.gt(0) ? decimal_default.max(dividendTotal.minus(capitalDividendGross), zero) : zero;
      const usedCapitalDividend = year ? capitalDividendUsedByYear.get(year) || zero : zero;
      const lowerCapitalDividendRoom = decimal_default.max(
        new decimal_default(rules.unlistedDividend.annualCapitalDividendThreshold).minus(usedCapitalDividend),
        zero
      );
      const lowCapitalPart = decimal_default.min(capitalDividendGross, lowerCapitalDividendRoom);
      const highCapitalPart = decimal_default.max(capitalDividendGross.minus(lowCapitalPart), zero);
      const taxableCapitalIncome = isAfterIpoDate ? dividendTotal.mul(rules.listedDividend.taxableCapitalIncomeRate) : lowCapitalPart.mul(rules.unlistedDividend.lowCapitalDividendTaxableRate).add(highCapitalPart.mul(rules.unlistedDividend.highCapitalDividendTaxableRate));
      const taxFreeCapitalIncomePortion = isAfterIpoDate ? dividendTotal.mul(rules.listedDividend.taxFreeCapitalIncomeRate) : lowCapitalPart.mul(rules.unlistedDividend.lowCapitalDividendTaxFreeRate).add(highCapitalPart.mul(rules.unlistedDividend.highCapitalDividendTaxFreeRate));
      const taxableEarnedDividend = isAfterIpoDate ? zero : earnedDividendGross.mul(rules.unlistedDividend.earnedDividendTaxableRate);
      const taxFreeEarnedDividend = isAfterIpoDate ? zero : earnedDividendGross.mul(rules.unlistedDividend.earnedDividendTaxFreeRate);
      const usedGrossDividend = year ? grossDividendUsedByYear.get(year) || zero : zero;
      const lowerGrossDividendRoom = decimal_default.max(
        new decimal_default(rules.unlistedDividend.withholdingThreshold).minus(usedGrossDividend),
        zero
      );
      const lowWithholdingPart = decimal_default.min(dividendTotal, lowerGrossDividendRoom);
      const highWithholdingPart = decimal_default.max(dividendTotal.minus(lowWithholdingPart), zero);
      const withholdingToTaxOffice = isAfterIpoDate ? dividendTotal.mul(rules.listedDividend.withholdingRate) : lowWithholdingPart.mul(rules.unlistedDividend.lowWithholdingRate).add(highWithholdingPart.mul(rules.unlistedDividend.highWithholdingRate));
      const paidInCash = grossTotal.minus(withholdingToTaxOffice);
      if (year && !isAfterIpoDate) {
        capitalDividendUsedByYear.set(year, usedCapitalDividend.add(capitalDividendGross));
        grossDividendUsedByYear.set(year, usedGrossDividend.add(dividendTotal));
      }
      summaries.push(
        {
          id: entry.id,
          date: entry.date,
          type: effectiveType,
          amountPerShare,
          sharesHeld,
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
          allocations
        }
      );
    }
    return summaries;
  }
  function calculateSellSummary(sellableLots, sellAmount, otherAnnualCapitalGainsOrLosses, vestingSummary, ipoSummary, rules, errors, warnings, localization) {
    if (sellAmount.gt(0) && !ipoSummary.ipoDate && vestingSummary.lockedLots.length > 0) {
      warnings.push(localization.calculator.warnings.vestingBlockedWithoutIpoDate);
    }
    if (sellAmount.gt(vestingSummary.vestedShares)) {
      errors.push(localization.calculator.errors.sellAmountExceedsSellable(vestingSummary.vestedShares.toString()));
    }
    if (ipoSummary.estimatedSecondaryShareCount.gt(0) && sellAmount.gt(ipoSummary.estimatedSecondaryShareCount)) {
      warnings.push(localization.calculator.warnings.sellAmountExceedsEstimatedSecondary);
    }
    let remainingSellAmount = sellAmount;
    const usedSubscriptions = [];
    for (const lot of sellableLots) {
      if (remainingSellAmount.lte(0)) break;
      const soldAmount = decimal_default.min(lot.amount, remainingSellAmount);
      if (soldAmount.lte(0)) continue;
      const gross = soldAmount.mul(ipoSummary.ipoPricePerShare);
      const originalCostBasis = lot.amount.gt(0) ? lot.totalPrice.mul(soldAmount).div(lot.amount) : zero;
      const realCostBasis = lot.amount.gt(0) ? lot.remainingCostTotal.mul(soldAmount).div(lot.amount) : zero;
      const allocatedIpoCost = soldAmount.mul(ipoSummary.ipoCostPerShare);
      const actualDeduction = realCostBasis.add(allocatedIpoCost);
      const hankintamenoOlettaRate = isAtLeastYears(
        lot.dateValue,
        ipoSummary.ipoDate,
        rules.hankintamenoOlettama.ownershipYearsThreshold
      ) ? new decimal_default(rules.hankintamenoOlettama.longOwnershipRate) : new decimal_default(rules.hankintamenoOlettama.shortOwnershipRate);
      const hankintamenoOlettaDeduction = gross.mul(hankintamenoOlettaRate);
      const useActualCosts = actualDeduction.gte(hankintamenoOlettaDeduction);
      const selectedDeduction = useActualCosts ? actualDeduction : hankintamenoOlettaDeduction;
      const taxableGain = gross.minus(selectedDeduction);
      usedSubscriptions.push({
        subscriptionId: lot.id,
        subscriptionDate: lot.date,
        totalSubscriptionShares: lot.amount,
        soldAmount,
        gross,
        originalCostBasis,
        realCostBasis,
        allocatedIpoCost,
        actualDeduction,
        hankintamenoOlettaRate,
        hankintamenoOlettaDeduction,
        selectedMethod: useActualCosts ? "actual_costs" : "hmo",
        selectedDeduction,
        taxableGain,
        taxFreeGainPart: zero,
        taxedGainPart: decimal_default.max(taxableGain, zero)
      });
      remainingSellAmount = remainingSellAmount.minus(soldAmount);
    }
    const taxableGainTotal = sumDecimals(usedSubscriptions.map((lot) => lot.taxableGain));
    const capitalIncomeThreshold = new decimal_default(rules.capitalIncomeTax.threshold);
    const taxableGainAtLowRate = decimal_default.max(decimal_default.min(taxableGainTotal, capitalIncomeThreshold), zero);
    const taxableGainAtHighRate = decimal_default.max(taxableGainTotal.minus(capitalIncomeThreshold), zero);
    const estimatedTax = estimateCapitalTax(taxableGainTotal, rules);
    const annualNetCapitalGain = decimal_default.max(taxableGainTotal.add(otherAnnualCapitalGainsOrLosses), zero);
    const annualEstimatedTax = estimateCapitalTax(annualNetCapitalGain, rules);
    const annualTaxableGainAtLowRate = decimal_default.max(decimal_default.min(annualNetCapitalGain, capitalIncomeThreshold), zero);
    const annualTaxableGainAtHighRate = decimal_default.max(annualNetCapitalGain.minus(capitalIncomeThreshold), zero);
    const annualTaxChange = annualEstimatedTax.minus(estimatedTax);
    const taxReductionFromOtherLosses = decimal_default.max(estimatedTax.minus(annualEstimatedTax), zero);
    const grossTotal = sumDecimals(usedSubscriptions.map((lot) => lot.gross));
    const selectedActualDeductionTotal = sumDecimals(
      usedSubscriptions.filter((lot) => lot.selectedMethod === "actual_costs").map((lot) => lot.actualDeduction)
    );
    const shortOwnershipRate = new decimal_default(rules.hankintamenoOlettama.shortOwnershipRate);
    const longOwnershipRate = new decimal_default(rules.hankintamenoOlettama.longOwnershipRate);
    const selectedHmo20DeductionTotal = sumDecimals(
      usedSubscriptions.filter((lot) => lot.selectedMethod === "hmo" && lot.hankintamenoOlettaRate.eq(shortOwnershipRate)).map((lot) => lot.hankintamenoOlettaDeduction)
    );
    const selectedHmo40DeductionTotal = sumDecimals(
      usedSubscriptions.filter((lot) => lot.selectedMethod === "hmo" && lot.hankintamenoOlettaRate.eq(longOwnershipRate)).map((lot) => lot.hankintamenoOlettaDeduction)
    );
    const selectedDeductionTotal = sumDecimals(usedSubscriptions.map((lot) => lot.selectedDeduction));
    const soldSharesTotal = sumDecimals(usedSubscriptions.map((lot) => lot.soldAmount));
    const totalIpoCostAllocated = sumDecimals(usedSubscriptions.map((lot) => lot.allocatedIpoCost));
    const cashAfterIpoCosts = grossTotal.minus(totalIpoCostAllocated);
    const taxFreeAcquisitionRecoveryAfterIpoCosts = decimal_default.max(selectedDeductionTotal.minus(totalIpoCostAllocated), zero);
    const soldShareOriginalCostTotal = sumDecimals(usedSubscriptions.map((lot) => lot.originalCostBasis));
    const soldShareAcquisitionCostTotal = sumDecimals(usedSubscriptions.map((lot) => lot.realCostBasis));
    const ipoCostDeductedViaActual = sumDecimals(
      usedSubscriptions.filter((lot) => lot.selectedMethod === "actual_costs").map((lot) => lot.allocatedIpoCost)
    );
    const ipoCostPaidWithoutActualDeduction = sumDecimals(
      usedSubscriptions.filter((lot) => lot.selectedMethod === "hmo").map((lot) => lot.allocatedIpoCost)
    );
    const taxSavedFromDeductibleIpoCosts = estimateCapitalTax(
      taxableGainTotal.add(ipoCostDeductedViaActual),
      rules
    ).minus(estimatedTax);
    const netAfterTaxAndIpoCost = grossTotal.minus(totalIpoCostAllocated).minus(estimatedTax);
    const netAfterAnnualTaxAndIpoCost = grossTotal.minus(totalIpoCostAllocated).minus(annualEstimatedTax);
    return {
      amount: sellAmount,
      otherAnnualCapitalGainsOrLosses,
      usedSubscriptions,
      grossTotal,
      cashAfterIpoCosts,
      taxFreeAcquisitionRecoveryAfterIpoCosts,
      soldShareOriginalCostTotal,
      soldShareAcquisitionCostTotal,
      selectedActualDeductionTotal,
      selectedHmo20DeductionTotal,
      selectedHmo40DeductionTotal,
      selectedDeductionTotal,
      totalIpoCostAllocated,
      ipoCostDeductedViaActual,
      ipoCostPaidWithoutActualDeduction,
      taxSavedFromDeductibleIpoCosts,
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
      netAfterTaxAndIpoCost,
      netAfterAnnualTaxAndIpoCost,
      remainingUnsoldShares: decimal_default.max(ipoSummary.totalSubscribedShares.minus(soldSharesTotal), zero)
    };
  }
  function buildSubscriptionSummaries(lots) {
    return lots.map((lot) => ({
      id: lot.id,
      date: lot.date,
      amount: lot.amount,
      totalPrice: lot.totalPrice,
      totalPricePerShare: lot.amount.gt(0) ? lot.totalPrice.div(lot.amount) : zero,
      cashDistributionGrossTotal: lot.cashDistributionGrossTotal,
      capitalRepaymentTotal: lot.capitalRepaymentTotal,
      capitalRepaymentBreakdown: lot.capitalRepaymentBreakdown,
      capitalRepaymentPerShare: lot.amount.gt(0) ? lot.capitalRepaymentTotal.div(lot.amount) : zero,
      remainingCostPerShare: lot.amount.gt(0) ? lot.remainingCostTotal.div(lot.amount) : zero,
      remainingCostTotal: lot.remainingCostTotal
    }));
  }
  function calculateOsakkeet(form2, localization = FI, rules = OSAKKEET_TAX_RULES_2026) {
    const errors = [];
    const warnings = [];
    const baseLots = [...form2.subscriptions].sort((a2, b2) => compareDateStrings(a2.date, b2.date)).map((subscription) => createLot(subscription, errors, localization));
    const totalSubscribedCost = sumDecimals(baseLots.map((lot) => lot.totalPrice));
    const ipoDate = dateOrUndefined(form2.ipo.ipoDate, localization.calculator.fields.ipoDate, errors, localization);
    const mathematicalShareValuesByYear = createMathematicalShareValuesByYear(
      form2.mathematicalShareValues,
      errors,
      localization
    );
    const parsedCashDistributions = createParsedCashDistributions(form2.cashDistributions, errors, localization);
    const parsedShareSplits = createParsedShareSplits(form2.shareSplits, errors, localization);
    const parsedDemergers = createParsedDemergers(form2.demergers, errors, localization);
    const splitAdjustedLots = cloneLots(baseLots);
    applyShareSplitsToLots(splitAdjustedLots, parsedShareSplits, ipoDate);
    const totalSubscribedShares = sumDecimals(splitAdjustedLots.map((lot) => lot.amount));
    const { sellAmount, otherAnnualCapitalGainsOrLosses, ipo } = parseIpoAndSellInputs(
      form2,
      ipoDate,
      totalSubscribedShares,
      totalSubscribedCost,
      errors,
      warnings,
      localization
    );
    const ipoTimelineLots = cloneLots(baseLots);
    applyCashDistributions(
      ipoTimelineLots,
      parsedCashDistributions,
      parsedShareSplits,
      parsedDemergers,
      ipoDate,
      mathematicalShareValuesByYear,
      rules,
      warnings,
      localization,
      { stopAtIpoDate: true }
    );
    const vesting = calculateVestingSummary(ipoTimelineLots, ipoDate);
    const lots = cloneLots(baseLots);
    const cashDistributions = applyCashDistributions(
      lots,
      parsedCashDistributions,
      parsedShareSplits,
      parsedDemergers,
      ipoDate,
      mathematicalShareValuesByYear,
      rules,
      warnings,
      localization
    );
    const sell = calculateSellSummary(
      vesting.sellableLots,
      sellAmount,
      otherAnnualCapitalGainsOrLosses,
      vesting,
      ipo,
      rules,
      errors,
      warnings,
      localization
    );
    return {
      formData: form2,
      warnings,
      errors,
      subscriptions: buildSubscriptionSummaries(lots),
      cashDistributions,
      vesting,
      ipo,
      sell
    };
  }

  // src/osakkeet/ki-frame-extensions.ts
  function isCheckboxInput(node) {
    return node.nodeName === "INPUT" && "type" in node && node.type === "checkbox";
  }
  function readDefaultNodeValue(node) {
    if (isCheckboxInput(node)) {
      return node.checked;
    }
    return node.value;
  }
  function writeDefaultNodeValue(node, value) {
    if (isCheckboxInput(node)) {
      node.checked = Boolean(value);
      return;
    }
    node.value = value == null ? "" : String(value);
  }
  function isBasicTextValue(value) {
    return value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "bigint";
  }
  function formatBasicTextValue(value) {
    return value == null ? "" : String(value);
  }
  function isTextNode(value) {
    return !!value && typeof value === "object" && "nodeType" in value && value.nodeType === 3;
  }
  function toRuntimePath(path) {
    return path;
  }
  function getStateValueAtPath(stateValue, path) {
    return getByPath(stateValue, toRuntimePath(path));
  }
  function getStateValueAtOptionalPath(stateValue, path) {
    if (!path) {
      return stateValue;
    }
    return getStateValueAtPath(stateValue, path);
  }
  function setStateValueAtPath(state, path, value) {
    state.set((current) => copyAndSet(current, toRuntimePath(path), value));
  }
  function withDestroy(value, destroy) {
    return Object.assign(value, { destroy });
  }
  function createTextNodesTree(value, noInit) {
    if (typeof value === "function") return void 0;
    if (isBasicTextValue(value)) {
      return text(noInit ? "" : formatBasicTextValue(value));
    }
    if (Array.isArray(value)) {
      return value.map((item) => createTextNodesTree(item, noInit)).filter((item) => item !== void 0);
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value).map(([key, nestedValue]) => [key, createTextNodesTree(nestedValue, noInit)]).filter((entry) => entry[1] !== void 0);
      return Object.fromEntries(entries);
    }
    return void 0;
  }
  function syncTextNodesTree(nodes, value) {
    if (isTextNode(nodes)) {
      const nextValue = isBasicTextValue(value) ? formatBasicTextValue(value) : "";
      if (nodes.textContent !== nextValue) {
        nodes.textContent = nextValue;
      }
      return;
    }
    if (Array.isArray(nodes)) {
      const values = Array.isArray(value) ? value : [];
      nodes.forEach((childNode, index) => {
        syncTextNodesTree(childNode, values[index]);
      });
      return;
    }
    if (nodes && typeof nodes === "object") {
      const values = value && typeof value === "object" ? value : {};
      Object.entries(nodes).forEach(([key, childNode]) => {
        syncTextNodesTree(childNode, values[key]);
      });
    }
  }
  function createTextNodesFromState(state, options = {}) {
    const initialValue = getStateValueAtOptionalPath(state.get(), options.path);
    const nodes = createTextNodesTree(initialValue, options.noInit === true);
    if (nodes === void 0) {
      throw new Error(
        Array.isArray(options.path) ? `createTextNodesFromState path "${String(options.path)}" does not resolve to supported text values` : "createTextNodesFromState state does not resolve to supported text values"
      );
    }
    const unsub = state.onValueChange(
      (nextState) => {
        const nextValue = getStateValueAtOptionalPath(nextState, options.path);
        syncTextNodesTree(nodes, nextValue);
      },
      { noInit: true }
    );
    return withDestroy(nodes, unsub);
  }
  function mapStatePathToInput(state, path, node, options = {}) {
    const eventType = options.event || "input";
    const read = options.read || ((currentNode) => readDefaultNodeValue(currentNode));
    const write = options.write || ((currentNode, value) => writeDefaultNodeValue(currentNode, value));
    const writeStateToNode = (stateValue) => {
      write(node, getStateValueAtPath(stateValue, path));
    };
    writeStateToNode(state.get());
    const controller = createController({ name: "bind-input" });
    controller.addDomEvent(`bind:${String(path)}`, node, eventType, (ev) => {
      const nextValue = read(node);
      if (options.validate && !options.validate(nextValue, node, ev)) return;
      setStateValueAtPath(state, path, nextValue);
    });
    const unsub = state.onValueChange(
      (nextState) => {
        writeStateToNode(nextState);
      },
      { noInit: true }
    );
    controller.onDestroy(unsub);
    return controller;
  }
  function mapStateToDomChildren(state, root, optionsOrRender) {
    const options = typeof optionsOrRender === "function" ? { render: optionsOrRender } : optionsOrRender;
    const rows = /* @__PURE__ */ new Map();
    const itemsSelector = options.items || ((value) => value);
    const keySelector = options.key || ((item) => item.id);
    const destroyRow = (row) => {
      var _a2;
      (_a2 = row.destroy) == null ? void 0 : _a2.call(row);
      if (row.node.parentNode === root) {
        root.removeChild(row.node);
      }
    };
    const sync = (stateValue) => {
      const items = itemsSelector(stateValue);
      const nextKeys = /* @__PURE__ */ new Set();
      items.forEach((item, index) => {
        var _a2;
        const key = keySelector(item, index, stateValue);
        nextKeys.add(key);
        let row = rows.get(key);
        if (!row) {
          const createdRow = options.render(item, index, stateValue);
          rows.set(key, createdRow);
          row = createdRow;
        }
        (_a2 = row.set) == null ? void 0 : _a2.call(row, item, index, stateValue);
        const existingNode = root.childNodes[index] || null;
        if (existingNode !== row.node) {
          root.insertBefore(row.node, existingNode);
        }
      });
      for (const [key, row] of Array.from(rows.entries())) {
        if (nextKeys.has(key)) continue;
        destroyRow(row);
        rows.delete(key);
      }
    };
    if (!options.noInit) {
      sync(state.get());
    }
    const unsub = state.onValueChange(sync, { noInit: true });
    const destroy = () => {
      unsub();
      for (const row of rows.values()) {
        destroyRow(row);
      }
      rows.clear();
    };
    return withDestroy({}, destroy);
  }
  function normalizeArray(value) {
    return Array.isArray(value) ? [...value] : [];
  }
  function clampIndex(index, length) {
    if (index < 0) return 0;
    if (index > length) return length;
    return index;
  }
  function createStateCollectionEditor(state, path, optionsOrKey = {}) {
    const options = typeof optionsOrKey === "function" ? { key: optionsOrKey } : optionsOrKey;
    const key = options.key || ((item, index, stateValue) => {
      void item;
      void index;
      void stateValue;
      return `row-${Math.random().toString(36).slice(2, 10)}`;
    });
    const normalize = options.normalize || ((item, index, stateValue) => ({ ...item, id: item.id || key(item, index, stateValue) }));
    const readItems = () => normalizeArray(getStateValueAtPath(state.get(), path));
    const writeItems = (items) => {
      setStateValueAtPath(state, path, items);
    };
    return {
      get() {
        return readItems();
      },
      set(items) {
        writeItems([...items]);
      },
      append(item) {
        const currentState = state.get();
        const items = readItems();
        const nextItem = normalize(item, items.length, currentState);
        writeItems([...items, nextItem]);
        return nextItem;
      },
      insert(index, item) {
        const currentState = state.get();
        const items = readItems();
        const nextItems = [...items];
        const insertAt = clampIndex(index, nextItems.length);
        const nextItem = normalize(item, insertAt, currentState);
        nextItems.splice(insertAt, 0, nextItem);
        writeItems(nextItems);
        return nextItem;
      },
      patch(id, patch) {
        writeItems(readItems().map((item) => item.id === id ? { ...item, ...patch } : item));
      },
      replace(id, item) {
        writeItems(readItems().map((currentItem) => currentItem.id === id ? item : currentItem));
      },
      remove(id) {
        writeItems(readItems().filter((item) => item.id !== id));
      },
      move(id, toIndex) {
        const items = readItems();
        const fromIndex = items.findIndex((item) => item.id === id);
        if (fromIndex === -1) return;
        const nextItems = [...items];
        const [movedItem] = nextItems.splice(fromIndex, 1);
        nextItems.splice(clampIndex(toIndex, nextItems.length), 0, movedItem);
        writeItems(nextItems);
      },
      clear() {
        writeItems([]);
      }
    };
  }
  function safeStorageGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }
  function runStorage(run, onError, fallback) {
    try {
      return run();
    } catch (error) {
      onError == null ? void 0 : onError(error);
      return fallback;
    }
  }
  function safeStorageSet(storage, key, value) {
    storage.setItem(key, value);
  }
  function safeStorageRemove(storage, key) {
    storage.removeItem(key);
  }
  function persistState(state, options) {
    const serialize = options.serialize || ((value) => JSON.stringify(value));
    const deserialize = options.deserialize || ((raw) => JSON.parse(raw));
    const hydrate = options.hydrate !== false;
    const saveOnChange = options.saveOnChange !== false;
    const saveInitial = options.saveInitial === true;
    const load = () => {
      var _a2;
      const raw = safeStorageGet(options.storage, options.key);
      if (raw == null) return void 0;
      try {
        const loaded = deserialize(raw);
        state.set(loaded);
        return loaded;
      } catch (error) {
        (_a2 = options.onError) == null ? void 0 : _a2.call(options, error);
        return void 0;
      }
    };
    const save = (nextValue = state.get()) => {
      runStorage(() => safeStorageSet(options.storage, options.key, serialize(nextValue)), options.onError);
    };
    const remove = () => {
      runStorage(() => safeStorageRemove(options.storage, options.key), options.onError);
    };
    if (hydrate) {
      load();
    }
    const unsub = saveOnChange ? state.onValueChange(
      (nextValue) => {
        save(nextValue);
      },
      { noInit: !saveInitial }
    ) : () => {
    };
    return withDestroy(
      {
        load,
        save,
        remove
      },
      unsub
    );
  }

  // src/osakkeet/osakkeetUi.ts
  var pageStyles = {
    stack: styles({ display: "flex", flexDirection: "column", gap: "22px" }),
    denseStack: styles({ display: "flex", flexDirection: "column", gap: "10px" }),
    gridTwo: styles({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }),
    field: styles({ display: "flex", flexDirection: "column", gap: "6px" }),
    compactField: styles({ width: "140px" }),
    compactTable: styles({ width: "auto", maxWidth: "fit-content", tableLayout: "auto" }),
    rowButtons: styles({ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }),
    topAlignedRowButtons: styles({ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-start" }),
    splitActions: styles({
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: "space-between"
    }),
    rightAlignedActions: styles({
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      alignItems: "flex-start",
      marginLeft: "auto"
    }),
    actionGroup: styles({ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }),
    compactParagraph: styles({ margin: "0" }),
    storageTable: styles({ width: "100%", borderCollapse: "collapse" }),
    storageCellTop: styles({ verticalAlign: "top", padding: "10px 12px", borderTop: "1px solid rgba(15, 23, 42, 0.08)" }),
    storageLabelCell: styles({ width: "220px", fontWeight: "600" }),
    storageDescriptionCell: styles({ minWidth: "280px" }),
    storageActionsCell: styles({ width: "320px" }),
    summaryGrid: styles({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }),
    summaryItem: styles({
      backgroundColor: "rgba(15, 23, 42, 0.03)",
      borderRadius: "8px",
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    }),
    cardMutedText: styles({
      color: "rgb(75, 85, 99)"
    }),
    hoverInfo: styles({
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      cursor: "help"
    }),
    hoverInfoIcon: styles({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "14px",
      height: "14px",
      borderRadius: "999px",
      border: "1px solid rgba(15, 23, 42, 0.2)",
      color: "rgb(75, 85, 99)",
      fontSize: "10px",
      fontWeight: "700",
      lineHeight: "1",
      flexShrink: "0"
    }),
    inlineCode: styles({
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      backgroundColor: "rgba(15, 23, 42, 0.04)",
      padding: "2px 6px",
      borderRadius: "6px"
    }),
    smallButton: styles({
      border: "1px solid rgba(15, 23, 42, 0.12)",
      backgroundColor: "#fff",
      color: "#0f172a",
      borderRadius: "8px",
      padding: "8px 10px",
      cursor: "pointer"
    }),
    attentionButton: styles({
      border: "1px solid rgba(22, 101, 52, 0.55)",
      backgroundColor: "rgba(134, 239, 172, 0.65)",
      color: "#166534",
      borderRadius: "8px",
      padding: "8px 10px",
      cursor: "pointer",
      fontWeight: "600",
      boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.35)"
    }),
    disabledButton: styles({
      border: "1px solid rgba(15, 23, 42, 0.08)",
      backgroundColor: "rgba(15, 23, 42, 0.03)",
      color: "rgba(15, 23, 42, 0.3)",
      borderRadius: "8px",
      padding: "8px 10px",
      cursor: "not-allowed",
      opacity: "0.55",
      boxShadow: "none"
    }),
    input: styles({
      border: "1px solid rgba(15, 23, 42, 0.12)",
      borderRadius: "8px",
      padding: "8px 10px",
      fontSize: "14px",
      width: "100%",
      backgroundColor: "#fff"
    }),
    warningBox: styles({
      border: "1px solid rgba(245, 158, 11, 0.3)",
      backgroundColor: "rgba(245, 158, 11, 0.08)",
      borderRadius: "8px",
      padding: "12px"
    }),
    stickyWarningBox: styles({
      position: "sticky",
      top: "12px",
      zIndex: "20",
      border: "1px solid rgba(153, 27, 27, 0.45)",
      backgroundColor: "rgba(254, 226, 226, 0.92)",
      borderRadius: "8px",
      padding: "12px",
      boxShadow: "0 10px 28px rgba(127, 29, 29, 0.12)",
      backdropFilter: "blur(6px)"
    }),
    errorBox: styles({
      border: "1px solid rgba(239, 68, 68, 0.3)",
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderRadius: "8px",
      padding: "12px"
    }),
    redNote: styles({
      color: "rgb(153, 27, 27)"
    }),
    mismatchRow: styles({
      backgroundColor: "rgba(254, 226, 226, 0.45)"
    }),
    rowErrorText: styles({
      color: "rgb(153, 27, 27)",
      fontSize: "12px"
    }),
    listCompact: styles({ margin: "0", paddingLeft: "20px" })
  };
  function euro(value) {
    return `${value.toFixed(2)}\xA0\u20AC`;
  }
  function amount(value) {
    return value.toFixed(2);
  }
  function percentage(value) {
    return `${value.toFixed(2)} %`;
  }
  function multiplier(value) {
    return `${value.toFixed(2)}x`;
  }
  function parseSupportedDate2(trimmed) {
    const finnishDateMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (finnishDateMatch) {
      const [, day, month, year] = finnishDateMatch;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }
    if (isoDateMatch) {
      return /* @__PURE__ */ new Date(`${trimmed}T00:00:00Z`);
    }
    return void 0;
  }
  function decimalOrUndefined(value) {
    const normalized = (value == null ? void 0 : value.trim()) || "";
    if (!normalized) return void 0;
    try {
      return new decimal_default(normalized);
    } catch {
      return void 0;
    }
  }
  function createId2(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
  var storageKeys = {
    language: "osakkeet-language",
    windowFormData: "osakkeet-ipo-laskuri-window",
    browserFormData: "osakkeet-ipo-laskuri-browser",
    lastFileSavedHash: "osakkeet-ipo-laskuri-last-file-hash"
  };
  var shareUrlQueryKey = "osakkeet";
  function tryStorageGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }
  function tryStorageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {
    }
  }
  function tryStorageRemove(storage, key) {
    try {
      storage.removeItem(key);
    } catch {
    }
  }
  function tryLoadLanguage() {
    return localStorage.getItem(storageKeys.language) === "en" ? "en" : "fi";
  }
  function createOsakkeetFormData(demo) {
    if (demo) {
      return createExampleOsakkeetFormData("medium8y");
    }
    return {
      subscriptions: [
        {
          id: createId2("sub"),
          date: "",
          vestingEndsOn: "",
          amount: "",
          pricePerShare: "",
          otherTotalAcquisitionCosts: ""
        }
      ],
      cashDistributions: [
        { id: createId2("distribution"), type: "capital_return", date: "", amountPerShare: "", shareCount: "" }
      ],
      shareSplits: [{ id: createId2("split"), date: "", multiplier: "" }],
      demergers: [{ id: createId2("demerger"), date: "", oldCompanyRatio: "" }],
      mathematicalShareValues: [{ id: createId2("math"), year: "", valuePerShare: "" }],
      ipo: {
        ipoDate: "",
        totalShareCount: "",
        totalIpoCost: "",
        currentShareValue: "",
        estimatedPreIpoValue: "",
        estimatedSecondaryShareSellPercentage: ""
      },
      sell: {
        amount: "",
        otherAnnualCapitalGainsOrLosses: ""
      }
    };
  }
  function createExampleOsakkeetFormData(preset) {
    if (preset === "small2y") {
      return {
        subscriptions: [
          {
            id: createId2("sub"),
            date: "15.04.2024",
            vestingEndsOn: "",
            amount: "1200",
            pricePerShare: "2.80",
            otherTotalAcquisitionCosts: "25"
          },
          {
            id: createId2("sub"),
            date: "15.02.2025",
            vestingEndsOn: "31.12.2026",
            amount: "800",
            pricePerShare: "3.20",
            otherTotalAcquisitionCosts: "20"
          }
        ],
        cashDistributions: [
          {
            id: createId2("distribution"),
            type: "capital_return",
            date: "30.06.2025",
            amountPerShare: "0.18",
            shareCount: ""
          }
        ],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [
          { id: createId2("math"), year: "2025", valuePerShare: "7.50" },
          { id: createId2("math"), year: "2026", valuePerShare: "10.20" }
        ],
        ipo: {
          ipoDate: "15.09.2026",
          totalShareCount: "850000",
          totalIpoCost: "95000",
          currentShareValue: "10.20",
          estimatedPreIpoValue: "9000000",
          estimatedSecondaryShareSellPercentage: "3"
        },
        sell: {
          amount: "900",
          otherAnnualCapitalGainsOrLosses: ""
        }
      };
    }
    if (preset === "medium8y") {
      return {
        subscriptions: [
          {
            id: createId2("sub"),
            date: "20.05.2018",
            vestingEndsOn: "",
            amount: "12000",
            pricePerShare: "0.85",
            otherTotalAcquisitionCosts: "120"
          },
          {
            id: createId2("sub"),
            date: "10.02.2021",
            vestingEndsOn: "",
            amount: "12000",
            pricePerShare: "8.50",
            otherTotalAcquisitionCosts: "300"
          }
        ],
        cashDistributions: [
          {
            id: createId2("distribution"),
            type: "capital_return",
            date: "28.06.2022",
            amountPerShare: "0.12",
            shareCount: ""
          },
          {
            id: createId2("distribution"),
            type: "capital_return",
            date: "30.06.2023",
            amountPerShare: "0.16",
            shareCount: ""
          },
          {
            id: createId2("distribution"),
            type: "capital_return",
            date: "28.06.2024",
            amountPerShare: "0.22",
            shareCount: ""
          },
          {
            id: createId2("distribution"),
            type: "capital_return",
            date: "30.06.2025",
            amountPerShare: "0.28",
            shareCount: ""
          }
        ],
        shareSplits: [{ id: createId2("split"), date: "02.01.2026", multiplier: "2" }],
        demergers: [],
        mathematicalShareValues: [
          { id: createId2("math"), year: "2022", valuePerShare: "18.00" },
          { id: createId2("math"), year: "2023", valuePerShare: "21.50" },
          { id: createId2("math"), year: "2024", valuePerShare: "27.00" },
          { id: createId2("math"), year: "2025", valuePerShare: "33.00" },
          { id: createId2("math"), year: "2026", valuePerShare: "41.00" }
        ],
        ipo: {
          ipoDate: "15.09.2026",
          totalShareCount: "1960000",
          totalIpoCost: "320000",
          currentShareValue: "20.50",
          estimatedPreIpoValue: "40000000",
          estimatedSecondaryShareSellPercentage: "10"
        },
        sell: {
          amount: "18000",
          otherAnnualCapitalGainsOrLosses: "-12000"
        }
      };
    }
    return {
      subscriptions: [
        {
          id: createId2("sub"),
          date: "15.03.2010",
          vestingEndsOn: "",
          amount: "85000",
          pricePerShare: "0.18",
          otherTotalAcquisitionCosts: "550"
        },
        {
          id: createId2("sub"),
          date: "01.06.2021",
          vestingEndsOn: "",
          amount: "20000",
          pricePerShare: "18.00",
          otherTotalAcquisitionCosts: "800"
        }
      ],
      cashDistributions: [
        {
          id: createId2("distribution"),
          type: "capital_return",
          date: "31.03.2022",
          amountPerShare: "0.10",
          shareCount: ""
        },
        {
          id: createId2("distribution"),
          type: "capital_return",
          date: "30.06.2023",
          amountPerShare: "0.14",
          shareCount: ""
        },
        {
          id: createId2("distribution"),
          type: "capital_return",
          date: "28.06.2024",
          amountPerShare: "0.18",
          shareCount: ""
        },
        {
          id: createId2("distribution"),
          type: "capital_return",
          date: "30.06.2025",
          amountPerShare: "0.24",
          shareCount: ""
        },
        {
          id: createId2("distribution"),
          type: "capital_return",
          date: "30.06.2026",
          amountPerShare: "0.28",
          shareCount: ""
        },
        {
          id: createId2("distribution"),
          type: "dividend",
          date: "30.09.2026",
          amountPerShare: "0.42",
          shareCount: ""
        }
      ],
      shareSplits: [],
      demergers: [{ id: createId2("demerger"), date: "02.01.2024", oldCompanyRatio: "0.68" }],
      mathematicalShareValues: [
        { id: createId2("math"), year: "2022", valuePerShare: "24.00" },
        { id: createId2("math"), year: "2023", valuePerShare: "31.00" },
        { id: createId2("math"), year: "2024", valuePerShare: "39.50" },
        { id: createId2("math"), year: "2025", valuePerShare: "49.00" },
        { id: createId2("math"), year: "2026", valuePerShare: "63.00" }
      ],
      ipo: {
        ipoDate: "15.09.2026",
        totalShareCount: "1050000",
        totalIpoCost: "720000",
        currentShareValue: "63.00",
        estimatedPreIpoValue: "66000000",
        estimatedSecondaryShareSellPercentage: "12"
      },
      sell: {
        amount: "90000",
        otherAnnualCapitalGainsOrLosses: "25000"
      }
    };
  }
  function sanitizeOsakkeetFormData(data2) {
    var _a2, _b;
    const ipo = data2.ipo || {};
    return {
      subscriptions: (data2.subscriptions || []).map((subscription) => ({
        id: subscription.id || createId2("sub"),
        date: subscription.date || "",
        vestingEndsOn: subscription.vestingEndsOn || "",
        amount: subscription.amount || "",
        pricePerShare: subscription.pricePerShare || "",
        otherTotalAcquisitionCosts: subscription.otherTotalAcquisitionCosts || ""
      })),
      cashDistributions: (data2.cashDistributions || []).map((cashDistribution) => ({
        id: cashDistribution.id || createId2("distribution"),
        date: cashDistribution.date || "",
        type: cashDistribution.type || "capital_return",
        amountPerShare: cashDistribution.amountPerShare || "",
        shareCount: cashDistribution.shareCount || ""
      })),
      shareSplits: (data2.shareSplits || []).map((shareSplit) => ({
        id: shareSplit.id || createId2("split"),
        date: shareSplit.date || "",
        multiplier: shareSplit.multiplier || ""
      })),
      demergers: (data2.demergers || []).map((demerger) => ({
        id: demerger.id || createId2("demerger"),
        date: demerger.date || "",
        oldCompanyRatio: demerger.oldCompanyRatio || ""
      })),
      mathematicalShareValues: (data2.mathematicalShareValues || []).map((row) => ({
        id: row.id || createId2("math"),
        year: row.year || "",
        valuePerShare: row.valuePerShare || ""
      })),
      ipo: {
        ipoDate: ipo.ipoDate || "",
        totalShareCount: ipo.totalShareCount || "",
        totalIpoCost: ipo.totalIpoCost || "",
        currentShareValue: ipo.currentShareValue || "",
        estimatedPreIpoValue: ipo.estimatedPreIpoValue || "",
        estimatedSecondaryShareSellPercentage: ipo.estimatedSecondaryShareSellPercentage || ""
      },
      sell: {
        amount: ((_a2 = data2.sell) == null ? void 0 : _a2.amount) || "",
        otherAnnualCapitalGainsOrLosses: ((_b = data2.sell) == null ? void 0 : _b.otherAnnualCapitalGainsOrLosses) || ""
      }
    };
  }
  function createShareableOsakkeetUrlData(data2) {
    const sanitized = sanitizeOsakkeetFormData(data2);
    return {
      cashDistributions: sanitized.cashDistributions.map((cashDistribution) => ({
        id: cashDistribution.id,
        date: cashDistribution.date,
        type: cashDistribution.type,
        amountPerShare: cashDistribution.amountPerShare
      })),
      shareSplits: sanitized.shareSplits,
      demergers: sanitized.demergers,
      mathematicalShareValues: sanitized.mathematicalShareValues,
      ipo: sanitized.ipo
    };
  }
  function normalizeLoadedData(parsed) {
    const ipo = parsed.ipo || {};
    return {
      subscriptions: (parsed.subscriptions || []).map((subscription) => ({
        id: subscription.id || createId2("sub"),
        date: subscription.date || "",
        vestingEndsOn: subscription.vestingEndsOn || "",
        amount: subscription.amount || "",
        pricePerShare: subscription.pricePerShare || "",
        otherTotalAcquisitionCosts: subscription.otherTotalAcquisitionCosts || ""
      })),
      cashDistributions: (parsed.cashDistributions || []).map((cashDistribution) => ({
        id: cashDistribution.id || createId2("distribution"),
        date: cashDistribution.date || "",
        type: cashDistribution.type || "capital_return",
        amountPerShare: cashDistribution.amountPerShare || "",
        shareCount: cashDistribution.shareCount || ""
      })),
      shareSplits: (parsed.shareSplits || []).map((shareSplit) => ({
        id: shareSplit.id || createId2("split"),
        date: shareSplit.date || "",
        multiplier: shareSplit.multiplier || ""
      })),
      demergers: (parsed.demergers || []).map((demerger) => ({
        id: demerger.id || createId2("demerger"),
        date: demerger.date || "",
        oldCompanyRatio: demerger.oldCompanyRatio || ""
      })),
      mathematicalShareValues: (parsed.mathematicalShareValues || []).map((row) => ({
        ...row
      })),
      ipo: {
        ipoDate: ipo.ipoDate || "",
        totalShareCount: ipo.totalShareCount || "",
        totalIpoCost: ipo.totalIpoCost || "",
        currentShareValue: ipo.currentShareValue || "",
        estimatedPreIpoValue: ipo.estimatedPreIpoValue || "",
        estimatedSecondaryShareSellPercentage: ipo.estimatedSecondaryShareSellPercentage || ""
      },
      sell: {
        ...createOsakkeetFormData(false).sell,
        ...parsed.sell
      }
    };
  }
  function tryLoadSavedData() {
    const saved = tryStorageGet(localStorage, storageKeys.browserFormData);
    if (!saved) return createOsakkeetFormData(true);
    try {
      const parsed = JSON.parse(saved);
      return normalizeLoadedData(parsed);
    } catch {
      return createOsakkeetFormData(true);
    }
  }
  function tryLoadWindowSavedData() {
    const saved = tryStorageGet(sessionStorage, storageKeys.windowFormData);
    if (!saved) return void 0;
    try {
      const parsed = JSON.parse(saved);
      return normalizeLoadedData(parsed);
    } catch {
      return void 0;
    }
  }
  function encodeUrlState(value) {
    const json = JSON.stringify(value);
    const bytes = new TextEncoder().encode(json);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function decodeUrlState(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - normalized.length % 4) % 4;
    const padded = normalized.padEnd(normalized.length + paddingLength, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function tryLoadSharedUrlData() {
    const encoded = new URL(window.location.href).searchParams.get(shareUrlQueryKey);
    if (!encoded) return void 0;
    try {
      const parsed = decodeUrlState(encoded);
      const emptyForm = createOsakkeetFormData(false);
      return normalizeLoadedData({
        ...emptyForm,
        cashDistributions: parsed.cashDistributions || [],
        shareSplits: parsed.shareSplits || [],
        demergers: parsed.demergers || [],
        mathematicalShareValues: parsed.mathematicalShareValues || [],
        ipo: {
          ...emptyForm.ipo,
          ...parsed.ipo || {}
        },
        subscriptions: emptyForm.subscriptions,
        sell: emptyForm.sell
      });
    } catch {
      return void 0;
    }
  }
  function tryLoadInitialData() {
    return tryLoadSharedUrlData() || tryLoadWindowSavedData() || tryLoadSavedData();
  }
  function serializeOsakkeetFormData(data2) {
    return JSON.stringify(sanitizeOsakkeetFormData(data2));
  }
  function buildShareUrl(data2) {
    const url = new URL(window.location.href);
    url.searchParams.set(shareUrlQueryKey, encodeUrlState(createShareableOsakkeetUrlData(data2)));
    return url.toString();
  }
  async function copyTextToClipboard(value) {
    var _a2;
    if ((_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const textarea2 = document.createElement("textarea");
    textarea2.value = value;
    textarea2.setAttribute("readonly", "true");
    textarea2.style.position = "absolute";
    textarea2.style.left = "-9999px";
    document.body.appendChild(textarea2);
    textarea2.select();
    textarea2.setSelectionRange(0, textarea2.value.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea2);
    return copied;
  }
  function numberInput(value, onInput = () => {
  }, numeric = true) {
    return inputs.text(
      {
        value,
        ...numeric ? { inputMode: "decimal" } : {}
      },
      pageStyles.input,
      events({
        input({ node }) {
          onInput(node.value);
        }
      })
    );
  }
  function finnishDateInput(value, onInput = () => {
  }) {
    return inputs.text(
      {
        value,
        placeholder: "pp.kk.vvvv",
        inputMode: "numeric"
      },
      pageStyles.input,
      events({
        input({ node }) {
          onInput(node.value);
        }
      })
    );
  }
  function enumSelectInput(value, options, onChange = () => {
  }) {
    return select(
      pageStyles.input,
      { value },
      events({
        change({ node }) {
          onChange(node.value);
        }
      }),
      options.map((optionValue) => option(optionValue.label, { value: optionValue.value }))
    );
  }
  function infoCard(title2, value, help) {
    return div(
      pageStyles.summaryItem,
      span({ class: "muted" }, pageStyles.cardMutedText, title2),
      ...value ? [b(value)] : [],
      help && span({ class: "muted" }, pageStyles.cardMutedText, help)
    );
  }
  function withHoverInfo(content, tooltip) {
    return span({ title: tooltip }, pageStyles.hoverInfo, content, span(pageStyles.hoverInfoIcon, "i"));
  }
  function hoverValue(value, tooltip, emphasized = false) {
    const node = withHoverInfo(value, tooltip);
    return emphasized ? b(node) : node;
  }
  function linkToSource(textValue, href) {
    return a(textValue, { href, target: "_blank", rel: "noreferrer" });
  }
  function setInputValue(node, value) {
    if (node.value !== value) {
      node.value = value;
    }
  }
  function setSelectValue(node, value) {
    if (node.value !== value) {
      node.value = value;
    }
  }
  function applyButtonStyle(node, style2, className = "") {
    node.removeAttribute("style");
    node.className = className;
    setStyle(node, style2.styles);
  }
  function setButtonVariant(node, primary) {
    if (primary) {
      node.removeAttribute("style");
      node.className = "blueButton";
      return;
    }
    applyButtonStyle(node, pageStyles.smallButton);
  }
  function setButtonAttention(node, needsAttention) {
    if (node.disabled) {
      applyButtonStyle(node, pageStyles.disabledButton);
      return;
    }
    if (needsAttention) {
      applyButtonStyle(node, pageStyles.attentionButton);
      return;
    }
    applyButtonStyle(node, pageStyles.smallButton);
  }
  function setButtonDisabled(node, disabled) {
    node.disabled = disabled;
    applyButtonStyle(node, disabled ? pageStyles.disabledButton : pageStyles.smallButton);
  }
  function createRemoveButton(labelNode, remove) {
    return button(
      labelNode,
      pageStyles.smallButton,
      events({
        click() {
          remove();
        }
      })
    );
  }
  function createActionButton(labelNode, variant, onClick) {
    return button(
      labelNode,
      variant === "primary" ? { class: "blueButton" } : pageStyles.smallButton,
      events({
        click() {
          onClick();
        }
      })
    );
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
        { class: "muted" },
        t.assumptions.sourcesLabel,
        linkToSource(
          t.sources.dividends,
          "https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/osingot-listaamattomasta-yhtiosta/"
        ),
        ", ",
        linkToSource(
          t.sources.listedDividends,
          "https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/listatusta-yhti%C3%B6st%C3%A4-saadut-osingot/"
        ),
        ", ",
        linkToSource(
          t.sources.reporting,
          "https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/veroilmoitus_ja_verotuspaato/ilmoittamisen-ohje/"
        ),
        ", ",
        linkToSource(
          t.sources.demergerAcquisitionCost,
          "https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/48262/arvopaperien-luovutusten-verotus4/"
        ),
        ", ",
        linkToSource(
          t.sources.demergers,
          "https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/49340/yritysjarjestelyt-ja-verotus-jakautuminen4/"
        ),
        ", ",
        linkToSource(
          t.sources.form9a,
          "https://www.vero.fi/tietoa-verohallinnosta/yhteystiedot-ja-asiointi/lomakkeet/tayttoohjeet/9a-arvopapereiden-luovutusvoitot-ja--tappiot-t%C3%A4ytt%C3%B6ohje/"
        ),
        ", ",
        linkToSource(t.sources.sales, "https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osakkeiden_myynt/")
      )
    );
  }
  function createMathematicalShareValuesEditor(dataState, localizedTextNodes) {
    const mathematicalShareValuesTextNodes = localizedTextNodes.mathematicalShareValues;
    const tbodyNode = tbody();
    const rowsState = createState({
      value: []
    });
    const mathematicalShareValues = createStateCollectionEditor(dataState, ["mathematicalShareValues"]);
    mapStateToDomChildren(rowsState, tbodyNode, {
      render: (row) => {
        const rowState = createState({
          value: {
            row
          }
        });
        const rowTextNodes = createTextNodesFromState(rowState, { path: ["row"] });
        const yearInput = numberInput(row.year, (value) => {
          mathematicalShareValues.patch(row.id, { year: value });
        });
        const valuePerShareInput = numberInput(row.valuePerShare, (value) => {
          mathematicalShareValues.patch(row.id, { valuePerShare: value });
        });
        const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
          mathematicalShareValues.remove(row.id);
        });
        return {
          node: tr(
            td(div(pageStyles.compactField, yearInput)),
            td(div(pageStyles.compactField, valuePerShareInput)),
            td({ class: "no-print" }, removeButton)
          ),
          set(nextRow) {
            setInputValue(yearInput, nextRow.year);
            setInputValue(valuePerShareInput, nextRow.valuePerShare);
            rowState.set({ row: nextRow });
          }
        };
      }
    });
    const addButton = createActionButton(mathematicalShareValuesTextNodes.actions.add, "primary", () => {
      mathematicalShareValues.append({
        year: "",
        valuePerShare: ""
      });
    });
    const root = div(
      h3(mathematicalShareValuesTextNodes.title),
      table(
        pageStyles.compactTable,
        thead(
          tr(
            th(mathematicalShareValuesTextNodes.fields.year),
            th(mathematicalShareValuesTextNodes.fields.valuePerShare),
            th({ class: "no-print" }, "")
          )
        ),
        tbodyNode
      ),
      div({ class: "no-print" }, pageStyles.rowButtons, addButton)
    );
    return {
      root,
      set({ texts, osakkeetCalculation }) {
        void texts;
        rowsState.set(
          osakkeetCalculation.formData.mathematicalShareValues.map((row) => ({
            id: row.id,
            year: row.year,
            valuePerShare: row.valuePerShare,
            removeLabel: texts.common.remove
          }))
        );
      }
    };
  }
  function createShareSplitsSection(dataState, localizedTextNodes, commonTextNodes) {
    const textState = createState({
      value: {
        rowCount: ""
      }
    });
    const shareSplitTextNodes = localizedTextNodes.shareSplits;
    const rowCountNode = createTextNodesFromState(textState, { path: ["rowCount"] });
    const tbodyNode = tbody();
    const rowsState = createState({ value: [] });
    const shareSplits = createStateCollectionEditor(dataState, ["shareSplits"]);
    mapStateToDomChildren(rowsState, tbodyNode, {
      render: (row) => {
        const rowState = createState({ value: { row } });
        const rowTextNodes = createTextNodesFromState(rowState, { path: ["row"] });
        const dateInput = finnishDateInput(row.date, (value) => {
          shareSplits.patch(row.id, { date: value });
        });
        const multiplierInput = numberInput(row.multiplier, (value) => {
          shareSplits.patch(row.id, { multiplier: value });
        });
        const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
          shareSplits.remove(row.id);
        });
        return {
          node: tr(
            td(div(pageStyles.compactField, dateInput)),
            td(div(pageStyles.compactField, multiplierInput)),
            td({ class: "no-print" }, removeButton)
          ),
          set(nextRow) {
            setInputValue(dateInput, nextRow.date);
            setInputValue(multiplierInput, nextRow.multiplier);
            rowState.set({ row: nextRow });
          }
        };
      }
    });
    const addButton = createActionButton(shareSplitTextNodes.actions.add, "primary", () => {
      shareSplits.append({
        date: "",
        multiplier: ""
      });
    });
    const root = section(
      { class: "card" },
      div({ class: "heading" }, h2(shareSplitTextNodes.title), span({ class: "muted" }, rowCountNode)),
      p({ class: "muted" }, shareSplitTextNodes.help),
      table(
        pageStyles.compactTable,
        thead(
          tr(
            th(commonTextNodes.date),
            th(shareSplitTextNodes.fields.multiplier),
            th({ class: "no-print" }, "")
          )
        ),
        tbodyNode
      ),
      div({ class: "no-print" }, pageStyles.rowButtons, addButton)
    );
    return {
      root,
      set({ osakkeetCalculation, texts }) {
        const current = osakkeetCalculation.formData;
        textState.set({
          rowCount: `${current.shareSplits.length} ${texts.common.rows}`
        });
        rowsState.set(
          current.shareSplits.map((shareSplit) => ({
            id: shareSplit.id,
            date: shareSplit.date,
            multiplier: shareSplit.multiplier,
            removeLabel: texts.common.remove
          }))
        );
      }
    };
  }
  function createDemergersSection(dataState, localizedTextNodes, commonTextNodes) {
    const textState = createState({
      value: {
        rowCount: ""
      }
    });
    const demergerTextNodes = localizedTextNodes.demergers;
    const rowCountNode = createTextNodesFromState(textState, { path: ["rowCount"] });
    const tbodyNode = tbody();
    const rowsState = createState({ value: [] });
    const demergers = createStateCollectionEditor(dataState, ["demergers"]);
    mapStateToDomChildren(rowsState, tbodyNode, {
      render: (row) => {
        const rowState = createState({ value: { row } });
        const rowTextNodes = createTextNodesFromState(rowState, { path: ["row"] });
        const dateInput = finnishDateInput(row.date, (value) => {
          demergers.patch(row.id, { date: value });
        });
        const oldCompanyRatioInput = numberInput(row.oldCompanyRatio, (value) => {
          demergers.patch(row.id, { oldCompanyRatio: value });
        });
        const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
          demergers.remove(row.id);
        });
        return {
          node: tr(
            td(div(pageStyles.compactField, dateInput)),
            td(div(pageStyles.compactField, oldCompanyRatioInput)),
            td({ class: "no-print" }, removeButton)
          ),
          set(nextRow) {
            setInputValue(dateInput, nextRow.date);
            setInputValue(oldCompanyRatioInput, nextRow.oldCompanyRatio);
            rowState.set({ row: nextRow });
          }
        };
      }
    });
    const addButton = createActionButton(demergerTextNodes.actions.add, "primary", () => {
      demergers.append({
        date: "",
        oldCompanyRatio: ""
      });
    });
    const root = section(
      { class: "card" },
      div({ class: "heading" }, h2(demergerTextNodes.title), span({ class: "muted" }, rowCountNode)),
      p({ class: "muted" }, demergerTextNodes.help),
      table(
        pageStyles.compactTable,
        thead(
          tr(
            th(commonTextNodes.date),
            th(demergerTextNodes.fields.oldCompanyRatio),
            th({ class: "no-print" }, "")
          )
        ),
        tbodyNode
      ),
      div({ class: "no-print" }, pageStyles.rowButtons, addButton)
    );
    return {
      root,
      set({ osakkeetCalculation, texts }) {
        const current = osakkeetCalculation.formData;
        textState.set({
          rowCount: `${current.demergers.length} ${texts.common.rows}`
        });
        rowsState.set(
          current.demergers.map((demerger) => ({
            id: demerger.id,
            date: demerger.date,
            oldCompanyRatio: demerger.oldCompanyRatio,
            removeLabel: texts.common.remove
          }))
        );
      }
    };
  }
  function taxSummarySection(calculation, t) {
    var _a2;
    const zeroMoney = calculation.ipo.totalIpoCost.mul(0);
    const yearSet = /* @__PURE__ */ new Set();
    calculation.cashDistributions.forEach((cashDistribution) => {
      var _a3;
      const date = (_a3 = cashDistribution.date.match(/(\d{4})$/)) == null ? void 0 : _a3[1];
      if (date) yearSet.add(Number(date));
    });
    const ipoYear = (_a2 = calculation.ipo.ipoDate) == null ? void 0 : _a2.getUTCFullYear();
    if (ipoYear && calculation.sell.grossTotal.gt(0)) {
      yearSet.add(ipoYear);
    }
    const years = [...yearSet].sort((a2, b2) => a2 - b2);
    if (years.length === 0) return false;
    const renderTaxTable = (entries, mode) => {
      const totalCapitalRepayment = entries.reduce((acc, row) => acc.add(row.capitalRepaymentTotal), zeroMoney);
      const totalDividend = entries.reduce((acc, row) => acc.add(row.dividendTotal), zeroMoney);
      const totalTaxableCapitalIncome = entries.reduce((acc, row) => acc.add(row.taxableCapitalIncome), zeroMoney);
      const totalTaxFreeCapitalIncome = entries.reduce((acc, row) => acc.add(row.taxFreeCapitalIncomePortion), zeroMoney);
      const totalTaxableEarnedDividend = entries.reduce((acc, row) => acc.add(row.taxableEarnedDividend), zeroMoney);
      const totalTaxFreeEarnedDividend = entries.reduce((acc, row) => acc.add(row.taxFreeEarnedDividend), zeroMoney);
      const totalWithholding = entries.reduce((acc, row) => acc.add(row.withholdingToTaxOffice), zeroMoney);
      const totalCash = entries.reduce((acc, row) => acc.add(row.paidInCash), zeroMoney);
      const capitalRepaymentHeaderNode = mode === "unlisted" ? withHoverInfo(t.cashDistributions.fields.capitalRepayment, t.taxReturns.fields.unlistedCapitalRepaymentHelp) : t.cashDistributions.fields.capitalRepayment;
      const dividendHeaderNode = withHoverInfo(
        t.cashDistributions.fields.dividend,
        mode === "unlisted" ? t.taxReturns.fields.unlistedDividendHelp : t.taxReturns.fields.listedDividendHelp
      );
      return table(
        thead(
          tr(
            th(t.common.date),
            th(t.common.type),
            th(t.cashDistributions.fields.cashPaid),
            th(t.cashDistributions.fields.withholding),
            mode === "unlisted" && th(capitalRepaymentHeaderNode),
            th(dividendHeaderNode),
            th(t.taxReturns.fields.taxableCapitalIncome),
            th(t.taxReturns.fields.taxFreeCapitalIncome),
            mode === "unlisted" && th(t.taxReturns.fields.taxableEarnedDividend),
            mode === "unlisted" && th(t.taxReturns.fields.taxFreeEarnedDividend)
          )
        ),
        tbody(
          entries.map(
            (row) => tr(
              td(row.date),
              td(row.type === "dividend" ? t.cashDistributions.types.dividend : t.cashDistributions.types.capitalReturn),
              td(euro(row.paidInCash)),
              td(euro(row.withholdingToTaxOffice)),
              mode === "unlisted" && td(euro(row.capitalRepaymentTotal)),
              td(euro(row.dividendTotal)),
              td(euro(row.taxableCapitalIncome)),
              td(euro(row.taxFreeCapitalIncomePortion)),
              mode === "unlisted" && td(euro(row.taxableEarnedDividend)),
              mode === "unlisted" && td(euro(row.taxFreeEarnedDividend))
            )
          ),
          tr(
            td(b(t.summary.totalRow)),
            td(),
            td(euro(totalCash)),
            td(euro(totalWithholding)),
            mode === "unlisted" && td(euro(totalCapitalRepayment)),
            td(euro(totalDividend)),
            td(euro(totalTaxableCapitalIncome)),
            td(euro(totalTaxFreeCapitalIncome)),
            mode === "unlisted" && td(euro(totalTaxableEarnedDividend)),
            mode === "unlisted" && td(euro(totalTaxFreeEarnedDividend))
          )
        )
      );
    };
    return div(
      years.map((year) => {
        const yearEntries = calculation.cashDistributions.filter(
          (cashDistribution) => cashDistribution.date.endsWith(String(year))
        );
        const unlistedEntries = yearEntries.filter((row) => !row.treatedAsListedDividend);
        const listedEntries = yearEntries.filter((row) => row.treatedAsListedDividend);
        const yearMathWarnings = unlistedEntries.filter(
          (row) => row.dividendTotal.gt(0) && !row.treatedAsListedDividend && row.shareholderMathematicalValue.eq(0)
        );
        return div(
          pageStyles.denseStack,
          h3(String(year)),
          yearMathWarnings.length > 0 && div(
            pageStyles.warningBox,
            ul(yearMathWarnings.map((row) => li(`${row.date}: ${t.taxReturns.yearWarningMissingMathValue}`)))
          ),
          unlistedEntries.length > 0 && div(
            pageStyles.denseStack,
            h3(withHoverInfo(t.taxReturns.sections.unlisted, t.taxReturns.sections.unlistedHelp)),
            renderTaxTable(unlistedEntries, "unlisted")
          ),
          listedEntries.length > 0 && div(pageStyles.denseStack, h3(t.taxReturns.sections.listed), renderTaxTable(listedEntries, "listed")),
          ipoYear === year && calculation.sell.grossTotal.gt(0) && div(
            pageStyles.denseStack,
            h3(t.taxReturns.fields.ipoSaleAllocation),
            div(
              pageStyles.summaryGrid,
              infoCard(t.summary.ipoSell.cards.grossSale, euro(calculation.sell.grossTotal)),
              infoCard(t.summary.ipoSell.cards.ipoCostsAllocated, euro(calculation.sell.totalIpoCostAllocated)),
              infoCard(t.summary.ipoSell.cards.taxableCapitalGain, euro(calculation.sell.taxableGainTotal)),
              infoCard(t.summary.ipoSell.cards.taxMan, euro(calculation.sell.estimatedTax)),
              infoCard(t.summary.ipoSell.cards.netCash, euro(calculation.sell.netAfterTaxAndIpoCost))
            )
          )
        );
      })
    );
  }
  function createCapitalRepaymentTooltip(breakdown, texts) {
    if (!breakdown.length) return "";
    return [
      texts.subscriptions.fields.totalReimbursementsTooltipIntro,
      ...breakdown.map(
        (entry) => texts.subscriptions.fields.totalReimbursementsTooltipLine(
          entry.distributionDate,
          euro(entry.capitalRepaymentPerShare),
          amount(entry.shares),
          euro(entry.capitalRepaymentTotal)
        )
      )
    ].join("\n");
  }
  function createTotalPricePerShareTooltip(subscription, formData, summary2, texts) {
    if (!summary2) return "";
    const baseShares = decimalOrUndefined(subscription.amount);
    const pricePerShare = decimalOrUndefined(subscription.pricePerShare || "") || new decimal_default(0);
    const otherCosts = decimalOrUndefined(subscription.otherTotalAcquisitionCosts || "") || new decimal_default(0);
    if (!baseShares) return "";
    let currentTotal = baseShares.mul(pricePerShare).add(otherCosts);
    let currentShares = baseShares;
    const subscriptionDate = parseSupportedDate2(subscription.date.trim());
    const events2 = [
      ...formData.demergers.map((demerger) => ({ kind: "demerger", date: demerger.date, entry: demerger })),
      ...formData.shareSplits.map((shareSplit) => ({ kind: "split", date: shareSplit.date, entry: shareSplit }))
    ].filter((event) => {
      const eventDate = parseSupportedDate2(event.date.trim());
      if (!eventDate) return false;
      if (!subscriptionDate) return true;
      return subscriptionDate.getTime() <= eventDate.getTime();
    }).sort((a2, b2) => {
      const dateA = parseSupportedDate2(a2.date.trim());
      const dateB = parseSupportedDate2(b2.date.trim());
      const dateComparison = ((dateA == null ? void 0 : dateA.getTime()) || 0) - ((dateB == null ? void 0 : dateB.getTime()) || 0);
      if (dateComparison !== 0) return dateComparison;
      if (a2.kind === b2.kind) return 0;
      return a2.kind === "split" ? -1 : 1;
    });
    const lines = [
      texts.subscriptions.fields.totalPricePerShareTooltipBase(
        amount(baseShares),
        euro(pricePerShare),
        euro(otherCosts),
        euro(currentTotal)
      )
    ];
    for (const event of events2) {
      if (event.kind === "demerger") {
        const ratio = decimalOrUndefined(event.entry.oldCompanyRatio);
        if (!ratio) continue;
        const nextTotal = currentTotal.mul(ratio);
        lines.push(
          texts.subscriptions.fields.totalPricePerShareTooltipDemerger(
            event.entry.date,
            euro(currentTotal),
            amount(ratio),
            euro(nextTotal)
          )
        );
        currentTotal = nextTotal;
        continue;
      }
      const splitMultiplier = decimalOrUndefined(event.entry.multiplier);
      if (!splitMultiplier) continue;
      const nextShares = currentShares.mul(splitMultiplier);
      lines.push(
        texts.subscriptions.fields.totalPricePerShareTooltipSplit(
          event.entry.date,
          amount(currentShares),
          amount(splitMultiplier),
          amount(nextShares)
        )
      );
      currentShares = nextShares;
    }
    lines.push(
      texts.subscriptions.fields.totalPricePerShareTooltipResult(
        euro(summary2.totalPrice),
        amount(summary2.amount),
        euro(summary2.totalPricePerShare)
      )
    );
    return lines.join("\n");
  }
  function createSubscriptionsSection(dataState, localizedTextNodes, commonTextNodes) {
    const textState = createState({
      value: {
        rowCount: ""
      }
    });
    const subscriptionTextNodes = localizedTextNodes.subscriptions;
    const rowCountNode = createTextNodesFromState(textState, { path: ["rowCount"] });
    const summaryRoot = div(pageStyles.summaryGrid);
    const vestingEndsOnHeaderNode = withHoverInfo(subscriptionTextNodes.fields.vestingEndsOn, "");
    const otherTotalAcquisitionCostsHeaderNode = withHoverInfo(
      subscriptionTextNodes.fields.otherTotalAcquisitionCosts,
      ""
    );
    const totalReimbursementsHeaderNode = withHoverInfo(subscriptionTextNodes.fields.totalReimbursements, "");
    const tbodyNode = tbody();
    const rowsState = createState({ value: [] });
    const subscriptions = createStateCollectionEditor(dataState, ["subscriptions"]);
    mapStateToDomChildren(rowsState, tbodyNode, {
      render: (row) => {
        const rowState = createState({
          value: {
            row
          }
        });
        const rowTextNodes = createTextNodesFromState(rowState, { path: ["row"] });
        const dateInput = finnishDateInput(row.date, (value) => {
          subscriptions.patch(row.id, { date: value });
        });
        const vestingEndsOnInput = finnishDateInput(row.vestingEndsOn, (value) => {
          subscriptions.patch(row.id, { vestingEndsOn: value });
        });
        const amountInput = numberInput(row.amount, (value) => {
          subscriptions.patch(row.id, { amount: value });
        });
        const pricePerShareInput = numberInput(row.pricePerShare, (value) => {
          subscriptions.patch(row.id, { pricePerShare: value });
        });
        const otherTotalAcquisitionCostsInput = numberInput(row.otherTotalAcquisitionCosts, (value) => {
          subscriptions.patch(row.id, { otherTotalAcquisitionCosts: value });
        });
        const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
          subscriptions.remove(row.id);
        });
        const totalPricePerShareCell = td(
          row.totalPricePerShareTooltip ? hoverValue(row.totalPricePerShare, row.totalPricePerShareTooltip) : row.totalPricePerShare
        );
        const capitalRepaymentTotalCell = td(
          row.capitalRepaymentTotalTooltip ? hoverValue(row.capitalRepaymentTotal, row.capitalRepaymentTotalTooltip) : row.capitalRepaymentTotal
        );
        return {
          node: tr(
            td(dateInput),
            td(vestingEndsOnInput),
            td(amountInput),
            td(pricePerShareInput),
            td(otherTotalAcquisitionCostsInput),
            totalPricePerShareCell,
            td(rowTextNodes.capitalRepaymentPerShare),
            td(rowTextNodes.remainingCostPerShare),
            capitalRepaymentTotalCell,
            td({ class: "no-print" }, removeButton)
          ),
          set(nextRow) {
            setInputValue(dateInput, nextRow.date);
            setInputValue(vestingEndsOnInput, nextRow.vestingEndsOn);
            setInputValue(amountInput, nextRow.amount);
            setInputValue(pricePerShareInput, nextRow.pricePerShare);
            setInputValue(otherTotalAcquisitionCostsInput, nextRow.otherTotalAcquisitionCosts);
            rowState.set({ row: nextRow });
            replaceChildren(
              totalPricePerShareCell,
              nextRow.totalPricePerShareTooltip ? hoverValue(nextRow.totalPricePerShare, nextRow.totalPricePerShareTooltip) : nextRow.totalPricePerShare
            );
            replaceChildren(
              capitalRepaymentTotalCell,
              nextRow.capitalRepaymentTotalTooltip ? hoverValue(nextRow.capitalRepaymentTotal, nextRow.capitalRepaymentTotalTooltip) : nextRow.capitalRepaymentTotal
            );
          }
        };
      }
    });
    const addButton = createActionButton(subscriptionTextNodes.actions.add, "primary", () => {
      subscriptions.append({
        date: "",
        vestingEndsOn: "",
        amount: "",
        pricePerShare: "",
        otherTotalAcquisitionCosts: ""
      });
    });
    const root = section(
      { class: "card" },
      div({ class: "heading" }, h2(subscriptionTextNodes.title), span({ class: "muted" }, rowCountNode)),
      p({ class: "muted" }, subscriptionTextNodes.help),
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
            th({ class: "no-print" }, "")
          )
        ),
        tbodyNode
      ),
      div({ class: "no-print" }, pageStyles.rowButtons, addButton)
    );
    return {
      root,
      set({ osakkeetCalculation, texts }) {
        const current = osakkeetCalculation.formData;
        const totalShares = osakkeetCalculation.vesting.totalShares;
        const vestedShares = osakkeetCalculation.vesting.vestedShares;
        const unvestedShares = osakkeetCalculation.vesting.unvestedShares;
        const sharePercent = (value) => totalShares.gt(0) ? `${amount(value)} (${percentage(value.div(totalShares).mul(100))})` : `${amount(value)} (0.00 %)`;
        const summariesById = Object.fromEntries(
          osakkeetCalculation.subscriptions.map((subscription) => [subscription.id, subscription])
        );
        textState.set({
          rowCount: `${current.subscriptions.length} ${texts.common.rows}`
        });
        vestingEndsOnHeaderNode.title = texts.subscriptions.fields.vestingEndsOnHelp;
        otherTotalAcquisitionCostsHeaderNode.title = texts.subscriptions.fields.otherTotalAcquisitionCostsHelp;
        totalReimbursementsHeaderNode.title = texts.subscriptions.fields.totalReimbursementsHelp;
        replaceChildren(
          summaryRoot,
          infoCard(texts.subscriptions.summary.totalShares, amount(totalShares)),
          infoCard(texts.subscriptions.summary.vestedShares, sharePercent(vestedShares)),
          infoCard(texts.subscriptions.summary.unvestedShares, sharePercent(unvestedShares))
        );
        rowsState.set(
          current.subscriptions.map((subscription) => ({
            id: subscription.id,
            date: subscription.date,
            vestingEndsOn: subscription.vestingEndsOn || "",
            amount: subscription.amount,
            pricePerShare: subscription.pricePerShare || "",
            otherTotalAcquisitionCosts: subscription.otherTotalAcquisitionCosts || "",
            totalPricePerShare: summariesById[subscription.id] ? euro(summariesById[subscription.id].totalPricePerShare) : "-",
            totalPricePerShareTooltip: createTotalPricePerShareTooltip(
              subscription,
              current,
              summariesById[subscription.id],
              texts
            ),
            capitalRepaymentTotal: summariesById[subscription.id] ? euro(summariesById[subscription.id].capitalRepaymentTotal) : "-",
            capitalRepaymentTotalTooltip: summariesById[subscription.id] ? createCapitalRepaymentTooltip(summariesById[subscription.id].capitalRepaymentBreakdown, texts) : "",
            capitalRepaymentPerShare: summariesById[subscription.id] ? euro(summariesById[subscription.id].capitalRepaymentPerShare) : "-",
            remainingCostPerShare: summariesById[subscription.id] ? euro(summariesById[subscription.id].remainingCostPerShare) : "-",
            removeLabel: texts.common.remove
          }))
        );
      }
    };
  }
  function createCashDistributionsSection(dataState, localizedTextNodes, commonTextNodes) {
    const textState = createState({
      value: {
        rowCount: ""
      }
    });
    const cashDistributionTextNodes = localizedTextNodes.cashDistributions;
    const rowCountNode = createTextNodesFromState(textState, { path: ["rowCount"] });
    const withholdingHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.withholding, "");
    const cashPaidHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.cashPaid, "");
    const capitalRepaymentHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.capitalRepayment, "");
    const dividendHeaderNode = withHoverInfo(cashDistributionTextNodes.fields.dividend, "");
    const tbodyNode = tbody();
    const rowsState = createState({ value: [] });
    const cashDistributions = createStateCollectionEditor(dataState, ["cashDistributions"]);
    mapStateToDomChildren(rowsState, tbodyNode, {
      render: (row) => {
        const rowState = createState({
          value: {
            row
          }
        });
        const rowTextNodes = createTextNodesFromState(rowState, { path: ["row"] });
        const dateInput = finnishDateInput(row.date, (value) => {
          cashDistributions.patch(row.id, { date: value });
        });
        const typeInput = enumSelectInput(
          row.type,
          [
            { label: row.capitalReturnLabel, value: "capital_return" },
            { label: row.dividendLabel, value: "dividend" }
          ],
          (value) => {
            cashDistributions.patch(row.id, { type: value });
          }
        );
        const shareCountInput = numberInput(row.shareCount, (value) => {
          cashDistributions.patch(row.id, { shareCount: value });
        });
        const amountPerShareInput = numberInput(row.amountPerShare, (value) => {
          cashDistributions.patch(row.id, { amountPerShare: value });
        });
        const removeButton = createRemoveButton(rowTextNodes.removeLabel, () => {
          cashDistributions.remove(row.id);
        });
        const shareCountCell = td(
          div(pageStyles.denseStack, shareCountInput, span(pageStyles.rowErrorText, rowTextNodes.shareCountMismatch))
        );
        const capitalRepaymentTotalCell = td(
          row.capitalRepaymentTotalTooltip ? hoverValue(row.capitalRepaymentTotal, row.capitalRepaymentTotalTooltip) : row.capitalRepaymentTotal
        );
        const dividendTotalCell = td(
          row.dividendTotalTooltip ? hoverValue(row.dividendTotal, row.dividendTotalTooltip) : row.dividendTotal
        );
        const rowNode = tr(
          td(dateInput),
          td(typeInput),
          shareCountCell,
          td(amountPerShareInput),
          td(rowTextNodes.grossTotal),
          td(rowTextNodes.paidInCash),
          td(rowTextNodes.withholdingToTaxOffice),
          capitalRepaymentTotalCell,
          dividendTotalCell,
          td({ class: "no-print" }, removeButton)
        );
        return {
          node: rowNode,
          set(nextRow) {
            setInputValue(dateInput, nextRow.date);
            setSelectValue(typeInput, nextRow.type);
            typeInput.options[0].textContent = nextRow.capitalReturnLabel;
            typeInput.options[1].textContent = nextRow.dividendLabel;
            setInputValue(shareCountInput, nextRow.shareCount);
            setInputValue(amountPerShareInput, nextRow.amountPerShare);
            rowState.set({ row: nextRow });
            replaceChildren(
              capitalRepaymentTotalCell,
              nextRow.capitalRepaymentTotalTooltip ? hoverValue(nextRow.capitalRepaymentTotal, nextRow.capitalRepaymentTotalTooltip) : nextRow.capitalRepaymentTotal
            );
            replaceChildren(
              dividendTotalCell,
              nextRow.dividendTotalTooltip ? hoverValue(nextRow.dividendTotal, nextRow.dividendTotalTooltip) : nextRow.dividendTotal
            );
            rowTextNodes.shareCountMismatch.parentElement.style.display = nextRow.shareCountMismatch ? "" : "none";
            rowNode.className = nextRow.shareCountMismatch ? String(pageStyles.mismatchRow) : "";
          }
        };
      }
    });
    const addButton = createActionButton(cashDistributionTextNodes.actions.add, "primary", () => {
      cashDistributions.append({
        type: "capital_return",
        date: "",
        amountPerShare: "",
        shareCount: ""
      });
    });
    const root = section(
      { class: "card" },
      div({ class: "heading" }, h2(cashDistributionTextNodes.title), span({ class: "muted" }, rowCountNode)),
      p({ class: "muted" }, cashDistributionTextNodes.help),
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
            th({ class: "no-print" }, "")
          )
        ),
        tbodyNode
      ),
      div({ class: "no-print" }, pageStyles.rowButtons, addButton)
    );
    return {
      root,
      set({ osakkeetCalculation, texts }) {
        const current = osakkeetCalculation.formData;
        const summariesById = Object.fromEntries(
          osakkeetCalculation.cashDistributions.map((cashDistribution) => [cashDistribution.id, cashDistribution])
        );
        textState.set({
          rowCount: `${current.cashDistributions.length} ${texts.common.rows}`
        });
        withholdingHeaderNode.title = texts.cashDistributions.fields.withholdingHelp;
        cashPaidHeaderNode.title = texts.cashDistributions.fields.cashPaidHelp;
        capitalRepaymentHeaderNode.title = texts.cashDistributions.fields.capitalRepaymentHelp;
        dividendHeaderNode.title = texts.cashDistributions.fields.dividendHelp;
        rowsState.set(
          current.cashDistributions.map((cashDistribution) => {
            const summary2 = summariesById[cashDistribution.id];
            const capitalRepaymentShares = summary2 ? summary2.allocations.reduce(
              (total, allocation) => allocation.capitalRepayment.gt(0) ? total.add(allocation.shares) : total,
              new decimal_default(0)
            ) : new decimal_default(0);
            const dividendShares = summary2 ? summary2.allocations.reduce(
              (total, allocation) => allocation.dividend.gt(0) ? total.add(allocation.shares) : total,
              new decimal_default(0)
            ) : new decimal_default(0);
            const expectedShareCount = summary2 ? amount(summary2.sharesHeld) : "";
            const givenShareCount = cashDistribution.shareCount || "";
            const hasShareCountMismatch = givenShareCount !== "" && summary2 && (Number.isNaN(Number(givenShareCount)) || Number(givenShareCount) !== Number(expectedShareCount));
            return {
              id: cashDistribution.id,
              date: cashDistribution.date,
              type: cashDistribution.type,
              shareCount: givenShareCount,
              amountPerShare: cashDistribution.amountPerShare,
              grossTotal: summary2 ? euro(summary2.grossTotal) : "-",
              withholdingToTaxOffice: summary2 ? euro(summary2.withholdingToTaxOffice) : "-",
              paidInCash: summary2 ? euro(summary2.paidInCash) : "-",
              capitalRepaymentTotal: summary2 ? euro(summary2.capitalRepaymentTotal) : "-",
              capitalRepaymentTotalTooltip: summary2 ? texts.cashDistributions.fields.capitalRepaymentSharesHelp(amount(capitalRepaymentShares)) : "",
              dividendTotal: summary2 ? euro(summary2.dividendTotal) : "-",
              dividendTotalTooltip: summary2 ? texts.cashDistributions.fields.dividendSharesHelp(amount(dividendShares)) : "",
              shareCountMismatch: hasShareCountMismatch ? texts.cashDistributions.messages.shareCountMismatch(expectedShareCount, givenShareCount) : "",
              removeLabel: texts.common.remove,
              capitalReturnLabel: texts.cashDistributions.types.capitalReturn,
              dividendLabel: texts.cashDistributions.types.dividend
            };
          })
        );
      }
    };
  }
  function createIpoSection(dataState, localizedTextNodes) {
    const viewState = createState({
      value: {
        values: {
          currentTotalValue: "",
          subscribedShares: "",
          ipoSharePrice: "",
          increasePercent: "",
          increaseMultiplier: "",
          ipoCostPerSecondaryShare: "",
          secondarySharesTotal: ""
        }
      }
    });
    const ipoTextNodes = localizedTextNodes.ipo;
    const summaryCardTextNodes = localizedTextNodes.summary.cards;
    const valueNodes = createTextNodesFromState(viewState, { path: ["values"] });
    const currentShareValueInput = numberInput("");
    const totalShareCountInput = numberInput("");
    const estimatedPreIpoValueInput = numberInput("");
    const totalIpoCostInput = numberInput("");
    const secondarySellPercentInput = numberInput("");
    const ipoDateInput = finnishDateInput("");
    mapStatePathToInput(dataState, ["ipo", "currentShareValue"], currentShareValueInput);
    mapStatePathToInput(dataState, ["ipo", "totalShareCount"], totalShareCountInput);
    mapStatePathToInput(dataState, ["ipo", "estimatedPreIpoValue"], estimatedPreIpoValueInput);
    mapStatePathToInput(dataState, ["ipo", "totalIpoCost"], totalIpoCostInput);
    mapStatePathToInput(dataState, ["ipo", "estimatedSecondaryShareSellPercentage"], secondarySellPercentInput);
    mapStatePathToInput(dataState, ["ipo", "ipoDate"], ipoDateInput);
    const root = section(
      { class: "card" },
      h2(ipoTextNodes.title),
      div(
        pageStyles.gridTwo,
        div(pageStyles.field, label(ipoTextNodes.fields.currentShareValue), currentShareValueInput),
        div(pageStyles.field, label(ipoTextNodes.fields.totalShareCount), totalShareCountInput),
        div(pageStyles.field, label(ipoTextNodes.fields.currentTotalValue), b(valueNodes.currentTotalValue)),
        div(pageStyles.field, label(summaryCardTextNodes.subscribedShares), b(valueNodes.subscribedShares))
      ),
      div(
        pageStyles.gridTwo,
        div(pageStyles.field, label(ipoTextNodes.fields.estimatedPreIpoValue), estimatedPreIpoValueInput),
        div(pageStyles.field, label(ipoTextNodes.fields.ipoSharePrice), b(valueNodes.ipoSharePrice)),
        div(pageStyles.field, label(ipoTextNodes.fields.increasePercent), b(valueNodes.increasePercent)),
        div(pageStyles.field, label(ipoTextNodes.fields.increaseMultiplier), b(valueNodes.increaseMultiplier))
      ),
      div(
        pageStyles.gridTwo,
        div(pageStyles.field, label(ipoTextNodes.fields.totalIpoCost), totalIpoCostInput),
        div(
          pageStyles.field,
          label(ipoTextNodes.fields.secondarySellPercent),
          secondarySellPercentInput,
          span({ class: "muted" }, ipoTextNodes.help.secondary)
        ),
        div(
          pageStyles.field,
          label(summaryCardTextNodes.ipoCostPerSecondaryShare),
          b(valueNodes.ipoCostPerSecondaryShare)
        ),
        div(pageStyles.field, label(summaryCardTextNodes.secondarySharesTotal), b(valueNodes.secondarySharesTotal))
      ),
      div(
        pageStyles.gridTwo,
        div(
          pageStyles.field,
          label(ipoTextNodes.fields.ipoDate),
          ipoDateInput,
          span({ class: "muted" }, ipoTextNodes.help.dateFormat)
        ),
        div(),
        div()
      )
    );
    return {
      root,
      set({ texts, osakkeetCalculation }) {
        void texts;
        viewState.set({
          values: {
            currentTotalValue: euro(osakkeetCalculation.ipo.currentTotalValue),
            subscribedShares: amount(osakkeetCalculation.ipo.totalSubscribedShares),
            ipoSharePrice: euro(osakkeetCalculation.ipo.ipoPricePerShare),
            increasePercent: percentage(osakkeetCalculation.ipo.increasePercentage),
            increaseMultiplier: multiplier(osakkeetCalculation.ipo.increaseMultiplier),
            ipoCostPerSecondaryShare: euro(osakkeetCalculation.ipo.ipoCostPerShare),
            secondarySharesTotal: amount(osakkeetCalculation.ipo.estimatedSecondaryShareCount)
          }
        });
      }
    };
  }
  function createResultsSection(dataState, localizedTextNodes) {
    const warningRoot = div();
    const ipoSellContentRoot = div(pageStyles.denseStack);
    const summaryTextNodes = localizedTextNodes.summary;
    const annualAdjustmentTaxEffectRoot = div();
    const annualAdjustmentReserveRoot = div();
    const annualAdjustmentKeepRoot = div();
    const sellInput = numberInput("");
    const otherAnnualCapitalInput = numberInput("");
    mapStatePathToInput(dataState, ["sell", "amount"], sellInput);
    mapStatePathToInput(dataState, ["sell", "otherAnnualCapitalGainsOrLosses"], otherAnnualCapitalInput);
    const annualAdjustmentInputCard = div(
      pageStyles.summaryItem,
      h3(summaryTextNodes.ipoSell.cashReserve.otherAnnualCapitalGainsOrLosses),
      div(
        pageStyles.field,
        otherAnnualCapitalInput,
        span({ class: "muted" }, summaryTextNodes.ipoSell.cashReserve.otherAnnualCapitalGainsOrLossesHelp)
      )
    );
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
    );
    const root = div(
      pageStyles.stack,
      section(
        { class: "card" },
        h2(summaryTextNodes.ipoSell.title),
        div(
          pageStyles.gridTwo,
          div(
            pageStyles.compactField,
            div(pageStyles.field, label(summaryTextNodes.ipoSell.fields.sharesToSell), sellInput)
          )
        ),
        warningRoot,
        ipoSellContentRoot,
        annualAdjustmentRoot
      )
    );
    return {
      root,
      set({ osakkeetCalculation, texts }) {
        const totalShares = osakkeetCalculation.vesting.totalShares;
        const vestedShares = osakkeetCalculation.vesting.vestedShares;
        const unvestedShares = osakkeetCalculation.vesting.unvestedShares;
        const sharePercent = (value) => totalShares.gt(0) ? `${amount(value)} (${percentage(value.div(totalShares).mul(100))})` : `${amount(value)} (0.00 %)`;
        const soldShareOriginalCost = osakkeetCalculation.sell.soldShareOriginalCostTotal;
        const soldShareAcquisitionCost = osakkeetCalculation.sell.soldShareAcquisitionCostTotal;
        const keepAfterTaxes = osakkeetCalculation.sell.netAfterTaxAndIpoCost;
        const netResultAgainstSubscriptionCost = keepAfterTaxes.minus(soldShareAcquisitionCost);
        const netResultPercent = soldShareAcquisitionCost.gt(0) ? percentage(netResultAgainstSubscriptionCost.div(soldShareAcquisitionCost).mul(100)) : "0.00 %";
        const zeroMoney = osakkeetCalculation.sell.grossTotal.mul(0);
        const totalTaxableGain = osakkeetCalculation.sell.usedSubscriptions.reduce(
          (acc, lot) => acc.add(lot.taxableGain),
          zeroMoney
        );
        const selectedHmoDeductionTotal = osakkeetCalculation.sell.selectedHmo20DeductionTotal.add(
          osakkeetCalculation.sell.selectedHmo40DeductionTotal
        );
        void texts;
        replaceChildren(
          warningRoot,
          osakkeetCalculation.errors.length > 0 && div(
            pageStyles.errorBox,
            h3(texts.messages.errorsTitle),
            ul(osakkeetCalculation.errors.map((error) => li(error)))
          ),
          osakkeetCalculation.warnings.length > 0 && div(
            pageStyles.warningBox,
            h3(texts.messages.warningsTitle),
            ul(osakkeetCalculation.warnings.map((warning) => li(warning)))
          )
        );
        replaceChildren(
          ipoSellContentRoot,
          div(
            pageStyles.summaryGrid,
            infoCard(texts.summary.ipoSell.cards.sellableShares, sharePercent(vestedShares)),
            infoCard(texts.summary.ipoSell.cards.unvestedShares, sharePercent(unvestedShares)),
            infoCard(texts.summary.ipoSell.cards.sharesLeft, amount(osakkeetCalculation.sell.remainingUnsoldShares))
          ),
          h3(texts.summary.allocationByLot.title),
          table(
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
              osakkeetCalculation.sell.usedSubscriptions.map(
                (lot) => tr(
                  td(lot.subscriptionDate || "-"),
                  td(`${amount(lot.soldAmount)} / ${amount(lot.totalSubscriptionShares)}`),
                  td(euro(lot.gross)),
                  td(
                    hoverValue(
                      euro(lot.actualDeduction),
                      texts.summary.ipoSell.tooltips.actualCosts(
                        euro(lot.realCostBasis),
                        euro(lot.allocatedIpoCost),
                        euro(lot.actualDeduction)
                      ),
                      lot.selectedMethod === "actual_costs"
                    )
                  ),
                  td(
                    hoverValue(
                      euro(lot.hankintamenoOlettaDeduction),
                      texts.summary.ipoSell.tooltips.hmo(
                        euro(lot.gross),
                        percentage(lot.hankintamenoOlettaRate.mul(100)),
                        euro(lot.hankintamenoOlettaDeduction)
                      ),
                      lot.selectedMethod === "hmo"
                    )
                  ),
                  td(lot.taxableGain.gte(0) ? euro(lot.taxableGain) : `${lot.taxableGain.toFixed(2)} \u20AC`)
                )
              ),
              tr(
                td(b(texts.summary.totalRow)),
                td(),
                td(euro(osakkeetCalculation.sell.grossTotal)),
                td(b(euro(osakkeetCalculation.sell.selectedActualDeductionTotal))),
                td(b(euro(selectedHmoDeductionTotal))),
                td(euro(totalTaxableGain))
              )
            ])
          ),
          h3(texts.summary.ipoSell.explanations.title),
          div(
            pageStyles.summaryGrid,
            infoCard(
              texts.summary.ipoSell.explanations.ipoPriceTotal,
              euro(osakkeetCalculation.sell.grossTotal),
              texts.summary.ipoSell.explanations.ipoPriceTotalHelp(euro(osakkeetCalculation.sell.grossTotal))
            ),
            infoCard(
              texts.summary.ipoSell.explanations.ipoCostsAllocated,
              euro(osakkeetCalculation.sell.totalIpoCostAllocated),
              texts.summary.ipoSell.explanations.ipoCostsAllocatedHelp(
                euro(osakkeetCalculation.sell.totalIpoCostAllocated)
              )
            ),
            infoCard(
              texts.summary.ipoSell.explanations.netCash,
              euro(osakkeetCalculation.sell.cashAfterIpoCosts),
              texts.summary.ipoSell.explanations.netCashHelp(
                euro(osakkeetCalculation.sell.grossTotal),
                euro(osakkeetCalculation.sell.totalIpoCostAllocated),
                euro(osakkeetCalculation.sell.cashAfterIpoCosts)
              )
            )
          ),
          h3(texts.summary.ipoSell.capitalGainAnnualTax.title),
          div(
            pageStyles.summaryGrid,
            infoCard(
              texts.summary.ipoSell.capitalGainAnnualTax.driversTitle,
              texts.summary.ipoSell.capitalGainAnnualTax.driversValue,
              texts.summary.ipoSell.capitalGainAnnualTax.driversHelp
            ),
            infoCard(
              texts.summary.ipoSell.explanations.selectedDeductions,
              euro(osakkeetCalculation.sell.selectedDeductionTotal),
              texts.summary.ipoSell.explanations.selectedDeductionsHelp(
                euro(osakkeetCalculation.sell.selectedActualDeductionTotal),
                euro(selectedHmoDeductionTotal)
              )
            ),
            infoCard(
              texts.summary.ipoSell.explanations.capitalGain,
              euro(osakkeetCalculation.sell.taxableGainTotal),
              texts.summary.ipoSell.explanations.capitalGainHelp(
                euro(osakkeetCalculation.sell.grossTotal),
                euro(osakkeetCalculation.sell.selectedDeductionTotal)
              )
            ),
            infoCard(
              texts.summary.ipoSell.explanations.taxOnCapitalGain,
              euro(osakkeetCalculation.sell.estimatedTax),
              texts.summary.ipoSell.explanations.taxOnCapitalGainHelp(
                euro(osakkeetCalculation.sell.taxableGainTotal),
                euro(osakkeetCalculation.sell.taxableGainAtLowRate),
                euro(osakkeetCalculation.sell.taxableGainAtHighRate),
                euro(osakkeetCalculation.sell.estimatedTax)
              )
            )
          ),
          h3(texts.summary.ipoSell.cashReserve.title),
          div(
            pageStyles.summaryGrid,
            infoCard(
              texts.summary.ipoSell.cashReserve.keepAfterTaxes,
              euro(osakkeetCalculation.sell.netAfterTaxAndIpoCost),
              texts.summary.ipoSell.cashReserve.keepAfterTaxesHelp(
                euro(osakkeetCalculation.sell.cashAfterIpoCosts),
                euro(osakkeetCalculation.sell.estimatedTax),
                euro(osakkeetCalculation.sell.netAfterTaxAndIpoCost)
              )
            ),
            infoCard(
              texts.summary.ipoSell.cashReserve.reserveForTaxes,
              euro(osakkeetCalculation.sell.estimatedTax),
              texts.summary.ipoSell.cashReserve.reserveForTaxesHelp(euro(osakkeetCalculation.sell.estimatedTax))
            ),
            infoCard(
              texts.summary.ipoSell.cashReserve.taxPaymentStatus,
              texts.summary.ipoSell.cashReserve.taxPaymentManual,
              texts.summary.ipoSell.cashReserve.taxPaymentStatusHelp
            )
          ),
          h3(texts.summary.ipoSell.saleResultComparison.title),
          div(
            pageStyles.summaryGrid,
            infoCard(
              texts.summary.ipoSell.saleResultComparison.cardTitle,
              texts.summary.ipoSell.saleResultComparison.value(
                euro(soldShareOriginalCost),
                euro(soldShareAcquisitionCost),
                euro(netResultAgainstSubscriptionCost),
                netResultPercent
              ),
              texts.summary.ipoSell.saleResultComparison.help(
                euro(soldShareOriginalCost),
                euro(soldShareAcquisitionCost),
                euro(keepAfterTaxes),
                euro(netResultAgainstSubscriptionCost),
                netResultPercent
              )
            )
          ),
          h3(texts.summary.ipoSell.ipoCostEffects.title),
          div(
            pageStyles.summaryGrid,
            infoCard(
              texts.summary.ipoSell.explanations.deductibleIpoCosts,
              euro(osakkeetCalculation.sell.taxSavedFromDeductibleIpoCosts),
              texts.summary.ipoSell.explanations.deductibleIpoCostsHelp(
                euro(osakkeetCalculation.sell.ipoCostDeductedViaActual),
                euro(osakkeetCalculation.sell.taxSavedFromDeductibleIpoCosts)
              )
            ),
            infoCard(
              texts.summary.ipoSell.explanations.hmoIpoCosts,
              euro(osakkeetCalculation.sell.ipoCostPaidWithoutActualDeduction),
              texts.summary.ipoSell.explanations.hmoIpoCostsHelp()
            )
          )
        );
        replaceChildren(
          annualAdjustmentTaxEffectRoot,
          infoCard(
            texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapital,
            osakkeetCalculation.sell.taxReductionFromOtherLosses.gt(0) ? euro(osakkeetCalculation.sell.taxReductionFromOtherLosses) : osakkeetCalculation.sell.annualTaxChange.gt(0) ? `+${euro(osakkeetCalculation.sell.annualTaxChange)}` : euro(osakkeetCalculation.sell.grossTotal.mul(0)),
            texts.summary.ipoSell.cashReserve.taxEffectFromOtherAnnualCapitalHelp(
              euro(osakkeetCalculation.sell.otherAnnualCapitalGainsOrLosses),
              euro(osakkeetCalculation.sell.taxReductionFromOtherLosses),
              euro(decimal_default.max(osakkeetCalculation.sell.annualTaxChange, osakkeetCalculation.sell.grossTotal.mul(0)))
            )
          )
        );
        replaceChildren(
          annualAdjustmentReserveRoot,
          infoCard(
            texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxes,
            euro(osakkeetCalculation.sell.annualEstimatedTax),
            texts.summary.ipoSell.cashReserve.annualAdjustedReserveForTaxesHelp(
              euro(osakkeetCalculation.sell.annualEstimatedTax)
            )
          )
        );
        replaceChildren(
          annualAdjustmentKeepRoot,
          infoCard(
            texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxes,
            euro(osakkeetCalculation.sell.netAfterAnnualTaxAndIpoCost),
            texts.summary.ipoSell.cashReserve.annualAdjustedKeepAfterTaxesHelp(
              euro(osakkeetCalculation.sell.cashAfterIpoCosts),
              euro(osakkeetCalculation.sell.annualEstimatedTax),
              euro(osakkeetCalculation.sell.netAfterAnnualTaxAndIpoCost)
            )
          )
        );
      }
    };
  }
  function createIntroSection(languageSelectionState, localizedTextNodes) {
    const introTextNodes = localizedTextNodes.intro;
    const languageSwitchTextNodes = localizedTextNodes.languageSwitch;
    const assumptionsRoot = div();
    const fiButton = button(
      "FI",
      pageStyles.smallButton,
      events({
        click() {
          languageSelectionState.set("fi");
        }
      })
    );
    const enButton = button(
      "EN",
      pageStyles.smallButton,
      events({
        click() {
          languageSelectionState.set("en");
        }
      })
    );
    const root = section(
      { class: "card" },
      div(
        { class: "heading" },
        h2(introTextNodes.title),
        div(
          { class: "no-print" },
          pageStyles.rowButtons,
          span({ class: "muted" }, languageSwitchTextNodes.label),
          fiButton,
          enButton
        )
      ),
      p({ class: "muted" }, introTextNodes.description),
      p({ class: "muted" }, introTextNodes.unlistedDescription),
      div(
        pageStyles.denseStack,
        h3(introTextNodes.securityTitle),
        p(pageStyles.compactParagraph, { class: "muted" }, introTextNodes.securityText),
        p(pageStyles.compactParagraph, { class: "muted" }, introTextNodes.securityAdditionalText),
        p(pageStyles.redNote, pageStyles.compactParagraph, introTextNodes.securityNote),
        p(pageStyles.compactParagraph, { class: "muted" }, introTextNodes.securityIssues)
      ),
      assumptionsRoot
    );
    return {
      root,
      set({ languageSelection, texts }) {
        void texts;
        setButtonVariant(fiButton, languageSelection === "fi");
        setButtonVariant(enButton, languageSelection === "en");
        replaceChildren(assumptionsRoot, assumptionsContent(texts));
      }
    };
  }
  function createStickyWarningsSection(localizedTextNodes) {
    const introTextNodes = localizedTextNodes.intro;
    const warningListRoot = ul();
    const root = div(pageStyles.stickyWarningBox, h3(introTextNodes.warningsTitle), warningListRoot);
    return {
      root,
      set({ texts }) {
        void texts;
        replaceChildren(
          warningListRoot,
          texts.intro.warnings.map((warning) => li(warning))
        );
      }
    };
  }
  function createToolbarSection(dataState, localizedTextNodes) {
    const viewState = createState({
      value: {
        status: ""
      }
    });
    const storageTextNodes = localizedTextNodes.storage;
    const statusNode = createTextNodesFromState(viewState, { path: ["status"] });
    let currentTexts = getOsakkeetLocalization(tryLoadLanguage());
    const setStatus = (status) => {
      viewState.set((current) => ({ ...current, status }));
    };
    const refreshStorageButtons = () => {
      const currentSerialized = serializeOsakkeetFormData(dataState.get());
      const browserSerialized = tryStorageGet(localStorage, storageKeys.browserFormData);
      const lastFileSavedHash = tryStorageGet(sessionStorage, storageKeys.lastFileSavedHash);
      const browserNeedsSave = browserSerialized !== currentSerialized;
      const hasBrowserSavedData = !!browserSerialized;
      const fileNeedsSave = lastFileSavedHash !== currentSerialized;
      setButtonAttention(saveToBrowserStorageButton, browserNeedsSave);
      setButtonAttention(saveFileButton, fileNeedsSave);
      setButtonDisabled(loadFromBrowserStorageButton, !hasBrowserSavedData);
      setButtonDisabled(removeFromBrowserStorageButton, !hasBrowserSavedData);
      saveToBrowserStorageButton.title = browserNeedsSave ? currentTexts.storage.saveIndicators.browserNeedsSave : currentTexts.storage.saveIndicators.browserSaved;
      loadFromBrowserStorageButton.title = hasBrowserSavedData ? currentTexts.storage.actions.loadFromBrowserStorage : currentTexts.storage.saveIndicators.browserLoadUnavailable;
      removeFromBrowserStorageButton.title = hasBrowserSavedData ? currentTexts.storage.actions.removeFromBrowserStorage : currentTexts.storage.saveIndicators.browserLoadUnavailable;
      saveFileButton.title = fileNeedsSave ? currentTexts.storage.saveIndicators.fileNeedsSave : currentTexts.storage.saveIndicators.fileSaved;
    };
    const fileInput = input(
      { type: "file", accept: "application/json,.json", hidden: true },
      events({
        change({ node }) {
          var _a2;
          const inputNode = node;
          const file = (_a2 = inputNode.files) == null ? void 0 : _a2[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(String(reader.result || "{}"));
              const normalized = normalizeLoadedData(parsed);
              dataState.set(normalized);
              tryStorageSet(sessionStorage, storageKeys.lastFileSavedHash, serializeOsakkeetFormData(normalized));
              setStatus(currentTexts.storage.status.loaded);
              refreshStorageButtons();
            } catch {
              setStatus(currentTexts.storage.errors.invalidFile);
            }
            inputNode.value = "";
          };
          reader.onerror = () => {
            setStatus(currentTexts.storage.errors.fileReadFailed);
            inputNode.value = "";
          };
          reader.readAsText(file);
        }
      })
    );
    const buttonConfigs = [
      {
        labelNode: storageTextNodes.actions.saveFile,
        variant: "secondary",
        action: () => {
          const blob = new Blob([JSON.stringify(sanitizeOsakkeetFormData(dataState.get()), null, 2)], {
            type: "application/json"
          });
          const serialized = serializeOsakkeetFormData(dataState.get());
          const url = URL.createObjectURL(blob);
          const link2 = document.createElement("a");
          link2.href = url;
          link2.download = "osakkeet-input-state.json";
          link2.click();
          URL.revokeObjectURL(url);
          tryStorageSet(sessionStorage, storageKeys.lastFileSavedHash, serialized);
          setStatus(currentTexts.storage.status.fileSaved);
          refreshStorageButtons();
        }
      },
      {
        labelNode: storageTextNodes.actions.saveToBrowserStorage,
        variant: "secondary",
        action: () => {
          tryStorageSet(localStorage, storageKeys.browserFormData, serializeOsakkeetFormData(dataState.get()));
          setStatus(currentTexts.storage.status.browserSaved);
          refreshStorageButtons();
        }
      },
      {
        labelNode: storageTextNodes.actions.loadFromBrowserStorage,
        variant: "secondary",
        action: () => {
          const saved = tryStorageGet(localStorage, storageKeys.browserFormData);
          if (!saved) return;
          try {
            const parsed = JSON.parse(saved);
            dataState.set(normalizeLoadedData(parsed));
            setStatus(currentTexts.storage.status.browserLoaded);
            refreshStorageButtons();
          } catch {
            setStatus(currentTexts.storage.errors.invalidFile);
          }
        }
      },
      {
        labelNode: storageTextNodes.actions.removeFromBrowserStorage,
        variant: "secondary",
        action: () => {
          tryStorageRemove(localStorage, storageKeys.browserFormData);
          setStatus(currentTexts.storage.status.browserRemoved);
          refreshStorageButtons();
        }
      },
      {
        labelNode: storageTextNodes.actions.loadFile,
        variant: "secondary",
        action: () => {
          fileInput.click();
        }
      },
      {
        labelNode: storageTextNodes.actions.showSmallExample,
        variant: "secondary",
        action: () => {
          dataState.set(createExampleOsakkeetFormData("small2y"));
          setStatus(currentTexts.storage.status.exampleShown);
        }
      },
      {
        labelNode: storageTextNodes.actions.showMediumExample,
        variant: "secondary",
        action: () => {
          dataState.set(createExampleOsakkeetFormData("medium8y"));
          setStatus(currentTexts.storage.status.exampleShown);
        }
      },
      {
        labelNode: storageTextNodes.actions.showLargeExample,
        variant: "secondary",
        action: () => {
          dataState.set(createExampleOsakkeetFormData("large16y"));
          setStatus(currentTexts.storage.status.exampleShown);
        }
      },
      {
        labelNode: storageTextNodes.actions.clearExample,
        variant: "secondary",
        action: () => {
          if (!window.confirm(currentTexts.storage.confirmations.clearExample)) {
            return;
          }
          dataState.set(createOsakkeetFormData(false));
          setStatus(currentTexts.storage.status.exampleCleared);
        }
      },
      {
        labelNode: storageTextNodes.actions.copyShareUrl,
        variant: "secondary",
        action: () => {
          void copyTextToClipboard(buildShareUrl(dataState.get())).then(
            (copied) => {
              setStatus(copied ? currentTexts.storage.status.shareUrlCopied : currentTexts.storage.errors.clipboardFailed);
            },
            () => {
              setStatus(currentTexts.storage.errors.clipboardFailed);
            }
          );
        }
      }
    ];
    const [
      saveFileButton,
      saveToBrowserStorageButton,
      loadFromBrowserStorageButton,
      removeFromBrowserStorageButton,
      loadFileButton,
      smallExampleButton,
      mediumExampleButton,
      largeExampleButton,
      clearExampleButton,
      copyShareUrlButton
    ] = buttonConfigs.map(({ labelNode, variant, action }) => createActionButton(labelNode, variant, action));
    dataState.onValueChange(() => {
      refreshStorageButtons();
    });
    refreshStorageButtons();
    const root = div(
      { class: "card no-print" },
      div({ class: "heading" }, h2(storageTextNodes.title), span({ class: "muted" }, statusNode)),
      fileInput,
      table(
        pageStyles.storageTable,
        thead(
          tr(
            th(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.rowTitle),
            th(pageStyles.storageCellTop, pageStyles.storageActionsCell, storageTextNodes.table.actionsTitle),
            th(pageStyles.storageCellTop, pageStyles.storageDescriptionCell, storageTextNodes.table.descriptionTitle)
          )
        ),
        tbody(
          tr(
            td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.autoSaveTitle),
            td(pageStyles.storageCellTop, pageStyles.storageActionsCell),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageDescriptionCell,
              span({ class: "muted" }, storageTextNodes.table.autoSaveDescription)
            )
          ),
          tr(
            td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.fileTitle),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageActionsCell,
              div(pageStyles.topAlignedRowButtons, saveFileButton, loadFileButton)
            ),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageDescriptionCell,
              span({ class: "muted" }, storageTextNodes.table.fileDescription)
            )
          ),
          tr(
            td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.browserTitle),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageActionsCell,
              div(
                pageStyles.topAlignedRowButtons,
                saveToBrowserStorageButton,
                loadFromBrowserStorageButton,
                removeFromBrowserStorageButton
              )
            ),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageDescriptionCell,
              span({ class: "muted" }, storageTextNodes.table.browserDescription)
            )
          ),
          tr(
            td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.clearTitle),
            td(pageStyles.storageCellTop, pageStyles.storageActionsCell, clearExampleButton),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageDescriptionCell,
              span({ class: "muted" }, storageTextNodes.table.clearDescription)
            )
          ),
          tr(
            td(pageStyles.storageCellTop, pageStyles.storageLabelCell, storageTextNodes.table.exampleTitle),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageActionsCell,
              div(pageStyles.topAlignedRowButtons, smallExampleButton, mediumExampleButton, largeExampleButton)
            ),
            td(
              pageStyles.storageCellTop,
              pageStyles.storageDescriptionCell,
              span({ class: "muted" }, storageTextNodes.table.exampleDescription)
            )
          )
        )
      ),
      div(
        pageStyles.rightAlignedActions,
        div(
          pageStyles.actionGroup,
          copyShareUrlButton,
          span({ class: "muted" }, storageTextNodes.copyShareUrlHelp),
          span(pageStyles.redNote, storageTextNodes.copyShareUrlNote)
        )
      )
    );
    return {
      root,
      set({ texts }) {
        currentTexts = texts;
        refreshStorageButtons();
      }
    };
  }
  function createTaxSummarySection(dataState, localizedTextNodes) {
    const taxReturnsTextNodes = localizedTextNodes.taxReturns;
    const mathematicalShareValuesEditor = createMathematicalShareValuesEditor(dataState, localizedTextNodes);
    const resultsRoot = div(pageStyles.denseStack);
    const root = section(
      { class: "card" },
      h2(taxReturnsTextNodes.title),
      mathematicalShareValuesEditor.root,
      resultsRoot
    );
    return {
      root,
      set({ texts, osakkeetCalculation }) {
        void texts;
        mathematicalShareValuesEditor.set({ texts, osakkeetCalculation });
        replaceChildren(resultsRoot, taxSummarySection(osakkeetCalculation, texts));
      }
    };
  }
  function osakkeetIpoCalculatorPage() {
    const dataState = createState({ value: tryLoadInitialData() });
    const languageSelectionState = createState({ value: tryLoadLanguage() });
    const localizationTexts = languageSelectionState.map(
      (languageSelection) => getOsakkeetLocalization(languageSelection)
    );
    const localizedTextNodes = createTextNodesFromState(localizationTexts);
    const pageReadState = mergeStates(
      { formData: dataState, languageSelection: languageSelectionState, texts: localizationTexts },
      ({ formData, languageSelection, texts }) => {
        return {
          formData,
          languageSelection,
          osakkeetCalculation: calculateOsakkeet(formData, texts),
          texts
        };
      }
    );
    const stickyWarningsSection = createStickyWarningsSection(localizedTextNodes);
    const introSection = createIntroSection(languageSelectionState, localizedTextNodes);
    const toolbarSection = createToolbarSection(dataState, localizedTextNodes);
    const subscriptionsSection = createSubscriptionsSection(
      dataState,
      localizedTextNodes,
      createTextNodesFromState(localizationTexts, { path: ["common"] })
    );
    const cashDistributionsSection = createCashDistributionsSection(
      dataState,
      localizedTextNodes,
      createTextNodesFromState(localizationTexts, { path: ["common"] })
    );
    const demergersSection = createDemergersSection(
      dataState,
      localizedTextNodes,
      createTextNodesFromState(localizationTexts, { path: ["common"] })
    );
    const shareSplitsSection = createShareSplitsSection(
      dataState,
      localizedTextNodes,
      createTextNodesFromState(localizationTexts, { path: ["common"] })
    );
    const taxSummarySectionController = createTaxSummarySection(dataState, localizedTextNodes);
    const ipoSection = createIpoSection(dataState, localizedTextNodes);
    const resultsSection = createResultsSection(dataState, localizedTextNodes);
    const root = div(pageStyles.stack);
    const applyPageReadModel = (pageReadModel) => {
      stickyWarningsSection.set(pageReadModel);
      introSection.set(pageReadModel);
      toolbarSection.set(pageReadModel);
      subscriptionsSection.set(pageReadModel);
      cashDistributionsSection.set(pageReadModel);
      demergersSection.set(pageReadModel);
      shareSplitsSection.set(pageReadModel);
      taxSummarySectionController.set(pageReadModel);
      ipoSection.set(pageReadModel);
      resultsSection.set(pageReadModel);
    };
    persistState(languageSelectionState, {
      storage: localStorage,
      key: storageKeys.language,
      serialize: (languageSelection) => languageSelection,
      deserialize: (raw) => raw === "en" ? "en" : "fi",
      hydrate: false
    });
    persistState(dataState, {
      storage: sessionStorage,
      key: storageKeys.windowFormData,
      serialize: serializeOsakkeetFormData,
      deserialize: (raw) => normalizeLoadedData(JSON.parse(raw)),
      hydrate: false
    });
    pageReadState.onValueChange(applyPageReadModel);
    const initialPageReadModel = pageReadState.get();
    applyPageReadModel(initialPageReadModel);
    replaceChildren(
      root,
      stickyWarningsSection.root,
      introSection.root,
      toolbarSection.root,
      subscriptionsSection.root,
      cashDistributionsSection.root,
      demergersSection.root,
      shareSplitsSection.root,
      taxSummarySectionController.root,
      ipoSection.root,
      resultsSection.root
    );
    return root;
  }

  // src/kotibudjetti.ts
  console.log("kotibudjetti v0.0.1");
  function getRoute() {
    return window.location.hash === "#kaukolampo" ? "kaukolampo" : "osakkeet";
  }
  function setRoute(route) {
    window.location.hash = route === "kaukolampo" ? "#kaukolampo" : "#osakkeet";
  }
  function navButton(label2, route, routeState) {
    return button(
      label2,
      routeState.get() === route && {
        class: "active"
      },
      events({
        click() {
          setRoute(route);
        }
      })
    );
  }
  function sidebarNavigation(routeState) {
    return div(
      div({ class: "brand" }, h1("Kotibudjetti"), p("Laskurit")),
      p({ class: "muted" }, "Beta"),
      div(
        { class: "nav" },
        navButton("Osakkeet", "osakkeet", routeState),
        navButton("Kaukol\xE4mp\xF6", "kaukolampo", routeState)
      )
    );
  }
  function ensureBottomNav(routeState) {
    const existingBottomNav = document.querySelector(".bottom-nav");
    if (existingBottomNav instanceof HTMLElement) return existingBottomNav;
    const bottomNav = div({ class: "bottom-nav no-print" });
    document.body.appendChild(bottomNav);
    replaceChildren(
      bottomNav,
      navButton("Osakkeet", "osakkeet", routeState),
      navButton("Kaukol\xE4mp\xF6", "kaukolampo", routeState)
    );
    return bottomNav;
  }
  function mountApp() {
    const routeState = createState({ value: getRoute() });
    const sidebar = document.querySelector(".sidebar");
    const bottomNav = ensureBottomNav(routeState);
    window.addEventListener("hashchange", () => {
      routeState.set(getRoute());
    });
    routeState.onValueChange((route) => {
      if (sidebar instanceof HTMLElement) {
        replaceChildren(sidebar, sidebarNavigation(routeState));
      }
      replaceChildren(
        bottomNav,
        navButton("Osakkeet", "osakkeet", routeState),
        navButton("Kaukol\xE4mp\xF6", "kaukolampo", routeState)
      );
      setElementToId("app", route === "kaukolampo" ? kaukolampoExcessPricingCalculator() : osakkeetIpoCalculatorPage());
    });
  }
  mountApp();
})();
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
