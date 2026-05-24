import { useCallback } from "react";


import { SignUpContract } from "@/contracts/SignUp";
import { useWalletStore } from "../stores/useWalletStore";

import { UserNotConnectedException } from "../exceptions/UserException";



export function useUser() {

    const walletStore = useWalletStore();
    const signUpContract = new SignUpContract(walletStore.signer);


    const handlerGetUser = useCallback(async () => {
        if (!walletStore.connected)
            throw new UserNotConnectedException('Carteira do usuário não esta conectada.');


        const [tx, err] = await signUpContract.getUser(walletStore.address);

        if (err) 
            throw err;

        console.log(tx);
        return tx;
    }, []);

    return {
        handlerGetUser,
    }
}
