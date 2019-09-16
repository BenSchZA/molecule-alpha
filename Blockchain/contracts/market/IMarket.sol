pragma solidity 0.5.10;

/**
  * @author Veronica & Ryan of Linum Labs
  * @title Market
  */
interface IMarket {

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint value);
    event Mint(address indexed to, uint256 amountMinted, uint256 collateralAmount, uint256 researchContribution);
    event Burn(address indexed from, uint256 amountBurnt, uint256 collateralReturned);
    event MarketTerminated();

    /**
      * @dev                Approves transfers for a given address
      * @param _spender     :address The account that will receive the funds.
      * @param _value       :uint256 The value of funds accessed.
      * @return             :boolean Indicating the action was successful.
      */
    function approve(address _spender, uint256 _value) external returns (bool);

    /**
      * @dev                Selling tokens back to the bonding curve for collateral
      * @param _numTokens   The number of tokens that you want to burn
      */
    function burn(uint256 _numTokens) external returns(bool);

    /**
      * @dev                Mint new tokens with ether
      * @param _to          :address Address to mint tokens to
      * @param _numTokens   :uint256 The number of tokens you want to mint
      * @dev                We have modified the minting function to divert a portion of the purchase tokens
      */
    function mint(address _to, uint256 _numTokens) external returns(bool);
        // Rough gas usage 153,440

    /**
      * @dev    Ends the market so that no more tokens can be bought or sold
      * @notice Can only be called by this markets vault
      */
    function finaliseMarket() external returns(bool);

    /**
      * @dev              Allows token holders to withdraw collateral in return for tokens
      *                   after the market has been finalised.
      * @param _amount    : uint256 - The amount of tokens they want to withdraw
      */
    function withdraw(uint256 _amount) external returns(bool);

    // [ERC20 functions]
    /**
      * @dev                Transfer ownership token from msg.sender to a specified address
      * @param _to          : address The address to transfer to.
      * @param _value       : uint256 The amount to be transferred.
      */
    function transfer(address _to, uint256 _value) external returns (bool);

    /**
      * @dev                Transfer tokens from one address to another
      * @param _from        :address The address which you want to send tokens from
      * @param _to          :address The address which you want to transfer to
      * @param _value       :uint256 the amount of tokens to be transferred
      */
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool);

    // [Pricing functions]
    /**
      * @dev                Returns the required collateral amount for a volume of bonding curve tokens
      * @return             :uint256 Required collateral corrected for decimals
      */
    function priceToMint(uint256 _numTokens) external view returns(uint256);

    /**
      * @dev                Returns the required collateral amount for a volume of bonding curve tokens
      * @return             Potential return collateral corrected for decimals
      */
    function rewardForBurn(uint256 _numTokens) external view returns(uint256);

    // [Inverse pricing functions]
    /**
      * @dev                This function returns the amount of tokens one can receive for a specified amount of collateral token
      *                     Including molecule & market contributions
      * @param  _collateralTokenOffered  :uint256 Amount of reserve token offered for purchase
      */
    function collateralToTokenBuying(uint256 _collateralTokenOffered) external view returns(uint256);

    /**
      * @dev                            This function returns the amount of tokens needed to be burnt to withdraw a specified amount of reserve token
      *                                 Including Molecule & market contributions
      * @param  _collateralTokenNeeded  :uint256 Amount of dai to be withdraw
      */
    function collateralToTokenSelling(uint256 _collateralTokenNeeded) external view returns(uint256);

    /**
      * @dev                Gets the value of the current allowance specifed for that account
      * @param _owner       :address The account sending the funds.
      * @param _spender     :address The account that will receive the funds.
      * @return             An uint256 representing the amount owned by the passed address.
      */
    function allowance(address _owner, address _spender) external view returns (uint256);

    /**
      * @dev                Gets the balance of the specified address.
      * @param _owner       :address The address to query the the balance of.
      * @return             An uint256 representing the amount owned by the passed address.
      */
    function balanceOf(address _owner) external view returns (uint256);

    /**
      * @dev                Total number of tokens in existence
      * @return             A uint256 representing the total supply of tokens in this market
      */
    function totalSupply() external view returns (uint256);

    /**
      * @dev                Total collateral backing the curve
      * @return             A uint256 representing the total collateral backing the curve
      */
    function poolBalance() external view returns (uint256);

    /**
      * @dev The rate of taxation the market pays towards the vault on token purchases
      */
    function taxationRate() external view returns(uint256);

    /**
      * @dev                Returns the decimals set for the market
      * @return             :uint256 The decimals set for the market
      */
    function decimals() external view returns(uint256);

    /**
      * @dev                The active stat of the market. Inactive markets have ended
      */
    function active() external view returns(bool);
}
