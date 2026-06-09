import { network } from 'hardhat';

const { ethers } = await network.create();

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


/**
 * Função para realizar o deploy do ImpactToken.
 * O ImpactToken deve ser deployado ANTES do Donate,
 * pois o Donate recebe seu endereço no construtor.
 */
async function deployImpactToken() {
    const ImpactToken = await ethers.getContractFactory('ImpactToken');
    const impactToken = await ImpactToken.deploy();
    await impactToken.waitForDeployment();

    const impactTokenAddress = await impactToken.getAddress();

    return { impactToken, impactTokenAddress };
}


/**
 * Função para realizar o deploy do contrato de Donate.
 * Recebe o endereço do ImpactToken para que possa mintar tokens aos doadores.
 */
async function deployDonate(impactTokenAddress: string) {
    const Donate = await ethers.getContractFactory('Donate');
    const donate = await Donate.deploy(impactTokenAddress);
    await donate.waitForDeployment();

    const donateAddress = await donate.getAddress();
    return { donate, donateAddress };
}

async function deployCampaign(signUpAddress: string, donateAddress: string) {
    const Campaign = await ethers.getContractFactory('Campaign');
    const campaign = await Campaign.deploy();
    await campaign.waitForDeployment();

    const campaignAddress = await campaign.getAddress();

    /**
     * Definindo o contrato de SignUp no contrato de Campaign
     */
    await campaign.setSignUpContract(signUpAddress);
    await campaign.setDonateContract(donateAddress);

    return { campaign, campaignAddress };
}



async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account: ', deployer.address);

    const { signUp, signUpAddress } = await deploySignUp();
    const { impactToken, impactTokenAddress } = await deployImpactToken();

    // Donate precisa do endereço do ImpactToken no construtor
    const { donate, donateAddress } = await deployDonate(impactTokenAddress);
    const { campaign, campaignAddress } = await deployCampaign(signUpAddress, donateAddress);

    // Vincula o Campaign ao Donate
    await donate.setCampaignContract(campaignAddress);

    // Transfere a propriedade do ImpactToken para o Donate,
    // pois apenas o owner pode mintar novos tokens (ver ImpactToken.sol)
    await impactToken.transferOwnership(donateAddress);

    console.log('SignUp deployed to:      ', signUpAddress);
    console.log('ImpactToken deployed to: ', impactTokenAddress);
    console.log('Donate deployed to:      ', donateAddress);
    console.log('Campaign deployed to:    ', campaignAddress);
}

main()
    .then(() => console.log('Deploy feito com sucesso!'))
    .catch((error) => {
        console.error('Erro ao fazer o deploy: ', error);
        process.exit(1);
    });
