import Home from '../views/Home/Home';
import ExcelUpload from '../views/ExcelUpload/ExcelUpload'

const routes = [
    {
        path: '/admin',
        component: ExcelUpload
    },
    {
        path: '/',
        component: Home
    },
];

export default routes;
