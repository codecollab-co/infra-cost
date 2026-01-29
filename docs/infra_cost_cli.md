# Infra-Cost CLI Code Explanation

This document provides a detailed explanation of the code for the `aws-cost-cli`, a command-line interface tool designed to perform cost analysis on AWS accounts. The tool fetches cost data from AWS Cost Explorer, processes it, and outputs it in various formats (fancy colored tables, plain text, JSON, or Slack messages). The explanations cover the key source files, their functionality, and assumptions about data structures.

## src/printers/favcy.ts

### File Overview
- **Imports**:
  - `chalk`: A library for styling terminal output with colors and formatting.
  - `TotalCosts`: A type or interface imported from `../cost`, representing the cost data structure.
  - `hideSpinner`: A function imported from `../logger` to hide a loading spinner in the console.
- **Purpose**: Defines a function to display AWS cost information in a visually appealing, tabular format in the console, with options for summary or detailed output.

### Function: `printFancy`
- **Purpose**: Prints a formatted AWS cost report to the console, showing total costs across different time periods and optionally a breakdown by service.
- **Parameters**:
  1. `accountAlias: string`: The AWS account name or alias to display in the report header.
  2. `totals: TotalCosts`: An object containing cost data, split into total costs and costs by service.
  3. `isSummary: boolean = false`: Optional flag; if `true`, only summary totals are shown (no service breakdown).
- **Variables and Logic**:
  1. **Initial Setup**:
     - `hideSpinner()`: Hides any active spinner in the console (likely from a previous operation).
     - `console.clear()`: Clears the console for a clean display.
     - `totalCosts = totals.totals`: Extracts the overall cost totals (e.g., last month, this month, etc.).
     - `serviceCosts = totals.totalsByService`: Extracts costs broken down by AWS service.
  2. **Service Name Alignment**:
     - `allServices = Object.keys(serviceCosts.yesterday)`: Gets a list of service names from yesterday's data.
     - `sortedServiceNames = allServices.sort((a, b) => b.length - a.length)`: Sorts services by name length (longest first) for consistent column width.
     - `maxServiceLength`: Calculates the length of the longest service name plus 1 for padding, ensuring aligned output.
  3. **Formatted Totals**:
     - `totalLastMonth = chalk.green($${totalCosts.lastMonth.toFixed(2)})`: Formats last month's total cost in green with 2 decimal places.
     - `totalThisMonth = chalk.green($${totalCosts.thisMonth.toFixed(2)})`: Formats this month's total cost in green.
     - `totalLast7Days = chalk.green($${totalCosts.last7Days.toFixed(2)})`: Formats the last 7 days' total cost in green.
     - `totalYesterday = chalk.bold.yellowBright($${totalCosts.yesterday.toFixed(2)})`: Formats yesterday's total cost in bold yellow.
  4. **Summary Output**:
     - Prints a header with the `accountAlias` in bold yellow, followed by the formatted totals for each time period.
     - If `isSummary` is `true`, the function returns early, skipping the service breakdown.
  5. **Detailed Service Breakdown** (if `isSummary` is `false`):
     - `headerPadLength = 11`: Sets a fixed width for cost columns.
     - **Headers**:
       - `serviceHeader = chalk.white('Service'.padStart(maxServiceLength))`: Service column header, left-aligned.
       - `lastMonthHeader = chalk.white('Last Month'.padEnd(headerPadLength))`: Last month cost header.
       - `thisMonthHeader = chalk.white('This Month'.padEnd(headerPadLength))`: This month cost header.
       - `last7DaysHeader = chalk.white('Last 7 Days'.padEnd(headerPadLength))`: Last 7 days cost header.
       - `yesterdayHeader = chalk.bold.white('Yesterday'.padEnd(headerPadLength))`: Yesterday cost header in bold.
       - These are logged as a single line to form the table header.
     - **Service Rows**:
       - Loops through `sortedServiceNames` to print a row for each service.
       - `serviceLabel = chalk.cyan(service.padStart(maxServiceLength))`: Service name in cyan, padded for alignment.
       - `lastMonthTotal = chalk.green($${serviceCosts.lastMonth[service].toFixed(2)}.padEnd(headerPadLength))`: Last month's cost for the service in green.
       - `thisMonthTotal = chalk.green($${serviceCosts.thisMonth[service].toFixed(2)}.padEnd(headerPadLength))`: This month's cost in green.
       - `last7DaysTotal = chalk.green($${serviceCosts.last7Days[service].toFixed(2)}.padEnd(headerPadLength))`: Last 7 days' cost in green.
       - `yesterdayTotal = chalk.bold.yellowBright($${serviceCosts.yesterday[service].toFixed(2)}.padEnd(headerPadLength))`: Yesterday's cost in bold yellow.
       - Each row is logged with the service name and its costs aligned under the headers.
