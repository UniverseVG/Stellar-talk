import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spinner,
  // MenuList,
  Text,
  Tooltip,
  useColorMode,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { BellIcon, ChevronDownIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { ChatState } from "../Context/ChatProvider";
import ProfileModal from "./User/ProfileModal";
import { useNavigate } from "react-router-dom";
import ChatLoading from "./ChatSection/ChatLoading";
import UserListItem from "./User/UserListItem";
import { getSender } from "../config/ChatLogic";
import "./styles.css";
import io from "socket.io-client";
import apiEndpoints from "../api";

const ENDPOINT = import.meta.env.VITE_SERVER_URL;
var socket;
function SideDrawer() {
  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = ChatState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const toast = useToast();

  const handleSearch = async () => {
    if (!search) {
      toast({
        title: "Please Enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }
    try {
      setLoading(true);

      const { data } = await apiEndpoints.searchUsers(search);
      setLoading(false);
      setSearchResult(data.data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.message || "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);

      const { data } = await apiEndpoints.accessChat({ userId });
      if (!chats?.find((c) => c._id === data.data._id)) {
        setChats([data.data, ...chats]);
      }
      setSelectedChat(data.data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoadingChat(false);
    }
  };

  const getNotifications = async () => {
    try {
      const { data } = await apiEndpoints.fetchNotifications();
      setNotification(data.data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.message || "Failed to Load the Notifications",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const readNotification = async (id) => {
    try {
      await apiEndpoints.readNotification(id);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.message || "Failed to read the Notifications",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
  }, []);

  useEffect(() => {
    socket.on("notification", () => {
      getNotifications();
    });
  }, []);

  useEffect(() => {
    getNotifications();
  }, []);

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg={colorMode === "light" ? "white" : "gray.800"}
        w="100%"
        p="5px 10px 5px 10px"
        borderWidth="5px"
      >
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button
            value="ghost"
            onClick={onOpen}
            size={{ base: "sm", md: "md" }}
          >
            <i className="fas fa-search"></i>
            <Text display={{ base: "none", md: "flex" }} px={4}>
              Search Users
            </Text>
          </Button>
        </Tooltip>

        <Text
          fontSize={{ base: "md", md: "2xl" }}
          fontFamily="Work sans"
          style={{ color: colorMode === "light" ? "black" : "white" }}
        >
          Stellar-Talk
        </Text>
        <div>
          <Button onClick={toggleColorMode} size={{ base: "sm", md: "md" }}>
            {colorMode === "light" ? (
              <MoonIcon fontSize={{ base: "lg", md: "xl" }} />
            ) : (
              <SunIcon fontSize={{ base: "lg", md: "xl" }} />
            )}
          </Button>
          <Menu>
            <MenuButton p={1}>
              {notification.length > 0 && (
                <div className="notification-badge">
                  <span className="notification-count">
                    {notification.length}
                  </span>
                </div>
              )}
              <BellIcon
                fontSize={{ base: "lg", md: "2xl" }}
                m={1}
                style={{ color: colorMode === "light" ? "black" : "white" }}
              />
            </MenuButton>
            <MenuList pl={2} color={colorMode === "light" ? "black" : "white"}>
              {!notification.length && "No New Messages"}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    readNotification(notif._id);
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                  }}
                  color={colorMode === "light" ? "black" : "white"}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size={{ base: "sm", md: "md" }}
            >
              <Avatar
                size={{ base: "sm" }}
                cursor="pointer"
                name={user.name}
                src={user.pic}
              />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user}>
                <MenuItem color={colorMode === "light" ? "black" : "white"}>
                  My Profile
                </MenuItem>
              </ProfileModal>

              <MenuDivider />
              <MenuItem
                onClick={logoutHandler}
                color={colorMode === "light" ? "black" : "white"}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </div>
      </Box>
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody>
            <Box display="flex" pb={2}>
              <Input
                placeholder="Search by name or email"
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>
            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            )}
            {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
          <DrawerFooter></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default SideDrawer;
