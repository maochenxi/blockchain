App = {
  web3Provider: null,
  contracts: {},
  picture: "",
  init: async function () {
    // Load pets.
    $.getJSON('../pets.json', function (data) {
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

    $.getJSON('Adoption.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
      App.contracts.Adoption.deployed().then(function (instance) {
        var adoptionInstance = instance;
        adoptionInstance.PetAdopted({}, { fromBlock: 'latest' }).watch(function (error, event) {
          console.log(event)
          if (!error) {
            var petId = event.args.petId;
            var newOwner = event.args.newOwner;
            Toastify({
              text: 'Pet Adopted - Pet ID: ' + petId + ', New Owner: ' + newOwner,
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

      // 监听 PetSold 事件
      App.contracts.Adoption.deployed().then(function (instance) {
        var adoptionInstance = instance;
        adoptionInstance.PetSold({}, {  fromBlock: 'latest' }).watch(function (error, event) {
          if (!error) {
            var petId = event.args.petId;
            var newOwner = event.args.newOwner;
            Toastify({
              text: 'Pet Sold - Pet ID: ' + petId + ', New Owner: ' + newOwner,
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

      // 监听 PetAdded 事件
      App.contracts.Adoption.deployed().then(function (instance) {
        var adoptionInstance = instance;
        adoptionInstance.PetAdded({}, { fromBlock: 'latest' }).watch(function (error, event) {
          if (!error) {
            var petId = event.args.petId;
            var name = event.args.name;
            var owner = event.args.owner;
            Toastify({
              text: 'Pet Added - Pet ID: ' + petId + ', Name: ' + name + ', Owner: ' + owner,
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
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-add', App.handleAdd);
    $(document).on('click', '.btn-sell', App.handleSell);
  },

  markAdopted: function () {
    console.log("enter");
    var adoptionInstance;
    petsRow = $('#petsRow')
    petsRow.html('');
    App.contracts.Adoption.deployed().then(async function (instance) {
      adoptionInstance = instance;
      return adoptionInstance.getCount.call();
    }).then(async function (count) {
      for (var i = 1; i <= count.c[0]; i++) {
        await adoptionInstance.getAllPets.call(i).then(function (pet) {
          const [name, description, value, sale, image, NFTCode, timestamp] = [pet[0], pet[1], pet[2], pet[3], pet[4], pet[5], pet[6], pet[7]];
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
    App.displayOwnedPets();
  },
  displayOwnedPets: async function () {
    // console.log("displayOwnedPets");
    var adoptionInstance;

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
    App.contracts.Adoption.deployed().then(async function (instance) {
      adoptionInstance = instance;

      var tokensList = await adoptionInstance.getOwnedTokens(account);
      
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
        await adoptionInstance.getPetsByOwner_nft(tokenId.c[0]).then(function (pet) {
          // console.log("log owned pets");
          const [name, description, value, sale, image, NFTCode, timestamp] = [pet[0], pet[1], pet[2], pet[3], pet[4], pet[5], pet[6], pet[7]];
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
  handleAdopt: function (event) {
    event.preventDefault();
    var petId1 = parseInt($(this).data('id'));
    var petValue1 = parseInt($(this).data('value'));
    // var petId1 = parseInt($(event.target).data('id'));
    // var petValue1 = parseInt($(event.target).data('value'));
    // console.log("petId1 ", petId1)
    // console.log("petValue1 ", petValue1)
    var adoptionInstance;

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
      var account = currentAccount[0];

      App.contracts.Adoption.deployed().then(function (instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        if (event.target.textContent === "Sell") {
          return adoptionInstance.butsell(petId1, { from: account, value: web3.toWei(petValue1.toString(), 'ether') });
        }
        else{
          return adoptionInstance.adoptPet(petId1, { from: account, value: web3.toWei(petValue1.toString(), 'ether') });
          //return adoptionInstance.adoptPet(petId1, { from: account, value: web3.toWei(petValue1.toString(), 'ether') });
        }
      }).then(function (result) {
        return App.markAdopted();
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  },
  handleAdd: async function () {
    var petName = prompt("Enter pet's (name,value,description):");
    var a = petName.split(';');
    var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var account = currentAccount[0];
    if (a.length != 3) {
      alert("Please enter all the details");
      return;
    }
    if (petName) {
      App.contracts.Adoption.deployed().then(async function (instance) {
        return await instance.addPet(a[0], parseInt(a[1]), a[2], { from: account });
      }).then(function (result) {
        App.displayOwnedPets();
      }).catch(function (err) {
        console.log(err.message);
      });
    }
    // console.log("adopted")
    window.location.reload();
  },
  handleSell: async function (event) {
    var petName = $(event.target).data('id');
    console.log("petName ", petName);
    var currentAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var account = currentAccount[0];
    // if (petName) {
      App.contracts.Adoption.deployed().then(async function (instance) {
        return await instance.sellPet_new(parseInt(petName), { from: account });
      }).then(function (result) {
        console.log("result ", result);
        App.displayOwnedPets();
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
