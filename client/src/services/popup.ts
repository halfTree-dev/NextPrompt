import { createVNode, render } from 'vue';
import NotifyPopup from '../components/popups/NotifyPopup.vue';
import AlertPopup from '../components/popups/AlertPopup.vue';

let alertZIndex = 9000;

export interface NotifyOptions {
    title: string;
    message: string;
    duration?: number;
}

export interface AlertOptions {
    title: string;
    message: string;
}

export function popupNotify(options: NotifyOptions) {
    let container = document.getElementById('notify-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notify-container';
        container.style.position = 'fixed';
        container.style.left = '20px';
        container.style.bottom = '20px';
        container.style.display = 'flex';
        // 使用 column-reverse，新加入的 wrapper 节点在最后，但是会因为 flex 属性排在上面
        container.style.flexDirection = 'column-reverse';
        container.style.gap = '15px';
        container.style.zIndex = '9999';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }

    const wrapper = document.createElement('div');
    container.appendChild(wrapper);

    const remove = () => {
        render(null, wrapper);
        wrapper.remove();
        if (container?.childNodes.length === 0) {
            container.remove();
        }
    };

    const vnode = createVNode(NotifyPopup, { ...options, remove });
    render(vnode, wrapper);
}

export function popupAlert(options: AlertOptions) {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);

    const currentZIndex = alertZIndex--;

    const remove = () => {
        render(null, wrapper);
        wrapper.remove();
        alertZIndex++;
    };

    const vnode = createVNode(AlertPopup, { ...options, zIndex: currentZIndex, remove });
    render(vnode, wrapper);
}