import { IAMClient, ListAccountAliasesCommand } from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { AWSConfig, AWSClientConfig } from './config';
import { showSpinner } from './logger';

export async function getAccountAlias(awsConfig: AWSClientConfig): Promise<string> {
  showSpinner('Getting account alias');

  const iam = new IAMClient({
    credentials: awsConfig.credentials,
    region: awsConfig.region,
  });

  const listAliasesCommand = new ListAccountAliasesCommand({});
  const accountAliases = await iam.send(listAliasesCommand);
  const foundAlias = accountAliases?.AccountAliases?.[0];

  if (foundAlias) {
    return foundAlias;
  }

  const sts = new STSClient({
    credentials: awsConfig.credentials,
    region: awsConfig.region,
  });

  const getCallerIdentityCommand = new GetCallerIdentityCommand({});
  const accountInfo = await sts.send(getCallerIdentityCommand);

  return accountInfo?.Account || '';
}
