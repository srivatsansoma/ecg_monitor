# AWS IoT Receiver UI

This UI subscribes to AWS IoT Core and shows messages in real time.

## Requirements
- `aws/aws-config.json` filled with:
  - endpoint
  - clientId
  - topic
  - rootCa
  - deviceCert
  - privateKey

## Run
```bash
cd /home/srivatsan/dev/iot_appa/new/aws/receiver-ui
npm install
npm run start
```

Open: `http://localhost:5050`

## Notes
- Uses X.509 (mTLS) to connect to AWS IoT Core.
- Make sure the IoT policy allows `iot:Subscribe` and `iot:Receive` on the topic.

