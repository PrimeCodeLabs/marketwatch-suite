import * as grpc from "@grpc/grpc-js";
import { AlertServiceClient } from "../stub/alert_grpc_pb";
import { CheckAlertRequest } from "../stub/alert_pb";

// Create a client for the AlertService
const client = new AlertServiceClient(
  "localhost:50052",
  grpc.credentials.createInsecure()
);

// Function to check stock alerts
const checkStockAlert = (symbol: string, threshold: number) => {
  return new Promise((resolve, reject) => {
    const request = new CheckAlertRequest();
    request.setSymbol(symbol);
    request.setThreshold(threshold);

    client.checkStockAlert(request, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.toObject());
      }
    });
  });
};

// Simulate multiple requests
const simulateRequests = async (numClients: number) => {
  const symbols = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"];
  const threshold = 2500;

  const requests = [];
  for (let i = 0; i < numClients; i++) {
    for (const symbol of symbols) {
      requests.push(checkStockAlert(symbol, threshold));
    }
  }

  try {
    const responses = await Promise.all(requests);
    responses.forEach((response, index) => {
      const symbol = symbols[index % symbols.length];
      console.log(`Alert Response for ${symbol}:`, response);
    });
  } catch (error) {
    console.error(`Error checking alerts:`, error);
  }
};

simulateRequests(5);
