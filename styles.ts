import { Dimensions, StyleSheet } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7; // 70% of screen height
const DEFAULT_DRAWER_HEIGHT = SCREEN_HEIGHT * 0.3; // Default height when opened

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerColumn: {
    flex: 1, // Expand to fill remaining space
  },
  iconColumn: {
    alignItems: 'center',
    marginRight: 10 // Space between icons and pickers
  },
  startIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
  },
  dottedLine: {
    width: 2,
    height: 45,
    backgroundColor: 'transparent',
    borderLeftWidth: 2,
    opacity: 0.7,
    borderStyle: 'dotted',
    borderColor: 'gray',
    marginVertical: 5,
  },
  container: { flex: 1 },
  map: { flex: 1 },
  controlsContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 15,
    zIndex: 1,
  },
  controls: { maxHeight: 250 },
  // pickerContainer: {
  //   marginBottom: 6,
  //   paddingVertical: 4,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  // },
  picker: {
    height: 60,
    width: '80%',
    color: '#000',
    backgroundColor: '#f9f9f9', // 🌤️ Brighter picker background
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#000' },
  reverseButton: {
    padding: 5,
    marginHorizontal: 5,
  },

  voiceButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5, // Shadow on Android
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  voiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // 🌟 Updated route info background
  // result: {
  //   marginTop: 0,
  //   padding: 12,
  //   borderWidth: 1,
  //   borderColor: '#ddd',
  //   borderRadius: 0,
  //   backgroundColor: 'rgba(255, 255, 255, 0.9)', // Light background with subtle transparency
  //   shadowColor: '#000',
  //   shadowOpacity: 0.1,
  //   shadowRadius: 5,
  //   shadowOffset: { width: 0, height: 2 },
  // },
  heading: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#333' },

  // 🌟 Improved alternative path message background
  altPathContainer: {
    padding: 10,
    backgroundColor: 'rgba(240, 240, 240, 0.9)', // Soft gray background
    borderRadius: 8,
    alignItems: 'center',
  },
  altPathText: { fontSize: 14, color: '#FF5733', textAlign: 'center', marginBottom: 8 },
  secondAltPathText: { fontSize: 14, color: '#FF5733', textAlign: 'center', marginBottom: 8 },

  altPathButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  secondAltPathButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  altPathButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  filterButton: {
    position: 'absolute',
    right: 10,
    top: 200,
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50
  },
  filterOptions: {
    position: 'absolute',
    right: 10,
    top: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    zIndex: 50,
    flexDirection: 'row', // Change to row
    justifyContent: 'space-between', // Space out the buttons evenly
  },
  filterOption: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    zIndex: 50,
  },
  centerButton: {
    position: 'absolute',
    top: 265,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  rotateButton: {
    position: 'absolute',
    top: 330,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  mapTypeButton: {
    position: 'absolute',
    top: 585,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  languageMenu: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the flags
    alignItems: 'center',
    padding: 1,
    backgroundColor: 'white',
    borderRadius: 20, // Rounded corners for the menu
    position: 'absolute', // Position the menu absolutely
    right: 10,
    top: 395,
    elevation: 5,
    height: 50,
    zIndex: 50,
  },
  flag: {
    fontSize: 24,
    opacity: 0.9,
    marginHorizontal: 10, // Add spacing between flags
    zIndex: 50,
  },
  selectedFlag: {
    opacity: 1,
    zIndex: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    color: '#000000',
    fontSize: 14,
    marginBottom: 5,
  },
  modalCloseButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  obstacleIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    // borderColor: 'red',
    // borderWidth: 1,
    padding: 4,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  notificationContainer: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  notificationText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  // drawerContainer: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: 'white',
  //   borderTopLeftRadius: 20,
  //   borderTopRightRadius: 20,
  //   padding: 20,
  //   elevation: 5, // Shadow for Android
  //   shadowColor: '#000', // Shadow for iOS
  //   shadowOffset: { width: 0, height: -2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: MAX_DRAWER_HEIGHT, // Larger maximum height
    zIndex: 2000
  },
  drawerContent: {
    flex: 1,
    marginTop: 10,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeTitle: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  routeSummary: {
    marginBottom: 20,
  },
  routeInfoText: {
    fontSize: 16,
    color: '#333',
  },
  instructionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  currentInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  nextInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingLeft: 34, // Match icon width + margin
  },
  nextInstructionText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 10,
  },
  routeOptions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  altRouteOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  altRouteOptionText: {
    color: '#007bff',
    fontWeight: '500',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 10,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 18,
    opacity: 0.5,
  },
  routeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#007bff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: 100,
    borderRadius: 50,
    marginTop: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
  },
  instructionPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nextInstructionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0,
  },
  directionsList: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  directionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  currentStep: {
    backgroundColor: '#e6f2ff',
    borderRadius: 8,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 14,
    color: '#666',
  },
  stepDetails: {
    flex: 1,
  },
  stepInstruction: {
    color: '#000000',
    fontSize: 16,
    marginBottom: 3,
  },
  stepDistance: {
    fontSize: 14,
    color: '#666',
  },
  noDirectionsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontStyle: 'italic'
  },
  // Feedback Modal Styles
  feedbackModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  feedbackModalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  feedbackModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
  },
  feedbackInput: {
    color: '#000000',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    color: '#000000',
    marginRight: 10,
    fontSize: 16,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  feedbackButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  feedbackActionButton: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  cancelButton: {
    backgroundColor: '#ffffff', // white background
    borderColor: '#ccc',        // grey outline
    borderWidth: 1,             // outline thickness
  },
  feedbackActionButtonText: {
    color: 'white'
  },
  feedbackCancelText: {
    color: '#cccccc',
    fontWeight: 'bold',
  },
  // Feedback Trigger Button (keep this separate)
  feedbackButton: {
    position: 'absolute',
    right: 10,
    top: 460,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  searchInputContainer: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInputText: {
    fontSize: 16,
    color: '#000',
  },
  pickerContainer: {
    marginBottom: 6,
    marginTop: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  locationPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  locationPickerContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  locationPickerTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationOptionText: {
    color: '#000000',
    fontSize: 16,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 15,
  },
  questionText: {
    color: '#000000',
    fontSize: 16,
    marginBottom: 10,
  },
  answerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  answerButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '45%',
    alignItems: 'center',
  },
  selectedAnswer: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  answerButtonText: {
    color: '#000',
  },
  selectedAnswerText: {
    color: '#fff',
  },
  studyAreaButton: {
    position: 'absolute',
    right: 10,
    top: 525, // Position below the feedback button
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  disabledButtonFeedback: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  debugMarker: {
    backgroundColor: 'rgba(255, 255, 0, 0.7)',
    padding: 4,
    borderRadius: 4
  },
  debugText: {
    color: 'black',
    fontWeight: 'bold'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Make sure it's above everything else
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#000000',
    fontSize: 16,
  },
  userLocationMarker: {
    width: 16, // Slightly smaller for better precision
    height: 16,
    borderRadius: 8, // Half of width/height to make it perfectly round
    backgroundColor: '#0078ff', // Solid blue color
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2, // For Android shadow
  },
  userLocationPulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 120, 255, 0.2)',
    opacity: 0.1
  },
  talkbackModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  talkbackModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  talkbackModalTitle: {
    fontSize: 18,  // Slightly larger for better readability
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 15,  // Increased spacing
    textAlign: 'center',
    paddingHorizontal: 10,  // Add some padding
  },
  talkbackModalText: {
    fontSize: 14,  // Slightly larger
    color: '#000000',
    marginBottom: 25,  // Increased spacing
    textAlign: 'center',
    paddingHorizontal: 15,  // Add some padding
    lineHeight: 22,  // Better line spacing
  },
  talkbackModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  talkbackModalButton: {
    paddingVertical: 16,   // More vertical padding for height
    paddingHorizontal: 20, // More horizontal padding for wider buttons
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,         // Increased minimum height
},
  talkbackModalPrimaryButton: {
    backgroundColor: '#007AFF',
  },
  talkbackModalSecondaryButton: {
    backgroundColor: '#E0E0E0',
  },
  talkbackModalButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',  // Slightly bolder
    textAlign: 'center',  // Center horizontally
    width: '100%',  // Ensure full width for centering
  },
});

export default styles;