import { storage } from './firebase'; // 우리가 만든 firebase.ts 파일
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Place, ImageInfo } from '../types'; // Place 타입을 추가로 import 합니다.

// 이미지 파일을 Storage에 업로드하고, 다운로드 URL을 반환하는 함수
export const uploadImage = async (placeId: string, imageFile: File): Promise<string> => {
  // 파일 경로를 지정합니다. 예: places/P_20250918.../image_1.jpg
  const imagePath = `places/${placeId}/${imageFile.name}_${Date.now()}`;
  const storageRef = ref(storage, imagePath);

  // 파일을 업로드합니다.
  const snapshot = await uploadBytes(storageRef, imageFile);
  
  // 업로드된 파일의 다운로드 URL을 가져옵니다.
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
};

// Place 데이터에 포함된 모든 신규 이미지를 업로드하고, URL을 업데이트하는 함수
export const processImagesForUpload = async (placeData: Place): Promise<Place> => {
  if (!placeData.images || placeData.images.length === 0) {
    return placeData;
  }

  // 새로운 파일(file 객체가 있는)만 필터링하여 업로드를 준비합니다.
  const uploadPromises = placeData.images.map(async (image, index) => {
    // file 객체가 있을 경우에만 업로드를 진행합니다.
    if (image.file) {
      const newUrl = await uploadImage(placeData.place_id, image.file);
      // 업로드 후에는 file 객체를 지우고, url을 실제 Storage URL로 교체합니다.
      return { url: newUrl, caption: image.caption };
    }
    // file 객체가 없으면 (기존 이미지) 그대로 반환합니다.
    return image;
  });

  // 모든 이미지 업로드가 완료될 때까지 기다립니다.
  const updatedImages = await Promise.all(uploadPromises);

  // 업데이트된 이미지 배열로 데이터를 교체하여 반환합니다.
  return { ...placeData, images: updatedImages };
};