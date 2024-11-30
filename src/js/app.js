App = {
  web3Provider: null,
  contracts: {},
  picture: "",
  init: async function () {
    // Load pets.
    $.getJSON('../collectibles.json', function (data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        // console.log("time",data[i].timestamp);
        // var date = new Date(data[i].timestamp * 1000); // 假设时间戳是以秒为单位
        // var formattedDate = date.getFullYear() + '.' + 
        //                     String(date.getMonth() + 1).padStart(2, '0') + '.' + 
        //                     String(date.getDate()).padStart(2, '0');
        // console.log("time2",formattedDate);
        // petTemplate.find('.pet-timestamp').text(String(formattedDate));
        petTemplate.find('.pet-timestamp').text(data[i].timestamp);
        petTemplate.find('.pet-value').text(data[i].value);
        petTemplate.find('.pet-NFTCode').text(data[i].NFTCode);
        petTemplate.find('.pet-description').text(data[i].description);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.btn-adopt').attr('data-value', data[i].value);
        petTemplate.find('.btn-sell').attr('data-id', data[i].id);
        petTemplate.find('.btn-sell').attr('data-value', data[i].value);
        // console.log("id",data[i].id);
        // console.log("value",data[i].value);

        // console.log("宠物内容:", petTemplate.html());
        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.error(error);
      }

      App.account = accounts[0];
      // App.displayBalance();

    });
    return App.initContract();
  },

  initContract: function () {
    var blocks = web3.eth.getBlockNumber(function (error, result) {
      if (!error) {
        console.log("block", result);
      } else {
        console.error(error);
      }
      return result;
    });

    $.getJSON('DigitalCollectibleContract.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var NFTArtifact = data;
      App.contracts.DigitalCollectibleContract = TruffleContract(NFTArtifact);

      // Set the provider for our contract
      App.contracts.DigitalCollectibleContract.setProvider(App.web3Provider);
      App.contracts.DigitalCollectibleContract.deployed().then(function (instance) {
        var NFTInstance = instance;
        NFTInstance.NFTPurchased({}, { fromBlock: 'latest' }).watch(function (error, event) {
          console.log(event)
          if (!error) {
            var nftId = event.args.nftId;
            var newOwner = event.args.newOwner;
            Toastify({
              text: 'NFT Purchased - NFT ID: ' + nftId + ', New Owner: ' + newOwner,
              duration: 3000,  // Toast 显示的时间（以毫秒为单位）
              gravity: 'bottom',  // Toast 的位置
              position: 'right',  // Toast 的对齐方式
              backgroundColor: 'white',  // Toast 的背景颜色
            }).showToast();
          } else {
            console.error('Error:', error);
          }
        });
      });

      // 监听 NFTSold 事件
      App.contracts.DigitalCollectibleContract.deployed().then(function (instance) {
        var NFTInstance = instance;
        NFTInstance.NFTSold({}, {  fromBlock: 'latest' }).watch(function (error, event) {
          if (!error) {
            var nftId = event.args.nftId;
            var newOwner = event.args.newOwner;
            Toastify({
              text: 'NFT Sold - NFT ID: ' + nftId + ', New Owner: ' + newOwner,
              duration: 3000,
              gravity: 'bottom',
              position: 'right',
              backgroundColor: 'white',
            }).showToast();
          } else {
            console.error('Error:', error);
          }
        });
      });

      // 监听 NFTAdded 事件
      App.contracts.DigitalCollectibleContract.deployed().then(function (instance) {
        var NFTInstance = instance;
        NFTInstance.NFTAdded({}, { fromBlock: 'latest' }).watch(function (error, event) {
          if (!error) {
            var nftId = event.args.nftId;
            var name = event.args.name;
            var owner = event.args.owner;
            Toastify({
              text: 'NFT Added - NFT ID: ' + nftId + ', Name: ' + name + ', Owner: ' + owner,
              duration: 3000,
              gravity: 'bottom',
              position: 'right',
              backgroundColor: 'white',
            }).showToast();
          } else {
            console.error('Error:', error);
          }
        });
      });
      // Use our contract to retrieve and mark the adopted pets
      return App.markPurchased();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handlePurchase);
    $(document).on('click', '.btn-add', App.handleAdd);
    $(document).on('click', '.btn-sell', App.handleSell);
  },

  markPurchased: function () {
    console.log("enter");
    var NFTInstance;
    petsRow = $('#petsRow')
    petsRow.html('');
    App.contracts.DigitalCollectibleContract.deployed().then(async function (instance) {
      NFTInstance = instance;
      return NFTInstance.getCount.call();
    }).then(async function (count) {
      for (var i = 1; i <= count.c[0]; i++) {
        await NFTInstance.getAllNFTs.call(i).then(function (nft) {
          const [name, description, value, sale, image, NFTCode, timestamp] = [nft[0], nft[1], nft[2], nft[3], nft[4], nft[5], nft[6], nft[7]];
          var petTemplate = $('#petTemplate');
          petTemplate.find('.panel-title').text(name);
          petTemplate.find('img').attr('src', image);
          petTemplate.find('.pet-description').text(description);
          petTemplate.find('.pet-value').text(value.c[0]);
          petTemplate.find('.pet-NFTCode').text(NFTCode);
          // petTemplate.find('.pet-timestamp').text(timestamp);
          var date = new Date(timestamp * 1000); // 假设时间戳是以秒为单位
          var formattedDate = date.getFullYear() + '.' + 
                            String(date.getMonth() + 1).padStart(2, '0') + '.' + 
                            String(date.getDate()).padStart(2, '0') + ' ' + 
                            String(date.getHours()).padStart(2, '0') + ':' + 
                            String(date.getMinutes()).padStart(2, '0') + ':' + 
                            String(date.getSeconds()).padStart(2, '0'); // 添加小时、分钟和秒
          petTemplate.find('.pet-timestamp').text(formattedDate);
          if (NFTCode == 0 || timestamp == 0) {
            petTemplate.find('.pet-NFTCode').text("None");
            petTemplate.find('.pet-Collector').text("None");
            petTemplate.find('.pet-timestamp').text("None");
          }
          petTemplate.find('.btn-adopt').attr('data-id', i)
          // console.log("data-id name ", i, name);
          if (sale) {
            petTemplate.find('.btn-adopt').text("Sell").attr("disabled", false);
          }
          else if (NFTCode != 0) {
            petTemplate.find('.btn-adopt').text("Adopted").attr("disabled", true);
          }
          else {
            petTemplate.find('.btn-adopt').text("Adopt").attr("disabled", false);
          }

          petsRow.append(petTemplate.html());
        });
      }
    }).catch(function (err) {
      console.log(err.message);
    });
    App.displayOwnedNFTs();
  },
  displayOwnedNFTs: async function () {
    // console.log("displayOwnedNFTs");
    var NFTInstance;

    var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var account = currentAccount[0];
    // var balance = await web3.eth.getBalance(account, "ether");
    web3.eth.getBalance(account, function (error, balance) {
      if (!error) {
        var acc = $('#account')

        var balanceEth = web3.fromWei(balance, 'ether');
        console.log('账户余额:', balanceEth, 'ETH');
        acc.html('');
        acc.append("your address:" + account + "<br>");
        acc.append("your balance " + balanceEth);
      } else {
        console.error('获取余额时出错:', error);
      }
    });
    App.contracts.DigitalCollectibleContract.deployed().then(async function (instance) {
      NFTInstance = instance;

      var tokensList = await NFTInstance.getOwnedTokens(account);
      
      console.log("Owned Tokens List: ", tokensList);

      return tokensList;
      // var count = await adoptionInstance.getCount.call();
      // return count;
    }).then(async function (tokensList) {
      // console.log("count ", count);
      var petsRow = $('#adoptedPetsRow');
      var petT = $('#petTemplate');
      petsRow.html('');
      // for (var i = 0; i < count.c[0]; i++) {
      for (var i = 0; i < tokensList.length; i++) {
        const tokenId = tokensList[i]
        // console.log("tokenId",tokenId.c[0]);
        await NFTInstance.getNFTsByOwner(tokenId.c[0]).then(function (nft) {
          // console.log("log owned pets");
          const [name, description, value, sale, image, NFTCode, timestamp] = [nft[0], nft[1], nft[2], nft[3], nft[4], nft[5], nft[6], nft[7]];
          // console.log(name, location, age, sale, owner, image, breed)
          // if (owner === account && sale === false) {
          if (sale === false) {
            // console.log("owner current", owner, currentAccount[0]);
            var petTemplate = petT.clone();
            petTemplate.find('.panel-title').text(name);
            petTemplate.find('img').attr('src', image);
            petTemplate.find('.pet-description').text(description);
            petTemplate.find('.pet-value').text(value.c[0]);
            petTemplate.find('.pet-NFTCode').text(NFTCode);
            petTemplate.find('.pet-Collector').text(account);
            var date = new Date(timestamp * 1000); // 假设时间戳是以秒为单位
            var formattedDate = date.getFullYear() + '.' + 
                            String(date.getMonth() + 1).padStart(2, '0') + '.' + 
                            String(date.getDate()).padStart(2, '0') + ' ' + 
                            String(date.getHours()).padStart(2, '0') + ':' + 
                            String(date.getMinutes()).padStart(2, '0') + ':' + 
                            String(date.getSeconds()).padStart(2, '0'); // 添加小时、分钟和秒
            petTemplate.find('.pet-timestamp').text(formattedDate);
            petTemplate.find('.btn-adopt').hide();
            petTemplate.find('.btn-sell').attr('data-id', tokenId.c[0]).text("Sell").attr("disabled", false).show();
            console.log("tokenId",tokenId.c[0]);

            petsRow.append(petTemplate.html());
          }
        });
      }
    });
  },
  handlePurchase: function (event) {
    event.preventDefault();
    var nftId1 = parseInt($(this).data('id'));
    var nftValue1 = parseInt($(this).data('value'));
    // var petId1 = parseInt($(event.target).data('id'));
    // var petValue1 = parseInt($(event.target).data('value'));
    // console.log("petId1 ", petId1)
    // console.log("petValue1 ", petValue1)
    var NFTInstance;

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
      var account = currentAccount[0];

      App.contracts.DigitalCollectibleContract.deployed().then(function (instance) {
        NFTInstance = instance;

        // Execute adopt as a transaction by sending account
        if (event.target.textContent === "Sell") {
          return NFTInstance.buySellNFT(nftId1, { from: account, value: web3.toWei(nftValue1.toString(), 'ether') });
        }
        else{
          return NFTInstance.NFTPurchase(nftId1, { from: account, value: web3.toWei(nftValue1.toString(), 'ether') });
          //return NFTInstance.adoptPet(petId1, { from: account, value: web3.toWei(petValue1.toString(), 'ether') });
        }
      }).then(function (result) {
        return App.markPurchased();
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  },
  handleAdd: async function () {
    var nftName = prompt("Enter nft's (name,value,description):");
    var a = nftName.split(';');
    var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var account = currentAccount[0];
    if (a.length != 3) {
      alert("Please enter all the details");
      return;
    }
    if (nftName) {
      App.contracts.DigitalCollectibleContract.deployed().then(async function (instance) {
        return await instance.addNFTs(a[0], parseInt(a[1]), a[2], { from: account });
      }).then(function (result) {
        App.displayOwnedNFTs();
      }).catch(function (err) {
        console.log(err.message);
      });
    }
    // console.log("adopted")
    window.location.reload();
  },
  handleSell: async function (event) {
    var nftName = $(event.target).data('id');
    console.log("nftName ", nftName);
    var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var account = currentAccount[0];
    // if (nftName) {
      App.contracts.DigitalCollectibleContract.deployed().then(async function (instance) {
        return await instance.sellNFTs_new(parseInt(nftName), { from: account });
      }).then(function (result) {
        console.log("result ", result);
        App.displayOwnedNFTs();
      }).catch(function (err) {
        console.log(err.message);
      });
    // }
    console.log("selled")
  }
};


$(function () {
  $(window).load(function () {
    App.init();
  });
});
