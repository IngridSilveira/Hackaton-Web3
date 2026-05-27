import { ethers } from 'ethers';


import type { UserType } from '../types/user';
import { ErrorGetUser } from '../exceptions/UserException';

import SignUpABI from './artifacts/SignUp.sol/SignUp.json';


export class SignUpContract {
    /**
     * Endereço do contrato vindo das variaveis de ambiente.
     */
    private contractAddress: string = import.meta.env.VITE_SIGNUP_ADDRESS;

    /**
     * Instancia do contrato. Serve para chamar os metodos do contrato.
     */
    protected instance: ethers.Contract;


    constructor(signer: ethers.Signer) {
        this.instance = new ethers.Contract(
            this.contractAddress,
            SignUpABI.abi,
            signer
        );

    }


    public async signUp(_username: string, _userType: number) {
        try {
            const tx = await this.instance.signUp(_username, _userType);
            await tx.wait();

            return [tx, null];
        }
        catch (err) {
            return [null, err];
        }
    }


    public async getUser(_userAddress: string): Promise<[UserType | null, Error | null]> {
        try {
            const tx = await this.instance.getUser(_userAddress);
            return [tx, null];
        }
        catch (err) {
            let message = 'Um erro desconhecido aconteceu';

            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ErrorGetUser(message)];
        }
    }
}
