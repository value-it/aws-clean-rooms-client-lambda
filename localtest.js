// このスクリプトはローカルでの動作確認にのみ使用する

import { handler } from './index.mjs'

const event = "";
const context = "";

function callback(error, result){
    console.log(result);
    process.exit(0);
}

handler(event, context, callback);
