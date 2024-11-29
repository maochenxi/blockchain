// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // 引入 ERC721 合约

contract Adoption is ERC721 {
    struct Pet {
        string name;
        string picture;
        uint value;
        string breed;
        string location;
        address payable owner;
        bool forSale;
    }
    // Pet[] public pets;

    // 映射代币 ID 到宠物信息
    mapping(uint256 => Pet) public pets;

    // 映射账户地址到代币ID列表
    mapping(address => uint256[]) public ownerTokens;

    // 记录宠物数量
    uint256 public petCount=16;

    constructor() ERC721("PetNFT", "PET") {
        pets[0] = Pet(
                "Frieda",
                "images/scottish-terrier.jpeg",
                3,
                "Scottish Terrier",
                "Lisco, Alabama",
                payable(address(0)),
                false
            );

        pets[1] = Pet(
                "Gina",
                "images/scottish-terrier.jpeg",
                3,
                "Scottish Terrier",
                "Tooleville, West Virginia",
                payable(address(0)),
                false
            );

        pets[2] = Pet(
                "Collins",
                "images/french-bulldog.jpeg",
                2,
                "French Bulldog",
                "Freeburn, Idaho",
                payable(address(0)),
                false
            );

        pets[3] = Pet(
                "Melissa",
                "images/boxer.jpeg",
                2,
                "Boxer",
                "Camas, Pennsylvania",
                payable(address(0)),
                false
            );

        pets[4] = Pet(
                "Jeanine",
                "images/french-bulldog.jpeg",
                2,
                "French Bulldog",
                "Gerber, South Dakota",
                payable(address(0)),
                false
            );

        pets[5] = Pet(
                "Elvia",
                "images/french-bulldog.jpeg",
                3,
                "French Bulldog",
                "Innsbrook, Illinois",
                payable(address(0)),
                false
            );

        pets[6] = Pet(
                "Latisha",
                "images/golden-retriever.jpeg",
                3,
                "Golden Retriever",
                "Soudan, Louisiana",
                payable(address(0)),
                false
            );

        pets[7] = Pet(
                "Coleman",
                "images/golden-retriever.jpeg",
                3,
                "Golden Retriever",
                "Jacksonwald, Palau",
                payable(address(0)),
                false
            );

        pets[8] = Pet(
                "Nichole",
                "images/french-bulldog.jpeg",
                2,
                "French Bulldog",
                "Honolulu, Hawaii",
                payable(address(0)),
                false
            );

        pets[9] = Pet(
                "Fran",
                "images/boxer.jpeg",
                3,
                "Boxer",
                "Matheny, Utah",
                payable(address(0)),
                false
            );

        pets[10] = Pet(
                "Leonor",
                "images/boxer.jpeg",
                2,
                "Boxer",
                "Tyhee, Indiana",
                payable(address(0)),
                false
            );

        pets[11] = Pet(
                "Dean",
                "images/scottish-terrier.jpeg",
                3,
                "Scottish Terrier",
                "Windsor, Montana",
                payable(address(0)),
                false
            );

        pets[12] = Pet(
                "Stevenson",
                "images/french-bulldog.jpeg",
                3,
                "French Bulldog",
                "Kingstowne, Nevada",
                payable(address(0)),
                false
            );

        pets[13] = Pet(
                "Kristina",
                "images/golden-retriever.jpeg",
                4,
                "Golden Retriever",
                "Sultana, Massachusetts",
                payable(address(0)),
                false
            );

        pets[14] = Pet(
                "Ethel",
                "images/golden-retriever.jpeg",
                2,
                "Golden Retriever",
                "Broadlands, Oregon",
                payable(address(0)),
                false
            );

        pets[15] = Pet(
                "Terry",
                "images/golden-retriever.jpeg",
                2,
                "Golden Retriever",
                "Dawn, Wisconsin",
                payable(address(0)),
                false
            );
    }


    event PetAdopted(uint petId, address newOwner);
    event PetSold(uint petId, address newOwner);
    event PetAdded(uint petId, string name, address owner);

    function adoptPet(uint petId) public payable{
        // require(petId < pets.length, "Pet does not exist");
        require(!pets[petId].forSale, "Pet already for sale");
        //require(msg.value >= pets[petId].value * 1 ether, "Incorrect Ether amount provided.");

        pets[petId].owner.transfer(pets[petId].value); 
        pets[petId].owner = payable(msg.sender);

        _mint(msg.sender, petId); // 铸造 NFT

        ownerTokens[msg.sender].push(petId); // 将新铸造的代币 ID 添加到所有者的数组中

        // pets[petId].isDaibi = true;
        
        emit PetAdopted(petId, msg.sender);
    }

    function butsell(uint petId) public payable {
        // require(petId < pets.length, "Pet does not exist");
        require(msg.value >= 0.1 ether, "Not enough Ether provided."); // Check if the transaction value is enough.
        require(pets[petId].forSale, "Pet not for sale"); // Ensure the pet is for sale.

        pets[petId].owner.transfer(msg.value); // Transfer the Ether to the current pet owner.
        pets[petId].forSale = false;
        pets[petId].owner = payable(msg.sender);

        emit PetAdopted(petId, msg.sender);
    }

    //查找某个代币是否是这个address的
    function isTokenOwnedBy(address owner, uint petId) internal view returns (bool) {
        uint256[] memory tokens = ownerTokens[owner];
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i] == petId) {
                return true; // 找到代币，返回 true
            }
        }
        return false; // 未找到代币，返回 false
    }

    function sellPet_new(uint petId) public {
        // require(petId < pets.length, "Pet does not exist");
        require(pets[petId].owner == msg.sender, "Not the owner");
        require(isTokenOwnedBy(msg.sender, petId), "Token not owned by this address"); // 添加检查
        require(ownerOf(petId) == msg.sender, "Not the token owner"); // 再次确认代币的主人
        _burn(petId); // 销毁代币
        // 更新宠物映射
        pets[petId].forSale = true;
        pets[petId].owner = payable(address(0));

        // 从所有者的代币列表中移除该代币
        uint256[] storage tokens = ownerTokens[msg.sender];
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i] == petId) {
                tokens[i] = tokens[tokens.length - 1]; // 用最后一个代币替换当前代币
                tokens.pop(); // 移除最后一个代币
                break;
            }
        }
        
        emit PetSold(petId, msg.sender);
    }

    function sellPet(uint petId) public {
        // require(petId < pets.length, "Pet does not exist");
        require(pets[petId].owner == msg.sender, "Not the owner");
        pets[petId].forSale = true;
        emit PetSold(petId, msg.sender);
    }

    function addPet(
        string memory name,
        string memory location,
        uint value,
        string memory breed
    ) public {
        uint newPetId = petCount;
        petCount = petCount+1;
        pets[newPetId]=Pet({
                value: value,
                name: name,
                location: location,
                picture: "images/boxer.jpeg",
                breed: breed,
                owner: payable(address(0)),
                forSale: false
            });
        emit PetAdded(newPetId, name, msg.sender);
    }

    function getCount() public view returns (uint) {
        return petCount;
    }

   // 查询某个地址名下的所有代币 ID
    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return ownerTokens[owner]; // 返回该地址拥有的所有代币 ID
    }

    function getPetsByOwner_nft(
        uint petId
    )
        public
        view
        returns (
            string memory,
            string memory,
            uint,
            bool,
            address,
            string memory,
            string memory
        )
    {
        return (
            pets[petId].name,
            pets[petId].location,
            pets[petId].value,
            pets[petId].forSale,
            // pets[petId].owner,
            ownerOf(petId),
            pets[petId].picture,
            pets[petId].breed
        );
    }

    function getAllPets(
        uint petId
    )
        public
        view
        returns (
            string memory,
            string memory,
            uint,
            bool,
            address,
            string memory,
            string memory
        )
    {
        return (
            pets[petId].name,
            pets[petId].location,
            pets[petId].value,
            pets[petId].forSale,
            pets[petId].owner,
            pets[petId].picture,
            pets[petId].breed
        );
    }

    fallback() external payable {}

    receive() external payable {}
}
