import React, {useEffect, useState} from 'react'
import {makeStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import {Box, Button, ButtonGroup} from '@material-ui/core';
// import TranslateIcon from '@material-ui/icons/Translate';
// import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {useStores} from '../../useStore'
import {observer} from 'mobx-react';
// import IconButton from '@material-ui/core/IconButton';
// import MenuIcon from '@material-ui/icons/Menu';
import {useTranslation} from 'react-i18next';
import {Wallet} from "../../lib/wallet.js"
import {str} from "@starcoin/starcoin/dist/src/lib/runtime/serde";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    appbar: {
        backgroundColor: '#ffffff',
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
        color: '#000'
    },
    iconTr: {
        marginRight: '0.3rem'
    },
    selectComp: {
        color: '#1C4BDE',
        marginRight: '0.5rem',
        '& .MuiSelect-select': {
            paddingRight: '28px'
        },
        '& .MuiSelect-icon': {
            top: '3px',
            color: '#1C4BDE'
        }
    },
    buttonStyle: {
        color: '#1C4BDE',
        borderColor: '#1C4BDE',
        borderRadius: '25px',
        marginRight: '0.3rem'
    },
    darkBgButton: {
        color: '#000',
        backgroundColor: '#F7F9FA',
        borderRadius: '25px',
        marginRight: '0.3rem'
    },
    logo: {
        width: '195px',
        height: '40px'
    }
}));

interface aptos_chain_map{
    "1":string,
    "2":string,
}
interface starcoin_chain_map{
    '1':string,
    '251':string,
    '252':string,
    '253':string
}

const aptos_map :aptos_chain_map ={
    "1":"mainnet",
    "2":"testnet"
}

const starcoin_map :starcoin_chain_map ={
    "1":"main",
    "251":"barnard",
    "252":"proxima",
    "253":"halley"
}

function get_chain_network_name(chain:string, network_version:string):string{
    if(chain === 'starcoin'){
       return  starcoin_map[network_version as keyof starcoin_chain_map]
    }else if(chain === 'aptos'){
        return aptos_map[network_version as keyof aptos_chain_map]
    }
    return ""
}


const Headers: React.FC = () => {
    const {t, i18n} = useTranslation();
    const classes = useStyles();
    const [accountStatus, setAccountStatus] = useState(-1)
    const {AccountStore} = useStores()
    const [chain, setChain] = useState("starcoin");

    useEffect(() => {
        (async () => {
            if (window.starcoin ) {
                let networkVersion: keyof starcoin_chain_map | keyof aptos_chain_map= await window.starcoin.networkVersion;
                AccountStore.setWallet(new Wallet(window.starcoin,chain,"starmask"));
                setAccountStatus(0)
                if(  window.starcoin.selectedAddress ) {
                   let addr:string = await AccountStore.wallet.account()
                    AccountStore.setCurrentAccount(addr)
                    if(AccountStore.currentAccount.length == 66 ){
                        AccountStore.setChain("aptos")
                        setChain("aptos")
                    }else {
                        AccountStore.setChain("starcoin")
                        setChain("starcoin")
                    }
                    AccountStore.setCurrentNetworkVersion(await AccountStore.wallet.network())
                    AccountStore.setNetwork( get_chain_network_name(AccountStore.chain, AccountStore.currentNetworkVersion))

                    setAccountStatus(1)
                }

            } else {
                setAccountStatus(-1)
            }
        })();

    }, [AccountStore.accountStatus])

    useEffect(()=>{
            window.starcoin.on('accountsChanged', (accounts: any)=>{
                if (accounts.length === 0) {
                    setAccountStatus(0)
                } else {
                    AccountStore.setCurrentAccount(accounts[0])
                    if(accounts[0].length == 66 ){
                        AccountStore.setChain("aptos")
                        setChain("aptos")
                    }else {
                        AccountStore.setChain("starcoin")
                        setChain("starcoin")
                    }
                }
            })
            window.starcoin.on('networkChanged', (network: any)=>{
                AccountStore.setCurrentNetworkVersion(network)
                AccountStore.setNetwork( get_chain_network_name(AccountStore.chain, AccountStore.currentNetworkVersion))
            })
    },[])

    useEffect(()=>{
        AccountStore.setWallet(new Wallet(window.starcoin,chain,"starmask"));
    },[chain])


    async function connectWallet() {
        if (accountStatus === 0) {
            await AccountStore.wallet.connect();
            let addr = await AccountStore.wallet.account();

            setAccountStatus(1)
            AccountStore.setAccountStatus(1)
            AccountStore.setCurrentAccount(addr || '')
            AccountStore.setNetwork( get_chain_network_name(AccountStore.chain, AccountStore.currentNetworkVersion))
        } else if (accountStatus === -1) {
            window.open("https://chrome.google.com/webstore/detail/starmask/mfhbebgoclkghebffdldpobeajmbecfk")
        }
    }

    const changeLanguage = (lng: any) => {
        i18n.changeLanguage(lng);
    }

    return (
        <div className={classes.root}>
            <AppBar position="static" className={classes.appbar}>
                <Toolbar>
                    {/* <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton> */}
                    <Typography variant="h6" className={classes.title}>
                        {t('airdrop.title')}
                    </Typography>

                    <Box display="flex" alignItems="center" style={{marginRight: '1.5rem'}}>
                        <ButtonGroup size="small" disableElevation variant="contained">
                            <Button color="primary" onClick={() => changeLanguage('en')}>English</Button>
                            <Button color="secondary" onClick={() => changeLanguage('zh')}>中文</Button>
                        </ButtonGroup>
                    </Box>

                    {/* <Box display="flex" alignItems="center">
            <TranslateIcon className={classes.iconTr}/>
            <Select defaultValue="1" className={classes.selectComp} disableUnderline IconComponent={ExpandMoreIcon}>
              <MenuItem value={1}>
                English
              </MenuItem>
            </Select>
          </Box> */}
                    <Box display="flex" alignItems="center">
                        {accountStatus === 1 ? <Button variant="outlined" className={classes.darkBgButton}>
                            {AccountStore.chain}
                        </Button> : null}
                        {accountStatus === 1 ? <Button variant="outlined" className={classes.darkBgButton}>
                            {AccountStore.network}
                        </Button> : null}
                        <Button variant="outlined" className={classes.buttonStyle} onClick={connectWallet}>
                            {accountStatus === -1 ? t('airdrop.installWallet') : ''}
                            {accountStatus === 0 ? t('airdrop.connectWallet') : ''}
                            {accountStatus === 1 ? AccountStore.currentAccount.substr(0, 4) + '....' + AccountStore.currentAccount.substring(AccountStore.currentAccount.length - 4) : ''}
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
        </div>
    );
}

export default observer(Headers)