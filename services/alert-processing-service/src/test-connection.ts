import * as grpc from "@grpc/grpc-js";
import { StockServiceClient } from "../stub/stock_grpc_pb";
import { StockRequest } from "../stub/stock_pb";

const stockClient = new StockServiceClient(
  "stock-data-service:50051",
  grpc.credentials.createInsecure()
);

const stockRequest = new StockRequest();
stockRequest.setSymbol("AAPL");

stockClient.getStockPrice(stockRequest, (error, response) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  console.log(`Stock Price: ${response.getPrice()}`);
});
