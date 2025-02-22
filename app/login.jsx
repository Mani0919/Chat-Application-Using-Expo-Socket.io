import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Animated,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import * as Contacts from "expo-contacts";
import { io } from "socket.io-client";
import { router, useFocusEffect } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

const socket = io("http://192.168.0.104:3000");
const windowHeight = Dimensions.get("window").height;

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const userPhoneNumber = "6303388146";

  useEffect(() => {
    async function getContacts() {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync();
        setContacts(data);
        setFilteredContacts([]);
      }
    }
    getContacts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetch(`http://192.168.0.104:3000/recent-chats/${userPhoneNumber}`)
        .then((res) => res.json())
        .then((data) => {
          setRecentChats(data);
        });
    }, [])
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length >= 1) {
      setShowContacts(true);
      const filtered = contacts.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setShowContacts(false);
      setFilteredContacts([]);
    }
  };

  const renderRecentChat = ({ item }) => {
    if (!item || !item.receiverName) {
      return (
        <View>
          <Text>No recent chats</Text>
        </View>
      );
    }
  {console.log(item)}
    return (
      <TouchableOpacity
        style={styles.recentChatItem}
        onPress={() =>
          router.push({
            pathname: "/chat",
            params: { contact: item._id, receiverName: item.receiverName },
          })
        }
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.receiverName?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.contactName}>{item.receiverName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() =>
        router.push({
          pathname: "/chat",
          params: { contact: item.id, receiverName: item.name },
        })
      }
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.contactName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <FontAwesome name="edit" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search contacts..."
          placeholderTextColor="#666"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.contentContainer}>
        {!showContacts ? (
          <>
            <Text style={styles.sectionTitle}>Recent Chats</Text>
            <FlatList
              data={recentChats}
              renderItem={renderRecentChat}
              keyExtractor={(item) => item._id}
              style={styles.recentList}
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <FlatList
              data={filteredContacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              style={styles.contactsList}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  newChatButton: {
    backgroundColor: "#4A90E2",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: "#333",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  recentList: {
    flex: 1,
  },
  contactsList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  recentChatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
});
