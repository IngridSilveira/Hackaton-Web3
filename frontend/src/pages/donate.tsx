import { ethers } from "ethers";

import type { CampaignType, EventType } from "../types/campaing";
import type { UserType } from "../types/user";

import { ArrowLeft, PiggyBank, Landmark, BanknoteArrowUp, Award } from "lucide-react";
import React, { useCallback, useEffect, useState, type SubmitEventHandler } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useWalletStore } from "../stores/useWalletStore";
import { CampaignContract } from "../contracts/campaign";
import { RequestState, useRequest } from "../hooks/useRequest";
import { ErrorBox } from "../components/errorBox";
import { SignUpContract } from "../contracts/signUp";
import { DonateContract } from "../contracts/donate";
import { Events } from "../contracts/events";
import { CircleLoadding } from "../components/circleLoadding";

import { ModalWithdraw } from "../components/modalWithdraw";
import { useIPFS } from "../hooks/useIPFS";


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
    const [visible, setVisible] = useState(false);
    const loggedUser = useWalletStore(state => state.address);

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


    const handlerOpenModal = useCallback((visible: boolean) => {
        setVisible(visible)
    }, []);

    return (
        <>
            { visible ? <ModalWithdraw onClose={handlerOpenModal} /> : null }

            <div className="w-full flex items-center justify-between">
                <p className={`text-xs py-1 px-2 font-semibold rounded w-min text-nowrap ${ isActivity ? 'bg-green-300' : 'bg-red-300'}`}>
                    { isActivity ? 'Recebendo doações' : 'Prazo de doação finalizado' }
                </p>

                {
                    loggedUser == creator 
                    ? (<Button onClick={() => handlerOpenModal(true)}>Solicitar Saque</Button>)
                    : null
                }
            </div>

            <p className="mt-5 text-2xl">{ title }</p>
            <p className="flex gap-2 items-center mt-5">
                <PiggyBank /> 
                Valor arrecadado: <span className="font-bold">{ ethers.formatEther(currentAmount) } ETH</span>
            </p>
            <p className="flex gap-2 items-center mt-2">
                <Landmark /> 
                Valor desejado: <span className="font-bold">{ ethers.formatEther(goalAmount) } ETH</span>
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

interface MakeDonationFormProps {
    campaignId: bigint;
    onDonationReceived: () => void;
}

function LoaddingFormDonation() {
    return (
        <div className="mt-5">
            <div className="skeleton rounded h-6 w-18"></div>
            <div className="skeleton rounded h-9 w-full mt-2"></div>
            <div className="skeleton rounded h-9 w-28.5 mt-2"></div>
        </div>
    );
}

function MakeDonationForm(props: MakeDonationFormProps) {

    const {
        campaignId, 
        onDonationReceived,
    } = props;

    const signer = useWalletStore(state => state.signer);
    const [amount, setAmount] = useState('');
    
    /**
     * Contrato de donate para fazer uma doação para uma 
     * campanha.
     */
    const donateContract = new DonateContract(signer!);
    const { state, error, data, fetchData } = useRequest((campaign: bigint, amount: bigint) => donateContract.donate(campaign, amount));
    

    const handlerMakedonate: SubmitEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        fetchData(campaignId, ethers.parseEther(amount));
    }

    /**
     * Isso será utilizado para atualizar a interface quando 
     * receber um evento de DonetionReceived. E buscar os 
     * dados da campanha novamente.
     */
    donateContract.onDonationReceived(campaignId, onDonationReceived);

    /**
     * Limpando o evento quando o componente for desmontado.
     */
    useEffect(() => {
        return () => {
            donateContract.removeDonationReceived(campaignId, onDonationReceived);
        }
    }, []);

    return (
        <form action="#" className="mt-5" onSubmit={handlerMakedonate}>

            { 
                state == RequestState.ERROR 
                ? <ErrorBox message={error!.message} />
                : null
            }

            <Label 
                htmlFor="values" 
                className="mb-2">
                    Valor: 
            </Label>

            <Input 
                id="values" 
                type="number" 
                onChange={(e: any) => setAmount(e.target.value)}
                disabled={state == RequestState.LOADDING} />

            <Button className="mt-5" type="submit" disabled={state == RequestState.LOADDING}>
                Fazer Doação
            </Button>
        </form>
    );
}

interface EventItemProps {
    event: EventType;
}

