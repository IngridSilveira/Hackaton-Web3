import type { CampaignType } from "../types/campaing";
import type { UserType } from "../types/user";

import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, PiggyBank, Landmark } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useWalletStore } from "../stores/useWalletStore";
import { CampaignContract } from "../contracts/campaign";
import { RequestState, useRequest } from "../hooks/useRequest";
import { ethers } from "ethers";
import { ErrorBox } from "../components/errorBox";
import { SignUpContract } from "../contracts/signUp";



function LoaddingCampaingsInformations() {
    return (
        <>
            <div className="skeleton w-full max-w-33.5 h-6 rounded"></div>
            <div className="skeleton w-full h-10 rounded mt-5"></div>
            <div className="skeleton w-full max-w-57.5 h-6 rounded mt-5"></div>
            <div className="skeleton w-full max-w-57.5 h-6 rounded mt-2"></div>

            <div className="mt-5 flex items-center gap-2">
                <div className="min-w-10 min-h-10 rounded-full skeleton"></div>
                <div>
                    <div className="skeleton min-w-26.75 h-4 rounded"></div>
                    <div className="skeleton min-w-26.75 h-4 rounded mt-1"></div>
                </div>
            </div>
        </>
    );
}

interface UserInformationProps {
    creator: string;
}

function UserInformation({ creator }: UserInformationProps) {
    const signer = useWalletStore(state => state.signer);

    const signUpContract = new SignUpContract(signer!);
    const { state, data, error, fetchData } = useRequest<UserType>(() => signUpContract.getUser(creator));

    /**
     * Isso vai buscar o nome de quem criou a campanha.
     */
    useEffect(() => {
        fetchData();
    }, []);

    if (state == RequestState.LOADDING)
        return <div className="skeleton w-10 h-4"></div>;

    if (state == RequestState.ERROR)
        return <p className="text-xs">Erro ao buscar usuario!</p>

    return (
        <p className="text-xs">
            Criado por: <span className="font-bold">{ data?.username }</span>
        </p>
    );
}

interface CampaingsInformationsProps {
    id: bigint;
    title: string;
    goalAmount: bigint;
    currentAmount: bigint;
    creator: string;
    createdAt: bigint;
    deadline: bigint;
}

function CampaingsInformations(props: CampaingsInformationsProps) {

    const {
        id,
        title,
        goalAmount,
        currentAmount,
        creator,
        createdAt,
        deadline,
    } = props;

    const ptCreated = new Date(ethers.toNumber(createdAt) * 1000).toLocaleDateString('pt-BR', { dateStyle: 'short' });
    const isActivity = Date.now() < ethers.toNumber(deadline) * 1000;


    return (
        <>
            <p className={`text-xs py-1 px-2 font-semibold rounded w-min text-nowrap ${ isActivity ? 'bg-green-300' : 'bg-red-300'}`}>
                { isActivity ? 'Recebendo doações' : 'Prazo de doação finalizado' }
            </p>
            <p className="mt-5 text-2xl">{ title }</p>
            <p className="flex gap-2 items-center mt-5">
                <PiggyBank /> 
                Valor arrecadado: <span className="font-bold">{ currentAmount.toString() } ETH</span>
            </p>
            <p className="flex gap-2 items-center mt-2">
                <Landmark /> 
                Valor desejado: <span className="font-bold">{ goalAmount.toString() } ETH</span>
            </p>

            <div className="mt-5 flex items-center gap-2">
                <div className="min-w-10 min-h-10 rounded-full bg-gray-500"></div>
                <div>
                    <UserInformation creator={creator} />
                    <p className="text-xs">{ ptCreated }</p>
                </div>
            </div>
        </>
    );
}


export function Donate() {
    const navigate = useNavigate();
    const [params,] = useSearchParams();
    
    const id = params.get('id');

    /**
     * Se não tiver um id no query param, o usuario 
     * será redirecionado para a pagina anterior.
     */
    if (!id)
        return navigate(-1);

    const signer = useWalletStore(state => state.signer);
    const campaingContract = new CampaignContract(signer!);

    const { state, data, error, fetchData } = useRequest<CampaignType>(() => campaingContract.getCampaign(Number(id)));


    const handlerNavigateBack = useCallback(() => {
        navigate(-1);
    }, []);

    /**
     * Buscando os dados assim que o component é 
     * renderizado.
     */
    useEffect(() => {
        fetchData();
    }, []);

    if (state == RequestState.ERROR)
        return <ErrorBox message={error!.message} />


    return (
        <div className="p-5">
            <Button onClick={handlerNavigateBack} variant="link">
                <ArrowLeft />
                Voltar para a pagina anterior
            </Button>

            <div className="mt-10 w-full mx-auto max-w-325 md:flex gap-5 relative">
                <div className="md:w-1/2">
                    <div className="position-stick top-5">
                        <div className="shadow-md rounded-xl p-4">

                            { 
                                state == RequestState.LOADDING || !data
                                ? <LoaddingCampaingsInformations /> 
                                : <CampaingsInformations
                                    id={data!.id}
                                    title={data!.title}
                                    goalAmount={data!.goalAmount}
                                    currentAmount={data!.currentAmount}
                                    creator={data!.creator}
                                    deadline={data!.deadline}
                                    createdAt={data!.createdAt}  /> 
                            }
                        </div>

                        <div className="shadow-md rounded-xl p-4 mt-5">
                            <h1 className="text-xl font-bold">Faça uma Doação!</h1>
                            <p className="text-base  mt-2">Aqui você pode fazer uma doação! Preencha o formulario abaixo!</p>

                            <form action="#" className="mt-5">
                                <Label htmlFor="values" className="mb-2">Valor: </Label>
                                <Input id="values" type="number" />

                                <Button className="mt-5">
                                    Fazer Doação
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 shadow-md rounded-xl p-4 mt-5 md:mt-0">
                    <h2 className="text-xl font-bold">Historico da Campanha!</h2>
                    <p className="text-base mt-2">
                        Aqui você pode ver quem fez doações, solicitações de saque, 
                        votações e milestones.
                    </p>

                    <ul className="mt-10">
                        
                    </ul>
                </div>
            </div>
        </div>
    )
}
