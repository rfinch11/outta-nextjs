'use client';

import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/bouncing_loader.json';

interface LoaderProps {
  size?: number;
}

const Loader: React.FC<LoaderProps> = ({ size = 100 }) => {
  return (
    <div className="flex items-center justify-center">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default Loader;
