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
                    <input type="text" placeholder="用户名" />
                    <input type="password" placeholder="密码" />
                    <button class="btn-primary">登陆</button>
                    <div class="login-hint">
                        <p>如果没有账号的话，你可以试着</p>
                        <button class="btn-text" @click="showForm = 'register'">注册</button>
                    </div>
                </section>

                <section class="register-form form-box" v-else>
                    <input type="text" placeholder="用户名" />
                    <input type="password" placeholder="密码" />
                    <input type="password" placeholder="确认密码（应当和上面的密码相同）" />
                    <button class="btn-primary">注册</button>
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
import { ref } from 'vue'

const showForm = ref<'login' | 'register'>('register')
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