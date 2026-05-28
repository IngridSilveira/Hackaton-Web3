import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.create();


describe('Tests of Donate contract', async () => {

    const ProfileType = {
        ONG: 0,
        DONOR: 1
    };

    let signUpContract: any;
    let campaignContract: any;
    let donateContract: any;


    before(async () => {
        const SignUpContract = await ethers.getContractFactory('SignUp');
        const CampaignContract = await ethers.getContractFactory('Campaign');
        const DonateContract = await ethers.getContractFactory('Donate');

        const [signUpDeployed, campaignDeployed, donateDeployed] = await Promise.all([
            SignUpContract.deploy(),
            CampaignContract.deploy(),
            DonateContract.deploy(),
        ]);
        
        signUpContract = signUpDeployed;
        campaignContract = campaignDeployed;
        donateContract = donateDeployed;

        const [signUpAddress, campaignAddress, donateAddress] = await Promise.all([
            signUpContract.getAddress(),
            campaignContract.getAddress(),
            donateContract.getAddress(),
        ]);

        await campaignContract.setSignUpContract(signUpAddress);
        await campaignContract.setDonateContract(donateAddress);

        await donateContract.setCampaignContract(campaignAddress);
    });


    it('Try donate to inexistent campaign', async () => {
        const [donor] = await ethers.getSigners();

        /**
         * O donor fez o sign up, mas como um DONOR, então ele existe 
         * no contrato de SignUp, mas não existe no contrato de Campaign.
         */
        await signUpContract
            .connect(donor)
            .signUp('Donor Teste', ProfileType.DONOR);

        const tx = donateContract
            .connect(donor)
            .donate(999, { value: ethers.parseEther('1') });

        expect(tx).to.be.revertedWith('Campanha nao encontrada.');
    });

    it('Try donate to campaign that is not accepting donations', async () => {
        const [,, donor] = await ethers.getSigners();
        
        /**
         * O owner fez o sign up, mas como um ONG, para criar a campanha.
         */
        await signUpContract
            .connect(donor)
            .signUp('Owner Teste', ProfileType.ONG);
        
        await campaignContract
            .connect(donor)
            .createCampaign(
                'Campanha de Teste',
                ethers.parseEther('10')
            );

        /**
         * Avançando 3 dias, o tempo para depois do prazo de doações da campanha.
         */
        await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
        await ethers.provider.send('evm_mine');

        const tx = donateContract
            .connect(donor)
            .donate(0, { value: ethers.parseEther('1') });

        expect(tx).to.be.revertedWith('Essa campanha nao esta aceitando doacoes no momento.');
    });

    it('Donate to campaign', async () => {
        /**
         * Assumindo que o "donor" é o mesmo do teste anterior, então ele 
         * já fez o sign up.
         */
        const [,, donor] = await ethers.getSigners();
        
        await campaignContract
            .connect(donor)
            .createCampaign(
                'Campanha de Teste',
                ethers.parseEther('10')
            );

        const tx = donateContract
            .connect(donor)
            .donate(1, { value: ethers.parseEther('1') });

        expect(tx).to.emit(donateContract, 'DonationReceived');
    });
});