import {useEffect} from "react";
import {installSupportChatLoader} from "../lib/support-chat.client";

const CRISP_WEBSITE_ID = "dc2e8832-e25f-4366-9c47-d1079b7ad11b";

function configureCrispChat() {
  void import("crisp-sdk-web")
    .then(({Crisp}) => {
      Crisp.configure(CRISP_WEBSITE_ID);
    })
    .catch((error: unknown) => {
      console.warn("Failed to load support chat", error);
    });
}

const CrispChat = () => {
  useEffect(() => {
    return installSupportChatLoader({
      win: window,
      configure: configureCrispChat,
    });
  }, []);

  return null;
};

export default CrispChat;
