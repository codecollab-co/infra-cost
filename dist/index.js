// src/index.ts
import { Command } from "commander";

// package.json
var package_default = {
  name: "infra-cost",
  version: "0.1.0",
  description:
    "A CLI tool to perform cost analysis on your infra account's cost",
  type: "module",
  author: {
    name: "Code Collab",
    email: "codecollab.co@gmail.com",
    url: "https://github.com/codecollab-co/infra-cost",
  },
  files: ["!tests/**/*", "dist/**/*", "!dist/**/*.js.map", "bin/**/*"],
  bin: {
    "aws-cost": "./bin/index.js",
  },
  scripts: {
    build: "tsup",
    dev: "tsup --watch",
    prebuild: "run-s clean",
    predev: "run-s clean",
    clean: "rm -rf dist",
    typecheck: "tsc --noEmit",
    test: 'echo "Error: no test specified" && exit 1',
  },
  keywords: [
    "aws",
    "cost",
    "cli",
    "aws-cost",
    "aws-cost-cli",
    "aws-costs",
    "typescript",
    "aws cli",
  ],
  license: "MIT",
  repository: {
    type: "git",
    url: "https://github.com/codecollab-co/infra-cost.git",
  },
  engines: {
    node: ">=12.0",
  },
  bugs: {
    url: "https://github.com/codecollab-co/infra-cost/issues",
  },
  homepage: "https://github.com/codecollab-co/infra-cost#readme",
  dependencies: {
    "@aws-sdk/shared-ini-file-loader": "^3.254.0",
    "aws-sdk": "^2.1299.0",
    chalk: "^5.2.0",
    commander: "^10.0.0",
    dayjs: "^1.11.7",
    dotenv: "^16.0.3",
    "node-fetch": "^3.3.0",
    ora: "^6.1.2",
  },
  devDependencies: {
    "@types/node": "^18.11.18",
    "npm-run-all": "^4.1.5",
    "ts-node": "^10.9.1",
    tsup: "^6.5.0",
    typescript: "^4.9.4",
  },
};

// src/account.ts
import AWS from "aws-sdk";

// src/logger.ts
import chalk from "chalk";
import ora from "ora";
function printFatalError(error) {
  console.error(`
    ${chalk.bold.redBright.underline(`Error:`)}
    ${chalk.redBright(`${error}`)}
  `);
  process.exit(1);
}
var spinner;
function showSpinner(text) {
  if (!spinner) {
    spinner = ora({ text: "" }).start();
  }
  spinner.text = text;
}
function hideSpinner() {
  if (!spinner) {
    return;
  }
  spinner.stop();
}

// src/account.ts
async function getAccountAlias(awsConfig2) {
  var _a;
  showSpinner("Getting account alias");
  const iam = new AWS.IAM(awsConfig2);
  const accountAliases = await iam.listAccountAliases().promise();
  const foundAlias =
    (_a = accountAliases == null ? void 0 : accountAliases["AccountAliases"]) ==
    null
      ? void 0
      : _a[0];
  if (foundAlias) {
    return foundAlias;
  }
  const sts = new AWS.STS(awsConfig2);
  const accountInfo = await sts.getCallerIdentity().promise();
  return (accountInfo == null ? void 0 : accountInfo.Account) || "";
}

// src/config.ts
import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import chalk2 from "chalk";
async function getAwsConfigFromOptionsOrFile(options2) {
  const { profile, accessKey, secretKey, sessionToken, region } = options2;
  if (accessKey || secretKey) {
    if (!accessKey || !secretKey) {
      printFatalError(`
      You need to provide both of the following options:
        ${chalk2.bold("--access-key")}
        ${chalk2.bold("--secret-key")}
      `);
    }
    return {
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        sessionToken,
      },
      region,
    };
  }
  return {
    credentials: await loadAwsCredentials(profile),
    region,
  };
}
async function loadAwsCredentials(profile = "default") {
  var _a, _b, _c;
  const configFiles = await loadSharedConfigFiles();
  const credentialsFile = configFiles.credentialsFile;
  const accessKey =
    (_a = credentialsFile == null ? void 0 : credentialsFile[profile]) == null
      ? void 0
      : _a.aws_access_key_id;
  const secretKey =
    (_b = credentialsFile == null ? void 0 : credentialsFile[profile]) == null
      ? void 0
      : _b.aws_secret_access_key;
  const sessionToken =
    (_c = credentialsFile == null ? void 0 : credentialsFile[profile]) == null
      ? void 0
      : _c.aws_session_token;
  if (!accessKey || !secretKey) {
    const sharedCredentialsFile =
      process.env.AWS_SHARED_CREDENTIALS_FILE || "~/.aws/credentials";
    const sharedConfigFile = process.env.AWS_CONFIG_FILE || "~/.aws/config";
    printFatalError(`
    Could not find the AWS credentials in the following files for the profile "${profile}":
      ${chalk2.bold(sharedCredentialsFile)}
      ${chalk2.bold(sharedConfigFile)}

    If the config files exist at different locations, set the following environment variables:
      ${chalk2.bold(`AWS_SHARED_CREDENTIALS_FILE`)}
      ${chalk2.bold(`AWS_CONFIG_FILE`)}

    You can also configure the credentials via the following command:
      ${chalk2.bold(`aws configure --profile ${profile}`)}

    You can also provide the credentials via the following options:
      ${chalk2.bold(`--access-key`)}
      ${chalk2.bold(`--secret-key`)}
      ${chalk2.bold(`--region`)}
    `);
  }
  return {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    sessionToken,
  };
}

