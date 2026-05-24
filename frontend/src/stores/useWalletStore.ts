import { create } from 'zustand';
import type { ethers } from 'ethers';


interface WalletType {
    signer: null | ethers.Signer;
    address: string;
    connected: boolean;

    setSigner: (signer: ethers.Signer) => void;
}


export const useWalletStore = create<WalletType>((set) => ({
    signer: null,
    address: '',
    connected: false,

    setSigner: async (signer: ethers.Signer) => {
        const address = await signer.getAddress();

        set({ 
            signer: signer, 
            connected: !!signer, 
            address 
        });
    },
}));
