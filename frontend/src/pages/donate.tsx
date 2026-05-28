import { useCallback } from "react";
import { useNavigate } from "react-router-dom"

import { ArrowLeft, PiggyBank, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Donate() {
    const navigate = useNavigate();

    const handlerNavigateBack = useCallback(() => {
        navigate(-1);
    }, []);

    const isActivity = true;

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
                            <p className={`text-xs py-1 px-2 font-semibold rounded w-min text-nowrap ${ isActivity ? 'bg-green-300' : 'bg-red-300'}`}>
                                { isActivity ? 'Recebendo doações' : 'Prazo de doação finalizado' }
                            </p>

                            <p className="mt-5 text-2xl">
                                Quero comprar uma Moto!
                            </p>

                            <p className="flex gap-2 items-center mt-5">
                                <PiggyBank /> 
                                Valor arrecadado: <span className="font-bold">10 ETH</span>
                            </p>

                            <p className="flex gap-2 items-center mt-2">
                                <Landmark /> 
                                Valor desejado: <span className="font-bold">15 ETH</span>
                            </p>

                            <div className="mt-5 flex items-center gap-2">
                                <div className="min-w-10 min-h-10 rounded-full bg-gray-500"></div>
                                <div>
                                    <p className="text-xs">
                                        Criado por: <span className="font-bold">Edinho</span>
                                    </p>
                                    <p className="text-xs">
                                        28/05/2026
                                    </p>
                                </div>
                            </div>
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
