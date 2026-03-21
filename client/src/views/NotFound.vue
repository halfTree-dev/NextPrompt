<template>
    <div>YOU SHALL NOT PASS!</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { popupNotify } from '../services/popup'
import { router } from '../router'

onMounted(() => {
    popupNotify({
        title: "未知路由错误",
        message: "你似乎访问了一个不存在的页面，如果是你在正常操作过程中发生了这件事，务必联系我的开发者让他们知道，谢谢！",
        duration: 7000
    })
    router.replace("/")
})
</script>