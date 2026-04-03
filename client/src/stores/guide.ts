import { defineStore } from 'pinia';

export interface GuideInfo {
    title: string;
    content: string;
}

export const useGuideStore = defineStore('guide', {
    state: () => ({
        guideInfos: [] as GuideInfo[],
        currentGuideIndex: 0,
    }),
});