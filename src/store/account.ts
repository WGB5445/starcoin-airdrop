import {makeAutoObservable} from 'mobx'
import {Wallet} from "../lib/wallet.js"

interface networkMap {
    [key: string]: string
}

class AccountStore {
    isInstall: boolean = false
    currentAccount: string = ''
    currentNetworkVersion: string = ''
    network: string = ''
    accountStatus: number = 0
    chain:string = "starcoin"
    wallet:Wallet = new Wallet(null,"","")

    constructor() {
        makeAutoObservable(this, {}, {autoBind: true})
    }

    setIsInstall = (v: boolean) => {
        this.isInstall = v
    }
    setChain = (v: any) => {
        this.chain = v
    }

    setNetwork = (v: any) => {
        this.network = v
    }
    setCurrentAccount = (v: string) => {
        this.currentAccount = v
    }
    setAccountStatus = (v: number) => {
        this.accountStatus = v
    }
    setCurrentNetworkVersion = (v: string) => {
        this.currentNetworkVersion = v
    }

    setWallet = (v: Wallet) => {
        this.wallet = v
    }
}

export default new AccountStore()


