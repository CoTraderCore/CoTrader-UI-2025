import baseTokens from './baseTokens.js';
import maticTokens from './maticTokens.js';
import bnbTokens from './bnbTokens.js';

function tokensList(netID) {
    if (netID === 8453) {
        return baseTokens;
    } 
    else if (netID === 137) {
        return maticTokens;
    }
    else if (netID === 56) {
        return bnbTokens;   
    
    }else{
        return []
    }
}

export default tokensList;