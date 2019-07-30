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

describe('Market test', () => {
    let molAdmin = accounts[1];
    let creator = accounts[2];
    let user1 = accounts[3];
    let user2 = accounts[4];
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
            moleculeVaultSettings.taxationRate,
            molAdmin.signer.address
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
            "y-axis shift"
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
            marketSettings.fundingGoals,
            marketSettings.phaseDuration,
            creator.signer.address,
            marketSettings.curveType,
            marketSettings.taxationRate
        )).wait()

        const firstMarketDataObj = await marketRegistryInstance.from(creator).getMarket(0);
        
        marketInstance = await etherlime.ContractAt(MarketAbi, firstMarketDataObj[0]);
        vaultInstance = await etherlime.ContractAt(VaultAbi, firstMarketDataObj[1]);

        
        // Setting up dai
        for(let i = 0; i < 5; i++){
            // Getting tokens
            await (await pseudoDaiInstance.from(accounts[i]).mint());
            // Setting approval
            await (await pseudoDaiInstance.from(accounts[i]).approve(
                marketInstance.contract.address,
                ethers.constants.MaxUint256
            ))
        }
    });

    describe("Pricing functions", () => {
        // TODO: Resolve inverse intergrals variance issue
        it("Calculates Dai to Tokens accurately - Mint", async () => {
            const priceToMintForDai = await marketInstance.colateralToTokenBuying(purchasingSequences.first.dai.daiCost);
            assert.ok(priceToMintForDai.eq(purchasingSequences.first.dai.tokenResult), "Price to mint dai incorrect");
        })
        it("Calculates Dai to Tokens accurately - Burn")
        it("Calculates Token to Dai accurately - Mint", async () => {
            const priceToMintForToken = await marketInstance.priceToMint(purchasingSequences.first.token.tokenResult);
            assert.ok(priceToMintForToken.eq(purchasingSequences.first.token.daiCost), "Price to mint token incorrect");
        })
        it("Calculates Token to Dai accurately - Burn", async () =>{
            let daiBalance = await pseudoDaiInstance.balanceOf(user1.signer.address);
            const txReceipt = await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();

            const balance = await marketInstance.balanceOf(user1.signer.address);
            const rewardForBurn = await marketInstance.rewardForBurn(balance);


            const transfers = (await(txReceipt.events.filter(
                event => event.topics[0] == marketInstance.interface.events.Transfer.topic
            ))).map(transferEvent => marketInstance.interface.parseLog(transferEvent))
            
            const purposedBurnValue = transfers[0].values.value.sub(transfers[1].values.value);
            assert.ok(purposedBurnValue.eq(rewardForBurn), "Reward for burn incorrect")

            // This will be the vault assert console.log(ethers.utils.formatUnits(transfers[1].values.value, 18))
        })
    })

    describe("Token exchange", () =>{
        it("Mints specified token amount", async () =>{
            await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
            const balance = await marketInstance.balanceOf(user1.signer.address);
            assert.ok(balance.eq(purchasingSequences.first.token.tokenResult))
        })
        it("Burns specified token amount", async () => {
            await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
            const balanceBefore = await marketInstance.balanceOf(user1.signer.address);

            const daiBalanceBefore = await pseudoDaiInstance.balanceOf(user1.signer.address);
            await assert.notRevert(marketInstance.from(user1).burn(balanceBefore));
            
            const balanceAfter = await marketInstance.balanceOf(user1.signer.address);
            const daiBalanceAfter = await pseudoDaiInstance.balanceOf(user1.signer.address);

            assert.ok(daiBalanceBefore.lt(daiBalanceAfter), "Dai Balance not increased");

            assert.ok(balanceAfter.lt(balanceBefore), "Token Balance not increased");
        })
    })

    describe("Vault interactions", () =>{
        it("Only Vault can finalise market", async () =>{
            let activeState = await marketInstance.active();
            assert.ok(activeState, "Market incorrectly inactive");

            await assert.notRevert(vaultInstance.from(creator).terminateMarket());
            activeState = await marketInstance.active();
            assert.ok(!activeState, "Market incorrectly active");
        })
        it("When finalised, mint/burn unavailable", async () =>{
            await assert.notRevert(marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult))
            await assert.notRevert(vaultInstance.from(creator).terminateMarket());
            await assert.revert(marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult))
            await assert.revert(marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult))
        })
        it("When finalised, withdraw functions correctly", async () => {
            await assert.notRevert(marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult))
            await assert.revert(marketInstance.from(user1).withdraw(purchasingSequences.first.token.tokenResult))
            await assert.notRevert(vaultInstance.from(creator).terminateMarket());

            const daiBalanceBefore = await pseudoDaiInstance.balanceOf(user1.signer.address);
            await assert.notRevert(marketInstance.from(user1).withdraw(purchasingSequences.first.token.tokenResult))
            const daiBalanceAfter = await pseudoDaiInstance.balanceOf(user1.signer.address);
            const tokenBalanceAfter = await marketInstance.balanceOf(user1.signer.address);

            assert.ok(daiBalanceBefore.lt(daiBalanceAfter), "Dai balance not increased")
            assert.ok(tokenBalanceAfter.eq(0), "Token balance not decreased")
        })
    })

    describe("Events", () => {
        it('Emits Transfer in mint', async () =>{
            const txReceipt = await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
            
            const transfers = (await(txReceipt.events.filter(
                event => event.topics[0] == marketInstance.interface.events.Transfer.topic
            ))).map(transferEvent => marketInstance.interface.parseLog(transferEvent))

            assert.ok(transfers[2].values.value.eq(purchasingSequences.first.token.tokenResult), "Event emitted incorrectly")
        });
        it('Emits Transfer in burn', async () => {
            await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
            
            const balance = await marketInstance.balanceOf(user1.signer.address);
            
            const txReceipt = await (await marketInstance.from(user1).burn(balance)).wait();
            
            const transfers = (await(txReceipt.events.filter(
                event => event.topics[0] == marketInstance.interface.events.Transfer.topic
            ))).map(transferEvent => marketInstance.interface.parseLog(transferEvent))

            assert.ok(transfers[1].values.value.eq(balance), "Event emitted incorrectly")
        });
        it('Emits Approve', async () => {
            const txReceipt = await (await marketInstance.from(user1).approve(user2.signer.address, ethers.constants.MaxUint256)).wait();
            const approvals = (await(txReceipt.events.filter(
                event => event.topics[0] == marketInstance.interface.events.Approval.topic
            ))).map(approveEvent => marketInstance.interface.parseLog(approveEvent))[0]

            assert.ok(approvals.values.value.eq(ethers.constants.MaxUint256), "Event emitted incorrectly")
        });
        it('Emits MarketTerminated', async () => {
            const txReceipt = await (await vaultInstance.from(creator).terminateMarket()).wait();
            
            const marketTerminated = (await(txReceipt.events.filter(
                event => event.topics[0] == marketInstance.interface.events.MarketTerminated.topic
            ))).map(termintatedEvent => marketInstance.interface.parseLog(termintatedEvent))

            assert.ok(marketTerminated != undefined, "Event emitted incorrectly")
        });
    })

    describe('Meta data', () =>{
        it('Get taxationRate', async () =>{
            const taxationRate = await marketInstance.taxationRate();
            assert.ok(taxationRate.eq(marketSettings.taxationRate), "Taxation rate not set");
        });
        it('Get active state', async () => {
            let activeState = await marketInstance.active();
            assert.ok(activeState, "Market incorrectly inactive");
            await assert.notRevert(vaultInstance.from(creator).terminateMarket());
            
            activeState = await marketInstance.active();
            assert.ok(!activeState, "Active state not updated");
        });
    })

    describe("ERC20 Functions", () => {
        describe("Controls", () => {
            it("Transfers", async ()=> {
                await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
                let balanceUser1 = await marketInstance.balanceOf(user1.signer.address);
                let balanceUser2 = await marketInstance.balanceOf(user2.signer.address);
                assert.ok(balanceUser2.eq(0), "Balance already has funds")

                await (await marketInstance.from(user1).transfer(user2.signer.address, balanceUser1.div(2)))
                balanceUser2 = await marketInstance.balanceOf(user2.signer.address);
                assert.ok(balanceUser2.eq(balanceUser1.div(2)), "Balance already has funds")
            })
            it("Sets allowance", async () => {
                await assert.notRevert(marketInstance.from(user1).approve(user2.signer.address, ethers.constants.MaxUint256));
                const allowance = await marketInstance.allowance(user1.signer.address, user2.signer.address);
                assert.ok(allowance.eq(ethers.constants.MaxUint256), "Allowance not set");
            })
            it("Transfers from account", async () => {
                await (await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult)).wait();
                await assert.notRevert(marketInstance.from(user1).approve(user2.signer.address, ethers.constants.MaxUint256));
                const allowance = await marketInstance.allowance(user1.signer.address, user2.signer.address);
                assert.ok(allowance.eq(ethers.constants.MaxUint256), "Allowance not set");
                await assert.notRevert(marketInstance.from(user2).transferFrom(user1.signer.address, user2.signer.address, purchasingSequences.first.token.tokenResult.div(2)))
            })
        })
        describe("Meta data", () => {
            it('Get allowance', async () => {
                let allowance = await marketInstance.allowance(user1.signer.address, user2.signer.address);
                assert.ok(allowance.eq(0), "Allowance already set");

                await (await marketInstance.from(user1).approve(user2.signer.address, ethers.constants.MaxUint256)).wait();
                allowance = await marketInstance.allowance(user1.signer.address, user2.signer.address);
                assert.ok(allowance.eq(ethers.constants.MaxUint256), "Allowance not set");
            });
            it('Get totalSupply', async () =>{
                let totalSupply = await marketInstance.totalSupply();
                assert.ok(totalSupply.eq(0), "Total supply invalid")
                await assert.notRevert(await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult));
                
                totalSupply = await marketInstance.totalSupply();
                assert.ok(totalSupply.eq(purchasingSequences.first.token.tokenResult), "Total supply not increased")
            });
            it('Get balanceOf', async () =>{
                let balance = await marketInstance.balanceOf(user1.signer.address);
                assert.ok(balance.eq(0), "Balance invalid")
                await assert.notRevert(await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult));
                
                balance = await marketInstance.balanceOf(user1.signer.address);
                assert.ok(balance.eq(purchasingSequences.first.token.tokenResult), "Balance not increased")
            });
            it('Get poolBalance', async () =>{
                let poolBalance = await marketInstance.poolBalance();
                assert.ok(poolBalance.eq(0), "Pool balance invalid")
                await assert.notRevert(await marketInstance.from(user1).mint(user1.signer.address, purchasingSequences.first.token.tokenResult));
                poolBalance = await marketInstance.poolBalance();
                assert.ok(poolBalance.gt(0), "Pool balance not increased")
            });
            it('Get decimals', async () => {
                const decimals = await marketInstance.decimals();
                assert.ok(decimals.eq(18), "Decimals not set")
            });
        })
    })
})