- **Assumptions About `TotalCosts`**:
  - Likely structure:
    ```typescript
    interface TotalCosts {
      totals: {
        lastMonth: number;
        thisMonth: number;
        last7Days: number;
        yesterday: number;
      };
      totalsByService: {
        lastMonth: { [service: string]: number };
        thisMonth: { [service: string]: number };
        last7Days: { [service: string]: number };
        yesterday: { [service: string]: number };
      };
    }
    ```
- **Output Example**:
  For `accountAlias = "MyAccount"`, `isSummary = false`, and sample totals data:
  ```
  AWS Cost Report: MyAccount

  Last Month: $123.45
  This Month: $67.89
  Last 7 days: $45.67
  Yesterday : $12.34

  Service      Last Month  This Month  Last 7 Days Yesterday
  S3           $50.00     $30.00     $20.00     $5.00
  EC2          $73.45     $37.89     $25.67     $7.34
  ```
  - Colors are applied via `chalk` (green for most costs, yellow for yesterday, cyan for service names).

## src/printers/json.ts

### File Overview
- **Imports**:
  - `TotalCosts`: A type or interface imported from `../cost`, representing the structure of cost data.
  - `hideSpinner`: A function imported from `../logger` to hide a loading spinner in the console.
- **Purpose**: Defines a function to output AWS cost data as a formatted JSON string, with options for either a summary view (totals only) or a detailed view (including service breakdowns).

### Function: `printJson`
- **Purpose**: Prints AWS cost data to the console in JSON format, either as a summary of total costs or a full breakdown including service-specific costs.
- **Parameters**:
  1. `accountAlias: string`: The AWS account name or alias to include in the JSON output.
  2. `totalCosts: TotalCosts`: An object containing cost data, including overall totals and service-specific costs.
  3. `isSummary: boolean = false`: Optional flag; if `true`, only summary totals are output; if `false`, the full cost data is included.
- **Variables and Logic**:
  1. **Initial Setup**:
     - `hideSpinner()`: Hides any active spinner in the console, likely from a prior operation.
  2. **Summary Output** (if `isSummary` is `true`):
     - Constructs an object with:
       - `account: string`: The `accountAlias`.
       - `totals`: The `totalCosts.totals` object, containing overall cost data.
     - `JSON.stringify(..., null, 2)`: Converts the object to a JSON string with 2-space indentation for readability.
     - Logs the result to the console and returns early.
  3. **Detailed Output** (if `isSummary` is `false`):
     - Constructs an object by spreading the `totalCosts` object and adding an `account` property:
       - `account: string`: The `accountAlias`.
       - All properties of `totalCosts` (e.g., `totals`, `totalsByService`).
     - `JSON.stringify(..., null, 2)`: Converts the object to a formatted JSON string.
     - Logs the result to the console.
- **Assumptions About `TotalCosts`**:
  - Likely structure matches the one described in `favcy.ts`.
