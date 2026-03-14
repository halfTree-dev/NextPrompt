import { watch } from 'vue';
import { useStyleStore } from '../stores/style';

export function initStyleManager() {
    const styleStore = useStyleStore();

    // 这里采用了获取 DOM 元素的 CSS Variables 来更新样式
    // 所有的颜色变量定义为前缀为 --color- 的 CSS 变量，背景图片变量为 --bg-image
    // CSS 文件应当调用这些变量以设置相应的样式
    const applyColors = () => {
        const root = document.documentElement;
        Object.entries(styleStore.colors).forEach(([key, value]) => {
            root.style.setProperty('--color-' + key, value);
        });
    };

    const applyBackground = () => {
        const root = document.documentElement;
        if (styleStore.backgroundImageUrl) {
            root.style.setProperty('--bg-image', 'url(' + styleStore.backgroundImageUrl + ')');
        } else {
            root.style.removeProperty('--bg-image');
        }
    };

    applyColors();
    applyBackground();

    // 只要 colors 或 backgroundImageUrl 发生变化，就重新应用样式
    // Vue.js 的响应式设计确实让这些设计变得更方便
    watch(() => styleStore.colors, applyColors, { deep: true });
    watch(() => styleStore.backgroundImageUrl, applyBackground);
}

