import { ethers } from 'ethers';



export type CallbackCampaignCreated = (campaingId: bigint, title: string, goalAmount: bigint, creator: string) => void;
export type EventsType = (ethers.EventLog | ethers.Log)[];
export type ResultRequestEventsCampaign = [EventsType | null, Error | null]

export interface CampaignType {
    id: bigint;
    title: string;
    goalAmount: bigint;
    currentAmount: bigint;
    creator: string;
    createdAt: bigint;
    deadline: bigint;
}


export interface CampaignCreatedType {
    eventName: string;
    args: {
        campaignId: bigint,
        title: string,
        goalAmount: bigint,
        creator: string
    }
}