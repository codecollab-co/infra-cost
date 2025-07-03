# AWS Cost CLI Code Flow and Functionality

The `aws-cost-cli` is a command-line interface (CLI) tool designed to fetch, process, and display AWS cost data for an account, providing insights into costs over different time periods (last month, this month, last 7 days, and yesterday). It supports multiple output formats (fancy colored tables, plain text, JSON, and Slack notifications) and is built using TypeScript, leveraging AWS SDK, Commander for CLI parsing, and other libraries for formatting and HTTP requests. This document explains the code flow and how the components work together to achieve this functionality.

## Overview
- **Purpose**: The tool retrieves AWS cost data from the AWS Cost Explorer service, processes it into structured totals, and outputs it in user-specified formats (console or Slack).
- **Key Features**:
  - Fetches cost data for the past 66 days, grouped by service and date.
  - Processes costs into totals for last month, this month, last 7 days, and yesterday, both overall and by service.
  - Supports output formats: colored tabular (`fancy`), plain text, JSON, and Slack messages.
  - Allows summary-only or detailed (service breakdown) outputs.
  - Uses AWS credentials from CLI options or shared configuration files.
  - Displays a spinner during operations for better user experience.
- **Components**:
  - `index.ts`: Main CLI entry point, parses arguments, and orchestrates execution.
  - `account.ts`: Retrieves the AWS account alias or ID.
  - `config.ts`: Configures AWS SDK credentials and region.
  - `cost.ts`: Fetches and processes AWS cost data.
  - `printers/*`: Handles output formatting (`fancy.ts`, `json.ts`, `slack.ts`, `text.ts`).
  - `logger.ts`: Manages console logging and spinners.
  - `dist/index.js`: Compiled distributable JavaScript file.

## Code Flow
The following outlines the step-by-step flow of how the `aws-cost-cli` works when executed:

### 1. CLI Initialization (`index.ts`)
- **Entry Point**: The CLI is invoked via a command like `aws-cost --profile my-profile --json --summary`.
- **Setup**:
  - Suppresses AWS SDK maintenance mode warnings by setting `process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1'`.
  - Initializes a `Commander` instance to define the CLI interface:
    - Sets metadata: name (`aws-cost`), version, and description from `package.json`.
    - Defines options: `--profile`, `--access-key`, `--secret-key`, `--session-token`, `--region`, `--json`, `--summary`, `--text`, `--slack-token`, `--slack-channel`, `--help`.
- **Argument Parsing**:
  - Parses command-line arguments using `program.parse(process.argv)`.
  - Retrieves options as an `OptionsType` object (e.g., `{ profile: 'my-profile', json: true, summary: true }`).
- **Help Check**:
  - If `--help` is provided, displays help text and exits.

### 2. AWS Configuration (`config.ts`)
- **Function**: `getAwsConfigFromOptionsOrFile`
- **Purpose**: Constructs an `AWSConfig` object for AWS SDK clients.
- **Flow**:
  - Destructures CLI options (e.g., `profile`, `accessKey`, `secretKey`, `sessionToken`, `region`).
  - If `accessKey` or `secretKey` is provided:
    - Validates both are present; if not, calls `printFatalError` to log an error and exit.
    - Returns `AWSConfig` with manual credentials and `region`.
  - Otherwise, uses `loadAwsCredentials` to load credentials from AWS shared config files (`~/.aws/credentials`, `~/.aws/config`) for the Specified profile (default: `"default"`).
  - Returns `AWSConfig` with file-based credentials and `region` (default: `"us-east-1"`).
- **Output**: An `AWSConfig` object:
  ```typescript
  {
    credentials: { accessKeyId: string, secretAccessKey: string, sessionToken?: string },
    region: string
  }
  ```

### 3. Account Alias Retrieval (`account.ts`)
- **Function**: `getAccountAlias`
- **Purpose**: Fetches the AWS account alias or falls back to the account ID.
- **Flow**:
  - Calls `showSpinner('Getting account alias')` to display a spinner.
  - Creates an IAM client (`AWS.IAM`) with the `AWSConfig`.
  - Calls `iam.listAccountAliases().promise()` to retrieve aliases.
  - If an alias exists, returns the first one (e.g., `"my-account-alias"`).
  - If no alias, creates an STS client (`AWS.STS`) and calls `getCallerIdentity().promise()` to get the account ID (e.g., `"123456789012"`).
  - Returns an empty string if both fail.
- **Output**: A string (alias or ID).

### 4. Cost Data Retrieval and Processing (`cost.ts`)
- **Function**: `getTotalCosts`
- **Purpose**: Fetches and processes AWS cost data into structured totals.
- **Flow**:
  1. **Fetch Raw Data** (`getRawCostByService`):
     - Calls `showSpinner('Getting pricing data')`.
     - Initializes a Cost Explorer client (`AWS.CostExplorer`) with `AWSConfig`.
     - Defines a time range: yesterday (`endDate`) to 66 days ago (`startDate`).
     - Calls `costExplorer.getCostAndUsage` with:
       - `TimePeriod`: `startDate` to `endDate`.
       - `Granularity: 'DAILY'`.
       - `Filter`: Excludes `Credit`, `Refund`, `Upfront`, `Support`.
       - `Metrics: ['UnblendedCost']`.
       - `GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]`.
     - Processes results into `RawCostByService`:
       ```typescript
       {
         "S3": { "2025-03-21": 5.00, ... },
         "EC2": { "2025-03-21": 7.34, ... }
       }
       ```
  2. **Process Totals** (`calculateServiceTotals`):
     - Initializes `totals` and `totalsByService` for periods: `lastMonth`, `thisMonth`, `last7Days`, `yesterday`.
     - Uses `dayjs` to define date markers (e.g., start of last month, yesterday).
     - Iterates over services and dates, accumulating costs:
       - `lastMonth`: Costs in the previous month.
       - `thisMonth`: Costs in the current month.
       - `last7Days`: Costs from 7 days ago (excluding yesterday, but note: `isSame(..., 'week')` may include more days).
       - `yesterday`: Costs for yesterday.
     - Stores results in `TotalCosts`:
       ```typescript
       {
         totals: {
           lastMonth: 123.45,
           thisMonth: 67.89,
           last7Days: 45.67,
           yesterday: 12.34
         },
         totalsByService: {
           lastMonth: { S3: 50.00, EC2: 73.45 },
           ...
         }
       }
       ```
  - **Output**: Returns the `TotalCosts` object.

