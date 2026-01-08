import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatList } from "./components/ChatList";
import { ChatMessageList } from "./components/ChatMessageList";
import { MessageInput } from "./components/MessageInput";
import { EmptyState } from "./components/EmptyState";
import { useAuthStore } from "../../stores/auth_store";
import { Col, Row, Spin } from "antd";
import type { ChatMessage, ChatSession } from "../../app/api/chat";
import { fetchChatSessions, fetchMessages } from "../../app/api/chat";
import { useWebSocket } from "../../app/provider/WebSocketContext";
import type { ChatNotification } from "../../app/service/WebSocketService";
import { getVNISOString } from "../../utils/time_stamp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const ChatWithCustomerServicePage = () => {
  const [searchParams] = useSearchParams();
  const { loggedInUser } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    isConnected,
    subscribeToRoom,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    addNotificationHandler,
    removeNotificationHandler,
  } = useWebSocket();

  const [searchText, setSearchText] = useState("");
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat sessions using React Query
  const {
    data: chatSessions = [],
    isLoading: isLoadingChatSessions,
    isError: isErrorChatSessions,
    error: errorChatSessions,
  } = useQuery({
    queryKey: ["chatSessions"],
    queryFn: fetchChatSessions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch messages for selected chat using React Query
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
  } = useQuery({
    queryKey: ["chatMessages", selectedChat?.id],
    queryFn: () =>
      selectedChat?.id ? fetchMessages(selectedChat.id) : Promise.resolve([]),
    enabled: !!selectedChat?.id, // Only run query if we have a selected chat
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      roomId,
      message,
    }: {
      roomId: string;
      message: Omit<ChatMessage, "id">;
    }) => {
      // Optimistically add message to UI immediately
      queryClient.setQueryData<ChatMessage[]>(
        ["chatMessages", roomId],
        (oldMessages = []) => [
          ...oldMessages,
          { ...message, id: `temp-${Date.now()}` } as ChatMessage,
        ]
      );

      sendMessage(roomId, message);
      // No return needed, we'll rely on WebSocket for the update
    },
    onSuccess: (_data, variables) => {
      // Optimistically update the chat session list
      const { roomId, message } = variables;

      queryClient.setQueryData<ChatSession[]>(
        ["chatSessions"],
        (oldSessions = []) =>
          oldSessions.map((chat) =>
            chat.id === roomId
              ? {
                  ...chat,
                  lastMessage: message.content,
                  lastMessageTime: message.timestamp,
                }
              : chat
          )
      );
    },
  });

  // Handle chat selection
  const handleChatSelect = useCallback(
    (chat: ChatSession) => {
      setSelectedChat(chat);

      // Mark as read locally by resetting unread count
      queryClient.setQueryData<ChatSession[]>(
        ["chatSessions"],
        (oldSessions = []) =>
          oldSessions.map((c) =>
            c.id === chat.id ? { ...c, unreadCount: 0 } : c
          )
      );
    },
    [queryClient]
  );

  // Message handler function
  const handleNewMessage = useCallback(
    (newMessage: ChatMessage) => {
      console.log("New message received:", newMessage);

      // Skip if this is our own message (already added optimistically when sending)
      if (newMessage.sender === loggedInUser?.email) {
        console.log("Skipping own message (already added)");
        return;
      }

      // Add to messages list if from current room (only other users' messages)
      queryClient.setQueryData<ChatMessage[]>(
        ["chatMessages", newMessage.roomId],
        (oldMessages = []) => [...oldMessages, newMessage]
      );

      // Update chat list with new message info
      queryClient.setQueryData<ChatSession[]>(
        ["chatSessions"],
        (oldSessions = []) =>
          oldSessions.map((chat) =>
            chat.id === newMessage.roomId
              ? {
                  ...chat,
                  lastMessage: newMessage.content,
                  lastMessageTime: newMessage.timestamp,
                  unreadCount:
                    selectedChat?.id === newMessage.roomId
                      ? 0
                      : (chat.unreadCount || 0) + 1,
                }
              : chat
          )
      );
    },
    [queryClient, selectedChat?.id, loggedInUser?.email]
  );

  // Notification handler function for messages in other rooms
  const handleNotification = useCallback(
    (notification: ChatNotification) => {
      console.log("Received notification:", notification);

      queryClient.setQueryData<ChatSession[]>(
        ["chatSessions"],
        (oldSessions = []) => {
          const sessionExists = oldSessions.some(
            (chat) => chat.id === notification.roomId
          );

          if (sessionExists) {
            // Cập nhật session đã có
            return oldSessions.map((chat) =>
              chat.id === notification.roomId
                ? {
                    ...chat,
                    lastMessage: notification.contentPreview,
                    lastMessageTime: notification.timestamp,
                    unreadCount:
                      selectedChat?.id === notification.roomId
                        ? 0
                        : (chat.unreadCount || 0) + 1,
                  }
                : chat
            );
          } else {
            // Nếu session chưa có, làm mới toàn bộ danh sách để lấy session mới
            queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
            return oldSessions;
          }
        }
      );
    },
    [queryClient, selectedChat?.id]
  );

  // Subscribe to selected room when it changes
  useEffect(() => {
    if (selectedChat?.id) {
      // Subscribe to the room
      subscribeToRoom(selectedChat.id);

      // Add message handler for this room
      addMessageHandler(selectedChat.id, handleNewMessage);

      // Clean up when component unmounts or selected chat changes
      return () => {
        removeMessageHandler(selectedChat.id, handleNewMessage);
      };
    }
  }, [
    selectedChat,
    subscribeToRoom,
    addMessageHandler,
    removeMessageHandler,
    handleNewMessage,
  ]);

  // Set up notification handler for all other rooms
  useEffect(() => {
    // Add notification handler
    addNotificationHandler(handleNotification);

    // Clean up when component unmounts
    return () => {
      removeNotificationHandler(handleNotification);
    };
  }, [addNotificationHandler, removeNotificationHandler, handleNotification]);

  // Auto-select chat from URL parameter
  useEffect(() => {
    const chatIdFromUrl = searchParams.get("chatId");
    if (chatIdFromUrl && chatSessions.length > 0 && !isLoadingChatSessions) {
      const chatToSelect = chatSessions.find((c) => c.id === chatIdFromUrl);
      if (chatToSelect && chatToSelect.id !== selectedChat?.id) {
        handleChatSelect(chatToSelect);
      }
    }
  }, [
    chatSessions,
    searchParams,
    handleChatSelect,
    selectedChat?.id,
    isLoadingChatSessions,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat || !loggedInUser?.email) return;

    // Format message for the backend
    const chatMessage = {
      sender: loggedInUser.email,
      content: messageText.trim(),
      type: "CHAT",
      timestamp: getVNISOString(),
      roomId: selectedChat.id,
    };

    // Use mutation to send message
    sendMessageMutation.mutate({
      roomId: selectedChat.id,
      message: chatMessage,
    });

    // Clear the input after sending
    setMessageText("");
  };

  // Show loading state if initial data is loading
  if (isLoadingChatSessions && chatSessions.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 160px)",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Show error state if there was an error loading chat sessions
  if (isErrorChatSessions) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <h3>Lỗi khi tải danh sách cuộc trò chuyện</h3>
        <p>
          {errorChatSessions instanceof Error
            ? errorChatSessions.message
            : "Vui lòng thử lại sau"}
        </p>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["chatSessions"] })
          }
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{}}>
      <div
        style={{
          height: "calc(100vh - 160px)",
          background: "#fff",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e8e8e8",
        }}
      >
        <Row style={{ height: "100%" }}>
          <Col xs={24} lg={8} style={{ height: "100%" }}>
            <ChatList
              chatSessions={chatSessions}
              selectedChat={selectedChat}
              searchText={searchText}
              onSearchChange={setSearchText}
              onChatSelect={handleChatSelect}
            />
          </Col>

          <Col
            xs={24}
            lg={16}
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
            }}
          >
            {selectedChat ? (
              <>
                {isLoadingMessages && messages.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Spin size="large" />
                  </div>
                ) : isErrorMessages ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                    }}
                  >
                    <h3>Lỗi khi tải tin nhắn</h3>
                    <button
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["chatMessages", selectedChat.id],
                        })
                      }
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <ChatMessageList
                    messages={messages}
                    loggedInUser={loggedInUser}
                    customerName={selectedChat.customerName}
                  />
                )}
                <MessageInput
                  messageText={messageText}
                  onMessageChange={setMessageText}
                  onSendMessage={handleSendMessage}
                  isConnected={isConnected}
                />
              </>
            ) : (
              <EmptyState
                title="Chọn một cuộc trò chuyện"
                description="Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin"
              />
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};
