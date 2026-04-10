// Confidence logic for herb prediction results
export const getConfidenceMessage = (confidence) => {
  if (confidence >= 80) {
    return {
      action: 'ACCEPT',
      message: 'High confidence prediction. This herb identification is reliable.',
      color: 'green'
    };
  } else if (confidence >= 60) {
    return {
      action: 'ACCEPT_WITH_WARNING',
      message: 'Moderate confidence. Consider additional verification.',
      color: 'orange'
    };
  } else {
    return {
      action: 'RETRY',
      message: 'Low confidence prediction. Try uploading a clearer image.',
      color: 'red'
    };
  }
};