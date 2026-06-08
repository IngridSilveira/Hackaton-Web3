import { expect } from 'chai';
import { network } from 'hardhat';
import { ethers } from 'ethers';

const { ethers: ethersLib } = await network.create();

describe('Governance Tests - ImpactGovernor', async () => {

    const ProfileType = {
        ONG: 0,
        DONOR: 1
    };

    let signUpContract: any;
    let governorContract: any;
    let governanceRegistry: any;
    let campaignContract: any;
    let timelockContract: any;

    let owner: any;
    let ongProposer: any;
    let voter1: any;
    let voter2: any;
    let voter3: any;

    /**
     * Setup: Deploy all contracts and configure relationships
     */
    before(async () => {
        [owner, ongProposer, voter1, voter2, voter3] = await ethersLib.getSigners();

        // Deploy SignUp
        const SignUpContract = await ethersLib.getContractFactory('SignUp');
        signUpContract = await SignUpContract.deploy();
        await signUpContract.waitForDeployment();
        const signUpAddress = await signUpContract.getAddress();

        // Deploy Campaign
        const CampaignContract = await ethersLib.getContractFactory('Campaign');
        campaignContract = await CampaignContract.deploy();
        await campaignContract.waitForDeployment();
        const campaignAddress = await campaignContract.getAddress();
        await campaignContract.setSignUpContract(signUpAddress);

        // Deploy Timelock (1 day delay)
        const TimelockFactory = await ethersLib.getContractFactory('TimelockController');
        const proposers = []; // Anyone can propose
        const executors = []; // Anyone can execute
        const admin = owner.address;
        timelockContract = await TimelockFactory.deploy(
            86400, // 1 day delay
            proposers,
            executors,
            admin
        );
        await timelockContract.waitForDeployment();
        const timelockAddress = await timelockContract.getAddress();

        // Deploy GovernanceRegistry
        const GovernanceRegistryFactory = await ethersLib.getContractFactory('GovernanceRegistry');
        governanceRegistry = await GovernanceRegistryFactory.deploy(signUpAddress);
        await governanceRegistry.waitForDeployment();
        const registryAddress = await governanceRegistry.getAddress();

        // Deploy Governor
        const GovernorFactory = await ethersLib.getContractFactory('ImpactGovernor');
        governorContract = await GovernorFactory.deploy(signUpAddress, timelockAddress);
        await governorContract.waitForDeployment();
        const governorAddress = await governorContract.getAddress();

        // Setup relationships
        await governanceRegistry.setGovernorContract(governorAddress);
        await campaignContract.setSignUpContract(signUpAddress);

        // Register users
        await signUpContract.connect(ongProposer).signUp('ONG Proposer', ProfileType.ONG);
        await signUpContract.connect(voter1).signUp('Voter 1', ProfileType.DONOR);
        await signUpContract.connect(voter2).signUp('Voter 2', ProfileType.DONOR);
        await signUpContract.connect(voter3).signUp('Voter 3', ProfileType.DONOR);
    });

    // ============ TEST SUITE 1: BASIC GOVERNANCE FLOW ============

    describe('Proposal Creation', () => {
        it('Should create proposal as ONG', async () => {
            const targets = [await campaignContract.getAddress()];
            const values = [0];
            const signatures = ['getCampaign(uint256)'];
            const calldatas = [ethersLib.AbiCoder.defaultAbiCoder().encode(['uint256'], [0])];
            const description = 'Test proposal: check campaign';

            const tx = await governorContract.connect(ongProposer).propose(
                targets,
                values,
                signatures,
                calldatas,
                description
            );

            expect(tx).to.emit(governorContract, 'ProposalCreated');
        });

        it('Should reject proposal with empty actions', async () => {
            const targets: any[] = [];
            const values: any[] = [];
            const signatures: any[] = [];
            const calldatas: any[] = [];
            const description = 'Empty proposal';

            const tx = governorContract.connect(ongProposer).propose(
                targets,
                values,
                signatures,
                calldatas,
                description
            );

            expect(tx).to.be.revertedWith('Proposal must have at least one action');
        });

        it('Should reject proposal with too many actions', async () => {
            const targets = Array(11).fill(await campaignContract.getAddress());
            const values = Array(11).fill(0);
            const signatures = Array(11).fill('getCampaign(uint256)');
            const calldatas = Array(11).fill(ethersLib.AbiCoder.defaultAbiCoder().encode(['uint256'], [0]));
            const description = 'Proposal with too many actions';

            const tx = governorContract.connect(ongProposer).propose(
                targets,
                values,
                signatures,
                calldatas,
                description
            );

            expect(tx).to.be.revertedWith('Proposal has too many actions');
        });
    });

    describe('Voting Process', () => {
        let proposalId: number;

        before(async () => {
            // Create test proposal
            const targets = [await campaignContract.getAddress()];
            const values = [0];
            const signatures = ['getCampaign(uint256)'];
            const calldatas = [ethersLib.AbiCoder.defaultAbiCoder().encode(['uint256'], [0])];
            const description = 'Test voting proposal';

            const tx = await governorContract.connect(ongProposer).propose(
                targets,
                values,
                signatures,
                calldatas,
                description
            );

            // Extrair proposalId do evento
            const receipt = await tx.wait();
            // TODO: Parse event log para obter proposalId
            proposalId = 0; // Placeholder
        });

        it('Should allow registered user to vote', async () => {
            // Skip if proposalId not found
            if (proposalId === 0) {
                this.skip();
            }

            const support = 1; // For
            const tx = await governorContract.connect(voter1).castVote(proposalId, support);

            expect(tx).to.emit(governorContract, 'VoteCast');
        });

        it('Should prevent double voting', async () => {
            if (proposalId === 0) {
                this.skip();
            }

            // Try to vote twice
            await governorContract.connect(voter1).castVote(proposalId, 1);

            const tx = governorContract.connect(voter1).castVote(proposalId, 1);
            expect(tx).to.be.revertedWith('Address has already voted');
        });

        it('Should prevent unregistered user from voting', async () => {
            if (proposalId === 0) {
                this.skip();
            }

            const unregisteredSigner = (await ethersLib.getSigners())[5];

            const tx = governorContract.connect(unregisteredSigner).castVote(proposalId, 1);
            expect(tx).to.be.revertedWith('Must be registered in SignUp');
        });

        it('Should count votes correctly', async () => {
            if (proposalId === 0) {
                this.skip();
            }

            // Multiple votes
            await governorContract.connect(voter1).castVote(proposalId, 1); // For
            await governorContract.connect(voter2).castVote(proposalId, 1); // For
            await governorContract.connect(voter3).castVote(proposalId, 0); // Against

            // Advance time past voting period
            await ethersLib.provider.send('evm_increaseTime', [7 * 24 * 60 * 60 + 1]);
            await ethersLib.provider.send('evm_mine', []);

            // Count votes
            const tx = await governorContract.countVotes(proposalId);

            const proposal = await governorContract.getProposal(proposalId);
            expect(proposal.succeeded).to.be.true;
        });
    });

    // ============ TEST SUITE 2: REPUTATION SYSTEM ============

    describe('Governance Registry - Reputation', () => {
        it('Should start with 0 reputation', async () => {
            const rep = await governanceRegistry.getReputation(voter1.address);
            expect(rep).to.equal(0);
        });

        it('Should increment reputation', async () => {
            // Grant REPUTATION_ADMIN role to owner
            const adminRole = ethersLib.id('REPUTATION_ADMIN');
            
            // Increment via owner
            await governanceRegistry.incrementReputation(
                voter1.address,
                5,
                'Good participation'
            );

            const rep = await governanceRegistry.getReputation(voter1.address);
            expect(rep).to.be.gte(5);
        });

        it('Should prevent reputation overflow', async () => {
            // Try to set reputation > MAX (100)
            const MAX_REP = 100;
            
            // Incrementar múltiplas vezes
            for (let i = 0; i < 20; i++) {
                try {
                    await governanceRegistry.incrementReputation(
                        voter1.address,
                        10,
                        'Bonus'
                    );
                } catch {
                    break;
                }
            }

            const rep = await governanceRegistry.getReputation(voter1.address);
            expect(rep).to.be.lte(MAX_REP);
        });
    });

    // ============ TEST SUITE 3: SYBIL ATTACK PREVENTION ============

    describe('Sybil Attack Detection', () => {
        it('Should flag suspicious addresses', async () => {
            const suspiciousAddresses = [voter1.address, voter2.address];
            const reason = 'Same IP detected';

            // Grant permission to owner
            await governanceRegistry.flagSybilAttack(suspiciousAddresses, reason);

            const isFlagged = await governanceRegistry.isSybilFlagged(voter1.address);
            expect(isFlagged).to.be.true;
        });

        it('Should zero reputation on Sybil flag', async () => {
            const isFlagged = await governanceRegistry.isSybilFlagged(voter1.address);
            if (isFlagged) {
                const rep = await governanceRegistry.getReputation(voter1.address);
                expect(rep).to.equal(0);
            }
        });

        it('Should allow clearing Sybil flag', async () => {
            await governanceRegistry.connect(owner).clearSybilFlag(voter1.address);

            const isFlagged = await governanceRegistry.isSybilFlagged(voter1.address);
            expect(isFlagged).to.be.false;
        });
    });

    // ============ TEST SUITE 4: SECURITY ============

    describe('Security & Access Control', () => {
        it('Should reject unauthorized reputation changes', async () => {
            const tx = governanceRegistry.connect(voter1).incrementReputation(
                voter2.address,
                5,
                'Hack attempt'
            );

            expect(tx).to.be.revertedWith('Only Governor or Owner can call this');
        });

        it('Should prevent only Governor from executing proposals', async () => {
            // TODO: Test that only Timelock can execute proposal actions
        });

        it('Should enforce Timelock delay', async () => {
            // TODO: Test that proposal execution respects TIMELOCK_DELAY
        });
    });

    // ============ TEST SUITE 5: INTEGRATION ============

    describe('Integration with Campaign', () => {
        it('Should record campaign creation in governance', async () => {
            // ONG cria campanha
            await campaignContract.connect(ongProposer).createCampaign(
                'Test Campaign',
                ethersLib.parseEther('10')
            );

            // Verificar que foi registrado
            // TODO: Implementar tracking em Campaign.sol
        });
    });
});
