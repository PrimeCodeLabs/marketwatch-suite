import * as grpc from "@grpc/grpc-js";
import * as http from "http";
import * as promClient from "prom-client";
import {
  INotificationServiceServer,
  NotificationServiceService,
} from "../stub/notification_grpc_pb";
import { SendNotificationResponse } from "../stub/notification_pb";

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const requestCounter = new promClient.Counter({
  name: "notification_service_requests_total",
  help: "Total number of requests to the Notification Service",
  labelNames: ["method"],
});

register.registerMetric(requestCounter);

const sendNotification: INotificationServiceServer["sendNotification"] = (
  call,
  callback
) => {
  const message = call.request.getMessage();
  console.log(`Received notification message: ${message}`);

  // Here you can implement the actual notification logic, e.g., sending an email, push notification, etc.

  const response = new SendNotificationResponse();
  response.setSuccess(true);

  console.log(`Sending response with success: true`);
  requestCounter.inc({ method: "sendNotification" });
  callback(null, response);
};

// Create the gRPC server
const server = new grpc.Server();
server.addService(NotificationServiceService, { sendNotification });

const port = "0.0.0.0:50053";
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Notification Service running at ${port}`);
});

// Expose metrics endpoint
const metricsPort = 8082;
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
