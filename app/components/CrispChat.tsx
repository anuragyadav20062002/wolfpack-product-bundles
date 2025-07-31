import {useEffect} from "react";
import {Crisp} from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("dc2e8832-e25f-4366-9c47-d1079b7ad11b");
  }, []);

  return null;
};

export default CrispChat;