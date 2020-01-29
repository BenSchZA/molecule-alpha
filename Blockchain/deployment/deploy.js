require('dotenv').config();
DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
ADMIN_PUBLIC_KEY = process.env.ADMIN_PUBLIC_KEY;
BACKEND_DEPLOYER_PUBLIC_KEY = process.env.BACKEND_DEPLOYER_PUBLIC_KEY;

const etherlime = require('etherlime-lib');

const PseudoDaiABI = require('../build/pseudoDai.json');
const MoleculeVaultABI = require('../build/MoleculeVault.json');
const CurveFunctionsABI = require('../build/CurveFunctions.json');
const CurveRegistryABI = require('../build/CurveRegistry.json');
const MarketRegistryABI = require('../build/MarketRegistry.json');
const MarketFactoryABI = require('../build/MarketFactory.json');

const defaultConfigs = {
	chainId: Number(process.env.CHAIN_ID) || 4,
	etherscanApiKey: process.env.ETHERSCAN_API_KEY,
	gasPrice: 8000000000,
};//	gasPrice: 10000000000,
// gasLimit: 4700000, 

const deploy = async (network, secret) => {
	/**
	 * Setting up variables from env if not provided
	 */
	if (!secret) {
		secret = DEPLOYER_PRIVATE_KEY;
	}
	if (!network) {
		network = 'rinkeby';
	}
	/**
	 * The deployment script. 
	 * Where variables need to be specified for a specific network, an if statement tree
	 * is used. 
	 */

//-------------------------------------------------------------
// local
//-------------------------------------------------------------
	if (network == 'local') {
		const deployer = new etherlime.JSONRPCPrivateKeyDeployer(secret, 'http://localhost:8545/', defaultConfigs);
		
		const deploy = (...args) => deployer.deploy(...args);

		let balance = await deployer.provider.getBalance(deployer.signer.address);
		
		// Need to deploy own DAI
		const pseudoDaiInstance = await deploy(
			PseudoDaiABI,
			false,
			"PseudoDai",
			"pDAI",
			18
		);

		const moleculeVaultInstance = await deploy(
			MoleculeVaultABI,
			false,
			pseudoDaiInstance.contract.address,
			ADMIN_PUBLIC_KEY,
			1
		);

		const curveFunctionsInstance = await deploy(CurveFunctionsABI);

		const curveRegistryInstance = await deploy(CurveRegistryABI);

		const registerCurveTX = await curveRegistryInstance.registerCurve(
			curveFunctionsInstance.contract.address,
			"linear: (1/20000)*x + 0.5"
		);
		let result = await curveRegistryInstance.verboseWaitForTransaction(registerCurveTX, 'Register curve');
		
		await curveRegistryInstance.init(
			ADMIN_PUBLIC_KEY
		);

		const marketRegistryInstance = await deploy(
			MarketRegistryABI,
			false
		);

		const marketFactoryInstance = await deploy(
			MarketFactoryABI,
			false,
			pseudoDaiInstance.contract.address,
			moleculeVaultInstance.contract.address,
			marketRegistryInstance.contract.address,
			curveRegistryInstance.contract.address
		);

		await marketFactoryInstance.init(
			ADMIN_PUBLIC_KEY,
			BACKEND_DEPLOYER_PUBLIC_KEY
		);

		const addMarketDeployerTX = await marketRegistryInstance.addMarketDeployer(
			marketFactoryInstance.contract.address,
			"Debug logs/version"
		);

		await marketRegistryInstance.verboseWaitForTransaction(addMarketDeployerTX, 'Add market deployer');
		
		await marketRegistryInstance.init(
			ADMIN_PUBLIC_KEY
		);

		const CONTRACT_ADDRESSES = `
			DAI_CONTRACT_ADDRESS=${pseudoDaiInstance.contract.address}
			MARKET_REGISTRY_ADDRESS=${marketRegistryInstance.contract.address}
			MARKET_FACTORY_ADDRESS=${marketFactoryInstance.contract.address}`;
		console.log(CONTRACT_ADDRESSES);

		let balance2 = await deployer.provider.getBalance(deployer.signer.address)
		console.log("\nBalance of deployer before deploying:\t" + balance.toString());
		console.log("Balance of deployer after deploying:\t" + balance2.toString());
		// 191408 831 393 027 885 697 .413 589 124 369 618 944
		// 191408 831 393 027 885 697 .395 277 112 369 618 944

//-------------------------------------------------------------
// rinkeby
//-------------------------------------------------------------

	} else if (network == 'rinkeby') {
		const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, process.env.INFURA_API_KEY_RINKEBY, defaultConfigs);
		
		const deploy = (...args) => deployer.deployAndVerify(...args);

		let balance = await deployer.provider.getBalance(deployer.signer.address);

		// Need to deploy own DAI
		const pseudoDaiInstance = await deploy(
			PseudoDaiABI,
			false,
			"PseudoDai",
			"pDAI",
			18
		);

		const moleculeVaultInstance = await deploy(
			MoleculeVaultABI,
			false,
			pseudoDaiInstance.contract.address,
			ADMIN_PUBLIC_KEY,
			0
		);

		const marketRegistryInstance = await deploy(
			MarketRegistryABI,
			false
		);

		const curveRegistryInstance = await deploy(CurveRegistryABI);

		const curveFunctionsInstance = await deploy(CurveFunctionsABI);

		const registerCurveTX = await curveRegistryInstance.registerCurve(
			curveFunctionsInstance.contract.address,
			"linear: (1/20000)*x + 0.5"
		);

		let result = await curveRegistryInstance.verboseWaitForTransaction(
			registerCurveTX, 'Register curve'
		);

		const marketFactoryInstance = await deploy(
			MarketFactoryABI,
			false,
			pseudoDaiInstance.contract.address,
			moleculeVaultInstance.contract.address,
			marketRegistryInstance.contract.address,
			curveRegistryInstance.contract.address
		);

		const addMarketDeployerTX = await marketRegistryInstance.addMarketDeployer(
			marketFactoryInstance.contract.address,
			"Local test deployer"
		);

		await marketRegistryInstance.verboseWaitForTransaction(addMarketDeployerTX, 'Add market deployer');

		await marketRegistryInstance.init(
			ADMIN_PUBLIC_KEY
		);

		await curveRegistryInstance.init(
			ADMIN_PUBLIC_KEY
		);

		await marketFactoryInstance.init(
			ADMIN_PUBLIC_KEY,
			BACKEND_DEPLOYER_PUBLIC_KEY
		);

		const CONTRACT_ADDRESSES = `
			DAI_CONTRACT_ADDRESS=${pseudoDaiInstance.contract.address}
			MARKET_REGISTRY_ADDRESS=${marketRegistryInstance.contract.address}
			MARKET_FACTORY_ADDRESS=${marketFactoryInstance.contract.address}`;
		console.log(CONTRACT_ADDRESSES);

		let balance2 = await deployer.provider.getBalance(deployer.signer.address)
		console.log("\nBalance of deployer before deploying:\t" + balance.toString());
		console.log("Balance of deployer after deploying:\t" + balance2.toString());
		//Before:	23 .720 522 099 000 000 000
		//After:	23 .711 403 563 000 000 000
		//Diff:		00 .008 117 436 000 000 000

//-------------------------------------------------------------
// mainnet
//-------------------------------------------------------------

	} else if (network == 'mainnet') {
		const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, process.env.INFURA_API_KEY_MAINNET, defaultConfigs);
		// The contract of DAI
		const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
		// Found at: https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f

		const deploy = (...args) => deployer.deployAndVerify(...args);

		let balance = await deployer.provider.getBalance(deployer.signer.address);

		const moleculeVaultInstance = await deploy(
			MoleculeVaultABI,
			false,
			daiAddress,
			ADMIN_PUBLIC_KEY,
			0
		);

		const marketRegistryInstance = await deploy(
			MarketRegistryABI,
			false
		);

		const curveRegistryInstance = await deploy(CurveRegistryABI);

		const curveFunctionsInstance = await deploy(CurveFunctionsABI);

		const registerCurveTX = await curveRegistryInstance.registerCurve(
			curveFunctionsInstance.contract.address,
			"linear: (1/20000)*x + 0.5"
		);

		let result = await curveRegistryInstance.verboseWaitForTransaction(
			registerCurveTX, 'Register curve'
		);

		const marketFactoryInstance = await deploy(
			MarketFactoryABI,
			false,
			daiAddress,
			moleculeVaultInstance.contract.address,
			marketRegistryInstance.contract.address,
			curveRegistryInstance.contract.address
		);

		const addMarketDeployerTX = await marketRegistryInstance.addMarketDeployer(
			marketFactoryInstance.contract.address,
			"Local test deployer"
		);

		await marketRegistryInstance.verboseWaitForTransaction(addMarketDeployerTX, 'Add market deployer');

		await marketRegistryInstance.init(
			ADMIN_PUBLIC_KEY
		);

		await curveRegistryInstance.init(
			ADMIN_PUBLIC_KEY
		);

		await marketFactoryInstance.init(
			ADMIN_PUBLIC_KEY,
			BACKEND_DEPLOYER_PUBLIC_KEY
		);

		const CONTRACT_ADDRESSES = `
			DAI_CONTRACT_ADDRESS=${daiAddress}
			MARKET_REGISTRY_ADDRESS=${marketRegistryInstance.contract.address}
			MARKET_FACTORY_ADDRESS=${marketFactoryInstance.contract.address}`;
		console.log(CONTRACT_ADDRESSES);

		let balance2 = await deployer.provider.getBalance(deployer.signer.address)
		console.log("\nBalance of deployer before deploying:\t" + balance.toString());
		console.log("Balance of deployer after deploying:\t" + balance2.toString());
		
		// >>>>>>>>>>
		// const moleculeVaultInstance = await deploy(
		// 	MoleculeVaultABI,
		// 	false,
		// 	daiAddress,
		// 	ADMIN_PUBLIC_KEY,
		// 	1
		// );

		// const curveFunctionsInstance = await deploy(CurveFunctionsABI);

		// const curveRegistryInstance = await deploy(CurveRegistryABI);

		// const registerCurveTX = await curveRegistryInstance.registerCurve(
		// 	curveFunctionsInstance.contract.address,
		// 	"linear: (1/20000)*x + 0.5"
		// );

		// let result = await curveRegistryInstance.verboseWaitForTransaction(registerCurveTX, 'Register curve');

		// await curveRegistryInstance.init(
		// 	ADMIN_PUBLIC_KEY
		// );

		// const marketRegistryInstance = await deploy(
		// 	MarketRegistryABI,
		// 	false
		// );

		// const marketFactoryInstance = await deploy(
		// 	MarketFactoryABI,
		// 	false,
		// 	daiAddress,
		// 	moleculeVaultInstance.contract.address,
		// 	marketRegistryInstance.contract.address,
		// 	curveRegistryInstance.contract.address
		// );

		// await marketFactoryInstance.init(
		// 	ADMIN_PUBLIC_KEY,
		// 	BACKEND_DEPLOYER_PUBLIC_KEY
		// );

		// const addMarketDeployerTX = await marketRegistryInstance.addMarketDeployer(
		// 	marketFactoryInstance.contract.address,
		// 	"Debug logs/version"
		// );

		// await marketRegistryInstance.verboseWaitForTransaction(addMarketDeployerTX, 'Add market deployer');

		// await marketRegistryInstance.init(
		// 	ADMIN_PUBLIC_KEY
		// );

		// const CONTRACT_ADDRESSES = `
		// 	DAI_CONTRACT_ADDRESS=${daiAddress}
		// 	MARKET_REGISTRY_ADDRESS=${marketRegistryInstance.contract.address}
		// 	MARKET_FACTORY_ADDRESS=${marketFactoryInstance.contract.address}`;
		// console.log(CONTRACT_ADDRESSES);

		// let balance2 = await deployer.provider.getBalance(deployer.signer.address)
		// console.log("\nBalance of deployer before deploying:\t" + balance.toString());
		// console.log("Balance of deployer after deploying:\t" + balance2.toString());
		//
		//
	} else {
		console.error("Unsupported network");
	}
};

module.exports = {
	deploy
};
