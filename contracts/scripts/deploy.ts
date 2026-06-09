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
 * O ImpactToken deve ser deployado ANTES do Donate, pois o Donate
 * recebe seu endereço no construtor para poder mintar tokens aos doadores.
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
 *
 * @param impactTokenAddress Endereço do ImpactToken já deployado.
 */
async function deployDonate(impactTokenAddress: string) {
    const Donate = await ethers.getContractFactory('Donate');
    const donate = await Donate.deploy(impactTokenAddress);
    await donate.waitForDeployment();

    const donateAddress = await donate.getAddress();
    return { donate, donateAddress };
}


/**
 * Função para realizar o deploy do contrato de Campaign.
 * Após o deploy, configura os endereços dos contratos dependentes (SignUp e Donate).
 *
 * @param signUpAddress  Endereço do SignUp já deployado.
 * @param donateAddress  Endereço do Donate já deployado.
 */
async function deployCampaign(signUpAddress: string, donateAddress: string) {
    const Campaign = await ethers.getContractFactory('Campaign');
    const campaign = await Campaign.deploy();
    await campaign.waitForDeployment();

    const campaignAddress = await campaign.getAddress();

    await campaign.setSignUpContract(signUpAddress);
    await campaign.setDonateContract(donateAddress);

    return { campaign, campaignAddress };
}


/**
 * Função para realizar o deploy do CampaignGovernor.
 *
 * O Governor é o contrato de DAO que gerencia a votação para liberação de fundos.
 * Ele recebe o ImpactToken como token de votação (ERC20Votes) e referências
 * aos demais contratos para validar e executar as propostas de saque.
 *
 * @param impactTokenAddress  Endereço do ImpactToken (poder de voto).
 * @param signUpAddress       Endereço do SignUp (validação de ONGs).
 * @param campaignAddress     Endereço do Campaign (validação de campanhas).
 * @param donateAddress       Endereço do Donate (target do releaseFunds).
 */
async function deployCampaignGovernor(
    impactTokenAddress: string,
    signUpAddress: string,
    campaignAddress: string,
    donateAddress: string
) {
    const CampaignGovernor = await ethers.getContractFactory('CampaignGovernor');
    const governor = await CampaignGovernor.deploy(
        impactTokenAddress,
        signUpAddress,
        campaignAddress,
        donateAddress
    );
    await governor.waitForDeployment();

    const governorAddress = await governor.getAddress();
    return { governor, governorAddress };
}


async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account:', deployer.address);

    // 1. SignUp — registro de usuários (ONG / Doador)
    const { signUp, signUpAddress } = await deploySignUp();

    // 2. ImpactToken — token de voto proporcional às doações
    const { impactToken, impactTokenAddress } = await deployImpactToken();

    // 3. Donate — custódia dos fundos em escrow + mint de ImpactToken
    const { donate, donateAddress } = await deployDonate(impactTokenAddress);

    // 4. Campaign — gerenciamento de campanhas das ONGs
    const { campaign, campaignAddress } = await deployCampaign(signUpAddress, donateAddress);

    // 5. CampaignGovernor — DAO de votação para liberar fundos
    const { governor, governorAddress } = await deployCampaignGovernor(
        impactTokenAddress,
        signUpAddress,
        campaignAddress,
        donateAddress
    );

    // Pós-configuração:

    // Vincula o Campaign ao Donate (para verificar estado das campanhas)
    await donate.setCampaignContract(campaignAddress);

    // Registra o Governor no Donate (apenas ele pode chamar releaseFunds)
    await donate.setGovernorContract(governorAddress);

    // Transfere a propriedade do ImpactToken para o Donate
    // (somente o owner do ImpactToken pode mintar novos tokens)
    await impactToken.transferOwnership(donateAddress);

    console.log('----------------------------------------');
    console.log('SignUp deployed to:          ', signUpAddress);
    console.log('ImpactToken deployed to:     ', impactTokenAddress);
    console.log('Donate deployed to:          ', donateAddress);
    console.log('Campaign deployed to:        ', campaignAddress);
    console.log('CampaignGovernor deployed to:', governorAddress);
    console.log('----------------------------------------');
    console.log('Copie os endereços acima para o arquivo frontend/.env');
}

main()
    .then(() => console.log('Deploy feito com sucesso!'))
    .catch((error) => {
        console.error('Erro ao fazer o deploy:', error);
        process.exit(1);
    });
