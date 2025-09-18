import React, { useState, useMemo } from 'react';
import type { Place } from '../types';
import { CATEGORIES, REGIONS } from '../constants';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';

interface ContentLibraryProps {
  spots: Place[];
  onAddNew: () => void;
  onEdit: (spot: Place) => void;
}

const STATUS_OPTIONS = ['draft', 'published', 'rejected', 'stub'];

const StatusBadge: React.FC<{ status: Place['status'] }> = ({ status }) => {
    const styleMap: { [key in Place['status']]: string } = {
        draft: 'bg-yellow-100 text-yellow-800',
        published: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        stub: 'bg-gray-100 text-gray-800',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styleMap[status]}`}>
            {status}
        </span>
    );
};


const ContentLibrary: React.FC<ContentLibraryProps> = ({ spots, onAddNew, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Place; direction: 'asc' | 'desc' }>({ key: 'updated_at', direction: 'desc' });

  const filteredAndSortedSpots = useMemo(() => {
    let filtered = spots;

    if (searchTerm) {
      filtered = filtered.filter(spot => 
        spot.place_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (regionFilter !== 'all') {
      filtered = filtered.filter(spot => spot.region === regionFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(spot => spot.categories?.includes(categoryFilter));
    }
    if (statusFilter !== 'all') {
        filtered = filtered.filter(spot => spot.status === statusFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (sortConfig.key === 'updated_at' || sortConfig.key === 'created_at') {
            const aTime = aVal ? (aVal as any).seconds : 0;
            const bTime = bVal ? (bVal as any).seconds : 0;
            if (aTime < bTime) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aTime > bTime) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return sorted;
  }, [spots, searchTerm, categoryFilter, statusFilter, regionFilter, sortConfig]);

  const handleSort = (key: keyof Place) => {
    setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
  
  const getSortIcon = (key: keyof Place) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'desc' ? '↓' : '↑';
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">콘텐츠 라이브러리</h2>
        <Button onClick={onAddNew}>+ 새 스팟 추가</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
         <Input
            label="이름으로 검색"
            placeholder="스팟 이름 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지역 필터</label>
            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option value="all">모든 지역</option>
                {REGIONS.map(group => (
                    <optgroup key={group.label} label={group.label}>
                        {group.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </optgroup>
                ))}
            </select>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 필터</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option value="all">모든 카테고리</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태 필터</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option value="all">모든 상태</option>
                {STATUS_OPTIONS.map(stat => <option key={stat} value={stat}>{stat}</option>)}
            </select>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('place_name')}>스팟 이름 {getSortIcon('place_name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('updated_at')}>최종 수정일 {getSortIcon('updated_at')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedSpots.length > 0 ? filteredAndSortedSpots.map(spot => (
              <tr key={spot.place_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{spot.place_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(spot.categories || []).map(cat => (
                        <span key={cat} className="mr-1 mb-1 px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">{cat}</span>
                    ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <StatusBadge status={spot.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{spot.updated_at ? new Date((spot.updated_at as any).seconds * 1000).toLocaleString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button onClick={() => onEdit(spot)} variant="secondary" size="normal">수정</Button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                        {spots.length === 0 ? "아직 등록된 스팟이 없습니다. 첫 스팟을 추가해보세요!" : "검색 조건에 맞는 스팟이 없습니다."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ContentLibrary;