import React, { useState } from 'react';
import { callGeminiAPI } from '../../services/geminiService';

const InputField = ({ label, type, value, onChange, placeholder, step }) => (
    <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">{label}:</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
        />
    </div>
);

const CgpaCalculator = () => {
    const [currentCgpa, setCurrentCgpa] = useState('');
    const [totalCredits, setTotalCredits] = useState('');
    const [nextSemCredits, setNextSemCredits] = useState('');
    const [targetCgpa, setTargetCgpa] = useState('');
    const [requiredSgpa, setRequiredSgpa] = useState(null);
    const [advice, setAdvice] = useState('');
    const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
    const [error, setError] = useState('');

    const handleCalculateSgpa = (e) => {
        e.preventDefault();
        setError('');
        setAdvice('');
        setRequiredSgpa(null);

        const numCurrentCgpa = parseFloat(currentCgpa);
        const numTotalCredits = parseInt(totalCredits);
        const numNextSemCredits = parseInt(nextSemCredits);
        const numTargetCgpa = parseFloat(targetCgpa);

        if (isNaN(numCurrentCgpa) || isNaN(numTotalCredits) || isNaN(numNextSemCredits) || isNaN(numTargetCgpa) ||
            numCurrentCgpa < 0 || numCurrentCgpa > 10 || numTotalCredits <= 0 || numNextSemCredits <= 0 ||
            numTargetCgpa < 0 || numTargetCgpa > 10) {
            setError("Please enter valid positive numbers. CGPA should be between 0 and 10, and credits must be positive.");
            return;
        }

        const neededTotalGradePoints = numTargetCgpa * (numTotalCredits + numNextSemCredits);
        const currentTotalGradePoints = numCurrentCgpa * numTotalCredits;
        const nextSemGradePoints = neededTotalGradePoints - currentTotalGradePoints;
        
        if (numNextSemCredits === 0) { // Avoid division by zero
            setError("Next semester credits cannot be zero.");
            return;
        }
        const calculatedSgpa = nextSemGradePoints / numNextSemCredits;

        setRequiredSgpa(calculatedSgpa.toFixed(2));

        if (calculatedSgpa > 10) {
            setError("Achieving this target CGPA is mathematically very challenging (Required SGPA > 10). Consider revising your target or discussing with an academic advisor.");
        } else if (calculatedSgpa < 0) {
             setError("The target CGPA is lower than what can be achieved even with 0 SGPA next semester. You might have already surpassed your target or there's an input error.");
        }
    };

    const handleGetAdvice = async () => {
        if (requiredSgpa === null) { // Check for null specifically
            setError("Please calculate SGPA first to get advice.");
            return;
        }
        setIsLoadingAdvice(true);
        setAdvice('');
        // Keep existing error if it's from calculation, or clear for new API attempt
        // setError(''); 
        try {
            const prompt = `I am a student with a current CGPA of ${currentCgpa} over ${totalCredits} credits. My target CGPA is ${targetCgpa}. For my next semester of ${nextSemCredits} credits, I need to score an SGPA of ${requiredSgpa}. Please provide concise, actionable study advice and motivational tips (max 3-4 bullet points) to help me achieve this. If the required SGPA is above 10, acknowledge the difficulty. If it's below 0, suggest checking inputs or acknowledge they are well on track.`;
            const result = await callGeminiAPI(prompt);
            setAdvice(result);
        } catch (err) {
            setError(`Failed to get advice from AI: ${err.message}. Please try again.`);
        } finally {
            setIsLoadingAdvice(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8 bg-gray-100 rounded-xl shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">SGPA Calculator & Advisor</h2>
            <form onSubmit={handleCalculateSgpa}>
                <InputField label="Current CGPA (0-10)" type="number" step="0.01" value={currentCgpa} onChange={e => setCurrentCgpa(e.target.value)} placeholder="e.g., 7.5" />
                <InputField label="Total Credits Completed" type="number" value={totalCredits} onChange={e => setTotalCredits(e.target.value)} placeholder="e.g., 90" />
                <InputField label="Next Semester Credits" type="number" value={nextSemCredits} onChange={e => setNextSemCredits(e.target.value)} placeholder="e.g., 20" />
                <InputField label="Target CGPA (0-10)" type="number" step="0.01" value={targetCgpa} onChange={e => setTargetCgpa(e.target.value)} placeholder="e.g., 8.0" />
                <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                    Calculate Required SGPA
                </button>
            </form>

            {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
            
            {requiredSgpa !== null && (
                <div className="mt-6 p-4 bg-green-100 rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-green-800">Result:</h3>
                    <p className="text-lg text-green-700">You need to score an SGPA of <strong className="text-2xl">{requiredSgpa}</strong> in the next semester.</p>
                    <button onClick={handleGetAdvice} disabled={isLoadingAdvice} className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:bg-gray-400">
                        {isLoadingAdvice ? 'Getting Advice...' : 'Get AI Study Advice'}
                    </button>
                </div>
            )}

            {advice && (
                <div className="mt-6 p-4 bg-yellow-100 rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-yellow-800">AI Study Advice:</h3>
                    <div className="text-yellow-700 whitespace-pre-wrap">
                        {advice.split('\n').map((line, index) => (
                            <p key={index} className="mb-1">{line.startsWith('* ') || line.startsWith('- ') ? `• ${line.substring(2)}` : line}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default CgpaCalculator;