// src/cost.ts
import AWS2 from "aws-sdk";
import dayjs from "dayjs";
async function getRawCostByService(awsConfig2) {
  showSpinner("Getting pricing data");
  const costExplorer = new AWS2.CostExplorer(awsConfig2);
  const endDate = dayjs().subtract(1, "day");
  const startDate = endDate.subtract(65, "day");
  const pricingData = await costExplorer
    .getCostAndUsage({
      TimePeriod: {
        Start: startDate.format("YYYY-MM-DD"),
        End: endDate.format("YYYY-MM-DD"),
      },
      Granularity: "DAILY",
      Filter: {
        Not: {
          Dimensions: {
            Key: "RECORD_TYPE",
            Values: ["Credit", "Refund", "Upfront", "Support"],
          },
        },
      },
      Metrics: ["UnblendedCost"],
      GroupBy: [
        {
          Type: "DIMENSION",
          Key: "SERVICE",
        },
      ],
    })
    .promise();
  const costByService = {};
  for (const day of pricingData.ResultsByTime) {
    for (const group of day.Groups) {
      const serviceName = group.Keys[0];
      const cost = group.Metrics.UnblendedCost.Amount;
      const costDate = day.TimePeriod.End;
      costByService[serviceName] = costByService[serviceName] || {};
      costByService[serviceName][costDate] = parseFloat(cost);
    }
  }
  return costByService;
}
function calculateServiceTotals(rawCostByService) {
  const totals = {
    lastMonth: 0,
    thisMonth: 0,
    last7Days: 0,
    yesterday: 0,
  };
  const totalsByService = {
    lastMonth: {},
    thisMonth: {},
    last7Days: {},
    yesterday: {},
  };
  const startOfLastMonth = dayjs().subtract(1, "month").startOf("month");
  const startOfThisMonth = dayjs().startOf("month");
  const startOfLast7Days = dayjs().subtract(7, "day");
  const startOfYesterday = dayjs().subtract(1, "day");
  for (const service of Object.keys(rawCostByService)) {
    const servicePrices = rawCostByService[service];
    let lastMonthServiceTotal = 0;
    let thisMonthServiceTotal = 0;
    let last7DaysServiceTotal = 0;
    let yesterdayServiceTotal = 0;
    for (const date of Object.keys(servicePrices)) {
      const price = servicePrices[date];
      const dateObj = dayjs(date);
      if (dateObj.isSame(startOfLastMonth, "month")) {
        lastMonthServiceTotal += price;
      }
      if (dateObj.isSame(startOfThisMonth, "month")) {
        thisMonthServiceTotal += price;
      }
      if (
        dateObj.isSame(startOfLast7Days, "week") &&
        !dateObj.isSame(startOfYesterday, "day")
      ) {
        last7DaysServiceTotal += price;
      }
      if (dateObj.isSame(startOfYesterday, "day")) {
        yesterdayServiceTotal += price;
      }
    }
    totalsByService.lastMonth[service] = lastMonthServiceTotal;
    totalsByService.thisMonth[service] = thisMonthServiceTotal;
    totalsByService.last7Days[service] = last7DaysServiceTotal;
    totalsByService.yesterday[service] = yesterdayServiceTotal;
    totals.lastMonth += lastMonthServiceTotal;
    totals.thisMonth += thisMonthServiceTotal;
    totals.last7Days += last7DaysServiceTotal;
    totals.yesterday += yesterdayServiceTotal;
  }
  return {
    totals,
    totalsByService,
  };
}
async function getTotalCosts(awsConfig2) {
  const rawCosts = await getRawCostByService(awsConfig2);
  const totals = calculateServiceTotals(rawCosts);
  return totals;
}

