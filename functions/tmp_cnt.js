const admin=require("firebase-admin");
admin.initializeApp({credential:admin.credential.cert(require("./grammgold-firebase.json"))});
admin.firestore().collection("users").get().then(s=>{
  let withTok=0, noTok=0, hidden=0;
  const HIDDEN=new Set(["user_3380"]);
  s.forEach(d=>{const x=d.data();
    if(HIDDEN.has(d.id)) hidden++;
    if(x.fcm_token && String(x.fcm_token).length>20) withTok++; else noTok++;
  });
  console.log("Нийт хэрэглэгч       :",s.size);
  console.log("FCM token-той (push) :",withTok);
  console.log("Token-гүй (зөвхөн in-app):",noTok);
  console.log("Кампанит нуусан uid  :",hidden);
  process.exit(0);
}).catch(e=>{console.error(e);process.exit(1)});
