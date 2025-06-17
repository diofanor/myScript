import { exec } from 'child_process';
import { existsSync, readFileSync, writeFile } from 'fs';
import { createHmac } from 'crypto';
import { wait } from './utils';
/*
 * @Author: lxk0301 https://gitee.com/lxk0301
 * @Date: 2020-08-19 16:12:40
 * @Last Modified by: whyour
 * @Last Modified time: 2021-5-1 15:00:56
 * sendNotify 推送通知功能
 * @param text 通知头
 * @param desp 通知体
 * @param params 某些推送通知方式点击弹窗可跳转, 例：{ url: 'https://abc.com' }
 * @param author 作者仓库等信息  例：`本通知 By：https://github.com/whyour/qinglong`
 */
//详细说明参考 https://github.com/ccwav/QLScript2.
const timeout = 15000; //超时时间(单位毫秒)
console.log('加载sendNotify，当前版本: 20220504');
// =======================================go-cqhttp通知设置区域===========================================
//gobot_url 填写请求地址http://127.0.0.1/send_private_msg
//gobot_token 填写在go-cqhttp文件设置的访问密钥
//gobot_qq 填写推送到个人QQ或者QQ群号
//go-cqhttp相关API https://docs.go-cqhttp.org/api
let GOBOT_URL = ''; // 推送到个人QQ: http://127.0.0.1/send_private_msg  群：http://127.0.0.1/send_group_msg
let GOBOT_TOKEN = ''; //访问密钥
let GOBOT_QQ = ''; // 如果GOBOT_URL设置 /send_private_msg 则需要填入 user_id=个人QQ 相反如果是 /send_group_msg 则需要填入 group_id=QQ群

// =======================================微信server酱通知设置区域===========================================
//此处填你申请的SCKEY.
//(环境变量名 PUSH_KEY)
let SCKEY = '';

// =======================================Bark App通知设置区域===========================================
//此处填你BarkAPP的信息(IP/设备码，例如：https://api.day.app/XXXXXXXX)
let BARK_PUSH = '';
//BARK app推送铃声,铃声列表去APP查看复制填写
let BARK_SOUND = '';
//BARK app推送消息的分组, 默认为"QingLong"
let BARK_GROUP = 'QingLong';

// =======================================telegram机器人通知设置区域===========================================
//此处填你telegram bot 的Token，telegram机器人通知推送必填项.例如：1077xxx4424:AAFjv0FcqxxxxxxgEMGfi22B4yh15R5uw
//(环境变量名 TG_BOT_TOKEN)
let TG_BOT_TOKEN = '';
//此处填你接收通知消息的telegram用户的id，telegram机器人通知推送必填项.例如：129xxx206
//(环境变量名 TG_USER_ID)
let TG_USER_ID = '';
//tg推送HTTP代理设置(不懂可忽略,telegram机器人通知推送功能中非必填)
let TG_PROXY_HOST = ''; //例如:127.0.0.1(环境变量名:TG_PROXY_HOST)
let TG_PROXY_PORT = ''; //例如:1080(环境变量名:TG_PROXY_PORT)
let TG_PROXY_AUTH = ''; //tg代理配置认证参数
//Telegram api自建的反向代理地址(不懂可忽略,telegram机器人通知推送功能中非必填),默认tg官方api(环境变量名:TG_API_HOST)
let TG_API_HOST = 'api.telegram.org';
// =======================================钉钉机器人通知设置区域===========================================
//此处填你钉钉 bot 的webhook，例如：5a544165465465645d0f31dca676e7bd07415asdasd
//(环境变量名 DD_BOT_TOKEN)
let DD_BOT_TOKEN = '';
//密钥，机器人安全设置页面，加签一栏下面显示的SEC开头的字符串
let DD_BOT_SECRET = '';

// =======================================企业微信机器人通知设置区域===========================================
//此处填你企业微信机器人的 webhook(详见文档 https://work.weixin.qq.com/api/doc/90000/90136/91770)，例如：693a91f6-7xxx-4bc4-97a0-0ec2sifa5aaa
//(环境变量名 QYWX_KEY)
let QYWX_KEY = '';

// =======================================企业微信应用消息通知设置区域===========================================
/*
此处填你企业微信应用消息的值(详见文档 https://work.weixin.qq.com/api/doc/90000/90135/90236)
环境变量名 QYWX_AM依次填入 corpid,corpsecret,touser(注:多个成员ID使用|隔开),agentid,消息类型(选填,不填默认文本消息类型)
注意用,号隔开(英文输入法的逗号)，例如：wwcff56746d9adwers,B-791548lnzXBE6_BWfxdf3kSTMJr9vFEPKAbh6WERQ,mingcheng,1000001,2COXgjH2UIfERF2zxrtUOKgQ9XklUqMdGSWLBoW_lSDAdafat
可选推送消息类型(推荐使用图文消息（mpnews）):
- 文本卡片消息: 0 (数字零)
- 文本消息: 1 (数字一)
- 图文消息（mpnews）: 素材库图片id, 可查看此教程(http://note.youdao.com/s/HMiudGkb)或者(https://note.youdao.com/ynoteshare1/index.html?id=1a0c8aff284ad28cbd011b29b3ad0191&type=note)
 */
let QYWX_AM = '';

// =======================================iGot聚合推送通知设置区域===========================================
//此处填您iGot的信息(推送key，例如：https://push.hellyw.com/XXXXXXXX)
let IGOT_PUSH_KEY = '';

// =======================================push+设置区域=======================================
//官方文档：http://www.pushplus.plus/
//PUSH_PLUS_TOKEN：微信扫码登录后一对一推送或一对多推送下面的token(您的Token)，不提供PUSH_PLUS_USER则默认为一对一推送
//PUSH_PLUS_USER： 一对多推送的“群组编码”（一对多推送下面->您的群组(如无则新建)->群组编码，如果您是创建群组人。也需点击“查看二维码”扫描绑定，否则不能接受群组消息推送）
let PUSH_PLUS_TOKEN = '';
let PUSH_PLUS_USER = '';
let PUSH_PLUS_TOKEN_hxtrip = '';
let PUSH_PLUS_USER_hxtrip = '';

// ======================================= WxPusher 通知设置区域 ===========================================
// 此处填你申请的 appToken. 官方文档：https://wxpusher.zjiecode.com/docs
// WP_APP_TOKEN 可在管理台查看: https://wxpusher.zjiecode.com/admin/main/app/appToken
// WP_TOPICIDS 群发, 发送目标的 topicId, 以 ; 分隔! 使用 WP_UIDS 单发的时候, 可以不传
// WP_UIDS 发送目标的 uid, 以 ; 分隔。注意 WP_UIDS 和 WP_TOPICIDS 可以同时填写, 也可以只填写一个。
// WP_URL 原文链接, 可选参数
let WP_APP_TOKEN = '';
let WP_TOPICIDS = '';
let WP_UIDS = '';
let WP_URL = '';

// =======================================gotify通知设置区域==============================================
//gotify_url 填写gotify地址,如https://push.example.de:8080
//gotify_token 填写gotify的消息应用token
//gotify_priority 填写推送消息优先级,默认为0
let GOTIFY_URL = '';
let GOTIFY_TOKEN = '';
let GOTIFY_PRIORITY = 0;

/**
 * sendNotify 推送通知功能
 * @param text 通知头
 * @param desp 通知体
 * @param params 某些推送通知方式点击弹窗可跳转, 例：{ url: 'https://abc.com' }
 * @param author 作者仓库等信息  例：`本通知 By：https://github.com/whyour/qinglong`
 * @returns {Promise<unknown>}
 */
let PushErrorTime = 0;
let strTitle = '';
let ShowRemarkType = '1';
let Notify_NoCKFalse = 'false';
let Notify_NoLoginSuccess = 'false';
let UseGroupNotify = 1;
let isnewql = existsSync('/ql/data/config/auth.json');
let strCKFile = '';
let strUidFile = '';
if (isnewql) {
  strCKFile = '/ql/data/scripts/CKName_cache.json';
  strUidFile = '/ql/data/scripts/CK_WxPusherUid.json';
} else {
  strCKFile = '/ql/scripts/CKName_cache.json';
  strUidFile = '/ql/scripts/CK_WxPusherUid.json';
}

let Fileexists = existsSync(strCKFile);
let TempCK: string[] = [];
if (Fileexists) {
  console.log('检测到别名缓存文件CKName_cache.json，载入...');
  const TempCKFile = readFileSync(strCKFile, 'utf-8');
  if (TempCKFile) {
    const TempCKStr = TempCKFile.toString();
    TempCK = JSON.parse(TempCKStr);
  }
}

let UidFileexists = existsSync(strUidFile);
let TempCKUid = [];
if (UidFileexists) {
  console.log('检测到一对一Uid文件WxPusherUid.json，载入...');
  const TempCKUidFile = readFileSync(strUidFile, 'utf-8');
  if (TempCKUidFile) {
    const TempCKUidStr = TempCKUidFile.toString();
    TempCKUid = JSON.parse(TempCKUidStr);
  }
}

