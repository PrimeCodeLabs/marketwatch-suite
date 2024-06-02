import * as grpc from "@grpc/grpc-js";
import {
  StockServiceService,
  IStockServiceServer,
} from "../stub/stock_grpc_pb";
import { StockRequest, StockResponse } from "../stub/stock_pb";

// Predefined dataset with stock symbols and initial prices
const stockData: { [symbol: string]: number } = {
  AAPL: 150,
  GOOGL: 2800,
  AMZN: 3400,
  MSFT: 290,
  TSLA: 700,
};

// Function to simulate price changes
const simulatePriceChanges = () => {
  for (const symbol in stockData) {
    const change = (Math.random() - 0.5) * 10; // Simulate small price changes
    stockData[symbol] = Math.max(0, stockData[symbol] + change); // Ensure price doesn't go negative
  }
  console.log("Updated stock prices:", stockData);
};

// Update prices every 5 seconds
setInterval(simulatePriceChanges, 5000);

const getStockPrice: IStockServiceServer["getStockPrice"] = (
  call,
  callback
) => {
  const symbol = call.request.getSymbol();
  console.log(`Received request for stock symbol: ${symbol}`);

  const price = stockData[symbol] ?? 0; // Return price from dataset or 0 if symbol not found
  const response = new StockResponse();
  response.setSymbol(symbol);
  response.setPrice(price);

  console.log(`Sending response with price: ${price}`);
  callback(null, response);
};

const server = new grpc.Server();
server.addService(StockServiceService, { getStockPrice });

const port = "0.0.0.0:50051"; // Ensure binding to all network interfaces
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Stock Data Service running at ${port}`);
  server.start();
});
