pragma solidity 0.5.10;

import { ModifiedWhitelistAdminRole } from "../_shared/ModifiedWhitelistAdminRole.sol";
import { IMarketRegistry } from "./IMarketRegistry.sol";

/**
  * @author @veronicaLC (Veronica Coutts) & @RyRy79261 (Ryan Nobel)
  * @title  Storage of markets (vaults and markets) as well as deployers.
  */
contract MarketRegistry is IMarketRegistry, ModifiedWhitelistAdminRole {
    // The total number of markets
    uint256 internal numberOfMarkets_ = 0;
    // The block number when this contract was published
    uint256 internal publishedBlocknumber_;
    // The init function can only be called once 
    bool internal isInitialized_  = false;

    // Mapping of all the markets deployed to their index
    mapping(uint256 => Market) internal markets_;
    // Mapping of all deployers
    mapping(address => bool) internal deployer_;

    // The information stored about each market
    struct Market {
        address marketAddress;
        address vault;
        address creator;
    }

    /**
      * @notice The deployer of this contract will be the admin.
      */
    constructor() public ModifiedWhitelistAdminRole() {
        publishedBlocknumber_ = block.number;
    }

    modifier isRegisteredDeployer() {
        require(deployer_[msg.sender], "Deployer not registered");
        _;
    }

    function init(address _admin) public onlyWhitelistAdmin() {
        require(!isInitialized_, "Contract is initialized");
        super.addNewInitialAdmin(_admin);
        super.renounceWhitelistAdmin();
        isInitialized_ = true;
    }

    /**
      * @dev    Adds a new market deployer to the registry.
      * @param  _newDeployer: Address of the new market deployer.
      * @param  _version: string - Log text for tracking purposes.
      */
    function addMarketDeployer(
        address _newDeployer,
        string calldata _version
    )
        external
        onlyWhitelistAdmin()
    {
        require(deployer_[_newDeployer] != true, "Already approved");
        deployer_[_newDeployer] = true;
        emit DeployerAdded(_newDeployer, _version);
    }

    /**
      * @dev    Removes a market deployer from the registry.
      * @param  _deployerToRemove: Address of the market deployer to remove.
      * @param  _reason: Log text for tracking purposes.
      */
    function removeMarketDeployer(
        address _deployerToRemove,
        string calldata _reason
    )
        external
        onlyWhitelistAdmin()
    {
        require(deployer_[_deployerToRemove] != false, "Already inactive");
        deployer_[_deployerToRemove] = false;
        emit DeployerRemoved(_deployerToRemove, _reason);
    }

    /**
      * @dev    Logs the market into the registery.
      * @param  _vault: Address of the vault.
      * @param  _creator: Creator of the market.
      * @return uint256: Returns the index of market for looking up.
      */
    function registerMarket(
        address _marketAddress,
        address _vault,
        address _creator)
        external
        isRegisteredDeployer()
        returns(uint256)
    {
        // Checks that none of the addresses are 0
        require(
            address(_marketAddress) != address(0) &&
            address(_vault) != address(0) &&
            address(_creator) != address(0),
            "Address(s) cannot be 0"
        );

        uint256 index = numberOfMarkets_;
        numberOfMarkets_ = numberOfMarkets_ + 1;

        markets_[index].marketAddress = _marketAddress;
        markets_[index].vault = _vault;
        markets_[index].creator = _creator;

        emit MarketCreated(
            index,
            _marketAddress,
            _vault,
            _creator
        );

        return index;
    }

    /**
      * @dev    Fetches all data and contract addresses of deployed
      *         markets by index, kept as interface for later
      *         intergration.
      * @param  _index: Index of the market.
      * @return address: The address of the market.
	  * @return	address: The address of the vault.
	  * @return	address: The address of the creator.
      */
    function getMarket(uint256 _index)
        external
        view
        returns(
            address,
            address,
            address
        )
    {
        return (
            markets_[_index].marketAddress,
            markets_[_index].vault,
            markets_[_index].creator
        );
    }

    /**
	  * @dev	Fetchs the current number of markets infering maximum
	  *			callable index.
	  * @return	uint256: The number of markets that have been deployed.
	  */
    function getIndex()
        external
        view
        returns(uint256)
    {
        return numberOfMarkets_;
    }

    /**
	  * @dev	Used to check if the deployer is registered.
      * @param  _deployer: The address of the deployer
	  * @return	bool: A simple bool to indicate state.
	  */
    function isMarketDeployer(
        address _deployer
    )
        external
        view
        returns(bool)
    {
        return deployer_[_deployer];
    }

    /**
	  * @dev	In order to look up logs efficently, the published block is
	  *			available.
	  * @return	uint256: The block when the contract was published.
	  */
    function publishedBlocknumber() external view returns(uint256) {
        return publishedBlocknumber_;
    }
}