let boolneedUpdate = false;
let strCustom = '';
let strCustomArr = [];
let strCustomTempArr = [];
let Notify_CKTask = '';
let Notify_SkipText = [];
if (process.env.NOTIFY_SHOWNAMETYPE) {
  ShowRemarkType = process.env.NOTIFY_SHOWNAMETYPE;
  if (ShowRemarkType == '2') console.log('检测到显示备注名称，格式为: 京东别名(备注)');
  if (ShowRemarkType == '3') console.log('检测到显示备注名称，格式为: 京东账号(备注)');
  if (ShowRemarkType == '4') console.log('检测到显示备注名称，格式为: 备注');
}
export async function sendNotify(
  text: string,
  desp = '',
  params = {},
  author = '\n\n本通知 By C-rakcer',
  strsummary = '',
) {
  console.log(`开始发送通知...`);

  try {
    //Reset 变量
    UseGroupNotify = 1;
    strTitle = '';
    GOBOT_URL = '';
    GOBOT_TOKEN = '';
    GOBOT_QQ = '';
    SCKEY = '';
    BARK_PUSH = '';
    BARK_SOUND = '';
    BARK_GROUP = 'QingLong';
    TG_BOT_TOKEN = '';
    TG_USER_ID = '';
    TG_PROXY_HOST = '';
    TG_PROXY_PORT = '';
    TG_PROXY_AUTH = '';
    TG_API_HOST = 'api.telegram.org';
    DD_BOT_TOKEN = '';
    DD_BOT_SECRET = '';
    QYWX_KEY = '';
    QYWX_AM = '';
    IGOT_PUSH_KEY = '';
    PUSH_PLUS_TOKEN = '';
    PUSH_PLUS_USER = '';
    PUSH_PLUS_TOKEN_hxtrip = '';
    PUSH_PLUS_USER_hxtrip = '';
    Notify_CKTask = '';
    Notify_SkipText = [];

    //变量开关
    var Use_serverNotify = true;
    var Use_pushPlusNotify = true;
    var Use_BarkNotify = true;
    var Use_tgBotNotify = true;
    var Use_ddBotNotify = true;
    var Use_qywxBotNotify = true;
    var Use_qywxamNotify = true;
    var Use_iGotNotify = true;
    var Use_gobotNotify = true;
    var Use_pushPlushxtripNotify = true;
    var Use_WxPusher = true;
    var strtext = text;
    var strdesp = desp;
    if (process.env.NOTIFY_NOCKFALSE) {
      Notify_NoCKFalse = process.env.NOTIFY_NOCKFALSE;
    }
    if (process.env.NOTIFY_NOLOGINSUCCESS) {
      Notify_NoLoginSuccess = process.env.NOTIFY_NOLOGINSUCCESS;
    }
    if (process.env.NOTIFY_CKTASK) {
      Notify_CKTask = process.env.NOTIFY_CKTASK;
    }

    if (process.env.NOTIFY_SKIP_TEXT && desp) {
      Notify_SkipText = process.env.NOTIFY_SKIP_TEXT.split('&');
      if (Notify_SkipText.length > 0) {
        for (var Templ in Notify_SkipText) {
          if (desp.indexOf(Notify_SkipText[Templ]) != -1) {
            console.log('检测内容到内容存在屏蔽推送的关键字(' + Notify_SkipText[Templ] + ')，将跳过推送...');
            return;
          }
        }
      }
    }

    if (text.indexOf('cookie已失效') != -1 || desp.indexOf('重新登录获取') != -1 || text == 'Ninja 运行通知') {
      if (Notify_CKTask) {
        console.log('触发CK脚本，开始执行....');
        Notify_CKTask = 'task ' + Notify_CKTask + ' now';
        await exec(Notify_CKTask, function (error, stdout, stderr) {
          console.log(error, stdout, stderr);
        });
      }
    }
    if (strtext.indexOf('cookie已失效') != -1 || strdesp.indexOf('重新登录获取') != -1 || strtext == 'Ninja 运行通知') {
      if (Notify_NoCKFalse == 'true' && text != 'Ninja 运行通知') {
        console.log(`检测到NOTIFY_NOCKFALSE变量为true,不发送ck失效通知...`);
        return;
      }
    }

    if (text.indexOf('已可领取') != -1) {
      if (text.indexOf('农场') != -1) {
        strTitle = '东东农场领取';
      } else {
        strTitle = '东东萌宠领取';
      }
    }
    if (text.indexOf('汪汪乐园养joy') != -1) {
      strTitle = '汪汪乐园养joy领取';
    }

    if (text == '京喜工厂') {
      if (desp.indexOf('元造进行兑换') != -1) {
        strTitle = '京喜工厂领取';
      }
    }

    if (text.indexOf('任务') != -1 && (text.indexOf('新增') != -1 || text.indexOf('删除') != -1)) {
      strTitle = '脚本任务更新';
    }
    let titleIndex: number;
    if (strTitle) {
      const notifyRemindList = process.env.NOTIFY_NOREMIND ? process.env.NOTIFY_NOREMIND.split('&') : [];
      titleIndex = notifyRemindList.findIndex((item) => item === strTitle);

      if (titleIndex !== -1) {
        console.log(`${text} 在领取信息黑名单中，已跳过推送`);
        return;
      }
    } else {
      strTitle = text;
    }

    if (Notify_NoLoginSuccess == 'true') {
      if (desp.indexOf('登陆成功') != -1) {
        console.log(`登陆成功不推送`);
        return;
      }
    }

    console.log('通知标题: ' + strTitle);

    //检查黑名单屏蔽通知
    const notifySkipList = process.env.NOTIFY_SKIP_LIST ? process.env.NOTIFY_SKIP_LIST.split('&') : [];
    titleIndex = notifySkipList.findIndex((item) => item === strTitle);

    if (titleIndex !== -1) {
      console.log(`${strTitle} 在推送黑名单中，已跳过推送`);
      return;
    }

    //检查脚本名称是否需要通知到Group2,Group2读取原环境配置的变量名后加2的值.例如: QYWX_AM2
    const notifyGroup2List = process.env.NOTIFY_GROUP2_LIST ? process.env.NOTIFY_GROUP2_LIST.split('&') : [];
    const titleIndex2 = notifyGroup2List.findIndex((item) => item === strTitle);
    const notifyGroup3List = process.env.NOTIFY_GROUP3_LIST ? process.env.NOTIFY_GROUP3_LIST.split('&') : [];
    const titleIndexGp3 = notifyGroup3List.findIndex((item) => item === strTitle);
    const notifyGroup4List = process.env.NOTIFY_GROUP4_LIST ? process.env.NOTIFY_GROUP4_LIST.split('&') : [];
    const titleIndexGp4 = notifyGroup4List.findIndex((item) => item === strTitle);
    const notifyGroup5List = process.env.NOTIFY_GROUP5_LIST ? process.env.NOTIFY_GROUP5_LIST.split('&') : [];
    const titleIndexGp5 = notifyGroup5List.findIndex((item) => item === strTitle);
    const notifyGroup6List = process.env.NOTIFY_GROUP6_LIST ? process.env.NOTIFY_GROUP6_LIST.split('&') : [];
    const titleIndexGp6 = notifyGroup6List.findIndex((item) => item === strTitle);
    const notifyGroup7List = process.env.NOTIFY_GROUP7_LIST ? process.env.NOTIFY_GROUP7_LIST.split('&') : [];
    const titleIndexGp7 = notifyGroup7List.findIndex((item) => item === strTitle);

    if (titleIndex2 !== -1) {
      console.log(`${strTitle} 在群组2推送名单中，初始化群组推送`);
      UseGroupNotify = 2;
    }
    if (titleIndexGp3 !== -1) {
      console.log(`${strTitle} 在群组3推送名单中，初始化群组推送`);
      UseGroupNotify = 3;
    }
    if (titleIndexGp4 !== -1) {
      console.log(`${strTitle} 在群组4推送名单中，初始化群组推送`);
      UseGroupNotify = 4;
    }
    if (titleIndexGp5 !== -1) {
      console.log(`${strTitle} 在群组5推送名单中，初始化群组推送`);
      UseGroupNotify = 5;
    }
    if (titleIndexGp6 !== -1) {
      console.log(`${strTitle} 在群组6推送名单中，初始化群组推送`);
      UseGroupNotify = 6;
    }
    if (titleIndexGp7 !== -1) {
      console.log(`${strTitle} 在群组7推送名单中，初始化群组推送`);
      UseGroupNotify = 7;
    }
    if (process.env.NOTIFY_CUSTOMNOTIFY) {
      strCustom = process.env.NOTIFY_CUSTOMNOTIFY;
    }
    if (strCustom) {
      strCustomArr = strCustom.replace(/^\[|\]$/g, '').split(',');
      strCustomTempArr = [];
      for (var Tempj in strCustomArr) {
        strCustomTempArr = strCustomArr[Tempj].split('&');
        if (strCustomTempArr.length > 1) {
          if (strTitle == strCustomTempArr[0]) {
            console.log('检测到自定义设定,开始执行配置...');
            if (strCustomTempArr[1] == '组1') {
              console.log('自定义设定强制使用组1配置通知...');
              UseGroupNotify = 1;
            }
            if (strCustomTempArr[1] == '组2') {
              console.log('自定义设定强制使用组2配置通知...');
              UseGroupNotify = 2;
            }
            if (strCustomTempArr[1] == '组3') {
              console.log('自定义设定强制使用组3配置通知...');
              UseGroupNotify = 3;
            }
            if (strCustomTempArr[1] == '组4') {
              console.log('自定义设定强制使用组4配置通知...');
              UseGroupNotify = 4;
            }
            if (strCustomTempArr[1] == '组5') {
              console.log('自定义设定强制使用组5配置通知...');
              UseGroupNotify = 5;
            }
            if (strCustomTempArr[1] == '组6') {
              console.log('自定义设定强制使用组6配置通知...');
              UseGroupNotify = 6;
            }
            if (strCustomTempArr[1] == '组7') {
              console.log('自定义设定强制使用组6配置通知...');
              UseGroupNotify = 7;
            }
            if (strCustomTempArr.length > 2) {
              console.log('关闭所有通知变量...');
              Use_serverNotify = false;
              Use_pushPlusNotify = false;
              Use_pushPlushxtripNotify = false;
              Use_BarkNotify = false;
              Use_tgBotNotify = false;
              Use_ddBotNotify = false;
              Use_qywxBotNotify = false;
              Use_qywxamNotify = false;
              Use_iGotNotify = false;
              Use_gobotNotify = false;

              for (let Tempk = 2; Tempk < strCustomTempArr.length; Tempk++) {
                var strTrmp = strCustomTempArr[Tempk];
                switch (strTrmp) {
                  case 'Server酱':
                    Use_serverNotify = true;
                    console.log('自定义设定启用Server酱进行通知...');
                    break;
                  case 'pushplus':
                    Use_pushPlusNotify = true;
                    console.log('自定义设定启用pushplus(推送加)进行通知...');
                    break;
                  case 'pushplushxtrip':
                    Use_pushPlushxtripNotify = true;
                    console.log('自定义设定启用pushplus_hxtrip(推送加)进行通知...');
                    break;
                  case 'Bark':
                    Use_BarkNotify = true;
                    console.log('自定义设定启用Bark进行通知...');
                    break;
                  case 'TG机器人':
                    Use_tgBotNotify = true;
                    console.log('自定义设定启用telegram机器人进行通知...');
                    break;
                  case '钉钉':
                    Use_ddBotNotify = true;
                    console.log('自定义设定启用钉钉机器人进行通知...');
                    break;
                  case '企业微信机器人':
                    Use_qywxBotNotify = true;
                    console.log('自定义设定启用企业微信机器人进行通知...');
                    break;
                  case '企业微信应用消息':
                    Use_qywxamNotify = true;
                    console.log('自定义设定启用企业微信应用消息进行通知...');
                    break;
                  case 'iGotNotify':
                    Use_iGotNotify = true;
                    console.log('自定义设定启用iGot进行通知...');
                    break;
                  case 'gobotNotify':
                    Use_gobotNotify = true;
                    console.log('自定义设定启用go-cqhttp进行通知...');
                    break;
                  case 'WxPusher':
                    Use_WxPusher = true;
                    console.log('自定义设定启用WxPusher进行通知...');
                    break;
                }
              }
            }
          }
        }
      }
    }

    //console.log("UseGroup2 :"+UseGroup2);
    //console.log("UseGroup3 :"+UseGroup3);

    switch (UseGroupNotify) {
      case 1:
        if (process.env.GOBOT_URL && Use_gobotNotify) {
          GOBOT_URL = process.env.GOBOT_URL;
        }
        if (process.env.GOBOT_TOKEN && Use_gobotNotify) {
          GOBOT_TOKEN = process.env.GOBOT_TOKEN;
        }
        if (process.env.GOBOT_QQ && Use_gobotNotify) {
          GOBOT_QQ = process.env.GOBOT_QQ;
        }

        if (process.env.PUSH_KEY && Use_serverNotify) {
          SCKEY = process.env.PUSH_KEY;
        }

        if (process.env.WP_APP_TOKEN && Use_WxPusher) {
          WP_APP_TOKEN = process.env.WP_APP_TOKEN;
        }

        if (process.env.WP_TOPICIDS && Use_WxPusher) {
          WP_TOPICIDS = process.env.WP_TOPICIDS;
        }

        if (process.env.WP_UIDS && Use_WxPusher) {
          WP_UIDS = process.env.WP_UIDS;
        }

        if (process.env.WP_URL && Use_WxPusher) {
          WP_URL = process.env.WP_URL;
        }
        if (process.env.BARK_PUSH && Use_BarkNotify) {
          if (process.env.BARK_PUSH.indexOf('https') > -1 || process.env.BARK_PUSH.indexOf('http') > -1) {
            //兼容BARK自建用户
            BARK_PUSH = process.env.BARK_PUSH;
          } else {
            BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH}`;
          }
          if (process.env.BARK_SOUND) {
            BARK_SOUND = process.env.BARK_SOUND;
          }
          if (process.env.BARK_GROUP) {
            BARK_GROUP = process.env.BARK_GROUP;
          }
        } else {
          if (BARK_PUSH && BARK_PUSH.indexOf('https') === -1 && BARK_PUSH.indexOf('http') === -1 && Use_BarkNotify) {
            //兼容BARK本地用户只填写设备码的情况
            BARK_PUSH = `https://api.day.app/${BARK_PUSH}`;
          }
        }
        if (process.env.TG_BOT_TOKEN && Use_tgBotNotify) {
          TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
        }
        if (process.env.TG_USER_ID && Use_tgBotNotify) {
          TG_USER_ID = process.env.TG_USER_ID;
        }
        if (process.env.TG_PROXY_AUTH && Use_tgBotNotify) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH;
        if (process.env.TG_PROXY_HOST && Use_tgBotNotify) TG_PROXY_HOST = process.env.TG_PROXY_HOST;
        if (process.env.TG_PROXY_PORT && Use_tgBotNotify) TG_PROXY_PORT = process.env.TG_PROXY_PORT;
        if (process.env.TG_API_HOST && Use_tgBotNotify) TG_API_HOST = process.env.TG_API_HOST;

        if (process.env.DD_BOT_TOKEN && Use_ddBotNotify) {
          DD_BOT_TOKEN = process.env.DD_BOT_TOKEN;
          if (process.env.DD_BOT_SECRET) {
            DD_BOT_SECRET = process.env.DD_BOT_SECRET;
          }
        }

        if (process.env.QYWX_KEY && Use_qywxBotNotify) {
          QYWX_KEY = process.env.QYWX_KEY;
        }

        if (process.env.QYWX_AM && Use_qywxamNotify) {
          QYWX_AM = process.env.QYWX_AM;
        }

        if (process.env.IGOT_PUSH_KEY && Use_iGotNotify) {
          IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY;
        }

        if (process.env.PUSH_PLUS_TOKEN && Use_pushPlusNotify) {
          PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN;
        }
        if (process.env.PUSH_PLUS_USER && Use_pushPlusNotify) {
          PUSH_PLUS_USER = process.env.PUSH_PLUS_USER;
        }

        if (process.env.PUSH_PLUS_TOKEN_hxtrip && Use_pushPlushxtripNotify) {
          PUSH_PLUS_TOKEN_hxtrip = process.env.PUSH_PLUS_TOKEN_hxtrip;
        }
        if (process.env.PUSH_PLUS_USER_hxtrip && Use_pushPlushxtripNotify) {
          PUSH_PLUS_USER_hxtrip = process.env.PUSH_PLUS_USER_hxtrip;
        }
        if (process.env.GOTIFY_URL) {
          GOTIFY_URL = process.env.GOTIFY_URL;
        }
        if (process.env.GOTIFY_TOKEN) {
          GOTIFY_TOKEN = process.env.GOTIFY_TOKEN;
        }
        if (process.env.GOTIFY_PRIORITY) {
          GOTIFY_PRIORITY = parseInt(process.env.GOTIFY_PRIORITY);
        }

        break;

      case 2:
        //==========================第二套环境变量赋值=========================

        if (process.env.GOBOT_URL2 && Use_gobotNotify) {
          GOBOT_URL = process.env.GOBOT_URL2;
        }
        if (process.env.GOBOT_TOKEN2 && Use_gobotNotify) {
          GOBOT_TOKEN = process.env.GOBOT_TOKEN2;
        }
        if (process.env.GOBOT_QQ2 && Use_gobotNotify) {
          GOBOT_QQ = process.env.GOBOT_QQ2;
        }

        if (process.env.PUSH_KEY2 && Use_serverNotify) {
          SCKEY = process.env.PUSH_KEY2;
        }

        if (process.env.WP_APP_TOKEN2 && Use_WxPusher) {
          WP_APP_TOKEN = process.env.WP_APP_TOKEN2;
        }

        if (process.env.WP_TOPICIDS2 && Use_WxPusher) {
          WP_TOPICIDS = process.env.WP_TOPICIDS2;
        }

        if (process.env.WP_UIDS2 && Use_WxPusher) {
          WP_UIDS = process.env.WP_UIDS2;
        }

        if (process.env.WP_URL2 && Use_WxPusher) {
          WP_URL = process.env.WP_URL2;
        }
        if (process.env.BARK_PUSH2 && Use_BarkNotify) {
          if (process.env.BARK_PUSH2.indexOf('https') > -1 || process.env.BARK_PUSH2.indexOf('http') > -1) {
            //兼容BARK自建用户
            BARK_PUSH = process.env.BARK_PUSH2;
          } else {
            BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH2}`;
          }
          if (process.env.BARK_SOUND2) {
            BARK_SOUND = process.env.BARK_SOUND2;
          }
          if (process.env.BARK_GROUP2) {
            BARK_GROUP = process.env.BARK_GROUP2;
          }
        }
        if (process.env.TG_BOT_TOKEN2 && Use_tgBotNotify) {
          TG_BOT_TOKEN = process.env.TG_BOT_TOKEN2;
        }
        if (process.env.TG_USER_ID2 && Use_tgBotNotify) {
          TG_USER_ID = process.env.TG_USER_ID2;
        }
        if (process.env.TG_PROXY_AUTH2 && Use_tgBotNotify) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH2;
        if (process.env.TG_PROXY_HOST2 && Use_tgBotNotify) TG_PROXY_HOST = process.env.TG_PROXY_HOST2;
        if (process.env.TG_PROXY_PORT2 && Use_tgBotNotify) TG_PROXY_PORT = process.env.TG_PROXY_PORT2;
        if (process.env.TG_API_HOST2 && Use_tgBotNotify) TG_API_HOST = process.env.TG_API_HOST2;

        if (process.env.DD_BOT_TOKEN2 && Use_ddBotNotify) {
          DD_BOT_TOKEN = process.env.DD_BOT_TOKEN2;
          if (process.env.DD_BOT_SECRET2) {
            DD_BOT_SECRET = process.env.DD_BOT_SECRET2;
          }
        }

        if (process.env.QYWX_KEY2 && Use_qywxBotNotify) {
          QYWX_KEY = process.env.QYWX_KEY2;
        }

        if (process.env.QYWX_AM2 && Use_qywxamNotify) {
          QYWX_AM = process.env.QYWX_AM2;
        }

        if (process.env.IGOT_PUSH_KEY2 && Use_iGotNotify) {
          IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY2;
        }

        if (process.env.PUSH_PLUS_TOKEN2 && Use_pushPlusNotify) {
          PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN2;
        }
        if (process.env.PUSH_PLUS_USER2 && Use_pushPlusNotify) {
          PUSH_PLUS_USER = process.env.PUSH_PLUS_USER2;
        }

        if (process.env.PUSH_PLUS_TOKEN_hxtrip2 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_TOKEN_hxtrip = process.env.PUSH_PLUS_TOKEN_hxtrip2;
        }
        if (process.env.PUSH_PLUS_USER_hxtrip2 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_USER_hxtrip = process.env.PUSH_PLUS_USER_hxtrip2;
        }
        if (process.env.GOTIFY_URL2) {
          GOTIFY_URL = process.env.GOTIFY_URL2;
        }
        if (process.env.GOTIFY_TOKEN2) {
          GOTIFY_TOKEN = process.env.GOTIFY_TOKEN2;
        }
        if (process.env.GOTIFY_PRIORITY2) {
          GOTIFY_PRIORITY = parseInt(process.env.GOTIFY_PRIORITY2);
        }
        break;

      case 3:
        //==========================第三套环境变量赋值=========================

        if (process.env.GOBOT_URL3 && Use_gobotNotify) {
          GOBOT_URL = process.env.GOBOT_URL3;
        }
        if (process.env.GOBOT_TOKEN3 && Use_gobotNotify) {
          GOBOT_TOKEN = process.env.GOBOT_TOKEN3;
        }
        if (process.env.GOBOT_QQ3 && Use_gobotNotify) {
          GOBOT_QQ = process.env.GOBOT_QQ3;
        }

        if (process.env.PUSH_KEY3 && Use_serverNotify) {
          SCKEY = process.env.PUSH_KEY3;
        }

        if (process.env.WP_APP_TOKEN3 && Use_WxPusher) {
          WP_APP_TOKEN = process.env.WP_APP_TOKEN3;
        }

        if (process.env.WP_TOPICIDS3 && Use_WxPusher) {
          WP_TOPICIDS = process.env.WP_TOPICIDS3;
        }

        if (process.env.WP_UIDS3 && Use_WxPusher) {
          WP_UIDS = process.env.WP_UIDS3;
        }

        if (process.env.WP_URL3 && Use_WxPusher) {
          WP_URL = process.env.WP_URL3;
        }

        if (process.env.BARK_PUSH3 && Use_BarkNotify) {
          if (process.env.BARK_PUSH3.indexOf('https') > -1 || process.env.BARK_PUSH3.indexOf('http') > -1) {
            //兼容BARK自建用户
            BARK_PUSH = process.env.BARK_PUSH3;
          } else {
            BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH3}`;
          }
          if (process.env.BARK_SOUND3) {
            BARK_SOUND = process.env.BARK_SOUND3;
          }
          if (process.env.BARK_GROUP3) {
            BARK_GROUP = process.env.BARK_GROUP3;
          }
        }
        if (process.env.TG_BOT_TOKEN3 && Use_tgBotNotify) {
          TG_BOT_TOKEN = process.env.TG_BOT_TOKEN3;
        }
        if (process.env.TG_USER_ID3 && Use_tgBotNotify) {
          TG_USER_ID = process.env.TG_USER_ID3;
        }
        if (process.env.TG_PROXY_AUTH3 && Use_tgBotNotify) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH3;
        if (process.env.TG_PROXY_HOST3 && Use_tgBotNotify) TG_PROXY_HOST = process.env.TG_PROXY_HOST3;
        if (process.env.TG_PROXY_PORT3 && Use_tgBotNotify) TG_PROXY_PORT = process.env.TG_PROXY_PORT3;
        if (process.env.TG_API_HOST3 && Use_tgBotNotify) TG_API_HOST = process.env.TG_API_HOST3;

        if (process.env.DD_BOT_TOKEN3 && Use_ddBotNotify) {
          DD_BOT_TOKEN = process.env.DD_BOT_TOKEN3;
          if (process.env.DD_BOT_SECRET3) {
            DD_BOT_SECRET = process.env.DD_BOT_SECRET3;
          }
        }

        if (process.env.QYWX_KEY3 && Use_qywxBotNotify) {
          QYWX_KEY = process.env.QYWX_KEY3;
        }

        if (process.env.QYWX_AM3 && Use_qywxamNotify) {
          QYWX_AM = process.env.QYWX_AM3;
        }

        if (process.env.IGOT_PUSH_KEY3 && Use_iGotNotify) {
          IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY3;
        }

        if (process.env.PUSH_PLUS_TOKEN3 && Use_pushPlusNotify) {
          PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN3;
        }
        if (process.env.PUSH_PLUS_USER3 && Use_pushPlusNotify) {
          PUSH_PLUS_USER = process.env.PUSH_PLUS_USER3;
        }

        if (process.env.PUSH_PLUS_TOKEN_hxtrip3 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_TOKEN_hxtrip = process.env.PUSH_PLUS_TOKEN_hxtrip3;
        }
        if (process.env.PUSH_PLUS_USER_hxtrip3 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_USER_hxtrip = process.env.PUSH_PLUS_USER_hxtrip3;
        }
        if (process.env.GOTIFY_URL3) {
          GOTIFY_URL = process.env.GOTIFY_URL3;
        }
        if (process.env.GOTIFY_TOKEN3) {
          GOTIFY_TOKEN = process.env.GOTIFY_TOKEN3;
        }
        if (process.env.GOTIFY_PRIORITY3) {
          GOTIFY_PRIORITY = parseInt(process.env.GOTIFY_PRIORITY3);
        }
        break;

      case 4:
        //==========================第四套环境变量赋值=========================

        if (process.env.GOBOT_URL4 && Use_gobotNotify) {
          GOBOT_URL = process.env.GOBOT_URL4;
        }
        if (process.env.GOBOT_TOKEN4 && Use_gobotNotify) {
          GOBOT_TOKEN = process.env.GOBOT_TOKEN4;
        }
        if (process.env.GOBOT_QQ4 && Use_gobotNotify) {
          GOBOT_QQ = process.env.GOBOT_QQ4;
        }

        if (process.env.PUSH_KEY4 && Use_serverNotify) {
          SCKEY = process.env.PUSH_KEY4;
        }

        if (process.env.WP_APP_TOKEN4 && Use_WxPusher) {
          WP_APP_TOKEN = process.env.WP_APP_TOKEN4;
        }

        if (process.env.WP_TOPICIDS4 && Use_WxPusher) {
          WP_TOPICIDS = process.env.WP_TOPICIDS4;
        }

        if (process.env.WP_UIDS4 && Use_WxPusher) {
          WP_UIDS = process.env.WP_UIDS4;
        }

        if (process.env.WP_URL4 && Use_WxPusher) {
          WP_URL = process.env.WP_URL4;
        }

        if (process.env.BARK_PUSH4 && Use_BarkNotify) {
          if (process.env.BARK_PUSH4.indexOf('https') > -1 || process.env.BARK_PUSH4.indexOf('http') > -1) {
            //兼容BARK自建用户
            BARK_PUSH = process.env.BARK_PUSH4;
          } else {
            BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH4}`;
          }
          if (process.env.BARK_SOUND4) {
            BARK_SOUND = process.env.BARK_SOUND4;
          }
          if (process.env.BARK_GROUP4) {
            BARK_GROUP = process.env.BARK_GROUP4;
          }
        }
        if (process.env.TG_BOT_TOKEN4 && Use_tgBotNotify) {
          TG_BOT_TOKEN = process.env.TG_BOT_TOKEN4;
        }
        if (process.env.TG_USER_ID4 && Use_tgBotNotify) {
          TG_USER_ID = process.env.TG_USER_ID4;
        }
        if (process.env.TG_PROXY_AUTH4 && Use_tgBotNotify) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH4;
        if (process.env.TG_PROXY_HOST4 && Use_tgBotNotify) TG_PROXY_HOST = process.env.TG_PROXY_HOST4;
        if (process.env.TG_PROXY_PORT4 && Use_tgBotNotify) TG_PROXY_PORT = process.env.TG_PROXY_PORT4;
        if (process.env.TG_API_HOST4 && Use_tgBotNotify) TG_API_HOST = process.env.TG_API_HOST4;

        if (process.env.DD_BOT_TOKEN4 && Use_ddBotNotify) {
          DD_BOT_TOKEN = process.env.DD_BOT_TOKEN4;
          if (process.env.DD_BOT_SECRET4) {
            DD_BOT_SECRET = process.env.DD_BOT_SECRET4;
          }
        }

        if (process.env.QYWX_KEY4 && Use_qywxBotNotify) {
          QYWX_KEY = process.env.QYWX_KEY4;
        }

        if (process.env.QYWX_AM4 && Use_qywxamNotify) {
          QYWX_AM = process.env.QYWX_AM4;
        }

        if (process.env.IGOT_PUSH_KEY4 && Use_iGotNotify) {
          IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY4;
        }

        if (process.env.PUSH_PLUS_TOKEN4 && Use_pushPlusNotify) {
          PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN4;
        }
        if (process.env.PUSH_PLUS_USER4 && Use_pushPlusNotify) {
          PUSH_PLUS_USER = process.env.PUSH_PLUS_USER4;
        }

        if (process.env.PUSH_PLUS_TOKEN_hxtrip4 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_TOKEN_hxtrip = process.env.PUSH_PLUS_TOKEN_hxtrip4;
        }
        if (process.env.PUSH_PLUS_USER_hxtrip4 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_USER_hxtrip = process.env.PUSH_PLUS_USER_hxtrip4;
        }
        if (process.env.GOTIFY_URL4) {
          GOTIFY_URL = process.env.GOTIFY_URL4;
        }
        if (process.env.GOTIFY_TOKEN4) {
          GOTIFY_TOKEN = process.env.GOTIFY_TOKEN4;
        }
        if (process.env.GOTIFY_PRIORITY4) {
          GOTIFY_PRIORITY = parseInt(process.env.GOTIFY_PRIORITY4);
        }
        break;

      case 5:
        //==========================第五套环境变量赋值=========================

        if (process.env.GOBOT_URL5 && Use_gobotNotify) {
          GOBOT_URL = process.env.GOBOT_URL5;
        }
        if (process.env.GOBOT_TOKEN5 && Use_gobotNotify) {
          GOBOT_TOKEN = process.env.GOBOT_TOKEN5;
        }
        if (process.env.GOBOT_QQ5 && Use_gobotNotify) {
          GOBOT_QQ = process.env.GOBOT_QQ5;
        }

        if (process.env.PUSH_KEY5 && Use_serverNotify) {
          SCKEY = process.env.PUSH_KEY5;
        }

        if (process.env.WP_APP_TOKEN5 && Use_WxPusher) {
          WP_APP_TOKEN = process.env.WP_APP_TOKEN5;
        }

        if (process.env.WP_TOPICIDS5 && Use_WxPusher) {
          WP_TOPICIDS = process.env.WP_TOPICIDS5;
        }

        if (process.env.WP_UIDS5 && Use_WxPusher) {
          WP_UIDS = process.env.WP_UIDS5;
        }

        if (process.env.WP_URL5 && Use_WxPusher) {
          WP_URL = process.env.WP_URL5;
        }
        if (process.env.BARK_PUSH5 && Use_BarkNotify) {
          if (process.env.BARK_PUSH5.indexOf('https') > -1 || process.env.BARK_PUSH5.indexOf('http') > -1) {
            //兼容BARK自建用户
            BARK_PUSH = process.env.BARK_PUSH5;
          } else {
            BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH5}`;
          }
          if (process.env.BARK_SOUND5) {
            BARK_SOUND = process.env.BARK_SOUND5;
          }
          if (process.env.BARK_GROUP5) {
            BARK_GROUP = process.env.BARK_GROUP5;
          }
        }
        if (process.env.TG_BOT_TOKEN5 && Use_tgBotNotify) {
          TG_BOT_TOKEN = process.env.TG_BOT_TOKEN5;
        }
        if (process.env.TG_USER_ID5 && Use_tgBotNotify) {
          TG_USER_ID = process.env.TG_USER_ID5;
        }
        if (process.env.TG_PROXY_AUTH5 && Use_tgBotNotify) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH5;
        if (process.env.TG_PROXY_HOST5 && Use_tgBotNotify) TG_PROXY_HOST = process.env.TG_PROXY_HOST5;
        if (process.env.TG_PROXY_PORT5 && Use_tgBotNotify) TG_PROXY_PORT = process.env.TG_PROXY_PORT5;
        if (process.env.TG_API_HOST5 && Use_tgBotNotify) TG_API_HOST = process.env.TG_API_HOST5;

        if (process.env.DD_BOT_TOKEN5 && Use_ddBotNotify) {
          DD_BOT_TOKEN = process.env.DD_BOT_TOKEN5;
          if (process.env.DD_BOT_SECRET5) {
            DD_BOT_SECRET = process.env.DD_BOT_SECRET5;
          }
        }

        if (process.env.QYWX_KEY5 && Use_qywxBotNotify) {
          QYWX_KEY = process.env.QYWX_KEY5;
        }

        if (process.env.QYWX_AM5 && Use_qywxamNotify) {
          QYWX_AM = process.env.QYWX_AM5;
        }

        if (process.env.IGOT_PUSH_KEY5 && Use_iGotNotify) {
          IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY5;
        }

        if (process.env.PUSH_PLUS_TOKEN5 && Use_pushPlusNotify) {
          PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN5;
        }
        if (process.env.PUSH_PLUS_USER5 && Use_pushPlusNotify) {
          PUSH_PLUS_USER = process.env.PUSH_PLUS_USER5;
        }

        if (process.env.PUSH_PLUS_TOKEN_hxtrip5 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_TOKEN_hxtrip = process.env.PUSH_PLUS_TOKEN_hxtrip5;
        }
        if (process.env.PUSH_PLUS_USER_hxtrip5 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_USER_hxtrip = process.env.PUSH_PLUS_USER_hxtrip5;
        }
        if (process.env.GOTIFY_URL5) {
          GOTIFY_URL = process.env.GOTIFY_URL5;
        }
        if (process.env.GOTIFY_TOKEN5) {
          GOTIFY_TOKEN = process.env.GOTIFY_TOKEN5;
        }
        if (process.env.GOTIFY_PRIORITY5) {
          GOTIFY_PRIORITY = parseInt(process.env.GOTIFY_PRIORITY5);
        }
        break;

      case 6:
        //==========================第六套环境变量赋值=========================

        if (process.env.GOBOT_URL6 && Use_gobotNotify) {
          GOBOT_URL = process.env.GOBOT_URL6;
        }
        if (process.env.GOBOT_TOKEN6 && Use_gobotNotify) {
          GOBOT_TOKEN = process.env.GOBOT_TOKEN6;
        }
        if (process.env.GOBOT_QQ6 && Use_gobotNotify) {
          GOBOT_QQ = process.env.GOBOT_QQ6;
        }

        if (process.env.PUSH_KEY6 && Use_serverNotify) {
          SCKEY = process.env.PUSH_KEY6;
        }

        if (process.env.WP_APP_TOKEN6 && Use_WxPusher) {
          WP_APP_TOKEN = process.env.WP_APP_TOKEN6;
        }

        if (process.env.WP_TOPICIDS6 && Use_WxPusher) {
          WP_TOPICIDS = process.env.WP_TOPICIDS6;
        }

        if (process.env.WP_UIDS6 && Use_WxPusher) {
          WP_UIDS = process.env.WP_UIDS6;
        }

        if (process.env.WP_URL6 && Use_WxPusher) {
          WP_URL = process.env.WP_URL6;
        }
        if (process.env.BARK_PUSH6 && Use_BarkNotify) {
          if (process.env.BARK_PUSH6.indexOf('https') > -1 || process.env.BARK_PUSH6.indexOf('http') > -1) {
            //兼容BARK自建用户
            BARK_PUSH = process.env.BARK_PUSH6;
          } else {
            BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH6}`;
          }
          if (process.env.BARK_SOUND6) {
            BARK_SOUND = process.env.BARK_SOUND6;
          }
          if (process.env.BARK_GROUP6) {
            BARK_GROUP = process.env.BARK_GROUP6;
          }
        }
        if (process.env.TG_BOT_TOKEN6 && Use_tgBotNotify) {
          TG_BOT_TOKEN = process.env.TG_BOT_TOKEN6;
        }
        if (process.env.TG_USER_ID6 && Use_tgBotNotify) {
          TG_USER_ID = process.env.TG_USER_ID6;
        }
        if (process.env.TG_PROXY_AUTH6 && Use_tgBotNotify) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH6;
        if (process.env.TG_PROXY_HOST6 && Use_tgBotNotify) TG_PROXY_HOST = process.env.TG_PROXY_HOST6;
        if (process.env.TG_PROXY_PORT6 && Use_tgBotNotify) TG_PROXY_PORT = process.env.TG_PROXY_PORT6;
        if (process.env.TG_API_HOST6 && Use_tgBotNotify) TG_API_HOST = process.env.TG_API_HOST6;

        if (process.env.DD_BOT_TOKEN6 && Use_ddBotNotify) {
          DD_BOT_TOKEN = process.env.DD_BOT_TOKEN6;
          if (process.env.DD_BOT_SECRET6) {
            DD_BOT_SECRET = process.env.DD_BOT_SECRET6;
          }
        }

        if (process.env.QYWX_KEY6 && Use_qywxBotNotify) {
          QYWX_KEY = process.env.QYWX_KEY6;
        }

        if (process.env.QYWX_AM6 && Use_qywxamNotify) {
          QYWX_AM = process.env.QYWX_AM6;
        }

        if (process.env.IGOT_PUSH_KEY6 && Use_iGotNotify) {
          IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY6;
        }

        if (process.env.PUSH_PLUS_TOKEN6 && Use_pushPlusNotify) {
          PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN6;
        }
        if (process.env.PUSH_PLUS_USER6 && Use_pushPlusNotify) {
          PUSH_PLUS_USER = process.env.PUSH_PLUS_USER6;
        }

        if (process.env.PUSH_PLUS_TOKEN_hxtrip6 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_TOKEN_hxtrip = process.env.PUSH_PLUS_TOKEN_hxtrip6;
        }
        if (process.env.PUSH_PLUS_USER_hxtrip6 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_USER_hxtrip = process.env.PUSH_PLUS_USER_hxtrip6;
        }
        if (process.env.GOTIFY_URL6) {
          GOTIFY_URL = process.env.GOTIFY_URL6;
        }
        if (process.env.GOTIFY_TOKEN6) {
          GOTIFY_TOKEN = process.env.GOTIFY_TOKEN6;
        }
        if (process.env.GOTIFY_PRIORITY6) {
          GOTIFY_PRIORITY = parseInt(process.env.GOTIFY_PRIORITY6);
        }
        break;

      case 7:
        //==========================第七套环境变量赋值=========================

        if (process.env.GOBOT_URL7 && Use_gobotNotify) {
          GOBOT_URL = process.env.GOBOT_URL7;
        }
        if (process.env.GOBOT_TOKEN7 && Use_gobotNotify) {
          GOBOT_TOKEN = process.env.GOBOT_TOKEN7;
        }
        if (process.env.GOBOT_QQ7 && Use_gobotNotify) {
          GOBOT_QQ = process.env.GOBOT_QQ7;
        }

        if (process.env.PUSH_KEY7 && Use_serverNotify) {
          SCKEY = process.env.PUSH_KEY7;
        }

        if (process.env.WP_APP_TOKEN7 && Use_WxPusher) {
          WP_APP_TOKEN = process.env.WP_APP_TOKEN7;
        }

        if (process.env.WP_TOPICIDS7 && Use_WxPusher) {
          WP_TOPICIDS = process.env.WP_TOPICIDS7;
        }

        if (process.env.WP_UIDS7 && Use_WxPusher) {
          WP_UIDS = process.env.WP_UIDS7;
        }

        if (process.env.WP_URL7 && Use_WxPusher) {
          WP_URL = process.env.WP_URL7;
        }
        if (process.env.BARK_PUSH7 && Use_BarkNotify) {
          if (process.env.BARK_PUSH7.indexOf('https') > -1 || process.env.BARK_PUSH7.indexOf('http') > -1) {
            //兼容BARK自建用户
            BARK_PUSH = process.env.BARK_PUSH7;
          } else {
            BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH7}`;
          }
          if (process.env.BARK_SOUND7) {
            BARK_SOUND = process.env.BARK_SOUND7;
          }
          if (process.env.BARK_GROUP7) {
            BARK_GROUP = process.env.BARK_GROUP7;
          }
        }
        if (process.env.TG_BOT_TOKEN7 && Use_tgBotNotify) {
          TG_BOT_TOKEN = process.env.TG_BOT_TOKEN7;
        }
        if (process.env.TG_USER_ID7 && Use_tgBotNotify) {
          TG_USER_ID = process.env.TG_USER_ID7;
        }
        if (process.env.TG_PROXY_AUTH7 && Use_tgBotNotify) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH7;
        if (process.env.TG_PROXY_HOST7 && Use_tgBotNotify) TG_PROXY_HOST = process.env.TG_PROXY_HOST7;
        if (process.env.TG_PROXY_PORT7 && Use_tgBotNotify) TG_PROXY_PORT = process.env.TG_PROXY_PORT7;
        if (process.env.TG_API_HOST7 && Use_tgBotNotify) TG_API_HOST = process.env.TG_API_HOST7;

        if (process.env.DD_BOT_TOKEN7 && Use_ddBotNotify) {
          DD_BOT_TOKEN = process.env.DD_BOT_TOKEN7;
          if (process.env.DD_BOT_SECRET7) {
            DD_BOT_SECRET = process.env.DD_BOT_SECRET7;
          }
        }

        if (process.env.QYWX_KEY7 && Use_qywxBotNotify) {
          QYWX_KEY = process.env.QYWX_KEY7;
        }

        if (process.env.QYWX_AM7 && Use_qywxamNotify) {
          QYWX_AM = process.env.QYWX_AM7;
        }

        if (process.env.IGOT_PUSH_KEY7 && Use_iGotNotify) {
          IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY7;
        }

        if (process.env.PUSH_PLUS_TOKEN7 && Use_pushPlusNotify) {
          PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN7;
        }
        if (process.env.PUSH_PLUS_USER7 && Use_pushPlusNotify) {
          PUSH_PLUS_USER = process.env.PUSH_PLUS_USER7;
        }

        if (process.env.PUSH_PLUS_TOKEN_hxtrip7 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_TOKEN_hxtrip = process.env.PUSH_PLUS_TOKEN_hxtrip7;
        }
        if (process.env.PUSH_PLUS_USER_hxtrip7 && Use_pushPlushxtripNotify) {
          PUSH_PLUS_USER_hxtrip = process.env.PUSH_PLUS_USER_hxtrip7;
        }
        if (process.env.GOTIFY_URL7) {
          GOTIFY_URL = process.env.GOTIFY_URL7;
        }
        if (process.env.GOTIFY_TOKEN7) {
          GOTIFY_TOKEN = process.env.GOTIFY_TOKEN7;
        }
        if (process.env.GOTIFY_PRIORITY7) {
          GOTIFY_PRIORITY = parseInt(process.env.GOTIFY_PRIORITY7);
        }
        break;
    }

    //检查是否在不使用Remark进行名称替换的名单
    const notifySkipRemarkList = process.env.NOTIFY_SKIP_NAMETYPELIST
      ? process.env.NOTIFY_SKIP_NAMETYPELIST.split('&')
      : [];
    const titleIndex3 = notifySkipRemarkList.findIndex((item) => item === strTitle);

    if (text == '京东到家果园互助码:') {
      ShowRemarkType = '1';
      if (desp) {
        var arrTemp = desp.split(',');
        var allCode = '';
        for (let k = 0; k < arrTemp.length; k++) {
          if (arrTemp[k]) {
            if (arrTemp[k].substring(0, 1) != '@') allCode += arrTemp[k] + ',';
          }
        }

        if (allCode) {
          desp += '\n' + '\n' + 'ccwav格式化后的互助码:' + '\n' + allCode;
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  if (boolneedUpdate) {
    var str = JSON.stringify(TempCK, null, 2);
    writeFile(strCKFile, str, function (err) {
      if (err) {
        console.log(err);
        console.log('更新CKName_cache.json失败!');
      } else {
        console.log('缓存文件CKName_cache.json更新成功!');
      }
    });
  }

  //提供6种通知
  desp = buildLastDesp(desp, author);

  await serverNotify(text, desp); //微信server酱

  if (PUSH_PLUS_TOKEN_hxtrip) {
    console.log('hxtrip TOKEN :' + PUSH_PLUS_TOKEN_hxtrip);
  }
  if (PUSH_PLUS_USER_hxtrip) {
    console.log('hxtrip USER :' + PUSH_PLUS_USER_hxtrip);
  }
  PushErrorTime = 0;
  await pushPlusNotifyhxtrip(text, desp); //pushplushxtrip(推送加)
  if (PushErrorTime > 0) {
    console.log('等待1分钟后重试.....');
    await wait(60000);
    await pushPlusNotifyhxtrip(text, desp);
  }

  if (PUSH_PLUS_TOKEN) {
    console.log('PUSH_PLUS TOKEN :' + PUSH_PLUS_TOKEN);
  }
  if (PUSH_PLUS_USER) {
    console.log('PUSH_PLUS USER :' + PUSH_PLUS_USER);
  }
  PushErrorTime = 0;
  await pushPlusNotify(text, desp); //pushplus(推送加)
  if (PushErrorTime > 0) {
    console.log('等待1分钟后重试.....');
    await wait(60000);
    await pushPlusNotify(text, desp); //pushplus(推送加)
  }
  if (PushErrorTime > 0) {
    console.log('等待1分钟后重试.....');
    await wait(60000);
    await pushPlusNotify(text, desp); //pushplus(推送加)
  }

  //由于上述两种微信通知需点击进去才能查看到详情，故text(标题内容)携带了账号序号以及昵称信息，方便不点击也可知道是哪个京东哪个活动
  text = (text.match(/.*?(?=\s?-)/g) ? text.match(/.*?(?=\s?-)/g)?.[0] : text) ?? '';
  await Promise.all([
    BarkNotify(text, desp, params), //iOS Bark APP
    tgBotNotify(text, desp), //telegram 机器人
    ddBotNotify(text, desp), //钉钉机器人
    qywxBotNotify(text, desp), //企业微信机器人
    qywxamNotify(text, desp, strsummary), //企业微信应用消息推送
    iGotNotify(text, desp, params), //iGot
    gobotNotify(text, desp), //go-cqhttp
    gotifyNotify(text, desp), //gotify
    wxpusherNotify(text, desp), // wxpusher
  ]);
}

function gotifyNotify(text: string, desp: string) {
  if (GOTIFY_URL && GOTIFY_TOKEN) {
    return fetch(`${GOTIFY_URL}/message?token=${GOTIFY_TOKEN}`, {
      method: 'POST',
      body: new URLSearchParams({
        title: text,
        message: desp,
        priority: GOTIFY_PRIORITY.toString(),
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          console.log('gotify发送通知消息成功🎉\n');
        } else {
          console.log(`${data.message}\n`);
        }
      })
      .catch((e) => {
        console.log('gotify发送通知调用API失败！！\n');
        console.log(e);
      });
  }
}

async function gobotNotify(text: string, desp: string, time = 2100) {
  if (GOBOT_URL) {
    await wait(time);
    return fetch(`${GOBOT_URL}?access_token=${GOBOT_TOKEN}&${GOBOT_QQ}`, {
      method: 'POST',
      body: JSON.stringify({
        message: `${text}\n${desp}`,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.retcode === 0) {
          console.log('go-cqhttp发送通知消息成功🎉\n');
        } else if (data.retcode === 100) {
          console.log(`go-cqhttp发送通知消息异常: ${data.errmsg}\n`);
        } else {
          console.log(`go-cqhttp发送通知消息异常\n${JSON.stringify(data)}`);
        }
      })
      .catch((e) => {
        console.log(`go-cqhttp发送通知消息异常\n${e}`);
      });
  }
  return Promise.resolve();
}

async function serverNotify(text: string, desp: string, time = 2100) {
  if (SCKEY) {
    //微信server酱推送通知一个\n不会换行，需要两个\n才能换行，故做此替换
    desp = desp.replace(/[\n\r]/g, '\n\n');
    const options = {
      url: SCKEY.includes('SCT') ? `https://sctapi.ftqq.com/${SCKEY}.send` : `https://sc.ftqq.com/${SCKEY}.send`,
      body: `text=${text}&desp=${desp}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    await wait(time);
    return fetch(
      SCKEY.includes('SCT') ? `https://sctapi.ftqq.com/${SCKEY}.send` : `https://sc.ftqq.com/${SCKEY}.send`,
      {
        method: 'POST',
        body: new URLSearchParams({
          text,
          desp,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(timeout),
      },
    )
      .then((res) => res.json())
      .then((data) => {
        //server酱和Server酱·Turbo版的返回json格式不太一样
        if (data.errno === 0 || data.data.errno === 0) {
          console.log('server酱发送通知消息成功🎉\n');
        } else if (data.errno === 1024) {
          // 一分钟内发送相同的内容会触发
          console.log(`server酱发送通知消息异常: ${data.errmsg}\n`);
        } else {
          console.log(`server酱发送通知消息异常\n${JSON.stringify(data)}`);
        }
      })
      .catch((e) => {
        console.log('发送通知调用API失败！！\n');
        console.log(e);
      });
  }
}

function BarkNotify(text: string, desp: string, params = {}) {
  if (BARK_PUSH) {
    return fetch(
      `${BARK_PUSH}/${encodeURIComponent(text)}/${encodeURIComponent(desp)}?${new URLSearchParams(
        Object.assign(
          {
            sound: BARK_SOUND,
            group: BARK_GROUP,
          },
          params,
        ),
      )}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(timeout),
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200) {
          console.log('Bark APP发送通知消息成功🎉\n');
        } else {
          console.log(`${data.message}\n`);
        }
      })
      .catch((e) => {
        console.log('Bark APP发送通知调用API失败！！\n');
        console.log(e);
      });
  }
}

function tgBotNotify(text: string, desp: string) {
  if (TG_BOT_TOKEN && TG_USER_ID) {
    if (TG_PROXY_HOST && TG_PROXY_PORT) {
      // const agent = {
      //     https: tunnel.httpsOverHttp({
      //         proxy: {
      //             host: TG_PROXY_HOST,
      //             port: parseInt(TG_PROXY_PORT),
      //             proxyAuth: TG_PROXY_AUTH
      //         }
      //     })
      // }
      // Object.assign(options, { agent })
    }
    return fetch(`https://${TG_API_HOST}/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      body: JSON.stringify({
        chat_id: `${TG_USER_ID}`,
        text: `${text}\n\n${desp}`,
        disable_web_page_preview: true,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          console.log('Telegram发送通知消息成功�。\n');
        } else if (data.error_code === 400) {
          console.log('请主动给bot发送一条消息并检查接收用户ID是否正确。\n');
        } else if (data.error_code === 401) {
          console.log('Telegram bot token 填写错误。\n');
        }
      })
      .catch((e) => {
        console.log('telegram发送通知消息失败！！\n');
        console.log(e);
      });
  }
}

function ddBotNotify(text: string, desp: string) {
  if (DD_BOT_TOKEN) {
    let url = `https://oapi.dingtalk.com/robot/send?access_token=${DD_BOT_TOKEN}`;
    if (DD_BOT_SECRET) {
      const dateNow = Date.now();
      const hmac = createHmac('sha256', DD_BOT_SECRET);
      hmac.update(`${dateNow}\n${DD_BOT_SECRET}`);
      const result = encodeURIComponent(hmac.digest('base64'));
      url = `${url}&timestamp=${dateNow}&sign=${result}`;
    }
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: ` ${text}\n\n${desp}`,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.errcode === 0) {
          console.log('钉钉发送通知消息成功🎉。\n');
        } else {
          console.log(`${data.errmsg}\n`);
        }
      })
      .catch((e) => {
        console.log('钉钉发送通知消息失败！！\n');
        console.log(e);
      });
  }
}

function qywxBotNotify(text: string, desp: string) {
  if (QYWX_KEY) {
    return fetch(`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${QYWX_KEY}`, {
      method: 'POST',
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: ` ${text}\n\n${desp}`,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.errcode === 0) {
          console.log('企业微信发送通知消息成功🎉。\n');
        } else {
          console.log(`${data.errmsg}\n`);
        }
      })
      .catch((e) => {
        console.log('企业微信发送通知消息失败！！\n');
        console.log(e);
      });
  }
}

