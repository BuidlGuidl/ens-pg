"use client";

// @refresh reset
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signOut } from "next-auth/react";
import { Address } from "viem";
import { useAccount, useDisconnect } from "wagmi";
import { useAuthSession } from "~~/hooks/pg-ens/useAuthSession";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  const { targetNetwork } = useTargetNetwork();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { address: sessionAddress, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (isAuthenticated) {
      router.refresh();
    }
  }, [router, isAuthenticated]);

  useEffect(() => {
    if (isConnected && sessionAddress && sessionAddress !== address) {
      signOut();
      disconnect();
    }
  }, [address, disconnect, isConnected, sessionAddress]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted, authenticationStatus }) => {
        const connected =
          mounted && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <button className="btn btn-primary btn-sm text-white" onClick={openConnectModal} type="button">
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <>
                  <AddressInfoDropdown
                    address={account.address as Address}
                    displayName={account.displayName}
                    ensAvatar={account.ensAvatar}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />
                  <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
                </>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
