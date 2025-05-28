import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import CgpaCalculator from './components/CgpaCalculator/CgpaCalculator';
import TimetableGenerator from './components/TimetableGenerator/TimetableGenerator';
import Quiz from './components/Quiz/Quiz';
// If you have a global CSS file, import it here:
// import './App.css'; 

function App() {
    const [currentPage, setCurrentPage] = useState('calculator'); // 'calculator', 'timetable', 'quiz'

    const renderPage = () => {
        switch (currentPage) {
            case 'calculator':
                return <CgpaCalculator />;
            case 'timetable':
                return <TimetableGenerator />;
            case 'quiz':
                return <Quiz />;
            default:
                return <CgpaCalculator />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-200 to-sky-200 font-sans">
            <header className="sticky top-0 z-50">
                 <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </header>
            <main className="container mx-auto px-2 py-6 md:py-10">
                {renderPage()}
            </main>
            <footer className="text-center py-6 text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} AI Student Assistant.Built By Sumant</p>
            </footer>
        </div>
    );
}
export default App;