function buildLastDesp(desp: string, author = '') {
  author = process.env.NOTIFY_AUTHOR || author;
  if (process.env.NOTIFY_AUTHOR_BLANK || !author) {
    return desp.trim();
  } else {
    if (!author.match(/本通知 By/)) {
      author = `\n\n本通知 By ${author}`;
    }
    return desp.trim() + author + '\n通知时间: ' + GetDateTime(new Date());
  }
}

function ChangeUserId(desp: string) {
  const QYWX_AM_AY = QYWX_AM.split(',');
  if (QYWX_AM_AY[2]) {
    const userIdTmp = QYWX_AM_AY[2].split('|');
    let userId = '';
    for (let i = 0; i < userIdTmp.length; i++) {
      const count = '账号' + (i + 1);
      const count2 = '签到号 ' + (i + 1);
      if (desp.match(count2)) {
        userId = userIdTmp[i];
      }
    }
    if (!userId) userId = QYWX_AM_AY[2];
    return userId;
  } else {
    return '@all';
  }
}

function qywxamNotify(text: string, desp: string, strsummary = '') {
  if (QYWX_AM) {
    const QYWX_AM_AY = QYWX_AM.split(',');
    return fetch(`https://qyapi.weixin.qq.com/cgi-bin/gettoken`, {
      method: 'POST',
      body: JSON.stringify({
        corpid: `${QYWX_AM_AY[0]}`,
        corpsecret: `${QYWX_AM_AY[1]}`,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        let html = desp.replace(/\n/g, '<br/>');
        html = `<font size="3">${html}</font>`;
        if (strsummary == '') {
          strsummary = desp;
        }
        let accesstoken = data.access_token;
        let options;
        switch (QYWX_AM_AY[4]) {
          case '0':
            options = {
              msgtype: 'textcard',
              textcard: {
                title: `${text}`,
                description: `${strsummary}`,
                url: 'https://github.com/whyour/qinglong',
                btntxt: '更多',
              },
            };
            break;

          case '1':
            options = {
              msgtype: 'text',
              text: {
                content: `${text}\n\n${desp}`,
              },
            };
            break;

          default:
            options = {
              msgtype: 'mpnews',
              mpnews: {
                articles: [
                  {
                    title: `${text}`,
                    thumb_media_id: `${QYWX_AM_AY[4]}`,
                    author: `智能助手`,
                    content_source_url: ``,
                    content: `${html}`,
                    digest: `${strsummary}`,
                  },
                ],
              },
            };
        }
        if (!QYWX_AM_AY[4]) {
          //如不提供第四个参数,则默认进行文本消息类型推送
          options = {
            msgtype: 'text',
            text: {
              content: `${text}\n\n${desp}`,
            },
          };
        }
        return fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accesstoken}`, {
          method: 'POST',
          body: JSON.stringify({
            touser: `${ChangeUserId(desp)}`,
            agentid: `${QYWX_AM_AY[3]}`,
            safe: '0',
            ...options,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.errcode === 0) {
              console.log('成员ID:' + ChangeUserId(desp) + '企业微信应用消息发送通知消息成功🎉。\n');
            } else {
              console.log(`${data.errmsg}\n`);
            }
          });
      })
      .catch((e) => {
        console.log('成员ID:' + ChangeUserId(desp) + '企业微信应用消息发送通知消息失败！！\n');
        console.error(e);
      });
  }
}

function iGotNotify(text: string, desp: string, params = {}) {
  if (IGOT_PUSH_KEY) {
    // 校验传入的IGOT_PUSH_KEY是否有效
    const IGOT_PUSH_KEY_REGX = new RegExp('^[a-zA-Z0-9]{24}$');
    if (!IGOT_PUSH_KEY_REGX.test(IGOT_PUSH_KEY)) {
      console.log('您所提供的IGOT_PUSH_KEY无效\n');
      return;
    }
    return fetch(`https://push.hellyw.com/${IGOT_PUSH_KEY.toLowerCase()}`, {
      method: 'POST',
      body: new URLSearchParams({
        title: text,
        content: desp,
        ...params,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ret === 0) {
          console.log('iGot发送通知消息成功🎉\n');
        } else {
          console.log(`iGot发送通知消息失败：${data.errMsg}\n`);
        }
      })
      .catch((e) => {
        console.log('发送通知调用API失败！！\n');
        console.log(e);
      });
  }
}
function pushPlusNotifyhxtrip(text: string, desp: string) {
  if (PUSH_PLUS_TOKEN_hxtrip) {
    //desp = `<font size="3">${desp}</font>`;

    desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
    const body = {
      token: `${PUSH_PLUS_TOKEN_hxtrip}`,
      title: `${text}`,
      content: `${desp}`,
      topic: `${PUSH_PLUS_USER_hxtrip}`,
    };
    return fetch(`http://pushplus.hxtrip.com/send`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': ' application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.text())
      .then((data) => {
        if (data.indexOf('200') > -1) {
          console.log(`hxtrip push+发送${PUSH_PLUS_USER_hxtrip ? '一对多' : '一对一'}通知消息完成。\n`);
          PushErrorTime = 0;
        } else {
          console.log(`hxtrip push+发送${PUSH_PLUS_USER_hxtrip ? '一对多' : '一对一'}通知消息失败：${data}\n`);
          PushErrorTime += 1;
        }
      })
      .catch((e) => {
        console.log(`hxtrip push+发送${PUSH_PLUS_USER_hxtrip ? '一对多' : '一对一'}通知消息失败！！\n`);
        PushErrorTime += 1;
        console.log(e);
      });
  }
}

function pushPlusNotify(text: string, desp: string) {
  if (PUSH_PLUS_TOKEN) {
    //desp = `<font size="3">${desp}</font>`;

    desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
    const body = {
      token: `${PUSH_PLUS_TOKEN}`,
      title: `${text}`,
      content: `${desp}`,
      topic: `${PUSH_PLUS_USER}`,
    };
    return fetch(`https://www.pushplus.plus/send`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': ' application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200) {
          console.log(`push+发送${PUSH_PLUS_USER ? '一对多' : '一对一'}通知消息完成。\n`);
          PushErrorTime = 0;
        } else {
          console.log(`push+发送${PUSH_PLUS_USER ? '一对多' : '一对一'}通知消息失败：${data.msg}\n`);
          PushErrorTime += 1;
        }
      })
      .catch((e) => {
        console.log(`push+发送${PUSH_PLUS_USER ? '一对多' : '一对一'}通知消息失败！！\n`);
        PushErrorTime += 1;
        console.log(e);
      });
  }
}

