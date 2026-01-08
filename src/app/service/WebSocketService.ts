/* eslint-disable @typescript-eslint/no-explicit-any */
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import type { ChatMessage } from "../api/chat";

type MessageHandler = (message: ChatMessage) => void;
type ConnectionStatusHandler = (connected: boolean) => void;
type NotificationHandler = (notification: ChatNotification) => void;

export interface ChatNotification {
  roomId: string;
  sender: string;
  contentPreview: string;
  type: string;
  timestamp: string;
}

class WebSocketService {
  private client: Stomp.Client | null = null;
  private connected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private roomSubscriptions: Record<string, Stomp.Subscription> = {};
  private messageHandlers: Record<string, Set<MessageHandler>> = {};
  private connectionStatusHandlers = new Set<ConnectionStatusHandler>();
  private notificationHandlers = new Set<NotificationHandler>();
  private notificationSubscription: Stomp.Subscription | null = null;
  private accessToken: string | null = null;
  private userEmail: string | null = null;

  // Singleton instance
  private static instance: WebSocketService | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public setCredentials(accessToken: string, userEmail: string): void {
    this.accessToken = accessToken;
    this.userEmail = userEmail;

    // Nếu đã có thông tin đăng nhập và chưa kết nối, thử kết nối
    if (!this.connected && this.accessToken && this.userEmail) {
      this.connect();
    }
  }

  public connect(): void {
    if (this.client?.connected || !this.accessToken || !this.userEmail) return;

    try {
      // Clear any existing reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Create a new SockJS connection using environment variable
      const socket = new SockJS(`${import.meta.env.VITE_SECRET_API}ws`);
      this.client = Stomp.over(socket);

      // Disable debug logging
      this.client.debug = () => {};

      // Connect to the WebSocket server
      this.client.connect(
        { Authorization: `Bearer ${this.accessToken}` },
        this.onConnected.bind(this),
        this.onError.bind(this)
      );
    } catch (error) {
      console.error("Failed to initialize WebSocket connection:", error);
      this.setConnected(false);
      this.scheduleReconnect();
    }
  }

  private onConnected(): void {
    if (!this.client) return;

    this.setConnected(true);

    // Subscribe to personal notifications channel
    this.subscribeToNotifications();

    // Resubscribe to all previous room subscriptions
    Object.keys(this.roomSubscriptions).forEach((roomId) => {
      this.subscribeToRoom(roomId);
    });
  }

  private onError(error: any): void {
    console.error("WebSocket connection error:", error);
    this.setConnected(false);
    this.scheduleReconnect();
  }

  private setConnected(status: boolean): void {
    this.connected = status;
    // Notify all connection status handlers
    this.connectionStatusHandlers.forEach((handler) => handler(status));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Attempt to reconnect after 5 seconds
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  public disconnect(): void {
    if (!this.client) return;

    // Unsubscribe from notifications
    if (this.notificationSubscription) {
      try {
        this.notificationSubscription.unsubscribe();
        this.notificationSubscription = null;
      } catch (err) {
        console.error("Error unsubscribing from notifications:", err);
      }
    }

    // Unsubscribe from all rooms
    Object.values(this.roomSubscriptions).forEach((subscription) => {
      try {
        if (subscription) subscription.unsubscribe();
      } catch (err) {
        console.error("Error unsubscribing:", err);
      }
    });

    // Clear subscriptions record
    this.roomSubscriptions = {};

    // Disconnect the client
    try {
      this.client.disconnect(() => {
        this.setConnected(false);
      });
    } catch (err) {
      console.error("Error disconnecting WebSocket:", err);
      this.setConnected(false);
    }
  }

  public subscribeToRoom(roomId: string): void {
    if (!this.client || !this.connected) {
      // Keep track of rooms we want to subscribe to when we connect
      this.roomSubscriptions[roomId] = null as unknown as Stomp.Subscription;
      return;
    }

    // Unsubscribe if already subscribed
    if (this.roomSubscriptions[roomId]) {
      try {
        this.roomSubscriptions[roomId].unsubscribe();
      } catch (err) {
        console.error(`Error unsubscribing from room ${roomId}:`, err);
      }
    }

    // Subscribe to the room topic
    const subscription = this.client.subscribe(
      `/topic/public/${roomId}`,
      (payload) => {
        try {
          const message = JSON.parse(payload.body) as ChatMessage;

          // Notify all handlers for this room
          this.notifyMessageHandlers(roomId, message);
        } catch (error) {
          console.error(`Error processing message in room ${roomId}:`, error);
        }
      }
    );

    // Store the subscription
    this.roomSubscriptions[roomId] = subscription;
  }

  public unsubscribeFromRoom(roomId: string): void {
    const subscription = this.roomSubscriptions[roomId];
    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (err) {
        console.error(`Error unsubscribing from room ${roomId}:`, err);
      }
      delete this.roomSubscriptions[roomId];
    }
  }

  public sendMessage(roomId: string, message: Omit<ChatMessage, "id">): void {
    if (!this.client || !this.connected) {
      console.error("Cannot send message: WebSocket not connected");
      return;
    }

    this.client.send(
      `/app/chat.sendMessage/${roomId}`,
      {},
      JSON.stringify(message)
    );
  }

  // Register a handler for messages in a specific room
  public addMessageHandler(roomId: string, handler: MessageHandler): void {
    if (!this.messageHandlers[roomId]) {
      this.messageHandlers[roomId] = new Set();
    }
    this.messageHandlers[roomId].add(handler);
  }

  // Remove a handler for messages in a specific room
  public removeMessageHandler(roomId: string, handler: MessageHandler): void {
    if (this.messageHandlers[roomId]) {
      this.messageHandlers[roomId].delete(handler);
    }
  }

  // Register a connection status handler
  public addConnectionStatusHandler(handler: ConnectionStatusHandler): void {
    this.connectionStatusHandlers.add(handler);
    // Immediately notify with current status
    handler(this.connected);
  }

  // Remove a connection status handler
  public removeConnectionStatusHandler(handler: ConnectionStatusHandler): void {
    this.connectionStatusHandlers.delete(handler);
  }

  // Subscribe to personal notifications
  private subscribeToNotifications(): void {
    if (!this.client || !this.client.connected || !this.userEmail) return;

    // Unsubscribe if already subscribed
    if (this.notificationSubscription) {
      try {
        this.notificationSubscription.unsubscribe();
        this.notificationSubscription = null;
      } catch (err) {
        console.error("Error unsubscribing from notifications:", err);
      }
    }

    // Subscribe to user's personal notification channel
    this.notificationSubscription = this.client.subscribe(
      `/topic/user/${this.userEmail}/notifications`,
      (payload) => {
        try {
          const notification = JSON.parse(payload.body) as ChatNotification;
          console.log("Received notification:", notification);

          // Notify all notification handlers
          this.notificationHandlers.forEach((handler) => handler(notification));
        } catch (error) {
          console.error("Error processing notification:", error);
        }
      }
    );

    console.log(`Subscribed to notifications for user: ${this.userEmail}`);
  }

  // Register a notification handler
  public addNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandlers.add(handler);
  }

  // Remove a notification handler
  public removeNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandlers.delete(handler);
  }

  // Notify all handlers for a specific room
  private notifyMessageHandlers(roomId: string, message: ChatMessage): void {
    if (this.messageHandlers[roomId]) {
      this.messageHandlers[roomId].forEach((handler) => handler(message));
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export default WebSocketService;
