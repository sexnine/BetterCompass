<template>
  <div id="user-dashboard">
    <v-dialog v-model="chronicle.info" v-if="chronicle.info" max-width="600px">
      <v-card color="card">
        <v-card-title>
          <span class="headline">{{
            chronicle.selected.chronicleEntries[0].templateName
          }}</span>
        </v-card-title>
        <v-card-text>
          <v-chip-group column>
            <v-chip color="indigo"
              >{{
                chronicle.selected.chronicleEntries[0].communicationLogs.length
              }}
              email recipients</v-chip
            >
            <v-chip
              v-if="chronicle.selected.chronicleEntries[0].visibleToParents"
              >Parents</v-chip
            >
          </v-chip-group>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-row>
      <v-col>
        <v-alert
          elevation="5"
          class="rounded-xl"
          type="error"
          v-for="flag in user.userFlags"
          :key="flag.id"
        >
          {{ flag.d }}
        </v-alert>
        <v-card color="card" elevation="7" class="rounded-xl">
          <v-toolbar color="toolbar">
            <v-toolbar-title>Account</v-toolbar-title>
          </v-toolbar>
          <v-container>
            <v-row>
              <v-col sm="2">
                <v-img :src="getUserImage" width="200"></v-img>
              </v-col>
              <v-col>
                <p>
                  Name:
                  <b>{{ user.userFullName }}</b
                  ><br />
                  {{ this.baseRole() }} ID (Username):
                  <b>{{ user.userSussiID }}</b
                  ><br />
                  Display Code: <b>{{ user.userDisplayCode }}</b
                  ><br />
                  <template v-if="$store.state.parent"
                    >Parent ID (SussiID):
                    <b>Configure parent linking in BetterCompass settings.</b
                    ><br
                  /></template>
                  <template v-if="$store.state.user.id === user.userId">
                    BetterCompass ID:
                    <b>{{ $store.state.user.bcUser.id }}</b>
                    <br
                  /></template>
                  <template v-if="user.userEmail">
                    Email: <b>{{ user.userEmail }}</b>
                    <br />
                  </template>
                  <template v-if="getStaff(user.userId)?.ce">
                    Staff Email: <b>{{ getStaff(user.userId).ce }}</b>
                    <br />
                  </template>
                  <template v-if="user.userDetails">
                    Age: <b>{{ user.userDetails }}</b
                    ><br />
                  </template>
                  <template
                    v-if="
                      parents.length && user.userId === $store.state.user.id
                    "
                  >
                    Parent(s):
                    <br />
                    <b>
                      <template v-for="parent in parents">
                        {{ parent.name }} ({{ parent.importIdentifier }} /
                        {{ parent.id }})
                        <br :key="parent.id" />
                      </template>
                    </b>
                  </template>
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <v-chip color="indigo" v-on="on">{{
                        user.chroniclePinnedCount
                      }}</v-chip>
                    </template>
                    <span> Pinned Chronicle Count </span>
                  </v-tooltip>
                  <br />
                  Today's Attendance:
                  <v-chip-group column>
                    <v-tooltip
                      top
                      v-for="attendance in user.userTimeLinePeriods"
                      :key="attendance.id"
                    >
                      <template v-slot:activator="{ on }">
                        <span v-on="on">
                          <v-chip
                            pill
                            style="opacity: 1"
                            disabled
                            fab
                            :color="getAttendance(attendance.status).color"
                          >
                            <v-icon>
                              {{ getAttendance(attendance.status).icon }}
                            </v-icon>
                          </v-chip>
                        </span>
                      </template>
                      <span
                        >{{ attendance.name }}:
                        {{ attendance.statusName }}</span
                      >
                    </v-tooltip>
                  </v-chip-group>
                </p>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
        <v-card
          color="card"
          elevation="7"
          class="rounded-xl mt-3"
          v-if="extendedUser?.data?.medicalInformation?.length"
        >
          <v-toolbar color="toolbar">
            <v-toolbar-title>Medical Record</v-toolbar-title>
          </v-toolbar>
          <v-container
            v-for="medical in extendedUser.data.medicalInformation"
            :key="medical.id"
          >
            <strong>{{ medical.title }}</strong>
            <p>Regular Medication: {{ medical.regularMedication }}</p>
            <p>Symptoms: {{ medical.symptoms }}</p>
            <p>Description: {{ medical.description }}</p>
            <p style="white-space: pre-line; overflow-wrap: anywhere">
              Action: {{ medical.action }}
            </p>
          </v-container>
        </v-card>
      </v-col>
      <v-col>
        <v-card color="card" class="rounded-xl" elevation="7">
          <v-overlay :value="chronicle.loading" absolute>
            <v-progress-circular indeterminate size="64"></v-progress-circular>
          </v-overlay>
          <v-toolbar color="toolbar">
            <v-toolbar-title>Chronicle</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-title>
              <v-select
                :items="chronicle.years"
                item-value="cycleIds"
                item-text="name"
                v-model="chronicle.year"
                solo
                hide-details
                single-line
                placeholder="Cycle"
              ></v-select>
            </v-toolbar-title>
          </v-toolbar>
          <v-container>
            <v-card color="card" class="mb-3 rounded-xl">
              <v-toolbar color="toolbar">
                <v-toolbar-title> Chronicle Summary </v-toolbar-title>
              </v-toolbar>
              <v-data-table
                :items="chronicle.summary"
                :headers="chronicle.summaryHeaders"
                :style="
                  'background-color: ' +
                  $vuetify.theme.themes[$vuetify.theme.dark ? 'dark' : 'light']
                    .card
                "
              >
              </v-data-table>
            </v-card>
            <v-card
              color="card"
              v-for="item in chronicle.pinned"
              :key="item.id"
              class="mb-3 rounded-xl"
            >
              <v-toolbar color="toolbar">
                <v-avatar
                  @click="
                    $router.push(
                      '/user/' + item.chronicleEntries[0].userIdCreator
                    )
                  "
                  style="cursor: pointer"
                  large
                  class="mr-3"
                >
                  <img
                    :src="
                      '/download/cdn/square/' +
                      getStaff(item.chronicleEntries[0].userIdCreator)?.pv +
                      '?compassInstance=' +
                      $store.state.school.instance
                    "
                  />
                </v-avatar>
                <v-toolbar-title>
                  {{ item.chronicleEntries[0].templateName }}
                  <div class="subheading subtitle-1">
                    Recorded by:
                    <span
                      @click="
                        $router.push(
                          '/user/' + item.chronicleEntries[0].userIdCreator
                        )
                      "
                      style="cursor: pointer"
                      >{{
                        getStaff(item.chronicleEntries[0].userIdCreator)?.n
                      }}</span
                    >, on
                    {{
                      $date(item.chronicleEntries[0].createdTimestamp).format(
                        "MMMM Do, YYYY"
                      )
                    }}
                  </div>
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-chip
                  color="indigo"
                  class="mr-2"
                  @click="
                    chronicle.selected = item
                    chronicle.info = true
                  "
                  >Info</v-chip
                >
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <div v-on="on" v-bind="attrs">
                      <div v-on="on">
                        <v-chip
                          disabled
                          style="opacity: 1"
                          @click="
                            chronicle.selected = item
                            chronicle.info = true
                          "
                          ><v-icon small>mdi-pin-outline</v-icon></v-chip
                        >
                      </div>
                    </div>
                  </template>
                  <span v-if="item.chronicleEntries[0].attendees[0].pinExpiry">
                    This chronicle is pinned until:
                    {{
                      $date(
                        item.chronicleEntries[0].attendees[0].pinExpiry
                      ).format("MMMM Do YYYY")
                    }}) }}
                  </span>
                  <span v-else> This pin has no expiry </span>
                </v-tooltip>
              </v-toolbar>
              <v-container>
                <div
                  v-for="input in item.chronicleEntries[0].inputFields"
                  :key="input.id"
                >
                  <template v-if="JSONExtract(input.value).length">
                    {{ getJSON(input.value) }}
                  </template>
                  <template v-else>
                    {{ input.value }}
                  </template>
                </div>
              </v-container>
            </v-card>
            <v-card
              color="card"
              v-for="item in chronicle.items"
              :key="item.id"
              class="mb-3 rounded-xl"
            >
              <v-toolbar color="toolbar">
                <v-avatar
                  @click="
                    $router.push(
                      '/user/' + item.chronicleEntries[0].userIdCreator
                    )
                  "
                  style="cursor: pointer"
                  large
                  class="mr-3"
                >
                  <img
                    :src="
                      '/download/cdn/square/' +
                      getStaff(item.chronicleEntries[0].userIdCreator)?.pv +
                      '?compassInstance=' +
                      $store.state.school.instance
                    "
                  />
                </v-avatar>
                <v-toolbar-title>
                  {{ item.chronicleEntries[0].templateName }}
                  <div class="subheading subtitle-1">
                    Recorded by:
                    <span
                      @click="
                        $router.push(
                          '/user/' + item.chronicleEntries[0].userIdCreator
                        )
                      "
                      style="cursor: pointer"
                      >{{
                        getStaff(item.chronicleEntries[0].userIdCreator)?.n
                      }}</span
                    >, on
                    {{
                      $date(item.chronicleEntries[0].createdTimestamp).format(
                        "MMMM Do, YYYY"
                      )
                    }}
                  </div>
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-chip
                  color="indigo"
                  @click="
                    chronicle.selected = item
                    chronicle.info = true
                  "
                  >Info</v-chip
                >
              </v-toolbar>
              <v-container>
                <div
                  v-for="input in item.chronicleEntries[0].inputFields"
                  :key="input.id"
                >
                  <template v-if="JSONExtract(input.value).length">
                    {{ getJSON(input.value) }}
                  </template>
                  <template v-else>
                    {{ input.value }}
                  </template>
                </div>
              </v-container>
            </v-card>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import JSONExtract from "@/lib/jsonExtract"

