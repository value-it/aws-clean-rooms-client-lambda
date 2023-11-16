# AWS CleanRoomsのクエリを定期的に実行するLambda関数を作成してみる

## 前提
### ローカル
- Node.js バージョン20.x がインストール済みであること
- AWSの認証情報が設定済みであること
### AWS
- CleanRoomsのコラボレーションが作成済みであること
- 実行するクエリの分析テンプレート登録済みであること

---

## 依存パッケージインストール
```shell
npm ci
```

## ローカルで動かしてみる
```shell
# 必要なパラメータを環境変数にセット
export MEMBERSHIP_ID="コラボレーションのメンバーシップID"
export ANALYSIS_TEMPLATE_ARN="実行する分析テンプレートのARN"
export PARAMETERS='実行する分析テンプレートのパラメータ(JSON形式)' # ex)'{"param1": "value1", "param2": "value2"}'
export RESULT_OUTPUT_S3_BUCKET="クエリ結果出力先S3バケット名"
export RESULT_OUTPUT_S3_KEY_PREFIX="クエリ結果出力先S3バケットPrefix"

# 実行
node localtest.js
```

---
## AWSにLambda関数としてデプロイ
### IAMロール作成
Lamda関数からCleanRoomsのクエリを実行するためのロールを作成
#### カスタム信頼ポリシー
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```
#### 許可ポリシー
Resourceは必要に応じて適宜絞る
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cleanrooms:StartProtectedQuery",
        "cleanrooms:GetCollaborationAnalysisTemplate",
        "cleanrooms:GetSchema"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:PutObject"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### node_modulesをzip圧縮
LambdaのLayerとして登録するためZIPで圧縮  
※予め `npm ci` してnode_modulesができている前提
```shell
zip -r node_modules.zip node_modules
```
### LambdaのLayerを登録
作成したnode_modules.zipをLambdaのLayerとしてアップロードして登録  
https://ap-northeast-1.console.aws.amazon.com/lambda/home?region=ap-northeast-1#/layers  
- 名前: 任意の名前（例: aws-sdk-clean-rooms）
- 互換性のあるランタイム: Node.js 20.x

### Lambda関数を作成
https://ap-northeast-1.console.aws.amazon.com/lambda/home?region=ap-northeast-1#/create/function  
- 一から作成を選択
- 関数名: 任意の名前
- ランタイム: Node.js 20.x
- 実行ロール: 前手順で作成したIAMロール

### Lamda関数のコード
- `index.mjs` の内容をそのまま貼り付けてDeploy
- `レイヤーの追加` を押し、前手順で作成したレイヤーをカスタムレイヤーとして追加

### パラメータ
- 環境変数でLambda関数に必要なパラメータを与える  
  - 設定 -> 環境変数 -> 編集 で以下の環境変数を設定する
    - `MEMBERSHIP_ID`: コラボレーションのメンバーシップID
    - `ANALYSIS_TEMPLATE_ARN`: 実行する分析テンプレートのARN
    - `PARAMETERS`: 実行する分析テンプレートのパラメータ(JSON形式)  
      例) `{"param1": "value1", "param2": "value2"}`
    - `RESULT_OUTPUT_S3_BUCKET`: クエリ結果出力先S3バケット名
    - `RESULT_OUTPUT_S3_KEY_PREFIX`: クエリ結果出力先S3バケットPrefix

### テスト
- テストメニューのテストボタンを押して実行してみる
  - CleanRoomsでクエリが実行されていれば成功

## Lambdaスケジュール設定
### トリガー追加
関数の概要から`+トリガーの追加`を選択
- ソース:  EventBridge (Cloudwatch Events) 
- Rule: Create a new rule
- Rule type: Schedule expression
- Schedule expression: cron式でスケジュール指定 
  - 例）毎月1日の午前8時 -> `cron(0 8 1 * ? *)`  
    https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/services-cloudwatchevents-expressions.html

