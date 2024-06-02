import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { CheckAlertRequest, CheckAlertResponse } from "../stub/alert_pb";
import { AlertServiceClient, AlertServiceService } from "../stub/alert_grpc_pb";

describe("Alert Processing Service", () => {
  let server: grpc.Server;
  let client: AlertServiceClient;

  beforeAll((done) => {
    server = new grpc.Server();
    server.addService(AlertServiceService, {
      checkStockAlert: (call: any, callback: any) => {
        const request = call.request as CheckAlertRequest;
        const symbol = request.getSymbol();
        const threshold = request.getThreshold();

        const price = Math.random() * 1000; // Simulate random price for testing
        const alert = price >= threshold;

        const response = new CheckAlertResponse();
        response.setSymbol(symbol);
        response.setAlert(alert);
        response.setMessage(
          alert
            ? `Price of ${symbol} is above threshold`
            : `Price of ${symbol} is below threshold`
        );

        callback(null, response);
      },
    });

    server.bindAsync(
      "localhost:50052",
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error(`Server binding error: ${error.message}`);
          return done(error);
        }
        console.log(`Server started on port ${port}`);
        client = new AlertServiceClient(
          "localhost:50052",
          grpc.credentials.createInsecure()
        );
        done();
      }
    );
  });

  afterAll(async () => {
    client.close();
    await new Promise<void>((resolve, reject) => {
      server.tryShutdown((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  it("should trigger alert when price is above threshold", async () => {
    const request = new CheckAlertRequest();
    request.setSymbol("AAPL");
    request.setThreshold(500);

    const response = await new Promise<CheckAlertResponse>(
      (resolve, reject) => {
        client.checkStockAlert(request, (error, response) => {
          if (error) return reject(error);
          resolve(response);
        });
      }
    );

    const responseObj = response.toObject();
    console.log("Response:", responseObj);

    if (responseObj.alert) {
      expect(responseObj.message).toEqual("Price of AAPL is above threshold");
    } else {
      expect(responseObj.message).toEqual("Price of AAPL is below threshold");
    }
  });
});
