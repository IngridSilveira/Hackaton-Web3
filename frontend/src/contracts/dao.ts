import { ethers } from "ethers";


import DaoABI from './artifacts/DAO.sol/DAO.json';
import { ContractException } from "../exceptions/ContractException";



export class DaoContract {
    /**
     * Endereço do contrato vindo das variaveis de ambiente.
     */
    private contractAddress: string = import.meta.env.VITE_DAO_ADDRESS;

    /**
     * Instancia do contrato. Serve para chamar os metodos do contrato.
     */
    protected instance: ethers.Contract;



    constructor(signer: ethers.Signer) {
        this.instance = new ethers.Contract(
            this.contractAddress,
            DaoABI.abi,
            signer
        );
    }


    async state(proposalId: string): Promise<[number | null, Error | null]> {
        try {
            const tx = await this.instance.state(proposalId);
            return [tx, null];
        }
        catch (err) {
            let message = 'Um erro desconhecido aconteceu';

            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ContractException(message)];
        }
    }

    async castVote(proposalId: bigint, vote: number): Promise<[number | null, Error | null]> {
        try {
            const tx = await this.instance.castVote(proposalId, vote);
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
