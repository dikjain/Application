import { View, TouchableOpacity, Alert, StyleSheet, Dimensions, Text, Modal, ActivityIndicator } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { uploadAudio, isTodo } from '../utils/AudioUpload';
import { GenerateContent } from './(api)/extract.api';
import axios from 'axios';
import { AntDesign, MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import linearGradient, { LinearGradient } from "expo-linear-gradient"
import { useRouter, usePathname } from 'expo-router';
import * as Speech from 'expo-speech';
import { useFonts } from 'expo-font';

import Animated, { 
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolateColor,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const Page = () => {
  const [fontsLoaded] = useFonts({
    'Orbitron': require('../assets/Orbitron-Regular.ttf'),
  });

  const router = useRouter();
  const pathname = usePathname();
  const [recording, setRecording] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [latestContent, setLatestContent] = useState('');
  const [contentType, setContentType] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0: recognizing, 1: processing, 2: creating
  const webViewRef = useRef(null);

  const scale = useSharedValue(1);
  const pulseAnim = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const robotScale = useSharedValue(1);
  const popupScale = useSharedValue(1);
  const deleteScale = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      deleteScale.value = withSpring(1);
    } else {
      deleteScale.value = withSpring(0);
    }
  }, [isRecording]);

  useEffect(() => {
    if (showPopup) {
      popupScale.value = withSequence(
        withSpring(1.1),
        withSpring(1)
      );
    }
  }, [showPopup]);

  useEffect(() => {
    colorProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 24000 }),
        withTiming(0, { duration: 24000 })
      ),
      -1,
      true
    );

    if (isProcessing) {
      robotScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isProcessing]);

  const animatedRobotStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: robotScale.value }]
    };
  });

  const animatedDeleteStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: deleteScale.value }, {translateY: "-45%"}, {translateX: width <550 ? "220%" : "250%"}],
      opacity: deleteScale.value
    };
  });

  const animatedPopupStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: popupScale.value }]
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    const shadowColor = interpolateColor(
      colorProgress.value,
      [0, 0.2, 0.4, 0.6, 0.8, 1],
      isRecording ? [
        '#FF0000',
        '#FF1111', 
        '#FF2222',
        '#FF3333',
        '#FF4444',
        '#FF0000'
      ] : [
        '#FF1493',
        '#00FF00',
        '#FF00FF',
        '#00FFFF',
        '#FFFF00', 
        '#FF1493'
      ]
    );

    return {
      backgroundColor: '#000000',
      borderColor: shadowColor,
      shadowColor: shadowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 6,
    };
  });

  const animatedUnderlineStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 0.2, 0.4, 0.6, 0.8, 1],
      isRecording ? [
        '#FF0000',
        '#FF1111', 
        '#FF2222',
        '#FF3333',
        '#FF4444',
        '#FF0000'
      ] : [
        '#FF1493',
        '#00FF00',
        '#FF00FF',
        '#00FFFF',
        '#FFFF00', 
        '#FF1493'
      ]
        );

    return {
      height: 2,
      width: '100%',
      backgroundColor,
      marginTop: 4,
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 0.2, 0.4, 0.6, 0.8, 1],
      isRecording ? [
        '#FF0000',
        '#FF1111', 
        '#FF2222',
        '#FF3333',
        '#FF4444',
        '#FF0000'
      ] : [
        '#FF1493',
        '#00FF00',
        '#FF00FF',
        '#00FFFF',
        '#FFFF00', 
        '#FF1493'
      ]
    );

    return {
      backgroundColor,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      zIndex: 0,
      borderRadius: 30,
    };
  });

  const startListening = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable microphone access.');
        return;
      }

      if (recording) {
        await stopListening();
      }

      scale.value = withSpring(1.2);
      setIsRecording(true);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
      setIsRecording(false);
    }
  };

  const stopListening = async () => {
    if (!recording) return;

    try {
      setTimeout(()=>{
              Speech.speak("ok, wait a second !!!", {
                language: 'en-US',
                voice: 'com.apple.ttsbundle.Karen-compact', // iOS example
                rate: 0.8,
                pitch: 30,
              });
      },1000)

      scale.value = withSpring(1);
      setIsRecording(false);
      setIsProcessing(true);
      setProcessingStep(0); // Start with recognizing
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (!uri) {
        throw new Error('Recording URI is undefined');
      }

      const finalUrl = await uploadAudio(uri);
      if (finalUrl) {
        setAudioUrl(finalUrl);
      }

      setProcessingStep(1); // Move to processing

      const response = await axios.post('http://192.168.29.175:3000/extract', {
        audioUrl: finalUrl || '',
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }
      const transcript = response.data.transcript;
      setTranscription(transcript);
      const isTodoHere = await isTodo(transcript);

      setProcessingStep(2); // Move to creating

      Speech.speak(`I've created a ${isTodoHere ? "todo" : "note"} for you`, {
        language: 'en-US',
        voice: 'com.apple.ttsbundle.Karen-compact',
        rate: 0.8,
        pitch: 30,
      });

      await GenerateContent(isTodoHere, transcript);
      
      setContentType(isTodoHere ? 'todo' : 'note');
      setLatestContent(transcript);
      setIsProcessing(false);
      setShowPopup(true);

    } catch (error) {
      console.error('Error stopping recording:', error);
      Speech.speak("I encountered an error while processing your request", {
        language: 'en-US',
        voice: 'com.apple.ttsbundle.Karen-compact',
        rate: 0.8,
        pitch: 30,
      });
      Alert.alert('Error', 'Failed to stop recording.');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const handlePopupClick = () => {
    setShowPopup(false);
    router.push(contentType === 'todo' ? '/todo/yes/List' : '/note/yes/List');
  };

  const handleNavigation = (route) => {
    setShowPopup(false);
    router.push(route);
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#00FFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://my.spline.design/flow-0001acc3f759cbecab9b3e10ab2368f2/' }}
        style={styles.splineBackground}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      
      { isProcessing && (
        <View style={styles.processingOverlay}>
          <Animated.View style={[styles.robotContainer, animatedRobotStyle]}>
            <MaterialIcons name="smart-toy" size={60} color="#00FFFF" />
            <View style={styles.processingSteps}>
              <View style={styles.stepContainer}>
                <Feather 
                  name={processingStep >= 0 ? "check-circle" : "circle"} 
                  size={24} 
                  color={processingStep >= 0 ? "#00FF00" : "#666"}
                />
                <Text style={[styles.stepText, {color: processingStep >= 0 ? "#00FF00" : "#666"}]}>
                  Recognizing Speech
                </Text>
              </View>
              <View style={styles.stepContainer}>
                <Feather 
                  name={processingStep >= 1 ? "check-circle" : "circle"} 
                  size={24} 
                  color={processingStep >= 1 ? "#00FF00" : "#666"}
                />
                <Text style={[styles.stepText, {color: processingStep >= 1 ? "#00FF00" : "#666"}]}>
                  Processing Data
                </Text>
              </View>
              <View style={styles.stepContainer}>
                <Feather 
                  name={processingStep >= 2 ? "check-circle" : "circle"} 
                  size={24} 
                  color={processingStep >= 2 ? "#00FF00" : "#666"}
                />
                <Text style={[styles.stepText, {color: processingStep >= 2 ? "#00FF00" : "#666"}]}>
                  Creating {contentType || 'Note/Todo'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      )}

      {showPopup && latestContent && (
        <Animated.View 
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.springify().damping(15)}
          style={[styles.popup, animatedPopupStyle]}
        >
          <LinearGradient
            colors={['#000000', '#1a1a1a']}
            style={styles.popupGradient}
          >
            <TouchableOpacity 
              style={styles.popupContent}
              onPress={handlePopupClick}
              activeOpacity={0.8}
            >
              <Text style={[styles.popupTitle, {fontFamily: 'Orbitron', textShadow: '0 0 10px #00FFFF'}]}>
                New {contentType} Added!
              </Text>
              <Text style={[styles.popupText, {fontFamily: 'Orbitron'}]}>
                {latestContent}
              </Text>
              <View style={styles.popupBorder} />
              <Text style={[styles.popupHint, {fontFamily: 'Orbitron'}]}>
                Tap to view in {contentType} list
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.navButton, {
            backgroundColor: '#000000',
            borderWidth: 2,
            borderColor: '#00ff00',
            shadowColor: '#00ff00',
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 5
          }]}
          onPress={() => handleNavigation('/todo/no/List')}
        >
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={[styles.buttonText, {fontFamily: 'Orbitron', marginRight: 5}]}>Todos</Text>
            <AntDesign name="arrowright" style={{transform: [{rotate: '-30deg'}]}} size={20} color="#fff"  borderColor="#00ff00" borderWidth={2} borderRadius={20} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, {
            backgroundColor: '#000000',
            borderWidth: 2,
            borderColor: '#00ffff',
            shadowColor: '#00ffff',
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 5
          }]}
          onPress={() => handleNavigation('/note/no/List')}
        >
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={[styles.buttonText, {fontFamily: 'Orbitron', marginRight: 5}]}>Notes</Text>
            <AntDesign name="arrowright" style={{transform: [{rotate: '-30deg'}]}} size={20} color="#fff"  borderColor="#00ffff" borderWidth={2} borderRadius={20} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.recordingControls}>
        <TouchableOpacity style={styles.Other} activeOpacity={0.7} onPress={isRecording ? stopListening : startListening}>
          <Animated.View style={[styles.button, animatedButtonStyle]}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <MaterialCommunityIcons 
                name={isRecording ? "microphone-off" : "microphone"} 
                size={24} 
                color="#E2E8F0" 
                style={{marginRight: 8}}
              />
              <Text style={[styles.text, {fontFamily: 'Orbitron'}]}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </View>
            <Animated.View style={animatedUnderlineStyle} />
          </Animated.View>
          <Animated.View style={[animatedBackgroundStyle,{transform: [{translateY: 0}, {translateX: -2}]}]}>
          </Animated.View>
          <Animated.View style={[animatedBackgroundStyle,{transform: [{translateY: 0}, {translateX: 2}]}]}>
          </Animated.View>
        </TouchableOpacity>

        {isRecording && (
          <Animated.View style={[styles.deleteButton, animatedDeleteStyle]}>
            <TouchableOpacity onPress={async () => {
              try {
                if (recording) {
                  await recording.stopAndUnloadAsync();
                  setRecording(null);
                }
                setIsRecording(false);
                Speech.speak("Recording cancelled", {
                  language: 'en-US',
                  pitch: 0.9,
                  rate: 0.9,
                  voice: "com.apple.ttsbundle.Samantha-compact",
                });
              } catch (error) {
                console.error('Error cancelling recording:', error);
                Alert.alert('Error', 'Failed to cancel recording.');
              }
            }}>
              <MaterialCommunityIcons 
                name="delete" 
                size={30} 
                color="#FF0000"
                style={{
                  shadowColor: '#FF0000',
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                }}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  Other:{
    position: 'absolute',
    top: '70%',
    transform: [{ translateX: "-50%" }, { translateY: -50 }],
    left: '50%',
  },
  button: {
    zIndex: 50,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  text: {
    color: '#E2E8F0',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent'
  },
  splineBackground: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    pointerEvents: 'none',
    height: height,
    zIndex: 400,
    transform: [ {scale : width > 600 ? 1.5 : 1}]
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: "-50%" }],
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 340,
    zIndex: 500,
  },
  navButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  popup: {
    position: 'absolute',
    bottom: '40%',
    left: '10%',
    right: '10%',
    borderRadius: 20,
    zIndex: 1000,
    // overflow: 'hidden',
    shadowColor: '#00FFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  popupGradient: {
    borderRadius: 20,
    padding: 2,
    borderWidth: 2,
    borderColor: '#00FFFF',
  },
  popupContent: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 18,
  },
  popupBorder: {
    height: 2,
    backgroundColor: '#00FFFF',
    marginVertical: 10,
    boxShadow: '0 0 10px #00FFFF',
  },
  popupTitle: {
    color: '#00FFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  popupText: {
    color: '#E2E8F0',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  popupHint: {
    color: '#00FFFF',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  robotContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  processingSteps: {
    marginTop: 20,
    width: '100%',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  stepText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Orbitron',
  },
  recordingControls: {
    position: 'absolute',
    top: '70%',
    left: '50%',
    transform: [{ translateX: "-50%" }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  deleteButton: {
    position: 'absolute',
    transform : [{translateY : "-100%"}],
    left: '50%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF0000',
  }
});

export default Page;
