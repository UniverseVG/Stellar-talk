/* eslint-disable react/prop-types */
import { Box, useColorMode } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import SingleChat from "./SingleChat";

function ChatBox({ fetchAgain, setFetchAgain }) {
  const { selectedChat } = ChatState();
  const { colorMode } = useColorMode();

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg={colorMode === "light" ? "white" : "gray.800"}
      w={{ base: "100%", md: "68%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Box>
  );
}

export default ChatBox;
