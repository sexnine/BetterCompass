import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import axios from "axios"
import VueAxios from "vue-axios"
import Toast from "vue-toastification"
import "vue-toastification/dist/index.css"
import './registerServiceWorker'

Vue.use(require('vue-shortkey'))
Vue.config.productionTip = false
Vue.use(VueAxios, axios)
Vue.use(Toast)

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