- **Output Examples**:
  1. **Summary Output** (`isSummary = true`):
     For `accountAlias = "MyAccount"` and `totalCosts.totals = { lastMonth: 123.45, thisMonth: 67.89, last7Days: 45.67, yesterday: 12.34 }`:
     ```json
     {
       "account": "MyAccount",
       "totals": {
         "lastMonth": 123.45,
         "thisMonth": 67.89,
         "last7Days": 45.67,
         "yesterday": 12.34
       }
     }
     ```
  2. **Detailed Output** (`isSummary = false`):
     For `accountAlias = "MyAccount"` and sample `totalCosts`:
     ```json
     {
       "account": "MyAccount",
       "totals": {
         "lastMonth": 123.45,
         "thisMonth": 67.89,
         "last7Days": 45.67,
         "yesterday": 12.34
       },
       "totalsByService": {
         "yesterday": {
           "S3": 5.00,
           "EC2": 7.34
         },
         "lastMonth": {
           "S3": 50.00,
           "EC2": 73.45
         },
         ...
       }
     }
     ```

## src/printers/slack.ts

### File Overview
- **Imports**:
  - `fetch` from `node-fetch`: A library for making HTTP requests to send messages to Slack.
  - `TotalCosts` from `../cost`: A type or interface defining the structure of cost data.
- **Purpose**: Provides functionality to send AWS cost reports to a Slack channel, with options for summary-only or detailed reports including service breakdowns.

### Function: `formatServiceBreakdown`
- **Purpose**: Formats a breakdown of costs by service into a Slack-compatible markdown string, focusing on yesterday's costs.
- **Parameters**:
  - `costs: TotalCosts`: The cost data object containing totals and service-specific costs.
- **Variables and Logic**:
  - `serviceCosts = costs.totalsByService`: Extracts the service-specific cost breakdown.
  - `sortedServices`:
    - Starts with `Object.keys(serviceCosts.yesterday)`: Gets all service names from yesterday's costs.
    - `.filter((service) => serviceCosts.yesterday[service] > 0)`: Filters out services with zero cost yesterday.
    - `.sort((a, b) => serviceCosts.yesterday[b] - serviceCosts.yesterday[a])`: Sorts services by cost in descending order.
  - `serviceCostsYesterday`:
    - Maps each service to a formatted string: `> ${service}: $${serviceCosts.yesterday[service].toFixed(2)}`.
    - Uses Slack markdown: `>` for indentation, ``` for code formatting.
  - **Return**: Joins the service cost lines with newlines (`\n`) into a single string.
- **Example Output**:
  ```
  > EC2: $7.34
  > S3: $5.00
  ```

### Function: `notifySlack` (Exported)
- **Purpose**: Sends a formatted AWS cost report to a specified Slack channel via the Slack API, with options for summary or detailed output.
- **Parameters**:
  - `accountAlias: string`: The AWS account name or alias to include in the message.
  - `costs: TotalCosts`: The cost data object containing totals and service breakdowns.
  - `isSummary: boolean`: If `true`, sends only a summary; if `false`, includes a service breakdown.
  - `slackToken: string`: The Slack API token for authentication.
  - `slackChannel: string`: The Slack channel ID or name to send the message to.
- **Variables and Logic**:
  - **Setup**:
    - `channel = slackChannel`: Assigns the channel ID/name.
    - `totals = costs.totals`: Extracts overall cost totals.
    - `serviceCosts = costs.totalsByService`: Extracts service-specific costs.
  - **Redundant Code** (Not Used):
    - `serviceCostsYesterday = []`: Initializes an array and populates it with service costs in the format `${service}: $${cost}`.
    - This array is computed but not used; `formatServiceBreakdown` is used instead.
  - **Message Construction**:
    - `summary`: A Slack markdown string with:
      - Account name in bold (`*Account: ${accountAlias}*`).
      - Totals for yesterday, this month, and last month, formatted as code (e.g., `\$${totals.yesterday.toFixed(2)}`).
    - `breakdown`: A string with a service breakdown header and the result of `formatServiceBreakdown(costs)`.
    - `message = ${summary}`: Starts with the summary; if `!isSummary`, appends the breakdown.
  - **Slack API Request**:
    - Uses `fetch` to send a POST request to `https://slack.com/api/chat.postMessage`.
    - **Body**: A JSON string with:
      - `channel`: The target Slack channel.
      - `blocks`: An array with a single section block containing the message in Slack markdown (`mrkdwn`).
    - **Headers**:
      - `'Content-Type': 'application/json; charset=utf-8'`.
      - `Authorization: Bearer ${slackToken}`: Authenticates the request.
  - **Response Handling**:
    - Parses the response as JSON, expecting `{ ok: boolean; error?: string }`.
    - If `!data.ok`, logs an error and exits with code 1.
    - If successful, logs "Successfully sent message to Slack".
