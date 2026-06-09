import { Button } from "@/components/ui/button";

interface ModalWithdrawProps {
    onClose: (visible: boolean) => void
}

export function ModalWithdraw(props: ModalWithdrawProps) {

    const { onClose } = props;

    return (
        <div className="fixed px-4 left-0 top-0 right-0 bottom-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white w-full max-w-150 p-4 rounded-2xl">
                <h2 className="text-xl font-bold">Solicitação de Saque</h2>

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
