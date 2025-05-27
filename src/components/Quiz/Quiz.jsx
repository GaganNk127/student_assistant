import React, { useState } from 'react';
import { callGeminiAPI } from '../../services/geminiService';

const Quiz = () => {
    const [subject, setSubject] = useState('');
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [quizState, setQuizState] = useState('setup'); // 'setup', 'playing', 'finished'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleStartQuiz = async (e) => {
        e.preventDefault();
        if (!subject.trim()) {
            setError("Please enter a subject for the quiz.");
            return;
        }
        setIsLoading(true);
        setError('');
        setQuestions([]);
        try {
            const prompt = `Generate 5 multiple-choice quiz questions on the topic of "${subject}".
            Each question MUST be an object with "question" (string), "options" (array of 4 unique strings), and "correctAnswer" (string, which MUST be one of the options).
            Return the response strictly as a JSON array of these question objects. Do not include any text before or after the JSON array.
            Example: [{"question": "What is the capital of France?", "options": ["Berlin", "Madrid", "Paris", "Rome"], "correctAnswer": "Paris"}, ...]
            `;
            const result = await callGeminiAPI(prompt, true);
            if (Array.isArray(result) && result.length > 0 && result.every(q => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer && q.options.includes(q.correctAnswer))) {
                setQuestions(result);
                setCurrentQuestionIndex(0);
                setScore(0);
                setSelectedAnswer('');
                setFeedback('');
                setQuizState('playing');
            } else {
                console.error("Invalid quiz data received:", result);
                throw new Error("Received invalid or incomplete question format from AI. Please ensure the AI returns 5 questions, each with 4 options and a correct answer that is one of the options.");
            }
        } catch (err) {
            setError(`Failed to generate quiz: ${err.message}. The AI might be busy or the subject is too niche.`);
            console.error("Quiz generation error details:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSubmit = () => {
        if (!selectedAnswer) {
            setFeedback("Please select an answer.");
            // Clear feedback after a moment if no answer was selected
            setTimeout(() => setFeedback(''), 1500);
            return;
        }
        const currentQuestion = questions[currentQuestionIndex];
        if (selectedAnswer === currentQuestion.correctAnswer) {
            setScore(prevScore => prevScore + 1);
            setFeedback("Correct!");
        } else {
            setFeedback(`Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`);
        }

        setTimeout(() => {
            setFeedback('');
            setSelectedAnswer('');
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            } else {
                setQuizState('finished');
            }
        }, 2000); // Increased delay for feedback visibility
    };
    
    const restartQuiz = () => {
        setQuizState('setup');
        setSubject('');
        setError('');
        setFeedback('');
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setScore(0);
    };

    if (isLoading) return <div className="p-4 text-center"><p className="text-xl text-teal-700">Loading Quiz...</p><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mt-4"></div></div>;
    
    if (quizState === 'setup') {
        return (
            <div className="p-4 md:p-8 bg-gray-100 rounded-xl shadow-lg max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center text-teal-700 mb-6">AI Quiz Generator</h2>
                {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error} <button onClick={() => setError('')} className="ml-2 text-xs font-semibold">(Dismiss)</button></p>}
                <form onSubmit={handleStartQuiz}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Quiz Subject:</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="e.g., Photosynthesis, World War 2"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                        Start Quiz
                    </button>
                </form>
            </div>
        );
    }

    if (quizState === 'playing' && questions.length > 0 && currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <div className="p-4 md:p-8 bg-gray-100 rounded-xl shadow-lg max-w-xl mx-auto">
                <h2 className="text-xl font-bold text-teal-700 mb-2">Quiz: {subject}</h2>
                <p className="text-sm text-gray-600 mb-4">Question {currentQuestionIndex + 1} of {questions.length} | Score: {score}</p>
                
                <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{currentQuestion.question}</h3>
                    <div className="space-y-3">
                        {(currentQuestion.options || []).map((option, index) => ( // Added fallback for options
                            <button
                                key={index}
                                onClick={() => setSelectedAnswer(option)}
                                className={`block w-full text-left p-3 border rounded-lg transition-all duration-150
                                    ${selectedAnswer === option ? 'bg-teal-500 text-white ring-2 ring-teal-300' : 'bg-gray-50 hover:bg-teal-100 border-gray-300'}
                                    ${feedback ? 'cursor-not-allowed opacity-75' : ''} 
                                `}
                                disabled={!!feedback}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {feedback && (
                    <p className={`my-3 p-2 rounded-md text-sm text-center ${feedback.startsWith("Correct") ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback}
                    </p>
                )}

                {!feedback && (
                     <button 
                        onClick={handleAnswerSubmit} 
                        disabled={!selectedAnswer}
                        className="w-full bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:bg-gray-400">
                        Submit Answer
                    </button>
                )}
                 <button onClick={restartQuiz} className="mt-4 w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                    End Quiz & Start New
                </button>
            </div>
        );
    }

    if (quizState === 'finished') {
        return (
            <div className="p-4 md:p-8 bg-gray-100 rounded-xl shadow-lg max-w-md mx-auto text-center">
                <h2 className="text-2xl font-bold text-teal-700 mb-4">Quiz Finished!</h2>
                <p className="text-xl text-gray-800 mb-6">Your final score: <strong className="text-3xl text-teal-600">{score}</strong> out of {questions.length}</p>
                <button onClick={restartQuiz} className="w-full bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                    Take Another Quiz
                </button>
            </div>
        );
    }
    // Fallback for unexpected states or if questions array is empty during 'playing'
    if (quizState === 'playing' && (questions.length === 0 || currentQuestionIndex >= questions.length)) {
        return (
             <div className="p-4 md:p-8 bg-gray-100 rounded-xl shadow-lg max-w-md mx-auto text-center">
                <h2 className="text-xl font-bold text-red-700 mb-4">Quiz Error</h2>
                <p className="text-gray-800 mb-6">An issue occurred with loading questions. Please try starting a new quiz.</p>
                <button onClick={restartQuiz} className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                    Start New Quiz
                </button>
            </div>
        );
    }

    return null;
};
export default Quiz;