function EventItem(props: EventItemProps) {

    const { event } = props;
    const { openFile } = useIPFS({})

    const icons: Record<string, React.ReactNode> = {
        'CampaignCreated': <PiggyBank />,
        'DonationReceived': <BanknoteArrowUp />,
        'WithdrawalRequested': <Award />
    };


    const handlerOpenFile = async (cid: string) => {
        const file = await openFile(cid);
        const url = URL.createObjectURL(file);

        window.open(url, '_blank')
    }


    if (event.name == 'CampaignCreated') {
        return (
            <div className="flex items-center gap-3">
                <div className="p-3 border rounded-full">
                    { icons[event.name] }
                </div>

                <div>
                    <p className="font-bold">
                        Aqui Inicia a Jornada!
                    </p>
                    <small>
                        Aqui a campanha <b>{ event.args.title }</b> foi criada! Com um objetivo 
                        de arrecadar <b>{ ethers.formatEther(event.args.goalAmount) } ETH</b>
                    </small>
                </div>
            </div>
        );
    }

    if (event.name == 'DonationReceived') {
        return (
            <div className="flex items-center gap-3">
                <div className="p-3 border rounded-full">
                    { icons[event.name] }
                </div>

                <div>
                    <p className="font-bold">
                        Doação recebida!
                    </p>
                    <small>
                        Foi feita uma doação no valor de <b>{ ethers.formatEther(event.args.amount) } ETH</b>
                    </small>
                </div>
            </div>
        );
    }

    if (event.name == 'WithdrawalRequested') {
        return (
            <div className="flex items-center gap-3">
                <div className="p-3 border rounded-full">
                    { icons[event.name] }
                </div>

                <div>
                    <p className="font-bold">
                        Solicitação de saque!
                    </p>
                    <small>
                        A solicitação de saque foi solicitada, depois da votação dos doadores os fundos 
                        seram transferidos. 

                        <Button variant="link" onClick={() => handlerOpenFile(event.args.cid)}>
                            Abrir aquivo
                        </Button>
                    </small>
                </div>
            </div>
        );
    }

    return (null);
}

interface EventsListProps {
    events: Array<EventType>
}

function EventsList(props: EventsListProps) {
    const { events } = props;

    return (
        <ul>
            { 
                events.map((event, index) => (
                    <li key={index} className="mt-5">
                        <EventItem event={ event } />
                    </li>
                )) 
            }
        </ul>
    );
}

interface CampaignHistoryProps {
    campaignId: bigint;
}

function CampaignHistory({ campaignId }: CampaignHistoryProps) {
    const provider = useWalletStore(state => state.provider);
    const eventsLogs = new Events(provider!);

    const [campaignEvents, setCampaignEvents] = useState<Array<EventType>>([]);
    const { state, data, error, fetchData } = useRequest(() => eventsLogs.getEventsLog(campaignId));


    const handlerCampaignEvents = () => {
        const events = eventsLogs.parseLogsEvents(data!);
        setCampaignEvents(events);
    }


    /**
     * Buscandos os eventos assim que o componente é montado.
     */
    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Isso sera executado no final do carregamento dos eventos.
     * Os eventos seram formatados e em seguida exibidos.
     */
    useEffect(() => {
        if (state == RequestState.SUCESS && data && data.length > 0) 
            handlerCampaignEvents();
    }, [state]);


    return (
        <div className="md:w-1/2 shadow-md rounded-xl p-4 mt-5 md:mt-0">
            <h2 className="text-xl font-bold">
                Historico da Campanha!
            </h2>

            <p className="text-base mt-2">
                Aqui você pode ver quem fez doações, solicitações de saque, 
                votações e milestones.
            </p>

            { 
                state == RequestState.ERROR 
                ? <ErrorBox message={error!.message} />
                : null
            }

            {
                state == RequestState.LOADDING
                ? <CircleLoadding description="Carregando histórico" />
                : null
            }

            {
                state == RequestState.SUCESS && data 
                ? <EventsList events={campaignEvents} />
                : null
            }
        </div>
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
    const { state, data, error, fetchData } = useRequest<CampaignType>(() => campaingContract.getCampaign(BigInt(id)));

    const handlerFetchData = useCallback(() => fetchData(), []);

    /**
     * Função para retornar a pagina anterior.
     */
    const handlerNavigateBack = useCallback(() => navigate(-1), []);

    /**
     * Buscando os dados assim que o component é 
     * renderizado.
     */
    useEffect(() => {
        handlerFetchData();
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

                            {
                                state == RequestState.LOADDING || !data
                                ? <LoaddingFormDonation />
                                : <MakeDonationForm campaignId={data!.id} onDonationReceived={handlerFetchData} />
                            }
                        </div>
                    </div>
                </div>

                {
                    state == RequestState.LOADDING || !data 
                    ? null
                    : <CampaignHistory campaignId={data!.id} />
                }
            </div>
        </div>
    )
}
