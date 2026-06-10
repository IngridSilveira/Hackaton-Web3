import { network } from 'hardhat';

const { ethers } = await network.create();


/**
 * Deploy do contrato de timelock
 * 
 * @param delay 
 * @param proposers 
 * @param executors 
 * @param admin 
 * 
 * @returns [Object] - Retorna o contrato de timelock e seu endereço.
 */
async function deployTimelock(delay: number, proposers: string[], executors: string[], admin: string) {
    const Timelock = await ethers.getContractFactory('Timelock');
    const timelock = await Timelock.deploy(delay, proposers, executors, admin);
    await timelock.waitForDeployment();

    const timelockAddress = await timelock.getAddress();

    return { timelock, timelockAddress };
}


async function deployDao(tokenAddress: string, timelockAddress: string) {
    const Dao = await ethers.getContractFactory('DAO');
    const dao = await Dao.deploy(tokenAddress, timelockAddress);
    await dao.waitForDeployment();

    const daoAddress = await dao.getAddress();

    return { dao, daoAddress };
}

/**
 * Função para realizar o deploy do contrato de VoteToken.
 * @returns [Object] - Retorna o contrato de VoteToken e seu endereço.
 */
async function deployVoteToken() {
    const VoteToken = await ethers.getContractFactory('VoteToken');
    const voteToken = await VoteToken.deploy();
    await voteToken.waitForDeployment();

    const voteTokenAddress = await voteToken.getAddress();

    return { voteToken, voteTokenAddress };
}

/**
 * Função para realizar o deploy do contrato de SignUp.
 * @returns [Object] - Retorna o contrato de SignUp e seu endereço.
 */
async function deploySignUp() {
    const SignUp = await ethers.getContractFactory('SignUp');
    const signUp = await SignUp.deploy();
    await signUp.waitForDeployment();

    const signUpAddress = await signUp.getAddress();

    return { signUp, signUpAddress };
}


async function deployDonate() {
    const Donate = await ethers.getContractFactory('Donate');
    const donate = await Donate.deploy();
    await donate.waitForDeployment();
    
    const donateAddress = await donate.getAddress();
    return { donate, donateAddress };
}

async function deployCampaign(signUpAddress: string, donateAddress: string, daoAddress: string) {
    const Campaign = await ethers.getContractFactory('Campaign');
    const campaign = await Campaign.deploy();
    await campaign.waitForDeployment();

    const campaignAddress = await campaign.getAddress();

    /**
     * Definindo o contrato de SignUp, Donate e DAO no contrato de Campaign
     */
    await campaign.setSignUpContract(signUpAddress);
    await campaign.setDonateContract(donateAddress);
    await campaign.setDAOContract(daoAddress);

    return { campaign, campaignAddress };
}



async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account: ', deployer.address);

    const { timelock, timelockAddress } = await deployTimelock(
        300, 
        [deployer.address], 
        [deployer.address], 
        deployer.address
    );

    const { signUp, signUpAddress } = await deploySignUp();
    const { voteToken, voteTokenAddress } = await deployVoteToken();

    const { dao, daoAddress } = await deployDao(
        voteTokenAddress, 
        timelockAddress
    );

    const { donate, donateAddress } = await deployDonate();
    const { campaign, campaignAddress } = await deployCampaign(
        signUpAddress, 
        donateAddress, 
        daoAddress
    );



    await donate.setCampaignContract(campaignAddress);
    await donate.setVoteTokenContract(voteTokenAddress);

    await voteToken.transferOwnership(donateAddress);
    await dao.setCampaignContractAddress(campaignAddress);

    /**
     * Configurando o contrato de timelock.
     */
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

    await timelock.grantRole(PROPOSER_ROLE, daoAddress);
    await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
    await timelock.grantRole(PROPOSER_ROLE, deployer.address);


    console.log('Campaign deployed to: ', campaignAddress);
    console.log('DAO deployed to: ', daoAddress);
    console.log('Donate deployed to: ', donateAddress);
    console.log('SignUp deployed to: ', signUpAddress);
    console.log('Timelock deployed to: ', timelockAddress);
    console.log('VoteToken deployed to: ', voteTokenAddress);
}

main()
    .then(() => console.log('Deploy feito com sucesso!'))
    .catch((error) => {
        console.error('Erro ao fazer o deploy: ', error);
        process.exit(1);
    });
