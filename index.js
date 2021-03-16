let Web3 = require('web3');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    while (true) {
        let prices;
        try {
            prices = await getPrices()
        } catch (e) {
            console.error('error to get price: ')
            console.error(e)
            console.error('retrying in 5s')
            await sleep(5000);
            continue;
        }

        try {
            await submitPrices(prices)
        } catch (e) {
            console.error('error to submit price: ')
            console.error(e)
            console.error('sleeping for 5s')
            await sleep(5000);
            continue;
        }
        await sleep(5000);
    }
}

let last_prices = {}

async function submitPrices(prices) {

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

async function getPrices() {
    if (last_prices['art']) {
        last_art_price = last_prices['art']
        // art is not on market, just grab a mocked price for now
        new_art_price = last_art_price * (1.1001 - Math.random() / 5)
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
}

main()