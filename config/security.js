/**
 * Created by truongtu on 4/14/2017.
 */
module.exports.security = {
  oauth : {
    version : '2.0',
    token : {
      length: 32,
      expiration: 2592000
    }
  },
  urlToken:{
    length: 15,
    expiration: 86400
  },
  admin: {
    email: {
      port: process.env.EMAIL_PORT,
      secure: true,
      host: process.env.EMAIL_HOST,
      auth: {
        user: process.env.EMAIL_USER_TADAA,
        pass: process.env.EMAIL_PASS_TADAA
      },
      transport: process.env.EMAIL_TRANSPORT,
      accessKeyId: process.env.EMAIL_ACCESSKEY_ID,
      secretAccessKey: process.env.EMAIL_SECRET_ACCESSKEY,
      region: process.env.EMAIL_REGION
    }
  },
  bot: 'https://s3-ap-southeast-1.amazonaws.com/perkfec-profile-data/logo-bot.png',
  s3Bucket: 'https://s3-ap-southeast-1.amazonaws.com/perkfec-profile-data/',
  server: {
    domain: process.env.SERVER_DOMAIN
  },
  s3: {
    key: 'AKIAJ5YCTVVH6V3KDDXQ',
    secret: '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',
    bucket: 'perkfec-profile-data'
  },
  default: {
    url: 'https://perkfec-profile-data.s3.amazonaws.com/c2c1a961-51e5-4039-a34c-4d58b9888202.png'
  },
  zoho:{
    service: 'Zoho',
    auth: {
      user: 'emma@perkfec.vn',
      pass: 'perkfec@123@vn',
    },
  },
  pushNotiServer:{
    publicKey: "BFM7sfDs0tG0xV9KbOOC7zn67j3dY47j8mdNFtsf28DO7wFnMsxTI_NEIXw9TNWLmc-hvgrS6FeESe2iXLyhZ5k",
    privateKey: "5IZ2XUHepOYO_pEWjzj-iwuXxxfosI6kVYmvzOH13JA"
  }
};
