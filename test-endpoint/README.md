# Local Test Endpoint

Simple localhost endpoint for receiving JSON payloads from the simulator.

## Run

```bash
cd /home/srivatsan/dev/iot_appa/new/test-endpoint
npm run start
```

## Endpoints

- `GET /health`
  - Response: `{ "status": "ok" }`

- `POST /ingest`
  - Send JSON payloads here
  - Response: `{ "status": "received", "receivedAt": "...", "payload": { ... } }`

## Example

```bash
curl -X POST http://localhost:4000/ingest \
  -H 'Content-Type: application/json' \
  -d '{"temperature":37.2,"heartRate":78}'
```
