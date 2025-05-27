import React from 'react';

const Navbar = ({ currentPage, setCurrentPage }) => {
    const navItems = ["Calculator", "Timetable", "Quiz"];
    return (
        <nav className="bg-blue-600 p-4 shadow-md ">
           <div className="flex justify-between items-center flex-col ">
              <h1 className='text-white text-lg font-bold'>AI Based Student Assistant</h1>
             <ul className="flex justify-center space-x-4 md:space-x-8 ">
                {navItems.map(item => (
                    <li key={item}>
                        <button
                            onClick={() => setCurrentPage(item.toLowerCase())}
                            className={`text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 ease-in-out
                                ${currentPage === item.toLowerCase() ? 'bg-blue-700 ring-2 ring-blue-300' : 'hover:bg-blue-500'}`}
                        >
                            {item}
                        </button>
                    </li>
                ))}
            </ul>
           </div>
        </nav>
    );
};
export default Navbar;