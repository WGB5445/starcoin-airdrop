import {bcs, providers} from "@starcoin/starcoin"
import {Buffer} from "buffer/index.js";

export class Wallet {
    chain = "";
    wallet_name = "";
    provider = {};

    constructor(provider, chain, wallet_name) {
        this.chain = chain
        this.provider = provider
        this.wallet_name = wallet_name
    }

    async signMessage(message) {
        if (this.wallet_name === "starmask") {
            if (this.chain === "starcoin") {

            } else if (this.chain === "aptos") {
                return await this.provider.request({
                    method: 'apt_sign',
                    params: [message],
                })
            }
        } else if (this.wallet_name === "petra") {
            return await this.provider.signMessage(message)
        }
    }

    async signAndSubmitTransaction(payload) {
        if (this.wallet_name === "starmask") {
            if (this.chain === "starcoin") {
                const payloadInHex = (function () {
                    const se = new bcs.BcsSerializer()
                    payload.serialize(se)
                    return "0x" + Buffer.from(se.getBytes()).toString('hex')
                })()

                const txParams = {
                    data: payloadInHex,
                }
                let provider = new providers.Web3Provider(
                    this.provider,
                    "any"
                )
                return await provider.getSigner().sendUncheckedTransaction(txParams)
            } else if (this.chain === "aptos") {
                const txParams = {
                    functionAptos: payload
                };
                let provider = new providers.Web3Provider(
                    this.provider,
                    "any"
                )

                return await provider.getSigner().sendUncheckedTransaction(txParams)
            }
        } else if (this.wallet_name === "petra") {
            return await this.provider.signAndSubmitTransaction(payload)
        }
    }

    async isConnected() {
        if (this.wallet_name === "starmask") {
            if (this.chain === "starcoin") {

            } else if (this.chain === "aptos") {

            }
        } else if (this.wallet_name === "petra") {
            return await this.provider.isConnected()
        }
    }

    async account() {
        if (this.wallet_name === "starmask") {
            return this.provider.selectedAddress;
        } else if (this.wallet_name === "petra") {
            return await this.provider.account().address
        }
    }

    async connect() {
        if (this.wallet_name === "starmask") {
            return await this.provider.request({
                method: "stc_requestAccounts",
            });
        } else if (this.wallet_name === "petra") {
            return await this.provider.connect()
        }
    }

    async network() {
        if (this.wallet_name === "starmask") {
            return this.provider.networkVersion;
        } else if (this.wallet_name === "petra") {
            return await this.provider.network()
        }
    }

}