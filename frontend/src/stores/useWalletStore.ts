import { create } from 'zustand';
import type { ethers } from 'ethers';


interface WalletType {
    signer: null | ethers.Signer;
    provider: null | ethers.Provider;
    address: string;
    connected: boolean;

    setSignerAndProvider: (signer: ethers.Signer, provider: ethers.Provider) => void;
}


export const useWalletStore = create<WalletType>((set) => ({
    signer: null,
    provider: null,
    address: '',
    connected: false,

    setSignerAndProvider: async (signer: ethers.Signer, provider: ethers.Provider) => {
        const address = await signer.getAddress();

        set({ 
            connected: !!signer, 
            signer, 
            provider,
            address 
        });
    },

}));
