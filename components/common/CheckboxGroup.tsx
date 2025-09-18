import React from 'react';

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (option: string) => void;
  className?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selectedOptions,
  onChange,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              checked={selectedOptions.includes(option)}
              onChange={() => onChange(option)}
            />
            <span className="text-sm text-gray-800">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;
