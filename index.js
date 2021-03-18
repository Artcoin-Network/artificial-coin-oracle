let Web3 = require('web3')
let yahooStockPrices = require('yahoo-stock-prices')
let nearAPI = require('near-api-js')
let { KeyPair } = nearAPI;
let fetch = require('node-fetch')
let getConfig = require('./config')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    let { contract, nearConfig } = await initContract()

    while (true) {
        let prices;
        while (true) {
            try {
                prices = await getPrices()
                break
            } catch (e) {
                console.error('error to get price: ')
                console.error(e)
                console.error('retrying in 1 min')
                await sleep(60000);
                continue;
            }
        }

        while (true) {
            try {
                await submitPrices(prices, contract)
                break
            } catch (e) {
                console.error('error to submit price: ')
                console.error(e)
                console.error('sleeping for 1 min')
                await sleep(60000);
                continue;
            }
        }

        console.log('update price in 10 min')
        await sleep(600000);
    }
}

let last_prices = {}

function priceToContrat(price) {
    return Math.floor(Number(price) * Math.pow(10, 8)).toString()
}

async function submitPrices(prices, contract) {
    console.log('submit price')
    console.log(prices)
    let a = await contract.submit_price({ price: priceToContrat(prices['art']) })
    console.log(a)
    for (let k in prices) {
        if (k != 'art') {
            let name = 'a' + k.toUpperCase()
            console.log('submitting ' + name)
            await contract.submit_asset_price({asset:name, price:priceToContrat(prices[k])})
        }
    }
    console.log(a)
}

const chainLinkFeeds = {
    'BTC': {
        'addr': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
        'multi': 8
    },
    'EUR': {
        'addr': '0xb49f677943BC038e9857d61E7d053CaA2C1734C1',
        'multi': 8
    },
    'GOLD': {
        'addr': '0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6',
        'multi': 8
    }
}

async function getPriceFromChainLink(name) {
    let url = 'https://mainnet.infura.io/v3/28c4cd108b704522b53bf9760086e8dd'
    const web3 = new Web3(url);
    const aggregatorV3InterfaceABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"version","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
    const addr = chainLinkFeeds[name].addr;
    const priceFeed = new web3.eth.Contract(aggregatorV3InterfaceABI, addr);
    let data = await priceFeed.methods.latestRoundData().call()
    return Number(data.answer)/Math.pow(10, chainLinkFeeds[name].multi)
}

async function getPriceFromYahooFinance(name) {
    const data = await yahooStockPrices.getCurrentData(name);
    console.log(data) // { currency: 'USD', price: 132.05 }
    return data.price
}

// async function getCoinDayRateRecent(coin) {
//     let req = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=91`);
//     let resp = await req.json();
//     return resp;
// }

async function getCoinPriceFromCoingecko(coin) {
    let req = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`)
    let resp = await req.json();
    return resp[coin].usd
}

async function getPrices() {
    console.log('get prices')
    if (last_prices['art']) {
        last_art_price = last_prices['art']
        // art is not on market, just grab a mocked price for now
        new_art_price = last_art_price * (1.101 - Math.random() / 5)
        if (new_art_price < 1) {
            new_art_price *= 1.5;
        }
        last_prices['art'] = new_art_price
    } else {
        last_prices['art'] = 10
    }
    console.log('current art price: $', last_prices['art'])
    let btc = await getPriceFromChainLink('BTC')

    console.log('current aBTC price: $', btc)
    let eur = await getPriceFromChainLink('EUR')
    console.log('current aEUR price: $', eur)

    let gold = await getPriceFromChainLink('GOLD')
    console.log('current aGOLD price: $', gold)

    let spy = await getPriceFromYahooFinance('SPY')
    console.log('current aSPY price: $', spy)

    let near = await getCoinPriceFromCoingecko('near')
    console.log('current aSPY price: $', near)

    return {btc, eur, gold, spy, near, art: last_prices['art']}
}

async function initContract() {
    let networkId = process.env.NODE_ENV || 'testnet'
    console.log(networkId)
    const nearConfig = getConfig(networkId);
  
    // Initializing connection to the NEAR TestNet
    let keyStore = new nearAPI.keyStores.InMemoryKeyStore()
    let fs = require('fs')
    let kf = fs.readFileSync(nearConfig.contractName + '.json')
    let k = JSON.parse(kf)
    keyStore.setKey(networkId, nearConfig.contractName, KeyPair.fromString(k.private_key))
    if (networkId == 'testnet')
        keyStore.setKey('default', nearConfig.contractName, KeyPair.fromString(k.private_key))
    const near = await nearAPI.connect({
      deps: {
        keyStore,
        },
      ...nearConfig
    });

  
    let account = await near.account( nearConfig.contractName);

    // Initializing our contract APIs by contract name and configuration
    const contract = await new nearAPI.Contract(account, nearConfig.contractName, {
      // View methods are read-only – they don't modify the state, but usually return some value
      viewMethods: [],
      // Change methods can modify the state, but you don't receive the returned value when called
      changeMethods: ['submit_price', 'submit_asset_price'],
      // Sender is the account ID to initialize transactions.
      // getAccountId() will return empty string if user is still unauthorized
      sender: nearConfig.contractName
    })
  
    return { contract, nearConfig }
}

main() 