import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import * as zksync from "zksync";
import {getDefaultProvider, Wallet, utils, providers} from "ethers";

async function initServices() {
  const ethersProvider = new providers.JsonRpcProvider('http://192.168.1.44:8545');
  const syncProvider = await zksync.Provider.newWebsocketProvider('ws://192.168.1.44:3031')

  const ethWallet = Wallet.fromMnemonic(localStorage.getItem('mnemonic')!).connect(ethersProvider)
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  return { syncProvider, ethersProvider, ethWallet, syncWallet }
}

type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never

type Services = Unpromise<ReturnType<typeof initServices>>

async function getBalances(services: Services) {
  return {
    commited: await services.syncWallet.getBalance('ETH', 'committed'),
    verified: await services.syncWallet.getBalance('ETH', 'verified'),
    ethereum: await services.ethWallet.getBalance(),
  }
}

type Balances = Unpromise<ReturnType<typeof getBalances>>

function App() {
  const [services, setServices] = useState<Services | undefined>(undefined)
  useEffect(() => {
    setTimeout(async () => {
      setServices(await initServices())
    })
  }, [])

  const [balances, setBalances] = useState<Balances | undefined>(undefined)
  useEffect(() => {
    if(services) {
      getBalances(services).then(setBalances)
    }
  }, [services])

  const [isSigningKeySet, setIsSigningKeySet] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    if(services) {
      services.syncWallet.isSigningKeySet().then(setIsSigningKeySet)
    }
  }, [services])

  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  
  async function deposit () {
    const tx = await services!.syncWallet.depositToSyncFromEthereum({
      depositTo: recipient,
      token: "ETH",
      amount: utils.parseEther(amount),
      maxFeeInETHToken: utils.parseEther("0.01")
    });
    console.log(tx)
    tx.awaitReceipt().then(r => console.log('receipt', r));
    tx.awaitVerifyReceipt().then(r => console.log('verified', r));
    tx.awaitEthereumTxCommit().then(r => console.log('eth commit', r));
  }

  async function transfer () {
    const tx = await services!.syncWallet.syncTransfer({
      to: recipient,
      token: "ETH",
      amount: utils.parseEther(amount),
      fee: utils.parseEther("0.0001")
    });
    console.log(tx)
    tx.awaitReceipt().then(r => console.log('receipt', r));
    tx.awaitVerifyReceipt().then(r => console.log('verified', r));
  }

  async function withdraw () {
    const tx = await services!.syncWallet.withdrawFromSyncToEthereum({
      ethAddress: recipient,
      token: 'ETH',
      amount: utils.parseEther(amount),
      fee: utils.parseEther("0.005")
    })
    console.log(tx)
    tx.awaitReceipt().then(r => console.log('receipt', r));
    tx.awaitVerifyReceipt().then(r => console.log('verified', r));
  }

  async function setSigningKey() {
    const tx = await services!.syncWallet.setSigningKey();
    console.log(tx)
    tx.awaitReceipt().then(r => console.log('receipt', r));
    tx.awaitVerifyReceipt().then(r => console.log('verified', r));
  }

  services?.syncWallet?.isSigningKeySet()

  return (
    <div className="App">
      <header className="App-header">
        <p>Ethereum address {services?.ethWallet?.address}</p>
        <p>Sync address {services?.syncWallet?.address?.()}</p>

        <p>Is signing key set {`${isSigningKeySet}`}</p>
        {isSigningKeySet === false && <button onClick={setSigningKey}>Set signing key</button>}
        {balances && <>
          <p>Commited balance: {utils.formatEther(balances.commited)}</p>
          <p>Verified balance: {utils.formatEther(balances.verified)}</p>
          <p>Ethereum balance: {utils.formatEther(balances.ethereum)}</p>
        </>}
        
        <p>Amount: <input value={amount} onChange={e => setAmount(e.target.value)} /></p>
        <p>Recipient: <input value={recipient} onChange={e => setRecipient(e.target.value)} /></p>

        <button onClick={deposit}>Deposit</button>
        <button onClick={transfer}>Transfer</button>
        <button onClick={withdraw}>Withdraw</button>

      </header>
    </div>
  );
}

export default App;
