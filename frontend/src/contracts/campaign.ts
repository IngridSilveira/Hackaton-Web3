import { ethers } from 'ethers';


import CampaignABI from './artifacts/Campaign.sol/Campaign.json';
import type { CampaignType } from '../types/campaing';



export class CampaignContract {
    /**
     * Endereço do contrato vindo das variaveis de ambiente.
     */
    private contractAddress: string = import.meta.env.VITE_CAMPAIGN_ADDRESS;


    /**
     * Instancia do contrato. Serve para chamar os metodos do contrato.
     */
    protected instance: ethers.Contract;


    constructor(signer: ethers.Signer) {
        this.instance = new ethers.Contract(
            this.contractAddress,
            CampaignABI.abi,
            signer
        );
    }


    public async createCampaign(title: string, goalAmount: BigInt) {
        try {
            const tx = await this.instance.createCampaign(title, goalAmount);
            return [tx, null];
        }
        catch (err) {
            return [null, err];
        }
    }


    public async getAllCampaigns(): Promise<[CampaignType[] | null, Error | null]> {
        try {
            const tx = await this.instance.getAllCampaigns();
            return [tx, null];
        } catch (err) {
            return [null, err as Error];
        }
    }
}
