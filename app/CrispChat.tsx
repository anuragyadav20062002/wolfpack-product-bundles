import { useEffect } from "react";

const CrispChat = () => {
  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "dc2e8832-e25f-4366-9c47-d1079b7ad11b";
    (function(){
      const d=document;
      const s=d.createElement("script");
      s.src="https://client.crisp.chat/l.js";
      s.async=true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  }, []);

  return null;
};

export default CrispChat;