- **Example Message (Slack Output)**:
  - **Summary Only**:
    ```
    > *Account: MyAccount*
    >
    > *Summary*
    > Total Yesterday: `$12.34`
    > Total This Month: `$67.89`
    > Total Last Month: `$123.45`
    ```
  - **With Breakdown**:
    ```
    > *Account: MyAccount*
    >
    > *Summary*
    > Total Yesterday: `$12.34`
    > Total This Month: `$67.89`
    > Total Last Month: `$123.45`
    >
    > *Breakdown by Service:*
    > EC2: `$7.34`
    > S3: `$5.00`
    ```
- **Assumptions About `TotalCosts`**:
  - Matches the structure described in `favcy.ts`.

## src/printers/text.ts

### File Overview
- **Imports**:
  - `TotalCosts` from `../cost`: A type or interface defining the structure of cost data.
  - `hideSpinner` from `../logger`: A function to hide a loading spinner in the console.
- **Purpose**: Provides functions to display AWS cost data in a plain text format in the console, with options for a summary view (totals only) or a detailed view (including service breakdowns).

### Function: `printPlainSummary`
- **Purpose**: Prints a simple summary of total AWS costs for an account to the console.
- **Parameters**:
  - `accountAlias: string`: The AWS account name or alias to display.
  - `costs: TotalCosts`: The cost data object containing total costs.
- **Variables and Logic**:
  - `hideSpinner()`: Hides any active spinner in the console.
  - `console.clear()`: Clears the console for a clean display.
  - Logs:
    - An empty line.
    - `Account: ${accountAlias}`.
    - Another empty line.
    - A "Totals:" header.
    - Four lines with total costs, indented with two spaces:
      - `Last Month: $${costs.totals.lastMonth.toFixed(2)}`
      - `This Month: $${costs.totals.thisMonth.toFixed(2)}`
      - `Last 7 Days: $${costs.totals.last7Days.toFixed(2)}`
      - `Yesterday: $${costs.totals.yesterday.toFixed(2)}`
- **Example Output**:
  ```
  
  Account: MyAccount
  
  Totals:
    Last Month: $123.45
    This Month: $67.89
    Last 7 Days: $45.67
    Yesterday: $12.34
  ```

### Function: `printPlainText` (Exported)
- **Purpose**: Prints AWS cost data to the console in plain text, either as a summary or with a detailed service breakdown.
- **Parameters**:
  1. `accountAlias: string`: The AWS account name or alias to display.
  2. `totals: TotalCosts`: The cost data object containing totals and service-specific costs.
  3. `isSummary: boolean = false`: Optional flag; if `true`, only the summary is printed; if `false`, includes a service breakdown.
- **Variables and Logic**:
  1. **Summary Output**:
     - Calls `printPlainSummary(accountAlias, totals)` to print the account and total costs.
     - If `isSummary` is `true`, returns early.
  2. **Service Breakdown** (if `isSummary` is `false`):
     - `serviceTotals = totals.totalsByService`: Extracts service-specific cost data.
     - `allServices = Object.keys(serviceTotals.yesterday).sort((a, b) => b.length - a.length)`: Gets service names from yesterday’s costs, sorted by name length for alignment.
     - Logs:
       - An empty line.
       - A "Totals by Service:" header.
     - For each time period (`Last Month`, `This Month`, `Last 7 Days`, `Yesterday`):
       - Logs the time period header (e.g., `Last Month:`) with two spaces prefix.
       - Iterates over `allServices` and logs each service’s cost:
         - Format: `${service}: $${serviceTotals[period][service].toFixed(2)}` (four spaces prefix).
       - Adds an empty line between periods.
