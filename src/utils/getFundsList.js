import { APIEnpoint } from '../config.js'
import axios from 'axios'
import { fromWei } from 'web3-utils'

const getFundsList = async () => {
  try {
    const smartFunds = await axios.get(APIEnpoint + "api/smartfunds/")
    
    // Helper function to convert wei values
    const convertWeiValue = (value) => {
      if (!value || value === "0" || value === 0) return "0"
      
      try {
        // Handle string values directly (don't convert to float first)
        let weiString = value.toString()
        
        // If it's in scientific notation, convert it properly
        if (weiString.includes('e') || weiString.includes('E')) {
          // Convert scientific notation to regular number
          const num = Number(value)
          if (isNaN(num)) return "0"
          weiString = num.toLocaleString('fullwide', { useGrouping: false })
        }
        
        // Remove any decimal points (wei should be integers)
        weiString = weiString.split('.')[0]
        
        // Convert from wei to ether
        return fromWei(weiString, 'ether')
      } catch (error) {
        console.warn('Error converting wei value:', value, error)
        return "0"
      }
    }

    // Convert wei values to ether for each fund
    const convertedFunds = smartFunds.data.result.map(fund => ({
      ...fund,
      valueInETH: convertWeiValue(fund.valueInETH),
      valueInUSD: convertWeiValue(fund.valueInUSD),
      profitInETH: convertWeiValue(fund.profitInETH),
      profitInUSD: convertWeiValue(fund.profitInUSD),
      historyProfitInETH: convertWeiValue(fund.historyProfitInETH),
      historyProfitInUSD: convertWeiValue(fund.historyProfitInUSD)
    }))

    return convertedFunds
  } catch (error) {
    alert(`can't get data`)
    console.error(error)
  }
}

export default getFundsList