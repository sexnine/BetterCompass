<template>
  <div id="activity">
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <div v-if="error">
      <v-container>
        <v-alert :value="true" type="error" text>
          Something went wrong while loading this activity, it may not exist or
          you may not have permission to view it.
        </v-alert>
      </v-container>
    </div>
    <div v-if="headerImage">
      <v-img :src="headerImage" aspect-ratio="16/9" id="activity-header">
        <v-container fill-height fluid>
          <v-row align="center" justify="center">
            <v-col>
              <h1 style="color: #ffffff">
                {{ activity.SubjectName || activity.ActivityDisplayName }}
              </h1>
              <p style="color: #ffffff">{{ activity.ActivityDisplayName }}</p>
            </v-col>
          </v-row>
        </v-container>
      </v-img>
      <v-tabs background-color="card">
        <v-tab to="dashboard" color="card"> Dashboard </v-tab>
        <v-tab to="schedule"> Schedule </v-tab>
        <v-tab to="tasks"> Learning Tasks </v-tab>
        <v-tab to="resources"> Resources </v-tab>
        <v-tab to="roll">
          Roll
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on">
                <v-icon>mdi-information</v-icon>
              </v-btn>
            </template>
            <span> This is a BetterCompass exclusive feature. </span>
          </v-tooltip>
        </v-tab>
        <v-tab to="discussions" v-if="$store.state.site.release === 'dev'">
          Discussions
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on">
                <v-icon>mdi-information</v-icon>
              </v-btn>
            </template>
            <span>
              This is a BetterCompass exclusive feature unless your school
              officially supports it.
            </span>
          </v-tooltip>
        </v-tab>
        <v-tab to="chat" v-if="$store.state.site.release === 'dev'">
          Chat
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on">
                <v-icon>mdi-information</v-icon>
              </v-btn>
            </template>
            <span> This is a BetterCompass exclusive feature. </span>
          </v-tooltip>
        </v-tab>
      </v-tabs>
      <v-container v-if="!activity.RunningStatus">
        <v-alert type="info" class="mx-5" text>
          This session has been cancelled!
        </v-alert>
      </v-container>
      <router-view
        :lessonPlan="lessonPlan"
        :news="news"
        :getActivity="getActivity"
        :activity="activity"
        :activityFull="activityFull"
        :resources="resources"
        :getLessonPlan="getLessonPlan"
      ></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: "Activity",
  data() {
    return {
      error: false,
      activity: null,
      activityFull: {},
      resources: {},
      headerImage: "",
      type: "day",
      lessonPlan: "",
      news: [],
      loading: true
    }
  },
  methods: {
    getLessonPlan() {
      this.lessonPlan = "<p>Loading...</p>"
      if (this.activity.lp.fileAssetId) {
        this.axios
          .get(
            `/Services/FileAssets.svc/DownloadFile?sessionstate=readonly&id=${this.activity.lp.fileAssetId}&nodeId=${this.activity.lp.wnid}`
          )
          .then((res) => {
            this.lessonPlan = res.data
              .replaceAll(/https:(.*)\.compass\.education/g, "")
              .replaceAll(
                `<img src="/Services/FileAssets.svc/DownloadFile?`,
                `<img src="/Services/FileAssets.svc/DownloadFile?compassInstance=${this.$store.state.school.instance}&`
              )
              .replaceAll(
                `<a href="/Services/FileAssets.svc/DownloadFile?`,
                `<a href="/Services/FileAssets.svc/DownloadFile?compassInstance=${this.$store.state.school.instance}&`
              )
              .replaceAll(`<a href="h`, `<a target="_blank" href="h`)
          })
          .catch(() => {
            this.lessonPlan =
              "<p>The lesson plan failed to load, please retry soon.</p>"
          })
      } else {
        this.lessonPlan = "<p>No lesson plan has been uploaded yet.</p>"
      }
    },
    getActivity() {
      this.loading = true
      const type =
        this.$route.params.type === "instance" ? "instanceId" : "activityId"
      const type2 =
        this.$route.params.type === "instance" ? "Instance" : "Activity"
      this.axios
        .post(`/Services/Activity.svc/GetLessonsBy${type2}IdQuick`, {
          [type]: this.$route.params.id
        })
        .then((res) => {
          if (!res.data.d) {
            this.axios
              .post(`/Services/Activity.svc/GetLessonsBy${type2}Id`, {
                [type]: this.$route.params.id
              })
              .then((res) => {
                this.activity = res.data.d
                this.activity.FacultyManagerIds.forEach((id) => {
                  this.axios
                    .post("/Services/User.svc/GetUserDetailsBlobByUserId", {
                      userId: this.$store.state.user.userId,
                      targetUserId: id
                    })
                    .then((res) => {
                      if (!this.activity.managers) this.activity.managers = []
                      this.activity.managers.push({
                        ManagerUserId: res.data.d.userId,
                        ManagerText: res.data.d.userFullName,
                        CoveringImportIdentifier: null,
                        CoveringName: null,
                        CoveringPhotoPath: null,
                        CoveringUserId: null,
                        ManagerImportIdentifier: res.data.d.userDisplayCode,
                        ManagerName: res.data.d.userFullName,
                        ManagerPhotoPath: res.data.d.userPhotoPath
                      })
                      this.activity.ManagerTextReadable =
                        res.data.d.userFullName
                    })
                })
                this.axios
                  .post("/Services/User.svc/GetUserDetailsBlobByUserId", {
                    userId: this.$store.state.user.userId,
                    targetUserId: this.activity.ActivityManagerId
                  })
                  .then((res) => {
                    if (!this.activity.managers) this.activity.managers = []
                    this.activity.managers.push({
                      ManagerUserId: res.data.d.userId,
                      ManagerText: res.data.d.userFullName,
                      CoveringImportIdentifier: null,
                      CoveringName: null,
                      CoveringPhotoPath: null,
                      CoveringUserId: null,
                      ManagerImportIdentifier: res.data.d.userDisplayCode,
                      ManagerName: res.data.d.userFullName,
                      ManagerPhotoPath: res.data.d.userPhotoPath
                    })
                    this.activity.ManagerTextReadable = res.data.d.userFullName
                  })
                this.activity.LocationDetails = {
                  longName: "???",
                  seatNumber: 0,
                  computerNumber: 0
                }
                this.headerImage = "/Assets/Pix/ActivityHeader/Generic.svg"
                this.loading = false
              })
          } else {
            this.activity = res.data.d
            if (!this.activity.LocationDetails) {
              this.activity.LocationDetails = {
                longName: "???",
                seatNumber: 0,
                computerNumber: 0
              }
            }
            this.loading = false
            this.getLessonPlan()
            this.axios
              .post("/Services/NewsFeed.svc/GetActivityNewsFeedPaged", {
                activityId: this.activity.ActivityId,
                limit: 15,
                start: 0
              })
              .then((res) => {
                this.news = res.data.d.data
              })
            this.axios
              .post("/Services/Wiki.svc/GetActivityAndSubjectResourcesNode", {
                activityId: this.activity.ActivityId
              })
              .then((res) => {
                this.resources = res.data.d.children[0]
              })
            this.axios
              .post("/Services/Activity.svc/GetHeaderImageUrlByActivityId", {
                activityId: this.activity.ActivityId
              })
              .then((res) => {
                this.headerImage =
                  "/" + res.data.d.replace("assetPath", "Assets")
              })
          }
        })

      this.axios
        .post(`/Services/Activity.svc/GetLessonsBy${type2}Id`, {
          [type]: this.$route.params.id
        })
        .then((res) => {
          this.activityFull = res.data.d
          this.activityFull.Instances = this.activityFull.Instances.map(
            (instance) => {
              return {
                ...instance,
                dt: instance.dt.replaceAll("&gt;", "-").replaceAll("&lt;", "-")
              }
            }
          )
        })
    }
  },
  mounted() {
    this.getActivity()
  },
  watch: {
    "$route.params.id"() {
      this.getActivity()
    }
  }
}
</script>

<style scoped></style>