export default {
  name: "UserDashboard",
  props: ["user", "extendedUser"],
  data() {
    return {
      chronicle: {
        summary: [],
        summaryHeaders: [
          {
            text: "Name",
            value: "categoryName"
          },
          {
            text: "Total Points",
            value: "totalPoints"
          },
          {
            text: this.$date().year(),
            value: "yearCount"
          },
          {
            text: "Total",
            value: "totalCount"
          }
        ],
        loading: true,
        loadingPinned: true,
        pinned: [],
        users: [],
        years: [],
        info: false,
        year: this.$date().year(),
        selected: null,
        offset: 0,
        period: 32,
        page: 1,
        items: []
      },
      parents: []
    }
  },
  computed: {
    getUserImage() {
      if (
        this.$store.state.user.userId === this.user.userId &&
        this.$store.state.user.bcUser.avatar
      ) {
        return "/usercontent/" + this.$store.state.user.bcUser.avatar
      } else {
        return (
          this.user.userPhotoPath +
          "?compassInstance=" +
          this.$store.state.school.instance
        )
      }
    }
  },
  methods: {
    getParents() {
      if (this.user.userId === this.$store.state.user.id) {
        this.axios
          .post(
            "/Services/Communications.svc/GetEmailRecipientsAndParentRecipientsByStudents",
            {
              userIds: [this.user.userId || this.$store.state.user.userId],
              activityId: null,
              subjectUserId: this.user.userId || this.$store.state.user.userId,
              startDate: "",
              endDate: ""
            }
          )
          .then((res) => {
            this.parents = res.data.d
          })
      }
    },
    getParentSummary() {
      this.axios
        .post("/Services/ChronicleV2.svc/GetSummaryForParent", {
          parentUserId: this.user.userId || this.$store.state.user.userId,
          page: 1,
          start: 0,
          limit: 9999
        })
        .then((res) => {
          this.chronicle.summary = res.data.d
        })
    },
    baseRole() {
      const userBaseRole = [
        "Guest",
        "Student",
        "Staff",
        "Parent",
        "Admin",
        "Visitor",
        "Not Authenticated"
      ]
      return userBaseRole[this.user.userRole || 6]
    },
    getStaff(id) {
      const user = this.chronicle.users.find((staff) => staff.id === id)
      if (user?.n) {
        return this.chronicle.users.find((staff) => staff.id === id)
      } else {
        if (id) {
          this.axios
            .post("/Services/User.svc/GetUserDetailsBlobByUserId", {
              userId: this.$store.state.user.userId,
              targetUserId: id
            })
            .then((response) => {
              this.chronicle.users.push({
                id: response.data.d.userId,
                n: response.data.d.userFullName,
                pv:
                  response.data.d.userSquarePhotoPath.replace(
                    "/download/cdn/square/",
                    ""
                  ) || "nopic",
                status: response.data.d.userStatus
              })
              return this.chronicle.users.find((staff) => staff.id === id)
            })
        } else {
          this.chronicle.users.push({
            id: null,
            n: "Deleted User",
            pv: "nopic",
            status: "5"
          })
        }
      }
    },
    getAllStaff() {
      this.axios
        .post("/Services/User.svc/GetAllStaff", {
          start: 0
        })
        .then((res) => {
          this.chronicle.users = res.data.d
        })
    },
    generateYears() {
      const currentYear = this.$date().year()
      for (let i = 2016; i <= currentYear; i++) {
        this.chronicle.years.push(i)
      }
    },
    getAttendance(attendanceStatus) {
      if (attendanceStatus === 1) {
        return {
          color: "green",
          icon: "mdi-check"
        }
      } else if (attendanceStatus === 2 || attendanceStatus === 3) {
        return {
          color: "red",
          icon: "mdi-close"
        }
      } else if (attendanceStatus === 4 || attendanceStatus === 5) {
        return {
          color: "orange",
          icon: "mdi-clock"
        }
      } else {
        return {
          color: "grey",
          icon: "mdi-help"
        }
      }
    },
    JSONExtract(str) {
      return JSONExtract(str)
    },
    getAllChronicles() {
      this.chronicle.loadingPinned = true
      this.axios
        .post("/Services/ChronicleV2.svc/GetUserChronicleFeed", {
          targetUserId: this.$route.params.id || this.$store.state.user?.userId,
          start: this.chronicle.offset,
          startDate: this.$date("01-01-2016").startOf("year").format(),
          endDate: this.$date().endOf("year").format(),
          pageSize: 10000,
          filterCategoryIds: [
            2, 16, 3, 11, 4, 9, 26, 10, 5, 29, 27, 1, 8, 14, 24, 23, 13, 15, 20,
            22, 25, 19, 12, 6, 28, 21, 7, 17
          ],
          asParent: true,
          page: this.chronicle.page,
          limit: 10000
        })
        .then((res) => {
          // find all in res.data.d.data that have chronicleEntries[0].attendees[0].pinToProfile
          this.chronicle.pinned = res.data.d.data.filter((chronicle) => {
            if (
              chronicle.chronicleEntries[0].attendees[0].pinToProfile &&
              this.$date(
                chronicle.chronicleEntries[0].attendees[0].pinExpiry ||
                  "01-01-9999"
              ).isAfter(this.$date())
            ) {
              return chronicle
            }
          })
          this.chronicle.loadingPinned = false
        })
        .catch(() => {
          this.$toast.error("Failed to load pinned chronicles.")
          this.chronicle.loadingPinned = false
        })
    },
    getChronicle() {
      this.chronicle.loading = true
      this.axios
        .post("/Services/ChronicleV2.svc/GetUserChronicleFeed", {
          targetUserId: this.$route.params.id || this.$store.state.user?.userId,
          start: this.chronicle.offset,
          pageSize: 43,
          startDate: this.$date("01-01-" + this.chronicle.year)
            .startOf("year")
            .format(),
          endDate: this.$date("01-01-" + this.chronicle.year)
            .endOf("year")
            .format(),
          filterCategoryIds: [
            2, 16, 3, 11, 4, 9, 26, 10, 5, 29, 27, 1, 8, 14, 24, 23, 13, 15, 20,
            22, 25, 19, 12, 6, 28, 21, 7, 17
          ],
          asParent: true,
          page: this.chronicle.page,
          limit: 60
        })
        .then((res) => {
          this.chronicle.items = res.data.d.data
          this.chronicle.loading = false
        })
        .catch(() => {
          this.$toast.error("Failed to load chronicles.")
          this.chronicle.loading = false
        })
    },
    getJSON(json) {
      const parsed = JSON.parse(json)
      const indexed = parsed[parsed.findIndex((x) => x.isChecked)]
      if (indexed) {
        return indexed.valueOption
      }
    }
  },
  mounted() {
    this.getAllStaff()
    this.generateYears()
    this.getChronicle()
    this.getAllChronicles()
    this.getParentSummary()
    this.getParents()
  },
  watch: {
    "chronicle.year"() {
      this.getChronicle()
    }
  }
}
</script>

<style scoped></style>
