const { expect } = require("chai");
const { ethers } = require("hardhat");
var nftContract;

describe("Test721", function(){
  it("Mint NFTs", async function() {
    const [signer, ownerA, ownerB] = await ethers.getSigners();  

    const nftFactory = await ethers.getContractFactory("Test721");
    nftContract = await nftFactory.deploy();
    await nftContract.deployed();

    for(let i = 1; i < 5; i++) { 
      const responseA = await nftContract.mint(ownerA.address);
      const receiptA = await responseA.wait();
      const [transferEventA] = receiptA.events; 
      expect(transferEventA.args.tokenId.toNumber()).to.equal(i);
    }
    for(let i = 5; i < 10; i++) { 
      const responseB = await nftContract.mint(ownerB.address);
      const receiptB = await responseB.wait();
      const [transferEventB] = receiptB.events; 
      expect(transferEventB.args.tokenId.toNumber()).to.equal(i);
    }
  });
});

describe("ERC721Exchange", function () {
  let exContract;
  let signer, ownerA, ownerB, ownerC;

  it("Compile and approve nft contract", async function () {
    [signer, ownerA, ownerB, ownerC] = await ethers.getSigners();  
    console.log("signer: " + signer.address);
    console.log("ownerA: " + ownerA.address);
    console.log("ownerB: " + ownerB.address);
    console.log("ownerC: " + ownerC.address);

    const exFactory = await ethers.getContractFactory("ERC721Exchange");
    exContract = await exFactory.deploy();
    await exContract.deployed();

    const txApproveA = await nftContract.connect(ownerA).setApprovalForAll(exContract.address, true);
    const rcApproveA = await txApproveA.wait();
    const [evApproveA] = rcApproveA.events;  
    expect(evApproveA.args.approved).to.equal(true);

    const txApproveB = await nftContract.connect(ownerB).setApprovalForAll(exContract.address, true);
    const rcApproveB = await txApproveB.wait();
    const [evApproveB] = rcApproveB.events;  
    expect(evApproveB.args.approved).to.equal(true);

    const txApproveC = await nftContract.connect(ownerC).setApprovalForAll(exContract.address, true);
    const rcApproveC = await txApproveC.wait();
    const [evApproveC] = rcApproveC.events;  
    expect(evApproveC.args.approved).to.equal(true);
  });

  it("Register a new exchange and get exchange data", async function () {
    
    const txRegister = await exContract.register(ownerA.address, [nftContract.address, nftContract.address], [1, 2], ownerB.address, [nftContract.address, nftContract.address], [5, 6]);
    const reRegister = await txRegister.wait();
    const [evRegister] = reRegister.events;  
    expect(evRegister.args.exchangeId.toNumber()).to.equal(1);

    const txGetExchanges = await exContract.connect(ownerA.address).getExchanges();
    const exId = txGetExchanges[0].toNumber();
    expect(exId).to.equal(1);

    const txGetExchange = await exContract.connect(ownerA.address).getExchange(exId);
    expect(txGetExchange.OwnerA).to.equal(ownerA.address);
    expect(txGetExchange.NFTContractA[0]).to.equal(nftContract.address);
    expect(txGetExchange.tokenIdsA[0].toNumber()).to.equal(1);
    expect(txGetExchange.OwnerB).to.equal(ownerB.address); 
    expect(txGetExchange.NFTContractB[0]).to.equal(nftContract.address);
    expect(txGetExchange.tokenIdsB[0].toNumber()).to.equal(5); 
  });

  it("Cancel an exchange", async function () {

    const txRegister = await exContract.register(ownerA.address, [nftContract.address], [1], ownerB.address, [nftContract.address], [5]);
    const reRegister = await txRegister.wait();
    const [evRegister] = reRegister.events;   
    const exId = evRegister.args.exchangeId.toNumber();

    try{
      const txCancelC = await exContract.connect(ownerC.address).cancel(exId);
      expect(false).to.equal(true);
      console.log("Cancel an exchange by non-owner should fail");
    }catch(e){ 
    }
    
    const txCancel = await exContract.connect(ownerA).cancel(exId);
    const reCancel = await txCancel.wait();

    const txGetExchange = await exContract.connect(ownerA.address).getExchange(exId);
    expect(txGetExchange.StateA).to.equal(3); 
    expect(txGetExchange.StateB).to.equal(3); 
  });

  
  it("Deposit NFT", async function () {
 
    const txRegister = await exContract.connect(ownerA).register(ownerA.address, [nftContract.address], [3], ownerB.address, [nftContract.address], [8]);
    const reRegister = await txRegister.wait();
    const [evRegister] = reRegister.events;   
    const exId = evRegister.args.exchangeId.toNumber();
 
    /*
    const txDepositA = await exContract.connect(ownerA).deposit(exId, [nftContract.address], [3]);
    const reDepositA = await txDepositA.wait();
    console.log(reDepositA);
    */
    const txDepositB = await exContract.connect(ownerB).deposit(exId, [nftContract.address], [8]);
    const reDepositB = await txDepositB.wait();
    console.log(reDepositB);
  /*
    try{
      const txCancelC = await exContract.connect(ownerC.address).cancel(exId);
      expect(false).to.equal(true);
      console.log("Cancel an exchange by non-owner should fail");
    }catch(e){ 
    }
    
    const txCancel = await exContract.connect(ownerA).cancel(exId);
    const reCancel = await txCancel.wait();

    const txGetExchange = await exContract.connect(ownerA.address).getExchange(exId);
    expect(txGetExchange.StateA).to.equal(3); 
    expect(txGetExchange.StateB).to.equal(3); */
  });

  
});