- **Example Output** (with `isSummary = false`):
  ```
  
  Account: MyAccount
  
  Totals:
    Last Month: $123.45
    This Month: $67.89
    Last 7 Days: $45.67
    Yesterday: $12.34
  
  Totals by Service:
    Last Month:
      EC2: $73.45
      S3: $50.00
  
    This Month:
      EC2: $37.89
      S3: $30.00
  
    Last 7 Days:
      EC2: $25.67
      S3: $20.00
  
    Yesterday:
      EC2: $7.34
      S3: $5.00
  ```
- **Assumptions About `TotalCosts`**:
  - Matches the structure described in `favcy.ts`.

## src/account.ts

### File Overview
- **Imports**:
  - `AWS` from `aws-sdk`: The AWS SDK for JavaScript, used to interact with AWS services.
  - `AWSConfig` from `./config`: A type or interface defining the configuration for AWS SDK clients.
  - `showSpinner` from `./logger`: A function to display a loading spinner in the console.
- **Purpose**: Exports a function to retrieve an AWS account alias, falling back to the account ID if no alias is found.

### Function: `getAccountAlias` (Exported)
- **Purpose**: Fetches the alias for an AWS account using the IAM service; if no alias exists, retrieves the account ID using the STS service.
- **Parameters**:
  - `awsConfig: AWSConfig`: Configuration object for AWS SDK clients (e.g., credentials, region).
- **Return Type**: `Promise<string>` - Resolves to the account alias or account ID.
- **Variables and Logic**:
  1. **Spinner Setup**:
     - `showSpinner('Getting account alias')`: Displays a loading spinner.
  2. **Attempt to Get Alias via IAM**:
     - `const iam = new AWS.IAM(awsConfig)`: Creates an IAM client instance.
     - `const accountAliases = await iam.listAccountAliases().promise()`: Calls the `listAccountAliases` API asynchronously.
     - `const foundAlias = accountAliases?.['AccountAliases']?.[0]`: Extracts the first alias using optional chaining.
     - If `foundAlias` exists, returns it.
  3. **Fallback to Account ID via STS**:
     - If no alias, `const sts = new AWS.STS(awsConfig)`: Creates an STS client.
     - `const accountInfo = await sts.getCallerIdentity().promise()`: Calls `getCallerIdentity` to get the account ID.
     - Returns `accountInfo?.Account || ''`.
- **Assumptions About `AWSConfig`**:
  - Likely structure:
    ```typescript
    interface AWSConfig {
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
      };
      region: string;
    }
    ```
- **Example Usage and Output**:
  - **With an Alias**: If `listAccountAliases` returns `{ AccountAliases: ['my-account-alias'] }`, returns `"my-account-alias"`.
  - **Without an Alias**: If `listAccountAliases` returns `{ AccountAliases: [] }` and `getCallerIdentity` returns `{ Account: '123456789012' }`, returns `"123456789012"`.
  - **Failure Case**: Returns `""` if both calls fail or return no data.
- **Error Handling**: Assumes AWS SDK handles authentication/network errors by rejecting promises, to be caught by the caller.

## src/config.ts

### File Overview
- **Imports**:
  - `fs` from `node:fs`: Node.js file system module (not directly used).
  - `loadSharedConfigFiles` from `@aws-sdk/shared-ini-file-loader`: Utility to load AWS credentials and config from shared INI files.
  - `chalk` from `chalk`: For styling console output.
  - `printFatalError` from `./logger`: Prints an error and terminates the process.
- **Purpose**: Defines types and functions to configure AWS SDK credentials and region from command-line options or AWS shared configuration files.

