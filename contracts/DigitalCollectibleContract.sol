// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // 引入 ERC721 合约

contract DigitalCollectibleContract is ERC721 {
    struct DigitalCollectible {
        string name;
        string picture;
        uint value;
        uint timestamp;
        uint NFTCode;
        string description;
        address payable owner;
        bool forSale;
    }
    // Pet[] public nfts;

    // 映射代币 ID 到宠物信息
    mapping(uint256 => DigitalCollectible) public nfts;

    // 映射账户地址到代币ID列表
    mapping(address => uint256[]) public ownerTokens;

    // 记录宠物数量
    uint256 public nftCount=8;

    constructor() ERC721("DigitalCollectible", "DCT") {

        nfts[1] = DigitalCollectible(
                "Statue of the Six Elders", // "六尊者像"
                "images/1.jpg",
                3,
                0,
                0,
                "The 'Statue of the Six Elders' is a painting by the Tang Dynasty artist Lu Lengjia, currently housed in the Palace Museum in Beijing, carrying profound religious cultural connotations.",
                payable(address(0)),
                false
            );

        nfts[2] = DigitalCollectible(
                "Gold Medal of the Primordial Heavenly Sovereign",
                "images/2.jpg",
                4,
                0,
                0,
                "The Primordial Heavenly Sovereign of the Jade Purity, the head of the Three Pure Ones in Taoism, symbolizes the chaos and infinity of the universe's creation.",
                payable(address(0)),
                false
            );

        nfts[3] = DigitalCollectible(
                "Boshang Reading Sticker",
                "images/5.jpg",
                3,
                0,
                0,
                "The 'Boshang Reading Sticker' is a work on paper by the famous Tang Dynasty calligrapher Ouyang Xun, known for its exquisite calligraphy skills and profound cultural heritage.",
                payable(address(0)),
                false
            );

        nfts[4] = DigitalCollectible(
                "National Style Fortune Cat",
                "images/3.jpg",
                3,
                0,
                0,
                "The National Style Fortune Cat is presented in a blue and red glaze, with delicate porcelain quality and a clean and elegant color. It is worthy of being a masterpiece of Chinese porcelain.",
                payable(address(0)),
                false
            );

        nfts[5] = DigitalCollectible(
                "Jade Ornament of Human Head and Serpent Body",
                "images/4.jpg",
                5,
                0,
                0,
                "The jade ornament of human head and serpent body was unearthed from the tomb of Huang Junmeng in the early Spring and Autumn period, providing valuable physical data for studying the clothing and jade carving craftsmanship of the Zhou Dynasty.",
                payable(address(0)),
                false
            );

        nfts[6] = DigitalCollectible(
                "Spring Colors of Luoyang",
                "images/6.jpg",
                5,
                0,
                0,
                "Currently housed in the Palace Museum in Beijing, it depicts the vivid natural ecological beauty of peonies. This painting broke free from the constraints of ink outline, directly blending colors and water to dot the flowers and leaves.",
                payable(address(0)),
                false
            );

        nfts[7] = DigitalCollectible(
                "Meiping with Four Loves in Blue and White",
                "images/7.jpg",
                3,
                0,
                0,
                "Currently housed in the Hubei Provincial Museum, a national first-class cultural relic. It's a rare and precious example of Yuan Dynasty blue-and-white porcelain, primarily featuring human figures as the main subject.",
                payable(address(0)),
                false
            );

        nfts[8] = DigitalCollectible(
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


    event NFTPurchased(uint nftId, address newOwner);
    event NFTSold(uint nftId, address newOwner);
    event NFTAdded(uint nftId, string name, address owner);

    //第一次购买数字藏品
    function NFTPurchase(uint nftId) public payable{
        // require(nftId < nfts.length, "NFT does not exist");
        require(!nfts[nftId].forSale, "NFT already for sale");
        //require(msg.value >= nfts[nftId].value * 1 ether, "Incorrect Ether amount provided.");

        nfts[nftId].owner.transfer(nfts[nftId].value); 
        nfts[nftId].owner = payable(msg.sender);
        nfts[nftId].NFTCode = nftId;
        nfts[nftId].timestamp = block.timestamp;

        _mint(msg.sender, nftId); // 铸造 NFT

        ownerTokens[msg.sender].push(nftId); // 将新铸造的代币 ID 添加到所有者的数组中

        // nfts[nftId].isDaibi = true;
        
        emit NFTPurchased(nftId, msg.sender);
    }
    //购买别人出售的数字藏品
    function buySellNFT(uint nftId) public payable {
        // require(nftId < nfts.length, "NFT does not exist");
        require(msg.value >= 0.1 ether, "Not enough Ether provided."); // Check if the transaction value is enough.
        require(nfts[nftId].forSale, "NFT not for sale"); // Ensure the pet is for sale.

        nfts[nftId].owner.transfer(nfts[nftId].value); // Transfer the Ether to the current pet owner.
        nfts[nftId].forSale = false;
        nfts[nftId].owner = payable(msg.sender);
        nfts[nftId].NFTCode = nftId;
        nfts[nftId].timestamp = block.timestamp;

        _mint(msg.sender, nftId); // 铸造 NFT

        ownerTokens[msg.sender].push(nftId); // 将新铸造的代币 ID 添加到所有者的数组中

        emit NFTPurchased(nftId, msg.sender);
    }

    //查找某个代币是否是这个address的
    function isTokenOwnedBy(address owner, uint nftId) internal view returns (bool) {
        uint256[] memory tokens = ownerTokens[owner];
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i] == nftId) {
                return true; // 找到代币，返回 true
            }
        }
        return false; // 未找到代币，返回 false
    }

    //出售数字藏品
    function sellNFTs_new(uint nftId) public {
        // require(nftId < nfts.length, "Pet does not exist");
        require(nfts[nftId].owner == msg.sender, "Not the owner");
        require(isTokenOwnedBy(msg.sender, nftId), "Token not owned by this address"); // 添加检查
        require(ownerOf(nftId) == msg.sender, "Not the token owner"); // 再次确认代币的主人
        _burn(nftId); // 销毁代币
        // 更新宠物映射
        nfts[nftId].forSale = true;
        nfts[nftId].NFTCode = 0;
        nfts[nftId].timestamp = 0;
        //保持原有owner来接受购买数字藏品的以太币
        //nfts[nftId].owner = payable(address(0));

        // 从所有者的代币列表中移除该代币
        uint256[] storage tokens = ownerTokens[msg.sender];
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i] == nftId) {
                tokens[i] = tokens[tokens.length - 1]; // 用最后一个代币替换当前代币
                tokens.pop(); // 移除最后一个代币
                break;
            }
        }
        
        emit NFTSold(nftId, msg.sender);
    }

    function addNFTs(
        string memory name,
        uint value,
        string memory description
    ) public {
        nftCount = nftCount+1;
        uint newNFTId = nftCount;
        nfts[newNFTId]=DigitalCollectible({
                value: value,
                name: name,
                description: description,
                picture: "images/boxer.jpeg",
                timestamp: 0,
                NFTCode: 0,
                owner: payable(address(0)),
                forSale: false
            });
        emit NFTAdded(newNFTId, name, msg.sender);
    }

    function getCount() public view returns (uint) {
        return nftCount;
    }

   // 查询某个地址名下的所有代币 ID
    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return ownerTokens[owner]; // 返回该地址拥有的所有代币 ID
    }

    function getNFTsByOwner(
        uint nftId
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
        DigitalCollectible memory nft = nfts[nftId];
        return (
            nft.name,
            nft.description,
            nft.value,
            nft.forSale,
            // ownerOf(nftId),
            nft.picture,
            nft.NFTCode,
            nft.timestamp
        );
    }

    function getAllNFTs(
        uint nftId
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
        DigitalCollectible memory nft = nfts[nftId];
        return (
            nft.name,
            nft.description,
            nft.value,
            nft.forSale,
            // ownerOf(nftId),
            nft.picture,
            nft.NFTCode,
            nft.timestamp
        );
    }

    fallback() external payable {}

    receive() external payable {}
}
