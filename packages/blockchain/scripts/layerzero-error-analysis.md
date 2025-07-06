# LayerZero Error Analysis

## Error: 0x6c1ccdb5 - LZ_DefaultSendLibUnavailable()

### Discovery
Using `cast 4b 0x6c1ccdb5` revealed that this error signature corresponds to `LZ_DefaultSendLibUnavailable()`.

### Root Cause
The LayerZero endpoint does not have a default send library configured for the destination chain (Optimism Sepolia). This affects both:
- WETH OFT Adapter contract
- PAYMEE OFT contract

### Technical Details
- **Error Function**: `LZ_DefaultSendLibUnavailable()`
- **Location**: LayerZero Endpoint V2 contract
- **Trigger**: When `quoteSend()` or `send()` is called but no default send library is configured for the destination endpoint ID
- **Affected Chains**: Ethereum Sepolia → Optimism Sepolia (EID 40161 → 11155420)

### Potential Solutions

1. **Manual Library Configuration** (Requires admin access):
   ```solidity
   endpoint.setSendLibrary(oappAddress, dstEid, sendLibAddress)
   ```

2. **Use LayerZero CLI** (If supported for testnet):
   ```bash
   npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
   ```

3. **Wait for LayerZero Labs** to configure default libraries for testnet

4. **Use Alternative Bridges**:
   - Official Optimism Bridge: https://app.optimism.io/bridge
   - Other established cross-chain bridges

### Current Status
- ❌ ETH bridging via WETH OFT Adapter: Blocked
- ❌ PAYMEE token bridging: Blocked  
- ✅ Contract deployments: Working
- ✅ Peer configurations: Working
- ✅ Token balances and approvals: Working

### Workaround
For ETH bridging, users should use the official Optimism bridge at https://app.optimism.io/bridge until LayerZero testnet configuration is resolved. 