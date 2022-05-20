import Vue from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"
import vuetify from "./plugins/vuetify"
import axios from "axios"
import VueAxios from "vue-axios"
import Toast from "vue-toastification"
import "./assets/styles.css"
import "vue-toastification/dist/index.css"
import "./registerServiceWorker"
import VueSanitize from "vue-sanitize"
import "@mdi/font/css/materialdesignicons.css"
import "./plugins/dayjs"
import VueApollo from "./plugins/apollo"
import VueMatomo from "vue-matomo"
import * as Sentry from "@sentry/vue"
import { BrowserTracing } from "@sentry/tracing"
import SocketIO from "socket.io-client"
import twemoji from "twemoji"
const md = require("markdown-it")({
  html: false, // Enable HTML tags in source
  xhtmlOut: false, // Use '/' to close single tags (<br />).
  // This is only for full CommonMark compatibility.
  breaks: false, // Convert '\n' in paragraphs into <br>
  langPrefix: "language-", // CSS language prefix for fenced blocks. Can be
  // useful for external highlighters.
  linkify: true, // Autoconvert URL-like text to links

  // Enable some language-neutral replacement + quotes beautification
  // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
  typographer: false,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: "“”‘’",

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externally.
  // If result starts with <pre... internal wrapper is skipped.
  highlight: function (/*str, lang*/) {
    return ""
  }
}).disable(["image", "autolink"])
const emoji = require("markdown-it-emoji")
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
md.use(emoji)
md.renderer.rules.emoji = function (token, idx) {
  return twemoji.parse(token[idx].content, {
    folder: "svg",
    ext: ".svg"
  })
}
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  const aIndex = tokens[idx].attrIndex("target")

  if (aIndex < 0) {
    tokens[idx].attrPush(["target", "_blank"]) // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = "_blank" // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self)
}
if (
  process.env.NODE_ENV === "production" &&
  JSON.parse(process.env.VUE_APP_SENTRY_ENABLED)
) {
  Sentry.init({
    Vue,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ["bettercompass.com.au", "compass.troplo.com", /^\//]
      })
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0
  })
}

Vue.use({
  install(Vue) {
    Vue.prototype.$socket = SocketIO(process.env.VUE_APP_SOCKET_URL, {
      query: {
        compassInstance: localStorage.getItem("schoolInstance")
      }
    })
  }
})

