App = {
  web3Provider: null,
  contracts: {},
  picture: "",
  init: async function () {
    // Load nfts.
    $.getJSON('../collectibles.json', function (data) {
      var NFTsRow = $('#NFTsRow');
      var NFTTemplate = $('#NFTTemplate');
      for (i = 0; i < data.length; i++) {
        NFTTemplate.find('.panel-title').text(data[i].name);
        NFTTemplate.find('img').attr('src', data[i].picture);
        NFTTemplate.find('.NFT-timestamp').text(data[i].timestamp);
        NFTTemplate.find('.NFT-value').text(data[i].value);
        NFTTemplate.find('.NFT-NFTCode').text(data[i].NFTCode);
        NFTTemplate.find('.NFT-description').text(data[i].description);
        NFTTemplate.find('.btn-purchase').attr('data-id', data[i].id);
        NFTTemplate.find('.btn-purchase').attr('data-value', data[i].value);
        NFTTemplate.find('.btn-sell').attr('data-id', data[i].id);
        NFTTemplate.find('.btn-sell').attr('data-value', data[i].value);
        // console.log("id",data[i].id);
        // console.log("value",data[i].value);
        NFTsRow.append(NFTTemplate.html());
      }
    });
    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // 请求账户访问
        await window.ethereum.enable();
        // 获取账户
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.account = accounts[0]; // 存储账户
      } catch (error) {
        // 用户拒绝账户访问...
        console.error("User denied account access");
      }
    }
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.error(error);
      }
      App.account = accounts[0];
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
      var NFTArtifact = data;
      App.contracts.DigitalCollectibleContract = TruffleContract(NFTArtifact);
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
      return App.markPurchased();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-purchase', App.handlePurchase);
    $(document).on('click', '.btn-add', App.handleAdd);
    $(document).on('click', '.btn-sell', App.handleSell);
  },

  markPurchased: function () {
    var NFTInstance;
    NFTsRow = $('#NFTsRow')
    NFTsRow.html('');
    App.contracts.DigitalCollectibleContract.deployed().then(async function (instance) {
      NFTInstance = instance;
      return NFTInstance.getCount.call();
    }).then(async function (count) {
      for (var i = 1; i <= count.c[0]; i++) {
        await NFTInstance.getAllNFTs.call(i).then(function (nft) {
          const [name, description, value, sale, image, NFTCode, timestamp] = [nft[0], nft[1], nft[2], nft[3], nft[4], nft[5], nft[6], nft[7]];
          var NFTTemplate = $('#NFTTemplate');
          NFTTemplate.find('.panel-title').text(name);
          NFTTemplate.find('img').attr('src', image);
          NFTTemplate.find('.NFT-description').text(description);
          NFTTemplate.find('.NFT-value').text(value.c[0]);
          NFTTemplate.find('.NFT-NFTCode').text(NFTCode);
          var date = new Date(timestamp * 1000);
          var formattedDate = date.getFullYear() + '.' + 
                            String(date.getMonth() + 1).padStart(2, '0') + '.' + 
                            String(date.getDate()).padStart(2, '0') + ' ' + 
                            String(date.getHours()).padStart(2, '0') + ':' + 
                            String(date.getMinutes()).padStart(2, '0') + ':' + 
                            String(date.getSeconds()).padStart(2, '0');
          NFTTemplate.find('.NFT-timestamp').text(formattedDate);
          NFTTemplate.find('.NFT-Collector').text(App.account);
          if (NFTCode == 0 || timestamp == 0) {
            NFTTemplate.find('.NFT-NFTCode').text("None");
            NFTTemplate.find('.NFT-Collector').text("None");
            NFTTemplate.find('.NFT-timestamp').text("None");
          }
          NFTTemplate.find('.btn-purchase').attr('data-id', i)
          if (sale) {
            NFTTemplate.find('.btn-purchase').text("出售").attr("disabled", false);
          }
          else if (NFTCode != 0) {
            NFTTemplate.find('.btn-purchase').text("已售出").attr("disabled", true);
          }
          else {
            NFTTemplate.find('.btn-purchase').text("购买").attr("disabled", false);
          }
          NFTsRow.append(NFTTemplate.html());
        });
      }
    }).catch(function (err) {
      console.log(err.message);
    });
    App.displayOwnedNFTs();
  },
  displayOwnedNFTs: async function () {
    var NFTInstance;
    var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var account = currentAccount[0];
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
    }).then(async function (tokensList) {
      var NFTsRow = $('#purchasedNFTsRow');
      var NFTT = $('#NFTTemplate');
      NFTsRow.html('');
      for (var i = 0; i < tokensList.length; i++) {
        const tokenId = tokensList[i]
        await NFTInstance.getNFTsByOwner(tokenId.c[0]).then(function (nft) {
          const [name, description, value, sale, image, NFTCode, timestamp] = [nft[0], nft[1], nft[2], nft[3], nft[4], nft[5], nft[6], nft[7]];
          if (sale === false) {
            var NFTTemplate = NFTT.clone();
            NFTTemplate.find('.panel-title').text(name);
            NFTTemplate.find('img').attr('src', image);
            NFTTemplate.find('.NFT-description').text(description);
            NFTTemplate.find('.NFT-value').text(value.c[0]);
            NFTTemplate.find('.NFT-NFTCode').text(NFTCode);
            NFTTemplate.find('.NFT-Collector').text(account);
            var date = new Date(timestamp * 1000); // 假设时间戳是以秒为单位
            var formattedDate = date.getFullYear() + '.' + 
                            String(date.getMonth() + 1).padStart(2, '0') + '.' + 
                            String(date.getDate()).padStart(2, '0') + ' ' + 
                            String(date.getHours()).padStart(2, '0') + ':' + 
                            String(date.getMinutes()).padStart(2, '0') + ':' + 
                            String(date.getSeconds()).padStart(2, '0'); // 添加小时、分钟和秒
            NFTTemplate.find('.NFT-timestamp').text(formattedDate);
            NFTTemplate.find('.btn-purchase').hide();
            NFTTemplate.find('.btn-sell').attr('data-id', tokenId.c[0]).text("出售").attr("disabled", false).show();
            console.log("tokenId",tokenId.c[0]);

            NFTsRow.append(NFTTemplate.html());
          }
        });
      }
    });
  },
  handlePurchase: function (event) {
    event.preventDefault();
    var nftId1 = parseInt($(this).data('id'));
    var nftValue1 = parseInt($(this).data('value'));
    var NFTInstance;
    web3.eth.getAccounts(async function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
      var account = currentAccount[0];
      App.contracts.DigitalCollectibleContract.deployed().then(function (instance) {
        NFTInstance = instance;
        if (event.target.textContent === "出售") {
          return NFTInstance.buySellNFT(nftId1, { from: account, value: web3.toWei(nftValue1.toString(), 'ether') });
        }
        else{
          return NFTInstance.NFTPurchase(nftId1, { from: account, value: web3.toWei(nftValue1.toString(), 'ether') });
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
        console.log("count ", instance.getCount());
      }).catch(function (err) {
        console.log(err.message);
      });
    }
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
