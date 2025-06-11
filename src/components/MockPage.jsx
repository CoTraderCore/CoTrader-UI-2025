// components/MockPage.js
import React from 'react';
import { useDeFi } from '../context/DeFiContext';

const MockPage = ({ title, description }) => {
  const { state } = useDeFi();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className={`${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      <div className={`p-6 rounded-2xl border ${
        state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <p>This page is under construction. Content for {title.toLowerCase()} will be displayed here.</p>
      </div>
    </div>
  );
};

export default MockPage;