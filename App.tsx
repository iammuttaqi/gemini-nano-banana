
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { fileToGenerativePart } from './utils/imageUtils';
import { CameraIcon, DownloadIcon, SparklesIcon, XCircleIcon } from './components/icons';

const QUICK_PROMPTS = [
  "Professional Headshot",
  "Cinematic Look",
  "Vintage Film",
  "Improve Lighting",
  "Vibrant Colors",
  "Remove Background",
];

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("Turn this into a professional, high-quality photograph. Enhance lighting, color balance, and sharpness.");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const resetState = () => {
    setOriginalImage(null);
    setOriginalImageUrl(null);
    setEditedImageUrl(null);
    setError(null);
    setIsLoading(false);
  };

  const handleImageChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      resetState();
      setOriginalImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid image file.");
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageChange(e.target.files?.[0] || null);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleImageChange(e.dataTransfer.files?.[0] || null);
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError("Please select an image and enter a prompt.");
      return;
    }

    setIsLoading(true);
    setEditedImageUrl(null);
    setError(null);

    try {
      const imagePart = await fileToGenerativePart(originalImage);
      const result = await editImageWithPrompt(imagePart, prompt);
      
      if (result.image) {
        setEditedImageUrl(result.image);
      } else {
        setError(result.text || "The AI did not return an image. Please try a different prompt.");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);
  
  const handleQuickPrompt = (p: string) => {
      let fullPrompt = "";
      switch (p) {
          case "Professional Headshot":
              fullPrompt = "Convert this image into a professional headshot suitable for a corporate profile. Enhance lighting, sharpen features, and provide a clean, neutral background.";
              break;
          case "Cinematic Look":
              fullPrompt = "Apply a cinematic color grade to this image. Add dramatic lighting, enhance shadows and highlights, and give it a widescreen feel.";
              break;
          case "Vintage Film":
              fullPrompt = "Give this photo a vintage film look. Add grain, slightly fade the colors, and apply a color cast reminiscent of old film stock.";
              break;
          case "Improve Lighting":
              fullPrompt = "Improve the lighting in this photo. Balance the exposure, brighten up dark areas, and reduce harsh highlights for a more natural look.";
              break;
          case "Vibrant Colors":
              fullPrompt = "Make the colors in this photo more vibrant and saturated. Enhance the blues, greens, and reds to make the image pop without looking unnatural.";
              break;
          case "Remove Background":
              fullPrompt = "Carefully remove the background from this image, leaving only the main subject. Provide a transparent or neutral gray background.";
              break;
          default:
              fullPrompt = p;
      }
      setPrompt(fullPrompt);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-indigo-400" />
            AI Photo Pro
          </h1>
          <a href="https://github.com/google/genai-js" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            Powered by Gemini
          </a>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-indigo-300">1. Upload Image</h2>
              <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleFileSelect} />
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragEvents}
                onDragEnter={handleDragEvents}
                onDragLeave={handleDragEvents}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-indigo-400 bg-gray-700/50' : 'border-gray-600 hover:border-indigo-500'}`}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                  <CameraIcon className="w-12 h-12 text-gray-500 mb-4" />
                  <p className="text-center text-gray-400">
                    <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, etc.</p>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-indigo-300">2. Describe Your Edit</h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Make this look like a professional headshot..."
                className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
              />
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Or try a quick prompt:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => handleQuickPrompt(p)} className="px-3 py-1 bg-gray-700 hover:bg-indigo-600 text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !originalImage}
              className="w-full flex items-center justify-center gap-2 text-lg font-bold bg-indigo-600 text-white py-4 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enhancing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  Generate
                </>
              )}
            </button>
             {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-start gap-3">
                  <XCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
             )}
          </div>

          {/* Image Display Column */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-400 mb-2 text-center">Original</h3>
                <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center shadow-inner overflow-hidden">
                  {originalImageUrl ? (
                    <img src={originalImageUrl} alt="Original" className="w-full h-full object-contain" />
                  ) : (
                    <p className="text-gray-500">Upload an image to start</p>
                  )}
                </div>
                {originalImageUrl && <button onClick={resetState} className="mt-4 text-sm text-gray-500 hover:text-red-400 transition-colors">Clear Image</button>}
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-400 mb-2 text-center">Edited</h3>
                <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center shadow-inner relative overflow-hidden">
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                        <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-lg mt-4 text-white">AI is working its magic...</p>
                        <p className="text-sm text-gray-300">This may take a moment.</p>
                    </div>
                  )}
                  {editedImageUrl ? (
                     <>
                      <img src={editedImageUrl} alt="Edited" className="w-full h-full object-contain" />
                      <a href={editedImageUrl} download="edited-image.png" className="absolute bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110">
                        <DownloadIcon className="w-6 h-6" />
                      </a>
                     </>
                  ) : (
                    !isLoading && <p className="text-gray-500">AI-edited image will appear here</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
