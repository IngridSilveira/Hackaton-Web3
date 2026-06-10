import { ethers } from "ethers";


import TimelockABI from './artifacts/Timelock.sol/Timelock.json';
import { ContractException } from "../exceptions/ContractException";



export class TimelockContract {
    /**
     * Endereço do contrato vindo das variaveis de ambiente.
     */
    private contractAddress: string = import.meta.env.VITE_TIMELOCK_ADDRESS;

    /**
     * Instancia do contrato. Serve para chamar os metodos do contrato.
     */
    protected instance: ethers.Contract;



    constructor(signer: ethers.Signer) {
        this.instance = new ethers.Contract(
            this.contractAddress,
            TimelockABI.abi,
            signer
        );
    }


    
}
