import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState, type SubmitEventHandler } from "react";


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { SignUpContract } from "@/contracts/SignUp";

import { useWalletStore } from "../stores/useWalletStore";


export function SignUp() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [userType, setUserType] = useState(0);

    const signer = useWalletStore((state) => state.signer);
    const signUpContract = new SignUpContract(signer);


    const submitForm: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        
        const [tx, err] = await signUpContract.signUp(username, Number(userType));

        if (err) {
            toast.error(err.reason);
            return;
        }

        toast.success('Registro na blockchain foi feito com sucesso!');
        navigate('/');
    }


    return (
        <div className="w-full min-h-screen flex items-center justify-center flex-col">
            <div className="w-full max-w-100 p-5">
                <h1 className="text-4xl font-bold mb-2.5">
                    Registre-se
                </h1>

                <p className="text-base">
                    Preencha o formulario abaixo para fazer seu registro no app.
                </p>

                <form onSubmit={submitForm} className="mt-10">
                    <Input 
                        type="text" 
                        className="w-full h-12 bg-[#F2F4F7] rounded-[10px] px-2 focus-visible:ring-[#53B1FD]" 
                        placeholder="Nome de usuario"
                        value={username}
                        onChange={(e: any) => setUsername(e.target.value)} />

                    <RadioGroup defaultValue={0} className="mt-5" onValueChange={setUserType}>
                        <div className="flex gap-1 items-center">
                            <RadioGroupItem value={0} id="id-ong" /> 
                            <Label htmlFor="id-ong">Cadastrar como ONG</Label>
                        </div>
                        <div className="flex gap-1 items-center">
                            <RadioGroupItem value={1} id="id-donor" />
                            <Label htmlFor="id-donor">Cadastrar como Doador</Label>
                        </div>
                    </RadioGroup>

                    <Button className="mt-10 w-full" type="submit">
                        Cadastra-se
                    </Button>
                </form>
            </div>

        </div>
    );

}
