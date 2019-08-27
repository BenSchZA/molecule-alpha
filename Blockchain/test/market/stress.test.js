const { 
    PseudoDaiTokenAbi,
    MoleculeVaultAbi, 
    MarketRegistryAbi, 
    CurveRegistryAbi, 
    CurveFunctionsAbi, 
    MarketFactoryAbi, 
    ethers, 
    etherlime, 
    daiSettings,
    moleculeVaultSettings,
    marketSettings,
    MarketAbi,
    VaultAbi,
    defaultDaiPurchase,
    defaultTokenVolume,
    purchasingSequences
 } = require("../testing.settings.js");

let marketSettingsStress = {
    fundingGoals: [
        ethers.utils.parseUnits("5000000", 18),
    ],
    phaseDuration: [
        ethers.utils.parseUnits("12", 0),
    ],
    curveType: ethers.utils.parseUnits("0", 0),
    taxationRate: ethers.utils.parseUnits("15", 0)
}

describe('Market test', async () => {
    let molAdmin = accounts[1];
    let creator = accounts[2];
    let user1 = accounts[3];
    let user2 = accounts[4];
    let admin2 = accounts[5];
    let pseudoDaiInstance, moleculeVaultInstance, curveRegistryInstance, marketRegistryInstance, marketFactoryInstance, curveIntegralInstance;

    let marketInstance, vaultInstance;

    beforeEach('', async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(molAdmin.secretKey);

        pseudoDaiInstance = await deployer.deploy(
            PseudoDaiTokenAbi, 
            false, 
            daiSettings.name, 
            daiSettings.symbol, 
            daiSettings.decimals
        );

        moleculeVaultInstance = await deployer.deploy(
            MoleculeVaultAbi,
            false,
            pseudoDaiInstance.contract.address,
            moleculeVaultSettings.taxationRate
        );

        marketRegistryInstance = await deployer.deploy(
            MarketRegistryAbi,
            false,
        );

        curveRegistryInstance = await deployer.deploy(
            CurveRegistryAbi,
            false
        );

        curveIntegralInstance = await deployer.deploy(
            CurveFunctionsAbi,
            false
        );

        await( await curveRegistryInstance.from(molAdmin).registerCurve(
            curveIntegralInstance.contract.address,
            "linear: (1/20000)*x + 0.5"
        )).wait();

        marketFactoryInstance = await deployer.deploy(
            MarketFactoryAbi,
            false,
            pseudoDaiInstance.contract.address,
            moleculeVaultInstance.contract.address,
            marketRegistryInstance.contract.address,
            curveRegistryInstance.contract.address
        );

        await (await marketRegistryInstance.from(molAdmin).addMarketDeployer(marketFactoryInstance.contract.address, "Initial factory")).wait()

        // Creating a market
        await (await marketFactoryInstance.from(molAdmin).deployMarket(
            marketSettingsStress.fundingGoals,
            marketSettingsStress.phaseDuration,
            creator.signer.address,
            marketSettingsStress.curveType,
            marketSettingsStress.taxationRate
        )).wait()

        const firstMarketDataObj = await marketRegistryInstance.from(creator).getMarket(0);
        
        marketInstance = await etherlime.ContractAt(MarketAbi, firstMarketDataObj[0]);
        vaultInstance = await etherlime.ContractAt(VaultAbi, firstMarketDataObj[1]);

        
        // Setting up dai
        for(let i = 0; i < 10; i++){
            // Getting tokens
            await (await pseudoDaiInstance.from(accounts[i]).mint());
            // Setting approval
            await (await pseudoDaiInstance.from(accounts[i]).approve(
                marketInstance.contract.address,
                ethers.constants.MaxUint256
            ))
        }
    });

    

    describe("Token exchange", async () => {
        it("Mints specified token amount", async () =>{
            await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
            const balance = await marketInstance.balanceOf(user1.signer.address);
            assert.ok(balance.eq(purchasingSequences.first.token.tokenResult))
        });

        it("Burns specified token amount", async () => {
            await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
            const balanceBefore = await marketInstance.balanceOf(user1.signer.address);

            const daiBalanceBefore = await pseudoDaiInstance.balanceOf(user1.signer.address);
            await assert.notRevert(marketInstance.from(user1).burn(balanceBefore));
            
            const balanceAfter = await marketInstance.balanceOf(user1.signer.address);
            const daiBalanceAfter = await pseudoDaiInstance.balanceOf(user1.signer.address);

            assert.ok(daiBalanceBefore.lt(daiBalanceAfter), "Dai Balance not increased");

            assert.ok(balanceAfter.lt(balanceBefore), "Token Balance not increased");
        });

        it("Handles a stress testing scenario", async () => {
            const sequences = 20;

            const mintVolumePerAction = purchasingSequences.first.token.tokenResult.div(sequences);

            let pastBalance = []
            for(let i = 0; i < sequences; i++){
                try{
                pastBalance[0] = await marketInstance.balanceOf(accounts[0].signer.address);
                pastBalance[1] = await marketInstance.balanceOf(accounts[1].signer.address);
                pastBalance[2] = await marketInstance.balanceOf(accounts[2].signer.address);
                pastBalance[3] = await marketInstance.balanceOf(accounts[3].signer.address);
                pastBalance[4] = await marketInstance.balanceOf(accounts[4].signer.address);
                pastBalance[5] = await marketInstance.balanceOf(accounts[5].signer.address);
                pastBalance[6] = await marketInstance.balanceOf(accounts[6].signer.address);
                pastBalance[7] = await marketInstance.balanceOf(accounts[7].signer.address);
                pastBalance[8] = await marketInstance.balanceOf(accounts[8].signer.address);
                pastBalance[9] = await marketInstance.balanceOf(accounts[9].signer.address);

                // Account 1 Mint
                await (await marketInstance.from(accounts[0]).mint(accounts[0].signer.address, mintVolumePerAction)).wait();
                const postMintBalance = await marketInstance.balanceOf(accounts[0].signer.address);
                assert.ok(pastBalance[0].lt(postMintBalance));

                const transferValue = postMintBalance.sub(pastBalance[0]).div(4)

                // Transfer 1/4 of mint to account 2
                await (await marketInstance.from(accounts[0]).transfer(accounts[1].signer.address, transferValue))

                // Receiver burns half
                const rewardForBurn = await marketInstance.rewardForBurn(transferValue.div(2))
                await assert.notRevert(marketInstance.from(accounts[1]).burn(transferValue.div(2)));

                // Mints with the result of the burn to account 3
                await (await marketInstance.from(accounts[1]).mint(accounts[2].signer.address, transferValue.div(2))).wait();
                
                // Accounts 2 & 3 send half to 4 & 5
                const account2SendingShare = (await marketInstance.balanceOf(accounts[1].signer.address)).sub(pastBalance[1]).div(2);
                const account3SendingShare = (await marketInstance.balanceOf(accounts[2].signer.address)).sub(pastBalance[2]).div(2);

                await (await marketInstance.from(accounts[1]).transfer(accounts[3].signer.address, account2SendingShare))
                await (await marketInstance.from(accounts[2]).transfer(accounts[4].signer.address, account3SendingShare))

                // Distribute to the rest
                const account4SendingShare = (await marketInstance.balanceOf(accounts[4].signer.address)).sub(pastBalance[4]).div(2);
                const account5SendingShare = (await marketInstance.balanceOf(accounts[5].signer.address)).sub(pastBalance[5]).div(2);

                await (await marketInstance.from(accounts[4]).transfer(accounts[6].signer.address, account4SendingShare))
                await (await marketInstance.from(accounts[5]).transfer(accounts[7].signer.address, account5SendingShare))

                const account7SendingShare = (await marketInstance.balanceOf(accounts[6].signer.address)).sub(pastBalance[6]).div(2);
                const account8SendingShare = (await marketInstance.balanceOf(accounts[7].signer.address)).sub(pastBalance[7]).div(2);

                await (await marketInstance.from(accounts[6]).transfer(accounts[8].signer.address, account7SendingShare))
                await (await marketInstance.from(accounts[7]).transfer(accounts[9].signer.address, account8SendingShare))
                }
                catch(e){
                    console.log(`${i} Had a crash`, e)
                }
            }
        })
    });
    
});
