import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  let tokenAddress = "0x0b2c639c533813f4aa9d7837caf62653d097ff85"; // Optimism USDC

  if (hre.network.name === "localhost") {
    const testToken = await hre.ethers.getContract<Contract>("TestToken", deployer);
    tokenAddress = await testToken.getAddress();
  }

  await deploy("LargeGrant", {
    from: deployer,
    args: [
      tokenAddress,
      [
        "0x55b9CB0bCf56057010b9c471e7D42d60e1111EEa",
        "0x60583563D5879C2E59973E5718c7DE2147971807",
        "0xb8224dfCf3C174331a8e6a841AEEa7dF321f6D8E",
        "0xB4F53bd85c00EF22946d24Ae26BC38Ac64F5E7B1",
      ],
    ],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["LargeGrant"];