if (JSON.parse(process.env.VUE_APP_MATOMO_ENABLED)) {
  Vue.use(VueMatomo, {
    // Configure your matomo server and site by providing
    host: process.env.VUE_APP_MATOMO_URL,
    siteId: process.env.VUE_APP_MATOMO_SITE_ID,

    // Changes the default .js and .php endpoint's filename
    // Default: 'matomo'
    trackerFileName: process.env.VUE_APP_MATOMO_TRACKER,

    // Overrides the autogenerated tracker endpoint entirely
    // Default: undefined
    // trackerUrl: 'https://example.com/whatever/endpoint/you/have',

    // Overrides the autogenerated tracker script path entirely
    // Default: undefined
    // trackerScriptUrl: 'https://example.com/whatever/script/path/you/have',

    // Enables automatically registering pageviews on the router
    router: router,

    // Enables link tracking on regular links. Note that this won't
    // work for routing links (ie. internal Vue router links)
    // Default: true
    enableLinkTracking: true,

    // Require consent before sending tracking information to matomo
    // Default: false
    requireConsent: false,

    // Whether to track the initial page view
    // Default: true
    trackInitialView: true,

    // Run Matomo without cookies
    // Default: false
    disableCookies: false,

    // Require consent before creating matomo session cookie
    // Default: false
    requireCookieConsent: false,

    // Enable the heartbeat timer (https://developer.matomo.org/guides/tracking-javascript-guide#accurately-measure-the-time-spent-on-each-page)
    // Default: false
    enableHeartBeatTimer: false,

    // Set the heartbeat timer interval
    // Default: 15
    heartBeatTimerInterval: 15,

    // Whether or not to log debug information
    // Default: false
    debug: false,

    // UserID passed to Matomo (see https://developer.matomo.org/guides/tracking-javascript-guide#user-id)
    // Default: undefined
    userId: undefined,

    // Share the tracking cookie across subdomains (see https://developer.matomo.org/guides/tracking-javascript-guide#measuring-domains-andor-sub-domains)
    // Default: undefined, example '*.example.com'
    cookieDomain: undefined,

    // Tell Matomo the website domain so that clicks on these domains are not tracked as 'Outlinks'
    // Default: undefined, example: '*.example.com'
    domains: process.env.VUE_APP_MATOMO_DOMAINS,

    // A list of pre-initialization actions that run before matomo is loaded
    // Default: []
    // Example: [
    //   ['API_method_name', parameter_list],
    //   ['setCustomVariable','1','VisitorType','Member'],
    //   ['appendToTrackingUrl', 'new_visit=1'],
    //   etc.
    // ]
    preInitActions: [],

    // A function to determine whether to track an interaction as a site search
    // instead of as a page view. If not a function, all interactions will be
    // tracked as page views. Receives the new route as an argument, and
    // returns either an object of keyword, category (optional) and resultsCount
    // (optional) to track as a site search, or a falsey value to track as a page
    // view.
    // Default: false, i.e. track all interactions as page views
    // Example: (to) => {
    //   if (to.query.q && to.name === 'search') {
    //     return { keyword: to.query.q, category: to.params.category }
    //   } else {
    //    return null
    //   }
    // }
    trackSiteSearch: false
  })
}

Vue.use(VueSanitize, {
  allowedTags: [
    "address",
    "article",
    "aside",
    "footer",
    "header",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hgroup",
    "main",
    "nav",
    "section",
    "blockquote",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "hr",
    "li",
    "main",
    "ol",
    "p",
    "pre",
    "ul",
    "a",
    "abbr",
    "b",
    "bdi",
    "bdo",
    "br",
    "cite",
    "code",
    "data",
    "dfn",
    "em",
    "i",
    "kbd",
    "mark",
    "q",
    "rb",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "time",
    "u",
    "var",
    "wbr",
    "caption",
    "col",
    "colgroup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "img"
  ],
  disallowedTagsMode: "discard",
  allowedAttributes: {
    a: ["href", "name", "target"],
    img: [
      "src",
      "srcset",
      "alt",
      "title",
      "width",
      "height",
      "loading",
      "style"
    ],
    tr: ["style"],
    td: ["style"],
    table: ["style"]
  },
  allowedStyles: {
    "*": {
      // Match HEX and RGB
      "text-align": [/^left$/, /^right$/, /^center$/],
      // Match any number with px, em, or %
      "font-size": [/^\d+(?:px|em|%)$/],
      "font-weight": [/^\d+$/],
      "font-style": [/^\d+$/],
      height: [/^\d+(?:px|em|%)$/],
      width: [/^\d+(?:px|em|%)$/]
    }
  },
  // Lots of these won't come up by default because we don't allow them
  selfClosing: [
    "img",
    "br",
    "hr",
    "area",
    "base",
    "basefont",
    "input",
    "link",
    "meta"
  ],
  // URL schemes we permit
  allowedSchemes: ["http", "https", "ftp", "mailto", "tel"],

  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: ["href", "src", "cite"],
  allowProtocolRelative: true,
  enforceHtmlBoundary: false
})
Vue.use(require("vue-shortkey"))
Vue.config.productionTip = false
Vue.use(VueAxios, axios)
Vue.use(Toast)
Vue.directive("markdown", {
  inserted(el) {
    el.innerHTML = md.render(el.innerHTML)
  }
})
new Vue({
  router,
  store,
  vuetify,
  VueApollo,
  render: (h) => h(App)
}).$mount("#app")
