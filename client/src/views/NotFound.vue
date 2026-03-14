<template>
    <div>正在返回首页...</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { popupNotify } from '../services/popup'
import { router } from '../router'

onMounted(() => {
    popupNotify({
        title: "你去哪里了？",
        message: "不好意思，刚才你找的页面不在我的记录中... 请不要再去那里了，好吗？另外，如果是你在正常操作过程中发生了这件事，务必联系我的开发者让他们知道，谢谢！",
        duration: 7000
    })
    router.replace("/")
})
</script>