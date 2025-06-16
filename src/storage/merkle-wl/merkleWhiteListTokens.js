import bnbWhiteList from './bnbWhiteList.js';
import maticWhiteList from './maticWhiteList.js';
import baseWhiteList from './baseWhiteList.js';

function merkleWhiteListTokens(netID) {
    if (netID === 8453) {
        return baseWhiteList
    } 
    else if (netID === 137) {
        return maticWhiteList
    }
    else if (netID === 56) {
        return bnbWhiteList;
    
    }else{
        return []
    }
}

export default merkleWhiteListTokens