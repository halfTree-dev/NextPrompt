import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './style.css'
import App from './App.vue'
import { router } from './router'

import socketClient from './services/socket'
import accountManager from './services/accountManager'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

socketClient.init();
accountManager.init();

app.mount('#app')
