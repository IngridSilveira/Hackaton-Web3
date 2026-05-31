import { ethers } from "ethers";


import DonateABI from './artifacts/Donate.sol/Donate.json';
import { ContractException } from "../exceptions/ContractException";

type CallbackDonationReceived = (campaingId: bigint, donor: string, amount: bigint) => void;

export class DonateContract {
    /**
     * Endereço do contrato vindo das variaveis de ambiente.
     */
    private contractAddress: string = import.meta.env.VITE_DONATE_ADDRESS;

    /**
     * Instancia do contrato. Serve para chamar os metodos do contrato.
     */
    protected instance: ethers.Contract;


    constructor(signer: ethers.Signer) {
        this.instance = new ethers.Contract(
            this.contractAddress,
            DonateABI.abi,
            signer
        );
    }


    public async donate(campaingId: bigint, amount: bigint): Promise<[void | null, Error | null]> {
        try {
            const tx = await this.instance.donate(campaingId, { value: amount });
            return [tx, null];
        }
        catch (err) {
            let message = 'Um erro desconhecido aconteceu';
            
            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ContractException(message)];
        }

    }


    public async getEventsDonateReceived(campaingId: bigint) {
        
    }


    /**
     * Isso vai chamar a callback quando receber o evento de 'DonationReceived'
     * para uma campanha especifica.
     * 
     * @param campaingId 
     * @param callback 
     */
    public onDonationReceived(campaingId: bigint, callback: CallbackDonationReceived) {
        const filter = this.instance.filters.DonationReceived(campaingId);
        this.instance.on(filter, callback);
    }

    /**
     * Removendo o listener do evento, isso deve ser usado no 
     * unmount do component para limpar os eventos.
     * 
     * @param campaingId 
     * @param callback 
     */
    public removeDonationReceived(campaingId: bigint, callback: CallbackDonationReceived) {
        const filter = this.instance.filters.DonationReceived(campaingId);
        this.instance.off(filter, callback);
    }

}
