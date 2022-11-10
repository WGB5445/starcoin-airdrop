import { makeAutoObservable } from 'mobx'

interface networkMap {
  [key: string]: string
}

class AccountStore {
  isInstall: boolean = false
  accountList: any = []
  currentAccount: string = ''
  currentNetworkVersion: number = 0
  network:string = ''
  accountStatus: number = 0
  networkVersion: networkMap = {
    "Mainnet": "1",
    "Testnet": "2",
    "Devnet":"36"
  }

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setIsInstall = (v: boolean) => {
    this.isInstall = v
  }
  setAccountList = (v: any) => {
    this.accountList = v
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
  setCurrentNetworkVersion = (v: number) => {
    this.currentNetworkVersion = v
  }
}

export default new AccountStore()


