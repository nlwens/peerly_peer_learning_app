import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { apiUrl } from './config';

/**
 * SignalR connection to the API hub. React Native can't send headers on WebSockets,
 * so the access token travels in the query string (the server reads it from there).
 */
export function createRealtimeConnection(accessToken: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(apiUrl('/hubs/peerly'), {
      accessTokenFactory: () => accessToken,
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
