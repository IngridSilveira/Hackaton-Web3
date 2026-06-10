import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.create();


describe('Tests of Campaign contract', async () => {

    const ProfileType = {
        ONG: 0,
        DONOR: 1
    };

    let signUpContract: any;
    let campaignContract: any;
    let donateContract: any;
    let voteTokenContract: any;

    /**
     * Fazendo o deploy do contrato Campaign antes de rodar os testes.
     * Para isso precisamos fazer o deploy do contrato SignUp, pois o 
     * contrato Campaign depende do contrato SignUp.
     */
    before(async () => {
        const SignUpContract = await ethers.getContractFactory('SignUp');
        const CampaignContract = await ethers.getContractFactory('Campaign');
        const DonateContract = await ethers.getContractFactory('Donate');
        const VoteTokenContract = await ethers.getContractFactory('VoteToken');

        const [signUpDeployed, campaignDeployed, donateDeployed, voteTokenDeployed] = await Promise.all([
            SignUpContract.deploy(),
            CampaignContract.deploy(),
            DonateContract.deploy(),
            VoteTokenContract.deploy()
        ]);

        signUpContract = signUpDeployed;
        campaignContract = campaignDeployed;
        donateContract = donateDeployed;
        voteTokenContract = voteTokenDeployed;

        const [signUpAddress, campaignAddress, donateAddress, voteTokenAddress] = await Promise.all([
            signUpContract.getAddress(),
            campaignContract.getAddress(),
            donateContract.getAddress(),
            voteTokenContract.getAddress()
        ]);

        /**
         * Definindo o contrato de SignUp no contrato de Campaign
         */
        await campaignContract.setSignUpContract(signUpAddress);
        await campaignContract.setDonateContract(donateAddress);

        await donateContract.setVoteTokenContract(voteTokenAddress);
        await donateContract.setCampaignContract(campaignAddress);

        await voteTokenContract.transferOwnership(donateAddress);
    });



    it('Try create campaign with inexistent user', async () => {
        /**
         * O owner ainda não fez o sign up, então ele não existe 
         * no contrato de SignUp.
         */
        const [owner] = await ethers.getSigners();
        const tx = campaignContract.createCampaign(
            'Campanha de Teste',
            ethers.parseEther('10')
        );
    
        expect(tx).to.be.revertedWith('Usuario nao encontrado.');
    });

    it('Create campaign with user not registered as ONG', async () => {
        /**
         * O owner fez o sign up, mas como um DONOR, então ele não 
         * tem permissão para criar campanhas.
         */
        const [owner] = await ethers.getSigners();
        await signUpContract.signUp('Alan Turing', ProfileType.DONOR);

        const tx = campaignContract.createCampaign(
            'Campanha de Teste',
            ethers.parseEther('10')
        );
    
        expect(tx).to.be.revertedWith('Apenas ONGs podem criar campanhas.');
    });

    it('Create campaign with empty title', async () => {
        /**
         * O others fez o sign up como ONG, mas está tentando criar uma 
         * campanha com título vazio, o que não é permitido.
         */
        const [owner, others] = await ethers.getSigners();
        await signUpContract
            .connect(others)
            .signUp('Albert Einstein', ProfileType.ONG);

        const tx = campaignContract
            .connect(others)
            .createCampaign(
                '',
                ethers.parseEther('10')
            );

        expect(tx).to.be.revertedWith('O titulo da campanha nao pode ser vazio.');
    });

    it('Create campaign', async () => {
        /**
         * O others fez o sign up como ONG e deve criar 
         * uma campanha com sucesso.
         */
        const [,, other] = await ethers.getSigners();

        await signUpContract
            .connect(other)
            .signUp('Richard Feynman', ProfileType.ONG);

        const tx = campaignContract
            .connect(other)
            .createCampaign(
                'Campanha de Teste',
                ethers.parseEther('1')
            );

        expect(tx).to.emit(campaignContract, 'CampaignCreated');
    });


    it('Request withdrawal', async () => {
        const [,, other] = await ethers.getSigners();

        const donateTx =  donateContract
            .connect(other)
            .donate(0, { value: ethers.parseEther('1') });

        await expect(donateTx).to.emit(donateContract, 'DonationReceived');
        const evidenceCid = ethers.keccak256(ethers.toUtf8Bytes('evidencia'));

        const tx = campaignContract
            .connect(other)
            .requestWithdrawal(0, evidenceCid);

        expect(tx).to.emit(campaignContract, 'WithdrawalRequested');
    });


    it('Get all campaigns registred', async () => {
        /**
         * Esse usuario já fez o sign up como ONG nos testes anteriores
         */
        const [,, other] = await ethers.getSigners();

        /**
         * Cadastrando uma campanha para garantir que haja pelo 
         * menos uma campanha registrada.
         */
        const tx = await campaignContract
            .connect(other)
            .createCampaign(
                'Campanha de Teste',
                ethers.parseEther('10')
            );

        await expect(tx).to.emit(campaignContract, 'CampaignCreated');

        const campaigns = await campaignContract.getAllCampaigns();
        expect(campaigns.length).to.gte(1);
    });

    it('Try get campaign with inexistent id', async () => {
        const tx = campaignContract.getCampaign(999);
        expect(tx).to.be.revertedWith('Campanha nao encontrada.');
    });
});
