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


async function deployCampaign(signUpAddress: string) {
    const Campaign = await ethers.getContractFactory('Campaign');
    const campaign = await Campaign.deploy();
    await campaign.waitForDeployment();

    const campaignAddress = await campaign.getAddress();

    /**
     * Definindo o contrato de SignUp no contrato de Campaign
     */
    await campaign.setSignUpContract(signUpAddress);

    return { campaign, campaignAddress };
}



async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account: ', deployer.address);

    const { signUp, signUpAddress } = await deploySignUp();
    const { campaign, campaignAddress } = await deployCampaign(signUpAddress);


    console.log('SignUp deployed to: ', signUpAddress);
    console.log('Campaign deployed to: ', campaignAddress);
}

main()
    .then(() => console.log('Deploy feito com sucesso!'))
    .catch((error) => {
        console.error('Erro ao fazer o deploy: ', error);
        process.exit(1);
    });