### Types
1. **EnvConfig**:
   - **Purpose**: Represents environment-based AWS configuration (not used in this file but exported).
   - **Structure**:
     ```typescript
     interface EnvConfig {
       awsAccessKey: string;
       awsSecretKey: string;
       awsRegion: string;
     }
     ```
2. **AWSConfig**:
   - **Purpose**: Defines the configuration object expected by AWS SDK clients.
   - **Structure**:
     ```typescript
     interface AWSConfig {
       credentials: {
         accessKeyId: string;
         secretAccessKey: string;
         sessionToken?: string;
       };
       region: string;
     }
     ```

### Function: `getAwsConfigFromOptionsOrFile` (Exported)
- **Purpose**: Constructs an `AWSConfig` object from command-line options or AWS shared config files.
- **Parameters**:
  - `options`: An object with:
    - `profile: string`: AWS profile name (e.g., "default").
    - `accessKey: string`: AWS access key ID (optional).
    - `secretKey: string`: AWS secret key (optional).
    - `sessionToken: string`: AWS session token (optional).
    - `region: string`: AWS region.
- **Return Type**: `Promise<AWSConfig>` - Resolves to an AWS configuration object.
- **Variables and Logic**:
  1. **Destructuring Options**:
     - `const { profile, accessKey, secretKey, sessionToken, region } = options`.
  2. **Manual Credentials Check**:
     - If `accessKey` or `secretKey` is provided:
       - Validates both are present; if not, calls `printFatalError` with an error message.
       - Returns `AWSConfig` with:
         - `credentials: { accessKeyId: accessKey, secretAccessKey: secretKey, sessionToken }`.
         - `region`.
  3. **Fallback to File-Based Credentials**:
     - Returns `AWSConfig` with:
       - `credentials`: Result of `await loadAwsCredentials(profile)`.
       - `region`.

### Function: `loadAwsCredentials`
- **Purpose**: Loads AWS credentials from shared configuration files for a given profile.
- **Parameters**:
  - `profile: string = 'default'`: The AWS profile to load credentials for.
- **Return Type**: `Promise<AWSConfig['credentials'] | undefined>` - Resolves to a credentials object.
- **Variables and Logic**:
  - Loads config files with `loadSharedConfigFiles`.
  - Extracts credentials from `configFiles.credentialsFile[profile]`:
    - `accessKey: string = credentialsFile?.[profile]?.aws_access_key_id`.
    - `secretKey: string = credentialsFile?.[profile]?.aws_secret_access_key`.
    - `sessionToken: string = credentialsFile?.[profile]?.aws_session_token`.

## src/cost.ts

### File Overview
- **Imports**:
  - `AWS` from `aws-sdk`: For interacting with AWS Cost Explorer.
  - `dayjs` from `dayjs`: For date manipulation.
  - `AWSConfig` from `./config`: Type defining AWS SDK configuration.
  - `showSpinner` from `./logger`: Displays a loading spinner.
- **Purpose**: Fetches and processes AWS cost data, returning structured totals for different time periods.

### Types
1. **RawCostByService**:
   - **Purpose**: Represents raw cost data from AWS Cost Explorer.
   - **Structure**:
     ```typescript
     interface RawCostByService {
       [service: string]: { [date: string]: number };
     }
     ```
     - Outer key: AWS service name (e.g., "S3").
     - Inner key: Date in `YYYY-MM-DD` format.
     - Value: Cost as a number.
2. **TotalCosts**:
   - **Purpose**: Represents processed cost data with totals by period and service.
   - **Structure**:
     ```typescript
     interface TotalCosts {
       totals: {
         lastMonth: number;
         thisMonth: number;
         last7Days: number;
         yesterday: number;
       };
       totalsByService: {
         lastMonth: { [service: string]: number };
         thisMonth: { [service: string]: number };
         last7Days: { [service: string]: number };
         yesterday: { [service: string]: number };
       };
     }
     ```

