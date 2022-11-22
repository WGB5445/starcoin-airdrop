import React, {useEffect, useMemo, useState} from 'react'
import {Box, Button, Grid, LinearProgress, makeStyles, Paper, Typography} from '@material-ui/core'
import Pagination from '@material-ui/lab/Pagination';
import API from '../../api/api'
import CheckCircleRoundedIcon from '@material-ui/icons/CheckCircleRounded';
import CancelRoundedIcon from '@material-ui/icons/CancelRounded';
import {blue, green, red} from '@material-ui/core/colors';
import {useStores} from '../../useStore'
import {observer} from 'mobx-react';
import BigNumber from 'bignumber.js';
import {useTranslation} from 'react-i18next';
import {contract_address} from "../../lib/contract";
import {AptosClient} from "aptos";
import Account from "../../store/account";
import Snackbar, {SnackbarOrigin} from "@material-ui/core/Snackbar";

const useStyles = makeStyles(() => ({
    shape: {
        borderRadius: '1.5rem',
    },
    disabledButton: {
        color: 'rgb(140, 149, 159)',
        backgroundColor: 'rgb(246, 248, 250)',
        border: '1px solid rgba(27, 31, 36, 0.15)'
    },
    paperContent: {
        padding: '1.5rem 0'
    },
    tableContent: {
        margin: '1rem 0',
    },
    inProgress: {
        '&.MuiLinearProgress-colorPrimary': {
            backgroundColor: blue[100],
            '& .MuiLinearProgress-barColorPrimary': {
                backgroundColor: blue[600]
            }
        },
    },
    inProgressBtn: {
        color: red[400]
    },
    successProgress: {
        '&.MuiLinearProgress-colorPrimary': {
            backgroundColor: green[100],
            '& .MuiLinearProgress-barColorPrimary': {
                backgroundColor: green[600]
            }
        },
    },
    successProgressBtn: {
        color: green[400]
    },
    endProgress: {
        '&.MuiLinearProgress-colorPrimary': {
            backgroundColor: red[100],
            '& .MuiLinearProgress-barColorPrimary': {
                backgroundColor: red[600]
            }
        },
    },
    endProgressBtn: {
        color: red[400]
    },
    tokenIcon: {
        width: '40px',
        height: '40px',
        marginTop: '0.1rem',
        marginRight: '0.35rem'
    },
    textNotes: {
        fontSize: '12px'
    },
    pageContainer: {
        padding: '15px 20px',
        marginBottom: '20px'
    }
}));

declare global {
    interface window {
        petra: any
    }
}
export interface State extends SnackbarOrigin {
    open: boolean;
    message: string
}

function get_num_network_version(chain:string, network_version:string):string{
        return  network_version
}

const getList = async (args: { chain: string; address: string; network_version: string }): Promise<any> => {
    return await API.getList({
        addr: args.address,
        networkVersion: args.network_version,
        chain: args.chain
    })
}


async function checkStatus(data: any, network: string) {
    let resource_url = `https://fullnode.${network}.aptoslabs.com/v1/accounts/${data.Address}/resource/${contract_address}::airdrop::UserAirDrop`
    let table_url = `https://fullnode.${network}.aptoslabs.com/v1/tables`;
    return await API.get_state(resource_url, table_url, data.AirdropId)
}

