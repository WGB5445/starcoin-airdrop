import {Button, makeStyles, TextField} from '@material-ui/core';
import React, {useState} from 'react'
import Dropzone from 'react-dropzone'
import API from '../../api/api'
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Snackbar, {SnackbarOrigin} from '@material-ui/core/Snackbar';
import {contract_address} from "../../lib/contract";

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

    async function onDrop(file: any) {
        const reader = new FileReader()
        reader.onload = async () => {
            let binaryStr = reader.result || new ArrayBuffer(0)
            let binary: Buffer | void = (binaryStr instanceof ArrayBuffer) ? Buffer.from(binaryStr) : Buffer.from(binaryStr)
            SetCsv(binary.toString('utf8'))
        }
        reader.readAsArrayBuffer(file[0])
        SetFile(file[0].name)
    }

    async function onSub() {
        let data = {
            name: zhname,
            name_en: enname,
            token: coin_type,
            token_symbol: coin_symbol,
            token_precision: coin_precision,
            chain: network,
            csv: csv
        }

        if (csv == "") {
            setState({open: true, vertical: vertical, horizontal: horizontal, message: "csv is empty"});
            return
        }

        let time = new Date().toUTCString();
        let signatrue = await window.petra.signMessage({
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
                type_arguments: [coin_type],
                arguments: [
                    '',
                    new Date().setDate(new Date().getDate() + 15),
                    Array.from(Buffer.from(req.data.data.root, 'hex')),
                    coin_type,
                    Number(req.data.data.total),
                    req.data.data.airdrop_id
                ]
            };
            let has = await window.petra.signAndSubmitTransaction(payload)
        }
    }

    const [network, setNetwork] = React.useState('Aptos');
    const [zhname, setZhname] = React.useState('');
    const [enname, setEnname] = React.useState('');
    const [coin_type, setCoin_type] = React.useState('');
    const [coin_symbol, setCoin_symbol] = React.useState("");

    const [coin_precision, setCoin_precision] = React.useState("");
    const [networkversion, setNetworkversion] = React.useState(1);

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
                    <TextField type='text' variant="outlined" onChange={
                        (e) => {
                            setZhname(e.target.value)
                        }
                    }/>
                </div>
                <p></p>
                <div>活动英文名:<TextField type='text' variant="outlined" onChange={
                    (e) => {
                        setEnname(e.target.value)
                    }
                }/>
                </div>
                <p></p>
                <div>选择网络:
                    <FormControl>
                        <Select
                            value={network}
                            onChange={(e) => {
                                setNetwork(e.target.value as string);
                            }}
                        >
                            <MenuItem value={'Aptos'}>Aptos</MenuItem>
                        </Select>
                    </FormControl></div>
                <p></p>
                <div>网络: <FormControl>
                    <Select
                        value={networkversion}
                        onChange={(e) => {
                            setNetworkversion(parseInt(e.target.value as string));
                        }}
                    >
                        <MenuItem value={1}>Mainnet</MenuItem>
                        <MenuItem value={2}>Testnet</MenuItem>
                        <MenuItem value={36}>Devnet</MenuItem>

                    </Select>
                </FormControl></div>
                <p></p>
                <div>发放币种:<TextField type='text' variant="outlined" onChange={(e) => {
                    setCoin_type(e.target.value)
                }}/></div>
                <p></p>
                <div>币种缩写:<TextField type='text' variant="outlined" onChange={(e) => {
                    setCoin_symbol(e.target.value)
                }}/>
                </div>
                <p></p>
                <div>发放精度:<TextField type='text' variant="outlined" onChange={(e) => {
                    setCoin_precision(e.target.value)
                }}/></div>

                <p></p>
                <Button variant="outlined" color="primary" onClick={(e) => {
                    onSub()
                }}>
                    Submit
                </Button>
            </div>
        </div>
    )
}

export default ExcelUpload