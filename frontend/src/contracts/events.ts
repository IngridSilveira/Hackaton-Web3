import { ethers } from "ethers";
import { ContractException } from "../exceptions/ContractException";

import CampaignABI from "./artifacts/Campaign.sol/Campaign.json";
import DonateABI from "./artifacts/Donate.sol/Donate.json";
import type { EventType } from "../types/campaing";





export class Events {

    /**
     * Provider para buscar os eventos.
     */
    protected provider: ethers.Provider;


    protected contractsAbi: Record<string, ethers.InterfaceAbi> = {
        [import.meta.env.VITE_CAMPAIGN_ADDRESS]: CampaignABI.abi,
        [import.meta.env.VITE_DONATE_ADDRESS]: DonateABI.abi,
    };

    protected eventsName = [
        'CampaignCreated',
        'DonationReceived',
        'WithdrawalRequested',
        'VotingCreated',
        'ProposalQueued',
    ];


    constructor(provider: ethers.Provider) {
        this.provider = provider;
    }


    public async getEventsLog(campaingId: bigint): Promise<[ethers.Log[] | null, Error | null]> {
        try {
            const tx = await this.provider.getLogs({
                fromBlock: 0,
                toBlock: 'latest',
                topics: [
                    null,
                    ethers.zeroPadValue(
                        ethers.toBeHex(campaingId),
                        32
                    )
                ],
            });

            return [tx, null];
        }

        catch (err) {
            let message = 'Um erro desconhecido aconteceu';

            if (typeof err === "object" && err && "reason" in err && err.reason != null)
                message = err.reason as string;

            return [null, new ContractException(message)];
        }
    }

    public parseLogsEvents(logs: ethers.Log[]): Array<EventType> {

        const result: Array<EventType> = [];

        for (const log of logs) {

            if (!Object.keys(this.contractsAbi).includes(log.address))
                continue;

            const interfaceContract = new ethers.Interface(this.contractsAbi[log.address]);
            const parsedLog = interfaceContract.parseLog(log);


            if (parsedLog && parsedLog.name && this.eventsName.includes(parsedLog.name)) {
                result.push({
                    name: parsedLog.name,
                    args: parsedLog.args,
                });
            }
        }

        return result;
    }
}
