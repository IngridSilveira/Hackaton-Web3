import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.create();

describe('Tests of SignUp contract', async () => {

    /**
     * Mesmos valores do enum do contrato SignUp.sol, para 
     * facilitar a leitura dos testes.
     */
    const ProfileType = {
        ONG: 0,
        DONOR: 1
    };

    let signUpContract: any;

    /**
     * Fazendo o deploy do contrato SignUp antes de rodar os testes.
     * Isso é chamado apenas uma vez, antes de todos os testes 
     * serem executados.
     */
    before(async () => {
        const SignUpContract = await ethers.getContractFactory('SignUp');
        signUpContract = await SignUpContract.deploy();
    });

    
    it('Should sign up a user', async () => {

        /**
         * Fazendo o sign up de um usuário, utilizando 
         * o nome "Alan Turing" e o tipo de perfil "DONOR".
         */
        const tx = signUpContract.signUp('Alan Turing', ProfileType.DONOR);

        expect(tx).to.emit(signUpContract, 'UserRegistered');
    });

    it('Should not allow signing up with an empty username', async () => {

        /**
         * Fazendo o sign up de um usuário, utilizando 
         * o nome vazio e o tipo de perfil "ONG". Isso 
         * deve resultar em uma falha.
         */
        const tx = signUpContract.signUp('', ProfileType.ONG);

        await expect(tx).to.be.revertedWith('O nome de usuario nao pode ser vazio.');
    });

    it('Should not allow signing up with an existing username', async () => {

        /**
         * Fazendo o sign up de um usuário, utilizando 
         * o nome "Alan Turing" e o tipo de perfil "DONOR". Isso 
         * deve resultar em uma falha.
         */
        const tx = signUpContract.signUp('Alan Turing', ProfileType.DONOR);

        await expect(tx).to.be.revertedWith('Usuario ja registrado no sistema.');
    });


    it('Test function to get user data', async () => {
        const [user] = await ethers.getSigners();

        /**
         * Testando se os dados do usuário "Alan Turing" são retornados corretamente.
         * Isso é feito chamando a função getUser do contrato SignUp, passando o 
         * endereço do usuário.
         */
        const userData = await signUpContract.getUser(user.address);

        expect(userData.username).to.equal('Alan Turing');
        expect(userData.userType).to.equal(ProfileType.DONOR);
    });

    it('Test function to check if user is ONG', async () => {
        const [user] = await ethers.getSigners();

        /**
         * Testando se o usuário "Alan Turing" é verificado corretamente como uma ONG.
         * Isso é feito chamando a função isONG do contrato SignUp, passando o 
         * endereço do usuário.
         */
        const isONG = await signUpContract.isONG(user.address);

        expect(isONG).to.equal(false);
    });
});
