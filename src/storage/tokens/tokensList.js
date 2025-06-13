import baseTokens from './baseTokens.js';

function tokensList(netID) {
    if (netID === 137) {
        return baseTokens;
    }else{
        return []
    }
}

export default tokensList;