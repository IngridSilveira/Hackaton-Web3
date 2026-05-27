import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import type { UserType } from "../types/user";

import { useWalletStore } from "../stores/useWalletStore";
import { useUserStore } from "../stores/useUserStore";

import { Campaings } from "@/components/campaings";
import { ErrorBox } from "@/components/errorBox";
import { Button } from "@/components/ui/button";

import { SignUpContract } from "../contracts/signUp";
import { RequestState, useRequest } from "../hooks/useRequest";
import { ModalCreateCampaign } from "../components/modalCreateCampaign";


function LoaddingUserInformation() {
    const signer = useWalletStore(state => state.signer);
    const address = useWalletStore(state => state.address);
    const setUser = useUserStore(state => state.setUser);

    /**
     * Considerando que o signer existe pois o RouterProvider
     * é renderizado apos a conexão com a carteira do usuário.
     */
    const signUpContract = new SignUpContract(signer!);
    const { state, error, data: user, fetchData } = useRequest<UserType>(() => signUpContract.getUser(address));


    /**
     * Isso vai buscar as informações do usuário, assim que
     * o signer for capturado.
     */
    useEffect(() => { fetchData(); }, [signer]);

    /**
     * Quando o request terminar 
     */
    useEffect(() => {
        if (state == RequestState.SUCESS)
            setUser(user!);
    }, [user]);


    if (state != RequestState.ERROR)
        return null;


    return (
        <ErrorBox message={error!.message}>
            <p>
                Não tem um registro? <NavLink to={'/sign-up'} className='font-semibold'>Registre-se</NavLink>
            </p>
        </ErrorBox>
    );
}


export function Home() {
    const userType = useUserStore(state => state.userType);
    const [isVisibleModal, setVisibleModal] = useState<boolean>(false);

    const handleCloseModal = useCallback((state: boolean) => {
        setVisibleModal(state);
    }, []);

    return (
        <div className="p-5">

            <LoaddingUserInformation />
            { isVisibleModal ? <ModalCreateCampaign onClose={() => handleCloseModal(false)} /> : null }
            
            <div className="mt-10 flex items-center justify-between">
                <h1 className="text-2xl font-black">
                    Lista de Campanhas:
                </h1>

                { userType == 0 ? <Button onClick={() => handleCloseModal(true)}>Cadastrar Campanha</Button> : null }
            </div>


            <div className="w-full">
                <Campaings />
            </div>
        </div>
    );
}
