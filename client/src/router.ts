import { createRouter, createWebHistory } from 'vue-router'

import LobbyMenu from './views/LobbyMenu.vue'
import LoginPage from './views/LoginPage.vue'
import GamePage from './views/GamePage.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: LoginPage },
        { path: '/lobby', component: LobbyMenu },
        { path: '/game/:id', component: GamePage }
    ]
})