// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface ISignUp {
    enum UserType {
        ONG,
        DONOR
    }

    struct User {
        string username;
        UserType userType;
    }

    function getUser(address _userAddress) external view returns (User memory);
    function isONG(address _userAddress) external view returns (bool);
}


/**
 * @title SignUp
 *
 * @dev A ideia desse contrato é criar um mapeamento entre o endereço do usuario,
 * nome, tipo de perfil. Isso sera util para exibir informações do usuario no front-end.
 */
contract SignUp {

    /**
     * @dev Enumeração para os tipos de usuário, isso será utilizado
     * para fazer validações no restante do sistema. Pois, apenas 
     * ONGs podem criar campanhas e ONGs/doadores podem doar.
     */
    enum UserType {
        ONG,
        DONOR
    }


    /**
     * @dev Estrutura para representar um usuário no sistema. Ela 
     * contém o nome de usuário e o tipo de usuário (ONG ou doador).
     */
    struct User {
        string username;
        UserType userType;
    }



    mapping(address => User) private users;


    event UserRegistered(address indexed userAddress, string username, UserType userType);

    /**
     * @dev Função para registrar um novo usuário no sistema. Essa função
     * deve validar o nome de usuario e garantir que o endereço do usuário 
     * ainda não esteja registrado.
     *
     * @param _username O nome de usuário a ser registrado.
     * @param _userType O tipo de usuário (ONG ou doador).
     */
    function signUp(string memory _username, UserType _userType) public {
        require(bytes(_username).length > 0, "O nome de usuario nao pode ser vazio.");
        require(bytes(users[msg.sender].username).length == 0, "Usuario ja registrado no sistema.");

        users[msg.sender] = User({
            username: _username,
            userType: _userType
        });
        
        emit UserRegistered(msg.sender, _username, _userType);
    }


    /**
     * @dev Função para obter as informações de um usuário registrado.
     * 
     * @param _userAddress O endereço do usuário.
     * @return User A estrutura contendo as informações do usuário.
     */
    function getUser(address _userAddress) public view returns (User memory) {
        require(bytes(users[_userAddress].username).length > 0, "Usuario nao encontrado.");
        return users[_userAddress];
    }

    /*
     * @dev Função para verificar se um usuário é uma ONG. Essa função
     * é útil para validar as permissões de criação de campanhas e doações.
     *
     * @param _userAddress O endereço do usuário a ser verificado.
     * @return bool Retorna true se o usuário for uma ONG, caso contrário, false.
     */
    function isONG(address _userAddress) public view returns (bool) {
        require(bytes(users[_userAddress].username).length > 0, "Usuario nao encontrado.");
        return users[_userAddress].userType == UserType.ONG;
    }
}
