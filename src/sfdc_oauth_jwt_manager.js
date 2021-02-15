'use strict';

module.exports = class SfdcOauthJwtManager {

  /**
   * 秘密鍵ファイル名を指定し、ファイルパスを変数に設定する
   * @param {string} pem_file_name 
   */
  setPemFile(pem_file_name) {
    // 秘密鍵ファイル（.pem）の格納先パスを設定
    this.pem_location = './crt/' + pem_file_name;
  }

  /**
   * 利用するログイン情報を設定
   * @param {string} Salesforce   Salesforceのユーザ名（test@example.com、など） 
   * @param {string} url_org      HTTPSスキーマ付きの対象組織宛ログイン用URL（「https://login.salesforce.com」など）
   * @param {string} consumer_key 対象組織の「接続アプリケーション」に設定されたコンシューマ鍵の値
   */
  setLoginInfo(username, url_org, consumer_key) {
    // 'sub' の設定
    this.sub = username;

    // 'iss' の設定
    this.iss = consumer_key;

    // 'aud' の設定
    this.aud = url_org;

    // HTTP POST先Endpoint URLの設定
    this.endpoint = url_org + '/services/oauth2/token';
  }

  /**
   * OAuth 2.0 JWT ベアラーフローのための、HTTPコールアウトを実行する
   * @see https://help.salesforce.com/articleView?id=remoteaccess_oauth_jwt_flow.htm
   * @see https://developer.salesforce.com/docs/atlas.ja-jp.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_jwt_flow.htm
   */
  execute() {
    console.log("OAuth JWT Login Test");

    // 秘密鍵の読み込み
    const fs = require('fs');
    const cert = fs.readFileSync(this.pem_location);

    // JWTに記載されるメッセージの内容の定義
    let claim = {
      'sub': this.sub, // 接続するSalesforceのユーザアカウント名
      'iss': this.iss, // 接続アプリのコンシューマ鍵（client_id)
      'aud': this.aud, // 各ユーザのログインURL固定
      'exp': Math.floor(Date.now() / 1000) + 3 * 60 // 現在時刻から3分間のみ、と有効期限を指定（指定は必須）
    };

    console.log('===== claim =====');
    console.log(JSON.stringify(claim, null, 4));

    // JWTの生成と、秘密鍵による署名
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(claim, cert, { algorithm: 'RS256', noTimestamp: true });

    console.log('===== JWT token =====');
    console.log(token);

    // 接続先情報指定
    let options = {
      url: this.endpoint, // 接続先URLについて、組織URL下の'/services/oauth2/token'パスを指定
      method: 'POST',
      headers: {
        // form形式の指定が必要（ただし、'request'ライブラリ利用時は指定は無くてもPOSTでは自動付与される）
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', // JWTベアラートークンフローの指定。
        'assertion': token // 生成した暗号化済JWTトークン・署名を指定
      }
    }

    console.log('===== request info =====');
    console.log(JSON.stringify(options, null, 4));

    // Salesforce認証・認可サーバへのHTTPコールアウト
    const request = require('request');
    request(options, this.callbackHandle.bind(this)); // コールアウト後、callbackHandle()メソッドを呼び出し
  }

  /**
   * HTTP CalloutのResponseを処理する
   * @param {*} err 
   * @param {*} res 
   * @param {*} body 
   */
  callbackHandle(err, res, body) {

    // エラーが発生した場合は、コンソール上にログを出力し、終了させる
    if (err) {
      console.log('Error: ' + err.message);
      return;
    }

    // HTTPレスポンスステータスコード出力
    console.log('===== response =====');
    console.log('statusCode: ' + res.statusCode)

    // HTTPレスポンスヘッダー出力
    console.log('===== response headers =====');
    for (let key in res.headers) {
      console.log('  ' + key + ': ' + res.headers[key]);
    }

    // HTTPレスポンスボディー出力
    console.log('===== response body =====');
    console.log(body);
  
    // 取得したレスポンスボディーデータ（JSON文字列）を取得、オブジェクト化
    const bodyObj = JSON.parse(body);

    // Access Token文字列の取得、表示
    const access_token = bodyObj.access_token;
    console.log('==== access token ====');
    console.log(access_token);
  };
}
