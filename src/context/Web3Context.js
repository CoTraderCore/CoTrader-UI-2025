import React from "react";

const Web3Context = React.createContext({
  web3:null,
  setWeb3: () => {},
  accounts: null,
  setAccounts: () => {},
  netId: null,
  setNetId: () => {},
  searchData:"",
  setSearchData:()=>{}
})

export default Web3Context
