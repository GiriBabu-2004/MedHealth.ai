'use client';

import { useState } from 'react';
import { Upload, FileText, Brain, MessageCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [question, setQuestion] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setUploadComplete(false);

    try {
      // Simulated API call - replace with your actual endpoint
      const res = await fetch('http://127.0.0.1:8000/upload/', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setText(data.text);
      setAnalysis(data.analysis);
      setFollowUp('');
      setUploadComplete(true);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setLoading(false);
  };

  const askFollowUp = async () => {
    if (!question || !text) return;
    setLoading(true);

    const prompt = `The user uploaded this medicine content:\n${text}\nNow they ask: ${question}\nGive a clear medical answer.`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please check your environment variables.');
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      };

      console.log('Making request to Gemini API...');
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }

      const data = await res.json();
      console.log('Response data:', data);
      
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
      setFollowUp(reply);
    } catch (err) {
      console.error('Follow-up error:', err);
      alert('Follow-up failed: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Reset states when new file is selected
    setText('');
    setAnalysis('');
    setFollowUp('');
    setUploadComplete(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <span className="text-5xl">🩺</span>
            Medicine OCR Assistant
          </h1>
          <p className="text-gray-600 text-lg">Upload medical documents and get AI-powered analysis</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Upload Document</h2>
          </div>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="text-gray-400" size={48} />
                <p className="text-gray-600">
                  {file ? file.name : 'Click to select a file or drag and drop'}
                </p>
                <p className="text-sm text-gray-400">Supports images and PDF files</p>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {text && (
          <div className="space-y-6">
            {/* Extracted Text */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-green-600" size={24} />
                <h3 className="text-xl font-semibold text-gray-800">Extracted Text</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{text}</pre>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="text-purple-600" size={24} />
                <h3 className="text-xl font-semibold text-gray-800">AI Analysis</h3>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-gray-700 whitespace-pre-wrap">{analysis}</div>
              </div>
            </div>

            {/* Follow-up Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="text-orange-600" size={24} />
                <h3 className="text-xl font-semibold text-gray-800">Ask Follow-up Questions</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., Can I take this with food? What are the side effects?"
                    disabled={!uploadComplete}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={askFollowUp}
                    disabled={!uploadComplete || !question.trim() || loading}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <MessageCircle size={16} />
                    )}
                    Ask
                  </button>
                </div>

                {!uploadComplete && (
                  <p className="text-sm text-gray-500 italic">
                    Complete the upload and analysis first to ask follow-up questions
                  </p>
                )}
              </div>

              {followUp && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Brain className="text-blue-600" size={20} />
                    AI Response:
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-gray-700 whitespace-pre-wrap">{followUp}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}