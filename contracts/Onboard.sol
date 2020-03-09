contract Onboard {
  IERC20 gnt = IERC20(0x123);
  Franklin franklin = Franklin(0x123);
  mapping(address => uint) public nonces;
  constructor() {
    gnt.approve(address(franklin), uint256(-1));
  }

  function depositERC20 (
    address _account,
    uint256 _amount,
    address _franklinAddr,
    uint256 _nonce,
    uint8 _v, bytes32 _r, bytes32 _s,
    uint256 _permitNonce,
    uint256 _permitExpiry,
    uint8 _permitV, bytes32 _primitR, bytes32 _permitS
  ) external {
    bytes32 digest = keccak256(abi.encode(
      address(this),
      address(gnt),
      address(franklin),
      _account,
      _amount,
      _franklinAddr,
      _nonce
    ))
    require(_account == ecrecover(digest, v, r, s));
    require(_nonce == nonces[_account]++);
    require(gnt.transferFrom(_account, address(this), _amount));
    franklin.depositERC20(address(gnt), _amount, _franklinAddr);
  }
}

 function permit(
        address holder, address spender, uint256 nonce, uint256 expiry,
        bool allowed, uint8 v, bytes32 r, bytes32 s) external
