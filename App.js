import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Platform,
  ImageBackground 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function App() {
  const [number, setNumber] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Hacking style logs generator
  const addLog = (text) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] > ${text}`, ...prev.slice(0, 4)]);
  };

  const fetchData = async () => {
    if (!number) {
      addLog("ERROR: Input is empty...");
      return;
    }

    setLoading(true);
    setData(null);
    addLog(`INITIATING CONNECTION... TARGET: ${number}`);
    addLog("BYPASSING FIREWALL...");

    try {
      // User ki di hui API
      const url = `https://fam-official.serv00.net/api/famdatabase.php?number=${number}`;
      const response = await axios.get(url);

      if (response.data) {
        setData(response.data);
        addLog("DATA EXTRACTED SUCCESSFULLY.");
      } else {
        addLog("DATA NOT FOUND OR ENCRYPTED.");
      }
    } catch (error) {
      addLog("CONNECTION FAILED: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with Dark Hacking Vibe */}
      <LinearGradient
        colors={['#000000', '#0a1f0a', '#000000']}
        style={styles.background}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.hackerTitle}>_SIM_DB_TOOL_</Text>
          <Text style={styles.subTitle}>v2.0 // SYSTEM READY</Text>
        </View>

        {/* Input Zone - Glass Effect */}
        <View style={styles.glassCard}>
          <Text style={styles.label}>ENTER TARGET NUMBER:</Text>
          <TextInput
            style={styles.input}
            placeholder="03XXXXXXXXX"
            placeholderTextColor="#33ff0055"
            keyboardType="numeric"
            value={number}
            onChangeText={setNumber}
          />
          
          <TouchableOpacity 
            style={styles.hackButton} 
            onPress={fetchData} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>EXECUTE SEARCH</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Terminal Logs */}
        <View style={styles.terminalBox}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </View>

        {/* Results Section */}
        {data && (
          <View style={[styles.glassCard, styles.resultBox]}>
            <Text style={styles.resultHeader}>// DATA RETRIEVED</Text>
            {/* API ka response structure check karke yahan display hoga */}
            <Text style={styles.dataText}>
              {JSON.stringify(data, null, 2).replace(/[{},"]/g, '')}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  hackerTitle: {
    color: '#00ff41',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: '#00ff41',
    textShadowRadius: 10,
  },
  subTitle: {
    color: '#008F11',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 5,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(20, 20, 20, 0.6)', // Glass Base
    borderColor: 'rgba(0, 255, 65, 0.3)', // Neon Border
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    // Shadow for depth
    shadowColor: "#00ff41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  label: {
    color: '#00ff41',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#00ff41',
    borderWidth: 1,
    borderColor: '#00ff41',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
  },
  hackButton: {
    backgroundColor: '#00ff41',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: "#00ff41",
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  terminalBox: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
  },
  logText: {
    color: '#008F11',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    opacity: 0.8,
  },
  resultHeader: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  dataText: {
    color: '#00ff41',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 22,
  },
});

