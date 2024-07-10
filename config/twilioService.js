const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendOtp = (phoneNumber, otp ,body) => {

   console.log(phoneNumber);

   const accountSid = 'ACebeb1b53dd24f4f591ebe84b2d374a20';
   const authToken = 'a10bf491b62c7dd0f97a7aba8289afbc';
   const client = require('twilio')(accountSid, authToken);
   
  return client.verify.v2.services("VAf981c2b60d7a7fac6c1c078597b4bd7f")
         .verifications
         .create({to: '+201550689858', channel: 'sms'})
         .then(verification => console.log(verification.sid));

  // return  client.verify.v2
  // .services("VAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
  // .verifications.create({
  //   channel: "whatsapp",
  //   to: "+15017122661",
  // });

console.log(verification.accountSid);



  // return client.messages.create({
  //   body: `Your ${body} code is: ${otp}`,
  //   from: `whatsapp:${+19034939817}`,
  //   to: `whatsapp:${+2001550689858}`
  // });

};

module.exports = { sendOtp };