const Home: React.FC = () => {
    const {t, i18n} = useTranslation();
    const classes = useStyles();
    const [rows, setRows] = useState<any[]>([])
    const [count, setCount] = useState(0)
    const [network, setNetwork] = useState('')
    const {AccountStore} = useStores()
    const [state, setState] = React.useState<State>({
        open: false,
        vertical: 'top',
        horizontal: 'center',
        message: ""
    });
    const {vertical, horizontal, open, message} = state;

    function formatBalance(num: string | number, Precision: number | string) {
        const value = new BigNumber(num);
        return value.div(Math.pow(10, Number(Precision))).toFormat();
    }

    useMemo(() => {

        (async () => {

            if (!AccountStore.wallet || !AccountStore.currentAccount || !AccountStore.currentNetworkVersion) {
                return
            }

            let networkVersion: string = await AccountStore.wallet.network()
            let data = await getList({
                network_version: get_num_network_version(AccountStore.chain,networkVersion),
                chain:AccountStore.chain,
                address: AccountStore.currentAccount
            })
            console.log("3"+AccountStore.currentNetworkVersion)
            console.log("3"+AccountStore.currentAccount)
            if (!data || !data.data) {
                return
            }
            for (let i = 0; i < data.data.length; i++) {
                let s = new Date(data.data[i].StartAt).valueOf()
                let n = new Date().valueOf()
                let end = new Date(data.data[i].EndAt).valueOf()
                data.data[i]['progress'] = ((n - s) / (end - s)) * 100
                //status: 0-default, 1-已领取, 2-结束, 3-未领取
                if ([0, 3].includes(data.data[i]['Status'])) {
                    let r = await checkStatus(data.data[i], AccountStore.network)
                    if (r) {
                        if (data.data[i]['Status'] === 3) {
                            await API.updateStats({
                                networkVersion,
                                address: AccountStore.currentAccount,
                                id: data.data[i].Id,
                                status: data.data[i]['Status']
                            })
                        }
                        data.data[i]['Status'] = 1
                    } else {
                        data.data[i]['Status'] = 3
                    }
                    let startTime: number = new Date().valueOf()
                    let endTime: number = new Date(data.data[i].EndAt).valueOf()
                    if (endTime <= startTime) {
                        data.data[i]['Status'] = 2
                    }

                    await API.updateStats({
                        networkVersion,
                        address: AccountStore.currentAccount,
                        id: data.data[i].Id,
                        status: data.data[i]['Status']
                    })
                }

            }
            setRows(data.data)
        })();
    }, [AccountStore.currentAccount, AccountStore.currentNetworkVersion])

    async function claimAirdrop(Id: number) {
        const record = rows.find(o => o.Id === Id)

        const airdropFunctionIdMap: any = {
            '1': `${contract_address}::airdrop::airdrop`, // main
            '2': `${contract_address}::airdrop::airdrop`, // testnet
        }
        const functionId = airdropFunctionIdMap[AccountStore.currentNetworkVersion]
        if (!functionId) {
            window.alert('当前网络没有部署领取空投合约，请切换再重试!')
            return false;
        }
        //vector<bool> - > Array<bool>
        let proof: string[] = JSON.parse(record.Proof).map((x: string) => x);
        let proofs: Array<Array<number>> = []
        proofs = proof.map((x) =>
            Array.from(Buffer.from(x, 'hex'))
        )
        const payload = {
            type: "entry_function_payload",
            function: functionId,
            type_arguments: [record.Token],
            arguments: [
                parseInt(record.Amount),
                parseInt(record.AirdropId),
                proofs
            ]
        };
        let txn = await AccountStore.wallet.signAndSubmitTransaction(payload);

        if(AccountStore.chain == "aptos"){
                let cli = new AptosClient(`https://fullnode.${AccountStore.network}.aptoslabs.com`)
                try {
                    await cli.waitForTransactionWithResult(txn, {checkSuccess: true})
                    window.location.reload(false);
                }catch (e){
                    setState({open: true, vertical: vertical, horizontal: horizontal, message: "claim airdrop ERROR !"});
                }

        };

        // if (hash) {
        //     let cli = new AptosClient(`https://fullnode.${AccountStore.network}.aptoslabs.com`)
        //     await cli.waitForTransactionWithResult(hash.hash, {checkSuccess: true})
        //     window.location.reload(false);
        // } else {
        //     console.error('Status Updated fail')
        //     // this.forceUpdate();
        //     // window.location.reload(false);
        // }
    }

    function SuccessProgressbar(props: any) {
        let valid = props.valid
        let total = props.total
        return (<Box display="flex" alignItems="center">
            <LinearProgress className={classes.successProgress} variant="determinate"
                            style={{flexGrow: 1, marginRight: '0.5rem'}} value={(valid / total) * 100}></LinearProgress>
            <CheckCircleRoundedIcon className={classes.successProgressBtn}/>
        </Box>)
    }

    function InProgressbar(props: any) {
        let valid = props.valid
        let timeDiff = props.timeDiff
        return (
            <Box display="flex" alignItems="center">
                <LinearProgress className={classes.inProgress} variant="determinate"
                                style={{flexGrow: 1, marginRight: '0.5rem'}} value={valid}></LinearProgress>
                <Typography className={classes.textNotes}>{timeDiff}</Typography>
            </Box>
        )
    }

    function EndProgressbar(props: any) {
        let valid = props.valid
        let total = props.total
        return (
            <Box display="flex" alignItems="center">
                <LinearProgress className={classes.endProgress} variant="determinate"
                                style={{flexGrow: 1, marginRight: '0.5rem'}}
                                value={(valid / total) * 100}></LinearProgress>
                <CancelRoundedIcon className={classes.endProgressBtn}/>
            </Box>
        )
    }

    function getTimeDiff(end: string) {
        let startTime: number = new Date().valueOf()
        let endTime: number = new Date(end).valueOf()
        if (endTime <= startTime) {
            return ''
        }
        let daysDiff: number = 1000 * 3600 * 24
        if (daysDiff < (endTime - startTime)) {
            let days: number = Math.floor((endTime - startTime) / daysDiff)
            let hours: number = Math.floor(((endTime - startTime) - (days * daysDiff)) / 3600000)
            return `${days}${t('airdrop.day')}${hours}${t('airdrop.hour')}`
        } else {
            let hours: number = Math.floor((endTime - startTime) / 3600000)
            let minutes: number = Math.floor(((endTime - startTime) - (hours * 3600000)) / 60000)
            return `${hours}${t('airdrop.hour')}${minutes}${t('airdrop.min')}`
        }
    }

    function CustTablebody(props: any) {
        let rows = props.rows
        if (rows.length > 0) {
            return (
                rows.map((row: any, index: any) => {
                    row.timediff = getTimeDiff(row.EndAt)
                    return <Paper key={index} className={classes.pageContainer} elevation={2}>
                        <Grid container>
                            <Grid item xs={4}>
                                <Box display="flex" alignItems="center">
                                    <Box>
                                        <img alt="stc" className={classes.tokenIcon}
                                             src={`/img/${row.Symbol.toLowerCase()}.svg`}/>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2">{row.Symbol}</Typography>
                                        <Typography className={classes.textNotes}>
                                            {
                                                i18n.language === 'zh' ?
                                                    row.Name : row.NameEN
                                            }
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={2}>
                                <Box>
                                    <Typography variant="subtitle2">{t('airdrop.amount')}</Typography>
                                    <Typography
                                        className={classes.textNotes}>{formatBalance(row.Amount, row.Precision)} {row.Symbol}</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={2}>
                                <Box>
                                    <Typography variant="subtitle2">{t('airdrop.startTime')}</Typography>
                                    <Typography className={classes.textNotes}>{row.StartAt.substr(0, 16)}</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={2} container direction="row" justifyContent="center" alignItems="center">
                                <Grid xs item>
                                    {row.Status === 1 ? <SuccessProgressbar valid={row.progress}/> : ''}
                                    {row.Status === 3 ?
                                        <InProgressbar valid={row.progress} timeDiff={row.timediff}/> : ''}
                                    {row.Status === 2 ? <EndProgressbar valid={row.progress}/> : ''}
                                </Grid>

                            </Grid>
                            <Grid container item xs={2} direction="row" justifyContent="center" alignItems="center">
                                <Box>
                                    {row.Status === 2 ?
                                        <Button className={classes.shape} style={{textTransform: 'none'}}
                                                variant="contained" disabled>{t('airdrop.expired')}</Button> : ''}
                                    {row.Status === 3 ?
                                        <Button className={classes.shape} style={{textTransform: 'none'}}
                                                variant="contained" color="primary"
                                                onClick={() => claimAirdrop(row.Id)}>{t('airdrop.claim')}</Button> : ''}
                                    {row.Status === 1 ? <Button className={`${classes.shape} ${classes.disabledButton}`}
                                                                style={{textTransform: 'none'}} variant="contained"
                                                                disabled>{t('airdrop.claimed')}</Button> : ''}
                                    {row.Status === 0 ?
                                        <Button className={classes.shape} style={{textTransform: 'none'}}
                                                variant="contained" disabled>{t('airdrop.getStatus')}</Button> : ''}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                })
            )
        } else {
            return (
                <Paper className={classes.pageContainer} elevation={2}>
                    <Typography align="center">{t('airdrop.noData')}</Typography>
                </Paper>
            )
        }
    }


    return (
        <div>
            <CustTablebody rows={rows}/>
            <Snackbar
                anchorOrigin={{vertical, horizontal}}
                open={open}
                onClose={()=>{
                    setState({...state, open: false});
                }}
                message={message}
                key={vertical + horizontal}
            />
            <Grid container justifyContent="flex-end">
                <Pagination count={count / 10 + 1}/>
            </Grid>
        </div>
    )
}

export default observer(Home)