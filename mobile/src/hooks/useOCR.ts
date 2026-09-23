import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useAlert } from '../contexts/AlertContext';

export function useOCR(onSuccess?: (uri: string, text: string) => void) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const { showAlert } = useAlert();

  const processOCR = async (uri: string) => {
    setOcrLoading(true);
    try {
      const recognitionResult = await TextRecognition.recognize(uri);
      const extractedText = recognitionResult.text;

      setOcrLoading(false);

      if (!extractedText || extractedText.trim() === '') {
        showAlert('Error', 'No text found in the image.');
        return;
      }
      
      if (onSuccess) {
        onSuccess(uri, extractedText);
      } else {
        showAlert(
          'Extracted Text',
          extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : ''),
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      setOcrLoading(false);
      showAlert('Error', e.message || 'Failed to extract text from image');
    }
  };

  const handleOCR = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissions Required', 'Camera permissions are required');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      processOCR(result.assets[0].uri);
    }
  };

  return { handleOCR, ocrLoading };
}
