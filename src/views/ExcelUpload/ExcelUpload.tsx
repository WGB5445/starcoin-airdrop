import {Button, createStyles, FormHelperText, InputLabel, makeStyles, TextField, Theme} from '@material-ui/core';
import React, {useEffect, useMemo, useState} from 'react'
import Dropzone from 'react-dropzone'
import API from '../../api/api'
import * as ed from '@noble/ed25519';
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
import { arrayify, hexlify, BytesLike } from '@ethersproject/bytes';
import {create_airdrop, parse_csv} from "../../lib/merkletree";
import {useStores} from "../../useStore";
import {utils, bcs,starcoin_types,encoding} from "@starcoin/starcoin";
import {PROJECT} from "../../lib/project";
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
    const [coin_type_id , setcoin_type_id] = React.useState(0);
    const [network, setNetwork] = React.useState('Aptos');
    const [airdrop, setAirdrop] = React.useState({
        name: "",
        name_en:"",
        coin_type:"0x1::aptos_coin::AptosCoin",
        coin_symbol:"APT",
        coin_precision:"8",
        total:"",
        airdrop_amount:0,
    });

    const [confirmOpen, setConfirmOpen] = React.useState(false);

    const [state, setState] = React.useState<State>({
        open: false,
        vertical: 'top',
        horizontal: 'center',
        message: ""
    });
    const {vertical, horizontal, open, message} = state;
    async function onDrop(file: any) {
        const reader = new FileReader()
        reader.onload = async () => {
            let binaryStr = reader.result || new ArrayBuffer(0)
            let binary: Buffer | void = (binaryStr instanceof ArrayBuffer) ? Buffer.from(binaryStr) : Buffer.from(binaryStr)
            try{
                setAirdrop({...airdrop, total: BigInt(0).toString(),airdrop_amount:0})
                let {
                    total,
                    len
                } = create_airdrop(binary.toString('utf8'),airdrop.coin_type,Number (airdrop.coin_precision));
                setAirdrop( {...airdrop, total: (Number(total) /Math.pow(10,Number(airdrop.coin_precision))).toString() ,airdrop_amount: len})
                console.log(total)
                SetCsv(binary.toString('utf8'))
                SetFile(file[0].name);
            }catch (e){
                setState({open: true, vertical: vertical, horizontal: horizontal, message: e.message});
            }

        }
        reader.readAsArrayBuffer(file[0]);
    }

    async function onSub() {
        console.log(AccountStore.currentNetworkVersion)
        let data = {
            project:`${PROJECT}`,
            name: airdrop.name,
            name_en: airdrop.name_en,
            token: airdrop.coin_type,
            token_symbol: airdrop.coin_symbol,
            token_precision: airdrop.coin_precision,
            chain: AccountStore.chain,
            chainid: AccountStore.currentNetworkVersion,
            csv: csv,
            address:AccountStore.currentAccount,
            time:new Date().toUTCString()
        }

        if (csv == "") {
            setState({open: true, vertical: vertical, horizontal: horizontal, message: "csv is empty"});
            return
        }
        if (AccountStore.chain == "starcoin"){
            let sign = await window.starcoin.request({
                method: 'personal_sign',
                params: [Buffer.from(JSON.stringify(data),'utf8').toString('hex'), AccountStore.currentAccount],
            })
            let req = await API.upload({data: data, signature: sign})
            if (req.data.error == 400) {
                setState({open: true, vertical: vertical, horizontal: horizontal, message: req.data.data.toString()});
            } else if (req.data.error == 200) {
                // let payload = {
                //     type: "entry_function_payload",
                //     function: `${contract_address}::airdrop::create_airdrop_by_id`,
                //     type_arguments: [airdrop.coin_type],
                //     arguments: [
                //         '',
                //         new Date().setDate(new Date().getDate() + 15),
                //         Array.from(Buffer.from(req.data.data.root, 'hex')),
                //         airdrop.coin_type,
                //         Number(req.data.data.total),
                //         req.data.data.airdrop_id
                //     ]
                // };
                // let has = await AccountStore.wallet.signAndSubmitTransaction(payload)
            }
        }else{
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
            if (req.data.error == 400) {
                setState({open: true, vertical: vertical, horizontal: horizontal, message: req.data.data.toString()});
            } else if (req.data.error == 200) {
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
            }
        }

        // let req = await API.upload({data: data, signature: sign})
        // if (req.data.error == 400) {
        //     setState({open: true, vertical: vertical, horizontal: horizontal, message: req.data.data.toString()});
        // } else if (req.data.error == 200) {
        //     let payload = {
        //         type: "entry_function_payload",
        //         function: `${contract_address}::airdrop::create_airdrop_by_id`,
        //         type_arguments: [airdrop.coin_type],
        //         arguments: [
        //             '',
        //             new Date().setDate(new Date().getDate() + 15),
        //             Array.from(Buffer.from(req.data.data.root, 'hex')),
        //             airdrop.coin_type,
        //             Number(req.data.data.total),
        //             req.data.data.airdrop_id
        //         ]
        //     };
        //     let has = await AccountStore.wallet.signAndSubmitTransaction(payload)
        // }
    }

    function set_coin_type(chain:string, coin_type_id:number){
        if(chain === 'aptos'){
            if(coin_type_id == 2){
                setAirdrop({...airdrop,coin_type: "0x1::aptos_coin::AptosCoin"})
                setAirdrop({...airdrop,coin_symbol: "APT"})
                setAirdrop({...airdrop,coin_precision: "8"})

                setcoin_type_id(Number(coin_type_id))
            }else if(coin_type_id == 3){
                setAirdrop({...airdrop,
                    coin_type: "0x8c109349c6bd91411d6bc962e080c4a3::STAR::STAR",
                    coin_symbol: "STAR",
                    coin_precision: "9"
                })
                setcoin_type_id(Number(coin_type_id))
            }else{
                setState({open: true, vertical: vertical, horizontal: horizontal, message: "当前网络不能选择此 Token"});
            }
        }else {
            if(coin_type_id == 1){
                setAirdrop({...airdrop,
                    coin_type: "0x1::STC::STC",
                    coin_symbol: "STC",
                    coin_precision: "9"
                })
                setcoin_type_id(Number(coin_type_id))
            }else if(coin_type_id== 3){
                setAirdrop({...airdrop,
                    coin_type: "0x8c109349c6bd91411d6bc962e080c4a3::STAR::STAR",
                    coin_symbol: "STAR",
                    coin_precision: "9"
                })
                setcoin_type_id(Number(coin_type_id))
            }else {
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

            <div>
                <div>
                    当前选择的文件:{File}
                </div>
                <p></p>
                <div>活动中文名:
                    <TextField type='text' variant="outlined" defaultValue={airdrop.name} onChange={
                        (e) => {
                            setAirdrop({...airdrop,name: e.target.value})
                        }
                    }/>
                </div>
                <p></p>
                <div>活动英文名:<TextField type='text' variant="outlined" defaultValue={airdrop.name_en}  onChange={
                    (e) => {
                        setAirdrop({...airdrop,name_en: e.target.value})
                    }
                }/>
                </div>
                <p></p>


                <FormControl className={classes.formControl}>
                    <InputLabel >Coin Type</InputLabel>
                    <Select
                        value={coin_type_id}
                        onChange={(e)=>{
                            set_coin_type(AccountStore.chain ,e.target.value as number)
                        }}
                    >
                        <MenuItem value={0}>None</MenuItem>
                        {AccountStore.chain === 'starcoin'?<MenuItem value={1}>STC</MenuItem>:<MenuItem value={2}>APT</MenuItem>}
                        <MenuItem value={3}>STAR</MenuItem>
                    </Select>
                </FormControl>
                <p></p>
                <Button variant="outlined" color="primary" onClick={(e) => {
                    setConfirmOpen(true)
                }}>
                    Submit
                </Button>

                <Dialog
                    open={confirmOpen}
                    onClose={(e)=>{
                        setConfirmOpen(false)
                    }}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"确认发起空投?"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description" component={'span'}>
                            空投总量: {airdrop.total }
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
                        <Button onClick={(e)=>{
                            setConfirmOpen(false)
                        }} color="primary">
                            Disagree
                        </Button>
                        <Button onClick={(e)=>{
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