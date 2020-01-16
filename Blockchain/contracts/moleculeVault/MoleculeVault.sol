pragma solidity 0.5.10;

import { ModifiedWhitelistAdminRole } from "../_shared/ModifiedWhitelistAdminRole.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { IMoleculeVault } from "./IMoleculeVault.sol";

/**
  * @author @veronicaLC (Veronica Coutts) & @RyRy79261 (Ryan Nobel)
  * @title  Storage and acess to the molecule fee.
  * @notice The vault will send the molecule vault its fee rate when a round of
  *         funding has been successfully filled.
  */
contract MoleculeVault is IMoleculeVault, ModifiedWhitelistAdminRole {
    // The collateral token being used by the vaults and markets
    IERC20 internal collateralToken_;
    // The fee rate of the molecule vault
    uint256 internal feeRate_ = 0;

    /**
      * @notice Setts the state variables for the contract.
      * @param  _collateralToken : The address of the collateral token (ERC20).
      * @param  _feeRate : The fee rate to be used by the vaults.
      */
    constructor(
        address _collateralToken,
        address _admin,
        uint256 _feeRate
    )
        public
        ModifiedWhitelistAdminRole()
    {
        // Ensures that the fee rate is correct
        require(_feeRate < 100, "Fee rate too high");
        // Checks the addresses cannot be 0
        require(
            address(_collateralToken) != address(0) &&
            address(_admin) != address(0),
            "Address(s) cannot be 0"
        );

        collateralToken_ = IERC20(_collateralToken);
        feeRate_ = _feeRate;
        super.addNewInitialAdmin(_admin);
        super.renounceWhitelistAdmin();
    }

    /**
      * @notice Allows an admin to add another admin.
      * @param  _moleculeAdmin: The address of the new admin.
      */
    function addAdmin(address _moleculeAdmin) external onlyWhitelistAdmin() {
        // Adding the Molecule admin address as an admin
        super.addWhitelistAdmin(_moleculeAdmin);
    }

    /**
      * @notice Allows an admin to transfer collateral out of the molecule
      *         vault and into another address.
      * @param  _to: The address that the collateral will be transferred to.
      * @param  _amount: The amount of collateral being transferred.
      */
    function transfer(
        address _to,
        uint256 _amount
    )
        public
        onlyWhitelistAdmin()
    {
        require(
            IERC20(collateralToken_).transfer(_to, _amount),
            "Transfer failed"
        );
    }

    /**
      * @notice Allows an admin to approve a spender of the molecule vault
      *         collateral.
      * @param  _spender: The address that will be approved as a spender.
      * @param  _amount: The amount the spender will be approved to spend.
      */
    function approve(
        address _spender,
        uint256 _amount
    )
        public
        onlyWhitelistAdmin()
    {
        require(
            IERC20(collateralToken_).approve(_spender, _amount),
            "Approve failed"
        );
    }

    /**
      * @notice Allows the admin to update the fee rate charged by the
      *         molecule vault. Any change to this fee rate will not affect
      *         future Markets. This was done to ensure transparency
      *         and trust in the fee rates.
      * @param  _newFeeRate : The new fee rate.
      * @return bool: If the update was successful
      */
    function updateFeeRate(
        uint256 _newFeeRate
    )
        external
        onlyWhitelistAdmin()
        returns(bool)
    {
        require(
            feeRate_ != _newFeeRate,
            "New fee rate cannot be the same as old fee rate"
        );
        // Ensures that the fee rate is correct
        require(_newFeeRate < 100, "Fee rate too high");

        feeRate_ = _newFeeRate;
        return true;
    }

    /**
      * @return address: The address of the collateral token.
      */
    function collateralToken() public view returns(address) {
        return address(collateralToken_);
    }

    /**
      * @return uint256 : The rate of fee
      */
    function feeRate() public view returns(uint256) {
        return feeRate_;
    }
}