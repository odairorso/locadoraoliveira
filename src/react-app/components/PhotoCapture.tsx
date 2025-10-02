import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Eye } from 'lucide-react';

interface Photo {
  id: string;
  file: File;
  preview: string;
  description?: string;
}

interface PhotoCaptureProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/') && photos.length < maxPhotos) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: Photo = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target?.result as string
          };
          onPhotosChange([...photos, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const preview = canvas.toDataURL('image/jpeg');
            
            const newPhoto: Photo = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              file,
              preview
            };
            
            onPhotosChange([...photos, newPhoto]);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const removePhoto = (id: string) => {
    onPhotosChange(photos.filter(photo => photo.id !== id));
  };

  const updatePhotoDescription = (id: string, description: string) => {
    onPhotosChange(photos.map(photo => 
      photo.id === id ? { ...photo, description } : photo
    ));
  };

  return (
    <div className="space-y-4">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Capturar Foto</h3>
              <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex justify-center mt-4">
              <button
                onClick={capturePhoto}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center"
              >
                <Camera className="mr-2" size={20} />
                Capturar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Visualizar Foto</h3>
              <button onClick={() => setSelectedPhoto(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <img
              src={selectedPhoto.preview}
              alt="Foto da vistoria"
              className="w-full rounded-lg mb-4"
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">Descrição:</label>
              <textarea
                value={selectedPhoto.description || ''}
                onChange={(e) => updatePhotoDescription(selectedPhoto.id, e.target.value)}
                placeholder="Adicione uma descrição para esta foto..."
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Upload className="mr-2" size={20} />
          Upload Foto
        </button>
        
        <button
          type="button"
          onClick={startCamera}
          disabled={photos.length >= maxPhotos}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Camera className="mr-2" size={20} />
          Tirar Foto
        </button>
        
        <span className="text-sm text-gray-500 self-center">
          {photos.length}/{maxPhotos} fotos
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.preview}
                alt="Foto da vistoria"
                className="w-full h-32 object-cover rounded-lg cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />
              
              {/* Overlay with controls */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  onClick={() => setSelectedPhoto(photo)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full mr-2"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Description indicator */}
              {photo.description && (
                <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                  📝
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;