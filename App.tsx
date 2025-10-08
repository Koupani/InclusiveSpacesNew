import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, PermissionsAndroid, Platform, Text, ScrollView, Alert, Button, TouchableOpacity, Modal,
  Animated, PanResponder, Dimensions, Vibration, TextInput, ActivityIndicator, Linking
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region, Polyline, Callout, Circle } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { Picker } from '@react-native-picker/picker';
import { allNodesPenteli, Node } from './allNodesPenteli';
import { allNodesHamburg } from './allNodesHamburg';
import { calculateRoute, submitFeedback } from './api/api';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { nodeNameMappingsPenteli } from './nodeNameMappingsPenteli';
import { nodeNameMappingsHamburg } from './nodeNameMappingsHamburg';
import Tts from 'react-native-tts';
import FullScreenAutocomplete from './autoCompletePicker';
import styles from './styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7; // 70% of screen height
const DEFAULT_DRAWER_HEIGHT = SCREEN_HEIGHT * 0.3; // Default height when opened
// Initialize TTS
Tts.setDefaultLanguage('el-GR'); // Set language to Greek
Tts.setDefaultRate(0.5); // Adjust speech rate (0.1 to 1.0)

interface StudyArea {
  id: string;
  name: string;
  center: Coordinate;
  initialDelta: {
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

const studyAreas: StudyArea[] = [
  {
    id: 'penteli',
    name: 'penteliAthens',
    center: { latitude: 38.0428, longitude: 23.8644 },
    initialDelta: { latitudeDelta: 0.05, longitudeDelta: 0.05 }
  },
  {
    id: 'hamburg',
    name: 'hamburg',
    center: { latitude: 53.575803, longitude: 10.048819 },
    initialDelta: { latitudeDelta: 0.05, longitudeDelta: 0.05 }
  }
];

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteResponse {
  path: number[][]; // The main path as a list of edges
  alternative_path: number[][]; // The alternative path as a list of edges
  inaccessible_edges: number[][]; // List of inaccessible edges in the alternative path
  second_alternative_path: number[][]; // The second alternative path as a list of edges
  inaccessible_edges_model3: number[][]; // List of inaccessible edges in the second alternative path
  start_node: number; // ID of the start node
  end_node: number; // ID of the end node
  total_distance: number | null; // Total distance of the main path
  total_distance_alternative: number | null; // Total distance of the alternative path
  total_distance_second_alternative: number | null; // Total distance of the second alternative path
  total_time: number | null; // Total time of the main path
  total_time_alternative: number | null; // Total time of the alternative path
  total_time_second_alternative: number | null; // Total time of the second alternative path
  smooth_path?: Coordinate[]; // Optional smoothed path as a list of coordinates
  obstacles: { [key: string]: string[] }; // Obstacles for the alternative path
  obstacles_model3: { [key: string]: string[] }; // Obstacles for the second alternative path
}

const ttsLanguageMap = {
  el: 'el-GR', // Greek
  en: 'en-US', // English (US)
  de: 'de-DE', // German (Germany)
};

// Initialize TTS
Tts.setDefaultLanguage(ttsLanguageMap['el']); // Default to Greek
Tts.setDefaultRate(0.5); // Adjust speech rate (0.1 to 1.0)

export default function App() {
  // const initialRegion: Region = {
  //   latitude: 38.0428,
  //   longitude: 23.8644,
  //   latitudeDelta: 0.05,
  //   longitudeDelta: 0.05,
  // };

  const [selectedStudyArea, setSelectedStudyArea] = useState<StudyArea | null>(null);

  const initialRegion: Region = selectedStudyArea ? {
    latitude: selectedStudyArea.center.latitude,
    longitude: selectedStudyArea.center.longitude,
    latitudeDelta: selectedStudyArea.initialDelta.latitudeDelta,
    longitudeDelta: selectedStudyArea.initialDelta.longitudeDelta,
  } : {
    latitude: 38.0428, // Default to Penteli if no area selected
    longitude: 23.8644,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const mapRef = useRef<MapView | null>(null)
  const [location, setLocation] = useState<Region>(initialRegion);
  const [startPoint, setStartPoint] = useState<Coordinate | null>(null);
  const [endPoint, setEndPoint] = useState<Coordinate | null>(null);
  const [selectedStartNode, setSelectedStartNode] = useState<number | null>(null);
  const [selectedEndNode, setSelectedEndNode] = useState<number | null>(null);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [showAlternativePath, setShowAlternativePath] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [mode, setMode] = useState<string>('pedestrian');
  // const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState('en'); // Default language is English
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [selectedObstacle, setSelectedObstacle] = useState<string[] | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const drawerHeight = useRef(new Animated.Value(0)).current; // Initial height of the drawer
  // Add these to your existing state declarations
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [watchId, setWatchId] = useState<number | null>(null);
  // Add to your existing state declarations
  const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);
  const [nextInstruction, setNextInstruction] = useState<string | null>(null);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [navigationSteps, setNavigationSteps] = useState<Array<{ instruction: string; distance: number }>>([]);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [activeAutocomplete, setActiveAutocomplete] = useState<'start' | 'end' | null>(null);
  const [startSearchText, setStartSearchText] = useState('');
  const [endSearchText, setEndSearchText] = useState('');
  const [currentDrawerHeight, setCurrentDrawerHeight] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(true); // Show location picker on startup
  const [interfaceRating, setInterfaceRating] = useState(0);
  const [navigationRating, setNavigationRating] = useState(0);
  const [challengesText, setChallengesText] = useState('');
  const [currentNodeData, setCurrentNodeData] = useState<Node[]>([]); // Add fallback to empty array
  const [ttsReady, setTtsReady] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showTalkbackModal, setShowTalkbackModal] = useState(false);

  useEffect(() => {
    if (showLocationPicker) {
      // Announce when the modal opens
      speakAccessibilityInfo(t('selectStudyArea'));
    }
  }, [showLocationPicker, t]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } else {
        getCurrentLocation();
      }
    };

