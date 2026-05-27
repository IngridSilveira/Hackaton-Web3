

export interface CampaignType {
    id: BigInt;
    title: string;
    goalAmount: BigInt;
    currentAmount: BigInt;
    creator: string;
    createdAt: number;
    deadline: number;
}
