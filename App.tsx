import { db } from './services/firebase'; // firebase.ts 임포트
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { collection, query, orderBy, onSnapshot, doc, setDoc, Timestamp } from 'firebase/firestore'; 
import React, { useState, useCallback, useMemo } from 'react';
import type { Place, InitialFormData } from './types';
import InitialForm from './components/InitialForm';
import ReviewDashboard from './components/ReviewDashboard';
import ContentLibrary from './components/ContentLibrary';
import Spinner from './components/common/Spinner';
import Modal from './components/common/Modal';
import Button from './components/common/Button';
import { importDataFromUrl } from './services/geminiService';
import { KLokalLogo, WITH_KIDS_OPTIONS, WITH_PETS_OPTIONS, PARKING_DIFFICULTY_OPTIONS, ADMISSION_FEE_OPTIONS } from './constants';

type AppStep = 'library' | 'initial' | 'loading' | 'review';

const App: React.FC = () => {
  const [spots, setSpots] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

React.useEffect(() => {
  setIsLoading(true);
  const q = query(collection(db, "places"), orderBy("updated_at", "desc"));

  // onSnapshot은 DB 변경 시 실시간으로 데이터를 업데이트해주는 마법 같은 함수입니다.
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const spotsData = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      place_id: doc.id
    })) as Place[];
    setSpots(spotsData);
    setIsLoading(false);
  });

  // 컴포넌트가 언마운트될 때 실시간 리스너를 정리합니다.
  return () => unsubscribe();
}, []);
  const [step, setStep] = useState<AppStep>('library');
  const [dataToEdit, setDataToEdit] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [finalData, setFinalData] = useState<Place | null>(null);
  
  const handleStartManualDraft = useCallback((formData: InitialFormData) => {
    const now = Date.now() / 1000;
    const timestamp = { seconds: now, nanoseconds: 0 };
    const newDraft: Place = {
      place_id: `P_${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}_${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
      place_name: formData.spotName,
      categories: formData.categories,
      creator_id: 'expert_001',
      status: 'draft',
      address: '',
      region: '',
      images: [],
      linked_spots: [],
      comments: [],
      expert_tip_raw: '',
      expert_tip_final: '',
      attributes: {
        targetAudience: [],
        recommendedSeasons: [],
        withKids: WITH_KIDS_OPTIONS[1], // "가능"
        withPets: WITH_PETS_OPTIONS[2], // "불가"
        parkingDifficulty: PARKING_DIFFICULTY_OPTIONS[1], // "보통"
        admissionFee: ADMISSION_FEE_OPTIONS[2], // "정보없음"
      },
      public_info: {
        operating_hours: '',
        phone_number: '',
        website_url: '',
      },
      tags: [],
      created_at: timestamp,
      updated_at: timestamp,
    };
    setDataToEdit(newDraft);
    setStep('review');
  }, []);

  const handleImportFromUrl = useCallback(async (url: string, baseData: InitialFormData) => {
    setStep('loading');
    setError(null);
    try {
      const importedData = await importDataFromUrl(url);
      const now = Date.now() / 1000;
      const timestamp = { seconds: now, nanoseconds: 0 };
      const completeData: Place = {
        place_id: `P_${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}_${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
        creator_id: 'expert_001',
        status: 'draft',
        images: [],
        linked_spots: [],
        comments: [],
        expert_tip_raw: '',
        expert_tip_final: '',
        attributes: {
          targetAudience: [],
          recommendedSeasons: [],
          withKids: WITH_KIDS_OPTIONS[1],
          withPets: WITH_PETS_OPTIONS[2],
          parkingDifficulty: PARKING_DIFFICULTY_OPTIONS[1],
          admissionFee: ADMISSION_FEE_OPTIONS[2],
        },
        ...importedData, // Overwrite defaults with imported data
        region: importedData.region || '',
        public_info: { ...(importedData.public_info || {}) },
        place_name: baseData.spotName || importedData.place_name || '',
        categories: baseData.categories.length > 0 ? baseData.categories : [],
        created_at: timestamp,
        updated_at: timestamp,
      };
      setDataToEdit(completeData);
      setStep('review');
    } catch (err) {
      console.error('Error importing from URL:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStep('initial');
    }
  }, []);

  const handleOpenReview = (finalData: Place) => {
    setFinalData(finalData);
    setIsDataSaved(false);
    setIsModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (finalData) {
      // Firestore에 저장할 최종 데이터 객체를 준비합니다.
      // Firestore의 Timestamp를 사용하여 서버 시간을 기준으로 updated_at을 기록합니다.
      const now = Timestamp.now();
      const dataToSave = { 
        ...finalData, 
        updated_at: now, 
        // 'stub' 상태는 데이터가 완성되었으므로 'draft'로 변경하여 저장합니다.
        status: finalData.status === 'stub' ? 'draft' : finalData.status 
      };

      try {
        // Firestore 'places' 컬렉션에 finalData.place_id를 문서 ID로 사용하여 데이터를 저장(덮어쓰기)합니다.
        // 문서가 존재하지 않으면 새로 생성하고, 존재하면 내용을 업데이트합니다.
        await setDoc(doc(db, "places", dataToSave.place_id), dataToSave);
        
        console.log('Final data saved to Firestore:', dataToSave.place_id);
        setIsDataSaved(true); // 저장 성공 상태로 변경

      } catch (e) {
        console.error("Error writing document to Firestore: ", e);
        setError("데이터 저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
        setIsDataSaved(false); // 저장 실패 상태로 변경
      }
    }
  };

  const handleAddStubSpot = (spotName: string): Place => {
    const newPlaceId = `P_${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}_${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    const now = Date.now() / 1000;
    const timestamp = { seconds: now, nanoseconds: 0 };
    const newStub: Place = {
      place_id: newPlaceId,
      place_name: spotName,
      status: 'stub',
      created_at: timestamp,
      updated_at: timestamp,
      categories: [],
      images: [],
      linked_spots: [],
      comments: []
    };
    setSpots(prev => [...prev, newStub]);
    return newStub;
  };
  
  const handleExitToLibrary = () => {
    setIsModalOpen(false);
    setIsDataSaved(false);
    setStep('library');
    setDataToEdit(null);
    setFinalData(null);
    setError(null);
  };

  const handleStartNew = () => {
    setDataToEdit(null);
    setStep('initial');
  };

  const handleEditSpot = (spot: Place) => {
    setDataToEdit(spot);
    setStep('review');
  };
  
  const handleCloseModal = () => setIsModalOpen(false);

  const renderContent = () => {
    switch (step) {
      case 'library':
        return <ContentLibrary spots={spots} onAddNew={handleStartNew} onEdit={handleEditSpot} />;
      case 'initial':
        return <InitialForm onStartManual={handleStartManualDraft} onImportFromUrl={handleImportFromUrl} error={error} />;
      case 'loading':
        return (
          <div className="text-center p-10">
            <Spinner />
            <p className="text-lg text-gray-600 mt-4">AI가 URL을 분석하여 초안을 생성 중입니다... 잠시만 기다려주세요.</p>
          </div>
        );
      case 'review':
        if (dataToEdit) {
          return <ReviewDashboard initialData={dataToEdit} onSave={handleOpenReview} allSpots={spots} onAddStubSpot={handleAddStubSpot} />;
        }
        // Fallback to library if no data to edit
        setStep('library');
        return null;
      default:
        return null;
    }
  };
  
  const HeaderButton = useMemo(() => {
    if (step === 'library') return null;

    return (
      <button
        onClick={handleExitToLibrary}
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        라이브러리로 돌아가기
      </button>
    );
  }, [step]);


  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
                <KLokalLogo />
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                    K-LOKAL: AI 데이터빌더
                </h1>
            </div>
            {HeaderButton}
        </header>
        <main>
          {renderContent()}
        </main>
        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} K-LOKAL Project. All Rights Reserved.</p>
        </footer>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="생성된 JSON 데이터 미리보기"
      >
        <div className="space-y-6">
          <div>
            <p className="text-gray-600">
              아래는 최종 생성된 JSON 데이터입니다. 내용을 확인 후 저장하거나, 다시 돌아가 수정할 수 있습니다.
            </p>
            {isDataSaved && 
              <p className="mt-2 text-sm font-semibold text-green-600 bg-green-50 p-3 rounded-md">
                ✓ 저장 완료! (브라우저 콘솔을 확인하세요)
              </p>
            }
          </div>
          <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto border border-gray-200">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(finalData, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end items-center space-x-3 pt-5 border-t mt-2">
            <Button onClick={handleCloseModal} variant="secondary" disabled={isDataSaved}>
              수정하기
            </Button>
            <Button onClick={handleConfirmSave} disabled={isDataSaved}>
              {isDataSaved ? '저장됨' : '저장하기'}
            </Button>
            <Button onClick={handleExitToLibrary}>
              라이브러리로 이동
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;