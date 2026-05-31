import type { CallbackCampaignCreated, ResultRequestEventsCampaign, CampaignType } from '../types/campaing';
import { ethers } from 'ethers';


import CampaignABI from './artifacts/Campaign.sol/Campaign.json';
import { ContractException } from '../exceptions/ContractException';





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


    public async createCampaign(title: string, goalAmount: bigint): Promise<[void | null, Error | null]> {

        try {
            const tx = await this.instance.createCampaign(title, goalAmount);
            return [tx, null];
        }
        catch (err) {
            let message = 'Um erro desconhecido aconteceu';

            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ContractException(message)];
        }
    }

    public async getCampaign(id: bigint): Promise<[CampaignType | null, Error | null]> {
        try {
            const tx = await this.instance.getCampaign(id);
            return [tx, null];
        }
        catch (err) {
            let message = 'Um erro desconhecido aconteceu';

            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ContractException(message)];
        }
    }

    public async getAllCampaigns(): Promise<[CampaignType[] | null, Error | null]> {
        try {
            const tx = await this.instance.getAllCampaigns();
            return [tx, null];
        } catch (err) {
            let message = 'Um erro desconhecido aconteceu';

            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ContractException(message)];
        }
    }

    public async getEventsCampaignCreated(campaingId: bigint): Promise<ResultRequestEventsCampaign> {
        try {
            const filter = this.instance.filters.CampaignCreated(campaingId);
            const eventsLog = await this.instance.queryFilter(filter);

            return [eventsLog, null];
        }
        catch (err) {
            let message = 'Um erro desconhecido aconteceu';

            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ContractException(message)];
        }
    }

    public onCreateCampaign(callback: CallbackCampaignCreated) {
        this.instance.on('CampaignCreated', callback);
    }

    public removeCreateCampaign(callback: CallbackCampaignCreated) {
        this.instance.off('CampaignCreated', callback);
    }
}
