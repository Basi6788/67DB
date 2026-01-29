import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Platform, Vibration, Keyboard, Modal, useColorScheme, Alert, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

// ICONS
import {
  Phone, User, CreditCard, MapPin, Home, Wallet,
  LogOut, Copy, Play, Share2, Key, ArrowRight,
  CheckCircle, Gift, DownloadCloud
} from 'lucide-react-native';

// LIBRARIES
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence
} from 'react-native-reanimated';

// ADMOB IMPORTS
import {
  RewardedAd, RewardedAdEventType, BannerAd, BannerAdSize
} from 'react-native-google-mobile-ads';

// === CONFIGURATION ===
const ADMIN_SECRET_KEY = "uchihalegacy";
const BRAND_SIGNATURE = "\n\nBy: 67DB\nCreator: @Romeo67\nDownload App : https://67-db.vercel.app";
const APP_WEBSITE = "https://67-db.vercel.app";
const CURRENT_VERSION = "1.0.0";
const UPDATE_JSON_URL = "https://raw.githubusercontent.com/Basi6788/67DB/refs/heads/main/update.json";

// === REAL AD CONFIG (From Screenshots) ===
// Note: Real IDs often fail to load in "Expo Go". You must build APK/AAB to see real ads.
const REWARDED_AD_ID = 'ca-app-pub-3694003275001232/2524111893'; // Updated from screenshot
const BANNER_AD_ID = 'ca-app-pub-3694003275001232/5901084273';   // Verified from screenshot

// Initialize Ad
let rewarded = null;
try {
  rewarded = RewardedAd.createForAdRequest(REWARDED_AD_ID, {
    keywords: ['fashion', 'clothing', 'tech'],
  });
} catch (error) {
  console.log("AdMob module missing or Expo Go environment detected.");
}

// === THEME COLORS ===
const THEME = {
  dark: {
    bg: '#0f172a',
    primary: '#2DD4BF',
    secondary: '#94A3B8',
    cardBg: 'rgba(15, 23, 42, 0.8)',
    text: '#F0FDFA',
    inputBg: 'rgba(0,0,0,0.5)',
    blobColors: ['#2DD4BF', '#0ea5e9', '#6366f1']
  },
  light: {
    bg: '#f0f9ff',
    primary: '#0d9488',
    secondary: '#475569',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    text: '#0f172a',
    inputBg: 'rgba(255,255,255,0.6)',
    blobColors: ['#ccfbf1', '#bae6fd', '#c7d2fe']
  }
};

// === ANIMATED BACKGROUND BLOB ===
const AnimatedBlob = ({ color, size, initialPos, delay }) => {
  const translateX = useSharedValue(initialPos.x);
  const translateY = useSharedValue(initialPos.y);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(withSequence(
      withTiming(initialPos.x + 80, { duration: 5000 + delay, easing: Easing.inOut(Easing.ease) }),
      withTiming(initialPos.x - 80, { duration: 6000 + delay, easing: Easing.inOut(Easing.ease) })
    ), -1, true);

    translateY.value = withRepeat(withSequence(
      withTiming(initialPos.y - 80, { duration: 7000 + delay, easing: Easing.inOut(Easing.ease) }),
      withTiming(initialPos.y + 80, { duration: 5000 + delay, easing: Easing.inOut(Easing.ease) })
    ), -1, true);

    scale.value = withRepeat(withSequence(
        withTiming(1.1, { duration: 4000, easing: Easing.ease }),
        withTiming(1, { duration: 4000, easing: Easing.ease })
    ), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    backgroundColor: color,
    width: size, height: size, borderRadius: size / 2,
    position: 'absolute', opacity: 0.3
  }));

  return <Animated.View style={[style]} />;
};

