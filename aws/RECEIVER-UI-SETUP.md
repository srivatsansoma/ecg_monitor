# Receiver UI Setup

## Problem
The Receiver UI failed to start because the AWS IoT Policy doesn't allow it to connect.

## Solution: Update AWS IoT Policy (Again)

### Step 1: Go to AWS IoT Console
1. Open https://console.aws.amazon.com/iot/
2. Region: **us-east-1**
3. **Security** → **Policies** → **ESP32PatientMonitor-Policy**

### Step 2: Update the Policy

Click **"Edit active version"** and replace with this updated policy:

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
        "arn:aws:iot:us-east-1:547925827604:topicfilter/sdk/test/js",
        "arn:aws:iot:us-east-1:547925827604:topicfilter/hospital/vitals"
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
        "arn:aws:iot:us-east-1:547925827604:client/ESP32PatientMonitor",
        "arn:aws:iot:us-east-1:547925827604:client/receiver-ui-*"
      ]
    }
  ]
}
```

### Step 3: Save
Click **"Save as new version"**

### Step 4: Start Receiver UI
Wait 10-15 seconds, then run:

```bash
cd /home/srivatsan/dev/iot_appa/new/aws/receiver-ui
npm start
```

### Step 5: Open Browser
Go to: **http://localhost:5050**

You should see vitals data streaming in real-time!

## What Changed?
✅ Added: `receiver-ui-*` to Connect permissions
✅ Added: `hospital/vitals` to Subscribe permissions

## Ports Summary
- **Main UI**: http://localhost:5173 (Simulator & Control Panel)
- **Test Endpoint**: http://localhost:4000/recent (HTTP endpoint test)
- **Receiver UI**: http://localhost:5050 (AWS IoT subscriber)