### Function: `getRawCostByService` (Exported)
- **Purpose**: Fetches raw cost data from AWS Cost Explorer for the past 66 days, grouped by service and date.
- **Parameters**:
  - `awsConfig: AWSConfig`: AWS SDK configuration.
- **Return Type**: `Promise<RawCostByService>` - Raw cost data.
- **Variables and Logic**:
  - `showSpinner('Getting pricing data')`: Shows a spinner.
  - `const costExplorer = new AWS.CostExplorer(awsConfig)`: Initializes Cost Explorer client.
  - `endDate = dayjs().subtract(1, 'day')`: Sets end date to yesterday.
  - `startDate = endDate.subtract(65, 'day')`: Sets start date to 66 days ago.
  - API call to `costExplorer.getCostAndUsage`:
    - `TimePeriod`: From `startDate` to `endDate`.
    - `Granularity: 'DAILY'`: Daily breakdown.
    - `Filter`: Excludes `Credit`, `Refund`, `Upfront`, `Support`.
    - `Metrics: ['UnblendedCost']`: Retrieves unblended cost.
    - `GroupBy`: Groups by `SERVICE`.
  - Processes results into `costByService` object.
- **Example Output**:
  ```json
  {
    "S3": { "2025-03-21": 5.00, "2025-03-20": 4.50, ... },
    "EC2": { "2025-03-21": 7.34, "2025-03-20": 6.80, ... }
  }
  ```

### Function: `calculateServiceTotals`
- **Purpose**: Processes raw cost data into structured totals for specific time periods.
- **Parameters**:
  - `rawCostByService: RawCostByService`: Raw cost data.
- **Return Type**: `TotalCosts` - Processed totals.
- **Variables and Logic**:
  - Initializes `totals` and `totalsByService` with zeroed values.
  - Date markers using `dayjs`:
    - `startOfLastMonth`, `startOfThisMonth`, `startOfLast7Days`, `startOfYesterday`.
  - Iterates over services and dates, accumulating costs based on time period conditions.
  - Note: `last7Days` uses `isSame(..., 'week')`, which may include more than 7 days.
- **Example Output**:
  ```json
  {
    "totals": {
      "lastMonth": 123.45,
      "thisMonth": 67.89,
      "last7Days": 45.67,
      "yesterday": 12.34
    },
    "totalsByService": {
      "lastMonth": { "S3": 50.00, "EC2": 73.45 },
      "thisMonth": { "S3": 30.00, "EC2": 37.89 },
      "last7Days": { "S3": 20.00, "EC2": 25.67 },
      "yesterday": { "S3": 5.00, "EC2": 7.34 }
    }
  }
  ```

### Function: `getTotalCosts` (Exported)
- **Purpose**: Combines `getRawCostByService` and `calculateServiceTotals`.
- **Parameters**:
  - `awsConfig: AWSConfig`: AWS SDK configuration.
- **Return Type**: `Promise<TotalCosts>` - Processed cost totals.
- **Logic**:
  - Fetches raw data and processes it into totals.

## src/index.ts

### File Overview
- **Imports**:
  - `Command` from `commander`: For building the CLI.
  - `packageJson` from `../package.json`: Imports package metadata.
  - Functions from other modules: `getAccountAlias`, `getAwsConfigFromOptionsOrFile`, `getTotalCosts`, `printFancy`, `printJson`, `notifySlack`, `printPlainText`.
- **Purpose**: Main entry point of the AWS cost reporting CLI tool, parsing command-line options and orchestrating cost retrieval and display.

### Initial Setup
- **AWS SDK Maintenance Mode**:
  - `process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1'`: Suppresses maintenance mode warning.
