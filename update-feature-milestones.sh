#!/bin/bash

# Feature Milestones Dashboard - Bulk Field Update Script
# This script updates Quarter, Priority, and Effort fields for all feature issues

set -e

PROJECT_ID="PVT_kwDODDAPzc4BN17L"
OWNER="codecollab-co"
REPO="infra-cost"

# Field IDs from the project
QUARTER_FIELD_ID="PVTSSF_lADODDAPzc4BN17Lzg8uGBU"
PRIORITY_FIELD_ID="PVTSSF_lADODDAPzc4BN17Lzg8uGCo"
EFFORT_FIELD_ID="PVTSSF_lADODDAPzc4BN17Lzg8uGDY"
STATUS_FIELD_ID="PVTSSF_lADODDAPzc4BN17Lzg8uF9Y"

# Option IDs for Quarter
BACKLOG_ID="05bc1ac3"
Q1_2026_ID="09542395"
Q2_2026_ID="f3b51b37"
Q3_2026_ID="e3dce47f"
Q4_2026_ID="76d9983d"

# Option IDs for Priority
HIGH_PRIORITY_ID="b2957853"
MEDIUM_PRIORITY_ID="658285a5"
LOW_PRIORITY_ID="4b078a63"

# Option IDs for Effort
QUICK_WIN_ID="118dfa10"
SMALL_EFFORT_ID="d91dc9d6"
MEDIUM_EFFORT_ID="e7e292ab"
LARGE_EFFORT_ID="25fa9257"

# Option IDs for Status
TODO_ID="f75ad846"
IN_PROGRESS_ID="47fc9ee4"
DONE_ID="98236657"

echo "🚀 Starting Feature Milestones Dashboard field updates..."
echo ""

# Function to get project item ID for an issue
get_project_item_id() {
    local issue_number=$1
    gh api graphql -f query="
        query {
            repository(owner: \"$OWNER\", name: \"$REPO\") {
                issue(number: $issue_number) {
                    projectItems(first: 10) {
                        nodes {
                            id
                            project {
                                id
                            }
                        }
                    }
                }
            }
        }
    " | jq -r ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$PROJECT_ID\") | .id"
}

# Function to update a field
update_field() {
    local item_id=$1
    local field_id=$2
    local option_id=$3
    local field_name=$4

    gh api graphql -f query="
        mutation {
            updateProjectV2ItemFieldValue(
                input: {
                    projectId: \"$PROJECT_ID\"
                    itemId: \"$item_id\"
                    fieldId: \"$field_id\"
                    value: {
                        singleSelectOptionId: \"$option_id\"
                    }
                }
            ) {
                projectV2Item {
                    id
                }
            }
        }
    " > /dev/null 2>&1
}

# Function to determine priority from labels
get_priority_id() {
    local labels=$1

    # High priority: enterprise features
    if echo "$labels" | grep -q "enterprise"; then
        echo "$HIGH_PRIORITY_ID"
    # Medium priority: small-team or devops features
    elif echo "$labels" | grep -q "small-team\|devops"; then
        echo "$MEDIUM_PRIORITY_ID"
    # Low priority: solo-dev or default
    else
        echo "$LOW_PRIORITY_ID"
    fi
}

# Function to determine effort from labels
get_effort_id() {
    local labels=$1

    if echo "$labels" | grep -q "quick-win"; then
        echo "$QUICK_WIN_ID"
    elif echo "$labels" | grep -q "large-effort"; then
        echo "$LARGE_EFFORT_ID"
    elif echo "$labels" | grep -q "medium-effort"; then
        echo "$MEDIUM_EFFORT_ID"
    else
        echo "$SMALL_EFFORT_ID"
    fi
}

# Function to determine quarter (default to Backlog, can be customized)
get_quarter_id() {
    local labels=$1

    # Check if there's already a Q1-2026, Q2-2026 etc label
    if echo "$labels" | grep -q "Q1-2026"; then
        echo "$Q1_2026_ID"
    elif echo "$labels" | grep -q "Q2-2026"; then
        echo "$Q2_2026_ID"
    elif echo "$labels" | grep -q "Q3-2026"; then
        echo "$Q3_2026_ID"
    elif echo "$labels" | grep -q "Q4-2026"; then
        echo "$Q4_2026_ID"
    else
        # Default to Backlog
        echo "$BACKLOG_ID"
    fi
}

# Function to determine status from issue state
get_status_id() {
    local state=$1

    if [ "$state" = "CLOSED" ]; then
        echo "$DONE_ID"
    else
        echo "$TODO_ID"
    fi
}

# Get all feature issues
echo "📋 Fetching all feature issues..."
gh issue list --search "[Feature] in:title" --state all --json number,title,state,labels --limit 100 > /tmp/feature-issues-bulk.json

total_issues=$(cat /tmp/feature-issues-bulk.json | jq 'length')
echo "Found $total_issues feature issues"
echo ""

# Process each issue
counter=0
cat /tmp/feature-issues-bulk.json | jq -c '.[]' | while read issue; do
    counter=$((counter + 1))
    issue_number=$(echo "$issue" | jq -r '.number')
    issue_title=$(echo "$issue" | jq -r '.title')
    issue_state=$(echo "$issue" | jq -r '.state')
    issue_labels=$(echo "$issue" | jq -r '.labels[].name' | tr '\n' ' ')

    echo "[$counter/$total_issues] Processing #$issue_number: $issue_title"

    # Get project item ID
    item_id=$(get_project_item_id "$issue_number")

    if [ -z "$item_id" ]; then
        echo "  ⚠️  Skipping - not found in project"
        continue
    fi

    # Determine field values
    priority_id=$(get_priority_id "$issue_labels")
    effort_id=$(get_effort_id "$issue_labels")
    quarter_id=$(get_quarter_id "$issue_labels")
    status_id=$(get_status_id "$issue_state")

    # Update fields
    echo "  📝 Updating fields..."
    update_field "$item_id" "$QUARTER_FIELD_ID" "$quarter_id" "Quarter"
    sleep 0.2
    update_field "$item_id" "$PRIORITY_FIELD_ID" "$priority_id" "Priority"
    sleep 0.2
    update_field "$item_id" "$EFFORT_FIELD_ID" "$effort_id" "Effort"
    sleep 0.2
    update_field "$item_id" "$STATUS_FIELD_ID" "$status_id" "Status"
    sleep 0.2

    echo "  ✅ Updated successfully"
    echo ""
done

echo ""
echo "🎉 All feature issues have been updated!"
echo "📊 View your dashboard: https://github.com/orgs/codecollab-co/projects/1"
echo ""
echo "Field mapping used:"
echo "  Priority:"
echo "    - High: enterprise features"
echo "    - Medium: small-team, devops features"
echo "    - Low: solo-dev or unlabeled features"
echo ""
echo "  Effort:"
echo "    - Quick Win: quick-win label"
echo "    - Large: large-effort label"
echo "    - Medium: medium-effort label"
echo "    - Small: default or unlabeled"
echo ""
echo "  Quarter:"
echo "    - Detected from Q1-2026, Q2-2026, etc. labels"
echo "    - Default: Backlog (if no quarter label)"
echo ""
echo "  Status:"
echo "    - Done: closed issues"
echo "    - Todo: open issues"
