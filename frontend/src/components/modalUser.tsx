import { useUserStore } from "../stores/useUserStore";


const LoaddingModal = () => {
    return (
        <div className="fixed w-full h-full bg-white flex items-center justify-center flex-col gap-4 z-10">
            <div className="w-10 h-10 rounded-full border-5 border-t-primary animate-spin">
            </div>

            <p className="font-normal">
                Buscando dados do usuário
            </p>
        </div>
    );
}


export const ModalUser = () => {

    const isLoadding = useUserStore((state) => state.isLoadding);


    if (isLoadding)
        return <LoaddingModal />

    return null;
}
