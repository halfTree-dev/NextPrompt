import { useAccountStore } from "../stores/account";
import { popupNotify } from "./popup";
import { bus } from "./socket";
import { router } from "../router";

class AccountManager {
    constructor() {}

    init() {
        bus.on("ack_login_result", (payload) => {
            const accountStore = useAccountStore();
            if (payload.success) {
                popupNotify({
                    title: "登录成功",
                    message: payload.message,
                    duration: 5000,
                })
                router.push("/lobby");
            } else {
                popupNotify({
                    title: "登录失败",
                    message: payload.message,
                    duration: 5000,
                });
            }
            accountStore.isLoginSuccess = payload.success;
        });

        bus.on("evt_account_info", (payload) => {
            const accountStore = useAccountStore();
            accountStore.accountInfo = payload.accountInfo;
            popupNotify({
                title: "账号信息已更新",
                message: `你好，我的朋友 ${payload.accountInfo.userName}，希望你能有一个愉快的游戏体验！`,
                duration: 5000,
            })
            localStorage.setItem("accountInfo", JSON.stringify(payload.accountInfo));
        });
    }
}

const accountManager = new AccountManager();
export default accountManager;