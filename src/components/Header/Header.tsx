import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { Box, Button, MenuItem, Select } from '@material-ui/core';
import TranslateIcon from '@material-ui/icons/Translate';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useStores } from '../../useStore'
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
// import IconButton from '@material-ui/core/IconButton';
// import MenuIcon from '@material-ui/icons/Menu';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  iconTr: {
    marginRight: '0.3rem'
  },
  selectComp: {
    color: '#ffffff',
    marginRight: '0.5rem',
    '& .MuiSelect-select': {
      paddingRight: '28px'
    },
    '& .MuiSelect-icon': {
      top: '3px',
      color: '#ffffff'
    }
  },
  buttonStyle: {
    color: '#ffffff',
    borderColor: '#ffffff'
  }
}));

const Headers: React.FC = () => {
  const classes = useStyles();
  const [accountStatus, setAccountStatus] = useState(-1)
  const [accountAddress, setAccountAddress] = useState('')
  const { AccountStore } = useStores()
  useEffect(() => {
    console.log(window.starcoin && window.starcoin.selectedAddress,  window.starcoin.selectedAddress)
    if (window.starcoin && window.starcoin.selectedAddress ) {
      setAccountStatus(1)
    } else if (AccountStore.isInstall) {
      setAccountStatus(0)
    } else {
      setAccountStatus(-1)
    }
  },[AccountStore.isInstall, AccountStore.accountList, AccountStore.accountStatus])
  window.starcoin.on('accountsChanged', handleNewAccounts)

  function handleNewAccounts(accounts: any) {
    if(accounts.length === 0 ) {
      setAccountStatus(0)
      console.log(accountStatus)
    }
  }

  useEffect(() => {
    if (window.starcoin && window.starcoin._state.accounts.length > 0) {
      setAccountAddress(window.starcoin._state.accounts[0])
    } 
  },[])
  function connectWallet() {
    if(AccountStore.accountStatus === 0) {
      window.starcoin.request({
        method: 'stc_requestAccounts',
      }).then((res: any) => {
        console.log('-->', res)
        if(res.length > 0) {
          AccountStore.setAccountStatus(1)
          setAccountAddress(res[0] || '')
          AccountStore.setCurrentAccount(res[0] || '')
        }
      })
    } else if (AccountStore.accountStatus === -1) {
      window.open("https://chrome.google.com/webstore/detail/starmask/mfhbebgoclkghebffdldpobeajmbecfk")
    }
  }

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          {/* <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton> */}
          <Typography variant="h6" className={classes.title}>
            StarCoin Airdrop
          </Typography>
          <Box display="flex" alignItems="center">
            <TranslateIcon className={classes.iconTr}/>
            <Select defaultValue="1" className={classes.selectComp} disableUnderline IconComponent={ExpandMoreIcon}>
              <MenuItem value={1}>
                English
              </MenuItem>
            </Select>
          </Box>
          <Box display="flex" alignItems="center">
            <Button variant="outlined" className={classes.buttonStyle} onClick={connectWallet}>
              {window.starcoin.selectedAddress ? window.starcoin.selectedAddress.substr(0,4) + '....' + window.starcoin.selectedAddress.substring(window.starcoin.selectedAddress.length - 4) :'Connect Wallet ' }
              
              {accountStatus === -1 ? 'Install Wallet':''}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default observer(Headers) 