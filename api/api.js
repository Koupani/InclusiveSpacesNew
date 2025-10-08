export const calculateRoute = async (startNode, endNode, mode, selectedStudyArea) => {
  try {
    const requestData = {
      start_point: startNode,
      end_point: endNode,
      mode: mode,
      study_area: selectedStudyArea
    };

    // const response = await fetch('http://192.168.31.132:5000/api/find_path', {
    const response = await fetch('http://147.102.154.54:5000/api/find_path', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();  // ✅ Properly parse JSON
    console.log('Route data:', data);    // 🔍 Inspect the parsed data
    return data;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

//   export const submitFeedback = async (feedbackText, rating) => {
//   try {
//     const response = await fetch('http://147.102.154.54:5000/api/feedback', {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         feedback_text: feedbackText,
//         rating: rating
//       }),
//     });

//     if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

//     const data = await response.json();
//     console.log('Feedback submitted:', data);
//     return data;
//   } catch (error) {
//     console.error('Error submitting feedback:', error);
//     throw error;
//   }
// };
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await fetch('http://147.102.154.54:5000/api/feedback', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interface_rating: feedbackData.interface_rating,
        navigation_rating: feedbackData.navigation_rating,
        challenges: feedbackData.challenges,
        timestamp: feedbackData.timestamp
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log('Feedback submitted:', data);
    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};