function wxpusherNotify(text: string, desp: string) {
  if (WP_APP_TOKEN) {
    let uids = [];
    for (let i of WP_UIDS.split(';')) {
      if (i.length != 0) uids.push(i);
    }
    let topicIds = [];
    for (let i of WP_TOPICIDS.split(';')) {
      if (i.length != 0) topicIds.push(i);
    }
    desp = `<font size="4"><b>${text}</b></font>\n\n<font size="3">${desp}</font>`;
    desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
    const body = {
      appToken: `${WP_APP_TOKEN}`,
      content: `${text}\n\n${desp}`,
      summary: `${text}`,
      contentType: 2,
      topicIds: topicIds,
      uids: uids,
      url: `${WP_URL}`,
    };
    return fetch(`http://wxpusher.zjiecode.com/api/send/message`, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 1000) {
          console.log('WxPusher 发送通知消息成功!\n');
        }
      })
      .catch((e) => {
        console.log('WxPusher 发送通知调用 API 失败！！\n');
        console.log(e);
      });
  }
}

function GetDateTime(date: Date) {
  var timeString = '';

  var timeString = date.getFullYear() + '-';
  if (date.getMonth() + 1 < 10) timeString += '0' + (date.getMonth() + 1) + '-';
  else timeString += date.getMonth() + 1 + '-';

  if (date.getDate() < 10) timeString += '0' + date.getDate() + ' ';
  else timeString += date.getDate() + ' ';

  if (date.getHours() < 10) timeString += '0' + date.getHours() + ':';
  else timeString += date.getHours() + ':';

  if (date.getMinutes() < 10) timeString += '0' + date.getMinutes() + ':';
  else timeString += date.getMinutes() + ':';

  if (date.getSeconds() < 10) timeString += '0' + date.getSeconds();
  else timeString += date.getSeconds();

  return timeString;
}
