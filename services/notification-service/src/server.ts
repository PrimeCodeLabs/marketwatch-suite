import * as grpc from "@grpc/grpc-js";
import {
  NotificationServiceService,
  INotificationServiceServer,
} from "../stub/notification_grpc_pb";
import {
  SendNotificationRequest,
  SendNotificationResponse,
} from "../stub/notification_pb";
import * as promClient from "prom-client";
import http from "http";

const requestCounter = new promClient.Counter({
  name: "notification_service_requests_total",
  help: "Total number of requests to the Notification Service",
  labelNames: ["method"],
});

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });
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

const server = new grpc.Server();
server.addService(NotificationServiceService, { sendNotification });

const port = "0.0.0.0:50053";
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Notification Service running at ${port}`);
  server.start();
});

// Expose metrics endpoint
const metricsServer = http.createServer(async (req, res) => {
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } else {
    res.statusCode = 404;
    res.end();
  }
});

metricsServer.listen(8082, () => {
  console.log("Metrics server running at http://localhost:8082/metrics");
});
