import React, { useState } from 'react';

interface Damage {
  id: string;
  type: 'A' | 'R' | 'T' | 'Q' | 'F';
  x: number;
  y: number;
  description?: string;
}

interface CarDamageMapProps {
  damages: Damage[];
  onDamageAdd: (damage: Omit<Damage, 'id'>) => void;
  onDamageRemove: (id: string) => void;
  selectedDamageType: 'A' | 'R' | 'T' | 'Q' | 'F';
}

const damageTypes = {
  'A': { label: 'Amassado', color: '#f59e0b', bgColor: '#fef3c7' },
  'R': { label: 'Risco', color: '#ef4444', bgColor: '#fee2e2' },
  'T': { label: 'Trincado', color: '#8b5cf6', bgColor: '#ede9fe' },
  'Q': { label: 'Quebrado', color: '#dc2626', bgColor: '#fecaca' },
  'F': { label: 'Falta', color: '#6b7280', bgColor: '#f3f4f6' }
};

const CarDamageMap: React.FC<CarDamageMapProps> = ({
  damages,
  onDamageAdd,
  onDamageRemove,
  selectedDamageType
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleCarClick = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newDamage: Omit<Damage, 'id'> = {
      type: selectedDamageType,
      x,
      y
    };

    onDamageAdd(newDamage);
  };

  return (
    <div className="relative">
      <svg
        viewBox="0 0 400 200"
        className="w-full h-64 border border-gray-300 dark:border-gray-600 rounded-lg cursor-crosshair bg-gray-50 dark:bg-gray-700"
        onClick={handleCarClick}
      >
        {/* Car outline - simplified top view */}
        <g fill="none" stroke="#374151" strokeWidth="2">
          {/* Main body */}
          <rect x="100" y="40" width="200" height="120" rx="20" fill="#e5e7eb" />
          
          {/* Windshield */}
          <rect x="110" y="50" width="180" height="30" rx="5" fill="#bfdbfe" />
          
          {/* Rear window */}
          <rect x="110" y="120" width="180" height="30" rx="5" fill="#bfdbfe" />
          
          {/* Doors */}
          <line x1="100" y1="80" x2="300" y2="80" stroke="#9ca3af" strokeWidth="1" />
          <line x1="150" y1="40" x2="150" y2="160" stroke="#9ca3af" strokeWidth="1" />
          <line x1="200" y1="40" x2="200" y2="160" stroke="#9ca3af" strokeWidth="1" />
          <line x1="250" y1="40" x2="250" y2="160" stroke="#9ca3af" strokeWidth="1" />
          
          {/* Wheels */}
          <circle cx="120" cy="30" r="8" fill="#374151" />
          <circle cx="280" cy="30" r="8" fill="#374151" />
          <circle cx="120" cy="170" r="8" fill="#374151" />
          <circle cx="280" cy="170" r="8" fill="#374151" />
          
          {/* Headlights */}
          <circle cx="200" cy="25" r="6" fill="#fbbf24" />
          
          {/* Taillights */}
          <circle cx="180" cy="175" r="4" fill="#ef4444" />
          <circle cx="220" cy="175" r="4" fill="#ef4444" />
        </g>

        {/* Damage markers */}
        {damages.map((damage) => (
          <g key={damage.id}>
            <circle
              cx={(damage.x / 100) * 400}
              cy={(damage.y / 100) * 200}
              r="8"
              fill={damageTypes[damage.type].color}
              stroke="#fff"
              strokeWidth="2"
              className="cursor-pointer hover:r-10 transition-all"
              onMouseEnter={() => setShowTooltip(damage.id)}
              onMouseLeave={() => setShowTooltip(null)}
              onClick={(e) => {
                e.stopPropagation();
                onDamageRemove(damage.id);
              }}
            />
            <text
              x={(damage.x / 100) * 400}
              y={(damage.y / 100) * 200 + 4}
              textAnchor="middle"
              className="text-xs font-bold fill-white pointer-events-none"
            >
              {damage.type}
            </text>
            
            {/* Tooltip */}
            {showTooltip === damage.id && (
              <g>
                <rect
                  x={(damage.x / 100) * 400 - 30}
                  y={(damage.y / 100) * 200 - 35}
                  width="60"
                  height="20"
                  rx="4"
                  fill="#1f2937"
                  opacity="0.9"
                />
                <text
                  x={(damage.x / 100) * 400}
                  y={(damage.y / 100) * 200 - 22}
                  textAnchor="middle"
                  className="text-xs fill-white"
                >
                  {damageTypes[damage.type].label}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Instructions */}
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <p>Clique no diagrama para adicionar uma avaria do tipo <strong>{damageTypes[selectedDamageType].label}</strong></p>
        <p>Clique em uma avaria existente para removê-la</p>
      </div>
    </div>
  );
};

export default CarDamageMap;