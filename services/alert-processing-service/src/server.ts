import * as grpc from "@grpc/grpc-js";
import {
  AlertServiceService,
  IAlertServiceServer,
} from "../stub/alert_grpc_pb";
import { CheckAlertResponse } from "../stub/alert_pb";
import { NotificationServiceClient } from "../stub/notification_grpc_pb";
import { SendNotificationRequest } from "../stub/notification_pb";
import { StockServiceClient } from "../stub/stock_grpc_pb";
import { StockRequest } from "../stub/stock_pb";
import * as promClient from "prom-client";
import * as http from "http";

const stockClient = new StockServiceClient(
  "stock-data-service:50051",
  grpc.credentials.createInsecure()
);

const notificationClient = new NotificationServiceClient(
  "notification-service:50053",
  grpc.credentials.createInsecure()
);

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const requestCounter = new promClient.Counter({
  name: "alert_processing_service_requests_total",
  help: "Total number of requests to the Alert Processing Service",
  labelNames: ["method"],
});

register.registerMetric(requestCounter);

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
    requestCounter.inc({ method: "checkStockAlert" });

    if (alert) {
      const notificationRequest = new SendNotificationRequest();
      notificationRequest.setMessage(`Price of ${symbol} is above threshold`);
      notificationClient.sendNotification(
        notificationRequest,
        (notifError, notifResponse) => {
          if (notifError) {
            console.error(`Error sending notification: ${notifError.message}`);
            callback(notifError, null);
            return;
          }

          console.log(
            `Notification sent successfully: ${notifResponse.getSuccess()}`
          );
          callback(null, alertResponse);
        }
      );
    } else {
      callback(null, alertResponse);
    }
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
});

// Expose metrics endpoint
const metricsPort = 8081;
http
  .createServer(async (req, res) => {
    if (req.url === "/metrics") {
      res.setHeader("Content-Type", register.contentType);
      res.end(await register.metrics());
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  })
  .listen(metricsPort, () => {
    console.log(
      `Metrics server running at http://localhost:${metricsPort}/metrics`
    );
  });
