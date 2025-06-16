import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'
import merkleWhiteListTokens from '../storage/merkle-wl/merkleWhiteListTokens'

// const root = buf2hex(tree.getRoot())
const getMerkleTreeData = (tokenAddress, netID) => {
  const WhiteListedTokens = merkleWhiteListTokens(netID)
  const buf2hex = x => '0x' + x.toString('hex')
  const leaves = WhiteListedTokens.map(x => keccak256(x)).sort(Buffer.compare)
  const tree = new MerkleTree(leaves, keccak256)

  // const leaf = buf2hex(keccak256(tokenAddress))
  const proof = tree.getProof(keccak256(tokenAddress)).map(x => buf2hex(x.data))
  const positions = tree.getProof(keccak256(tokenAddress)).map(x => x.position === 'right' ? 1 : 0)
  return { proof, positions }
}

export default getMerkleTreeData;