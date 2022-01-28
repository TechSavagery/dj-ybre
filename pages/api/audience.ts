import mailchimp from '@mailchimp/mailchimp_marketing';

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

const listId = 'b7d1b4d93b';

export default async function addToAudience(req: any, res: any) {
  const { email } = JSON.parse(req.body);
  try {
    const createReponse = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed',
    });
    console.log(createReponse);
    return res.status(200).json({ status: 'contact added successfully' });
  } catch (err) {
    console.error(err);
  }
}
