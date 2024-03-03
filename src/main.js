// Import the web3.js library
const { Web3, FMT_BYTES, FMT_NUMBER } = require('web3');

// Connect to a local Ethereum node
const web3 = new Web3(new Web3.providers.HttpProvider("https://eth.public-rpc.com"));

async function get_wallets(block_number_from, block_number_to) {
    const block_promises = Array.from(
        Array(block_number_to - block_number_from + 1).keys()
    ).map(
        n => n+block_number_from
    ).map(
        async n => await web3.eth.getBlock(n)
    )

    const blocks = await Promise.all(block_promises)
    
    const transaction_promises = blocks.flatMap(
        b => b.transactions
    ).filter(
        t => t !== undefined
    ).map(
        async t => await web3.eth.getTransaction(t, { number: FMT_NUMBER.NUMBER , bytes: FMT_BYTES.HEX })
    )

    const transactions = await Promise.all(transaction_promises)

    var wallets = new Map();
    transactions.flatMap(
        t => [t.from, t.to]
    ).forEach(
        a => wallets.set(a, (wallets.get(a) || 0) + 1)
    )

    return wallets;
}

async function get_data(block_number_from, block_number_to) {
    console.log(`Retrieveing data for ${block_number_to - block_number_from} blocks. From ${block_number_from} to ${block_number_to}`);

    var balance_wei = 0;
    var realized_balance_wei = 0;
    //For each block number
    for (let block_number = block_number_from; block_number <= block_number_to; block_number++) {
        //Get block
        const block = await web3.eth.getBlock(block_number);

        //Get price
        //TODO
         
        //For each transaction in block
        var transaction_balance_wei = 0;
        if(block.transactions) {
            for(const transaction_hash of block.transactions) {
                //Get transaction
                const transaction = await web3.eth.getTransaction(transaction_hash, { number: FMT_NUMBER.NUMBER , bytes: FMT_BYTES.HEX });

                //Get balance
                transaction_balance_wei += transaction.value;
            }
        }

        balance_wei += transaction_balance_wei;
        realized_balance_wei += transaction_balance_wei * 0; //TODO multiply by price
    }

    return {
        balance: balance_wei * 1e-18,
        realized_balance: realized_balance_wei * 1e-18
    }
}

async function get_yesterday_data() {
    const yesterday_timestamp = Date.now() - 60*60*24*1000
    const yesterday_date = new Date(yesterday_timestamp);
    console.log(`Retrieveing data for the day ${yesterday_date.toLocaleDateString("fr-FR")}`);

    const yesterday_date_from = new Date(yesterday_date.getFullYear(), yesterday_date.getMonth(), yesterday_date.getDate())
    const yesterday_date_to = new Date(yesterday_date.getFullYear(), yesterday_date.getMonth(), yesterday_date.getDate(), 23, 59, 59, 999)
    const yesterday_timestamp_from = yesterday_date_from.getTime() / 1000;
    const yesterday_timestamp_to = Math.floor(yesterday_date_to.getTime() / 1000);

    //TODO Dicotomia

    return await get_data(1950000, 1950001);
}

async function main() {
    var start = Date.now();
    //const result = await get_yesterday_data();
    //console.log(result);
    var end = Date.now();
    console.log(`Execution time: ${end - start} ms`);

    start = Date.now();
    const wallets = await get_wallets(0, 100);
    end = Date.now();
    console.log(`Execution time: ${end - start} ms`);
}

(async () => {
    try {
        await main();
    } catch (e) {
        // Deal with the fact the chain failed
        console.log(e);
    }
})();
