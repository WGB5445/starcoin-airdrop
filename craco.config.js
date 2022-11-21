const { DefinePlugin } = require('webpack')

const commitHash = require('child_process').execSync('git rev-parse HEAD')

module.exports = {
    webpack: {
        plugins: [
            new DefinePlugin({
                'process.env.REACT_APP_GIT_COMMIT_HASH': JSON.stringify(commitHash.toString()),
            }),
        ],
        configure: (webpackConfig) => {
            // fix: Can't import the named export 'bytesToHex' from non EcmaScript module (only default export is available)
            // https://github.com/aptos-labs/aptos-core/issues/4601
            webpackConfig.module.rules.push({
                test: /\.mjs$/,
                include: /node_modules/,
                type: "javascript/auto"
            });
            return webpackConfig
        },
    },
}