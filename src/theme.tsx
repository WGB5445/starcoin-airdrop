import {createTheme} from "@material-ui/core";
import {red} from "@material-ui/core/colors";

const theme = createTheme({
    palette: {
        error: {
            main: red.A400
        },
        success: {
            light: '#81c784',
            main: '#4caf50'
        }
    }
})

export default theme