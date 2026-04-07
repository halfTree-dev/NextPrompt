import { useAccountStore } from "../stores/account";
import { popupNotify } from "./popup";
import { bus } from "./socket";
import { router } from "../router";
import { doTitleLeadinEffect } from "./effect";

class AccountManager {
    constructor() {}

    init() {
        bus.on("ack_login_result", (payload) => {
            const accountStore = useAccountStore();
            if (payload.success) {
                popupNotify({
                    title: "登录成功",
                    message: payload.message,
                    duration: 3000,
                })
                router.push("/lobby");
                doTitleLeadinEffect({
                    title: "测试标题",
                    subtitle: "测试副标题",
                    textDuration: 2500,
                    transitionDuration: 1200,
                })
            } else {
                popupNotify({
                    title: "登录失败",
                    message: payload.message,
                    duration: 3000,
                });
            }
            accountStore.isLoginSuccess = payload.success;
        });

        bus.on("evt_account_info", (payload) => {
            const accountStore = useAccountStore();
            accountStore.accountInfo = payload.accountInfo;
            popupNotify({
                title: "账号信息已获取",
                message: `你的账号 ${payload.accountInfo.accountId} 被认证为 ${payload.accountInfo.userName}`,
                duration: 3000,
            })
            localStorage.setItem("accountInfo", JSON.stringify(payload.accountInfo));
        });

        bus.on("evt_cancel_op_lock", (_ : {}) => {
            const accountStore = useAccountStore();
            accountStore.operationLock = false;
        });
    }
}

const accountManager = new AccountManager();
export default accountManager;