// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // 引入 ERC721 合约

contract Adoption is ERC721 {
    struct Pet {
        string name;
        string picture;
        uint value;
        uint timestamp;
        uint NFTCode;
        string description;
        address payable owner;
        bool forSale;
    }
    // Pet[] public pets;

    // 映射代币 ID 到宠物信息
    mapping(uint256 => Pet) public pets;

    // 映射账户地址到代币ID列表
    mapping(address => uint256[]) public ownerTokens;

    // 记录宠物数量
    uint256 public petCount=8;

    constructor() ERC721("PetNFT", "PET") {

        pets[1] = Pet(
                "Statue of the Six Elders", // "六尊者像"
                "images/1.jpg",
                3,
                0,
                0,
                "The 'Statue of the Six Elders' is a painting by the Tang Dynasty artist Lu Lengjia, currently housed in the Palace Museum in Beijing, carrying profound religious cultural connotations.",
                payable(address(0)),
                false
            );

        pets[2] = Pet(
                "Gold Medal of the Primordial Heavenly Sovereign",
                "images/2.jpg",
                4,
                0,
                0,
                "The Primordial Heavenly Sovereign of the Jade Purity, the head of the Three Pure Ones in Taoism, symbolizes the chaos and infinity of the universe's creation.",
                payable(address(0)),
                false
            );

        pets[3] = Pet(
                "Boshang Reading Sticker",
                "images/5.jpg",
                2,
                0,
                0,
                "The 'Boshang Reading Sticker' is a work on paper by the famous Tang Dynasty calligrapher Ouyang Xun, known for its exquisite calligraphy skills and profound cultural heritage.",
                payable(address(0)),
                false
            );

        pets[4] = Pet(
                "National Style Fortune Cat",
                "images/3.jpg",
                3,
                0,
                0,
                "The National Style Fortune Cat is presented in a blue and red glaze, with delicate porcelain quality and a clean and elegant color. It is worthy of being a masterpiece of Chinese porcelain.",
                payable(address(0)),
                false
            );

        pets[5] = Pet(
                "Jade Ornament of Human Head and Serpent Body",
                "images/4.jpg",
                5,
                0,
                0,
                "The jade ornament of human head and serpent body was unearthed from the tomb of Huang Junmeng in the early Spring and Autumn period, providing valuable physical data for studying the clothing and jade carving craftsmanship of the Zhou Dynasty.",
                payable(address(0)),
                false
            );

        pets[6] = Pet(
                "Spring Colors of Luoyang",
                "images/6.jpg",
                5,
                0,
                0,
                "Currently housed in the Palace Museum in Beijing, it depicts the vivid natural ecological beauty of peonies. This painting broke free from the constraints of ink outline, directly blending colors and water to dot the flowers and leaves.",
                payable(address(0)),
                false
            );

        pets[7] = Pet(
                "Meiping with Four Loves in Blue and White",
                "images/7.jpg",
                3,
                0,
                0,
                "Currently housed in the Hubei Provincial Museum, a national first-class cultural relic. It's a rare and precious example of Yuan Dynasty blue-and-white porcelain, primarily featuring human figures as the main subject.",
                payable(address(0)),
                false
            );

        pets[8] = Pet(
                "Tea Tasting at Cui'an",
                "images/8.jpg",
                3,
                0,
                0,
                "Miaoyu hosted with high etiquette to receive Jia Mu and her party. Miaoyu prepared different types of tea according to the identities and preferences of different individuals, showcasing the intricacies of the ancient tea ceremony.",
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
        pets[petId].NFTCode = petId;
        pets[petId].timestamp = block.timestamp;

        _mint(msg.sender, petId); // 铸造 NFT

        ownerTokens[msg.sender].push(petId); // 将新铸造的代币 ID 添加到所有者的数组中

        // pets[petId].isDaibi = true;
        
        emit PetAdopted(petId, msg.sender);
    }

    function butsell(uint petId) public payable {
        // require(petId < pets.length, "Pet does not exist");
        require(msg.value >= 0.1 ether, "Not enough Ether provided."); // Check if the transaction value is enough.
        require(pets[petId].forSale, "Pet not for sale"); // Ensure the pet is for sale.

        pets[petId].owner.transfer(pets[petId].value); // Transfer the Ether to the current pet owner.
        pets[petId].forSale = false;
        pets[petId].owner = payable(msg.sender);
        pets[petId].NFTCode = petId;
        pets[petId].timestamp = block.timestamp;

        _mint(msg.sender, petId); // 铸造 NFT

        ownerTokens[msg.sender].push(petId); // 将新铸造的代币 ID 添加到所有者的数组中

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

    //出售数字藏品
    function sellPet_new(uint petId) public {
        // require(petId < pets.length, "Pet does not exist");
        require(pets[petId].owner == msg.sender, "Not the owner");
        require(isTokenOwnedBy(msg.sender, petId), "Token not owned by this address"); // 添加检查
        require(ownerOf(petId) == msg.sender, "Not the token owner"); // 再次确认代币的主人
        _burn(petId); // 销毁代币
        // 更新宠物映射
        pets[petId].forSale = true;
        pets[petId].NFTCode = 0;
        pets[petId].timestamp = 0;
        //保持原有owner来接受购买数字藏品的以太币
        //pets[petId].owner = payable(address(0));

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

    // function sellPet(uint petId) public {
    //     // require(petId < pets.length, "Pet does not exist");
    //     require(pets[petId].owner == msg.sender, "Not the owner");
    //     pets[petId].forSale = true;
    //     emit PetSold(petId, msg.sender);
    // }

    function addPet(
        string memory name,
        uint value,
        string memory description
    ) public {
        petCount = petCount+1;
        uint newPetId = petCount;
        pets[newPetId]=Pet({
                value: value,
                name: name,
                description: description,
                picture: "images/boxer.jpeg",
                timestamp: 0,
                NFTCode: 0,
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
            // address,
            string memory,
            uint,
            uint
        )
    {
        Pet memory pet = pets[petId];
        return (
            pet.name,
            pet.description,
            pet.value,
            pet.forSale,
            // ownerOf(petId),
            pet.picture,
            pet.NFTCode,
            pet.timestamp
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
            // address,
            string memory,
            uint,
            uint
        )
    {
        Pet memory pet = pets[petId];
        return (
            pet.name,
            pet.description,
            pet.value,
            pet.forSale,
            // ownerOf(petId),
            pet.picture,
            pet.NFTCode,
            pet.timestamp
        );
    }

    fallback() external payable {}

    receive() external payable {}
}
