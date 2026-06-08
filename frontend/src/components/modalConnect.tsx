import { AlertCircle } from 'lucide-react'
import { useCallback, useEffect, type FC } from 'react';

import { useWallet, StateConnection } from '../hooks/useWallet';
import { useWalletStore } from '../stores/useWalletStore';
import { authenticateWallet, requestNonce } from '../services/backend';
import { Button } from '@/components/ui/button';
import { CircleLoadding } from './circleLoadding';
import { ContractException } from '../exceptions/ContractException';



interface ModalConnectingProps {
    description: string;
}

const ModalConnecting: FC<ModalConnectingProps> = (props: ModalConnectingProps) => {
    const { description } = props;

    return (
        <div className="fixed w-full h-full bg-white flex items-center justify-center flex-col gap-4 z-10">
            <CircleLoadding description={description} />
        </div>
    );
}

interface ModalErrorConnectProps {
    error: Error | null
}

const ModalErrorConnectWallet: FC<ModalErrorConnectProps> = (props: ModalErrorConnectProps) => {
    const { error } = props;

    let message = error instanceof ContractException
        ? error.message
        : 'Um erro inesperado aconteceu!';

    return (
        <div className="fixed w-full h-full bg-white text-red-700 flex items-center justify-center flex-col gap-4 z-10">
            <AlertCircle />

            <p className="font-bold">Erro ao conectar sua carteira.</p>
            <p className="font-normal">{ message }</p>
        </div>
    );
}

interface ModalNotConnectedProps {
    onConnect: () => void;
}

const ModalNotConnected: FC<ModalNotConnectedProps> = (props: ModalNotConnectedProps) => {
    const { onConnect } = props;

    return (
        <div className="fixed w-full h-full bg-white text-primary flex items-center justify-center flex-col gap-4 z-10">
            <AlertCircle />

            <p className="font-bold">Você não esta conectado a uma carteira.</p>
            <Button onClick={onConnect}>
                Conectar Carteira
            </Button>
        </div>
    );
}

export const ModalConnect = () => {
    const setSignerAndProvider = useWalletStore(state => state.setSignerAndProvider);
    const setToken = useWalletStore(state => state.setToken);
    const { connection, error, handlerConnectionWallet } = useWallet();


    const connnectWallet = useCallback(async () => {
        const { signer, provider }  = await handlerConnectionWallet();

        if (!signer)
            return;

        try {
            const address = await signer.getAddress();
            const { message } = await requestNonce(address);
            const signature = await signer.signMessage(message);
            const auth = await authenticateWallet(address, signature, message);

            setToken(auth.token);
            setSignerAndProvider(signer, provider);
        }
        catch (err: any) {
            if (err instanceof ContractException) {
                throw err;
            }
            throw new ContractException(err?.message ?? 'Erro ao autenticar com o backend');
        }
    }, [handlerConnectionWallet, setSignerAndProvider, setToken]);


    /**
     * Isso vai tentar connectar na MetaMask assim que o modal
     * for montado na tela.
     */
    useEffect(() => {
        connnectWallet();
    }, [connnectWallet]);

    switch (connection) {
        case StateConnection.CONNECTING: return <ModalConnecting description="Conectando sua carteira..." />
        case StateConnection.NOT_CONNECTED: return <ModalNotConnected onConnect={connnectWallet} />
        case StateConnection.ERROR: return <ModalErrorConnectWallet error={error} />

        default: return null;
    }
}

