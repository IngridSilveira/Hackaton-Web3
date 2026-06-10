// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import { ISignUp } from "./SignUp.sol";
import { IDAO } from "./DAO.sol";

interface ICampaign {
    function campaignIsAcceptingDonations(uint256 _id) external view returns (bool);
    function updateCurrentAmount(uint256 _id, uint256 _amount) external;
}


/**
 * @title Campaign
 *
 * @dev A ideia desse contrato é criar um mapeamento entre o endereço do usuário 
 * cadastrado como ONG e as campanhas criadas por ele. Esse contrato também deve
 * validar as informações do usuário antes de permitir a criação de uma campanha,
 * garantindo que apenas ONGs possam criar campanhas e que as informações 
 * fornecidas sejam válidas.
 */
contract Campaign is Ownable {

    /**
     * @dev Estrutura para representar uma campanha no sistema. 
     * Ela contém o título da campanha, o valor objetivo, o 
     * valor atual arrecadado e o endereço do criador da campanha.
     */
    struct CampaignStruct {
        uint256 id;
        string title;

        uint256 goalAmount;
        uint256 currentAmount;

        address creator;

        uint256 createdAt;
        uint256 deadline;
    }

    /**
     * @dev O contrato de SignUp é private porque ele só é utilizado 
     * internamente para validar as informações do usuário.
     */
    ISignUp private signUpContract;

    /**
     * @dev O contrato de DAO é private porque ele só é utilizado
     * internamente para criar propostas de votação.
     */
    IDAO private daoContract;
    address private daoContractAddress;

    /**
     * @dev O contrato de Donate é private porque ele só é utilizado
     * internamente para atualizar o valor arrecadado nas campanhas 
     * quando uma doação é feita e verificar estado da campanha 
     * antes de aceitar uma doação.
     */
    address private donateContract;


    /**
     * @dev Contador para gerar IDs para as campanhas. 
     */
    uint256 private campaignCounter;

    /**
     * @dev Mapeamento para armazenar as campanhas criadas. Cada usuario 
     * pode criar várias campanhas, então o mapeamento de address para uint256[] 
     * é utilizado para armazenar os IDs das campanhas criadas por cada usuário.
     */
    mapping(uint256 => CampaignStruct) private campaigns;
    mapping(address => uint256[]) private userCampaigns;


    /**
     * @dev Evento para notificar a criação de uma nova campanha. 
     * Passando 
     */
    event CampaignCreated(uint256 indexed campaignId, string title, uint256 goalAmount, address indexed creator);


    /**
     * @dev Evento para notificar a solicitação de um saque.
     * @param campaignId O ID da campanha para a qual o saque foi solicitado.
     * @param cid O CID do arquivo IPFS contendo as evidências para a solicitação de saque.
     */
    event WithdrawalRequested(uint256 indexed campaignId, string cid);

    /**
     * @dev Evento para notificar a criação de uma nova proposta de votação.
     *
     * @param campaignId O ID da campanha para a qual a proposta foi criada.
     * @param goalAmount O valor objetivo da proposta.
     * @param creator O endereço do criador da proposta.
     */
    event VotingCreated(uint256 indexed campaignId, uint256 proposalId, uint256 goalAmount, address indexed creator);


    event ProposalQueued(uint256 indexed campaignId, uint256 proposalId, address indexed creator);

    /**
     * @dev Definindo o owner do contrato como o endereço do deployer.
     * Isso é utilizado para setar o endereço do contrato de SignUp, 
     * que é nescessario para verificar as informações do usuário antes de permitir
     * o cadastro de uma campanha. 
     */
    constructor () Ownable(msg.sender) {}

    /**
     * @dev Função para setar o endereço do contrato de SignUp.
     * Essa função só pode ser chamada pelo owner do contrato.
     *
     * @param _signUpContract O endereço do contrato de SignUp.
     */
    function setSignUpContract(address _signUpContract) public onlyOwner {
        signUpContract = ISignUp(_signUpContract);
    }


    modifier onlyDonateContract() {
        require(msg.sender == donateContract, "Apenas o contrato de Donate pode chamar essa funcao.");
        _;
    }

    /**
     * @dev Função para setar o endereço do contrato de Donate.
     * Essa função só pode ser chamada pelo owner do contrato.
     *
     * @param _donateContract O endereço do contrato de Donate.
     */
    function setDonateContract(address _donateContract) public onlyOwner {
        donateContract = _donateContract;
    }

    /**
     * @dev Função para setar o endereço do contrato de DAO.
     * Essa função só pode ser chamada pelo owner do contrato.
     *
     * @param _daoContract O endereço do contrato de DAO.
     */
    function setDAOContract(address _daoContract) public onlyOwner {
        daoContract = IDAO(_daoContract);
        daoContractAddress = _daoContract;
    }


    /**
     * @dev Função para criar uma nova campanha. Essa função verifica se o usuário
     * é uma ONG cadastrada e se as informações fornecidas são válidas antes de criar a campanha.
     *
     * @param title O título da campanha.
     * @param goalAmount O valor objetivo da campanha.
     */
    function createCampaign(string memory title, uint256 goalAmount) public {
        require(signUpContract.isONG(msg.sender), "Apenas ONGs podem criar campanhas.");
        require(bytes(title).length > 0, "O titulo da campanha nao pode ser vazio.");


        campaigns[campaignCounter] = CampaignStruct({
            id: campaignCounter,
            title: title,
            goalAmount: goalAmount,
            currentAmount: 0,
            creator: msg.sender,
            createdAt: block.timestamp,
            deadline: block.timestamp + 3 days
        });

        userCampaigns[msg.sender].push(campaignCounter);
        campaignCounter++;


        emit CampaignCreated(campaignCounter - 1, title, goalAmount, msg.sender);
    }


    /**
     * @dev Função para obter todas as campanhas criadas. Isso pode 
     * ser melhorado para retornar apenas 10 dados de cada vez.
     *
     * @return Um array com todas as campanhas criadas.
     */
    function getAllCampaigns() public view returns (CampaignStruct[] memory) {
        CampaignStruct[] memory allCampaigns = new CampaignStruct[](campaignCounter);

        for (uint256 i = 0; i < campaignCounter; i++) {
            allCampaigns[i] = campaigns[i];
        }

        return allCampaigns;
    }

    /**
     * @dev Função para obter uma campanha específica pelo seu ID.
     *
     * @param _id O ID da campanha a ser obtida.
     * @return A estrutura da campanha correspondente.
     */
    function getCampaign(uint256 _id) public view returns (CampaignStruct memory) {
        require(campaigns[_id].id == _id, "Campanha nao encontrada.");
        return campaigns[_id];
    }


    /**
     * @dev Função para verificar se uma campanha está aceitando doações.
     * Isso sera utilizado no contrato de Donate para verificar se a campanha 
     * para a qual a doação está sendo feita está aceitando doações. A verifiação 
     * é feita verificando se o prazo da campanha ainda não expirou e se o valor
     * arrecadado ainda não atingiu o valor objetivo.
     *
     * @param _id O ID da campanha a ser verificada.
     * @return true se a campanha estiver aceitando doações, false caso contrário.
     */
    function campaignIsAcceptingDonations(uint256 _id) public onlyDonateContract view returns (bool) {
        CampaignStruct memory campaign = campaigns[_id];
        require(campaign.id == _id, "Campanha nao encontrada.");

        return campaign.deadline > block.timestamp && campaign.currentAmount < campaign.goalAmount;
    }


    /**
     * @dev Função para atualizar o valor arrecadado em uma campanha. Apenas 
     * o contrato de Donate pode chamar essa função.
     *
     * @param _id O ID da campanha a ser atualizada.
     * @param _amount O valor a ser adicionado ao total arrecadado.
     */
    function updateCurrentAmount(uint256 _id, uint256 _amount) public onlyDonateContract {
        CampaignStruct storage campaign = campaigns[_id];
        require(campaign.id == _id, "Campanha nao encontrada.");

        campaign.currentAmount += _amount;
    }


    /**
     * @dev Função para solicitar um saque de uma campanha.
     *
     * @param _id O ID da campanha para a qual o saque será solicitado.
     * @param _cid O CID do arquivo IPFS contendo as evidências para a solicitação de saque.
     */
    function requestWithdrawal(uint256 _id, string memory _cid) public {
        CampaignStruct memory campaign = campaigns[_id];

        require(campaign.id == _id, "Campanha nao encontrada.");
        require(campaign.creator == msg.sender, "Apenas o criador da campanha pode solicitar o saque.");
        require(campaign.currentAmount >= campaign.goalAmount, "O valor arrecadado ainda nao atingiu o valor objetivo.");

        emit WithdrawalRequested(_id, _cid);

        /**
         * @dev Se o contrato de DAO estiver definido, criamos uma proposta de saque.
         */
        if (address(daoContract) != address(0)) {
            address[] memory targets = new address[](1);
            uint256[] memory values = new uint256[](1);
            bytes[] memory calldatas = new bytes[](1);

            targets[0] = donateContract;
            values[0] = campaign.currentAmount;
            calldatas[0] = abi.encodeWithSignature(
                "transferTokens(address,uint256)",
                campaign.creator,
                campaign.currentAmount
            );

            uint256 proposalId = daoContract.propose(
                targets,
                values,
                calldatas,
                string(abi.encodePacked("Solicitacao de saque para ", campaign.title))
            );


            emit VotingCreated(_id, proposalId, campaign.currentAmount, msg.sender);
        }

    }


    function queue(uint256 _id) public {
        CampaignStruct memory campaign = campaigns[_id];

        require(campaign.id == _id, "Campanha nao encontrada.");
        require(campaign.creator == msg.sender, "Apenas o criador da campanha pode solicitar o saque.");
        require(campaign.currentAmount >= campaign.goalAmount, "O valor arrecadado ainda nao atingiu o valor objetivo.");

        if (address(daoContract) != address(0))
            revert("A funcao de queue ainda nao esta implementada no contrato de DAO.");


        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = donateContract;
        values[0] = campaign.currentAmount;
        calldatas[0] = abi.encodeWithSignature(
            "transferTokens(address,uint256)",
            campaign.creator,
            campaign.currentAmount
        );

        uint256 proposalId = daoContract.propose(
            targets,
            values,
            calldatas,
            string(abi.encodePacked("Solicitacao de saque para ", campaign.title))
        );


        emit ProposalQueued(_id, proposalId, msg.sender);
    }
}