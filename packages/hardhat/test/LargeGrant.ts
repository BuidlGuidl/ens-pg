import { describe, it } from "mocha";
import { LargeGrant, TestToken } from "../typechain-types";
import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

describe("LargeGrant", async () => {
  let largeGrant: LargeGrant;
  let testToken: TestToken;
  let deployer: SignerWithAddress;
  let steward2: SignerWithAddress;
  let builder: SignerWithAddress;
  let nonSteward: SignerWithAddress;
  let accounts: SignerWithAddress[];
  const initialFund = ethers.parseEther("1000");

  beforeEach(async () => {
    await deployments.fixture(["Stream"]);
    accounts = await ethers.getSigners();
    [deployer, steward2, builder, nonSteward] = accounts;

    // Deploy TestToken
    const TestTokenFactory = await ethers.getContractFactory("TestToken");
    testToken = await TestTokenFactory.deploy();
    await testToken.waitForDeployment();
    const tokenAddress = await testToken.getAddress();

    // Deploy with multiple initial stewards
    const LargeGrantFactory = await ethers.getContractFactory("LargeGrant");
    largeGrant = await LargeGrantFactory.deploy(tokenAddress, [deployer.address, steward2.address]);
    await largeGrant.waitForDeployment();

    const contractAddress = await largeGrant.getAddress();
    await testToken.mint(contractAddress, initialFund);

    await largeGrant.addGrant(builder.address, 1, [1, 10, 100]);
  });

  it("Should add grant correctly", async () => {
    const builderAddress = await largeGrant.grants(1);
    expect(builderAddress).to.equal(builder.address);

    const grantData = await largeGrant.grantData(1);
    expect(grantData.builder).to.equal(builder.address);
    expect(grantData.milestones.length).to.equal(3);
    expect(grantData.milestones[0].stageNumber).to.equal(1);
    expect(grantData.milestones[0].number).to.equal(1);
    expect(grantData.milestones[0].amount).to.equal(1);
    expect(grantData.milestones[0].completed).to.equal(false);
    expect(grantData.milestones[1].stageNumber).to.equal(1);
    expect(grantData.milestones[1].number).to.equal(2);
    expect(grantData.milestones[1].amount).to.equal(10);
    expect(grantData.milestones[1].completed).to.equal(false);
    expect(grantData.milestones[2].stageNumber).to.equal(1);
    expect(grantData.milestones[2].number).to.equal(3);
    expect(grantData.milestones[2].amount).to.equal(100);
    expect(grantData.milestones[2].completed).to.equal(false);
  });

  it("Should allow to add a new grant correctly", async () => {
    await largeGrant.addGrant(builder.address, 2, [100, 1000]);

    const builderAddress = await largeGrant.grants(2);
    expect(builderAddress).to.equal(builder.address);
  });

  it("Should not allow to add a new grant with the same number", async () => {
    await expect(largeGrant.addGrant(builder.address, 1, [100, 1000])).to.be.reverted;
  });

  it("Should not allow to add a new grant with the builder zero address", async () => {
    await expect(largeGrant.addGrant(ethers.ZeroAddress, 2, [100, 1000])).to.be.reverted;
  });

  it("Should not allow to add a new grant with a milestone with a zero amount", async () => {
    await expect(largeGrant.addGrant(builder.address, 2, [100, 0])).to.be.reverted;
  });

  it("Should not allow to add a new grant with no milestones", async () => {
    await expect(largeGrant.addGrant(builder.address, 2, [])).to.be.reverted;
  });

  it("Should allow to add a new grant stage correctly", async () => {
    await largeGrant.addGrantStage(1, [200, 2000]);

    const grantData = await largeGrant.grantData(1);
    expect(grantData.builder).to.equal(builder.address);
    expect(grantData.milestones.length).to.equal(5);
    expect(grantData.milestones[0].stageNumber).to.equal(1);
    expect(grantData.milestones[0].number).to.equal(1);
    expect(grantData.milestones[0].amount).to.equal(1);
    expect(grantData.milestones[0].completed).to.equal(false);
    expect(grantData.milestones[1].stageNumber).to.equal(1);
    expect(grantData.milestones[1].number).to.equal(2);
    expect(grantData.milestones[1].amount).to.equal(10);
    expect(grantData.milestones[1].completed).to.equal(false);
    expect(grantData.milestones[2].stageNumber).to.equal(1);
    expect(grantData.milestones[2].number).to.equal(3);
    expect(grantData.milestones[2].amount).to.equal(100);
    expect(grantData.milestones[2].completed).to.equal(false);
    expect(grantData.milestones[3].stageNumber).to.equal(2);
    expect(grantData.milestones[3].number).to.equal(1);
    expect(grantData.milestones[3].amount).to.equal(200);
    expect(grantData.milestones[3].completed).to.equal(false);
    expect(grantData.milestones[4].stageNumber).to.equal(2);
    expect(grantData.milestones[4].number).to.equal(2);
    expect(grantData.milestones[4].amount).to.equal(2000);
    expect(grantData.milestones[4].completed).to.equal(false);
  });

  it("Should allow to approve a milestone correctly", async () => {
    await largeGrant.approveMilestone(1, 1, 1);

    const grantDataAfterApproval = await largeGrant.grantData(1);
    expect(grantDataAfterApproval.milestones[0].completed).to.equal(false);
    expect(grantDataAfterApproval.milestones[0].approvedBy).to.equal(deployer.address);
    expect(grantDataAfterApproval.milestones[0].completedBy).to.equal(ethers.ZeroAddress);
  });

  it("Should allow to complete a milestone correctly", async () => {
    const initialBalance = await testToken.balanceOf(builder.address);

    await largeGrant.approveMilestone(1, 1, 1);

    const grantDataAfterApproval = await largeGrant.grantData(1);
    expect(grantDataAfterApproval.milestones[0].completed).to.equal(false);
    expect(grantDataAfterApproval.milestones[0].approvedBy).to.equal(deployer.address);
    expect(grantDataAfterApproval.milestones[0].completedBy).to.equal(ethers.ZeroAddress);

    const newBalanceAfterApproval = await testToken.balanceOf(builder.address);
    expect(newBalanceAfterApproval).to.equal(initialBalance);

    await largeGrant.connect(steward2).completeMilestone(1, 1, 1, "Description", "Proof");

    const grantData = await largeGrant.grantData(1);
    expect(grantData.milestones[0].completed).to.equal(true);
    expect(grantData.milestones[0].approvedBy).to.equal(deployer.address);
    expect(grantData.milestones[0].completedBy).to.equal(steward2.address);

    const newBalance = await testToken.balanceOf(builder.address);
    expect(newBalance).to.equal(initialBalance + 1n);
  });

  it("Should not allow to complete a milestone if the sender is the same as the approver", async () => {
    await largeGrant.approveMilestone(1, 1, 1);

    await expect(largeGrant.completeMilestone(1, 1, 1, "Description", "Proof")).to.be.reverted;
  });

  it("Should not allow to complete a milestone if it's not approved yet", async () => {
    await expect(largeGrant.completeMilestone(1, 1, 1, "Description", "Proof")).to.be.reverted;
  });

  it("Should not allow to complete a milestone with wrong grant number", async () => {
    await expect(largeGrant.completeMilestone(2, 1, 1, "Description", "Proof")).to.be.reverted;
  });

  it("Should not allow to complete a milestone with wrong stage number", async () => {
    await expect(largeGrant.completeMilestone(1, 2, 1, "Description", "Proof")).to.be.reverted;
  });

  it("Should not allow to complete a milestone with zero as stage number", async () => {
    await expect(largeGrant.completeMilestone(1, 0, 1, "Description", "Proof")).to.be.reverted;
  });

  it("Should not allow to complete a milestone with wrong milestone number", async () => {
    await expect(largeGrant.completeMilestone(1, 1, 4, "Description", "Proof")).to.be.reverted;
  });

  it("Should not allow to complete a milestone twice", async () => {
    await largeGrant.approveMilestone(1, 1, 1);

    await largeGrant.connect(steward2).completeMilestone(1, 1, 1, "Description", "Proof");

    await expect(largeGrant.connect(steward2).completeMilestone(1, 1, 1, "Description", "Proof")).to.be.reverted;
  });

  // Admin actions
  it("Should allow the admin to add a new steward", async function () {
    const newSteward = accounts[5];
    await expect(largeGrant.connect(deployer).addSteward(newSteward.address))
      .to.emit(largeGrant, "RoleGranted")
      .withArgs(ethers.keccak256(ethers.toUtf8Bytes("STEWARD_ROLE")), newSteward.address, deployer.address);

    // Check if the new steward can perform steward actions
    await expect(largeGrant.connect(newSteward).addGrant(accounts[6].address, 2, [1, 10])).to.not.be.reverted;
  });

  it("Should allow the admin to remove a steward", async function () {
    await expect(largeGrant.connect(deployer).removeSteward(steward2.address))
      .to.emit(largeGrant, "RoleRevoked")
      .withArgs(ethers.keccak256(ethers.toUtf8Bytes("STEWARD_ROLE")), steward2.address, deployer.address);

    // Check if the removed steward can no longer perform steward actions
    await expect(largeGrant.connect(steward2).addGrant(accounts[5].address, 2, [1, 10])).to.be.reverted;
  });

  it("Should allow the admin to transfer admin", async function () {
    await expect(largeGrant.connect(deployer).transferAdmin(steward2.address)).to.not.be.reverted;

    // Check if the old admin can no longer perform admin actions
    await expect(largeGrant.connect(deployer).addSteward(accounts[5].address)).to.be.reverted;

    // Check if the new admin can perform admin actions
    await expect(largeGrant.connect(steward2).addSteward(accounts[5].address)).to.not.be.reverted;
  });

  it("Should not allow not admin to transfer admin", async function () {
    await expect(largeGrant.connect(steward2).transferAdmin(accounts[5].address)).to.be.reverted;
  });

  it("Should allow the admin to pause and unpause the contract", async function () {
    await expect(largeGrant.connect(deployer).pause()).to.not.be.reverted;

    // Check if the contract is paused trying to approve a milestone
    await expect(largeGrant.connect(deployer).approveMilestone(1, 1, 1)).to.be.reverted;

    await expect(largeGrant.connect(deployer).unpause()).to.not.be.reverted;

    await expect(largeGrant.connect(deployer).approveMilestone(1, 1, 1)).to.not.be.reverted;

    await expect(largeGrant.connect(deployer).pause()).to.not.be.reverted;

    // Check if the contract is paused trying to complete a milestone
    await expect(largeGrant.connect(steward2).completeMilestone(1, 1, 1, "Description", "Proof")).to.be.reverted;

    await expect(largeGrant.connect(deployer).unpause()).to.not.be.reverted;

    await expect(largeGrant.connect(steward2).completeMilestone(1, 1, 1, "Description", "Proof")).to.not.be.reverted;
  });

  it("Should not allow not admin to pause the contract", async function () {
    await expect(largeGrant.connect(steward2).pause()).to.be.reverted;
  });

  it("Should not allow not admin to unpause the contract", async function () {
    await expect(largeGrant.connect(deployer).pause()).to.not.be.reverted;

    await expect(largeGrant.connect(steward2).unpause()).to.be.reverted;
  });

  it("Should allow admin to change builder address", async function () {
    await largeGrant.connect(deployer).changeBuilderAddress(1, accounts[5].address);
    const builderAddress = await largeGrant.grants(1);
    expect(builderAddress).to.equal(accounts[5].address);
  });

  it("Should not allow admin to change builder address on a not existing grant", async function () {
    await expect(largeGrant.connect(deployer).changeBuilderAddress(999, accounts[5].address)).to.be.reverted;
  });

  it("Should not allow admin to change builder address to zero address", async function () {
    await expect(largeGrant.connect(deployer).changeBuilderAddress(1, ethers.ZeroAddress)).to.be.reverted;
  });

  it("Should not allow not admin to change builder address", async function () {
    await expect(largeGrant.connect(steward2).changeBuilderAddress(1, accounts[5].address)).to.be.reverted;
  });

  // Stewards actions
  it("Should not allow a steward to add or remove stewards", async function () {
    await expect(largeGrant.connect(steward2).addSteward(accounts[5].address)).to.be.reverted;

    await expect(largeGrant.connect(steward2).removeSteward(deployer.address)).to.be.reverted;
  });

  it("Should not allow non-stewards to add or remove stewards", async function () {
    await expect(largeGrant.connect(builder).addSteward(accounts[5].address)).to.be.reverted;

    await expect(largeGrant.connect(builder).removeSteward(steward2.address)).to.be.reverted;
  });

  it("Should not allow non-stewards to create a grant", async function () {
    await expect(largeGrant.connect(nonSteward).addGrant(accounts[5].address, 2, [1, 10])).to.be.reverted;
  });

  it("Should not allow non-stewards to create a stage", async function () {
    await expect(largeGrant.connect(nonSteward).addGrantStage(1, [1, 10])).to.be.reverted;
  });

  it("Should not allow non-stewards to approve a milestone", async function () {
    await expect(largeGrant.connect(nonSteward).approveMilestone(1, 1, 1)).to.be.reverted;
  });

  it("Should not allow non-stewards to complete a milestone", async function () {
    await expect(largeGrant.connect(nonSteward).completeMilestone(1, 1, 1, "Description", "Proof")).to.be.reverted;
  });
});
