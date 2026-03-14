import { useAccountStore } from "../stores/account";
import { bus } from "./socket";

class AccountManager {
    constructor() {}

    init() {
        bus.on("ack_login_result", (payload) => {
            const accountStore = useAccountStore();
            if (payload.success) {
                console.log(payload.message);
            } else {
                console.warn(payload.message);
            }
            accountStore.isLoginSuccess = payload.success;
        });

        bus.on("evt_account_info", (payload) => {
            const accountStore = useAccountStore();
            accountStore.accountInfo = payload.accountInfo;
        });
    }
}

const accountManager = new AccountManager();
export default accountManager;