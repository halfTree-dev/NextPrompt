import { createVNode, render } from "vue";
import TitleLeadinEffect from "../components/effects/TitleLeadinEffect.vue";

export interface TitleLeadinEffectOptions {
    title: string;
    subtitle: string;
    textDuration?: number;
    transitionDuration?: number;
}

export function doTitleLeadinEffect(options: TitleLeadinEffectOptions) {
    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);

    const remove = () => {
        render(null, wrapper);
        wrapper.remove();
    }

    const vnode = createVNode(TitleLeadinEffect, { ...options, remove });
    render(vnode, wrapper);
}