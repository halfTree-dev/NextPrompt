import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './style.css'
import App from './App.vue'
import { router } from './router'

import socketClient from './services/socket'
import accountManager from './services/accountManager'
import { initStyleManager } from './services/styleManager'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

socketClient.init();
accountManager.init();

initStyleManager();

app.mount('#app')
