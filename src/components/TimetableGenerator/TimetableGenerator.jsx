import React, { useState } from 'react';
import { callGeminiAPI } from '../../services/geminiService';

const InputField = ({ label, type, value, onChange, placeholder, isTextArea = false }) => (
     <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">{label}:</label>
        {isTextArea ? (
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows="3"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                required={type !== 'textarea' && type !== 'time'} // Time inputs might not always be required by default
            />
        )}
    </div>
);

const TimetableGenerator = () => {
    const [subjects, setSubjects] = useState('');
    const [collegeStartTime, setCollegeStartTime] = useState('09:00');
    const [collegeEndTime, setCollegeEndTime] = useState('17:00');
    const [preferences, setPreferences] = useState('');
    const [timetable, setTimetable] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateTimetable = async (e) => {
        e.preventDefault();
        if (!subjects.trim()) {
            setError("Please enter at least one subject.");
            return;
        }
         if (!collegeStartTime || !collegeEndTime) {
            setError("Please set valid start and end times for college.");
            return;
        }
        setIsLoading(true);
        setError('');
        setTimetable(null);
        try {
            const prompt = `Generate a 5-day weekly study timetable (Monday to Friday) based on the following. Return the timetable as a JSON object.
            The top-level keys should be days of the week (e.g., "Monday", "Tuesday", "Wednesday", "Thursday", "Friday").
            The value for each day should be an array of schedule items.
            Each schedule item MUST be an object with "time" (string, e.g., "09:00 - 10:00") and "activity" (string, e.g., "Subject Name", "Lunch Break", "Self-study: Subject Name").
            Prioritize scheduling the listed subjects. Include breaks (e.g., a lunch break). If preferences mention specific timings for breaks or subjects, try to adhere to them.
            Ensure activities cover the college duration from ${collegeStartTime} to ${collegeEndTime}.
            Allocate time for all subjects: ${subjects}.
            Preferences: ${preferences || 'None'}.
            Example for one day: "Monday": [{"time": "09:00 - 10:00", "activity": "Physics Lecture"}, {"time": "10:00 - 10:15", "activity": "Short Break"}, {"time": "10:15 - 11:15", "activity": "Maths Problem Solving"} ... ]
            The response MUST be a valid JSON object. Do not include any explanatory text before or after the JSON object.
            `;
            const result = await callGeminiAPI(prompt, true);
            
            // Validate timetable structure
            if (typeof result === 'object' && result !== null && Object.keys(result).length > 0) {
                 let isValidStructure = true;
                 for (const daySchedule of Object.values(result)) {
                    if (!Array.isArray(daySchedule) || !daySchedule.every(item => typeof item === 'object' && item !== null && 'time' in item && 'activity' in item)) {
                        isValidStructure = false;
                        break;
                    }
                 }
                 if (isValidStructure) {
                    setTimetable(result);
                 } else {
                    throw new Error("AI returned an invalid timetable structure. Expected days with arrays of {time, activity} objects.");
                 }
            } else {
                 throw new Error("AI returned an empty or invalid timetable object.");
            }

        } catch (err) {
            setError(`Failed to generate timetable: ${err.message}. The AI might be busy or the request is too complex. Try simplifying preferences or subjects.`);
            console.error("Timetable generation error details:", err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8 bg-gray-100 rounded-xl shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-purple-700 mb-6">AI Timetable Generator</h2>
            <form onSubmit={handleGenerateTimetable} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <InputField label="Subjects (comma-separated)" type="text" value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="e.g., Maths, Physics, Chemistry Lab" />
                    <InputField label="Study Start Time" type="time" value={collegeStartTime} onChange={e => setCollegeStartTime(e.target.value)} />
                </div>
                <div>
                    <InputField label="study End Time" type="time" value={collegeEndTime} onChange={e => setCollegeEndTime(e.target.value)} />
                    <InputField label="Preferences (optional)" isTextArea={true} value={preferences} onChange={e => setPreferences(e.target.value)} placeholder="e.g., Prefer difficult subjects in morning, 1 hour lunch around 1 PM" />
                </div>
                <div className="md:col-span-2 text-center">
                    <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:bg-gray-400">
                        {isLoading ? 'Generating Timetable...' : 'Generate AI Timetable'}
                    </button>
                </div>
            </form>

            {error && <p className="my-4 text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}

            {timetable && (
                <div className="mt-6 overflow-x-auto">
                    <h3 className="text-xl font-semibold text-purple-800 mb-4">Generated Timetable:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(timetable).map(([day, scheduleItems]) => (
                            <div key={day} className="bg-white p-4 rounded-lg shadow min-w-[200px]"> {/* Added min-width */}
                                <h4 className="text-lg font-bold text-purple-700 mb-2 border-b pb-1 capitalize">{day}</h4>
                                {Array.isArray(scheduleItems) && scheduleItems.length > 0 ? (
                                    <ul className="space-y-2">
                                        {scheduleItems.map((item, index) => (
                                            <li key={index} className="text-sm p-2 bg-purple-50 rounded">
                                                <strong className="block text-purple-600">{item.time || "N/A"}</strong>
                                                <span className="text-gray-700">{item.activity || "N/A"}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No schedule available for {day} or invalid format.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default TimetableGenerator;