export default function App() {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const COLORS = isDark ? THEME.dark : THEME.light;

  // State
  const [currentTab, setCurrentTab] = useState('home');
  const [credits, setCredits] = useState(10);
  const [isPremium, setIsPremium] = useState(false);
  const [userName, setUserName] = useState(null);
  
  // Modals
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [inviteModal, setInviteModal] = useState(false);
  const [inviterName, setInviterName] = useState('');

  // Updates
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [updateData, setUpdateData] = useState({ version: '', apkUrl: '' });

  // Search
  const [input, setInput] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searchType, setSearchType] = useState('sim');

  // Admin/Keys
  const [keyInput, setKeyInput] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Ad State
  const [adLoaded, setAdLoaded] = useState(false);
  const progressWidth = useSharedValue(0);

  // === INIT ===
  useEffect(() => {
    loadUserData();
    handleDeepLink();
    checkForUpdate();
    
    // AdMob Listener Setup
    if (rewarded) {
        loadAd();
        const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
          setAdLoaded(true);
        });
        const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, reward => {
          updateCreditsAfterAd();
          showToastMsg("Ad Watched! +2 CR");
          setAdLoaded(false);
          loadAd();
        });

        return () => {
            try { unsubscribeLoaded(); unsubscribeEarned(); } catch(e){}
        };
    }
  }, []);

  const updateCreditsAfterAd = async () => {
      const stored = await AsyncStorage.getItem('credits');
      const current = stored ? parseInt(stored) : 0;
      saveCredits(current + 2);
  };

  const loadAd = () => {
    try {
        if(rewarded) rewarded.load();
    } catch (e) {
        console.log("Ad Load Error - likely missing config or emulator", e);
    }
  };

  // Monitor Input
  useEffect(() => {
    const clean = input.replace(/\D/g, '');
    if (clean.length === 13) setSearchType('cnic');
    else setSearchType('sim');
  }, [input]);

  const loadUserData = async () => {
      try {
          const storedName = await AsyncStorage.getItem('userName');
          const storedCredits = await AsyncStorage.getItem('credits');
          const storedPremium = await AsyncStorage.getItem('isPremium');

          if (storedName) setUserName(storedName);
          else setShowNameModal(true);

          if (storedCredits) setCredits(parseInt(storedCredits));
          if (storedPremium === 'true') setIsPremium(true);
      } catch (e) { console.log(e); }
  };

  const checkForUpdate = async () => {
    try {
      const response = await fetch(UPDATE_JSON_URL, { headers: { 'Cache-Control': 'no-cache' } });
      const data = await response.json();

      if (data.version !== CURRENT_VERSION) {
        const lastDecline = await AsyncStorage.getItem('update_declined_date');
        const currentTime = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        setUpdateData({ version: data.version, apkUrl: data.apkUrl });

        if (lastDecline) {
          const timeDiff = currentTime - parseInt(lastDecline);
          if (timeDiff > threeDaysMs) {
             setIsForceUpdate(true);
             setShowUpdateModal(true);
          }
        } else {
           setIsForceUpdate(false);
           setShowUpdateModal(true);
        }
      }
    } catch (error) { console.log(error); }
  };

  const handleUpdateAction = async (action) => {
      if (action === 'update') {
          Linking.openURL(updateData.apkUrl);
      } else {
          if (isForceUpdate) return;
          await AsyncStorage.setItem('update_declined_date', Date.now().toString());
          setShowUpdateModal(false);
      }
  };

  const handleDeepLink = async () => {
    const url = await Linking.getInitialURL();
    if (url) parseUrl(url);
    Linking.addEventListener('url', (event) => parseUrl(event.url));
  };

  const parseUrl = (url) => {
      const { queryParams } = Linking.parse(url);
      if (queryParams && queryParams.inviteBy) {
          setInviterName(queryParams.inviteBy);
          setInviteModal(true);
      }
  };

  const saveCredits = async (newAmount) => {
      setCredits(newAmount);
      await AsyncStorage.setItem('credits', newAmount.toString());
  };

  const savePremium = async (status) => {
      setIsPremium(status);
      await AsyncStorage.setItem('isPremium', status.toString());
  };

  const handleSaveName = async () => {
      if (tempName.length < 3) return Alert.alert("Error", "Name too short");
      setUserName(tempName);
      await AsyncStorage.setItem('userName', tempName);
      setShowNameModal(false);
  };

  const showToastMsg = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const copyContent = async (text, label) => {
      if (!text) return;
      await Clipboard.setStringAsync(`${label}: ${text}${BRAND_SIGNATURE}`);
      Vibration.vibrate(50);
      showToastMsg(`${label} Copied!`);
  };

  const handleShowAd = () => {
    if (adLoaded && rewarded) {
        rewarded.show();
    } else {
        showToastMsg("Ad loading... please wait");
        loadAd();
    }
  };

  const handleSearch = async () => {
    if (!input) return;
    if (credits <= 0 && !isPremium) {
        showToastMsg("Not enough credits! Watch Ads.");
        return;
    }
    Keyboard.dismiss();
    setData([]);
    setNotFound(false);
    
    progressWidth.value = 0;
    progressWidth.value = withRepeat(withTiming(100, { duration: 1500, easing: Easing.linear }), -1, true);

    let cleanNumber = input.replace(/\D/g, '');
    if (searchType === 'sim') {
        if (cleanNumber.startsWith('92')) cleanNumber = cleanNumber.substring(2);
        if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);
    }

    if (cleanNumber.length < 3) { progressWidth.value = 0; return; }
    setLoading(true);
    if (!isPremium) saveCredits(credits - 1);

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
    } catch (error) { setNotFound(true); } 
    finally {
      setLoading(false);
      progressWidth.value = withTiming(0);
    }
  };

  const handleCopyAll = async () => {
    if (data.length === 0) return;
    let content = data.map((rec, i) => 
      `Record ${i+1}:\nName: ${rec.full_name || rec.name}\nNumber: ${rec.phone || rec.number}\nCNIC: ${rec.cnic}\nAddress: ${rec.address}`
    ).join('\n------------------\n');
    await Clipboard.setStringAsync(content + BRAND_SIGNATURE);
    showToastMsg("All Records Copied!");
  };

  const generateInviteLink = async () => {
      const link = `${APP_WEBSITE}/invite?inviteBy=${encodeURIComponent(userName || 'User')}`;
      try {
          await Share.share({
              message: `Hey! Check out 67DB App. Free Sim Data:\n${link}\n\nDownload: ${APP_WEBSITE}/download`,
          });
      } catch (error) {}
  };

  const handleActivateKey = () => {
      if (!keyInput) return;
      if (keyInput === ADMIN_SECRET_KEY) {
          setShowAdminPanel(true);
          setKeyInput('');
          return;
      }
      const mockValidKeys = ['SUPER123', ...generatedKeys];
      if (mockValidKeys.includes(keyInput)) {
          savePremium(true);
          saveCredits(999999);
          showToastMsg("Premium Activated!");
          setKeyInput('');
      } else {
          Alert.alert("Error", "Invalid Key");
      }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    height: 3, backgroundColor: COLORS.primary, borderRadius: 2,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      
      {/* BACKGROUND BLOBS */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <AnimatedBlob color={COLORS.blobColors[0]} size={300} initialPos={{x: -50, y: -50}} delay={0} />
          <AnimatedBlob color={COLORS.blobColors[1]} size={250} initialPos={{x: 200, y: 400}} delay={2000} />
          <BlurView intensity={60} style={StyleSheet.absoluteFill} /> 
      </View>
      
      {/* HEADER */}
      <SafeAreaView style={{zIndex: 10, paddingHorizontal: 20, paddingTop: 10}} edges={['top']}>
          <View style={{alignItems: 'flex-end'}}>
              <Text style={{color: COLORS.primary, fontWeight: 'bold', opacity: 0.8}}>@Romeo67</Text>
          </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.delay(100)} style={{alignItems: 'center', marginBottom: 30, marginTop: 10}}>
            <Text style={[styles.title, {color: COLORS.text}]}>
                SEARCH <Text style={{color: COLORS.primary}}>DATABASE</Text>
            </Text>
            {isPremium && <Text style={{color: '#fbbf24', fontWeight:'bold', letterSpacing:2, fontSize:10}}>PREMIUM UNLOCKED</Text>}
        </Animated.View>

        {currentTab === 'home' ? (
        <>
            <Animated.View entering={FadeInDown.delay(200)} style={[styles.glassContainer, {backgroundColor: COLORS.inputBg, borderColor: COLORS.primary + '40'}]}>
                <View style={styles.inputRow}>
                    <View style={{marginRight: 10, width: 30, alignItems:'center'}}>
                        {searchType === 'cnic' ? <CreditCard size={24} color={COLORS.primary} /> : <Phone size={24} color={COLORS.primary} />}
                    </View>
                    <TextInput
                        style={[styles.input, {color: COLORS.text}]}
                        placeholder="Enter CNIC or Phone number"
                        placeholderTextColor={COLORS.secondary}
                        keyboardType="numeric"
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSearch}
                    />
                </View>
                <View style={{height: 3, marginTop: 10, borderRadius: 2, overflow:'hidden', backgroundColor: 'rgba(0,0,0,0.1)'}}>
                    {loading && <Animated.View style={progressStyle} />}
                </View>
                <TouchableOpacity style={[styles.findBtn, {backgroundColor: COLORS.primary}]} onPress={handleSearch} disabled={loading}>
                    <Text style={styles.btnText}>{loading ? 'SEARCHING...' : 'FIND DATA'}</Text>
                </TouchableOpacity>
                <Text style={{textAlign:'center', marginTop: 10, color: COLORS.secondary, fontSize: 12}}>
                    {isPremium ? 'Unlimited Access' : `Credits: ${credits} (-1 per search)`}
                </Text>
            </Animated.View>

            {data.length > 0 && (
                <Animated.View entering={ZoomIn}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 10, paddingHorizontal: 5}}>
                        <Text style={{color: COLORS.secondary, fontSize: 12}}>{data.length} RECORDS</Text>
                        <TouchableOpacity style={{flexDirection:'row', backgroundColor: COLORS.primary, paddingHorizontal: 12, borderRadius: 20, paddingVertical:4, alignItems:'center'}} onPress={handleCopyAll}>
                            <Copy size={12} color="#000" style={{marginRight:4}} />
                            <Text style={{color: '#000', fontWeight:'bold', fontSize: 10}}>COPY ALL</Text>
                        </TouchableOpacity>
                    </View>
                    {data.map((record, index) => (
                    <Animated.View key={index} entering={FadeInUp.delay(index * 100)} style={[styles.resultCard, {backgroundColor: COLORS.cardBg, borderColor: COLORS.primary+'30'}]}>
                        <View style={styles.cardContent}>
                            <InfoRow icon={Phone} label="MOBILE NO" value={record.phone || record.number} color={COLORS.primary} textColor={COLORS.text} secondary={COLORS.secondary} onCopy={() => copyContent(record.phone || record.number, "Number")} />
                            <InfoRow icon={User} label="FULL NAME" value={record.full_name || record.name} color={COLORS.text} textColor={COLORS.text} secondary={COLORS.secondary} onCopy={() => copyContent(record.full_name || record.name, "Name")} />
                            <InfoRow icon={CreditCard} label="CNIC" value={record.cnic} color={COLORS.primary} textColor={COLORS.text} secondary={COLORS.secondary} onCopy={() => copyContent(record.cnic, "CNIC")} />
                            <InfoRow icon={MapPin} label="ADDRESS" value={record.address || record.city} color={COLORS.text} textColor={COLORS.text} secondary={COLORS.secondary} isLong onCopy={() => copyContent(record.address || record.city, "Address")} />
                        </View>
                    </Animated.View>
                    ))}
                    <View style={{height: 100}} />
                </Animated.View>
            )}
            
            {notFound && <View style={[styles.errorBox, {borderColor: COLORS.secondary}]}><Text style={{color: COLORS.text}}>NO RECORD FOUND</Text></View>}
        </>
        ) : (
        <>
            <Animated.View entering={FadeInDown} style={{padding: 10}}>
                <View style={[styles.earningCard, {backgroundColor: COLORS.cardBg, borderColor: COLORS.primary}]}>
                    <View style={{alignItems:'center'}}>
                         <View style={{width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent:'center', alignItems:'center', marginBottom: 10}}>
                            <Text style={{fontSize: 24, fontWeight:'bold', color: '#000'}}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
                         </View>
                         <Text style={{color: COLORS.text, fontSize: 18, fontWeight:'bold'}}>{userName}</Text>
                         <Text style={{color: COLORS.secondary, fontSize: 12, marginBottom: 5}}>{isPremium ? 'SUPER USER' : 'Standard User'}</Text>
                         <Text style={{color: COLORS.primary, fontSize: 24, fontWeight:'900'}}>{isPremium ? '∞' : credits}</Text>
                         <Text style={{color: COLORS.secondary, fontSize: 10}}>CREDITS</Text>
                    </View>
                </View>

                {/* BANNER AD */}
                {!isPremium && (
                  <View style={{alignItems: 'center', marginVertical: 10}}>
                    <BannerAd
                      unitId={BANNER_AD_ID}
                      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                    />
                  </View>
                )}

                <Text style={styles.sectionTitle}>ACTIVATE PREMIUM</Text>
                <View style={[styles.glassContainer, {backgroundColor: COLORS.inputBg, flexDirection:'row', padding: 5}]}>
                    <View style={{justifyContent:'center', paddingLeft: 10}}>
                        <Key size={20} color={COLORS.primary} />
                    </View>
                    <TextInput 
                        style={[styles.input, {color: COLORS.text, paddingHorizontal: 10}]}
                        placeholder="Enter Super Key"
                        placeholderTextColor={COLORS.secondary}
                        value={keyInput}
                        onChangeText={setKeyInput}
                        secureTextEntry
                    />
                    <TouchableOpacity style={{backgroundColor: COLORS.primary, padding: 12, borderRadius: 15}} onPress={handleActivateKey}>
                        <ArrowRight size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>EARN & SHARE</Text>
                
                <TouchableOpacity style={[styles.optionBtn, {backgroundColor: COLORS.inputBg}]} onPress={generateInviteLink}>
                    <View style={[styles.iconBox, {backgroundColor: '#3b82f6'}]}>
                        <Share2 size={20} color="#fff" />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={{color: COLORS.text, fontWeight:'bold', fontSize: 16}}>Refer & Earn</Text>
                        <Text style={{color: COLORS.secondary, fontSize: 12}}>Get 10 credits per invite</Text>
                    </View>
                    <View style={{backgroundColor: COLORS.primary+'20', padding: 5, borderRadius: 5}}>
                         <Text style={{color: COLORS.primary, fontWeight:'bold'}}>+10 CR</Text>
                    </View>
                </TouchableOpacity>

                {!isPremium && (
                <TouchableOpacity style={[styles.optionBtn, {backgroundColor: COLORS.inputBg}]} onPress={handleShowAd}>
                    <View style={[styles.iconBox, {backgroundColor: '#f59e0b'}]}>
                        <Play size={20} color="#fff" fill="#fff" />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={{color: COLORS.text, fontWeight:'bold', fontSize: 16}}>Watch Ads</Text>
                        <Text style={{color: COLORS.secondary, fontSize: 12}}>
                           {adLoaded ? 'Ad Ready: Tap to earn 2 Credits' : 'Loading Ad...'}
                        </Text>
                    </View>
                    <View style={{backgroundColor: COLORS.primary+'20', padding: 5, borderRadius: 5}}>
                         <Text style={{color: COLORS.primary, fontWeight:'bold'}}>+2 CR</Text>
                    </View>
                </TouchableOpacity>
                )}

                {isPremium && (
                    <TouchableOpacity style={[styles.optionBtn, {backgroundColor: 'rgba(239, 68, 68, 0.2)', marginTop: 20}]} onPress={() => {
                        Alert.alert("Logout", "Reset Key?", [{text:"Cancel"}, {text:"Reset", onPress:async()=>{
                            await savePremium(false); setCredits(10); showToastMsg("Reset Done");
                        }}]);
                    }}>
                         <View style={[styles.iconBox, {backgroundColor: '#ef4444'}]}>
                            <LogOut size={20} color="#fff" />
                        </View>
                        <Text style={{color: '#ef4444', fontWeight:'bold', marginLeft: 10}}>Logout / Reset Key</Text>
                    </TouchableOpacity>
                )}
            </Animated.View>
        </>
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, {backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', borderColor: COLORS.secondary+'30'}]}>
          <TouchableOpacity style={[styles.navItem]} onPress={() => setCurrentTab('home')}>
              <Home size={24} color={currentTab === 'home' ? COLORS.primary : COLORS.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem]} onPress={() => setCurrentTab('settings')}>
              <Wallet size={24} color={currentTab === 'settings' ? COLORS.primary : COLORS.secondary} />
          </TouchableOpacity>
      </View>

      {/* MODALS */}
      <Modal visible={showNameModal} transparent animationType="slide">
          <BlurView intensity={90} tint="dark" style={{flex:1, justifyContent:'center', padding: 20}}>
              <View style={{backgroundColor: COLORS.cardBg, padding: 30, borderRadius: 25, alignItems:'center'}}>
                  <Text style={{fontSize: 22, color: COLORS.text, fontWeight:'bold', marginBottom: 10}}>Welcome</Text>
                  <TextInput 
                      style={{backgroundColor: COLORS.inputBg, width: '100%', padding: 15, borderRadius: 15, color: COLORS.text, textAlign:'center', fontSize: 18, marginBottom: 20}}
                      placeholder="Your Name"
                      placeholderTextColor={COLORS.secondary}
                      value={tempName}
                      onChangeText={setTempName}
                  />
                  <TouchableOpacity style={{backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 20}} onPress={handleSaveName}>
                      <Text style={{fontWeight:'bold', color:'#000'}}>START</Text>
                  </TouchableOpacity>
              </View>
          </BlurView>
      </Modal>

      <Modal visible={showUpdateModal} transparent animationType="slide" onRequestClose={() => { if(!isForceUpdate) handleUpdateAction('decline'); }}>
          <BlurView intensity={95} tint="dark" style={{flex:1, justifyContent:'center', padding: 30}}>
              <View style={{backgroundColor: COLORS.cardBg, padding: 25, borderRadius: 25, alignItems:'center', borderWidth: 1, borderColor: isForceUpdate ? '#ef4444' : COLORS.primary}}>
                  <DownloadCloud size={50} color={isForceUpdate ? "#ef4444" : COLORS.primary} />
                  <Text style={{fontSize: 22, color: COLORS.text, fontWeight:'bold', marginTop: 15, textAlign:'center'}}>
                      {isForceUpdate ? 'UPDATE REQUIRED' : 'UPDATE AVAILABLE'}
                  </Text>
                  <TouchableOpacity style={{backgroundColor: COLORS.primary, paddingVertical: 15, width: '100%', borderRadius: 15, alignItems:'center', marginTop:20}} onPress={() => handleUpdateAction('update')}>
                      <Text style={{fontWeight:'bold', color:'#000'}}>UPDATE NOW</Text>
                  </TouchableOpacity>
                  {!isForceUpdate && <TouchableOpacity onPress={() => handleUpdateAction('decline')} style={{padding: 10}}><Text style={{color: COLORS.secondary}}>Later</Text></TouchableOpacity>}
              </View>
          </BlurView>
      </Modal>

      <Modal visible={inviteModal} transparent animationType="fade">
          <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', padding: 30}}>
              <View style={{backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 20, alignItems:'center', borderWidth:1, borderColor: COLORS.primary}}>
                  <Gift size={50} color={COLORS.primary} />
                  <Text style={{color: COLORS.text, fontSize: 20, fontWeight:'bold'}}>INVITATION</Text>
                  <Text style={{color: COLORS.secondary, textAlign:'center', marginVertical: 10}}>From: {inviterName}</Text>
                  <TouchableOpacity onPress={() => { setCredits(credits+10); setInviteModal(false); }} style={{backgroundColor: COLORS.primary, padding: 15, borderRadius: 15, width:'100%', alignItems:'center'}}>
                      <Text style={{color: '#000', fontWeight:'bold'}}>ACCEPT (+10 CR)</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={showAdminPanel} animationType="slide" transparent>
          <View style={{flex:1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent:'center', padding: 20}}>
              <View style={{backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 20}}>
                  <Text style={{color: COLORS.text, fontSize: 20, fontWeight:'bold'}}>ADMIN KEYS</Text>
                  <TouchableOpacity style={[styles.findBtn, {backgroundColor: COLORS.primary}]} onPress={() => setGeneratedKeys([...generatedKeys, 'KEY-'+Math.floor(Math.random()*9000)])}>
                      <Text style={{fontWeight:'bold'}}>GENERATE</Text>
                  </TouchableOpacity>
                  <ScrollView style={{maxHeight: 200, marginTop: 10}}>{generatedKeys.map((k, i) => <Text key={i} style={{color: COLORS.text, fontWeight:'bold'}}>{k}</Text>)}</ScrollView>
                  <TouchableOpacity onPress={() => setShowAdminPanel(false)}><Text style={{color: 'red', marginTop:20}}>CLOSE</Text></TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={showToast} transparent animationType="fade">
         <View style={styles.toastContainer}>
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.toast}>
               <CheckCircle size={20} color={COLORS.primary} />
               <Text style={{color: COLORS.text, marginLeft: 10, fontWeight:'600'}}>{toastMsg}</Text>
            </BlurView>
         </View>
      </Modal>
    </View>
  );
}

