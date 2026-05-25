import { useEffect } from "react";
import { AlertCircle } from 'lucide-react'
import { NavLink } from "react-router-dom";

import { useWalletStore } from "../stores/useWalletStore";
import { useUser, State } from "../hooks/useUser";
import { useUserStore } from "../stores/useUserStore";


function LoaddingUserInformation() {
    const signer = useWalletStore(state => state.signer);
    const setUser = useUserStore(state => state.setUser);

    const { state, error, getUserData } = useUser();


    const getUserAndSetStore = async () => {
        if (!signer)
            return;

        const user = await getUserData(signer);

        if (user)
            setUser(user);
    }

    /**
     * Isso vai buscar as informações do usuário, assim que
     * o signer for capturado.
     */
    useEffect(() => { getUserAndSetStore(); }, [signer]);


    if (state != State.ERROR)
        return null;

    return (
        <div className="w-full border-2 border-red-400 bg-red-200 p-5 rounded-2xl my-5">
            <div className="flex items-center gap-4">
                <AlertCircle />
                <p className="font-bold text-base">{error}</p>
            </div>

            <p>
                Não tem um registro? <NavLink to={'/sign-up'} className='font-semibold'>Registre-se</NavLink>
            </p>
        </div>
    );
}


export function Home() {
    

    return (
        <div className="p-5">

            <h1 className="text-2xl font-black mt-10">
                Lista de Campanhas:
            </h1>

            <LoaddingUserInformation />
        </div>
    );
}
