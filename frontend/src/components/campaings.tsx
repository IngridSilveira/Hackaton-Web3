import type { CampaignType } from "../types/campaing";

import { ethers } from "ethers";
import { useCallback, useEffect } from "react";
import { BrushCleaning, ExternalLink } from "lucide-react";


import { useWalletStore } from "../stores/useWalletStore";

import { RequestState, useRequest } from "../hooks/useRequest";
import { CampaignContract } from "../contracts/campaign";
import { CircleLoadding } from "./circleLoadding";
import { ErrorBox } from "./errorBox";


import { Button } from "./ui/button";

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

interface CardCampaignProps {
    id: BigInt;
    title: string;
    goalAmount: BigInt;
    currentAmount: BigInt;
    creator: string;
    createdAt: number;
    deadline: number;
}

function CardCampaign(props: CardCampaignProps) {
    const {
        title,
        currentAmount,
        goalAmount,
        createdAt,
        deadline
    } = props;

    const ptCreated = new Date(ethers.toNumber(createdAt) * 1000).toLocaleDateString('pt-BR', { dateStyle: 'short' })

    return (
        <div className="w-full p-4 shadow-md rounded-xl">
            <h2 className="font-bold">{ title }</h2>
            <p className="text-base">Criada em { ptCreated }</p>

            <div className="w-full border-t border-gray-200 mt-8 flex items-center justify-between pt-4">
                <p className="my-2 text-right">
                    {currentAmount.toString()}/{goalAmount.toString()} ETH
                </p>

                <Button>
                    <ExternalLink />
                    <p>Visualizar</p>
                </Button>
            </div>

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
        <div className="w-full mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            { 
                data?.map((campaign, index) => (
                    <CardCampaign 
                        key={index}
                        id={campaign.id}
                        title={campaign.title}
                        goalAmount={campaign.goalAmount}
                        currentAmount={campaign.currentAmount}
                        creator={campaign.creator}
                        deadline={campaign.deadline}
                        createdAt={campaign.createdAt} />
                )) 
            }
        </div>
    );
}
