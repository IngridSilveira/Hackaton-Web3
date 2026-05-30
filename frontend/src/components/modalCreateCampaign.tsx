import { X } from "lucide-react";
import { useState, type ChangeEvent, type SubmitEventHandler } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { RequestState, useRequest } from "../hooks/useRequest";
import { useWalletStore } from "../stores/useWalletStore";

import { CampaignContract } from "../contracts/campaign";
import { ErrorBox } from "./errorBox";
import { SuccessBox } from "./successBox";
import { ethers } from "ethers";


interface ModalCreateCampaignProps {
    onClose: () => void;
}


export function ModalCreateCampaign({ onClose }: ModalCreateCampaignProps) {
    const [title, setTitle] = useState('');
    const [goalsValue, setGoalsValue] = useState('');

    const signer = useWalletStore(state => state.signer);

    
    const campaingsContract = new CampaignContract(signer!);
    const { state, error, fetchData } = useRequest<void>((title, goalsValue) => campaingsContract.createCampaign(title, goalsValue))


    const handlerSubmitForm: SubmitEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        fetchData(title, ethers.parseEther(goalsValue));
    }


    return (
        <div className="fixed bg-black/20 top-0 bottom-0 left-0 right-0 flex items-center justify-center p-4">
            <div className="w-full max-w-150 bg-white p-5 rounded-2xl">
                <div className="w-full flex justify-between items-center">
                    <h1 className="font-bold text-xl">
                        Cadastrar Campanha:
                    </h1>

                    <button className="cursor-pointer" onClick={ onClose } disabled={state == RequestState.LOADDING}>
                        <X />
                    </button>
                </div>

                { state == RequestState.ERROR ? <ErrorBox message={error!.message} /> : null }
                { state == RequestState.SUCESS ? <SuccessBox message="Campanha cadastrada com sucesso!" /> : null }

                <form className="mt-10" action="#" onSubmit={handlerSubmitForm}>
                    <fieldset>
                        <Label htmlFor="title" className="mb-2">Titulo:</Label>
                        <Input 
                            id="title"
                            type="text" 
                            value={title}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                            disabled={state == RequestState.LOADDING} />
                    </fieldset>

                    <fieldset className="mt-5">
                        <Label htmlFor="value" className="mb-2">Valor Desejado:</Label>
                        <Input 
                            id="value" 
                            type="number" 
                            value={goalsValue}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setGoalsValue(e.target.value)}
                            disabled={state == RequestState.LOADDING} />
                    </fieldset>

                    <Button className="mt-5 block mx-auto" type="submit" disabled={state == RequestState.LOADDING}>
                        { state != RequestState.LOADDING ? 'Cadastrar' : 'Loadding...' }
                    </Button>
                </form>
            </div>
        </div>
    );
}
