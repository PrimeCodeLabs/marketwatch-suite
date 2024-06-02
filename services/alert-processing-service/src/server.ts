import * as grpc from "@grpc/grpc-js";
import {
  AlertServiceService,
  IAlertServiceServer,
} from "../stub/alert_grpc_pb";
import { CheckAlertResponse } from "../stub/alert_pb";
import { StockServiceClient } from "../stub/stock_grpc_pb";
import { StockRequest } from "../stub/stock_pb";

const stockClient = new StockServiceClient(
  "stock-data-service:50051", // Use the container name here
  grpc.credentials.createInsecure()
);

const checkStockAlert: IAlertServiceServer["checkStockAlert"] = (
  call,
  callback
) => {
  const symbol = call.request.getSymbol();
  const threshold = call.request.getThreshold();
  console.log(
    `Received alert request for symbol: ${symbol} with threshold: ${threshold}`
  );

  const stockRequest = new StockRequest();
  stockRequest.setSymbol(symbol);

  stockClient.getStockPrice(stockRequest, (error, response) => {
    if (error) {
      console.error(`Error fetching stock price: ${error.message}`);
      callback(error, null);
      return;
    }

    const price = response.getPrice();
    console.log(`Received stock price: ${price} for symbol: ${symbol}`);
    const alert = price >= threshold;

    const alertResponse = new CheckAlertResponse();
    alertResponse.setSymbol(symbol);
    alertResponse.setAlert(alert);
    alertResponse.setMessage(
      alert
        ? `Price of ${symbol} is above threshold`
        : `Price of ${symbol} is below threshold`
    );

    console.log(`Sending alert response: ${alertResponse.toObject()}`);
    callback(null, alertResponse);
  });
};

const server = new grpc.Server();
server.addService(AlertServiceService, { checkStockAlert });

const port = "0.0.0.0:50052";
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Alert Processing Service running at ${port}`);
  server.start();
});
