var DigitalCollectibleContract = artifacts.require("DigitalCollectibleContract");

module.exports = function(deployer) {
  deployer.deploy(DigitalCollectibleContract);
};