    const getCurrentLocation = (retryCount = 0) => {
      const maxRetries = 3;
      setIsLocationLoading(true);
      setLocationError(null);

      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setLocation(prev => ({
            ...prev,
            latitude,
            longitude,
          }));
          setUserLocation({ latitude, longitude });
          setIsLocationLoading(false);
        },
        error => {
          console.log('Location error:', error);
          if (retryCount < maxRetries) {
            setTimeout(() => getCurrentLocation(retryCount + 1), 2000);
          } else {
            setLocationError(t('locationError'));
            setIsLocationLoading(false);

            // Provide feedback to user
            if (mode === 'visuallyImpaired') {
              speakAccessibilityInfo(t('locationError'));
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // 15 seconds timeout
          maximumAge: 10000
        }
      );
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    let watchId: number | null = null;

    const id = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      error => console.log(error),
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 1000,
        fastestInterval: 1000
      }
    );

    watchId = id;

    return () => {
      if (watchId) Geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (selectedStartNode !== null) {
      // const node = currentNodeData.find((n): n is Node => n.id === selectedStartNode);
      const node = currentNodeData.find((n) => {
        return n && typeof n === 'object' && 'id' in n && n.id === selectedStartNode;
      });
      if (node) {
        setStartPoint({ latitude: node.coords[0], longitude: node.coords[1] });
      }
    }
  }, [selectedStartNode]);

  useEffect(() => {
    if (selectedEndNode !== null) {
      // const node = currentNodeData.find((n): n is Node => n.id === selectedEndNode);
      const node = currentNodeData.find((n) => {
        return n && typeof n === 'object' && 'id' in n && n.id === selectedEndNode;
      });
      if (node) {
        setEndPoint({ latitude: node.coords[0], longitude: node.coords[1] });
      }
    }
  }, [selectedEndNode]);

  useEffect(() => {
    if (routeData && mapRef.current) {
      const pathCoordinates = showAlternativePath
        ? routeData.alternative_path && routeData.alternative_path.length > 0
          ? getCoordinatesFromPath(routeData.alternative_path)
          : routeData.second_alternative_path && routeData.second_alternative_path.length > 0
            ? getCoordinatesFromPath(routeData.second_alternative_path)
            : [] // Fallback to empty array if no alternative or second alternative path
        : routeData.smooth_path && routeData.smooth_path.length > 0
          ? routeData.smooth_path
          : getCoordinatesFromPath(routeData.path);

      if (pathCoordinates.length > 0) {
        mapRef.current.fitToCoordinates(pathCoordinates, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      }
    }
  }, [routeData, showAlternativePath]);

  // Automatically calculate route when start, end, or mode changes
  useEffect(() => {
    const handleFindPath = async () => {
      if (!selectedStartNode || !selectedEndNode) {
        return; // Do nothing if start or end node is not selected
      }
      setIsCalculatingRoute(true);
      try {
        const data = await calculateRoute(selectedStartNode, selectedEndNode, mode, selectedStudyArea?.id || 'penteli');
        if (data && data.path) {
          setRouteData(data);
          setShowAlternativePath(false); // Reset to default path when new route is calculated

          // Announce the alternative route message only in visuallyImpaired mode
          if (mode === 'visuallyImpaired') {
            setTimeout(() => {
              if (data.alternative_path.length > 0) {
                speakAccessibilityInfo(t('alternativeRouteSpeech'));
                handleButtonPressNotification();
              } else if (data.second_alternative_path.length > 0) {
                speakAccessibilityInfo(t('noAccessibleRoute'));
                handleButtonPressNotification();
              }
            }, 6000); // 3 second delay after endpoint announcement
          }
        } else {
          Alert.alert('Error', 'No path found.');
        }
      } finally {
        setIsCalculatingRoute(false); // End loading
      }
    };

    handleFindPath();
  }, [selectedStartNode, selectedEndNode, mode]);

  // const getCoordinatesFromPath = (path: number[][]): Coordinate[] => {
  //   if (!path || path.length === 0) {
  //     return []; // Return an empty array if the path is undefined or empty
  //   }
  //   const uniqueNodeIds = new Set<number>();
  //   path.forEach(([startNode, endNode]) => {
  //     uniqueNodeIds.add(startNode);
  //     uniqueNodeIds.add(endNode);
  //   });
  //   return Array.from(uniqueNodeIds)
  //     .map((nodeId) => {
  //       const node = currentNodeData.find((n) => n.id === nodeId);
  //       return node ? { latitude: node.coords[0], longitude: node.coords[1] } : null;
  //     })
  //     .filter((coord): coord is Coordinate => coord !== null);
  // };

  const getCoordinatesFromPath = (path: number[][]): Coordinate[] => {
    if (!path || path.length === 0) return [];

    const coordinates: Coordinate[] = [];
    const visitedNodes = new Set<number>();

    // Process each segment in the path
    path.forEach(([startId, endId]) => {
      const startNode = currentNodeData.find((n) => n && typeof n === 'object' && n.id === startId);
      const endNode = currentNodeData.find((n) => n && typeof n === 'object' && n.id === endId);

      if (startNode && endNode) {
        // Only add start node if we haven't visited it yet
        if (!visitedNodes.has(startId)) {
          coordinates.push({
            latitude: startNode.coords[0],
            longitude: startNode.coords[1]
          });
          visitedNodes.add(startId);
        }

        // Always add the end node
        coordinates.push({
          latitude: endNode.coords[0],
          longitude: endNode.coords[1]
        });
        visitedNodes.add(endId);
      }
    });

    // Remove duplicate consecutive coordinates
    return coordinates.filter((coord, index) => {
      if (index === 0) return true;
      const prevCoord = coordinates[index - 1];
      return !(coord.latitude === prevCoord.latitude &&
        coord.longitude === prevCoord.longitude);
    });
  };
  const getNodeName = (nodeId: number, language: string): string => {
    const nodeNameMappings = selectedStudyArea?.id === 'hamburg'
      ? nodeNameMappingsHamburg
      : nodeNameMappingsPenteli;
    const namedNodes = currentNodeData.filter(node => node.name.trim() !== " ");
    const node = namedNodes.find((n) => n.id === nodeId);
    if (!node || node.name.trim() === " ") return "";

    if (language === 'el') {
      return node.name; // Return the original Greek name
    } else if (language === 'en' || language === 'de') {
      return nodeNameMappings[nodeId]?.[language] || node.name; // Return the mapped name or the original if no mapping exists
    } else {
      return node.name; // Fallback to the original name for any other language
    }
  };

  const formatTime = (seconds: number): string => {
    const totalMinutes = Math.round(seconds / 60); // Convert seconds to minutes
    if (totalMinutes < 60) {
      return `${totalMinutes} ${t('min')}`; // Show minutes only
    }
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs} ${t('hr')} ${mins} ${t('min')}` : `${hrs} ${t('hr')}`; // Format hours and minutes
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} ${t('m')}`;
    }
    const km = Math.floor(meters / 1000);
    const m = Math.round(meters % 1000);
    return m > 0 ? `${km} ${t('km')} ${m} ${t('m')}` : `${km} ${t('km')}`;
  };

  // Function to reverse start and end points
  const reverseStartAndEnd = () => {
    const temp = selectedStartNode;
    setSelectedStartNode(selectedEndNode);
    setSelectedEndNode(temp);
  };

  // Function to handle filter button press
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const openAccessibilitySettings = async () => {
    try {
      if (Platform.OS === 'android') {
        // For Android - open accessibility settings directly
        await Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS');
      } else {
        // For iOS - open general settings (no direct accessibility link available)
        await Linking.openURL('app-settings:');
      }
    } catch (error) {
      console.error('Error opening accessibility settings:', error);
      // Fallback to regular settings if direct access fails
      try {
        await Linking.openSettings();
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        Alert.alert(
          t('error'),
          t('cannotOpenSettings')
        );
      }
    }
  };

  // Function to handle filter selection
  const handleFilterSelection = (filterType: string) => {
    console.log(`Selected filter: ${filterType}`);
    setMode(filterType);
    setShowFilters(false);

    // Show TalkBack suggestion modal when switching to visually impaired mode
    if (filterType === 'visuallyImpaired') {
      setShowTalkbackModal(true);
      speakAccessibilityInfo(t('talkbackSuggestion'));
    }

    // Speak mode change confirmation
    if (filterType === 'pedestrian') {
      speakAccessibilityInfo(t('pedestrianModeEnabled'));
    } else if (filterType === 'mobilityImpaired') {
      speakAccessibilityInfo(t('mobilityModeEnabled'));
    }

    handleButtonPress();
  };

  // Check if all paths are empty
  const noPathFound =
    routeData &&
    Array.isArray(routeData.path) && routeData.path.length === 0 &&
    Array.isArray(routeData.alternative_path) && routeData.alternative_path.length === 0 &&
    Array.isArray(routeData.second_alternative_path) && routeData.second_alternative_path.length === 0;

  // Update your TTS initialization code
  useEffect(() => {
    const initializeTTS = async () => {
      try {
        // First check if already initialized
        try {
          const status = await Tts.getInitStatus();
          if (status === 'success') {
            setTtsReady(true);
            return;
          }
        } catch (e) {
          console.log('TTS not initialized yet');
        }

        // Initialize with default settings
        try {
          await Promise.all([
            Tts.setDefaultLanguage(ttsLanguageMap.el),
            Tts.setDefaultRate(0.5)
          ]);
          setTtsReady(true);
        } catch (error) {
          console.error('TTS initialization error:', error);
          // Retry after delay
          setTimeout(initializeTTS, 1000);
        }
      } catch (error) {
        console.error('TTS initialization failed:', error);
      }
    };

    initializeTTS();

    return () => {
      Tts.stop();
    };
  }, []);

  const speakAccessibilityInfo = async (label: string, hint: string = '') => {
    if (!ttsReady) {
      // console.warn('TTS not ready - skipping speech');
      return;
    }

    try {
      await Tts.stop();
      if (label) {
        try {
          await Tts.speak(label);
        } catch (speakError) {
          console.error('Failed to speak label:', speakError);
        }
      }
      if (hint) {
        setTimeout(async () => {
          if (ttsReady) {
            try {
              await Tts.speak(hint);
            } catch (hintError) {
              console.error('Failed to speak hint:', hintError);
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  useEffect(() => {
    // Set TTS language on app start
    const ttsLanguage = ttsLanguageMap[language as 'el' | 'en' | 'de'];
    Tts.setDefaultLanguage(ttsLanguage);
  }, [language]); // Re-run when the language changes

  // Function to change language
  const changeLanguage = async (lng: 'el' | 'en' | 'de') => {
    try {
      await i18n.changeLanguage(lng);
      setLanguage(lng);
      setIsLanguageMenuOpen(false);

      // Update TTS language only when ready
      if (ttsReady) {
        try {
          await Tts.setDefaultLanguage(ttsLanguageMap[lng]);
        } catch (error) {
          console.error('Failed to set TTS language:', error);
        }
      }
    } catch (err) {
      console.error('Error changing language:', err);
    }
  };

  // Function to get coordinates for obstacles
  const getObstacleCoordinates = (edges: number[][]) => {
    return edges.map(([startNode, endNode]) => {
      // const startNodeData = currentNodeData.find((n) => n.id === startNode);
      const startNodeData = currentNodeData.find((n) => n && typeof n === 'object' && n.id === startNode);
      // const endNodeData = currentNodeData.find((n) => n.id === endNode);
      const endNodeData = currentNodeData.find((n) => n && typeof n === 'object' && n.id === endNode);
      if (startNodeData && endNodeData) {
        const midLat = (startNodeData.coords[0] + endNodeData.coords[0]) / 2;
        const midLng = (startNodeData.coords[1] + endNodeData.coords[1]) / 2;
        return { latitude: midLat, longitude: midLng, edge: [startNode, endNode] };
      }
      return null;
    }).filter((coord): coord is { latitude: number; longitude: number; edge: number[] } => coord !== null);
  };

  // Get obstacle coordinates and reasons
  const obstacleCoordinates = showAlternativePath
    ? routeData?.alternative_path && routeData.alternative_path.length > 0
      ? getObstacleCoordinates(routeData.inaccessible_edges)
      : routeData?.second_alternative_path && routeData.second_alternative_path.length > 0
        ? getObstacleCoordinates(routeData.inaccessible_edges_model3)
        : []
    : [];

  const obstacleReasons = showAlternativePath
    ? routeData?.alternative_path && routeData.alternative_path.length > 0
      ? routeData.obstacles
      : routeData?.second_alternative_path && routeData.second_alternative_path.length > 0
        ? routeData.obstacles_model3
        : {}
    : {};

  const toggleAlternativePath = () => {
    setShowAlternativePath(prev => {
      const newValue = !prev;
      if (routeData) {
        updateRouteDirections(); // Recalculate for new path
      }
      return newValue;
    });
  };

  const centerMapToCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        mapRef.current?.animateToRegion(region, 1000); // Animate to the current location
      },
      error => console.log(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const resetMapRotation = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera(
        {
          heading: 0, // Reset rotation so that north is at the top
        },
        { duration: 500 } // Optional: Animation duration in milliseconds
      );
    }
  };

  // Add this effect to track the height
  useEffect(() => {
    const listenerId = drawerHeight.addListener(({ value }) => {
      setCurrentDrawerHeight(value);
    });

    return () => {
      drawerHeight.removeListener(listenerId);
    };
  }, []);

  // Open the drawer when routeData is available
  useEffect(() => {
    if (routeData) {
      setIsDrawerVisible(true);
      updateRouteDirections();
      Animated.spring(drawerHeight, {
        toValue: DEFAULT_DRAWER_HEIGHT, // Default height when drawer opens
        useNativeDriver: false,
      }).start();
    }
  }, [routeData]);

  // Close the drawer and reset state
  const closeDrawer = () => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }
    setIsNavigating(false);
    setWatchId(null);
    setCurrentInstruction(null);
    setNextInstruction(null);
    setDistanceToNextStep(null);
    setNavigationSteps([]);
    setCurrentInstruction(null);

    const studyAreaToReset = selectedStudyArea; // store current value in a local var

    Animated.spring(drawerHeight, {
      toValue: 0,
      useNativeDriver: false,
    }).start(() => {
      setIsDrawerVisible(false);
      setRouteData(null);
      setShowAlternativePath(false);
      setSelectedStartNode(null);
      setSelectedEndNode(null);
      setMode('pedestrian');
      // resetMapView(studyAreaToReset);
    });

    if (mode === 'visuallyImpaired') {
      if (isNavigating) {
        speakAccessibilityInfo(t('navigationStopped'));
      } else {
        speakAccessibilityInfo(t('cancelRoute'));
      }
    }
  };


  // PanResponder for dragging the drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(
          100, // Minimum height
          Math.min(MAX_DRAWER_HEIGHT, -gestureState.dy + currentDrawerHeight)
        );
        drawerHeight.setValue(newHeight);
      },
      //     onPanResponderRelease: (_, gestureState) => {
      //       // Snap the drawer to either a minimized or expanded state
      //       const snapHeight = gestureState.vy < 0 ? SCREEN_HEIGHT * 0.3 : 100;
      //       Animated.spring(drawerHeight, {
      //         toValue: snapHeight,
      //         useNativeDriver: false,
      //       }).start();
      //     },
      //   })
      // ).current;
      onPanResponderRelease: (_, gestureState) => {
        let snapHeight;
        if (gestureState.vy < -0.5) { // Swiping up fast
          snapHeight = MAX_DRAWER_HEIGHT;
        } else if (gestureState.vy > 0.5) { // Swiping down fast
          snapHeight = 100;
        } else {
          // Use the tracked height from state
          if (currentDrawerHeight > MAX_DRAWER_HEIGHT * 0.6) {
            snapHeight = MAX_DRAWER_HEIGHT;
          } else if (currentDrawerHeight > DEFAULT_DRAWER_HEIGHT * 0.7) {
            snapHeight = DEFAULT_DRAWER_HEIGHT;
          } else {
            snapHeight = 100;
          }
        }

        Animated.spring(drawerHeight, {
          toValue: snapHeight,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const handleButtonPress = () => {
    Vibration.vibrate(200);
  };

  const handleButtonPressNotification = () => {
    Vibration.vibrate(500);
  };

  useEffect(() => {
    if (routeData) {
      const steps = generateAllNavigationSteps(routeData, showAlternativePath);
      setNavigationSteps(steps);
      setCurrentStepIndex(0); // Reset to first step
    }
  }, [routeData, showAlternativePath]);

  const updateRouteDirections = () => {
    if (!routeData) {
      setNavigationSteps([]);
      setCurrentInstruction(t('noRouteFound'));
      return;
    }

    // 1. Generate path coordinates based on current selection
    const pathCoordinates = showAlternativePath
      ? routeData.alternative_path?.length
        ? getCoordinatesFromPath(routeData.alternative_path)
        : getCoordinatesFromPath(routeData.second_alternative_path)
      : routeData.smooth_path ?? getCoordinatesFromPath(routeData.path);

    // 2. Pre-calculate all navigation steps
    const steps = [];
    if (pathCoordinates.length > 1) {
      for (let i = 0; i < pathCoordinates.length - 1; i++) {
        const start = pathCoordinates[i];
        const end = pathCoordinates[i + 1];
        const distance = calculateDistance(start, end);
        const bearing = calculateBearing(start, end);

        steps.push({
          instruction: getDirectionInstruction(bearing, distance),
          distance: distance
        });
      }
      steps.push({ instruction: t('youHaveArrived'), distance: 0 });
    }

    setNavigationSteps(steps);
    setCurrentStepIndex(0);
    setCurrentInstruction(steps[0]?.instruction || '');
    setNextInstruction(steps[1]?.instruction || null);
  };

  const generateAllNavigationSteps = (data: RouteResponse, showAlt: boolean): Array<{ instruction: string; distance: number }> => {
    const pathCoordinates = showAlt
      ? data.alternative_path?.length
        ? getCoordinatesFromPath(data.alternative_path)
        : getCoordinatesFromPath(data.second_alternative_path)
      : data.smooth_path ?? getCoordinatesFromPath(data.path);

    const steps = [];
    let combinedDistance = 0;
    let lastInstructionType: 'straight' | 'turn' | null = null;
    let lastBearing: number | null = null;

    // Generate instruction for each segment
    for (let i = 0; i < pathCoordinates.length - 1; i++) {
      const start = pathCoordinates[i];
      const end = pathCoordinates[i + 1];
      const distance = calculateDistance(start, end);
      const bearing = calculateBearing(start, end);

      // Determine if this is a straight segment
      const isStraight = (bearing >= 225 || bearing < 135); // Same bearing check as getDirectionInstruction

      if (isStraight && lastInstructionType === 'straight') {
        // Combine with previous straight instruction
        combinedDistance += distance;
        // Update the last step with combined distance
        steps[steps.length - 1] = {
          instruction: getDirectionInstruction(lastBearing!, combinedDistance),
          distance: combinedDistance
        };
      } else {
        // Add as new step
        combinedDistance = distance;
        steps.push({
          instruction: getDirectionInstruction(bearing, distance),
          distance: distance
        });
        lastInstructionType = isStraight ? 'straight' : 'turn';
        lastBearing = bearing;
      }
    }

    // Add arrival instruction
    steps.push({
      instruction: t('youHaveArrived'),
      distance: 0
    });

    return steps;
  };

  const startNavigation = () => {
    if (!routeData || !userLocation) return;

    setIsNavigating(true);

    // Set initial instruction
    setCurrentInstruction(t('navigationStarted'));
    if (mode === 'visuallyImpaired') {
      speakAccessibilityInfo(t('navigationStarted'));
    }

    // Start watching the user's location
    const id = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const newUserLocation = { latitude, longitude };
        setUserLocation(newUserLocation);

        // Update the map to follow the user
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);

        // Provide navigation instructions
        provideNavigationInstructions(newUserLocation);
      },
      error => console.log(error),
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 1000,
        fastestInterval: 1000
      }
    );

    setWatchId(id);
  };

  const provideNavigationInstructions = (currentLocation: Coordinate) => {
    if (!routeData || navigationSteps.length === 0 || !endPoint) {
      setCurrentInstruction(t('noDirectionsAvailable'));
      if (mode === 'visuallyImpaired') {
        speakAccessibilityInfo(t('noDirectionsAvailable'));
      }
      return;
    }

    // Get the current path coordinates
    const pathCoordinates = showAlternativePath
      ? routeData.alternative_path && routeData.alternative_path.length > 0
        ? getCoordinatesFromPath(routeData.alternative_path)
        : getCoordinatesFromPath(routeData.second_alternative_path)
      : routeData.smooth_path ?? getCoordinatesFromPath(routeData.path);

    if (pathCoordinates.length === 0) return;

    // Calculate distance to destination
    const distanceToDestination = calculateDistance(currentLocation, endPoint);

    // If within 15 meters of destination, stop navigation
    if (distanceToDestination < 20) {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
      setIsNavigating(false);
      setWatchId(null);
      setCurrentInstruction(t('youHaveArrived'));

      setTimeout(() => {
        closeDrawer();
      }, 2000); // 2 second delay

      if (mode === 'visuallyImpaired') {
        speakAccessibilityInfo(t('youHaveArrived'));
      }

      return;
    }

    // Find the nearest point on the path
    let nearestPointIndex = 0;
    let minDistance = Number.MAX_VALUE;

    pathCoordinates.forEach((point, index) => {
      const distance = calculateDistance(currentLocation, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPointIndex = index;
      }
    });

    // Calculate distance to next significant point
    if (nearestPointIndex < pathCoordinates.length - 1) {
      const nextPoint = pathCoordinates[nearestPointIndex + 1];
      const distanceToNext = calculateDistance(currentLocation, nextPoint);
      setDistanceToNextStep(distanceToNext);

      // Update instructions when we're approaching a decision point
      if (distanceToNext < 10000) { // Start giving instructions when 50m away
        const bearing = calculateBearing(
          pathCoordinates[nearestPointIndex],
          nextPoint
        );

        const instruction = getDirectionInstruction(bearing, distanceToNext);
        setCurrentInstruction(instruction);

        // Also look ahead to the next turn after this one
        if (nearestPointIndex < pathCoordinates.length - 2) {
          const nextBearing = calculateBearing(
            pathCoordinates[nearestPointIndex + 1],
            pathCoordinates[nearestPointIndex + 2]
          );
          setNextInstruction(getDirectionInstruction(nextBearing, 0)); // 0 distance for next instruction
        } else {
          setNextInstruction(t('destinationApproaching'));
        }

        // Update only if step changed
        if (nearestPointIndex !== currentStepIndex) {
          setCurrentStepIndex(nearestPointIndex);
          setCurrentInstruction(navigationSteps[nearestPointIndex].instruction);
          setNextInstruction(
            nearestPointIndex < navigationSteps.length - 1
              ? navigationSteps[nearestPointIndex + 1].instruction
              : null
          );

          // For visually impaired mode
          if (mode === 'visuallyImpaired') {
            speakAccessibilityInfo(navigationSteps[nearestPointIndex].instruction);
          }
        }
      }
    }

    // Update current step if we've progressed
    if (nearestPointIndex > currentStepIndex) {
      setCurrentStepIndex(nearestPointIndex);
    }
  };

  const getDirectionInstruction = (bearing: number, distance: number): string => {
    let direction = '';
    if (bearing >= 225 || bearing < 135) {
      direction = distance > 30 ? t('continueStraight') : t('goStraight');
    } else if (bearing >= 135 && bearing < 157.5) {
      direction = t('turnRight');
    } else if (bearing >= 157.5 && bearing < 202.5) {
      direction = t('turnAround');
    } else if (bearing >= 202.5 && bearing < 225) {
      direction = t('turnLeft');
    }

    // Add distance information if relevant
    if (distance > 0) {
      // if (distance < 10) {
      //   return `${direction} ${t('immediately')}`;
      // } else if (distance < 30) {
      //   return `${direction} ${t('soon')}`;
      // } else {
      const isStraight = direction === t('continueStraight') || direction === t('goStraight');
      const preposition = isStraight ? t('for') : t('in');
      return `${direction} ${preposition} ${Math.round(distance)} ${t('meters')}`;
      // }
    }

    return direction;
  };

  const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const calculateBearing = (start: Coordinate, end: Coordinate): number => {
    const startLat = start.latitude * Math.PI / 180;
    const startLng = start.longitude * Math.PI / 180;
    const endLat = end.latitude * Math.PI / 180;
    const endLng = end.longitude * Math.PI / 180;

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    const θ = Math.atan2(y, x);
    const bearing = (θ * 180 / Math.PI + 360) % 360;

    return bearing;
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const handleFeedbackSubmit = async () => {
    // Validate required fields
    if (!interfaceRating || !navigationRating || !challengesText.trim()) {
      Alert.alert(
        t('feedbackErrorTitle'),
        t('feedbackRequiredFields'),
      );

      if (mode === 'visuallyImpaired') {
        speakAccessibilityInfo(t('feedbackRequiredFields'));
      }
      return;
    }
    try {
      const feedbackData = {
        interface_rating: interfaceRating,
        navigation_rating: navigationRating,
        challenges: challengesText,
        timestamp: new Date().toISOString()
      };

      await submitFeedback(feedbackData);
      setIsFeedbackModalVisible(false);
      resetFeedbackForm();

      if (mode === 'visuallyImpaired') {
        speakAccessibilityInfo(t('feedbackSubmitted'));
        handleButtonPress();
      }
      Alert.alert(t('thankYou'), t('feedbackSubmitted'));
    } catch (error) {
      console.error('Feedback submission failed:', error);
      Alert.alert(t('error'), t('feedbackSubmissionFailed'));
    }
  };

  const resetFeedbackForm = () => {
    setInterfaceRating(0);
    setNavigationRating(0);
    setChallengesText('');
  };

  return (
    <View style={styles.container}>
      {showLocationPicker ? (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showLocationPicker}
          onRequestClose={() => { }}
          onShow={() => {
            speakAccessibilityInfo(t('selectStudyArea'));
          }}
        >
          <View style={styles.locationPickerContainer}>
            <View style={styles.locationPickerContent}>
              <Text style={styles.locationPickerTitle}>{t('selectStudyArea')}</Text>

              {studyAreas.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={styles.locationOption}
                  onPress={() => {
                    setSelectedStudyArea(area);
                    setShowLocationPicker(false);
                    // Update node data based on selected area
                    setCurrentNodeData(area.id === 'hamburg' ? allNodesHamburg : allNodesPenteli);
                    // Update the map location immediately
                    setLocation({
                      latitude: area.center.latitude,
                      longitude: area.center.longitude,
                      latitudeDelta: area.initialDelta.latitudeDelta,
                      longitudeDelta: area.initialDelta.longitudeDelta,
                    });
                    // Also center the map
                    mapRef.current?.animateToRegion({
                      latitude: area.center.latitude,
                      longitude: area.center.longitude,
                      latitudeDelta: area.initialDelta.latitudeDelta,
                      longitudeDelta: area.initialDelta.longitudeDelta,
                    }, 1000);

                    speakAccessibilityInfo(t(area.name));
                    // Reset selections
                    setSelectedStartNode(null);
                    setSelectedEndNode(null);
                    setStartPoint(null);
                    setEndPoint(null);
                    setRouteData(null);
                    setIsNavigating(false);
                    closeDrawer();
                  }}
                  accessible={true}
                  accessibilityLabel={t('selectArea', { area: t(area.name) })}
                >
                  <Text style={styles.locationOptionText}>{t(area.name)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      ) : null}

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        // showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={location}
        accessible={true}
        accessibilityLabel="Χάρτης της Αθήνας"
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title={t('yourLocation')}
            // pinColor="blue"
            tracksViewChanges={false}
          >
            <View style={styles.userLocationMarker}>
              {/*<View style={styles.userLocationPulse} />*/}
            </View>
          </Marker>
        )}

        {startPoint ? (
          <Circle
            center={startPoint}
            radius={3} // Small dot
            strokeWidth={2} // Border thickness
            strokeColor="black" // Black border
            fillColor="white" // White center
          />
        ) : null}
        {endPoint ? <Marker coordinate={endPoint}
          title={t('endPoint')}
          pinColor="blue"
          accessibilityLabel={t('endPoint')}
          accessibilityHint="Αυτό είναι το σημείο προορισμού σου" /> : null}

        {/* Display shortest or alternative path based on showAlternativePath state */}
        {routeData ? (
          <>
            {/* Main or alternative path */}
            <Polyline
              coordinates={
                showAlternativePath
                  ? routeData.alternative_path && routeData.alternative_path.length > 0
                    ? getCoordinatesFromPath(routeData.alternative_path)
                    : getCoordinatesFromPath(routeData.second_alternative_path)
                  : routeData.smooth_path ?? getCoordinatesFromPath(routeData.path)
              }
              strokeColor={showAlternativePath ? 'blue' : 'blue'} // Always blue for the main/alternative path
              strokeWidth={4}
              lineDashPattern={showAlternativePath ? undefined : [5, 10]} // Dashed for main path fallback
              geodesic={true}
            />

            {/* Debug markers - remove after testing */}
            {/*{routeData?.second_alternative_path?.flatMap(([startId, endId]) => {
              const nodes = [];
              const startNode = currentNodeData.find((n) => n && typeof n === 'object' && n.id === startId);
              const endNode = currentNodeData.find((n) => n && typeof n === 'object' && n.id === endId);

              if (startNode) nodes.push(
                <Marker key={`start-${startId}`} coordinate={{
                  latitude: startNode.coords[0],
                  longitude: startNode.coords[1]
                }}>
                  <View style={styles.debugMarker}>
                    <Text style={styles.debugText}>{startId}</Text>
                  </View>
                </Marker>
              );

              if (endNode) nodes.push(
                <Marker key={`end-${endId}`} coordinate={{
                  latitude: endNode.coords[0],
                  longitude: endNode.coords[1]
                }}>
                  <View style={styles.debugMarker}>
                    <Text style={styles.debugText}>{endId}</Text>
                  </View>
                </Marker>
              );

              return nodes;
            })} */}

            {/* Highlight inaccessible edges in red for alternative_path */}
            {showAlternativePath && routeData.inaccessible_edges && routeData.inaccessible_edges.length > 0 && (
              <Polyline
                coordinates={getCoordinatesFromPath(routeData.inaccessible_edges)}
                strokeColor="rgba(255, 0, 0, 0.5)" // Red with 50% opacity
                strokeWidth={4}
              />
            )}

            {/* Highlight inaccessible edges in red for second_alternative_path */}
            {showAlternativePath && routeData.alternative_path.length === 0 && routeData.second_alternative_path.length > 0 ? (
              <Polyline
                coordinates={getCoordinatesFromPath(routeData.second_alternative_path)}
                strokeColor="rgba(255, 0, 0, 0.5)" // Red with 50% opacity
                strokeWidth={4}
              />
            ) : null}

            {/* Display obstacles as markers */}
            {obstacleCoordinates.map((coord, index) => {
              const edgeKey = `${coord.edge[0]}-${coord.edge[1]}`;
              const reasons = obstacleReasons[edgeKey] || [];
              return (
                <Marker
                  key={index}
                  coordinate={{ latitude: coord.latitude, longitude: coord.longitude }}
                  onPress={() => {
                    setSelectedObstacle(reasons);
                    if (mode === 'visuallyImpaired') {
                      speakAccessibilityInfo(t('obstaclesFound', { count: reasons.length }));
                      reasons.forEach((reason, i) => {
                        setTimeout(() => speakAccessibilityInfo(t(reason)), (i + 1) * 1500);
                      });
                    }
                  }}
                >
                  <View style={styles.obstacleIcon}>
                    <Icons name="warning" size={24} color="red" />
                  </View>
                </Marker>
              );
            })}
          </>
        ) : null}
      </MapView>
      {/* Show notification if no path is found */}
      {noPathFound ? (
        <View key="noPathMessage" style={styles.notificationContainer}>
          <Text style={styles.notificationText}>{t('noRouteFound')}</Text>
        </View>
      ) : null}

      <View style={styles.controlsContainer}>
        <ScrollView style={styles.controls}>
          <View style={styles.pickerRow}>
            {/* Left Column (Icons) */}
            <View style={styles.iconColumn}>
              <View style={styles.startIcon} />
              <View style={styles.dottedLine} />
              <Icons name="location-pin" size={24} color="blue" />
            </View>

            {/* Right Column (Pickers) */}
            <View style={styles.pickerColumn}>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.searchInputContainer}
                  onPress={() => {
                    setActiveAutocomplete('start');
                    if (mode === 'visuallyImpaired') {
                      speakAccessibilityInfo(t('searchStartPoint'));
                    }
                  }}
                  accessible={true}
                  accessibilityLabel={t('startPoint')}
                  accessibilityHint={t('tapToSearch')}
                >
                  <Text style={styles.searchInputText}>
                    {selectedStartNode
                      ? getNodeName(selectedStartNode, language)
                      : t('startPoint')}
                  </Text>
                </TouchableOpacity>

                {/* options button */}
                <TouchableOpacity style={styles.reverseButton}
                  accessibilityLabel={t('routeOptions')}
                  accessibilityHint={t('doubleTapActivate')}
                  onPress={() => {
                    if (mode === 'visuallyImpaired') {
                      speakAccessibilityInfo(t('routeOptions'), t('doubleTapActivate'));
                      handleButtonPress();
                    }
                  }}>
                  <Icons name="more-vert" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.searchInputContainer}
                  onPress={() => {
                    setActiveAutocomplete('end');
                    if (mode === 'visuallyImpaired') {
                      speakAccessibilityInfo(t('searchEndPoint'));
                    }
                  }}
                  accessible={true}
                  accessibilityLabel={t('endPoint')}
                  accessibilityHint={t('tapToSearch')}
                >
                  <Text style={styles.searchInputText}>
                    {selectedEndNode
                      ? getNodeName(selectedEndNode, language)
                      : t('endPoint')}
                  </Text>
                </TouchableOpacity>

                {/* reverse button */}
                <TouchableOpacity style={styles.reverseButton}
                  accessibilityLabel={t('revertPoints')}
                  accessibilityHint={t('doubleTapActivate')}
                  onPress={() => {
                    reverseStartAndEnd();
                    if (mode === 'visuallyImpaired') {
                      speakAccessibilityInfo(t('revertPoints'), t('doubleTapActivate'));
                      handleButtonPress();
                    }
                  }}>
                  <Icons name="swap-vert" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Add the autocomplete modals */}
              <FullScreenAutocomplete
                language={language}
                // items={currentNodeData.filter((node) => node.id !== selectedEndNode)}
                items={currentNodeData.filter(node => node.name.trim() !== "" && node.id !== selectedEndNode)}
                selectedValue={selectedStartNode}
                onValueChange={(itemValue) => {
                  setSelectedStartNode(itemValue);
                  if (routeData) updateRouteDirections();
                  if (mode === 'visuallyImpaired' && itemValue) {
                    const nodeName = getNodeName(itemValue, language);
                    speakAccessibilityInfo(`${t('startPoint')}: ${nodeName}`);
                  }
                }}
                placeholder={t('searchStartPoint')}
                accessibilityLabel={t('searchStartPoint')}
                visible={activeAutocomplete === 'start'}
                onClose={() => setActiveAutocomplete(null)}
                nodeData={currentNodeData}
                studyArea={selectedStudyArea?.id || 'penteli'}
              />

              <FullScreenAutocomplete
                language={language}
                // items={currentNodeData.filter((node) => node.id !== selectedStartNode)}
                items={currentNodeData.filter(node => node.name.trim() !== "" && node.id !== selectedStartNode)}
                selectedValue={selectedEndNode}
                onValueChange={(itemValue) => {
                  setSelectedEndNode(itemValue);
                  if (routeData) updateRouteDirections();
                  if (mode === 'visuallyImpaired' && itemValue) {
                    const nodeName = getNodeName(itemValue, language);
                    speakAccessibilityInfo(`${t('endPoint')}: ${nodeName}`);
                  }
                }}
                placeholder={t('searchEndPoint')}
                accessibilityLabel={t('searchEndPoint')}
                visible={activeAutocomplete === 'end'}
                onClose={() => setActiveAutocomplete(null)}
                nodeData={currentNodeData}
                studyArea={selectedStudyArea?.id || 'penteli'}
              />
            </View>

          </View>
        </ScrollView>
      </View >

      {/* Loading Overlay */}
      {isCalculatingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>{t('calculatingRoute')}</Text>
          </View>
        </View>
      )}

      {isNavigating ? (
        <View style={styles.instructionPanel}>
          <View style={styles.currentInstruction}>
            <Text style={styles.instructionText}>{currentInstruction}</Text>
            {distanceToNextStep && (
              <Text style={styles.distanceText}>
                {formatDistance(distanceToNextStep)}
              </Text>
            )}
          </View>

          {nextInstruction && (
            <View style={styles.nextInstruction}>
              <Text style={styles.nextInstructionLabel}>{t('then')}:</Text>
              <Text style={styles.nextInstructionText}>{nextInstruction}</Text>
            </View>
          )}
        </View>
      ) : null}

      < Modal
        visible={selectedObstacle !== null
        }
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedObstacle(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('obstacles')}</Text>
            {selectedObstacle?.map((reason, index) => (
              <Text key={index} style={styles.modalText}>
                {t(reason)}
              </Text>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setSelectedObstacle(null);
                if (mode === 'visuallyImpaired') {
                  speakAccessibilityInfo(t('close'));
                  handleButtonPress();
                }
              }}
            >
              <Text style={styles.modalCloseButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal >

      <Modal
        visible={isFeedbackModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFeedbackModalVisible(false)}
      >
        <View style={styles.feedbackModalContainer}>
          <View style={styles.feedbackModalContent}>
            <Text style={styles.feedbackModalTitle}>{t('feedbackTitle')}</Text>

            {/* Interface Rating */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>{t('interfaceRating')}:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={`interface-${star}`}
                    onPress={() => setInterfaceRating(star)}
                    accessible={true}
                    accessibilityLabel={`${t('rate')} ${star} ${t('stars')} for interface`}
                  >
                    <Icons
                      name={star <= interfaceRating ? "star" : "star-border"}
                      size={30}
                      color={star <= interfaceRating ? "#FFD700" : "#ccc"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Navigation Experience Rating */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>{t('navigationRating')}:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={`navigation-${star}`}
                    onPress={() => setNavigationRating(star)}
                    accessible={true}
                    accessibilityLabel={`${t('rate')} ${star} ${t('stars')} for navigation`}
                  >
                    <Icons
                      name={star <= navigationRating ? "star" : "star-border"}
                      size={30}
                      color={star <= navigationRating ? "#FFD700" : "#ccc"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Challenges Text Input */}
            <TextInput
              style={styles.feedbackInput}
              multiline
              numberOfLines={4}
              placeholder={t('challengesPlaceholder')}
              value={challengesText}
              onChangeText={setChallengesText}
              accessible={true}
              accessibilityLabel={t('challengesPlaceholder')}
            />

            {/* Buttons */}
            <View style={styles.feedbackButtonsContainer}>
              <TouchableOpacity
                style={[styles.feedbackActionButton, styles.cancelButton]}
                onPress={() => {
                  setIsFeedbackModalVisible(false);
                  resetFeedbackForm();
                }}
              >
                <Text style={styles.feedbackCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.feedbackActionButton, styles.submitButton,
                (!interfaceRating || !navigationRating || !challengesText.trim()) && styles.disabledButtonFeedback]}
                onPress={handleFeedbackSubmit}
                disabled={!interfaceRating || !navigationRating || !challengesText.trim()}
              >
                <Text style={styles.feedbackActionButtonText}>{t('submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showTalkbackModal && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showTalkbackModal}
          onRequestClose={() => setShowTalkbackModal(false)}
        >
          <View style={styles.talkbackModalContainer}>
            <View style={styles.talkbackModalContent}>
              <Text style={styles.talkbackModalTitle}>
                {t('talkbackSuggestionTitle')}
              </Text>
              <Text style={styles.talkbackModalText}>
                {t('talkbackSuggestionText')}
              </Text>

              <View style={styles.talkbackModalButtons}>
                <TouchableOpacity
                  style={[styles.talkbackModalButton, styles.talkbackModalPrimaryButton]}
                  onPress={() => {
                    openAccessibilitySettings();
                    setShowTalkbackModal(false);
                  }}
                  accessible={true}
                  accessibilityLabel={t('openAccessibilitySettings')}
                  accessibilityHint={t('openAccessibilitySettingsHint')}
                >
                  <Text style={styles.talkbackModalButtonText}>
                    {t('openAccessibilitySettings')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.talkbackModalButton, styles.talkbackModalSecondaryButton]}
                  onPress={() => setShowTalkbackModal(false)}
                  accessible={true}
                  accessibilityLabel={t('cancel')}
                >
                  <Text style={styles.talkbackModalButtonText}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Filter Button */}
      <TouchableOpacity style={styles.filterButton}
        accessibilityLabel={t('changeMode')}
        onPress={() => {
          toggleFilters();
          if (mode === 'visuallyImpaired') {
            speakAccessibilityInfo(t('changeMode'));
            handleButtonPress();
          }
        }}
      >
        {mode === 'pedestrian' ? (
          <Icons name="directions-walk" size={30} color="#fff" />
        ) : null}
        {mode === 'mobilityImpaired' ? (
          <Icon name="wheelchair" size={30} color="#fff" />
        ) : null}
        {mode === 'visuallyImpaired' ? (
          <Icon name="blind" size={30} color="#fff" />
        ) : null}
      </TouchableOpacity>

      {/* Filter Options */}
      {
        showFilters ? (
          <View style={styles.filterOptions}>
            <TouchableOpacity style={styles.filterOption}
              accessibilityLabel={t('pedestrianMode')}
              onPress={() => {
                handleFilterSelection('pedestrian');
                if (mode === 'visuallyImpaired') {
                  speakAccessibilityInfo(t('pedestrianMode'));
                  handleButtonPress();
                }
              }}
            >
              <Icons name="directions-walk" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}
              accessibilityLabel={t('mobilityMode')}
              onPress={() => {
                handleFilterSelection('mobilityImpaired');
                if (mode === 'visuallyImpaired') {
                  speakAccessibilityInfo(t('mobilityMode'));
                  handleButtonPress();
                }
              }}
            >
              <Icon name="wheelchair" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}
              accessibilityLabel={t('visualMode')}
              onPress={() => {
                handleFilterSelection('visuallyImpaired');
                speakAccessibilityInfo(t('visualMode'));
                handleButtonPress();
              }}
            >
              <Icon name="blind" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        ) : null
      }

      {/* Center to location */}
      <TouchableOpacity
        style={styles.centerButton}
        accessibilityLabel={t('centerLocation')}
        onPress={() => {
          centerMapToCurrentLocation();
          if (mode === 'visuallyImpaired') {
            speakAccessibilityInfo(t('centerLocation'));
            handleButtonPress();
          }
        }}
      >
        <Icons name="my-location" size={24} color="#000" />
      </TouchableOpacity>

      {/* Turn to north */}
      <TouchableOpacity
        style={styles.rotateButton}
        accessibilityLabel={t('turnToNorth')}
        onPress={() => {
          resetMapRotation();
          if (mode === 'visuallyImpaired') {
            speakAccessibilityInfo(t('turnToNorth'));
            handleButtonPress();
          }
        }}
      >
        <Icons name="navigation" size={24} color="#000" />
      </TouchableOpacity>

      {/* Language Menu */}
      <View style={[styles.languageMenu, { width: isLanguageMenuOpen ? 150 : 50 }]}>
        {/* Show only the selected flag by default */}
        {!isLanguageMenuOpen ? (
          <TouchableOpacity
            accessibilityLabel={t('changeLanguage')}
            onPress={() => {
              setIsLanguageMenuOpen(true);
              if (mode === 'visuallyImpaired') {
                speakAccessibilityInfo(t('changeLanguage'));
                handleButtonPress();
              }
            }}
          >
            <Text style={styles.flag}>
              {language === 'el' ? '🇬🇷' : language === 'en' ? '🇬🇧' : '🇩🇪'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Show all flags when the menu is open */}
        {isLanguageMenuOpen ? (
          <>
            <TouchableOpacity
              accessibilityLabel={t('greekEnabled')}
              onPress={() => {
                changeLanguage('el');
                if (mode === 'visuallyImpaired') {
                  speakAccessibilityInfo(t('greekEnabled'));
                  handleButtonPress();
                }
              }}
            >
              <Text style={[styles.flag, language === 'el' && styles.selectedFlag]}>🇬🇷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={t('englishEnabled')}
              onPress={() => {
                changeLanguage('en');
                if (mode === 'visuallyImpaired') {
                  speakAccessibilityInfo(t('englishEnabled'));
                  handleButtonPress();
                }
              }}
            >
              <Text style={[styles.flag, language === 'en' && styles.selectedFlag]}>🇬🇧</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={t('germanEnabled')}
              onPress={() => {
                changeLanguage('de');
                if (mode === 'visuallyImpaired') {
                  speakAccessibilityInfo(t('germanEnabled'));
                  handleButtonPress();
                }
              }}
            >
              <Text style={[styles.flag, language === 'de' && styles.selectedFlag]}>🇩🇪</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Feedback Button */}
      <TouchableOpacity
        style={styles.feedbackButton}
        accessibilityLabel={t('giveFeedback')}
        onPress={() => {
          setIsFeedbackModalVisible(true);
          if (mode === 'visuallyImpaired') {
            speakAccessibilityInfo(t('giveFeedback'));
            handleButtonPress();
          }
        }}
      >
        <Icons name="feedback" size={24} color="#000" />
      </TouchableOpacity>

      {/* Study Area Switch Button */}
      <TouchableOpacity
        style={styles.studyAreaButton}
        accessibilityLabel={t('changeStudyArea')}
        onPress={() => {
          setShowLocationPicker(true);
          if (mode === 'visuallyImpaired') {
            speakAccessibilityInfo(t('changeStudyArea'));
            handleButtonPress();
          }
        }}
      >
        <Icons name="location-on" size={24} color="#000" />
      </TouchableOpacity>

      {/* Draggable Drawer */}
      {
        isDrawerVisible ? (
          <Animated.View
            style={[
              styles.drawerContainer,
              { height: drawerHeight },
            ]}
          >
            {/* Draggable Handle */}
            <View style={styles.handleContainer} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                closeDrawer();
                if (mode === 'visuallyImpaired') {
                  speakAccessibilityInfo(t('cancelRoute'));
                  handleButtonPress();
                }
              }}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            {/* Main Drawer Content */}
            <ScrollView style={styles.drawerContent}>
              {routeData && (
                <View>
                  {/* Route Info and Start Button */}
                  {(routeData.path.length > 0 || showAlternativePath) && (
                    <View style={styles.routeHeader}>
                      <Text style={styles.routeTitle}>
                        {t('yourRoute')}
                      </Text>
                      {!isNavigating ? (
                        <TouchableOpacity
                          style={[
                            styles.startButton,
                            (!selectedStartNode || !selectedEndNode) && styles.disabledButton
                          ]}
                          onPress={startNavigation}
                          disabled={!selectedStartNode || !selectedEndNode}
                        >
                          <Text style={styles.startButtonText}>{t('startNavigation')}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}

                  {/* Route Summary */}
                  {(routeData.path.length > 0 || showAlternativePath) && (
                    <View style={styles.routeSummary}>
                      <Text style={styles.routeInfoText}>
                        {showAlternativePath
                          ? routeData.alternative_path && routeData.alternative_path.length > 0
                            ? (routeData.total_time_alternative !== null && routeData.total_distance_alternative !== null
                              ? `${formatTime(routeData.total_time_alternative)} (${formatDistance(routeData.total_distance_alternative)})`
                              : '')
                            : (routeData.total_time_second_alternative !== null && routeData.total_distance_second_alternative !== null
                              ? `${formatTime(routeData.total_time_second_alternative)} (${formatDistance(routeData.total_distance_second_alternative)})`
                              : '')
                          : (routeData.total_time !== null && routeData.total_distance !== null
                            ? `${formatTime(routeData.total_time)} (${formatDistance(routeData.total_distance)})`
                            : '')}
                      </Text>
                    </View>
                  )}

                  {/* Navigation Instructions (only shown when navigating) */}
                  {isNavigating && (
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsTitle}>{t('directions')}</Text>

                      {/* Current Instruction */}
                      <View style={styles.currentInstruction}>
                        <Icons name="directions-walk" size={24} color="#007bff" />
                        <View style={styles.instructionTextContainer}>
                          <Text style={styles.instructionText}>{currentInstruction}</Text>
                          {distanceToNextStep && (
                            <Text style={styles.distanceText}>
                              {formatDistance(distanceToNextStep)}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Next Instruction */}
                      {nextInstruction && (
                        <View style={styles.nextInstruction}>
                          <Icons name="chevron-right" size={24} color="#666" />
                          <Text style={styles.nextInstructionText}>{nextInstruction}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Full directions list */}
                  {navigationSteps.length > 0 && (routeData.path.length > 0 || showAlternativePath) ? (
                    <View style={styles.directionsList}>
                      {navigationSteps.map((step, index) => (
                        <View
                          key={index}
                          style={[
                            styles.directionStep,
                            index === currentStepIndex && styles.currentStep
                          ]}
                        >
                          <View style={styles.stepIndicator}>
                            {index === currentStepIndex ? (
                              <Icons name="navigation" size={20} color="#007bff" />
                            ) : (
                              <Text style={styles.stepNumber}>{index + 1}</Text>
                            )}
                          </View>
                          <View style={styles.stepDetails}>
                            <Text style={styles.stepInstruction}>
                              {step.instruction}
                            </Text>
                            {step.distance > 0 && (
                              <Text style={styles.stepDistance}>
                                {formatDistance(step.distance)}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noDirectionsText}>
                      {t('noDirectionsAvailable')}
                    </Text>
                  )}

                  {/* Alternative Route Options */}
                  <View style={styles.routeOptions}>
                    {routeData.alternative_path.length > 0 && !showAlternativePath && (
                      <View style={styles.altPathContainer}>
                        <Text style={styles.altPathText} allowFontScaling={true}>{t('showAlternativeRoute')}</Text>
                        <TouchableOpacity style={styles.altPathButton}
                          accessibilityLabel={t('showAlternativeRoute')}
                          onPress={() => {
                            // setShowAlternativePath(true);
                            toggleAlternativePath();
                            if (mode === 'visuallyImpaired') {
                              speakAccessibilityInfo(t('showAlternativeRouteButton'));
                              handleButtonPress();
                            }
                          }}
                        >
                          <Text style={styles.altPathButtonText}>{t('showAlternativeRouteButton')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}


                    {routeData.path.length === 0 && routeData.alternative_path.length === 0 && routeData.second_alternative_path.length > 0 && !showAlternativePath ? (
                      <View style={styles.altPathContainer}>
                        <Text style={styles.secondAltPathText}>{t('noAccessibleRoute')}</Text>
                        <TouchableOpacity style={styles.secondAltPathButton}
                          onPress={() => {
                            setShowAlternativePath(true);
                            if (mode === 'visuallyImpaired') {
                              speakAccessibilityInfo(t('showInaccessibleRouteButton'));
                              handleButtonPress();
                            }
                          }}>
                          <Text style={styles.altPathButtonText}>{t('showInaccessibleRouteButton')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {!isNavigating && showAlternativePath ? (
                      <TouchableOpacity style={styles.altPathButton} onPress={() => setShowAlternativePath(false)}>
                        <Text style={styles.altPathButtonText}>{t('returnToAccessibleRoute')}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        ) : null
      }

      {/* Loading Overlay */}
      {isCalculatingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>{t('calculatingRoute')}</Text>
          </View>
        </View>
      )}
    </View >
  );
}


