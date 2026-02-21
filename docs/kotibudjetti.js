"use strict";
(() => {
  // ../ki-frame/src/domBuilderEvents.ts
  var Events = class {
    constructor(events2) {
      this.events = events2;
    }
  };
  function events(events2) {
    return new Events(events2 instanceof Events || "events" in events2 ? events2.events : events2);
  }
  function setEvents(node, arg) {
    const ev = arg instanceof Events ? arg : events(arg);
    Object.entries(ev.events).forEach(([key, fn]) => {
      node.addEventListener(key, (event) => {
        fn == null ? void 0 : fn({ node, event });
      });
    });
  }

  // ../ki-frame/src/util/typeUtils.ts
  function isDefined(item) {
    return item !== void 0 && item !== null;
  }

  // ../ki-frame/src/domBuilderStyles.ts
  function setClass(element, argValue) {
    const classList = element.classList;
    const visit = (argValue2) => {
      if (Array.isArray(argValue2)) {
        argValue2.forEach((arg) => visit(arg));
      } else {
        classList.add(...argValue2.split(" "));
      }
    };
    visit(argValue);
  }
  function styles(...inputs) {
    const flat = {};
    for (const input2 of Array.from(inputs).flat()) {
      if (input2 instanceof Styles) {
        Object.assign(flat, input2.styles);
      } else {
        Object.assign(flat, input2);
      }
    }
    return new Styles(flat);
  }
  var Styles = class {
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
  function setStyle(el, ...inputs) {
    for (const style2 of inputs) {
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
  function addItems(element, ...args) {
    args.forEach((arg) => {
      if (arg === false || arg === void 0) {
      } else if (Array.isArray(arg)) {
        addItems(element, ...arg);
      } else if (isNode(arg)) {
        element.appendChild(arg);
      } else if (arg instanceof WrappedNode) {
        element.appendChild(arg.node);
      } else if (arg instanceof Styles) {
        setStyle(element, arg.styles);
      } else if (arg instanceof Events) {
        setEvents(element, arg);
      } else if (typeof arg === "string" || typeof arg === "number") {
        element.appendChild(getDocument().createTextNode(String(arg)));
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
  var doc = typeof document !== "undefined" ? document : void 0;
  var isNode = (e) => {
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
    addItems(element, ...args);
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
  var createInputFn = (type) => (...args) => createElement("input", { type }, ...args);
  var inputButton = createInputFn("button");
  var checkbox = createInputFn("checkbox");
  var color = createInputFn("color");
  var date = createInputFn("date");
  var datetimeLocal = createInputFn("datetime-local");
  var email = createInputFn("email");
  var hidden = createInputFn("hidden");
  var image = createInputFn("image");
  var month = createInputFn("month");
  var number = createInputFn("number");
  var password = createInputFn("password");
  var radio = createInputFn("radio");
  var range = createInputFn("range");
  var reset = createInputFn("reset");
  var inputSearch = createInputFn("search");
  var submit = createInputFn("submit");
  var tel = createInputFn("tel");
  var inputText = createInputFn("text");
  var inputTime = createInputFn("time");
  var url = createInputFn("url");
  var week = createInputFn("week");
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
  P[Symbol.for("nodejs.util.inspect.custom")] = P.toString;
  P[Symbol.toStringTag] = "Decimal";
  var Decimal = P.constructor = clone(DEFAULTS);
  LN10 = new Decimal(LN10);
  PI = new Decimal(PI);
  var decimal_default = Decimal;

  // ../ki-frame/src/util/objectIdCounter.ts
  var runningId = 0;
  function createId(id) {
    return `${id}-${runningId++}`;
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
    function visit(node, pathParts) {
      if (node == null) return;
      if (node instanceof FormsInput) {
        const path = pathParts.map((p2) => String(p2)).join(".");
        out.push([path, node]);
        return;
      }
      if (Array.isArray(node)) {
        for (let i2 = 0; i2 < node.length; i2++) {
          visit(node[i2], [...pathParts, i2]);
        }
        return;
      }
      if (typeof node === "object") {
        for (const key of Object.keys(node)) {
          visit(node[key], [...pathParts, key]);
        }
        return;
      }
    }
    visit(root, []);
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
    constructor(url2, timeoutMs, promise, destroy) {
      super(promise, destroy);
      this.url = url2;
      this.timeoutMs = timeoutMs;
      this.promise = promise;
      this.destroy = destroy;
    }
  };

  // ../ki-frame/src/util/getByPath.ts
  function getByPath(obj, path) {
    if (obj == null) return void 0;
    let segments = [];
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

  // ../ki-frame/src/state.ts
  function shallowEqual(a2, b2) {
    return a2 === b2;
  }
  var Context = class {
    constructor(parent, controllers = new DestroyableSet("weak")) {
      this.parent = parent;
      this.controllers = controllers;
    }
    createController(options) {
      const controller = new Controller(this, options);
      this.controllers.add(controller);
      return controller;
    }
    createState(initialValue, options) {
      const state = new State(this, initialValue, options);
      this.controllers.add(state);
      return state;
    }
    createForm(t, initValuesOrLinkedState, options) {
      const form2 = new FormState(this, t, initValuesOrLinkedState, options);
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
    constructor(parent, options) {
      super(parent, new DestroyableSet());
      this._destroyed = false;
      this.registeredSources = new DestroyableSet();
      this.onDestroyListeners = new DestroyableSet();
      this.linkedStates = /* @__PURE__ */ new Set();
      this.eventSources = [];
      const { name = "state", weakRef = false } = options != null ? options : {};
      this.options = { name, weakRef };
      this._stateId = createId(name);
    }
    getOutputChannel() {
      if (!isDefined(this.outputChannel)) {
        this.outputChannel = new Channel(`${this.stateId}-onChange`);
      }
      return this.outputChannel;
    }
    get stateId() {
      return this._stateId;
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
    fetch(url2, fetchOptions) {
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
      const response = fetch(url2, { ...fetchInit, signal: abortController == null ? void 0 : abortController.signal });
      const maybeOkResponse = assertOk ? response.then((response2) => {
        if (typeof assertOk === "function" && assertOk(response2) === false || !response2.ok) {
          const cause = { errorResponse: response2 };
          throw cause;
        }
        return response2;
      }) : response;
      const unregisterDestroyableAndCallItsDestroy = this.registeredSources.add(
        new FetchDestroyable(url2, timeoutMs, maybeOkResponse, () => {
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
  var State = class extends Controller {
    constructor(parent, initialValue, options) {
      super(parent, options);
      this.value = initialValue;
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
    set(newObj) {
      if (this.destroyed) throw new Error(this.idTxt("State destroyed. Cannot set() value"));
      const old = this.value;
      const finalObj = typeof newObj === "function" ? newObj(this.value) : newObj;
      if (shallowEqual(old, finalObj)) return;
      this.value = finalObj;
      this.getOnChange().publish(finalObj, old);
    }
    update(update) {
      if (this.destroyed) throw new Error(this.idTxt("State destroyed. Cannot update() value"));
      if (typeof this.value !== "object") {
      }
      const finalUpdate = typeof update === "function" ? update(this.value) : update;
      this.set({ ...this.value, ...finalUpdate });
    }
    onValueChange(cb) {
      if (this.destroyed) throw new Error(this.idTxt("Cannot subscribe to destroyed state"));
      return this.getOnChange().subscribe(cb);
    }
    destroy() {
      var _a2;
      super.destroy();
      (_a2 = this.onChange) == null ? void 0 : _a2.destroy();
    }
  };
  var FormState = class extends State {
    constructor(parent, t, initValuesOrLinkedState, options) {
      const { validate, ...stateOptions } = options || {};
      const inputs = collectFormsInputs(t);
      if (initValuesOrLinkedState instanceof State) {
        const initState = initValuesOrLinkedState.get();
        const init = {};
        inputs.forEach(([path]) => setByPath(init, path, getByPath(initState, path)));
        super(parent, init, stateOptions);
        this.configureInputs(this, inputs);
        this.onValueChange((newState) => {
          if (validate && !validate(newState)) {
            return;
          }
          initValuesOrLinkedState.update(newState);
        });
      } else {
        super(parent, initValuesOrLinkedState, stateOptions);
        if (validate) {
          const validInputValuesState = this.createState(initValuesOrLinkedState, { name: "valid input values" });
          validInputValuesState.onValueChange((newState) => {
            if (!validate(newState)) {
              return;
            }
            this.set(newState);
          });
          this.configureInputs(validInputValuesState, inputs);
        } else {
          this.configureInputs(this, inputs);
        }
      }
    }
    configureInputs(inputState, inputs) {
      for (const [path, input2] of inputs) {
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

  // src/kaukolampo/formatting.ts
  var printPower = (n) => n.toFixed(3);
  var printMoney = (n) => n.toFixed(2);

  // src/kaukolampo/range.ts
  function range2(from, to) {
    return Array.from({ length: to - from + 1 }, (_, i2) => from + i2);
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
    let multiplier = decimal_default(1);
    if (endDate <= startDate) return { multiplier, company, segments: [] };
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
      multiplier = multiplier.mul(segmentInterest);
      segments.push({ start: segStart, end: segEnd, annual, days, multiplier: segmentInterest });
    }
    return { multiplier, company, segments };
  }

  // src/kaukolampo/kaukolampoBilling.ts
  var ymToIndex = (ym) => ym.year * 12 + (ym.month - 1);
  var indexToYm = (idx) => {
    const year = Math.floor(idx / 12);
    const month2 = idx % 12 + 1;
    return { year, month: month2 };
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
  var months = range2(1, 12);
  function calculateMonthlyYearlyTotals(years, monthlyPricing, powerUsage) {
    const totalsByYear = {};
    const monthSummary = {};
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
      months.forEach((month2) => {
        const index2 = ymToIndex({ year, month: month2 });
        const usedPower = powerUsage[index2];
        if (usedPower) {
          const price = monthlyPricing[index2];
          const usedPowerPrice = usedPower.mul(price.powerPrice);
          const prevPrice = monthlyPricing[index2 - 1] || price;
          const total = usedPowerPrice.add(price.monthlyFee);
          monthSummary[index2] = {
            ...price,
            usedPower,
            usedPowerPrice,
            monthlyMWPriceDelta: price.powerPrice.sub(prevPrice.powerPrice).toNumber(),
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
    return { totalsByYear, monthSummary };
  }
  function calculatePaybackInterest(excessYears, originalBills, totalsByYear) {
    let excessTotal = decimal_default(0);
    let paybackInterestTotal = decimal_default(0);
    const months2 = excessYears.flatMap((year) => {
      const yearTotal = totalsByYear[year].calculatedTotals;
      return range2(1, 12).map((month2) => {
        const index = ymToIndex({ year, month: month2 });
        const originalBill = originalBills[index];
        const originalTotal = originalBill.usedPower.mul(originalBill.powerPrice).plus(originalBill.monthlyFee);
        const adjustedTotal = originalBill.usedPower.mul(yearTotal.avgPowerPrice).plus(yearTotal.avgMonthlyFee);
        const excess = originalTotal.minus(adjustedTotal);
        const interestMultiplier = calculateViivastyskorkoMultiplier(
          toDateISO(`${year}-${month2}-1`),
          toDateISO(`${year}-${month2}-1`),
          true
        );
        const interest = excess.mul(decimal_default(interestMultiplier.multiplier).minus(1));
        excessTotal = excessTotal.add(excess);
        paybackInterestTotal = paybackInterestTotal.add(interest);
        return {
          date: `${year}.${month2}`,
          originalBill,
          originalTotal,
          adjustedTotal,
          excess,
          interest
        };
      });
    });
    return { excessTotal, paybackInterestTotal, months: months2 };
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
    const month2 = Number(ymMatch[2]);
    if (!Number.isInteger(year) || !Number.isInteger(month2) || month2 < 1 || month2 > 12) {
      throw new Error(`invalid year-month anchor: "${first}"`);
    }
    const from = { year, month: month2 };
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
  var borderLeft = { styles: { borderLeft: "2px solid #6b7280" } };
  function BillItemTDs() {
    const power = td(borderLeft);
    const mwPrice = td();
    const powerPrice = td();
    const monthlyFee = td();
    const total = b();
    const setText = (info) => {
      addItems(power, (info == null ? void 0 : info.usedPower) ? printPower(info.usedPower) : "");
      addItems(mwPrice, (info == null ? void 0 : info.powerPrice) ? printMoney(info == null ? void 0 : info.powerPrice) : "", showIncrease(info.monthlyMWPriceDelta));
      addItems(powerPrice, (info == null ? void 0 : info.usedPowerPrice) ? printMoney(info.usedPowerPrice) : "");
      addItems(monthlyFee, (info == null ? void 0 : info.monthlyFee) ? printMoney(info.monthlyFee) : "", showIncrease(info.monthlyFeeDelta));
      addItems(total, info.total ? printMoney(info.total) : "");
    };
    return {
      billTDList: [power, mwPrice, powerPrice, monthlyFee, td(total)],
      setText
    };
  }
  function billSummary(address2, years, monthSummary, totalsByYear) {
    const billRows = months.map(
      (month2) => tr(
        td(month2),
        years.map((year) => {
          const index = ymToIndex({ year, month: month2 });
          const { billTDList, setText } = BillItemTDs();
          monthSummary.onValueChange((summaries) => {
            const monthInfo = summaries[index];
            if (monthInfo) setText(monthInfo);
          });
          return billTDList;
        })
      )
    );
    const totalRow = tr(
      styles({ fontWeight: "bold" }),
      td(b("Yhteens\xE4")),
      years.map((y) => {
        const { billTDList, setText } = BillItemTDs();
        totalsByYear.onValueChange((years2) => {
          const {
            billedTotals: { monthlyFees, usedPowerPrice, total },
            usedPower
          } = years2[y];
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
    return {
      bills: div(
        h2(`${address2} laskut ${years[0]}-${years[years.length - 1]}`),
        table(
          styles({ width: "auto", textAlign: "right" }),
          thead(
            tr(
              th({ rowSpan: 2 }),
              years.map((y) => th(y, { colSpan: 5, ...borderLeft }))
            ),
            tr(years.map((y) => [th("Kulutus", borderLeft), th("\u20AC/MWh"), th("Energia \u20AC"), th("kk \u20AC"), th("Lasku \u20AC")]))
          ),
          tbody(billRows, totalRow)
        )
      ),
      totalsByYear
    };
  }
  function compareYears(firstYear, comparedYears, totalsByYear) {
    const thisYearComparisonTitle = "t\xE4m\xE4n vuoden vertailutason laskeminen seuraavan vuoden korotuksen arviointia varten";
    const compared = comparedYears.map((y) => {
      var _a2;
      const yearTotal = totalsByYear[y];
      const prevYear = y - 1;
      const prevTotal = totalsByYear[prevYear];
      const calculatedTotals = yearTotal.calculatedTotals;
      const { priceIncreaseTooMuch } = calculatedTotals;
      const princeIncreaseInfo = priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel ? [
        li("Korotus ylitt\xE4\xE4 15% ja 150e. Kuluttajariitalautakunnan suosituksen mukainen korotus olisi 150e"),
        ul(
          li(
            `150\u20AC korotus edellisen vuoden tasolla laskettuun summaan: ${printMoney(yearTotal.totalsBasedOnLastYearLevel.total)} + 150 = `,
            b(printMoney(calculatedTotals.total))
          ),
          li(
            `Liika laskutus: ${printMoney(yearTotal.billedTotals.total)} - ${printMoney(calculatedTotals.total)}  = `,
            b(printMoney(calculatedTotals.excessBilling))
          )
        )
      ] : [li("Korotus ei ylit\xE4 150e ja 15%")];
      const prevAvgMwPrice = prevTotal.calculatedTotals.avgPowerPrice;
      const explainAdjustment = () => priceIncreaseTooMuch && yearTotal.totalsBasedOnLastYearLevel && calculatedTotals.adjustmentMultiplier && prevTotal ? p(
        ul(
          li(
            "Liian laskutuksen takia seuraavan vuoden laskutuksessa k\xE4ytet\xE4\xE4n t\xE4m\xE4n vuoden tasona viimevuoden tasoa * korjauskerroin"
          ),
          calculatedTotals.adjustmentMultiplier && li(
            `Korjauskerroin: ${printMoney(calculatedTotals.total)}/${printMoney(yearTotal.totalsBasedOnLastYearLevel.total)} = ${printPower(calculatedTotals.adjustmentMultiplier)}`
          ),
          li(
            `Energian hinta: ${printMoney(prevAvgMwPrice)} * ${printPower(calculatedTotals.adjustmentMultiplier)} = `,
            b(printMoney(calculatedTotals.avgPowerPrice))
          ),
          li(
            `Kuukausi: ${printMoney(prevTotal.calculatedTotals.avgMonthlyFee)} * ${printPower(calculatedTotals.adjustmentMultiplier)} = `,
            b(printMoney(calculatedTotals.avgMonthlyFee))
          )
        )
      ) : p(
        ul(
          li("Taso saadaan laskemalla keskiarvot"),
          li(
            `Energian hinta: ${printMoney(yearTotal.billedTotals.usedPowerPrice)} / ${printPower(yearTotal.usedPower)} = `,
            b(printMoney(yearTotal.calculatedTotals.avgPowerPrice))
          ),
          li(
            `Kuukausi: ${printMoney(yearTotal.billedTotals.monthlyFees)} / ${yearTotal.monthCount} = `,
            b(printMoney(yearTotal.calculatedTotals.avgMonthlyFee))
          )
        )
      );
      const prevAvgMonthlyFee = prevTotal.calculatedTotals.avgMonthlyFee;
      const totalWithPrevYearLevel = ((_a2 = yearTotal.totalsBasedOnLastYearLevel) == null ? void 0 : _a2.total) || decimal_default(0);
      return div(
        h3(`${y}, vertailu toteutuneella ja ${y - 1} tasolla`),
        table(
          styles({ width: "auto" }),
          thead(tr(th(""), th("kulutus"), th("\u20AC/MWh"), th("kk \u20AC"), th("Lasku vuositasolla"), th("Liika laskutus"))),
          tbody(
            styles({ verticalAlign: "top" }),
            tr(
              td(`${y} toteunut lasku`),
              td(printPower(yearTotal.usedPower)),
              td(),
              td(),
              td(printMoney(yearTotal.billedTotals.total)),
              td()
            ),
            tr(
              td(
                `edellisen vuoden taso ja lasku vuoden ${y} kulutuksella`,
                ul(
                  li(
                    `Vuoden ${y} energiakulutus ${printPower(yearTotal.usedPower)} vuoden ${y - 1} kuukausimaksulla ja energian hinnalla: `,
                    br(),
                    `${printPower(yearTotal.usedPower)} * ${printMoney(prevAvgMwPrice)} + ${yearTotal.monthCount} * ${printMoney(prevAvgMonthlyFee)} = `,
                    b(printMoney(totalWithPrevYearLevel))
                  )
                )
              ),
              td(printPower(yearTotal.usedPower)),
              td(printMoney(prevAvgMwPrice)),
              td(printMoney(prevAvgMonthlyFee)),
              td(printMoney(totalWithPrevYearLevel)),
              td()
            ),
            tr(
              td(
                `Korotuksen arvionti vuodelle ${y}`,
                ul(
                  li(
                    `${y} yhteens\xE4 ${printMoney(yearTotal.billedTotals.total)}, ${prevYear} tasolla ${printMoney(totalWithPrevYearLevel)}`
                  ),
                  li(
                    `Korotus ${printMoney(calculatedTotals.priceIncreaseEuros || decimal_default(0))} euroa ${printPower(calculatedTotals.priceIncreasePercents || decimal_default(0))} prosenttia`
                  ),
                  princeIncreaseInfo
                )
              ),
              td(),
              td(),
              td(),
              td(priceIncreaseTooMuch && printMoney(calculatedTotals.total)),
              td(priceIncreaseTooMuch && b(printMoney(calculatedTotals.excessBilling)))
            ),
            tr(
              td(thisYearComparisonTitle, explainAdjustment()),
              td(),
              td(printMoney(calculatedTotals.avgPowerPrice)),
              td(printMoney(calculatedTotals.avgMonthlyFee)),
              td()
            )
          )
        )
      );
    });
    const firstYearTotals = totalsByYear[firstYear];
    const firstAvgMwPrice = printMoney(firstYearTotals.calculatedTotals.avgPowerPrice);
    const firstAvgMonthlyFee = printMoney(firstYearTotals.calculatedTotals.avgMonthlyFee);
    return [
      h3(`${firstYear} tason laskeminen`),
      table(
        styles({ width: "auto" }),
        thead(tr(th(""), th("kulutus"), th("\u20AC/MWh"), th("kk \u20AC"))),
        tbody(
          styles({ verticalAlign: "top" }),
          tr(
            td(
              thisYearComparisonTitle,
              ul(
                li(
                  `${firstYear} Energian hinta \u20AC/MWh: ${printMoney(firstYearTotals.billedTotals.usedPowerPrice)} / ${printPower(firstYearTotals.usedPower)} = `,
                  b(firstAvgMwPrice)
                ),
                li(
                  `${firstYear} Kuukausimaksu: ${printMoney(firstYearTotals.billedTotals.monthlyFees)} / ${firstYearTotals.monthCount} = `,
                  b(firstAvgMonthlyFee)
                )
              )
            ),
            td(printPower(firstYearTotals.usedPower)),
            td(firstAvgMwPrice),
            td(firstAvgMonthlyFee)
          )
        )
      ),
      ...compared
    ];
  }
  function excessBillingPaybackInterest(excessYears, totalsByYear, monthlyPricing) {
    const { excessTotal, paybackInterestTotal, months: months2 } = calculatePaybackInterest(
      excessYears,
      monthlyPricing,
      totalsByYear
    );
    return {
      root: table(
        styles({ width: "auto" }),
        thead(
          tr(
            th("vuosi.kk"),
            th("Kulutus"),
            th("Alkuper\xE4inen lasku"),
            th("Korjattu lasku"),
            th("Ylilaskutus"),
            th("Viiv\xE4styskorko")
          )
        ),
        tbody(
          months2.map((m) => {
            return tr(
              td(m.date),
              td(printPower(m.originalBill.usedPower)),
              td(printMoney(m.originalTotal)),
              td(printMoney(m.adjustedTotal)),
              td(printMoney(m.excess)),
              td(printMoney(m.interest))
            );
          })
        ),
        tr(td("Yhteens\xE4"), td(), td(), td(), td(printMoney(excessTotal)), td(printMoney(paybackInterestTotal)))
      ),
      paybackInterestTotal
    };
  }
  function priceIncreasesAndPaybackInterest(years, totalsByYear, monthlyPricing) {
    const [firstYear, ...comparedYears] = years;
    const yearComparison = compareYears(firstYear, comparedYears, totalsByYear);
    const excessYears = comparedYears.filter((y) => totalsByYear[y].calculatedTotals.excessBilling.toNumber() > 0);
    const { root: paybackInterest, paybackInterestTotal } = excessBillingPaybackInterest(
      excessYears,
      totalsByYear,
      monthlyPricing
    );
    return div(
      h2("Korotusten arviointi"),
      yearComparison,
      excessYears.length > 0 && [
        h2("Liiallinen laskutus ja viiv\xE4styskorko"),
        ul(
          { class: "pagebreak" },
          excessYears.map((y) => li(`${y}: ${printMoney(totalsByYear[y].calculatedTotals.excessBilling)}\u20AC`)),
          li(`Viiv\xE4styskorko: ${printMoney(paybackInterestTotal)}\u20AC`),
          li(
            `Yhteens\xE4: ${printMoney(excessYears.reduce((acc, y) => acc.add(totalsByYear[y].calculatedTotals.excessBilling), paybackInterestTotal))}\u20AC`
          )
        ),
        h2("Kuukausikohtaisen viiv\xE4styskoron laskeminen"),
        p(
          "Viiv\xE4styskorko laskettuna korjattujen kuukausien laskujen maksup\xE4iv\xE4st\xE4. Korjattuina kuukausina rahaa on ker\xE4tty perusteettomasti"
        ),
        paybackInterest
      ]
    );
  }
  var usage = "2022-4_1.945_1.33_0.941_0.897_0.876_1.336_1.758_3.038_3.922_3.597_2.869_2.766_1.683_1.21_1.11_0.973_0.904_0.876_2.278_3.017_3.717_4.456_3.313_2.798_2.096_0.926_0.701_0.73_0.683_0.66_1.721_2.438_3.238_3.357_3.177_2.656_1.558_1.196_0.851_0.789_0.778_0.841_2.2_2.485_2.899";
  function kaukolampoExcessPricingCalculator() {
    const contract = tuusulanjarvenLampo;
    const from = { year: 2022, month: 1 };
    const to = { year: 2025, month: 12 };
    const years = range2(from.year, to.year);
    const address2 = "J\xE4tintie 1 A";
    const monthlyPricing = resolveMonthlyPricingLookup(contract, from, to);
    const powerUsage = parseUnderscoreSeparatedYmNumbers(usage);
    const powerUsageState = createState({});
    const totalsByYear = createState({});
    const monthSummary = createState({});
    const priceIncreases = div();
    powerUsageState.onValueChange((powerUsage2) => {
      const newTotals = calculateMonthlyYearlyTotals(years, monthlyPricing, powerUsage2);
      totalsByYear.set(newTotals.totalsByYear);
      monthSummary.set(newTotals.monthSummary);
      priceIncreases.replaceChildren(
        priceIncreasesAndPaybackInterest(years, newTotals.totalsByYear, newTotals.monthSummary)
      );
    });
    const { bills } = billSummary(address2, years, monthSummary, totalsByYear);
    powerUsageState.set(powerUsage.numbers);
    return div(bills, priceIncreases);
  }

  // src/kotibudjetti.ts
  console.log("kotibudjetti v0.0.1");
  setElementToId("app", kaukolampoExcessPricingCalculator());
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
