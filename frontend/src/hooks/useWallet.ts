import { ethers } from 'ethers';
import { useState, useCallback } from 'react';


import { WalletException } from '../exceptions/WalletException';


export const StateConnection = {
    NOT_CONNECTED: 0,
    CONNECTING: 1,
    CONNECTED: 2,
    ERROR: 3,
} as const;

type StateConnectionType = (typeof StateConnection)[keyof typeof StateConnection]

export function useWallet() {

    const [connection, setConnection] = useState<StateConnectionType>(StateConnection.NOT_CONNECTED);
    const [error, setError] = useState<Error | null>(null);


    const setConnectionState = useCallback((state: StateConnectionType) => setConnection(state), []);
    const setErrorState = useCallback((state: Error | null) => setError(state), []);


    const getEthereumFromWindow = useCallback(() => {
        const ethereum = (window as any).ethereum;

        if (!ethereum)
            throw new WalletException('MetaMask não esta instalada!');

        return ethereum;
    }, []);


    const requestAccessToWallet = useCallback(async (ethereum: any) => {
        try {
            await ethereum.request({ method: 'eth_requestAccounts' });
        }

        catch (err: any) {
            if (err.code === 4001)
                throw new WalletException('Acesso à carteira negado pelo usuário!');

            throw err;
        }
    }, []);

    const handlerConnectionWallet = useCallback(async () => {
        try {
            setConnectionState(StateConnection.CONNECTING);
            
            const ethereum = getEthereumFromWindow();
            await requestAccessToWallet(ethereum);

            let browserProvider = new ethers.BrowserProvider(ethereum);
            let signer = await browserProvider.getSigner();

            setConnectionState(StateConnection.CONNECTED);

            return {
                signer,
            }
        }
        catch (err) {
            setConnectionState(StateConnection.ERROR);
            setErrorState(err as Error);

            return {
                signer: null,
            }
        }
    }, []);

    return {
        connection,
        error,

        handlerConnectionWallet,
    }
}

