import { createPublicClient, http } from 'viem'
import { anvil } from 'viem/chains'
 
const client = createPublicClient({ 
  chain: anvil, 
  transport: http(), 
}) 

const blockNumber = await client.getBlockNumber() 
console.log(blockNumber);
