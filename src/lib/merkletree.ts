import pkg from 'js-sha3';
import {MerkleTree} from 'merkletreejs';
import {CoinAirdrop} from "./coin_airdrop";
import {parse} from 'csv-parse/dist/esm/sync';
const {sha3_256} = pkg

export function parse_csv(csv:string):Array<Array<string>>{
    return  parse(csv, {
        columns: false,
        skip_empty_lines: true
    });
}

export function check_records(records:Array<Array<string>>){
    if (!(records[0][0] == 'address' &&
        records[0][1] == 'amount')) {
        throw "row not right: should be address amount"
    }
    return true
}

export function create_airdrop(csv:string, token_type:string, token_precision:number){
    let airdrops = new Array<CoinAirdrop>()
    let records = parse_csv(csv);
    check_records(records)
    let total = BigInt(0)
    records.splice(0, 1)
    records.forEach((v, i) => {
        total = total + BigInt(Number(v[1]) * Math.pow(10, token_precision))
        airdrops.push(new CoinAirdrop(
            v[0],
            Number(v[1]) * Math.pow(10, token_precision),
            token_type
        ))
    });
    console.log(total)


}