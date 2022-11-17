import React from "react";
import {BrowserRouter, Switch} from 'react-router-dom';
import routes from '../../router';
import {RouteWithSubRoutes} from '../../assets/common';
import {RouteInterface} from '../../assets/interface';
import Header from "../../components/Header/Header";
import {makeStyles} from "@material-ui/core";
import {useStores} from '../../useStore'
import {observer} from "mobx-react";


const useStyles = makeStyles((theme) => ({
    root: {
        margin: '5rem'
    },
}));

declare global {
    interface Window {
        petra: any
    }
}

const App = () => {
    const classes = useStyles();
    const {AccountStore} = useStores()
    return (
        <div>
            <Header/>
            <div className={classes.root}>
                <BrowserRouter>
                    <Switch>
                        {routes.map((route: RouteInterface, i: number) => {
                            return RouteWithSubRoutes(route, i)
                        })}
                    </Switch>
                </BrowserRouter>
            </div>
        </div>

    )
}

export default observer(App)