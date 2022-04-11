import Vue from "vue"
import Vuex from "vuex"
import dayjs from "dayjs"
import Vuetify from "../plugins/vuetify"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    school: null,
    online: true,
    editMode: false,
    calendar: [],
    versioning: {
      date: process.env.VUE_APP_BUILD_DATE,
      version: process.env.VUE_APP_VERSION,
      release: process.env.RELEASE
    },
    site: {
      release: "beta",
      loading: true
    },
    user: null,
    bcUser: null,
    parent: null,
    upcomingEvents: [],
    alerts: [],
    token: null,
    subjects: [],
    events: [],
    focus: dayjs().format(),
    calendarInit: false,
    settings: {
      dark: true
    },
    modals: {
      guidedWizard: true,
      settings: false,
      search: false
    },
    quickSwitchCache: []
  },
  mutations: {
    setCalendar(state, value) {
      state.calendar = value
    },
    setEditMode(state, value) {
      state.editMode = value
    },
    setCalendarInit(state, value) {
      state.calendarInit = value
    },
    setEvents(state, events) {
      state.events = events
    },
    setOnline(state, online) {
      state.online = online
    },
    setBetterCompassUser(state, user) {
      state.bcUser = user
    },
    setUser(state, user) {
      state.user = user
    },
    setUpcomingEvents(state, events) {
      state.upcomingEvents = events
    },
    setAlerts(state, alerts) {
      state.alerts = alerts
    },
    setSubjects(state, subjects) {
      state.subjects = subjects
    },
    setSchool(state, school) {
      state.school = school
    },
    setSite(state, site) {
      state.site = site
    },
    setToken(state, token) {
      state.token = token
    },
    setLoading(state, value) {
      state.site.loading = value
    },
    showSettings(state, value) {
      state.modals.settings = value
    },
    setSettings(state, settings) {
      state.settings = settings
    },
    setSearch(state, value) {
      state.modals.search = value
    },
    updateQuickSwitchCache(state, value) {
      state.quickSwitchCache.push({
        ...value,
        subjectLongName: value.name
          ? value.subjectLongName + " (" + value.name + ")"
          : value.subjectLongName
      })
    }
  },
  actions: {
    generateCache(context) {
      function subjectName(event) {
        const subject =
          context.state.subjects[
            context.state.subjects.findIndex((x) => x.name === event.title)
          ]
        if (!subject) {
          return event.longTitleWithoutTime
        } else {
          return `${subject.subjectLongName} - (${event.longTitleWithoutTime})`
        }
      }
      Vue.axios
        .post("/Services/Calendar.svc/GetCalendarEventsByUser", {
          activityId: null,
          endDate: dayjs(context.state.focus)
            .add(7, "day")
            .format("YYYY-MM-DD"),
          homePage: true,
          limit: 25,
          locationId: null,
          page: 1,
          staffIds: null,
          start: 0,
          startDate: dayjs(context.state.focus)
            .subtract(7, "day")
            .format("YYYY-MM-DD"),
          userId: context.state.user?.userId || localStorage.getItem("userId")
        })
        .then((res) => {
          context.commit(
            "setEvents",
            res.data.d.map((event) => {
              return {
                name: subjectName(event),
                content: event.longTitle,
                color: event.backgroundColor,
                start: new Date(event.start),
                end: new Date(event.finish),
                timed: !event.allDay,
                activityType: event.activityType,
                activityId: event.activityId,
                instanceId: event.instanceId
              }
            })
          )
          localStorage.setItem(
            "eventsCache",
            JSON.stringify(context.state.events)
          )
          localStorage.setItem("userCache", JSON.stringify(context.state.user))
        })
    },
    getState(context) {
      Vue.axios
        .get("/api/v1/state?v=" + context.state.versioning.version)
        .then((res) => {
          context.commit("setOnline", true)
          context.commit("setSite", res.data)
          context.commit("setLoading", false)
        })
        .catch(() => {
          context.commit("setOnline", false)
          context.commit("setLoading", false)
        })
    },
    updateQuickSwitch(context) {
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "Home",
        customType: 1,
        route: "/"
      })
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "Your Profile",
        customType: 1,
        route: "/user/" + context.state.user.userId + "/dashboard"
      })
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "Reports",
        customType: 1,
        route: "/user/" + context.state.user.userId + "/reports"
      })
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "Events",
        customType: 1,
        route: "/user/" + context.state.user.userId + "/events"
      })
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "School Resources",
        customType: 1,
        route: "/school/resources"
      })
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "Changelog",
        customType: 1,
        route: "/changelog"
      })
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "Learning Tasks",
        customType: 1,
        route: "/user/" + context.state.user.userId + "/tasks"
      })
      context.commit("updateQuickSwitchCache", {
        subjectLongName: "BetterCompass Settings",
        customType: 1,
        route: "/user/" + context.state.user.userId + "/settings"
      })
      Vue.axios
        .post(
          "/Services/Subjects.svc/GetStandardClassesOfUserInAcademicGroup",
          {
            userId: context.state.user.userId,
            limit: 100,
            start: 0,
            page: 1,
            academicGroupId: -1
          }
        )
        .then((res) => {
          res.data.d.data.forEach((subject) => {
            context.commit("updateQuickSwitchCache", subject)
          })
        })
    },
    saveOnlineSettings(context, setting) {
      return new Promise((resolve, reject) => {
        if (setting) {
          Vue.axios
            .put("/api/v1/user/settings/full", {
              ...context.state.bcUser,
              ...setting
            })
            .then((res) => {
              resolve(res.data)
            })
            .catch((e) => {
              reject(e.response.data)
            })
        } else {
          Vue.axios
            .put("/api/v1/user/settings/full", {
              ...context.state.bcUser
            })
            .then((res) => {
              resolve(res.data)
            })
            .catch((e) => {
              reject(e.response.data)
            })
        }
      })
    },
    getUserInfo(context) {
      Vue.axios.defaults.headers.common["compassInstance"] =
        localStorage.getItem("schoolInstance")
      Vue.axios.defaults.headers.common["compassSchoolId"] =
        localStorage.getItem("schoolId")
      Vue.axios.defaults.headers.common["compassUserId"] =
        localStorage.getItem("userId")
      return new Promise((resolve, reject) => {
        Vue.axios
          .get("/api/v1/user")
          .then((res) => {
            context.commit("setBetterCompassUser", res.data)
            const name = res.data.themeObject.id
            const dark = res.data.themeObject.theme.dark
            const light = res.data.themeObject.theme.light
            if (res.data.accentColor) {
              res.data.themeObject.theme.dark.primary = res.data.accentColor
              res.data.themeObject.theme.light.primary = res.data.accentColor
            }
            Vuetify.framework.theme.themes.dark = dark
            Vuetify.framework.theme.themes.light = light
            Vuetify.framework.theme.themes.name = name
            Vuetify.framework.theme.themes.primaryType =
              res.data.themeObject.theme.primaryType
            Vue.axios
              .post("/services/mobile.svc/GetPersonalDetails", {
                userId: localStorage.getItem("userId")
              })
              .then((res) => {
                context.commit("setUser", res.data.d.data)
                Vue.axios
                  .post("/Services/NewsFeed.svc/GetMyUpcoming", {
                    userId: context.state.user.userId
                  })
                  .then((res) => {
                    context.commit("setUpcomingEvents", res.data.d)
                  })
                  .catch(() => {})
                Vue.axios
                  .post("/Services/NewsFeed.svc/GetMyAlerts")
                  .then((res) => {
                    context.commit("setAlerts", res.data.d)
                  })
                  .catch(() => {})
                Vue.axios
                  .post(
                    "/Services/Subjects.svc/GetStandardClassesOfUserInAcademicGroup",
                    {
                      userId: context.state.user.userId,
                      limit: 100,
                      start: 0,
                      page: 1,
                      academicGroupId: -1
                    }
                  )
                  .then((res) => {
                    context.commit("setSubjects", res.data.d.data)
                  })
                  .catch(() => {})
                context.commit("setLoading", false)
                context.commit("setOnline", true)
                resolve(res.data.d.data)
              })
              .catch((e) => {
                context.commit("setLoading", false)
                reject(e)
              })
          })
          .catch((e) => {
            const theme = {
              id: 1,
              name: "BetterCompass Classic",
              primaryType: "all",
              dark: {
                primary: "#0190ea",
                secondary: "#757575",
                accent: "#000000",
                error: "#ff1744",
                info: "#2196F3",
                success: "#4CAF50",
                warning: "#ff9800",
                card: "#151515",
                toolbar: "#191919",
                sheet: "#181818",
                text: "#000000",
                dark: "#151515",
                bg: "#151515",
                calendarNormalActivity: "#3f51b5",
                calendarActivityType7: "#f44336",
                calendarActivityType8: "#4caf50",
                calendarActivityType10: "#ff9800",
                calendarExternalActivity: "#2196f3"
              },
              light: {
                primary: "#0190ea",
                secondary: "#757575",
                accent: "#000000",
                error: "#ff1744",
                info: "#2196F3",
                success: "#4CAF50",
                warning: "#ff9800",
                card: "#f8f8f8",
                toolbar: "#f8f8f8",
                sheet: "#f8f8f8",
                text: "#000000",
                dark: "#f8f8f8",
                bg: "#f8f8f8",
                calendarNormalActivity: "#3f51b5",
                calendarActivityType7: "#f44336",
                calendarActivityType8: "#4caf50",
                calendarActivityType10: "#ff9800",
                calendarExternalActivity: "#2196f3"
              }
            }
            const name = theme.id
            const dark = theme.dark
            const light = theme.light
            Vuetify.framework.theme.themes.dark = dark
            Vuetify.framework.theme.themes.light = light
            Vuetify.framework.theme.themes.name = name
            this.name = name
            console.log("Failed to load BetterCompass Account")
            context.user = null
            reject(e)
          })
      })
    }
  },
  modules: {}
})
