import {Button, makeStyles, TextField} from '@material-ui/core';
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

import {create_airdrop, parse_csv} from "../../lib/merkletree";
import {useStores} from "../../useStore";
const useStyles = makeStyles((theme) => ({
    dropZoneArea: {
        background: '#004c807d',
        padding: '8rem 2rem',
        textAlign: 'center',
        color: '#ffffff',
        border: '1px dashed',
    }
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
        let data = {
            name: airdrop.name,
            name_en: airdrop.name_en,
            token: airdrop.coin_type,
            token_symbol: airdrop.coin_symbol,
            token_precision: airdrop.coin_precision,
            chain: network,
            csv: csv
        }

        if (csv == "") {
            setState({open: true, vertical: vertical, horizontal: horizontal, message: "csv is empty"});
            return
        }
        const transaction = {
            type: 'entry_function_payload',
            function: '0x1::coin::transfer',
            type_arguments: ['0x1::aptos_coin::AptosCoin'],
            arguments: ["0x1", 1],
        };

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
    // const [networkversion, setNetworkversion] = React.useState(1);

    const [confirmOpen, setConfirmOpen] = React.useState(false);

    const [state, setState] = React.useState<State>({
        open: false,
        vertical: 'top',
        horizontal: 'center',
        message: ""
    });
    const {vertical, horizontal, open, message} = state;


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
                <div>发放币种:<TextField type='text' variant="outlined" defaultValue={airdrop.coin_type} onChange={(e) => {
                    setAirdrop({...airdrop,coin_type: e.target.value})
                }}/></div>
                <p></p>
                <div>币种缩写:<TextField type='text' variant="outlined" defaultValue={airdrop.coin_symbol} onChange={(e) => {
                    setAirdrop({...airdrop,coin_symbol: e.target.value})
                }}/>
                </div>
                <p></p>
                <div>发放精度:<TextField type='text' variant="outlined" defaultValue={airdrop.coin_precision} onChange={(e) => {
                    setAirdrop({...airdrop,coin_symbol: e.target.value})
                }}/></div>

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