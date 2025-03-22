## aws-cost-cli
> CLI tool to perform cost analysis on your AWS account with Slack integration

## Installation

Install the package globally or alternatively you can also use `npx`

```bash
npm install -g infra-cost
```

## Usage

For the simple usage, just run the command without any options. 

```
aws-cost
```

The output will be a the totals with breakdown by service. Optionally, you can pass the following options to modify the output:

```bash
$ aws-cost --help

  Usage: aws-cost [options]

  A CLI tool to perform cost analysis on your AWS account

  Options:
    -V, --version                  output the version number

    -k, --access-key [key]         AWS access key
    -s, --secret-key [key]         AWS secret key
    -r, --region [region]          AWS region (default: us-east-1)

    -p, --profile [profile]        AWS profile to use (default: "default")

    -j, --json                     Get the output as JSON
    -u, --summary                  Get only the summary without service breakdown
    -t, --text                     Get the output as plain text (no colors / tables)

    -S, --slack-token [token]      Slack token for the slack message
    -C, --slack-channel [channel]  Slack channel to post the message to

    -v, --version                  Get the version of the CLI
    -h, --help                     Get the help of the CLI
```

In order to use the CLI you can either pass the AWS credentials through the options i.e.:

```bash
aws-cost -k [key] -s [secret] -r [region]
```

or if you have configured the credentials using [aws-cli](https://github.com/aws/aws-cli), you can simply run the following command:

```bash
aws-cost
```

To configure the credentials using aws-cli, have a look at the [aws-cli docs](https://github.com/aws/aws-cli#configuration) for more information.

## Detailed Breakdown
> The default usage is to get the cost breakdown by service

```bash
aws-cost
```
You will get the following output

## Total Costs
> You can also get the summary of the cost without the service breakdown

```bash
aws-cost --summary
```
You will get the following output

## Plain Text
> You can also get the output as plain text

```bash
aws-cost --text
```
You will get the following output in response

## JSON Output
> You can also get the output as JSON

```bash
aws-cost --json
```

<details>
  <summary>You will get the following output in response</summary>

```json
```
</details>

## Slack Integration

> You can also get the output as a slack message

You will need to create [a slack app](https://api.slack.com/apps?new_app=1), visit the **OAuth & Permissions** tab, and add the `chat:write` and `chat:write.public` scopes. Then create an OAuth token from the "OAuth Tokens" section and pass it to the CLI.

> **Note:** The `--slack-channel` is the [channel id](https://stackoverflow.com/questions/40940327/what-is-the-simplest-way-to-find-a-slack-team-id-and-a-channel-id#answer-44883343), not the name.

```bash
aws-cost --slack-token [token] --slack-channel [channel]
```

You will get the message on slack with the breakdown:

You can set up a GitHub [workflow similar to this](https://github.com/codecollab-co/infra-cost/blob/7549ceb2ba75b562e29f85ac53a9413c3e1f57ee/.github/workflows/aws-costs.yml#L1) which can send the daily cost breakdown to Slack.

## Note

Regarding the credentials, you need to have the following permissions in order to use the CLI:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "iam:ListAccountAliases",
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

Also, please note that this tool uses AWS Cost Explorer under the hood which [costs $0.01 per request](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/pricing/).

## License
MIT &copy; Code Collab
