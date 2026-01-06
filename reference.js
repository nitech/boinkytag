(function() {
    'use strict';
    var m = typeof Object.defineProperties == "function" ? Object.defineProperty : function(a, b, c) {
        if (a == Array.prototype || a == Object.prototype)
            return a;
        a[b] = c.value;
        return a
    }
      , p = function(a) {
        a = ["object" == typeof globalThis && globalThis, a, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
        for (var b = 0; b < a.length; ++b) {
            var c = a[b];
            if (c && c.Math == Math)
                return c
        }
        throw Error("Cannot find global object");
    }
      , q = p(this)
      , r = function(a, b) {
        if (b)
            a: {
                var c = q;
                a = a.split(".");
                for (var d = 0; d < a.length - 1; d++) {
                    var f = a[d];
                    if (!(f in c))
                        break a;
                    c = c[f]
                }
                a = a[a.length - 1];
                d = c[a];
                b = b(d);
                b != d && b != null && m(c, a, {
                    configurable: !0,
                    writable: !0,
                    value: b
                })
            }
    };
    r("globalThis", function(a) {
        return a || q
    });
    r("String.prototype.matchAll", function(a) {
        return a ? a : function(b) {
            if (b instanceof RegExp && !b.global)
                throw new TypeError("RegExp passed into String.prototype.matchAll() must have global tag.");
            var c = new RegExp(b,b instanceof RegExp ? void 0 : "g")
              , d = this
              , f = !1
              , e = {
                next: function() {
                    if (f)
                        return {
                            value: void 0,
                            done: !0
                        };
                    var k = c.exec(d);
                    if (!k)
                        return f = !0,
                        {
                            value: void 0,
                            done: !0
                        };
                    k[0] === "" && (c.lastIndex += 1);
                    return {
                        value: k,
                        done: !1
                    }
                }
            };
            e[Symbol.iterator] = function() {
                return e
            }
            ;
            return e
        }
    });
    function t(a) {
        let b, c = !1;
        return async () => {
            if (c)
                return b;
            b = await a();
            c = !0;
            return b
        }
    }
    function u(a) {
        return [...a.querySelectorAll("script")].filter(b => b.src.includes("googletagmanager.com/gtag/js") || b.src.includes("googletagmanager.com/gtm.js") || b.src.includes("google.com/gtag/js") || b.src.includes("google.com/gtm.js") || b.innerText.includes("google_tags_first_party"))
    }
    ;const v = {
        type: 5
    };
    var w = class {
        constructor(a) {
            this.g = a;
            this.C = async () => {
                try {
                    if ((await this.g.fetch("https://www.googletagmanager.com/gtag/js?id=DUMMY", {
                        method: "HEAD",
                        mode: "no-cors",
                        cache: "no-store"
                    })).redirected)
                        return v;
                    const b = await (await this.g.fetch("https://www.googletagmanager.com/gtag/js?id=DUMMY")).text();
                    return ["DUMMY", "google_tag_data", "google_tag_manager", "/debug/bootstrap?id="].every(c => b.includes(c)) ? null : v
                } catch (b) {
                    return v
                }
            }
            ;
            this.h = t(this.C)
        }
        init() {}
        destroy() {}
    }
    ;
    const x = {
        axeptioSDK: 17,
        tC: 8,
        cmplz_set_consent: 15,
        cmpmngr: 4,
        Cookiebot: 3,
        cookiefirst_show_settings: 16,
        cookiehub: 22,
        CookieInformation: 9,
        CLI: 20,
        Osano: 10,
        SP_SCRIPT_CONF: 19,
        SDDAN: 14,
        Termly: 12,
        OneTrust: 6,
        UC_UI: 2,
        cookieyes: 11,
        Didomi: 7,
        TrustArc: 13,
        CookieScript: 18,
        Iubenda: 5
    };
    var y = class {
        constructor(a) {
            this.g = a
        }
        init() {}
        async h() {
            const a = []
              , b = this.g;
            for (const c in x)
                b[c] !== void 0 && a.push(x[c]);
            return a.length > 0 ? {
                type: 6,
                detectedCmps: a
            } : null
        }
        destroy() {}
    }
    ;
    var z = class {
        constructor(a) {
            this.g = a;
            this.violations = [];
            this.K = b => {
                this.violations.push(b)
            }
        }
        init() {
            this.g.addEventListener("securitypolicyviolation", this.K)
        }
        async h() {
            return this.violations.filter(a => a.blockedURI.includes("googletagmanager.com/gtag/js") || a.blockedURI.includes("googletagmanager.com/gtm.js") || a.blockedURI.includes("google.com/gtag/js") || a.blockedURI.includes("google.com/gtm.js")).length > 0 ? {
                type: 9,
                blockedUrls: this.violations.map(a => a.blockedURI),
                violatedDirectives: this.violations.map(a => a.violatedDirective)
            } : null
        }
        destroy() {
            this.violations = [];
            this.g.removeEventListener("securitypolicyviolation", this.K)
        }
    }
    ;
    function A(a) {
        const b = B(a)
          , c = C(a, b)
          , d = a.src
          , f = a.innerText;
        if (b === 0)
            return [{
                l: !1,
                snippetType: b,
                errorType: 1,
                scriptSrc: d,
                scriptContent: f
            }];
        if (b === 4)
            return c.map(e => ({
                l: !1,
                snippetType: b,
                tagId: e,
                errorType: 3,
                scriptSrc: d,
                scriptContent: f
            }));
        a = [];
        for (const e of c)
            e && e.startsWith("GTM-") || D(e) ? b === 1 && e && e.startsWith("GTM-") ? a.push({
                l: !1,
                snippetType: b,
                tagId: e,
                errorType: 2,
                scriptSrc: d,
                scriptContent: f
            }) : b === 2 && D(e) && a.push({
                l: !1,
                snippetType: b,
                tagId: e,
                errorType: 2,
                scriptSrc: d,
                scriptContent: f
            }) : a.push({
                l: !1,
                snippetType: b,
                tagId: e,
                errorType: 3,
                scriptSrc: d,
                scriptContent: f
            });
        return a.length ? a : c.map(e => ({
            l: !0,
            snippetType: b,
            tagId: e,
            scriptSrc: d,
            scriptContent: f
        }))
    }
    function B(a) {
        return a.src.includes("googletagmanager.com/gtag/js") || a.src.includes("google.com/gtag/js") ? 1 : a.src.includes("googletagmanager.com/gtm.js?") || a.src.includes("google.com/gtm.js") ? 2 : a.innerText.includes("google_tags_first_party") ? E(a).length > 0 ? 3 : 4 : 0
    }
    function C(a, b) {
        if (b === 1 || b === 2) {
            a: {
                try {
                    let d;
                    var c = (d = (new URL(a.src)).searchParams.get("id")) != null ? d : void 0;
                    break a
                } catch (d) {}
                c = void 0
            }
            return (a = c) ? [a] : []
        }
        return E(a)
    }
    function D(a) {
        return a ? a.startsWith("G-") || a.startsWith("GT-") || a.startsWith("AW-") || a.startsWith("FL-") || a.startsWith("GA-") || a.startsWith("DC-") : !1
    }
    function E(a) {
        var b = a.innerText.match(/window,'([^&]+)','google_tags_first_party'/);
        if (b)
            return [b[1]];
        b = a.innerText.match(/window,\[(.*?)\],'google_tags_first_party'/);
        a = [];
        if (b && b[1]) {
            b = b[1].matchAll(/'([^']+)'/g);
            for (const c of b)
                a.push(c[1])
        }
        return a
    }
    ;var F = class {
        constructor(a) {
            this.g = a
        }
        init() {}
        async h() {
            var a = u(this.g.document);
            for (const b of a) {
                a = A(b);
                for (const c of a)
                    if (!c.l)
                        return {
                            type: 8,
                            snippetType: c.snippetType,
                            tagId: c.tagId,
                            errorType: c.errorType,
                            scriptSrc: c.scriptSrc,
                            scriptContent: c.scriptContent
                        }
            }
            return null
        }
        destroy() {}
    }
    ;
    var aa = class {
        constructor(a) {
            this.g = a
        }
        init() {}
        async h() {
            const a = {
                type: 3
            };
            return this.g.navigator.onLine ? null : a
        }
        destroy() {}
    }
    ;
    var ba = class {
        constructor(a) {
            this.g = a
        }
        init() {}
        async h() {
            var a = this.g;
            a = !!(a["google.tagmanager.debugui2.queue"] || a["google.tagmanager.ta.prodqueue"] || a.google_tag_data);
            const b = u(this.g.document);
            return a || b.length !== 0 ? null : {
                type: 4
            }
        }
        destroy() {}
    }
    ;
    var da = class {
        constructor(a) {
            this.g = a;
            this.C = async () => await ca(this.g.location.href) ? null : {
                type: 7
            };
            this.h = t(this.C)
        }
        init() {}
        destroy() {}
    }
    ;
    async function ca(a) {
        try {
            return (await fetch(a, {
                method: "HEAD",
                mode: "no-cors",
                cache: "no-store"
            })).status < 400
        } catch (b) {
            return !1
        }
    }
    ;/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
    const ea = Array.prototype.indexOf ? function(a, b) {
        return Array.prototype.indexOf.call(a, b, void 0)
    }
    : function(a, b) {
        if (typeof a === "string")
            return typeof b !== "string" || b.length != 1 ? -1 : a.indexOf(b, 0);
        for (let c = 0; c < a.length; c++)
            if (c in a && a[c] === b)
                return c;
        return -1
    }
    ;
    var fa = class {
        constructor() {
            this.M = void 0;
            this.o = !1;
            this.u = []
        }
        addListener(a) {
            if (this.o)
                return () => {}
                ;
            this.u.push(a);
            return () => {
                this.removeListener(a)
            }
        }
        destroy() {
            this.o || (this.u = [],
            this.M && this.M(),
            this.o = !0)
        }
        removeListener(a) {
            if (!this.o) {
                var b = this.u;
                a = ea(b, a);
                a >= 0 && Array.prototype.splice.call(b, a, 1)
            }
        }
    }
    ;
    var G = function(a) {
        a.A = a.A.then(async () => {
            const b = await ha(a);
            var c;
            if ((c = a.v) != null && !c.o) {
                c = [...c.u];
                for (let d = 0; d < c.length; d++)
                    try {
                        c[d](b)
                    } catch (f) {
                        console.log("Event listener failed", f)
                    }
            }
        }
        )
    }
      , J = function(a) {
        if (!a.J && (a.g.document.head || a.g.document.body)) {
            a.J = !0;
            a.O = Date.now();
            for (const b of a.F)
                b.j !== void 0 ? b.j.init() : b.init();
            a.P = setInterval( () => {
                G(a)
            }
            , 1E3);
            G(a)
        }
    }
      , ia = function(a, b) {
        a.v.addListener(b)
    }
      , ha = async function(a) {
        return {
            issues: (await Promise.all(a.F.map(b => b.j !== void 0 ? b.timeoutMs && Date.now() - a.O < b.timeoutMs ? Promise.resolve(null) : b.j.h() : b.h()))).filter(b => b !== null),
            pageUrl: a.g.location.href
        }
    }
      , ja = class {
        constructor(a) {
            this.g = a;
            this.v = new fa;
            this.J = !1;
            this.O = 0;
            this.A = Promise.resolve();
            this.F = [new aa(a), new F(a), new da(a), new z(a), new w(a), new y(a), {
                j: new ba(a),
                timeoutMs: 5E3
            }]
        }
        destroy() {
            let a;
            (a = this.v) == null || a.destroy();
            this.v = void 0;
            this.A = Promise.resolve();
            clearInterval(this.P);
            for (const b of this.F)
                b.j !== void 0 ? b.j.init() : b.init()
        }
    }
    ;
    /*

 Copyright Google LLC
 SPDX-License-Identifier: Apache-2.0
*/
    let K = globalThis.trustedTypes, L;
    function ka() {
        let a = null;
        if (!K)
            return a;
        try {
            const b = c => c;
            a = K.createPolicy("goog#html", {
                createHTML: b,
                createScript: b,
                createScriptURL: b
            })
        } catch (b) {}
        return a
    }
    ;var la = class {
        constructor(a) {
            this.U = a
        }
        toString() {
            return this.U + ""
        }
    }
    ;
    function M(a) {
        var b;
        L === void 0 && (L = ka());
        a = (b = L) ? b.createScriptURL(a) : a;
        return new la(a)
    }
    ;function N(a, ...b) {
        if (b.length === 0)
            return M(a[0]);
        let c = a[0];
        for (let d = 0; d < b.length; d++)
            c += encodeURIComponent(b[d]) + a[d + 1];
        return M(c)
    }
    ;N`cs/ta/tag_assistant_api_bin.js`;
    N`cs/ta/content_script_bin.js`;
    N`cs/ta/start_debug_content_script_bin.js`;
    N`cs/ta/start_prod_debug_content_script_bin.js`;
    N`cs/gf/guided_flows_content_script_bin.js`;
    var O = function(a, b, c=null) {
        if (b == null)
            return b;
        const d = typeof b;
        if (d === "boolean" || d === "string" || d === "number")
            return b;
        if (d === "function")
            return "Function";
        if (d === "object") {
            const g = a.H.indexOf(b);
            if (g !== -1) {
                a.cycles[c] = a.I[g];
                return
            }
            try {
                if (b && typeof b[Symbol.iterator] === "function") {
                    var f = [];
                    a.H.push(b);
                    a.I.push(c);
                    var e = 0;
                    for (var k of b)
                        f.push(O(a, k, c == null ? `${e}` : `${c}.${e}`)),
                        e++;
                    return f
                }
                if (b instanceof Node) {
                    a = [];
                    c = b;
                    do {
                        if (c instanceof Element) {
                            const H = c.classList ? [...c.classList].join(".") : ""
                              , I = (c.tagName ? c.tagName.toLowerCase() : "") + (H ? "." + H : "") + (c.id ? "#" + c.id : "");
                            I && a.unshift(I)
                        }
                        c = c.parentNode
                    } while (c != null);
                    var h;
                    const l = (h = (e = b.toString().match(/\[object (\w+)\]/)) == null ? void 0 : e[1]) != null ? h : b.toString()
                      , n = a.join(" > ");
                    return n ? `${l}: ${n}` : l
                }
                k = {};
                a.H.push(b);
                a.I.push(c);
                for (const [l,n] of Object.entries(b))
                    e = l,
                    h = n,
                    f = e.replace(/\\/g, "\\\\").replace(/\./, "\\."),
                    k[e] = O(a, h, c == null ? `${f}` : `${c}.${f}`);
                return k
            } catch (l) {
                console.log("Object inspection failed: %o", l)
            }
        }
        try {
            return String(b)
        } catch (g) {
            console.log("Failed to convert to string: %o", g);
            try {
                return String(Object.prototype.toString.call(b))
            } catch (l) {
                return `[${d}]`
            }
        }
    };
    class ma {
        constructor() {
            this.cycles = {};
            this.H = [];
            this.I = []
        }
    }
    ;var Q = function(a) {
        const b = a.g["google.tagmanager.ta.prodqueue"];
        if (b) {
            P(a, [...b]);
            var c = b.push;
            b.push = (...d) => {
                P(a, d);
                return c.apply(b, d)
            }
        } else
            Date.now() - a.S < 1E4 && a.g.setTimeout( () => {
                Q(a)
            }
            , 300)
    }
      , P = function(a, b) {
        for (const c of b)
            c.messageType !== "INIT" || a.T.push(c),
            b = new ma,
            b = {
                sanitized: O(b, c),
                cycles: b.cycles
            },
            a.i({
                type: "MEMO",
                data: {
                    memo: b,
                    sequence: a.L,
                    pageId: a.pageId
                },
                uId: ""
            }),
            a.L++
    }
      , na = class {
        constructor(a, b) {
            this.g = a;
            this.i = b;
            this.S = Date.now();
            this.L = 0;
            this.T = [];
            b = new Uint8Array(16);
            a.crypto.getRandomValues(b);
            this.pageId = a.btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
            Q(this)
        }
    }
    ;
    function R(a) {
        if (a == null || a.length === 0)
            return !1;
        a = Number(a);
        const b = (new Date(Date.now())).getTime();
        return a < b + 3E5 && a > b - 9E5
    }
    ;function S(a) {
        return a.replace(/([\?&])gtm_debug=x&/, "$1").replace(/[\?&]gtm_debug=x($|#)/, "$1")
    }
    ;let T = window;
    function U() {
        let a = T.google_tags_first_party;
        Array.isArray(a) || (a = []);
        const b = {};
        for (const c of a)
            b[c] = !0;
        return Object.freeze(b)
    }
    class oa {
        constructor() {
            this.container = {};
            this.destination = {};
            this.destinationArray = {};
            this.canonical = {};
            this.pending = [];
            this.injectedFirstPartyContainers = {};
            this.injectedFirstPartyContainers = U()
        }
    }
    ;var pa = function(a) {
        const b = a.g.document.documentElement.getAttribute("data-tag-assistant-prod-present");
        if (R(b))
            a.startProdDebug();
        else {
            const c = d => {
                d.detail.startProdDebug && a.startProdDebug();
                a.g.document.removeEventListener("TADebugSignal", c)
            }
            ;
            a.g.document.addEventListener("TADebugSignal", c)
        }
    }
      , qa = function(a) {
        if (a.g.top === a.g) {
            var b = a.g.document.documentElement.getAttribute("data-tag-assistant-present") || a.g.document.documentElement.getAttribute("data-tag-assistant-prod-present");
            if (R(b))
                J(a.B);
            else {
                const c = d => {
                    d.detail.startDebug && J(a.B);
                    a.g.document.removeEventListener("TADebugSignal", c)
                }
                ;
                a.g.document.addEventListener("TADebugSignal", c)
            }
        }
    }
      , ra = function(a, b) {
        a.G.push(b);
        a.N || (a.N = !0,
        a.g.document.addEventListener("prerenderingchange", () => {
            for (const c of a.G)
                V(a, c);
            a.G.length = 0
        }
        , {
            once: !0
        }))
    }
      , V = function(a, b) {
        a.g.document.dispatchEvent(new CustomEvent("__TAG_ASSISTANT_API_MESSAGE",{
            detail: b
        }))
    }
      , W = function(a, b) {
        if (b !== "RESEND_MEMOS" || a.g === a.g.top) {
            b = a.i;
            var c = Object, d = c.assign, f = a.g, e;
            var k = S(f.location.href);
            var h;
            if (!(h = f.document.title) && (h = f.location.href,
            h !== "/")) {
                try {
                    var g = new URL(h);
                    g.search = "";
                    g.hash = "";
                    h = g.toString()
                } catch (l) {}
                g = h.split("/");
                h = g[g.length - 1] || g[g.length - 2]
            }
            k = {
                href: k,
                title: h,
                referrer: S((e = f.document.referrer) != null ? e : ""),
                readyState: f.document.readyState
            };
            e = a.g;
            e = e.google_tag_manager = e.google_tag_manager || {};
            e = e.debugGroupId || (e.debugGroupId = String(Math.floor(Number.MAX_SAFE_INTEGER * Math.random())));
            b.call(a, {
                type: "PAGE_SUMMARY",
                data: d.call(c, {}, k, {
                    groupId: e
                }),
                uId: ""
            })
        }
    }
      , sa = function(a) {
        a.g === a.g.top && (a.D = a.g.setInterval( () => {
            a.i({
                type: "PING",
                uId: ""
            })
        }
        , 1E3),
        a.g.document.readyState === "complete" ? W(a) : a.g.addEventListener("load", () => {
            W(a)
        }
        ))
    }
      , ta = function(a) {
        a.m || (X(a),
        a.m = a.g.setInterval( () => {
            X(a)
        }
        , 1500))
    }
      , X = function(a) {
        var b = {};
        var c = T.google_tag_data;
        T.google_tag_data = c === void 0 ? b : c;
        b = T.google_tag_data;
        c = b.tidr;
        c && typeof c === "object" || (c = new oa,
        b.tidr = c);
        c.container || (c.container = {});
        c.destination || (c.destination = {});
        c.destinationArray || (c.destinationArray = {});
        c.canonical || (c.canonical = {});
        c.pending || (c.pending = []);
        c.injectedFirstPartyContainers || (c.injectedFirstPartyContainers = U());
        b = [];
        for (const [,d] of Object.entries(c.container))
            if (c = d,
            c.scriptContainerId != null) {
                switch (c.state) {
                case 2:
                    break;
                default:
                    continue
                }
                b.push({
                    ctid: c.scriptContainerId,
                    aliases: Y(c.containers || [c.scriptContainerId]),
                    destinations: Y(c.destinations || []),
                    canonicalId: c.canonicalContainerId,
                    parent: c.parent,
                    context: c.context
                })
            }
        b.length && a.i({
            type: "SIDE_PANEL",
            subType: "sp_list_tags",
            data: {
                tags: b
            },
            uId: ""
        })
    }
      , ua = class {
        constructor(a) {
            this.g = Z;
            this.R = a;
            this.G = [];
            this.N = !1;
            this.B = new ja(this.g);
            this.g.document.addEventListener("__TAG_ASSISTANT_API_MESSAGE", b => {
                b = b.detail;
                a: {
                    var c = b == null ? void 0 : b.type;
                    if (typeof c !== "string")
                        c = !1;
                    else
                        switch (c) {
                        case "API_INSTALLED":
                        case "CHECK_DEBUG":
                        case "DISCONNECT":
                        case "PIPE_MESSAGE":
                        case "RECONNECT":
                        case "WINDOWS_CLOSED":
                            c = !0;
                            break a;
                        default:
                            c = !1
                        }
                }
                if (c)
                    a: if (c = b == null ? void 0 : b.source,
                    typeof c !== "string")
                        c = !1;
                    else
                        switch (c) {
                        case "PAGE":
                        case "EXTENSION":
                            c = !0;
                            break a;
                        default:
                            c = !1
                        }
                c && b.type === "PIPE_MESSAGE" && b.source === "EXTENSION" && (c = b.data,
                b = b.origin,
                c.type === "SIDE_PANEL" ? (c.subType === "sp_list_tags" && ta(this),
                c.subType === "sp_off" && (this.g.clearInterval(this.m),
                this.m = void 0)) : (c.type !== "RESEND_MEMOS" || this.receiver || W(this, "RESEND_MEMOS"),
                sa(this),
                this.receiver && this.receiver(c, b)))
            }
            );
            this.g.document.dispatchEvent(new CustomEvent("__TAG_ASSISTANT_API_MESSAGE",{
                detail: {
                    type: "API_INSTALLED",
                    source: "PAGE"
                }
            }));
            this.g.addEventListener("pagehide", () => {
                this.m != null && (this.g.clearInterval(this.m),
                this.m = void 0)
            }
            );
            pa(this);
            qa(this);
            ia(this.B, b => {
                b && this.i({
                    type: "CONNECTION_ISSUE",
                    data: b,
                    uId: ""
                })
            }
            )
        }
        setReceiver(a) {
            this.receiver = a
        }
        sendMessage(a) {
            this.D && (this.g.clearInterval(this.D),
            this.D = void 0);
            this.i(a)
        }
        i(a) {
            a = {
                type: "PIPE_MESSAGE",
                source: "PAGE",
                data: a,
                origin: this.g.origin,
                dId: "",
                tId: 0
            };
            this.g.document.prerendering ? ra(this, a) : V(this, a)
        }
        disconnect() {
            this.g.document.dispatchEvent(new CustomEvent("__TAG_ASSISTANT_API_MESSAGE",{
                detail: {
                    type: "DISCONNECT",
                    source: "PAGE"
                }
            }));
            this.R()
        }
        startProdDebug() {
            this.V = this.V || new na(this.g,a => {
                this.i(a)
            }
            )
        }
    }
    ;
    function Y(a) {
        const b = [];
        for (const c of a)
            c != null && b.push(c);
        return b
    }
    ;const Z = window;
    Z.__TAG_ASSISTANT_API || (Z.__TAG_ASSISTANT_API = new ua( () => {
        Z.__TAG_ASSISTANT_API = void 0
    }
    ));
}
).call(this);