- **CLI Setup**:
  - `const program = new Command()`: Initializes Commander.
  - Configures CLI with version, name, description, and options:
    - `-p, --profile [profile]`: AWS profile (default: "default").
    - `-k, --access-key [key]`: AWS access key.
    - `-s, --secret-key [key]`: AWS secret key.
    - `-T, --session-token [key]`: AWS session token.
    - `-r, --region [region]`: AWS region (default: "us-east-1").
    - `-j, --json`: Output as JSON.
    - `-u, --summary`: Summary only.
    - `-t, --text`: Plain text output.
    - `-S, --slack-token [token]`: Slack API token.
    - `-C, --slack-channel [channel]`: Slack channel.
    - `-h, --help`: Show help.
  - Parses `process.argv`.

### Type: `OptionsType`
- **Structure**:
  ```typescript
  interface OptionsType {
    accessKey?: string;
    secretKey?: string;
    sessionToken?: string;
    region: string;
    profile: string;
    text: boolean;
    json: boolean;
    summary: boolean;
    slackToken?: string;
    slackChannel?: string;
    help: boolean;
  }
  ```

### Main Logic
1. **Help Handling**:
   - If `options.help`, displays help and exits.
2. **AWS Configuration**:
   - `awsConfig = await getAwsConfigFromOptionsOrFile(options)`.
3. **Account Alias**:
   - `alias = await getAccountAlias(awsConfig)`.
4. **Cost Data**:
   - `costs = await getTotalCosts(awsConfig)`.
5. **Output Selection**:
   - If `options.json`: Calls `printJson`.
   - Else if `options.text`: Calls `printPlainText`.
   - Else: Calls `printFancy`.
6. **Slack Notification**:
   - If `options.slackToken` and `options.slackChannel`: Calls `notifySlack`.

### Example Usage
- **Default (Fancy Output)**:
  ```bash
  aws-cost --profile my-profile
  ```
- **JSON Summary**:
  ```bash
  aws-cost --json --summary --region us-east-1
  ```
- **Plain Text with Slack**:
  ```bash
  aws-cost --text --slack-token xoxb-123 --slack-channel #costs
  ```

## src/logger.ts

### File Overview
- **Imports**:
  - `chalk` from `chalk`: For styling console output.
  - `ora` and `Ora` from `ora`: For creating terminal spinners.
- **Purpose**: Provides utility functions for logging errors and managing a spinner.

### Variable: `spinner`
- **Type**: `Ora | undefined`
- **Purpose**: Holds the spinner instance, persisting across function calls.

### Function: `printFatalError` (Exported)
- **Purpose**: Prints a formatted error message and terminates the process.
- **Parameters**:
  - `error: string`: The error message.
- **Logic**:
  - Outputs:
    - An empty line.
    - "Error:" in bold, red, underlined.
    - The error message in red.
  - Exits with code 1.
- **Example Output**:
  ```
  
    Error:
    Could not find AWS credentials
  ```

### Function: `showSpinner` (Exported)
- **Purpose**: Displays or updates a terminal spinner.
- **Parameters**:
  - `text: string`: Text to display.
- **Logic**:
  - Initializes `spinner` with `ora` if undefined.
  - Updates `spinner.text`.

### Function: `hideSpinner` (Exported)
- **Purpose**: Stops and hides the spinner.
- **Logic**:
  - If `spinner` exists, calls `spinner.stop()`.

## dist/index.js

### File Overview
- **Purpose**: Compiled, distributable JavaScript version of the CLI tool, combining all TypeScript modules.
- **Structure**:
  - Inlines dependencies and package.json content.
  - Includes compiled functions from all source files.
  - Contains source mapping for debugging.

### Key Components
1. **package.json (Embedded)**:
   - Metadata:
     - `name: "aws-cost-cli"`
     - `version: "0.2.7"`
     - `description: "A CLI tool to perform cost analysis on your AWS account"`
     - Dependencies: `aws-sdk`, `chalk`, `commander`, `dayjs`, etc.
2. **Compiled Modules**:
   - Matches functionality of source files, with variable renaming for scope safety.
3. **Main CLI Logic**:
   - Same as `index.ts`, with inlined functions.

### Example Usage
- Matches `index.ts` examples, executed via `node dist/index.js` or `aws-cost`.