// src/printers/fancy.ts
import chalk3 from "chalk";
function printFancy(accountAlias, totals, isSummary = false) {
  hideSpinner();
  console.clear();
  const totalCosts = totals.totals;
  const serviceCosts = totals.totalsByService;
  const allServices = Object.keys(serviceCosts.yesterday);
  const sortedServiceNames = allServices.sort((a, b) => b.length - a.length);
  const maxServiceLength =
    sortedServiceNames.reduce((max, service) => {
      return Math.max(max, service.length);
    }, 0) + 1;
  const totalLastMonth = chalk3.green(`$${totalCosts.lastMonth.toFixed(2)}`);
  const totalThisMonth = chalk3.green(`$${totalCosts.thisMonth.toFixed(2)}`);
  const totalLast7Days = chalk3.green(`$${totalCosts.last7Days.toFixed(2)}`);
  const totalYesterday = chalk3.bold.yellowBright(
    `$${totalCosts.yesterday.toFixed(2)}`,
  );
  console.log("");
  console.log(
    `${"AWS Cost Report:".padStart(maxServiceLength + 1)} ${chalk3.bold.yellow(accountAlias)}`,
  );
  console.log("");
  console.log(`${"Last Month".padStart(maxServiceLength)}: ${totalLastMonth}`);
  console.log(`${"This Month".padStart(maxServiceLength)}: ${totalThisMonth}`);
  console.log(`${"Last 7 days".padStart(maxServiceLength)}: ${totalLast7Days}`);
  console.log(
    `${chalk3.bold("Yesterday".padStart(maxServiceLength))}: ${totalYesterday}`,
  );
  console.log("");
  if (isSummary) {
    return;
  }
  const headerPadLength = 11;
  const serviceHeader = chalk3.white("Service".padStart(maxServiceLength));
  const lastMonthHeader = chalk3.white(`Last Month`.padEnd(headerPadLength));
  const thisMonthHeader = chalk3.white(`This Month`.padEnd(headerPadLength));
  const last7DaysHeader = chalk3.white(`Last 7 Days`.padEnd(headerPadLength));
  const yesterdayHeader = chalk3.bold.white(
    "Yesterday".padEnd(headerPadLength),
  );
  console.log(
    `${serviceHeader} ${lastMonthHeader} ${thisMonthHeader} ${last7DaysHeader} ${yesterdayHeader}`,
  );
  for (let service of sortedServiceNames) {
    const serviceLabel = chalk3.cyan(service.padStart(maxServiceLength));
    const lastMonthTotal = chalk3.green(
      `$${serviceCosts.lastMonth[service].toFixed(2)}`.padEnd(headerPadLength),
    );
    const thisMonthTotal = chalk3.green(
      `$${serviceCosts.thisMonth[service].toFixed(2)}`.padEnd(headerPadLength),
    );
    const last7DaysTotal = chalk3.green(
      `$${serviceCosts.last7Days[service].toFixed(2)}`.padEnd(headerPadLength),
    );
    const yesterdayTotal = chalk3.bold.yellowBright(
      `$${serviceCosts.yesterday[service].toFixed(2)}`.padEnd(headerPadLength),
    );
    console.log(
      `${serviceLabel} ${lastMonthTotal} ${thisMonthTotal} ${last7DaysTotal} ${yesterdayTotal}`,
    );
  }
}

// src/printers/json.ts
function printJson(accountAlias, totalCosts, isSummary = false) {
  hideSpinner();
  if (isSummary) {
    console.log(
      JSON.stringify(
        {
          account: accountAlias,
          totals: totalCosts.totals,
        },
        null,
        2,
      ),
    );
    return;
  }
  console.log(
    JSON.stringify(
      {
        account: accountAlias,
        ...totalCosts,
      },
      null,
      2,
    ),
  );
}

