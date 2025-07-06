import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'WETHOFTAdapter'

const deployWETHOFTAdapter: DeployFunction = async (hre) => {
    const { deployments, getNamedAccounts, network } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    console.log(`Deploying WETH OFT Adapter on ${network.name}...`)

    // WETH addresses for testnets
    const WETH_ADDRESSES = {
        'ethereum-sepolia': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
        'optimism-sepolia': '0x4200000000000000000000000000000000000006', // Native WETH on Optimism Sepolia
    }

    // LayerZero endpoint addresses
    const LZ_ENDPOINTS = {
        'ethereum-sepolia': '0x6EDCE65403992e310A62460808c4b910D972f10f',
        'optimism-sepolia': '0x6EDCE65403992e310A62460808c4b910D972f10f',
    }

    const wethAddress = WETH_ADDRESSES[network.name as keyof typeof WETH_ADDRESSES]
    const lzEndpoint = LZ_ENDPOINTS[network.name as keyof typeof LZ_ENDPOINTS]

    if (!wethAddress) {
        throw new Error(`WETH address not configured for network: ${network.name}`)
    }

    if (!lzEndpoint) {
        throw new Error(`LayerZero endpoint not configured for network: ${network.name}`)
    }

    console.log(`Using WETH address: ${wethAddress}`)
    console.log(`Using LayerZero endpoint: ${lzEndpoint}`)
    console.log(`Deployer: ${deployer}`)

    const wethOFTAdapter = await deploy(contractName, {
        from: deployer,
        args: [
            wethAddress,  // WETH token address
            lzEndpoint,   // LayerZero endpoint
            deployer,     // delegate (owner)
        ],
        log: true,
        waitConfirmations: 1,
    })

    console.log(`✅ WETH OFT Adapter deployed at: ${wethOFTAdapter.address}`)
    console.log(`   Network: ${network.name}`)
    console.log(`   WETH: ${wethAddress}`)
    console.log(`   LayerZero Endpoint: ${lzEndpoint}`)
    console.log(`   Owner: ${deployer}`)
}

deployWETHOFTAdapter.tags = [contractName]

export default deployWETHOFTAdapter 