import Server from './server'
import axios from 'axios'

const apiUrl = process.env.REACT_APP_STARCOIN_AIRDROP_API_URL || 'http://127.0.0.1:4000';

class API extends Server {
    async getList(params = {}): Promise<any> {
        try {
            let rlt = await this.axios(
                "get",
                `${apiUrl}/getlist`,
                params,
            )
            if (rlt) {
                return rlt
            } else {
                let err = {
                    tip: 'Fail to get tList',
                    data: params,
                    url: `${apiUrl}/getlist`,
                }
                throw err
            }
        } catch (err) {
            throw err
        }
    }

    async updateStats(params = {}): Promise<any> {
        try {
            let rlt = await this.axios(
                "get",
                `${apiUrl}/updatestatus`,
                params,
            )
            if (rlt) {
                return rlt
            } else {
                let err = {
                    tip: 'Fail to get tList',
                    data: params,
                    url: `${apiUrl}/updatestatus`,
                }
                throw err
            }
        } catch (err) {
            throw err
        }
    }

    async upload(data: any) {

        let rlt = await axios.post(
            `${apiUrl}/uploadProject`,
            data,
        )
        return rlt
    }

    async get_state(resouce_url: string, table_url: string, airdropid: number): Promise<boolean> {

        try {
            let rlt = await axios.get(
                resouce_url
            )
            await axios.post(
                `${table_url}/${rlt.data.data.table.handle}/item`,
                {
                    key_type: 'u64',
                    value_type: "u64",
                    key: `${airdropid}`
                }
            );
            return true
        } catch (e) {
            return false
        }

    }
}

export default new API()