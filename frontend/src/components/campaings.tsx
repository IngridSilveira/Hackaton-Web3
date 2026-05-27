import { useCallback, useEffect } from "react";
import { BrushCleaning } from "lucide-react";

import type { CampaignType } from "../types/campaing";

import { useWalletStore } from "../stores/useWalletStore";

import { RequestState, useRequest } from "../hooks/useRequest";
import { CampaignContract } from "../contracts/campaign";
import { ErrorBox } from "./errorBox";
import { CircleLoadding } from "./circleLoadding";



function EmptyCampaigns() {
    return (
        <div className="w-full py-10 flex items-center flex-col text-gray-600">
            <BrushCleaning size={40} />
            <p className="text-center mt-5 font-semibold">
                Nenhuma campanha ativa no momento! <br />
                Tente novamente mais tarde!
            </p>
        </div>
    );
}


function LoaddingCampaign() {
    return (
        <div className="w-full py-10 flex justify-center">
            <CircleLoadding description="Carregando campanhas..." />
        </div>
    );
}


export function Campaings() {
    const signer = useWalletStore(state => state.signer);

    /**
     * Como o RouterProvider é renderizado depois da
     * conexão com a carteira do usuário, podemos 
     * considerar que o signer existe.
     */
    const campaingsContract = new CampaignContract(signer!);
    const { state, error, data, fetchData } = useRequest<CampaignType[]>(() => campaingsContract.getAllCampaigns());
    

    const getAllCampaings = useCallback(async () => {
        if (!signer)
            return;

        fetchData();
    }, [signer]);

    /**
     * Assim que tivermos a conexão com a carteira podemos 
     * buscar as campanhas.
     */
    useEffect(() => { getAllCampaings(); }, [signer]);

    /**
     * Se a requisição estiver em loadding, vamos mostrar um 
     * loadding na tela.
     */
    if (state == RequestState.LOADDING)
        return <LoaddingCampaign />


    /**
     * Se houve erro no request, vamos mostrar uma mensagem.
     */
    if (state == RequestState.ERROR)
        return <ErrorBox message={error!.message}></ErrorBox>;


    /**
     * Se o request funcionou mas não retornou dados.
     * Uma mensagem de lista vazia vai ser exibida.
     */
    if (state == RequestState.SUCESS && data!.length == 0)
        return <EmptyCampaigns />

    return (
        <div className="w-full">
            { state }
        </div>
    );
}
