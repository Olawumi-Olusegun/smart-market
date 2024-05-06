import nodemailer from "nodemailer";
import currentENV from "src/constants/constants";

let transport = nodemailer.createTransport({
    host: currentENV.MAILTRAP_HOSTNAME,
    port: currentENV.MAILTRAP_PORT,
    auth: {
      user: currentENV.MAILTRAP_USER,
      pass: currentENV.MAILTRAP_PASS
    }
  });

const sendVerification = async (email: string, link: string) => {
    
  try {
         await transport.sendMail({
            from: "olawumi.olusegun@gmail.com",
            to: email,
            html: `<h1>Please click on <a href="${link}"> this link</a> to verify your email</h1>`
          });
    } catch (error) {
        
    }
}

const sendPasswordResetLink = async (email: string, link: string) => {
    try {
         await transport.sendMail({
            from: "olawumi.olusegun@gmail.com",
            to: email,
            html: `<h1>Please click on <a href="${link}"> this link</a> to update your password</h1>`
          });
    } catch (error) {
        
    }
}

const sendPasswordUpdateMessage = async (email: string) => {
    try {
         await transport.sendMail({
            from: "olawumi.olusegun@gmail.com",
            to: email,
            html: `<h1>Your password has been updated</h1>`
          });
    } catch (error) {
        
    }
}

const mail = {
    sendVerification,
    sendPasswordResetLink,
    sendPasswordUpdateMessage
}

export default mail;