#!/usr/bin/env bash
# Update AWS IoT Policy to allow ESP32PatientMonitor client

set -e

POLICY_NAME="ESP32PatientMonitor-Policy"
POLICY_FILE="ESP32PatientMonitor-Policy"

echo "Updating AWS IoT Policy: $POLICY_NAME"

# Get all policy versions
VERSIONS=$(aws iot list-policy-versions --policy-name "$POLICY_NAME" --query 'policyVersions[*].versionId' --output text)

echo "Current policy versions: $VERSIONS"

# Create new policy version
echo "Creating new policy version..."
aws iot create-policy-version \
  --policy-name "$POLICY_NAME" \
  --policy-document file://"$POLICY_FILE" \
  --set-as-default

echo "✅ Policy updated successfully!"
echo ""
echo "Updated policy allows:"
echo "  - Client ID: ESP32PatientMonitor"
echo "  - Topics: sdk/test/js, hospital/vitals"
echo ""
echo "Now your ESP32 should be able to connect to AWS IoT Core!"

