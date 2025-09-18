
import React, { useState } from 'react';
import type { InitialFormData } from '../types';
import { CATEGORIES } from '../constants';
import Button from './common/Button';
import CheckboxGroup from './common/CheckboxGroup';
import Input from './common/Input';
import Card from './common/Card';

interface InitialFormProps {
  onStartManual: (formData: InitialFormData) => void;
  onImportFromUrl: (url: string, baseData: InitialFormData) => void;
  error: string | null;
}

const InitialForm: React.FC<InitialFormProps> = ({ onStartManual, onImportFromUrl, error }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [spotName, setSpotName] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const validateBaseFields = (): boolean => {
    if (selectedCategories.length < 1) {
      setValidationError('카테고리를 1개 이상 선택해주세요.');
      return false;
    }
    if (!spotName.trim()) {
      setValidationError('스팟 이름을 입력해주세요.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleManualSubmit = () => {
    if (validateBaseFields()) {
      onStartManual({ categories: selectedCategories, spotName });
    }
  };

  const handleImportSubmit = () => {
    if (!importUrl.trim().startsWith('https://www.visitjeju.net')) {
        setValidationError('유효한 VisitJeju.net URL을 입력해주세요.');
        return;
    }
    // Base fields are optional for import but good to have
    if (selectedCategories.length < 1 && !spotName.trim()) {
      setValidationError('URL 임포트 시에도 카테고리나 스팟 이름 중 하나는 입력하는 것을 권장합니다.');
    } else {
        setValidationError(null);
    }
    onImportFromUrl(importUrl, { categories: selectedCategories, spotName });
  };

  return (
    <Card>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">1단계: 기본 정보 입력 (필수)</h3>
          <p className="text-sm text-gray-500 mb-4">모든 스팟에 공통으로 필요한 카테고리(1개 이상)와 이름을 입력합니다.</p>
          <div className="space-y-4">
            <CheckboxGroup
              label="카테고리 선택"
              options={CATEGORIES}
              selectedOptions={selectedCategories}
              onChange={handleCategoryChange}
            />
            <Input
              label="스팟 이름"
              id="spotName"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              placeholder="예: 새별오름"
            />
          </div>
        </div>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-base font-medium text-gray-500">다음 단계 선택</span></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Option A: Manual */}
            <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">A) 수동으로 초안 작성</h3>
                <p className="text-sm text-gray-500 mb-4 flex-grow">숨은 명소와 같이 모든 정보를 직접 입력해야 할 경우, 비어있는 초안 양식을 생성하여 시작합니다.</p>
                <Button onClick={handleManualSubmit} fullWidth>
                    수동으로 초안 생성하기
                </Button>
            </div>

            {/* Option B: URL Import */}
            <div className="flex flex-col h-full">
                 <h3 className="text-lg font-semibold text-gray-800 mb-2">B) URL로 정보 가져오기</h3>
                <p className="text-sm text-gray-500 mb-4 flex-grow">알려진 장소의 경우, VisitJeju.net URL을 사용하여 기본 정보(주소, 연락처 등)를 자동으로 채웁니다.</p>
                <div className="space-y-3">
                    <Input
                        label="VisitJeju.net URL"
                        id="importUrl"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://www.visitjeju.net/..."
                    />
                    <Button onClick={handleImportSubmit} variant="secondary" fullWidth>
                        정보 가져오기
                    </Button>
                </div>
            </div>
        </div>

        {validationError && <p className="mt-4 text-sm text-red-600 text-center">{validationError}</p>}
        {error && <p className="mt-4 text-sm text-red-600 text-center">오류: {error}</p>}
        
      </div>
    </Card>
  );
};

export default InitialForm;