import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, 
  ScrollView, Platform, Vibration, Keyboard, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur'; // Glass Effect
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../constants/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [input, setInput] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  // UI States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // === COPY ALL WITH ANIMATION ===
  const handleCopyAll = async () => {
    if (data.length === 0) return;
    
    // 1. Copy Data
    let allText = data.map((rec, i) => 
      `Record ${i+1}:\nName: ${rec.full_name || rec.name}\nNumber: ${rec.phone || rec.number}\nCNIC: ${rec.cnic}\nAddress: ${rec.address}\n------------------`
    ).join('\n');
    await Clipboard.setStringAsync(allText);
    Vibration.vibrate(50);

    // 2. Change Icon State
    setIsCopying(true);
    
    // 3. Show Beautiful Dialog
    setShowSuccessModal(true);

    // 4. Reset Icon and Hide Dialog after delay
    setTimeout(() => {
        setIsCopying(false);
        setShowSuccessModal(false);
    }, 2000);
  };

  // === DOWNLOAD LOGIC ===
  const handleDownloadTxt = async () => {
    if (data.length === 0) return;
    const fileName = `RM_DB_${input || 'Search'}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    let fileContent = `ROMEO UCHIHA DB SEARCH RESULT\n\n` + data.map((rec, i) => 
      `[ RECORD ${i+1} ]\nMobile: ${rec.phone || rec.number}\nName:   ${rec.full_name || rec.name}\nCNIC:   ${rec.cnic}\nAddr:   ${rec.address}\n\n`
    ).join('-----------------------------------\n');

    try {
      await FileSystem.writeAsStringAsync(fileUri, fileContent, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // === SEARCH LOGIC ===
  const handleSearch = async () => {
    if (!input) return;
    Keyboard.dismiss(); 
    setData([]);
    setNotFound(false);
    
    let cleanNumber = input.replace(/\D/g, '');
    if (cleanNumber.startsWith('92')) cleanNumber = cleanNumber.substring(2);
    if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);

    if (cleanNumber.length < 10) return;

    setLoading(true);
    try {
      const targetUrl = `https://fam-official.serv00.net/api/famdatabase.php?number=${cleanNumber}`;
      const finalUrl = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` : targetUrl;
      const response = await axios.get(finalUrl);
      let result = response.data;
      if (typeof result === 'string') { try { result = JSON.parse(result); } catch (e) {} }

      if (result.success && result.data && result.data.records) {
        setData(result.data.records);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Background Gradient for Glass Effect */}
      <LinearGradient
        colors={['#0f172a', '#334155', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* === GLASSY HEADER === */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonWrapper}>
            {/* Back Bubble */}
            <View style={styles.glassBubble}>
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                <Ionicons name="arrow-back" size={22} color="#fff" />
            </View>
            <Text style={styles.backText}>Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)} style={{marginBottom: 20}}>
            <Text style={styles.title}>Search <Text style={{color: colors.primary}}>Database</Text></Text>
        </Animated.View>

        {/* === GLASSY INPUT CARD === */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.glassCardContainer}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { color: '#fff' }]}
              placeholder="Ex: 3001234567"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="numeric"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSearch}
            />
            {input.length > 0 && (
               <TouchableOpacity onPress={() => setInput('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
               </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.searchBtn, { backgroundColor: colors.primary }]} 
            onPress={handleSearch}
            activeOpacity={0.8}
            disabled={loading}
          >
             {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>FIND DATA</Text>}
          </TouchableOpacity>
        </Animated.View>

        {/* === RESULTS SECTION === */}
        {data.length > 0 && (
          <Animated.View layout={Layout}>
             
             {/* ACTIONS BAR */}
             <View style={styles.actionBar}>
                <View style={styles.countBadge}>
                   <Text style={{color: colors.primary, fontWeight:'bold', fontSize: 12}}>{data.length} Records Found</Text>
                </View>

                <View style={{flexDirection:'row', gap: 10}}>
                   {/* COPY ALL BUTTON (CHANGING ICON) */}
                   <TouchableOpacity style={[styles.actionToolBtn, isCopying && {backgroundColor: '#22c55e'}]} onPress={handleCopyAll}>
                      {isCopying ? (
                          <Animated.View entering={ZoomIn}>
                              <Feather name="check" size={20} color="#fff" />
                          </Animated.View>
                      ) : (
                          <MaterialCommunityIcons name="content-copy" size={20} color="#fff" />
                      )}
                   </TouchableOpacity>
                   
                   {/* DOWNLOAD BUTTON */}
                   <TouchableOpacity style={[styles.actionToolBtn, {backgroundColor: colors.secondary}]} onPress={handleDownloadTxt}>
                      <MaterialCommunityIcons name="file-download" size={20} color="#fff" />
                   </TouchableOpacity>
                </View>
             </View>
             
             {/* GLASSY LIST */}
             {data.map((record, index) => (
               <Animated.View 
                 key={index} 
                 entering={FadeInUp.delay(index * 150)} 
                 style={styles.glassResultCard}
               >
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                  
                  {/* Strip */}
                  <View style={[styles.cardStrip, { backgroundColor: colors.primary }]} />

                  <View style={styles.cardContent}>
                    <InfoRow icon="smartphone" label="Mobile No" value={record.phone || record.number} color={colors.secondary} />
                    <View style={styles.divider} />
                    <InfoRow icon="user" label="Full Name" value={record.full_name || record.name} color={colors.primary} />
                    <View style={styles.divider} />
                    <InfoRow icon="credit-card" label="CNIC" value={record.cnic} color={colors.secondary} />
                    <View style={styles.divider} />
                    <InfoRow icon="map-pin" label="Address" value={record.address || record.city} color={colors.primary} />
                  </View>
               </Animated.View>
             ))}
          </Animated.View>
        )}

        {/* === NOT FOUND === */}
        {notFound && (
          <Animated.View entering={ZoomIn} style={styles.errorContainer}>
             <MaterialCommunityIcons name="database-off" size={50} color={colors.secondary} />
             <Text style={styles.errorText}>No Record Found</Text>
          </Animated.View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* === CUSTOM SUCCESS MODAL === */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} style={styles.successDialog}>
                <View style={styles.successIconCircle}>
                    <Feather name="check" size={40} color="#fff" />
                </View>
                <Text style={styles.successTitle}>All Copied!</Text>
                <Text style={styles.successSub}>Record clipboard me save ho gaya.</Text>
            </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

// === ROW COMPONENT ===
const InfoRow = ({ icon, label, value, color }) => (
  <View style={styles.row}>
    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
       <Feather name={icon as any} size={18} color={color} />
    </View>
    <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'Not Available'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 60 },
  
  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButtonWrapper: { flexDirection: 'row', alignItems: 'center' },
  glassBubble: { 
    width: 40, height: 40, borderRadius: 20, overflow: 'hidden', 
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff' },

  // Input Card (Glass)
  glassCardContainer: { 
    borderRadius: 20, overflow: 'hidden', marginBottom: 25, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 10
  },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, 
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  searchBtn: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  // Action Bar
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  actionToolBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Result Card (Glass)
  glassResultCard: { 
    borderRadius: 18, marginBottom: 15, overflow: 'hidden', 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  cardStrip: { height: 4, width: '100%' },
  cardContent: { padding: 15 },
  
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  textCol: { flex: 1 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '700', color: '#fff' }, // White text for Glass UI
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 55 },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  successDialog: { 
    width: 250, padding: 30, backgroundColor: 'rgba(30, 41, 59, 0.9)', 
    borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  successIconCircle: { 
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#22c55e', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    shadowColor: "#22c55e", shadowOffset: {width:0, height:5}, shadowOpacity: 0.5, shadowRadius: 10
  },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  successSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  // Error
  errorContainer: { alignItems: 'center', marginTop: 50 },
  errorText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 10 },
});

