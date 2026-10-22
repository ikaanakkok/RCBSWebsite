import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const destination = fileURLToPath(new URL('../.env', import.meta.url));
if(fs.existsSync(destination))throw new Error('An .env file already exists; edit it in place.');
const settings = `ADMIN_USERNAME=admin\nADMIN_PASSWORD=${randomBytes(30).toString('base64url')}\nSITE_ORIGIN=http://localhost:3000\nHOST=127.0.0.1\nPORT=3000\n`;
fs.writeFileSync(destination,settings,{mode:0o600,flag:'wx'});
console.log('Local admin settings created in .env. The password is not printed or committed.');
