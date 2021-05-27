const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SarROToken', function () {
  const NAME = 'SarROToken';
  const SYMBOL = 'SROT';
  const TOTAL_SUPPLY = ethers.utils.parseEther('945');
  const ZERO_ADDRESS = ethers.constants.AddressZero;
  let SarROToken, sarROToken, dev, owner, alice, bob, charlie;

  beforeEach(async function () {
    [dev, owner, alice, bob, charlie] = await ethers.getSigners();
    SarROToken = await ethers.getContractFactory(NAME);
    sarROToken = await SarROToken.connect(dev).deploy(owner.address, TOTAL_SUPPLY);
    await sarROToken.deployed();
  });

  describe('Deployment', function () {
    it('Should has name SarROToken', async function () {
      expect(await sarROToken.name()).to.equal(NAME);
    });

    it('Should has symbol SROT', async function () {
      expect(await sarROToken.symbol()).to.equal(SYMBOL);
    });

    it('Should be owned by owner', async function () {
      expect(await sarROToken.owner()).to.equal(owner.address);
    });

    it('Should mint right amount of tokens to the owner', async function () {
      expect(await sarROToken.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
    });

    /* Spécial car dans le constructor */
    it('Should emits a Transfer event of the TotalSupply', async function () {
      expect(sarROToken.deployTransaction)
        .to.emit(sarROToken, 'Transfered')
        .withArgs(ZERO_ADDRESS, owner.address, TOTAL_SUPPLY);
    });
  });
  describe('Transfer', function () {
    let transaction;
    beforeEach(async function () {
      // TOTAL_SUPPLY => Owner to alice
      transaction = await sarROToken.connect(owner).transfer(alice.address, TOTAL_SUPPLY);
    });
    it('Should emits Transfer when tranfer token', async function () {
      expect(transaction).to.emit(sarROToken, 'Transfered').withArgs(owner.address, alice.address, TOTAL_SUPPLY);
    });

    it('Should decrease the balance of the sender', async function () {
      expect(await sarROToken.balanceOf(owner.address)).to.equal(0);
    });

    it('Should increase the recipient balance', async function () {
      expect(await sarROToken.balanceOf(alice.address)).to.equal(TOTAL_SUPPLY);
    });

    it('Should revert if balance is insuffisiant', async function () {
      await expect(sarROToken.connect(owner).transfer(alice.address, TOTAL_SUPPLY)).to.be.revertedWith(
        'SarROToken: Insuffisiant balance to tranfer funds.'
      );
    });

    it('Should revert if the recipient is address(0)', async function () {
      // Transfert depuis Alice
      await expect(sarROToken.connect(alice).transfer(ZERO_ADDRESS, TOTAL_SUPPLY)).to.be.revertedWith(
        'SarROToken: Cannot burn token'
      );
    });
  });

  describe('Allowances', function () {
    let allowed;

    beforeEach(async function () {
      allowed = await sarROToken.connect(owner).approve(charlie.address, TOTAL_SUPPLY.div(2));
    });

    it('Should emit an Approved event', async function () {
      expect(allowed).to.emit(sarROToken, 'Approved').withArgs(owner.address, charlie.address, TOTAL_SUPPLY.div(2));
    });

    it('Should increase the amount allowed', async function () {
      expect(await sarROToken.connect(charlie).allowance(owner.address)).to.equal(TOTAL_SUPPLY.div(2));
    });
  });

  describe('TransferFrom', function () {
    let transaction;
    beforeEach(async function () {
      // BOB transfert la balance de l'owner vers alice
      await sarROToken.connect(owner).approve(bob.address, TOTAL_SUPPLY.div(2));
      transaction = await sarROToken.connect(bob).transferFrom(owner.address, alice.address, TOTAL_SUPPLY.div(2));
    });

    it('Should emits Transfer when tranferFrom token', async function () {
      expect(transaction).to.emit(sarROToken, 'Transfered').withArgs(owner.address, alice.address, TOTAL_SUPPLY.div(2));
    });

    it('Should decrease the balance of the sender', async function () {
      expect(await sarROToken.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY.div(2));
    });

    it('Should increase the recipient balance', async function () {
      expect(await sarROToken.balanceOf(alice.address)).to.equal(TOTAL_SUPPLY.div(ethers.BigNumber.from('2')));
      // equivaut .div(2)
    });

    it('Should revert if sender have not enough allowances', async function () {
      await expect(sarROToken.connect(alice).transferFrom(owner.address, bob.address, TOTAL_SUPPLY.div(10))).to.be
        .reverted;
    });

    it('Should revert if balance is insuffisiant', async function () {
      // charlie (balance 0) approuve bob
      await sarROToken.connect(charlie).approve(bob.address, TOTAL_SUPPLY.div(2));
      await expect(
        sarROToken.connect(bob).transferFrom(charlie.address, alice.address, TOTAL_SUPPLY.div(2))
      ).to.be.revertedWith('SarROToken: Insuffisiant balance to tranfer funds.');
    });

    it('Should revert if the recipient is address(0)', async function () {
      // alice (balance TOT/2) appove bob
      await sarROToken.connect(alice).approve(bob.address, TOTAL_SUPPLY.div(2));
      await expect(
        sarROToken.connect(bob).transferFrom(alice.address, ZERO_ADDRESS, TOTAL_SUPPLY.div(2))
      ).to.be.revertedWith('SarROToken: Cannot burn token');
    });
  });

  describe('Mint token', function () {
    let mintage;
    beforeEach(async function () {
      mintage = await sarROToken.connect(owner).mint(TOTAL_SUPPLY);
    });

    it('Should emit Minted event', async function () {
      expect(mintage).to.emit(sarROToken, 'Minted').withArgs(TOTAL_SUPPLY);
    });

    it('Should increase the total supply', async function () {
      expect(await sarROToken.totalSupply()).to.equal(TOTAL_SUPPLY.mul(2));
      // .above(TOTAL_SUPPLY)
    });

    it('Should revert if the sender is not the owner', async function () {
      await expect(sarROToken.connect(bob).mint(TOTAL_SUPPLY)).to.be.revertedWith(
        'SarROToken: you are not allowed to use this function.'
      );
    });
  });
});
