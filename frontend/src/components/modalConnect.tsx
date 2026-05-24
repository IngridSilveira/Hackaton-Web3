import { AlertCircle } from "lucide-react"
import { useCallback, useEffect, type FC } from "react";

import { useWallet, StateConnection } from "../hooks/useWallet";
import { WalletException } from "../exceptions/WalletException";

import { useWalletStore } from "../stores/useWalletStore";
import { useUserStore } from "../stores/useUserStore";

import { Button } from "@/components/ui/button";
import { useUser } from "../hooks/useUser";



interface ModalConnectingProps {
    description: string;
}

const ModalConnecting: FC<ModalConnectingProps> = (props: ModalConnectingProps) => {
    const { description } = props;

    return (
        <div className="fixed w-full h-full bg-white flex items-center justify-center flex-col gap-4 z-10">
            <div className="w-10 h-10 rounded-full border-5 border-t-primary animate-spin">
            </div>

            <p className="font-normal">
                { description }
            </p>
        </div>
    );
}

interface ModalErrorConnectProps {
    error: Error | null
}

const ModalErrorConnectWallet: FC<ModalErrorConnectProps> = (props: ModalErrorConnectProps) => {
    const { error } = props;

    let message = error instanceof WalletException
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
    const walletStore = useWalletStore();
    const { connection, error, handlerConnectionWallet } = useWallet();
    

    const connnectWallet = useCallback(async () => {
        const { signer }  = await handlerConnectionWallet();
        
        if (!signer)
            return;

        walletStore.setSigner(signer);
    }, []);


    /**
     * Isso vai tentar connectar na MetaMask assim que o modal
     * for montado na tela.
     */
    useEffect(() => {
        connnectWallet();
    }, []);

    switch (connection) {
        case StateConnection.CONNECTING: return <ModalConnecting description="Conectando sua carteira..." />
        case StateConnection.NOT_CONNECTED: return <ModalNotConnected onConnect={connnectWallet} />
        case StateConnection.ERROR: return <ModalErrorConnectWallet error={error} />

        default: return null;
    }
}

