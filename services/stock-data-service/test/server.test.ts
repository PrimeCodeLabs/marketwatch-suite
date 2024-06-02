import * as grpc from "@grpc/grpc-js";
import {
  IStockServiceServer,
  StockServiceClient,
  StockServiceService,
} from "../stub/stock_grpc_pb";
import { StockRequest, StockResponse } from "../stub/stock_pb";

describe("Stock Data Service", () => {
  const getStockPrice: IStockServiceServer["getStockPrice"] = (
    call,
    callback
  ) => {
    console.log("Received request:", call.request.toObject());

    const symbol = call.request.getSymbol();
    const response = new StockResponse();
    response.setSymbol(symbol);
    response.setPrice(Math.random() * 1000); // Simulated random stock price

    console.log("Sending response:", response.toObject());
    callback(null, response);
  };

  let server: grpc.Server;
  let client: StockServiceClient;

  beforeAll((done) => {
    server = new grpc.Server();
    server.addService(StockServiceService, { getStockPrice });
    server.bindAsync(
      "0.0.0.0:50055",
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error(`Server binding error: ${error.message}`);
          return done(error);
        }
        console.log(`Server started on port ${port}`);
        client = new StockServiceClient(
          "localhost:50055",
          grpc.credentials.createInsecure()
        );
        done();
      }
    );
  });

  afterAll(async () => {
    console.log("Shutting down server and client");

    // Shutdown the server and wait for it to finish
    await new Promise<void>((resolve, reject) => {
      server.tryShutdown((err) => {
        if (err) {
          console.error(`Shutdown error: ${err.message}`);
          return reject(err);
        }
        console.log("Server shut down successfully");
        resolve();
      });
    });

    // Close the client
    client.close();
    console.log("Client closed successfully");
  });

  it("should retrieve stock price for a given symbol", async () => {
    const request = new StockRequest();
    request.setSymbol("AAPL");

    const response = await new Promise<StockResponse>((resolve, reject) => {
      client.getStockPrice(request, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });

    const deserializedResponse = StockResponse.deserializeBinary(
      response.serializeBinary()
    );
    const responseObj = deserializedResponse.toObject();

    console.log("Deserialized Response:", responseObj);

    expect(responseObj.price).toBeGreaterThan(0);
    expect(responseObj.symbol).toEqual("AAPL");
  });
});
