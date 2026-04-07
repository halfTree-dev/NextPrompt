import { createVNode, render } from "vue";
import { useGuideStore, type GuideInfo } from "../stores/guide";
import GuideWindow from "../components/windows/GuideWindow.vue";
import { bus } from "./socket";

class GuideManager {
    constructor() {}

    init() {
        bus.on("evt_send_guide_message", (payload: any) => {
            const guideStore = useGuideStore();
            const { title, content } = payload as GuideInfo;
            guideStore.guideInfos.push({ title, content });
            this.updateGuideInfos();
        });
    }

    updateGuideInfos() {
        const guideStore = useGuideStore();
        const guideInfos: GuideInfo[] = guideStore.guideInfos;
        if (guideInfos.length === 0) {
            let container = document.getElementById("guide-container");
            if (container) {
                render(null, container);
                container.remove();
            }
        } else {
            let container = document.getElementById("guide-container");
            if (!container) {
                container = document.createElement("div");
                container.id = "guide-container";
                document.body.appendChild(container);
                const vnode = createVNode(GuideWindow);
                render(vnode, container);
            }
        }
    }
}

export const guideManager = new GuideManager();
export default guideManager;