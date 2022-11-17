import Home from '../views/Home/Home';
import ExcelUpload from '../views/ExcelUpload/ExcelUpload'

const routes = [
    {
        path: '/excelupload',
        component: ExcelUpload
    },
    {
        path: '/',
        component: Home
    },
];

export default routes;
