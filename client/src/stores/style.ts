import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStyleStore = defineStore('style', () => {
    const currentTheme = ref('dark');
    const backgroundImageUrl = ref('');
    const colors = ref({
        background: '#1e1e1e',
        panel: '#2d2d2d',
        text: '#f4f4f4',
        primary: '#267cd2',
        secondary: '#4296ea',
        border: '#3c3c3c',
        divider: '#5a5a5a',
        emphasis: '#f1a429',
        emphasis2: '#f38612',
    });

    function setTheme(theme: string, newColors?: Record<string, string>) {
        currentTheme.value = theme;
        colors.value = {
            ...colors.value,
            ...(theme === 'light' ? {
                background: '#f5f5f5',
                panel: '#ffffff',
                text: '#000000',
                border: '#dddddd',
                divider: '#cccccc'
            } : {
                background: '#1e1e1e',
                panel: '#2d2d2d',
                text: '#ffffff',
                border: '#3c3c3c',
                divider: '#5a5a5a'
            }),
            ...newColors
        };
    }

    function setBackgroundImage(url: string) {
        backgroundImageUrl.value = url;
    }

    return { currentTheme, backgroundImageUrl, colors, setTheme, setBackgroundImage };
});

