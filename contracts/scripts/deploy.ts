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


async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account: ', deployer.address);

    const { signUp, signUpAddress } = await deploySignUp();


    console.log('SignUp deployed to: ', signUpAddress);
}

main()
    .then(() => console.log('Deploy feito com sucesso!'))
    .catch((error) => {
        console.error('Erro ao fazer o deploy: ', error);
        process.exit(1);
    });
