import './utils/i18n';
import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './views/App/App'
import reportWebVitals from './reportWebVitals';
import theme from './theme'
import {CircularProgress, ThemeProvider} from '@material-ui/core';

const Loader = () => (
    <CircularProgress size={20}/>
);

ReactDOM.render(
    <ThemeProvider theme={theme}>
        <Suspense fallback={<Loader/>}>
            <App/>
        </Suspense>
    </ThemeProvider>,
    document.getElementById('root')
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