const InfoRow = ({ icon: Icon, label, value, color, textColor, secondary, isLong, onCopy }) => (
  <View style={[styles.infoRow, {alignItems: isLong ? 'flex-start' : 'center', borderColor: secondary+'20'}]}>
     <View style={{width: 30, alignItems:'center', paddingTop: isLong ? 2 : 0}}><Icon size={20} color={secondary} /></View>
     <View style={{flex: 1, marginLeft: 10}}>
        <Text style={{color: secondary, fontSize: 10, fontWeight: 'bold'}}>{label}:</Text>
        <Text style={{color: color, fontSize: 16, fontWeight: '600', marginTop: 2}}>{value || 'N/A'}</Text>
     </View>
     <TouchableOpacity onPress={onCopy} style={{padding: 8, backgroundColor: secondary+'20', borderRadius: 8}}><Copy size={16} color={color} /></TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginTop: 20, marginBottom: 10, marginLeft: 5 },
  glassContainer: { borderRadius: 25, borderWidth: 1, padding: 20, marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  findBtn: { height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  resultCard: { borderRadius: 20, borderWidth: 1, marginBottom: 15, overflow: 'hidden' },
  cardContent: { padding: 20 },
  infoRow: { flexDirection: 'row', marginBottom: 12, borderBottomWidth: 1, paddingBottom: 12 },
  errorBox: { alignItems: 'center', padding: 30, borderRadius: 20, borderWidth: 1, borderStyle:'dashed' },
  earningCard: { padding: 30, borderRadius: 25, borderWidth: 1, alignItems:'center', marginBottom: 10 },
  optionBtn: { flexDirection: 'row', alignItems:'center', padding: 15, borderRadius: 15, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent:'center', alignItems:'center', marginRight: 15 },
  bottomNav: { position: 'absolute', bottom: 20, left: 40, right: 40, height: 65, borderRadius: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', borderWidth: 1, elevation: 10 },
  navItem: { alignItems: 'center', justifyContent:'center', height: '100%', width: 60 },
  toastContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 110 },
  toast: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, overflow: 'hidden' }
});

