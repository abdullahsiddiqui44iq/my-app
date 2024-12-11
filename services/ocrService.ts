import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

interface CNICDetails {
  identityNumber?: string;
  name?: string;
  fatherName?: string;
  dateOfBirth?: string;
  dateOfExpiry?: string;
  gender?: string;
}

interface OCRSpaceResponse {
  ParsedResults: Array<{
    ParsedText: string;
    ErrorMessage: string;
    FileParseExitCode: number;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage: string[] | string | null;
  ErrorDetails: string | null;
  ProcessingTimeInMilliseconds: string;
}

class OCRService {
  private static OCR_SPACE_API_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;
  private static OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';
  private static MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

  static async prepareImage(imageUri: string): Promise<ImageManipulator.ImageResult> {
    try {
      console.log('Preparing image for upload:', imageUri);

      // Start with moderate compression
      let compression = 0.7;
      let width = 1800;
      let processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width } }],
        {
          compress: compression,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );

      // Check file size and adjust if needed
      while (processedImage.base64 && 
             (processedImage.base64.length * 0.75) > this.MAX_FILE_SIZE && 
             (compression > 0.1 || width > 800)) {
        
        if (compression > 0.1) {
          compression -= 0.1;
        } else {
          width -= 200;
          compression = 0.7;
        }

        console.log(`Adjusting image: width=${width}, compression=${compression}`);
        
        processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width } }],
          {
            compress: compression,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          }
        );
      }

      const fileSizeKB = processedImage.base64 ? Math.round((processedImage.base64.length * 0.75) / 1024) : 0;
      console.log(`Final image size: ${fileSizeKB}KB`);

      return processedImage;
    } catch (error) {
      console.error('Image preparation error:', error);
      throw error;
    }
  }

  static async extractCNICDetails(imageUri: string): Promise<{
    success: boolean;
    details?: CNICDetails;
    error?: string;
    rawText?: string;
  }> {
    try {
      // First validate and prepare the image
      const isValidSize = await this.validateImageSize(imageUri);
      if (!isValidSize) {
        return {
          success: false,
          error: 'Image resolution is too low. Please provide a clearer image.'
        };
      }

      // Prepare and optimize image
      const processedImage = await this.prepareImage(imageUri);
      
      if (!processedImage.base64) {
        return {
          success: false,
          error: 'Failed to process image'
        };
      }

      // Create form data for OCR.space API
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${processedImage.base64}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'true');
      formData.append('OCREngine', '2');
      formData.append('scale', 'true');
      formData.append('detectOrientation', 'true');
      formData.append('isTable', 'false');

      // Call OCR.space API
      const response = await fetch(this.OCR_SPACE_API_URL, {
        method: 'POST',
        headers: {
          'apikey': this.OCR_SPACE_API_KEY || '',
        },
        body: formData
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'OCR API request failed'
        };
      }

      const result = await response.json() as OCRSpaceResponse;
      console.log('OCR.space API Result:', result);

      // Check for OCR processing errors
      if (result.IsErroredOnProcessing) {
        const errorMessage = Array.isArray(result.ErrorMessage) 
          ? result.ErrorMessage[0] 
          : result.ErrorMessage || 'OCR processing failed';
        return {
          success: false,
          error: errorMessage
        };
      }

      // Check OCR exit code
      if (result.OCRExitCode !== 1 && result.OCRExitCode !== 2) {
        return {
          success: false,
          error: 'OCR failed to process the image properly'
        };
      }

      // Get the first parsed result
      const parsedResult = result.ParsedResults[0];
      if (!parsedResult || parsedResult.FileParseExitCode !== 1) {
        return {
          success: false,
          error: parsedResult?.ErrorMessage || 'Failed to parse the image'
        };
      }

      const extractedText = parsedResult.ParsedText;
      console.log('Extracted Text:', extractedText);

      // Extract CNIC details from the OCR result
      const details = this.extractDetailsFromText(extractedText);

      // Validate extracted details
      if (!this.validateCNICDetails(details)) {
        return {
          success: false,
          error: 'Could not extract all required CNIC details',
          rawText: extractedText,
          details // Include partial details if available
        };
      }

      return {
        success: true,
        details,
        rawText: extractedText
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static validateImageSize(uri: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          // Check if image dimensions are reasonable
          const isValidSize = width >= 800 && height >= 500;
          resolve(isValidSize);
        },
        (error) => {
          console.error('Image validation error:', error);
          reject(error);
        }
      );
    });
  }

  private static validateCNICDetails(details: CNICDetails): boolean {
    // Basic validation of extracted details
    return Boolean(
      details.identityNumber?.match(/^\d{5}-\d{7}-\d$/) && // CNIC format
      details.name &&
      details.fatherName &&
      details.dateOfBirth &&
      details.dateOfExpiry
    );
  }

  private static extractDetailsFromText(text: string): CNICDetails {
    // Identity Number pattern (more flexible)
    const idPattern = /\b\d{5}[-\s]?\d{7}[-\s]?\d\b/;
    
    // Name patterns (more specific to CNIC format)
    const namePattern = /Name\s*[:.]?\s*([A-Za-z\s]+?)(?=\s*Father|Identity|Date|\d|$)/i;
    const fatherPattern = /Father(?:'s)?\s*Name\s*[:.]?\s*([A-Za-z\s]+?)(?=\s*Identity|Date|\d|$)/i;
    
    // Date patterns
    const dobPattern = /Date\s*of\s*Birth\s*[:.]?\s*(\d{1,2}[-\.]\d{1,2}[-\.]\d{4})/i;
    const expiryPattern = /(?:Date\s*of\s*Expiry|Expiry\s*Date)\s*[:.]?\s*(\d{1,2}[-\.]\d{1,2}[-\.]\d{4})/i;

    // Extract values
    const idMatch = text.match(idPattern);
    const nameMatch = text.match(namePattern);
    const fatherMatch = text.match(fatherPattern);
    const dobMatch = text.match(dobPattern);
    const expiryMatch = text.match(expiryPattern);

    // Clean and format the matches
    const details: CNICDetails = {
      identityNumber: idMatch ? idMatch[0].replace(/\s/g, '-') : undefined,
      name: nameMatch ? this.cleanName(nameMatch[1]) : undefined,
      fatherName: fatherMatch ? this.cleanName(fatherMatch[1]) : undefined,
      dateOfBirth: dobMatch ? this.formatDate(dobMatch[1]) : undefined,
      dateOfExpiry: expiryMatch ? this.formatDate(expiryMatch[1]) : undefined,
      gender: text.toLowerCase().includes('female') ? 'Female' : 'Male'
    };

    console.log('Extracted CNIC Details:', details);
    return details;
  }

  private static cleanName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^A-Za-z\s]/g, '')
      .trim();
  }

  private static formatDate(date: string): string {
    return date.replace(/[-]/g, '.');
  }
}

export default OCRService; 