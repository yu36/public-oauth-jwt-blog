// ログイン情報読み込み
const login_info = require('../login-info.json');

// OAuthのJWT ベースフロー用クラス読込
const manager = require('./sfdc_oauth_jwt_manager');
let inst = new manager();

// 秘密鍵ファイル名を指定、読み込み
inst.setPemFile('dummy.pem');
// ログイン情報設定
inst.setLoginInfo(login_info.username, login_info.url_org, login_info.consumer_key); 
// OAuthのJWT ベースフロー呼び出し
inst.execute();
