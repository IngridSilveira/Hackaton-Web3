import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIPFS } from "../hooks/useIPFS";
import { useCallback, useState, type SubmitEventHandler } from "react";
import { CircleLoadding } from './circleLoadding';

interface ModalWithdrawProps {
    onClose: (visible: boolean) => void
}


interface FormFieldsProps {
    onFile: (file: File) => void
}

function FormFields({ onFile }: FormFieldsProps) {
    return (
        <div>
            <Label htmlFor="file-input">Arquivo:</Label>
            <Input 
                type="file" 
                id="file-input" 
                className="mt-3 mb-10"
                onChange={(file: any) => onFile(file.target.files[0])} />
        </div>
    )
}

export function ModalWithdraw(props: ModalWithdrawProps) {
    const { onClose } = props;
    
    const [progress, setProgress] = useState(0);
    const [fileSize, setFileSize] = useState(0);



    const [file, setFile] = useState<File>();

    const handlerProgress = useCallback((bytes: number) => {
        const progress =  bytes * 100 / fileSize;
        setProgress(progress);
    }, [fileSize]);

    const handlerFinishUpload = useCallback((cid: string) => {
        console.log('Finish...')
    }, []);

    const { uploadFileIpfs, isUploadding } = useIPFS({ onProgress: handlerProgress, onFinish: handlerFinishUpload });


    const handlerSubmitForm: SubmitEventHandler<HTMLFormElement> = (form) => {
        form.preventDefault();

        if (!file) {
            toast.error('Selecione um arquivo para proceguir!');
            return
        }

        setFileSize(file.size);
        uploadFileIpfs(file);
    }


    return (
        <div className="fixed px-4 left-0 top-0 right-0 bottom-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white w-full max-w-150 p-4 rounded-2xl">
                <h2 className="text-xl font-bold">
                    Solicitação de Saque
                </h2>

                <p className="mt-4 text-[14px]">
                    Para fazer um saque, você precisa fazer um upload de um arquivo 
                    que comprove vericidade! Depois de uma analise e votação dos doadores 
                    os recursos seram liberados.
                </p>

                <form className="mt-5" action="#" method="POST" onSubmit={handlerSubmitForm}>
                    {
                        !isUploadding 
                        ? <FormFields onFile={(file) => setFile(file)} />
                        : <CircleLoadding description={`Salvando arquivo! ${progress}%`} />
                    }
                    
                    <div className="flex gap-4">
                        <Button 
                            onClick={() => onClose(false)}
                            disabled={isUploadding} 
                            className="flex-1 py-6 cursor-pointer" 
                            variant="outline">
                                Cancelar
                        </Button>

                        <Button 
                            disabled={isUploadding} 
                            type="submit" 
                            className="flex-1 py-6 cursor-pointer">
                            Solicitar
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    )
}