// src/printers/slack.ts
import fetch from "node-fetch";
function formatServiceBreakdown(costs2) {
  const serviceCosts = costs2.totalsByService;
  const sortedServices = Object.keys(serviceCosts.yesterday)
    .filter((service) => serviceCosts.yesterday[service] > 0)
    .sort((a, b) => serviceCosts.yesterday[b] - serviceCosts.yesterday[a]);
  const serviceCostsYesterday = sortedServices.map((service) => {
    return `> ${service}: \`$${serviceCosts.yesterday[service].toFixed(2)}\``;
  });
  return serviceCostsYesterday.join("\n");
}
async function notifySlack(
  accountAlias,
  costs2,
  isSummary,
  slackToken,
  slackChannel,
) {
  const channel = slackChannel;
  const totals = costs2.totals;
  const serviceCosts = costs2.totalsByService;
  let serviceCostsYesterday = [];
  Object.keys(serviceCosts.yesterday).forEach((service) => {
    serviceCosts.yesterday[service].toFixed(2);
    serviceCostsYesterday.push(
      `${service}: $${serviceCosts.yesterday[service].toFixed(2)}`,
    );
  });
  const summary = `> *Account: ${accountAlias}*

> *Summary *
> Total Yesterday: \`$${totals.yesterday.toFixed(2)}\`
> Total This Month: \`$${totals.thisMonth.toFixed(2)}\`
> Total Last Month: \`$${totals.lastMonth.toFixed(2)}\`
`;
  const breakdown = `
> *Breakdown by Service:*
${formatServiceBreakdown(costs2)}
`;
  let message = `${summary}`;
  if (!isSummary) {
    message += `${breakdown}`;
  }
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "post",
    body: JSON.stringify({
      channel,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message,
          },
        },
      ],
    }),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${slackToken}`,
    },
  });
  const data = await response.json();
  if (!data.ok) {
    const message2 = data.error || "Unknown error";
    console.error(`
Failed to send message to Slack: ${message2}`);
    process.exit(1);
  }
  console.log("\nSuccessfully sent message to Slack");
}

// src/printers/text.ts
function printPlainSummary(accountAlias, costs2) {
  hideSpinner();
  console.clear();
  console.log("");
  console.log(`Account: ${accountAlias}`);
  console.log("");
  console.log("Totals:");
  console.log(`  Last Month: $${costs2.totals.lastMonth.toFixed(2)}`);
  console.log(`  This Month: $${costs2.totals.thisMonth.toFixed(2)}`);
  console.log(`  Last 7 Days: $${costs2.totals.last7Days.toFixed(2)}`);
  console.log(`  Yesterday: $${costs2.totals.yesterday.toFixed(2)}`);
}
function printPlainText(accountAlias, totals, isSummary = false) {
  printPlainSummary(accountAlias, totals);
  if (isSummary) {
    return;
  }
  const serviceTotals = totals.totalsByService;
  const allServices = Object.keys(serviceTotals.yesterday).sort(
    (a, b) => b.length - a.length,
  );
  console.log("");
  console.log("Totals by Service:");
  console.log("  Last Month:");
  allServices.forEach((service) => {
    console.log(
      `    ${service}: $${serviceTotals.lastMonth[service].toFixed(2)}`,
    );
  });
  console.log("");
  console.log("  This Month:");
  allServices.forEach((service) => {
    console.log(
      `    ${service}: $${serviceTotals.thisMonth[service].toFixed(2)}`,
    );
  });
  console.log("");
  console.log("  Last 7 Days:");
  allServices.forEach((service) => {
    console.log(
      `    ${service}: $${serviceTotals.last7Days[service].toFixed(2)}`,
    );
  });
  console.log("");
  console.log("  Yesterday:");
  allServices.forEach((service) => {
    console.log(
      `    ${service}: $${serviceTotals.yesterday[service].toFixed(2)}`,
    );
  });
}

// src/index.ts
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";
var program = new Command();
program
  .version(package_default.version)
  .name("aws-cost")
  .description(package_default.description)
  .option("-p, --profile [profile]", "AWS profile to use", "default")
  .option("-k, --access-key [key]", "AWS access key")
  .option("-s, --secret-key [key]", "AWS secret key")
  .option("-T, --session-token [key]", "AWS session Token")
  .option("-r, --region [region]", "AWS region", "us-east-1")
  .option("-j, --json", "Get the output as JSON")
  .option("-u, --summary", "Get only the summary without service breakdown")
  .option("-t, --text", "Get the output as plain text (no colors / tables)")
  .option("-S, --slack-token [token]", "Token for the slack integration")
  .option(
    "-C, --slack-channel [channel]",
    "Channel to which the slack integration should post",
  )
  .option("-h, --help", "Get the help of the CLI")
  .parse(process.argv);
var options = program.opts();
if (options.help) {
  program.help();
  process.exit(0);
}
var awsConfig = await getAwsConfigFromOptionsOrFile({
  profile: options.profile,
  accessKey: options.accessKey,
  secretKey: options.secretKey,
  sessionToken: options.sessionToken,
  region: options.region,
});
var alias = await getAccountAlias(awsConfig);
var costs = await getTotalCosts(awsConfig);
if (options.json) {
  printJson(alias, costs, options.summary);
} else if (options.text) {
  printPlainText(alias, costs, options.summary);
} else {
  printFancy(alias, costs, options.summary);
}
if (options.slackToken && options.slackChannel) {
  await notifySlack(
    alias,
    costs,
    options.summary,
    options.slackToken,
    options.slackChannel,
  );
}
//# sourceMappingURL=index.js.map
