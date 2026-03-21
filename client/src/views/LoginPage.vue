<template>
    <div class="login-page">
        <!-- 屏幕左边：垂直中间偏上，显示标题文字 -->
        <div class="login-left">
            <section class="login-title">
                <h1>Next Prompt</h1>
                <p>由大语言模型驱动的网页文字冒险游戏平台</p>
            </section>
        </div>

        <!-- 屏幕右边：垂直中间偏上，显示输入框和 Hint -->
        <div class="login-right">
            <transition name="fade" mode="out-in">
                <section class="login-form form-box" v-if="showForm === 'login'">
                    <input type="text" v-model="loginUserName" placeholder="用户 ID" />
                    <input type="password" v-model="loginPassWord" placeholder="密码" />
                    <button class="btn-primary" @click="sendLogin" :disabled="operationLock">登陆</button>
                    <div class="login-hint">
                        <p>如果没有账号的话，你可以试着</p>
                        <button class="btn-text" @click="showForm = 'register'">注册</button>
                    </div>
                </section>

                <section class="register-form form-box" v-else>
                    <input type="text" v-model="registerUserName" placeholder="用户名" />
                    <input type="password" v-model="registerPassword" placeholder="密码" />
                    <input type="password" v-model="confirmPassword" placeholder="确认密码（应当和上面的密码相同）" />
                    <button class="btn-primary" @click="sendRegister" :disabled="operationLock">注册</button>
                    <div class="login-hint">
                        <p>为了将故事和你联系起来，我需要你的名字</p>
                        <button class="btn-text" @click="showForm = 'login'">登陆</button>
                    </div>
                </section>
            </transition>
        </div>


    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { popupNotify } from '../services/popup'
import socketClient from '../services/socket'
import { useAccountStore, type AccountRecordInfo } from '../stores/account';
const showForm = ref<'login' | 'register'>('register')

const loginUserName = ref('');
const loginPassWord = ref('');
const registerUserName = ref('');
const registerPassword = ref('');
const confirmPassword = ref('');

const accountStore = useAccountStore();
const operationLock = computed(() => accountStore.operationLock);

async function getHashedPassword(password: string) {
    if (password.length === 0) return 'whynotsetapasswordyoucirno999';
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendLogin() {
    if (loginUserName.value.length === 0) {
        popupNotify({
            title: '无效的用户 ID',
            message: `没有输入用户 ID，请输入你的用户 ID，这样我们才能找到你的账号`,
            duration: 3000,
        })
        return;
    }
    if (loginPassWord.value.length === 0) {
        popupNotify({
            title: '注意：空密码',
            message: `不为账号设置密码是可行的，但若要保证账号不被他人登陆，建议设置密码`,
            duration: 3000,
        })
    }
    popupNotify({
        title: '正在发送登录请求',
        message: `请稍等一会 ${loginUserName.value}，我们正在验证你的身份，可以先喝口水休息一下!`,
        duration: 3000,
    })
    const hashedPassword = await getHashedPassword(loginPassWord.value);
    socketClient.emit('req_user_login', { userName: loginUserName.value, password: hashedPassword })
}

async function sendRegister() {
    if (registerUserName.value.length === 0) {
        popupNotify({
            title: '无效的注册请求',
            message: `若要注册一个账号，用户名是必要的`,
            duration: 3000,
        })
        return;
    }
    if (registerPassword.value !== confirmPassword.value) {
        popupNotify({
            title: '无效的注册请求',
            message: `你输入的密码和确认密码不一致，请检查后重新输入`,
            duration: 3000,
        })
        return;
    }
    if (registerPassword.value.length === 0) {
        popupNotify({
            title: '注意：空密码',
            message: `不为账号设置密码是可行的，但若要保证账号不被他人登陆，建议设置密码`,
            duration: 3000,
        })
    }
    popupNotify({
        title: '正在发送注册请求',
        message: `请稍等一会 ${registerUserName.value}，我们正在创建你的账号，可以先喝口水休息一下！`,
        duration: 3000,
    })
    const hashedPassword = await getHashedPassword(registerPassword.value);
    socketClient.emit('req_user_signup', { userName: registerUserName.value, password: hashedPassword })
}

if (localStorage.getItem("accountInfo")) {
    showForm.value = 'login';
    const accountInfo = JSON.parse(localStorage.getItem("accountInfo")!) as AccountRecordInfo;
    if (accountInfo.userName) {
        loginUserName.value = accountInfo.accountId;
    }
    popupNotify({
        title: '欢迎回来',
        message: `你好 ${accountInfo.userName}，你曾登陆过账号，已自动填写了用户 ID ${accountInfo.accountId}`,
        duration: 3500,
    })
} else {
    popupNotify({
        title: '欢迎来到 Next Prompt',
        message: `这位读者，欢迎来到 Next Prompt！在这里，你可以体验由大语言模型驱动的文字冒险游戏。请先注册一个账号，或者如果你已经有账号了，可以直接登录。`,
        duration: 4500,
    })
}
</script>

<style lang="css" scoped>
.login-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: row;
    /* 使用 store 中的全局背景变量 */
    background-image: var(--bg-image, none);
    background-color: var(--color-background, #1e1e1e);
    background-size: cover;
    background-position: center;
}

/* 左侧标题区域 */
.login-left {
    flex: 1;
    display: flex;
    justify-content: flex-end; /* 靠近中间位置 */
    align-items: flex-start;
    padding-top: 35vh; /* 垂直中间偏上 */
    padding-right: 50px;
}

.login-title {
    text-align: right;
    color: var(--color-text, #fff);
}

.login-title h1 {
    margin: 0 0 10px 0;
    font-size: 3.5rem;
    font-weight: bold;
    color: var(--color-primary, #4caf50);
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.login-title p {
    margin: 0;
    font-size: 1.2rem;
    opacity: 0.8;
}

/* 右侧表单区域 */
.login-right {
    flex: 1;
    display: flex;
    justify-content: flex-start; /* 靠近中间位置 */
    align-items: flex-start;
    padding-top: 35vh; /* 垂直中间偏上，与标题对齐 */
    padding-left: 50px;
}

.form-box {
    display: flex;
    flex-direction: column;
    width: 25vw;
    gap: 25px;
    background: transparent;
    padding: 30px;
    border: none;
}

input {
    /* 无边框，仅有下划线 */
    background: transparent;
    border: none;
    border-bottom: 2px solid var(--color-border, #555);
    padding: 10px 5px;
    border-radius: 0;
    color: var(--color-text, #fff);
    font-size: 1.1rem;
    outline: none;
    transition: all 0.3s ease;
}

input:focus {
    border-bottom-color: var(--color-primary, #4caf50);
}

.btn-primary {
    background: var(--color-primary, #4caf50);
    color: white;
    border: none;
    padding: 12px;
    border-radius: 0;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: bold;
    margin-top: 10px;
    transition: filter 0.2s;
}

.btn-primary:hover {
    filter: brightness(1.1);
}

.login-hint {
    margin-top: -10px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--color-text, #fff);
}

.login-hint p {
    margin: 0;
    opacity: 0.7;
}

.btn-text {
    background: none;
    border: none;
    color: var(--color-primary, #4caf50);
    cursor: pointer;
    font-weight: bold;
    text-decoration: underline;
    padding: 0;
    font-size: 0.9rem;
}

.btn-text:hover {
    filter: brightness(1.2);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>