### 5. Output Generation (`printers/*`)
- **Purpose**: Formats and outputs the cost data based on CLI flags.
- **Flow**:
  - **JSON Output** (`json.ts`, if `--json`):
    - Calls `printJson(alias, costs, options.summary)`.
    - Hides spinner (`hideSpinner`).
    - If `summary = true`, outputs:
      ```json
      { "account": "MyAccount", "totals": { ... } }
      ```
    - If `summary = false`, outputs full `TotalCosts` with `account` property.
  - **Plain Text Output** (`text.ts`, if `--text`):
    - Calls `printPlainText(alias, costs, options.summary)`.
    - Hides spinner and clears console.
    - Calls `printPlainSummary` for totals.
    - If `summary = false`, prints service breakdown, sorted by service name length.
    - Example:
      ```
      Account: MyAccount
      Totals:
        Last Month: $123.45
        ...
      Totals by Service:
        Last Month:
          EC2: $73.45
          S3: $50.00
        ...
      ```
  - **Fancy Output** (`fancy.ts`, default):
    - Calls `printFancy(alias, costs, options.summary)`.
    - Hides spinner and clears console.
    - Prints totals in green, yesterday in bold yellow.
    - If `summary = false`, prints a table with service names in cyan and costs aligned.
    - Example:
      ```
      AWS Cost Report: MyAccount
      Last Month: $123.45
      ...
      Service      Last Month  This Month  Last 7 Days Yesterday
      S3           $50.00     $30.00     $20.00     $5.00
      EC2          $73.45     $37.89     $25.67     $7.34
      ```
  - **Slack Notification** (`slack.ts`, if `--slack-token` and `--slack-channel`):
    - Calls `notifySlack(alias, costs, options.summary, slackToken, slackChannel)`.
    - Constructs a markdown message with totals and optional service breakdown (via `formatServiceBreakdown`).
    - Sends a POST request to `https://slack.com/api/chat.postMessage` with the Slack token.
    - Example Slack message:
      ```
      > *Account: MyAccount*
      > *Summary*
      > Total Yesterday: `$12.34`
      > ...
      > *Breakdown by Service:*
      > EC2: `$7.34`
      > S3: `$5.00`
      ```

### 6. Error Handling and Logging (`logger.ts`)
- **Functions**:
  - `printFatalError(error)`: Logs a red error message and exits (used in `config.ts`).
  - `showSpinner(text)`: Displays a spinner during operations (e.g., fetching costs or alias).
  - `hideSpinner()`: Stops the spinner before outputting results.
- **Flow**:
  - Spinners provide visual feedback during API calls.
  - Errors (e.g., missing credentials) trigger `printFatalError`, terminating the process.
  - Console logs are styled with `chalk` for readability.

### 7. Compiled Output (`dist/index.js`)
- **Purpose**: Combines all modules into a single JavaScript file for distribution.
- **Flow**:
  - Inlines all functions and dependencies.
  - Executes the same logic as `index.ts`, with variable renaming for scope safety.
  - Can be run via `node dist/index.js` or the `aws-cost` bin command.

## How It Works Together
1. **User Input**: The user runs a command (e.g., `aws-cost --json --summary`).
2. **CLI Parsing**: `index.ts` parses options and sets defaults.
3. **Configuration**: `config.ts` loads credentials and region, validating inputs.
4. **Account Identification**: `account.ts` fetches the account alias or ID.
5. **Cost Retrieval**: `cost.ts` fetches raw cost data and processes it into structured totals.
6. **Output**: Based on flags, one of the `printers` modules formats and outputs the data.
7. **Slack Integration**: If specified, `slack.ts` sends the report to a Slack channel.
8. **User Experience**: Spinners and error messages provide feedback throughout.

## Example Workflow
- **Command**: `aws-cost --profile my-profile --slack-token xoxb-123 --slack-channel #costs`
- **Steps**:
  1. Parses options: `{ profile: 'my-profile', slackToken: 'xoxb-123', slackChannel: '#costs' }`.
  2. Loads AWS credentials for `my-profile` from `~/.aws/credentials`.
  3. Fetches account alias (e.g., `"my-account-alias"`).
  4. Retrieves 66 days of cost data and processes into `TotalCosts`.
  5. Outputs a colored table (default) to the console.
  6. Sends a Slack message to `#costs` with totals and service breakdown.

## Assumptions
- AWS credentials are valid and have access to Cost Explorer, IAM, and STS.
- The Slack token and channel (if used) are valid.
- The system has network access to AWS and Slack APIs.
- The `TotalCosts` structure is consistent across all modules.

## Potential Improvements
- **Error Handling**: Add retries for transient API failures.
- **Validation**: Stricter input validation for CLI options.
- **Performance**: Cache cost data to reduce API calls for repeated runs.
- **Flexibility**: Support custom time ranges or additional metrics.
- **Logging**: Add verbose logging options for debugging.

This flow provides a clear picture of how the `aws-cost-cli` operates, from command input to final output, integrating multiple modules for a cohesive cost reporting tool.