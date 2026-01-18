# AWS IoT Policy Update Instructions

## Problem
Your ESP32 is getting timeout error because the AWS IoT Policy doesn't allow Client ID: `ESP32PatientMonitor`

## Solution: Update Policy via AWS Console

### Step 1: Go to AWS IoT Console
1. Open https://console.aws.amazon.com/iot/
2. Select region: **us-east-1**
3. Click **Security** → **Policies** in the left menu

### Step 2: Edit the Policy
1. Find and click on: **ESP32PatientMonitor-Policy**
2. Click **Edit active version** button
3. Replace the entire policy JSON with the content below

### Step 3: Copy This Updated Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish",
        "iot:Receive",
        "iot:PublishRetain"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:547925827604:topic/sdk/test/java",
        "arn:aws:iot:us-east-1:547925827604:topic/sdk/test/python",
        "arn:aws:iot:us-east-1:547925827604:topic/sdk/test/js",
        "arn:aws:iot:us-east-1:547925827604:topic/hospital/vitals"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Subscribe"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:547925827604:topicfilter/sdk/test/java",
        "arn:aws:iot:us-east-1:547925827604:topicfilter/sdk/test/python",
        "arn:aws:iot:us-east-1:547925827604:topicfilter/sdk/test/js"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:547925827604:client/sdk-java",
        "arn:aws:iot:us-east-1:547925827604:client/basicPubSub",
        "arn:aws:iot:us-east-1:547925827604:client/sdk-nodejs-*",
        "arn:aws:iot:us-east-1:547925827604:client/ESP32PatientMonitor"
      ]
    }
  ]
}
```

### Step 4: Save Changes
1. Click **Save as new version** button
2. Confirm the new version is set as the **active version**

### Step 5: Test Connection
1. Wait 10-15 seconds for AWS to propagate the changes
2. Reset your ESP32 or wait for the next MQTT connection attempt
3. Check the serial monitor - you should see: `{"status":"mqtt_connected"}`

## What Changed?
✅ Added: `"arn:aws:iot:us-east-1:547925827604:client/ESP32PatientMonitor"` to Connect action
✅ Added: `"arn:aws:iot:us-east-1:547925827604:topic/hospital/vitals"` to Publish action

Your ESP32 can now connect with Client ID: **ESP32PatientMonitor** and publish to topics: **sdk/test/js** and **hospital/vitals**

