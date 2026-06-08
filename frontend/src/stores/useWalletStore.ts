import { create } from 'zustand';
import type { ethers } from 'ethers';

const localToken = typeof window !== 'undefined'
    ? window.localStorage.getItem('impactledger_jwt') ?? ''
    : '';

interface WalletType {
    signer: null | ethers.Signer;
    provider: null | ethers.Provider;
    address: string;
    connected: boolean;
    token: string;
    authenticated: boolean;

    setSignerAndProvider: (signer: ethers.Signer, provider: ethers.Provider) => void;
    setToken: (token: string) => void;
}

export const useWalletStore = create<WalletType>((set) => ({
    signer: null,
    provider: null,
    address: '',
    connected: false,
    token: localToken,
    authenticated: localToken.length > 0,

    setSignerAndProvider: async (signer: ethers.Signer, provider: ethers.Provider) => {
        const address = await signer.getAddress();

        set({
            connected: true,
            signer,
            provider,
            address,
        });
    },

    setToken: (token: string) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('impactledger_jwt', token);
        }
        set({ token, authenticated: token.length > 0 });
    },
}));
