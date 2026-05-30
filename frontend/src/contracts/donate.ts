import { ethers } from "ethers";


import DonateABI from './artifacts/Donate.sol/Donate.json';
import { ContractException } from "../exceptions/ContractException";


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
}
