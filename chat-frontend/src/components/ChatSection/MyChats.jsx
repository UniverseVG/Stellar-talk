/* eslint-disable react/prop-types */
import {
  Box,
  Button,
  Stack,
  Text,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import ChatLoading from "./ChatLoading";
import { useEffect, useState } from "react";
import { getSender } from "../../config/ChatLogic";
import { AddIcon } from "@chakra-ui/icons";
import GroupChatModal from "./GroupChatModal";
import { io } from "socket.io-client";
import apiEndpoints from "../../api";

const ENDPOINT = import.meta.env.VITE_SERVER_URL;
var socket, previousChat;

function MyChats({ fetchAgain }) {
  const [loggedUser, setLoggedUser] = useState();
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  useEffect(() => {
    socket = io(ENDPOINT);
  }, []);
  const fetchChats = async () => {
    try {
      const { data } = await apiEndpoints.fetchChats();
      setChats(data?.data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.message || "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo"))?.data);
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg={colorMode === "light" ? "white" : "gray.800"}
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "20px", md: "20px", lg: "24px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        color={colorMode === "light" ? "black" : "white"}
      >
        My Chats
        <GroupChatModal>
          <Button
            fontSize={{ base: "10px", md: "8px", lg: "12px" }}
            rightIcon={<AddIcon />}
            textAlign="right"
            px={2}
            py={0}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg={colorMode === "light" ? "#F8F8F8" : "gray.700"}
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => (
              <Box
                onClick={async () => {
                  await socket.emit("leave chat", previousChat, user);
                  setSelectedChat(chat);
                  previousChat = chat;
                }}
                cursor="pointer"
                bg={
                  selectedChat === chat
                    ? "#38B2AC"
                    : colorMode === "light"
                    ? "#E8E8E8"
                    : "gray.800"
                }
                color={selectedChat === chat ? "white" : "black"}
                px={3}
                py={2}
                borderRadius="lg"
                key={chat._id}
              >
                <Text color={colorMode === "light" ? "black" : "white"}>
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>
                {chat.latestMessage && (
                  <Text
                    fontSize="xs"
                    color={colorMode === "light" ? "black" : "white"}
                  >
                    <b>{chat.latestMessage.sender.name} : </b>
                    {chat.latestMessage.content.length > 50
                      ? chat.latestMessage.content.substring(0, 51) + "..."
                      : chat.latestMessage.content}
                  </Text>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
}

export default MyChats;
