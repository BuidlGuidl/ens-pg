import { useCallback } from "react";
import { getCsrfToken, signIn } from "next-auth/react";
import { SiweMessage } from "siwe";
import { useAccount, useSignMessage } from "wagmi";

export const useHandleLogin = () => {
  const { signMessageAsync } = useSignMessage();
  const { address, chain } = useAccount();

  const handleLogin = useCallback(async () => {
    try {
      if (!address) return false;

      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId: chain?.id,
        nonce: await getCsrfToken(),
      });
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });
      const result = await signIn("credentials", {
        message: JSON.stringify(message),
        signature,
        redirect: false,
      });

      return Boolean(result?.ok);
    } catch (error) {
      console.log(error);
      return false;
    }
  }, [address, chain?.id, signMessageAsync]);

  return { handleLogin };
};
