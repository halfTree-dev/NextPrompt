<template>
    <section class="login-title">
        <p>Login Page</p>
    </section>

    <section class="login-form" v-if:="showForm === 'login'">
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button>Login</button>
    </section>

    <section class="register-form" v-else>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <input type="password" placeholder="Confirm Password" />
        <button>Register</button>
    </section>

    <section class="login-hint">
        <p v-if="isFirstTime">Seems to be the first time text here.</p>
        <p v-else>Seems to be not the first time text here.</p>
    </section>

    <section class="login-register">
        <p>Don't have an account?</p>
        <button>Register</button>
    </section>

</template>

<script setup lang="ts">
const showForm : 'login' | 'register' = 'login'
const isFirstTime = true
</script>

<style lang="css" scoped>
</style>