import { network } from 'hardhat';


const { ethers } = await network.create();



async function main() {
    for (let i = 0; i < 25; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}

main()
.catch(err => {
    console.log(err);
    process.exitCode = 1;
});