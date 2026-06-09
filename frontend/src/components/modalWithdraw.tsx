import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModalWithdrawProps {
    onClose: (visible: boolean) => void
}

export function ModalWithdraw(props: ModalWithdrawProps) {

    const { onClose } = props;

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

                <form className="mt-5 mb-10">
                    <Label htmlFor="file-input">Arquivo:</Label>
                    <Input type="file" id="file-input" className="mt-3" />
                </form>

                <div className="flex gap-4">
                    <Button onClick={() => onClose(false)} className="flex-1 py-6 cursor-pointer" variant="outline">
                        Cancelar
                    </Button>

                    <Button className="flex-1 py-6 cursor-pointer">
                        Solicitar
                    </Button>
                </div>
            </div>
        </div>
    )
}
