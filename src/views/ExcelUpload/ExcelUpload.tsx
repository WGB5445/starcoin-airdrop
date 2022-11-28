import {Button, InputLabel, makeStyles, TextField} from '@material-ui/core';
import React, {useState} from 'react'
import Dropzone from 'react-dropzone'
import API from '../../api/api'
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Snackbar, {SnackbarOrigin} from '@material-ui/core/Snackbar';
import {contract_address} from "../../lib/contract";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {create_airdrop} from "../../lib/merkletree";
import {useStores} from "../../useStore";
import {providers, utils} from "@starcoin/starcoin";
import {PROJECT} from "../../lib/project";
import {AptosAccount, AptosClient, CoinClient} from "aptos";

const useStyles = makeStyles((theme) => ({
    dropZoneArea: {
        background: '#004c807d',
        padding: '8rem 2rem',
        textAlign: 'center',
        color: '#ffffff',
        border: '1px dashed',
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },

}));


export interface State extends SnackbarOrigin {
    open: boolean;
    message: string
}

const ExcelUpload: React.FC = () => {
    const classes = useStyles();
    const [csv, SetCsv] = useState<string>("");
    const [File, SetFile] = useState<string>();

    const {AccountStore} = useStores()
    const [coin_type_id, setcoin_type_id] = React.useState(0);
    const [airdrop, setAirdrop] = React.useState({
        name: "",
        name_en: "",
        coin_type: "0x1::aptos_coin::AptosCoin",
        coin_symbol: "APT",
        coin_precision: "8",
        total: "",
        total_amount: 0,
        airdrop_amount: 0,
    });

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [cansub, setCansub] = React.useState(false);
    const [state, setState] = React.useState<State>({
        open: false,
        vertical: 'top',
        horizontal: 'center',
        message: ""
    });
    const {vertical, horizontal, open, message} = state;

    const [balance,setBalance] = React.useState<BigInt>(BigInt(0));

    async function getBalance(
        network: string,
        address: string,
        coin_type: string
    ): Promise<BigInt> {
        setCansub(false);
        if (AccountStore.chain === "aptos") {
            try {
                let cli = new AptosClient(`https://fullnode.${network}.aptoslabs.com`)
                return BigInt(await new CoinClient(cli).checkBalance(new AptosAccount(undefined, address)) || BigInt(0));
            } catch (e) {
                setState({
                    open: true,
                    vertical: vertical,
                    horizontal: horizontal,
                    message: "check balance ERROR !"
                });

            }
        } else {
            try {
                let balance = await new providers.JsonRpcProvider(`https://${network}-seed.starcoin.org`).getBalance(address, coin_type) || 0
                return BigInt(balance.toString());
            } catch (e) {
                setState({
                    open: true,
                    vertical: vertical,
                    horizontal: horizontal,
                    message: "check balance ERROR !"
                });
            }
        }
        return BigInt(0)
    }

    async function onDrop(file: any) {
        setCansub(false)
        const reader = new FileReader()
        reader.onload = async () => {
            let binaryStr = reader.result || new ArrayBuffer(0)
            let binary: Buffer | void = (binaryStr instanceof ArrayBuffer) ? Buffer.from(binaryStr) : Buffer.from(binaryStr)
            try {
                setAirdrop({...airdrop, total: BigInt(0).toString(), airdrop_amount: 0})
                let {
                    total,
                    len
                } = create_airdrop(binary.toString('utf8'), airdrop.coin_type, Number(airdrop.coin_precision));
                setAirdrop({
                    ...airdrop,
                    total: (Number(total) / Math.pow(10, Number(airdrop.coin_precision))).toString(),
                    airdrop_amount: len
                })
                SetCsv(binary.toString('utf8'))
                SetFile(file[0].name);

                let balance = await getBalance(
                    AccountStore.network,
                    AccountStore.currentAccount,
                    airdrop.coin_type
                );
                setBalance( balance)
                if ((balance || BigInt(0)) > total) {
                    setCansub(true)
                } else {
                    setCansub(false)
                }
            } catch (e) {
                setState({open: true, vertical: vertical, horizontal: horizontal, message: e.message});
            }

        }
        reader.readAsArrayBuffer(file[0]);
    }

    async function onSub() {
        console.log(AccountStore.currentNetworkVersion)
        let data = {
            project: `${PROJECT}`,
            name: airdrop.name,
            name_en: airdrop.name_en,
            token: airdrop.coin_type,
            token_symbol: airdrop.coin_symbol,
            token_precision: airdrop.coin_precision,
            chain: AccountStore.chain,
            chainid: AccountStore.currentNetworkVersion,
            csv: csv,
            address: AccountStore.currentAccount,
            time: new Date().toUTCString()
        }

        if (csv === "") {
            setState({open: true, vertical: vertical, horizontal: horizontal, message: "csv is empty"});
            return
        }
        if (AccountStore.chain === "starcoin") {
            let sign = await window.starcoin.request({
                method: 'personal_sign',
                params: [Buffer.from(JSON.stringify(data), 'utf8').toString('hex'), AccountStore.currentAccount],
            })
            let req = await API.upload({data: data, signature: sign})
            if (req.data.error === 400) {
                setState({open: true, vertical: vertical, horizontal: horizontal, message: req.data.data.toString()});
            } else if (req.data.error === 200) {
                const airdropFunctionIdMap: any = {
                    '1': '0xb987F1aB0D7879b2aB421b98f96eFb44::MerkleDistributorScript::create', // main
                    '2': '', // proxima
                    '251': '', // barnard
                    '253': '0xb987F1aB0D7879b2aB421b98f96eFb44::MerkleDistributorScript::create', // halley
                    '254': '', // localhost
                }
                const functionId = airdropFunctionIdMap[AccountStore.currentNetworkVersion]
                const tyArgs = [airdrop.coin_type]
                const args = [req.data.data.airdrop_id, req.data.data.root, req.data.data.total, airdrop.airdrop_amount]
                const scriptFunction = await utils.tx.encodeScriptFunctionByResolve(functionId, tyArgs, args, `https://${AccountStore.network}-seed.starcoin.org`)
                const transactionHash = await AccountStore.wallet.signAndSubmitTransaction(scriptFunction)
                try {
                    let cli = new providers.JsonRpcProvider(`https://${AccountStore.network}-seed.starcoin.org`)
                    await cli.waitForTransaction(transactionHash, 1, 9000)
                    setState({open: true, vertical: vertical, horizontal: horizontal, message: " Airdrop is create !"});
                } catch (e) {
                    setState({
                        open: true,
                        vertical: vertical,
                        horizontal: horizontal,
                        message: "Airdrop create ERROR !"
                    });
                }

            }
        } else {
            let time = new Date().toUTCString();
            let signatrue = await AccountStore.wallet.signMessage({
                message: JSON.stringify(data),
                nonce: time,
                chainId: true,
                address: true
            });

            let sign = {
                nonce: signatrue.nonce,
                signature: signatrue.signature,
                chainId: signatrue.chainId,
                address: signatrue.address
            }
            let req = await API.upload({data: data, signature: sign})
            if (req.data.error === 400) {
                setState({open: true, vertical: vertical, horizontal: horizontal, message: req.data.data.toString()});
            } else if (req.data.error === 200) {
                let payload = {
                    type: "entry_function_payload",
                    function: `${contract_address}::airdrop::create_airdrop_by_id`,
                    type_arguments: [airdrop.coin_type],
                    arguments: [
                        '',
                        new Date().setDate(new Date().getDate() + 15),
                        Array.from(Buffer.from(req.data.data.root, 'hex')),
                        airdrop.coin_type,
                        Number(req.data.data.total),
                        req.data.data.airdrop_id
                    ]
                };
                let has = await AccountStore.wallet.signAndSubmitTransaction(payload)
                try {
                    let cli = new AptosClient(`https://fullnode.${AccountStore.network}.aptoslabs.com`)
                    await cli.waitForTransactionWithResult(has, {checkSuccess: true})
                    setState({open: true, vertical: vertical, horizontal: horizontal, message: " Airdrop is create !"});
                } catch (e) {
                    setState({
                        open: true,
                        vertical: vertical,
                        horizontal: horizontal,
                        message: "claim airdrop ERROR !"
                    });
                }
            }
        }
    }

    async function set_coin_type(chain: string, coin_type_id: number) {
        console.log(coin_type_id)
        if (chain === 'aptos') {
            if (coin_type_id === 2) {
                setAirdrop({
                    ...airdrop,
                    coin_type: "0x1::aptos_coin::AptosCoin",
                    coin_symbol: "APT",
                    coin_precision: "8"
                })
                setcoin_type_id(Number(coin_type_id))
            } else if (coin_type_id === 3) {
                setAirdrop({
                    ...airdrop,
                    coin_type: "0xc755e4c8d7a6ab6d56f9289d97c43c1c94bde75ec09147c90d35cd1be61c8fb9::STAR::STAR",
                    coin_symbol: "STAR",
                    coin_precision: "9"
                })
                setcoin_type_id(Number(coin_type_id))
            } else {
                setState({open: true, vertical: vertical, horizontal: horizontal, message: "当前网络不能选择此 Token"});
            }
        } else {
            if (coin_type_id === 1) {
                setAirdrop({
                    ...airdrop,
                    coin_type: "0x1::STC::STC",
                    coin_symbol: "STC",
                    coin_precision: "9"
                })
                setcoin_type_id(Number(coin_type_id))
            } else if (coin_type_id === 3) {
                setAirdrop({
                    ...airdrop,
                    coin_type: "0x8c109349c6bd91411d6bc962e080c4a3::STAR::STAR",
                    coin_symbol: "STAR",
                    coin_precision: "9"
                })
                setcoin_type_id(Number(coin_type_id))
            } else {
                setState({open: true, vertical: vertical, horizontal: horizontal, message: "当前网络不能选择此 Token"});
            }
        }
    }

    const handleClose = () => {
        setState({...state, open: false});
    };


    return (
        <div>
            <Snackbar
                anchorOrigin={{vertical, horizontal}}
                open={open}
                onClose={handleClose}
                message={message}
                key={vertical + horizontal}
            />

            <div>
                <div>
                    当前选择的文件:{File}
                    <p/>
                    空投总量: {airdrop.total}
                    <p/>
                    空投个数: {airdrop.airdrop_amount}
                    <p/>
                    空投代币：{airdrop.coin_type}
                    <p/>
                    空投名称：{airdrop.name}
                    <p/>
                    空投英文名称：{airdrop.name_en}
                    <p/>
                </div>
                <p></p>
                <div>活动中文名:
                    <TextField type='text' variant="outlined" defaultValue={airdrop.name} onChange={
                        (e) => {
                            setAirdrop({...airdrop, name: e.target.value})
                        }
                    }/>
                </div>
                <p></p>
                <div>活动英文名:<TextField type='text' variant="outlined" defaultValue={airdrop.name_en} onChange={
                    (e) => {
                        setAirdrop({...airdrop, name_en: e.target.value})
                    }
                }/>
                </div>
                <p></p>

                代币类型: <FormControl className={classes.formControl}>
                    <Select
                        value={coin_type_id}
                        onChange={(e) => {
                            set_coin_type(AccountStore.chain, e.target.value as number)
                        }}
                    >
                        <MenuItem value={0}>None</MenuItem>
                        {AccountStore.chain === 'starcoin' ? <MenuItem value={1}>STC</MenuItem> :
                            <MenuItem value={2}>APT</MenuItem>}
                        <MenuItem value={3}>STAR</MenuItem>
                    </Select>
                </FormControl>
                <p></p>
                <Dropzone
                    onDrop={onDrop}
                    accept=".csv"
                    minSize={1}
                >
                    {({getRootProps, getInputProps, isDragActive}) => {

                        return (
                            <div {...getRootProps()} className={classes.dropZoneArea}>
                                <input {...getInputProps()} />
                                {!isDragActive && '点击上传 csv 文件'}
                            </div>
                        )
                    }
                    }
                </Dropzone>
                <Button variant="outlined" color="primary" onClick={(e) => {
                    setConfirmOpen(true)
                }}>
                    Submit
                </Button>

                <Dialog
                    open={confirmOpen}
                    onClose={(e) => {
                        setConfirmOpen(false)
                    }}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"确认发起空投?"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description" component={'span'}>
                            空投总量: {airdrop.total}
                            <p/>
                            空投个数: {airdrop.airdrop_amount}
                            <p/>
                            空投代币：{airdrop.coin_type}
                            <p/>
                            空投名称：{airdrop.name}
                            <p/>
                            空投英文名称：{airdrop.name_en}
                            <p/>

                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={(e) => {
                            setConfirmOpen(false)
                        }} color="primary">
                            Disagree
                        </Button>
                        <Button disabled={!cansub} onClick={(e) => {
                            setConfirmOpen(false)
                            onSub()
                        }} color="primary" autoFocus>
                            Agree
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    )
}

export default ExcelUpload