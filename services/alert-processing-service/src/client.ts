import * as grpc from "@grpc/grpc-js";
import { AlertServiceClient } from "../stub/alert_grpc_pb";
import { CheckAlertRequest } from "../stub/alert_pb";

const client = new AlertServiceClient(
  "localhost:50052",
  grpc.credentials.createInsecure()
);

const request = new CheckAlertRequest();
request.setSymbol("AAPL");
request.setThreshold(500);

client.checkStockAlert(request, (error, response) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  console.log(`Alert Response: ${JSON.stringify(response.toObject())}`);
});
