/* eslint-disable react/prop-types */
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../../config/ChatLogic";
import ProfileModal from "../User/ProfileModal";
import UpdateGroupChatModal from "./UpdateGroupChatModal";
import { useEffect, useState } from "react";
import "../styles.css";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import Lottie from "react-lottie";
import typingAnimation from "../../animations/typing_json.json";
import apiEndpoints from "../../api";
import bgDark from "../../assets/chat_background.jpg";
import bgLight from "../../assets/light_chat.jpg";

const ENDPOINT = import.meta.env.VITE_SERVER_URL;
var socket, selectedChatCompare;

function SingleChat({ fetchAgain, setFetchAgain }) {
  const {
    user,
    selectedChat,
    setSelectedChat,
    notification,
    setNotification,
    setActiveUsers,
    activeUsers,
  } = ChatState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const toast = useToast();
  const { colorMode } = useColorMode();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: typingAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const readChatNotifications = async () => {
    try {
      const { data } = await apiEndpoints.readChatNotifications(
        selectedChat._id
      );
      socket.emit("notification received", data);
    } catch {
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("connection", user);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  const createNotification = (newMessageReceived) => {
    apiEndpoints
      .createNotification({
        sender: newMessageReceived.sender._id,
        chat: newMessageReceived.chat._id,
        isGroupChat: newMessageReceived.chat.isGroupChat,
        readBy: activeUsers,
      })
      .then(() => {
        socket.emit("notification received", newMessageReceived);
      })
      .catch((error) => {
        toast({
          title: "Error Occurred!",
          description: error.message || "Failed to Load the Notifications",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      });
  };

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (
          !notification.some(
            (notification) => notification._id === newMessageReceived._id
          )
        ) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
      }
    });

    return () => {
      socket.off("message received");
    };
  }, [selectedChatCompare, notification, setNotification, setFetchAgain]);

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const { data } = await apiEndpoints.fetchMessages(selectedChat._id);
      setMessages(data?.data);
      setLoading(false);
      socket.emit("join chat", selectedChat, user);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occurred!",
        description: error.message || "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        setNewMessage("");

        const { data } = await apiEndpoints.sendMessage({
          content: newMessage,
          chatId: selectedChat._id,
        });

        socket.emit("new message", data.data);
        setMessages([...messages, data?.data]);

        createNotification(data.data);
      } catch {
        toast({
          title: "Error Occurred",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };
  const typingHandler = (event) => {
    setNewMessage(event.target.value);

    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  useEffect(() => {
    socket.on("active users", (users) => {
      setActiveUsers(users);
    });
  }, []);

  useEffect(() => {
    if (selectedChat) {
      readChatNotifications();
    }
  }, [selectedChat]);

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            color={colorMode === "light" ? "black" : "white"}
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => {
                socket.emit("leave chat", selectedChat, user);
                setSelectedChat("");
              }}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
            p={3}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            bgImage={`url(${colorMode === "light" ? bgLight : bgDark})`}
            bgSize="cover"
            bgPosition="center"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}
            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {isTyping ? (
                <div>
                  <div
                    style={{
                      marginBottom: 15,
                      marginLeft: 0,
                      marginRight: 0,
                      width: 70,
                      display: "flex",
                    }}
                  >
                    <Lottie options={defaultOptions} width={70} />
                  </div>
                </div>
              ) : (
                <></>
              )}
              <Input
                placeholder="Enter a message"
                onChange={typingHandler}
                variant="filled"
                bg={colorMode === "light" ? "#E0E0E0" : "gray.800"}
                color={colorMode === "light" ? "black" : "white"}
                value={newMessage}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="top"
          justifyContent="center"
          p={3}
          borderRadius="lg"
          h="100%"
          w="100%"
          bgImage={`url(${colorMode === "light" ? bgLight : bgDark})`}
          bgSize="cover"
          bgPosition="center"
        >
          <Text
            fontSize="3xl"
            fontFamily="Work sans"
            fontWeight="bold"
            color={colorMode === "light" ? "black" : "white"}
          >
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
}

export default SingleChat;
