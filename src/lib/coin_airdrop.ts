import { TxnBuilderTypes, BCS } from 'aptos';
// @ts-ignore
import * as buffer from "buffer/index.js";

const {
    AccountAddress,
    StructTag,
} = TxnBuilderTypes;


export class CoinAirdrop {
    private address: TxnBuilderTypes.AccountAddress;
    private coin_type: string;
    private amount: number;


    constructor(address:string, amount:number, coin_type:string) {
        this.address =  AccountAddress.fromHex(address);
        StructTag.fromString(coin_type)
        this.coin_type = coin_type;
        this.amount = Number(amount);

    }

    address_string() {
        return "0x" + Buffer.from(this.address.address).toString('hex')
    }

    get_amount() {
        return this.amount
    }

    get_coin_type() {
        return this.coin_type.toString()
    }

    serialize() {
        let bcs = new BCS.Serializer()
        this.address.serialize(bcs)
        bcs.serializeStr(this.coin_type)
        bcs.serializeU64(this.amount)
        return bcs.getBytes()
    }
}