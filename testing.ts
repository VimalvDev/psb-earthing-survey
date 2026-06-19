import { Resend } from 'resend';

const resend = new Resend('re_FqGF9N74_4Ed8NqKwCHihh1NUqGZQQW8G');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'psbsisify@gmail.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});