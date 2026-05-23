import { create } from 'zustand';
import type { ethers } from 'ethers';


interface WalletType {
    signer: null | ethers.Signer;
    connected: boolean;

    setSigner: (signer: ethers.Signer) => void;
}


export const useWalletStore = create<WalletType>((set) => ({
    signer: null,
    connected: false,

    setSigner: (signer: ethers.Signer) => set({ signer: signer, connected: !!signer }),
}));
