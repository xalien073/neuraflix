import { driver } from 'gremlin';


const authenticator = new driver.auth.PlainTextSaslAuthenticator(
  `/dbs/AirTrafficDB/colls/netflix`,
  process.env.GREMLIN_PK
);

export const client = new driver.Client(process.env.GREMLIN_ENDPOINT, {
  authenticator,
  traversalsource: 'g',
  rejectUnauthorized: true,
  mimeType: 'application/vnd.gremlin-v2.0+json',
});
